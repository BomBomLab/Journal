// Journal — unified warm-paper prototype
// All three views (Daily / Weekly / Monthly) share a single token system.

const { useState, useMemo, useEffect } = React;
const MOBILE_BREAKPOINT = 860;
const JOURNAL_LOCATION = {
  name: 'Shenzhen',
  latitude: 22.5431,
  longitude: 114.0579,
  timezone: 'Asia/Shanghai',
};

// ─────────────────────────── Theme definitions ───────────────────────────
// Each palette keeps the SAME structural tokens — only values change.
// All values in oklch; chroma stays very low for a "whisper" feel.
const THEMES = {
  "Warm Paper": {
    '--paper':       'oklch(0.970 0.012 75)',
    '--paper-2':     'oklch(0.988 0.008 80)',
    '--paper-edge':  'oklch(0.945 0.014 70)',
    '--ink':         'oklch(0.305 0.018 55)',
    '--ink-2':       'oklch(0.480 0.014 58)',
    '--ink-3':       'oklch(0.680 0.012 62)',
    '--ink-4':       'oklch(0.820 0.010 68)',
    '--rule':        'oklch(0.880 0.014 65)',
    '--rule-soft':   'oklch(0.935 0.012 70)',
    '--accent':      'oklch(0.660 0.070 42)',
    '--accent-ink':  'oklch(0.520 0.080 40)',
    '--accent-wash': 'oklch(0.955 0.022 50)',
    '--accent-dot':  'oklch(0.880 0.040 48)',
  },
  "Bone + Sepia": {
    '--paper':       'oklch(0.975 0.006 90)',
    '--paper-2':     'oklch(0.992 0.004 90)',
    '--paper-edge':  'oklch(0.950 0.008 88)',
    '--ink':         'oklch(0.285 0.020 60)',
    '--ink-2':       'oklch(0.460 0.016 60)',
    '--ink-3':       'oklch(0.660 0.012 65)',
    '--ink-4':       'oklch(0.810 0.008 70)',
    '--rule':        'oklch(0.870 0.010 70)',
    '--rule-soft':   'oklch(0.930 0.008 75)',
    '--accent':      'oklch(0.600 0.060 55)',
    '--accent-ink':  'oklch(0.460 0.070 50)',
    '--accent-wash': 'oklch(0.950 0.018 65)',
    '--accent-dot':  'oklch(0.870 0.035 55)',
  },
  "Aged Linen": {
    '--paper':       'oklch(0.955 0.020 68)',
    '--paper-2':     'oklch(0.975 0.015 72)',
    '--paper-edge':  'oklch(0.925 0.022 64)',
    '--ink':         'oklch(0.310 0.022 45)',
    '--ink-2':       'oklch(0.490 0.018 48)',
    '--ink-3':       'oklch(0.690 0.015 55)',
    '--ink-4':       'oklch(0.820 0.014 60)',
    '--rule':        'oklch(0.870 0.020 58)',
    '--rule-soft':   'oklch(0.920 0.018 62)',
    '--accent':      'oklch(0.640 0.080 35)',
    '--accent-ink':  'oklch(0.500 0.090 32)',
    '--accent-wash': 'oklch(0.935 0.032 42)',
    '--accent-dot':  'oklch(0.860 0.050 40)',
  },
};

const ACCENT_DENSITY = {
  whisper:   { washAlpha: 0.55, chipOpacity: 0.85 },
  muted:     { washAlpha: 0.85, chipOpacity: 1.00 },
  confident: { washAlpha: 1.00, chipOpacity: 1.00 },
};

// ─────────────────────────── Icons (inline SVG) ───────────────────────────
const Chevron = ({dir='left', size=16}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left'
      ? <polyline points="15 18 9 12 15 6" />
      : <polyline points="9 18 15 12 9 6" />}
  </svg>
);
const Plus = ({size=12}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

// ─────────────────────────── Data ───────────────────────────
const DOW_LABELS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const getIsMobileViewport = () => (
  typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
);

// Pick a single "anchor" event title to summarize a day:
// the longest event that is not rest (sleep), travel, or life.hygiene.
const summarizeDay = (events) => {
  if (!events || !events.length) return '';
  const candidates = events
    .filter(e => e.categoryId !== 'rest')
    .filter(e => !(e.subcategoryId || '').startsWith('life.hygiene'))
    .slice()
    .sort((a, b) => (b.endHour - b.startHour) - (a.endHour - a.startHour));
  return (candidates[0] || events[0]).title;
};

const DATA = window.JOURNAL_DATA;
const QUERY_PARAMS = new URLSearchParams(window.location.search);
const ALL_DATE_KEYS = (() => {
  const keys = new Set([
    ...Object.keys((DATA && DATA.eventsByDay) || {}),
    ...Object.keys((DATA && DATA.DIARY_SUMMARY_BY_DAY) || {}),
    ...Object.keys((DATA && DATA.TODO_BY_DAY) || {}),
  ]);
  return Array.from(keys).sort();
})();
const TODAY_KEY = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
})();
const DEFAULT_LANDING_KEY = '2026-04-25';
const isSampleData = Boolean(DATA && DATA.__isSample);
const REQUESTED_DATE_KEY = (() => {
  const value = QUERY_PARAMS.get('date');
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && ALL_DATE_KEYS.includes(value) ? value : '';
})();
const INITIAL_VIEW = (() => {
  const value = QUERY_PARAMS.get('view');
  return ['daily', 'weekly', 'monthly'].includes(value) ? value : 'daily';
})();
const INITIAL_CURSOR_KEY = (() => {
  // Sample mode is the public Pages preview: always start on the curated 2026-04-25 day.
  // Runtime mode is real local data: honor explicit dates first, then today/latest.
  if (isSampleData && ALL_DATE_KEYS.includes(DEFAULT_LANDING_KEY)) return DEFAULT_LANDING_KEY;
  if (REQUESTED_DATE_KEY) return REQUESTED_DATE_KEY;
  if (ALL_DATE_KEYS.includes(TODAY_KEY)) return TODAY_KEY;
  return ALL_DATE_KEYS[ALL_DATE_KEYS.length - 1] || TODAY_KEY;
})();
const parseDateKey = (dateKey) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const formatDateKey = (date) => (
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
);

const addDays = (dateKey, days) => {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
};

const addMonths = (dateKey, delta) => {
  const date = parseDateKey(dateKey);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + delta);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return formatDateKey(date);
};

const formatDisplayDate = (dateKey, options) => (
  parseDateKey(dateKey).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' })
);

const getOrdinal = (n) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  const mod10 = n % 10;
  if (mod10 === 1) return 'st';
  if (mod10 === 2) return 'nd';
  if (mod10 === 3) return 'rd';
  return 'th';
};

const getWeekStartKey = (dateKey) => {
  const date = parseDateKey(dateKey);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(dateKey, diff);
};

const getWeekDateKeys = (dateKey) => {
  const startKey = getWeekStartKey(dateKey);
  return Array.from({ length: 7 }, (_, index) => addDays(startKey, index));
};

const getDateMeta = (dateKey) => {
  const date = parseDateKey(dateKey);
  return {
    key: dateKey,
    date,
    dayNumber: date.getUTCDate(),
    dayLabel: DOW_LABELS[date.getUTCDay()],
    monthLabel: formatDisplayDate(dateKey, { month: 'short' }).toLowerCase(),
  };
};

const getDayTodos = (dateKey, limit = 6) => {
  if (DATA && DATA.journal && DATA.journal.day && DATA.journal.day[dateKey]) {
    const tasks = DATA.journal.day[dateKey].tasks || [];
    return Array.from({ length: limit }, (_, index) => tasks[index] || { text: '', done: false });
  }
  const todos = ((DATA && DATA.TODO_BY_DAY[dateKey]) || []).filter((item) => item.status !== 'dropped');
  return Array.from({ length: limit }, (_, index) => {
    const item = todos[index];
    return { text: item ? item.text : '', done: item ? item.status === 'done' : false };
  });
};

const getWeekTodos = (dateKeys, limit = 6) => {
  const weekKey = dateKeys[0];
  if (DATA && DATA.journal && DATA.journal.week && DATA.journal.week[weekKey]) {
    const tasks = DATA.journal.week[weekKey].tasks || [];
    return Array.from({ length: limit }, (_, index) => tasks[index] || { text: '', done: false });
  }
  const merged = [];
  const seen = new Set();
  dateKeys.forEach((dateKey) => {
    (((DATA && DATA.TODO_BY_DAY[dateKey]) || []).filter((item) => item.status !== 'dropped')).forEach((item) => {
      if (seen.has(item.text)) return;
      seen.add(item.text);
      merged.push({ text: item.text, done: item.status === 'done' });
    });
  });
  return Array.from({ length: limit }, (_, index) => merged[index] || { text: '', done: false });
};

const getWeekData = (dateKey) => {
  const todayKey = TODAY_KEY;
  const weekKey = getWeekStartKey(dateKey);
  if (DATA && DATA.journal && DATA.journal.week && DATA.journal.week[weekKey]) {
    return (DATA.journal.week[weekKey].days || []).map((day) => ({
      dateKey: day.dateKey,
      date: day.dayNumber,
      day: String(day.weekday || '').toLowerCase(),
      month: formatDisplayDate(day.dateKey, { month: 'short' }).toLowerCase(),
      events: day.events || [],
      tasks: day.metrics ? day.metrics.eventCount : (day.events || []).length,
      isToday: day.dateKey === todayKey,
    }));
  }
  return getWeekDateKeys(dateKey).map((dk) => {
    const meta = getDateMeta(dk);
    const events = (DATA && DATA.eventsByDay[dk]) || [];
    return {
      dateKey: dk,
      date: meta.dayNumber,
      day: meta.dayLabel,
      month: meta.monthLabel,
      events,
      tasks: events.length,
      isToday: dk === todayKey,
    };
  });
};

const getWeekNotes = (dateKeys) => {
  const weekKey = dateKeys[0];
  if (DATA && DATA.journal && DATA.journal.week && DATA.journal.week[weekKey]) {
    return (DATA.journal.week[weekKey].notes || []).map((note) => ({
      ...note,
      text: toSingleLineSentence(note.text),
    })).filter((note) => note.text);
  }
  return dateKeys
    .map((dateKey) => {
      const summary = (DATA && DATA.DIARY_SUMMARY_BY_DAY[dateKey]) || '';
      const text = summary
        ? toSingleLineSentence(summary)
        : toSingleLineSentence(summarizeDay((DATA && DATA.eventsByDay[dateKey]) || []));
      return { dateKey, text };
    })
    .filter((item) => item.text);
};

const getWeeklyReflection = (dateKeys) => {
  const weekKey = dateKeys[0];
  if (DATA && DATA.journal && DATA.journal.week && DATA.journal.week[weekKey]) {
    // Use the last day's summary as reflection to avoid duplicating weekNotes entries
    const days = DATA.journal.week[weekKey].days || [];
    const lastSummary = days.slice().reverse()
      .map(d => toSingleLineSentence(d.summaryText))
      .find(Boolean);
    return lastSummary || 'No recorded rhythm for this week yet.';
  }
  const categoryTotals = {};
  let longestEvent = null;
  dateKeys.forEach((dateKey) => {
    ((DATA && DATA.eventsByDay[dateKey]) || []).forEach((event) => {
      const duration = event.endHour - event.startHour;
      categoryTotals[event.categoryId] = (categoryTotals[event.categoryId] || 0) + duration;
      if (!longestEvent || duration > (longestEvent.endHour - longestEvent.startHour)) {
        longestEvent = event;
      }
    });
  });
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => (DATA && DATA.CATEGORY_PALETTE[id] && DATA.CATEGORY_PALETTE[id].label) || id.toUpperCase());
  if (!topCategories.length) return 'No recorded rhythm for this week yet.';
  if (!longestEvent) return `${topCategories.join(' and ')} set the pace for this week.`;
  return `${topCategories.join(' and ')} set the pace this week, with "${longestEvent.title}" taking the longest single stretch.`;
};

const getMonthLabel = (dateKey) => formatDisplayDate(dateKey, { month: 'long' });

const getDaySummaryText = (dateKey) => (
  ((DATA && DATA.journal && DATA.journal.day && DATA.journal.day[dateKey] && DATA.journal.day[dateKey].summary && DATA.journal.day[dateKey].summary.body)
    || (DATA && DATA.DIARY_SUMMARY_BY_DAY[dateKey])
    || '')
);

const toSingleLineSentence = (text) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const match = normalized.match(/.+?[.!?。！？](?=\s|$)/);
  return (match ? match[0] : normalized).trim();
};

const getLatestMonthSummaryLine = (dateKey) => {
  const monthKey = dateKey.slice(0, 7);
  const monthEntry = DATA && DATA.journal && DATA.journal.month && DATA.journal.month[monthKey];
  if (monthEntry && Array.isArray(monthEntry.days)) {
    const latest = monthEntry.days
      .slice()
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .reverse()
      .map((day) => toSingleLineSentence(day.summaryText))
      .find(Boolean);
    if (latest) return latest;
  }
  return '';
};

const getISOWeek = (dateKey) => {
  const date = parseDateKey(dateKey);
  const dayNum = date.getUTCDay() || 7;
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 4 - dayNum));
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7),
    year: thursday.getUTCFullYear(),
  };
};
const getWeekNumber = (dateKey) => getISOWeek(dateKey).week;

const buildMonthlyCells = (dateKey) => {
  const active = parseDateKey(dateKey);
  const year = active.getUTCFullYear();
  const monthIndex = active.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const leading = (firstDay.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;
  const gridStart = new Date(Date.UTC(year, monthIndex, 1 - leading));
  const monthKey = dateKey.slice(0, 7);
  if (DATA && DATA.journal && DATA.journal.month && DATA.journal.month[monthKey]) {
    const monthDays = new Map((DATA.journal.month[monthKey].days || []).map((day) => [day.dateKey, day]));
    return Array.from({ length: totalCells }, (_, index) => {
      const cellDate = new Date(gridStart.getTime() + index * 86400000);
      const cellKey = formatDateKey(cellDate);
      const dayEntry = monthDays.get(cellKey);
      return {
        key: cellKey,
        n: cellDate.getUTCDate(),
        muted: cellDate.getUTCMonth() !== monthIndex,
        events: dayEntry ? (dayEntry.events || []) : [],
        cats: dayEntry ? (dayEntry.categories || []) : [],
        isToday: cellKey === TODAY_KEY,
      };
    });
  }
  const todayMeta = getDateMeta(TODAY_KEY);

  return Array.from({ length: totalCells }, (_, index) => {
    const cellDate = new Date(gridStart.getTime() + index * 86400000);
    const cellKey = formatDateKey(cellDate);
    const events = (DATA && DATA.eventsByDay[cellKey]) || [];
    const totals = {};
    events.forEach((event) => {
      totals[event.categoryId] = (totals[event.categoryId] || 0) + (event.endHour - event.startHour);
    });
    const cats = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([id]) => id);
    return {
      key: cellKey,
      n: cellDate.getUTCDate(),
      muted: cellDate.getUTCMonth() !== monthIndex,
      events,
      cats,
      isToday: cellKey === todayMeta.key,
    };
  });
};

// ─────────────────────────── Small building blocks ───────────────────────────
const Eyebrow = ({ children, rule = true, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...(style||{}) }}>
    <span className="eyebrow">{children}</span>
    {rule && <hr className="divider-rule" />}
  </div>
);

const Tick = ({ on, onClick }) => (
  <span
    className="tick"
    data-on={on ? 'true' : 'false'}
    onClick={onClick || undefined}
    role={onClick ? 'checkbox' : undefined}
    aria-checked={onClick ? on : undefined}
    tabIndex={onClick ? 0 : undefined}
    style={onClick ? undefined : { opacity: 0.45, cursor: 'default' }}
  />
);

const TODO_TEXT_STYLE = {
  fontFamily: "'Cormorant Garamond', 'Garamond', serif",
  fontSize: 12,
  lineHeight: 1.4,
  fontStyle: 'italic',
};

const EVENT_BLOCK_GAP_PX = 2;
const formatHourLabel = (value) => {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = ((h + 11) % 12) + 1;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
};
const softenEventFill = (fill) => `color-mix(in oklch, ${fill} 78%, white)`;
const WEATHER_CODE_LABELS = {
  0: 'clear',
  1: 'mostly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'foggy',
  48: 'icy fog',
  51: 'light drizzle',
  53: 'drizzle',
  55: 'dense drizzle',
  61: 'light rain',
  63: 'rain',
  65: 'heavy rain',
  66: 'freezing rain',
  67: 'heavy freezing rain',
  71: 'light snow',
  73: 'snow',
  75: 'heavy snow',
  77: 'snow grains',
  80: 'rain showers',
  81: 'showers',
  82: 'heavy showers',
  85: 'snow showers',
  86: 'heavy snow showers',
  95: 'thunderstorm',
  96: 'storm + hail',
  99: 'severe storm',
};
const WEATHER_CACHE = new Map();

const MOOD_KEYWORDS = [
  { words: ['hopeful', 'warm', 'light', 'lighter', 'alive', 'soft', 'vivid', 'playful', 'steady', 'funny', 'win'], score: 1, labels: ['hopeful', 'light'] },
  { words: ['restless', 'drift', 'floaty', 'tired', 'late', 'fatigued', 'underpowered'], score: -1, labels: ['tired', 'drifty'] },
  { words: ['risk', 'stuck', 'staying awake', 'unresolved', 'drag', 'heavy', 'hard'], score: -1, labels: ['heavy', 'uneasy'] },
  { words: ['reset', 'gentle', 'calm', 'clear', 'grounded'], score: 1, labels: ['calm', 'steady'] },
];

const deriveMoodFromSummary = (summaryText) => {
  const text = String(summaryText || '').toLowerCase();
  if (!text) return { rating: 3, labels: ['quiet', 'unclear'] };
  let score = 0;
  let labels = [];
  MOOD_KEYWORDS.forEach((entry) => {
    if (entry.words.some((word) => text.includes(word))) {
      score += entry.score;
      labels = labels.concat(entry.labels);
    }
  });
  const uniqueLabels = Array.from(new Set(labels));
  const rating = Math.max(1, Math.min(5, 3 + score));
  const finalLabels = uniqueLabels.slice(0, 2);
  return {
    rating,
    labels: finalLabels.length ? finalLabels : (rating >= 4 ? ['steady', 'hopeful'] : rating <= 2 ? ['tired', 'uneasy'] : ['mixed', 'steady']),
  };
};

const fetchWeatherForDate = async (dateKey) => {
  if (WEATHER_CACHE.has(dateKey)) return WEATHER_CACHE.get(dateKey);
  const isPastOrToday = dateKey <= TODAY_KEY;
  const base = isPastOrToday
    ? 'https://archive-api.open-meteo.com/v1/archive'
    : 'https://api.open-meteo.com/v1/forecast';
  const params = new URLSearchParams({
    latitude: String(JOURNAL_LOCATION.latitude),
    longitude: String(JOURNAL_LOCATION.longitude),
    timezone: JOURNAL_LOCATION.timezone,
    start_date: dateKey,
    end_date: dateKey,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
  });
  const url = `${base}?${params.toString()}`;
  const promise = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`weather ${response.status}`);
      return response.json();
    })
    .then((json) => {
      const daily = json && json.daily;
      if (!daily || !daily.time || !daily.time.length) throw new Error('weather empty');
      return {
        max: Math.round(daily.temperature_2m_max[0]),
        min: Math.round(daily.temperature_2m_min[0]),
        code: daily.weather_code[0],
        label: WEATHER_CODE_LABELS[daily.weather_code[0]] || 'unknown',
      };
    });
  WEATHER_CACHE.set(dateKey, promise);
  return promise;
};

const EventChip = ({ event, block = false }) => {
  const cat = (DATA && DATA.CATEGORY_PALETTE[event.categoryId]) || { fill: '#eee', ink: '#333' };
  return (
    <span style={{
      display: block ? 'block' : 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: block ? '2px 6px' : '2px 8px',
      borderRadius: block ? 6 : 999,
      background: cat.fill,
      color: cat.ink,
      fontFamily: "'Cormorant Garamond', 'Garamond', serif",
      fontSize: 11.5,
      lineHeight: 1.35,
      fontStyle: 'italic',
      whiteSpace: block ? 'nowrap' : 'normal',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {event.title}
    </span>
  );
};

const EventStrip = ({ events, empty = null, style }) => (
  <span style={{
    fontSize: 12,
    color: 'var(--ink-2)',
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: EVENT_BLOCK_GAP_PX,
    rowGap: EVENT_BLOCK_GAP_PX,
    alignItems: 'center',
    minWidth: 0,
    ...style,
  }}>
    {events.length === 0 ? empty : events.map((ev, j) => <EventChip key={ev.id || j} event={ev} />)}
  </span>
);

// ─────────────────────────── Header ───────────────────────────
const RepositoryHeader = ({ isMobile }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isMobile ? 14 : 18,
    padding: isMobile ? '0 2px' : '0 6px',
    background: 'transparent',
    color: 'var(--ink-2)',
    height: 12,
    lineHeight: '12px',
  }}>
    <a
      href="https://github.com/BomBomLab/Journal/blob/main/README.md"
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink-3)',
        textDecoration: 'none',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        lineHeight: '12px',
      }}
    >
      BomBomLab/Journal
    </a>
  </div>
);

const Header = ({ view, setView, label, onPrev, onNext, isMobile, alternateHref = '' }) => (
  <header style={{
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr',
    alignItems: 'center',
    justifyItems: isMobile ? 'center' : 'stretch',
    marginBottom: isMobile ? 22 : 28,
    padding: isMobile ? '0' : '0 6px',
    rowGap: isMobile ? 12 : 0,
  }}>
    <div style={{ display: isMobile ? 'none' : 'block' }} />
    <div className="pill-group" role="tablist">
      {['daily','weekly','monthly'].map(v => {
        const isWeekly = v === 'weekly';
        const labelText = isWeekly && view === 'weekly' ? 'Weekly Page' : v[0].toUpperCase()+v.slice(1);
        return (
          <button
            key={v}
            className="pill"
            data-on={view===v}
            onClick={() => {
              if (isWeekly && view === 'weekly' && alternateHref) {
                window.location.href = alternateHref;
                return;
              }
              setView(v);
            }}
          >
            {labelText}
          </button>
        );
      })}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifySelf: isMobile ? 'center' : 'end' }}>
      <button type="button" className="icon-btn" onClick={onPrev} aria-label="Previous">
        <Chevron dir="left" />
      </button>
      <span style={{
        fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--ink-2)', minWidth: isMobile ? 0 : 120, textAlign: 'center', fontWeight: 500,
      }}>
        {label}
      </span>
      <button type="button" className="icon-btn" onClick={onNext} aria-label="Next">
        <Chevron dir="right" />
      </button>
    </div>
  </header>
);

const WeeklyHeader = ({ weekStartKey, weekNumber, isMobile = false }) => (
  <section style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: isMobile ? 12 : 18,
    marginBottom: isMobile ? 24 : 32,
  }}>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div className="eyebrow">Week of</div>
      <h2 className="font-serif" style={{
        margin: '4px 0 0', fontWeight: 400, letterSpacing: '0.02em',
        color: 'var(--ink)', lineHeight: 1,
        whiteSpace: isMobile ? 'normal' : 'nowrap',
      }}>
        <span style={{ fontVariantNumeric: 'oldstyle-nums', fontSize: isMobile ? 48 : 72 }}>
          {parseDateKey(weekStartKey).getUTCDate()}
          <sup style={{ fontSize: '0.45em', verticalAlign: 'super', marginLeft: 2 }}>
            {getOrdinal(parseDateKey(weekStartKey).getUTCDate())}
          </sup>
        </span>
        <span style={{ color: 'rgba(132, 53, 13, 0.35)', fontStyle: 'italic', fontSize: isMobile ? 22 : 36 }}> of </span>
        <span style={{ fontSize: isMobile ? 40 : 64, overflowWrap: 'anywhere' }}>{getMonthLabel(weekStartKey)}</span>
      </h2>
      <div className="font-serif" style={{
        fontSize: isMobile ? 15 : 18, color: 'var(--ink-3)', fontStyle: 'italic', marginTop: 4,
      }}>
        {parseDateKey(weekStartKey).getUTCFullYear()}
      </div>
    </div>
    <div style={{ flex: '0 0 auto' }}>
      <div className="eyebrow" style={{ textAlign: 'right', marginBottom: 6 }}>Week</div>
      <div className="week-num" style={{ textAlign: 'right' }}>{weekNumber}</div>
    </div>
  </section>
);

const WeeklyTimeline = ({ weekDays, compact = false, onSelectDate }) => (
  <section style={{ flex: 1 }}>
    <Eyebrow>The Week</Eyebrow>
    <ul style={{
      listStyle: 'none', margin: '16px 0 0', padding: 0,
      display: 'flex', flexDirection: 'column', gap: compact ? 0 : 2,
    }}>
      {weekDays.map((d, i) => (
        <li key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: compact ? '40px 42px 1fr auto' : '44px 54px 1fr auto',
            alignItems: 'flex-start',
            gap: compact ? 8 : 10,
            padding: compact ? '10px 0' : '12px 0',
            borderBottom: '1px solid var(--rule-soft)',
            background: d.isToday ? 'color-mix(in oklch, var(--accent-wash) 60%, transparent)' : 'transparent',
            cursor: onSelectDate ? 'pointer' : 'default',
          }}
          onClick={onSelectDate ? () => onSelectDate(d.dateKey) : undefined}
          role={onSelectDate ? 'button' : undefined}
          tabIndex={onSelectDate ? 0 : undefined}
          onKeyDown={onSelectDate ? (ev) => { if (ev.key === 'Enter') onSelectDate(d.dateKey); } : undefined}
        >
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
            color: d.isToday ? '#E8704E' : 'var(--ink)',
          }}>
            <span className="font-serif" style={{ fontSize: compact ? 20 : 22, fontWeight: 500, fontVariantNumeric: 'oldstyle-nums' }}>
              {String(d.date).padStart(2,'0')}
            </span>
          </div>
          <span style={{
            fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--ink-3)', fontWeight: 500,
          }}>
            {d.day}
          </span>
          <EventStrip
            events={d.events}
            empty={<span style={{ color: 'var(--ink-4)' }}>—</span>}
          />
          <span style={{
            fontSize: 10, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums',
            minWidth: 28, textAlign: 'right',
          }}>
            {d.tasks > 0 ? `${d.tasks} ☐` : '—'}
          </span>
        </li>
      ))}
    </ul>
  </section>
);

const WeeklyNotes = ({ weekNotes, weekReflection, isMobile }) => (
  <section style={{
    flex: 1, padding: 20,
    border: '1px solid var(--rule-soft)',
    borderRadius: 8,
    background: 'var(--paper-2)',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24,
  }}>
    <div className="dot-grid" style={{
      position: 'absolute', inset: 0, opacity: 0.55, pointerEvents: 'none',
    }} />
    <div className="font-serif" style={{
      position: 'relative', fontSize: 12, color: 'var(--ink)',
      lineHeight: 1.7, fontStyle: 'italic',
      maxHeight: isMobile ? 320 : 360,
      overflowY: 'auto',
      paddingRight: 4,
    }}>
      {weekNotes.map((note) => (
        <p key={note.dateKey} style={{ margin: '0 0 14px' }}>
          <span className="accent-chip">
            {formatDisplayDate(note.dateKey, { month: 'short', day: 'numeric' }).toLowerCase()}
          </span>
          <span style={{
            display: '-webkit-box',
            marginLeft: 8,
            marginTop: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}>{note.text}</span>
        </p>
      ))}
      <p style={{
        margin: 0,
        color: 'var(--ink-2)',
        fontStyle: 'italic',
        display: '-webkit-box',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 3,
      }}>
        {weekReflection}
      </p>
    </div>
  </section>
);

const WeeklyTodos = ({ todos, isMobile }) => (
  <section>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <Eyebrow rule={false}>To Do</Eyebrow>
      <span style={{ fontSize: 10, color: 'var(--ink-3)', fontStyle: 'italic' }}>（开发中）</span>
    </div>
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      marginTop: 14,
    }}>
      {todos.map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
          paddingBottom: 6, borderBottom: '1px solid var(--rule-soft)' }}>
          <Tick on={t.done} />
          <span className="font-serif" style={{
            ...TODO_TEXT_STYLE,
            color: t.done ? 'var(--ink-3)' : 'var(--ink)',
            textDecorationLine: t.done ? 'line-through' : 'none',
            textDecorationColor: 'var(--ink-4)',
            flex: 1,
          }}>{t.text || '—'}</span>
        </div>
      ))}
    </div>
  </section>
);

// ─────────────────────────── Weekly: left page ───────────────────────────
const WeeklyLeft = ({ weekDays, isMobile, onSelectDate }) => (
  <div className="paper-surface spine-shadow-r" style={{
    borderRadius: isMobile ? 14 : '14px 0 0 14px',
    padding: isMobile ? '28px 22px 24px' : '44px 46px 40px',
    width: isMobile ? '100%' : '50%',
    minHeight: isMobile ? 'auto' : 820,
    display: 'flex', flexDirection: 'column',
    position: 'relative',
  }}>
    <WeeklyTimeline weekDays={weekDays} compact={isMobile} onSelectDate={onSelectDate} />

    <footer style={{
      marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      color: 'var(--ink-3)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
    }}>
      <span>Mon — Sun</span>
      <span>I</span>
    </footer>
  </div>
);

// ─────────────────────────── Weekly: right page ───────────────────────────
const WeeklyRight = ({ todos, weekStartKey, weekNumber, weekNotes, weekReflection, isMobile }) => (
  <div className="paper-surface spine-shadow-l" style={{
    borderRadius: isMobile ? 14 : '0 14px 14px 0',
    padding: isMobile ? '28px 22px 24px' : '44px 46px 40px',
    width: isMobile ? '100%' : '50%',
    minHeight: isMobile ? 'auto' : 820,
    display: 'flex', flexDirection: 'column',
    position: 'relative',
  }}>
    <WeeklyHeader weekStartKey={weekStartKey} weekNumber={weekNumber} />
    <WeeklyNotes weekNotes={weekNotes} weekReflection={weekReflection} isMobile={isMobile} />
    <WeeklyTodos
      todos={todos}
      isMobile={isMobile}
    />

    <footer style={{
      marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      color: 'var(--ink-3)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
    }}>
      <span>{`${formatDisplayDate(weekStartKey, { month: 'short', day: 'numeric' })} — ${formatDisplayDate(addDays(weekStartKey, 6), { month: 'short', day: 'numeric' })}`}</span>
      <span>II</span>
    </footer>
  </div>
);

const WeeklyMobile = ({ weekDays, todos, weekStartKey, weekNumber, weekNotes, weekReflection, onSelectDate }) => (
  <div className="paper-surface" style={{
    borderRadius: 14,
    padding: '28px 22px 24px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  }}>
    <WeeklyHeader weekStartKey={weekStartKey} weekNumber={weekNumber} isMobile />
    <WeeklyTimeline weekDays={weekDays} compact onSelectDate={onSelectDate} />
    <WeeklyNotes weekNotes={weekNotes} weekReflection={weekReflection} isMobile />
    <WeeklyTodos
      todos={todos}
      isMobile
    />
  </div>
);

// ─────────────────────────── Diary entries expand ───────────────────────────
const DiaryEntries = ({ entries }) => {
  const [open, setOpen] = useState(false);
  if (!entries || !entries.length) return null;
  return (
    <div style={{ marginTop: 12, position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'none', border: 'none', padding: 0,
          fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--accent-ink)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: "'Cormorant Garamond', serif",
        }}
      >
        <span style={{ fontSize: 9 }}>{open ? '▲' : '▼'}</span>
        {open ? 'hide entries' : `${entries.length} diary entries`}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {entries.map((entry, i) => (
            <div key={i} style={{
              marginTop: 10, paddingLeft: 10,
              borderLeft: '2px solid var(--rule)',
            }}>
              <div style={{
                fontSize: 10, letterSpacing: '0.06em', color: 'var(--accent-ink)',
                fontFamily: "'Cormorant Garamond', serif",
              }}>
                {entry.hour != null
                  ? `${String(entry.hour).padStart(2,'0')}:${String(entry.minute).padStart(2,'0')}`
                  : ''}
                {entry.title ? ` · ${entry.title}` : ''}
              </div>
              {entry.body && (
                <p style={{
                  margin: '4px 0 0', fontSize: 11, lineHeight: 1.6,
                  color: 'var(--ink-2)', fontStyle: 'italic',
                  fontFamily: "'Cormorant Garamond', serif",
                  whiteSpace: 'pre-wrap',
                }}>{entry.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────── Daily ───────────────────────────
const SCHEDULE_START_HOUR = 0;   // midnight
const SCHEDULE_END_HOUR   = 23;  // through 11 pm (last row is 11pm–12am)
const HOUR_PX = 57;
const SCHEDULE_EVENT_GAP_PX = 6;
const LONG_EVENT_FOLD_THRESHOLD_HOURS = 4;
const EMPTY_HOUR_FOLD_THRESHOLD_HOURS = 2;
const FOLD_MARKER_PX = 24;

const EVENT_CATEGORIES = (DATA && DATA.CATEGORY_PALETTE) || {};

const Daily = ({ checks, toggleCheck, dateKey, events, mustDo, isMobile }) => {
  const scheduleLabelWidth = isMobile ? 70 : 104;
  const scheduleHeaderFont = isMobile ? 44 : 64;
  const summaryText = getDaySummaryText(dateKey);
  const mood = useMemo(() => deriveMoodFromSummary(summaryText), [summaryText]);
  const [weather, setWeather] = useState(null);

  const STICKY_W = isMobile ? 84 : 96;
  const STICKY_GAP = 8;
  const STICKY_UNIT = STICKY_W + STICKY_GAP;
  const PRIMARY_TEXT_RATIO = 0.66;
  const STICKY_COLLAPSED_H = 24;

  // Primary = longest overlapping event; secondaries become bookmark strips on the right.
  const computeLayout = (evts) => {
    if (!evts.length) return new Map();
    const getOverlaps = (i) => evts
      .map((_, j) => j)
      .filter((j) => j !== i && evts[j].startHour < evts[i].endHour && evts[j].endHour > evts[i].startHour);
    const claimedAsSec = new Set();
    const secsOf       = new Map();
    const byDur = evts.map((_, i) => i)
      .sort((a, b) =>
        (evts[b].endHour - evts[b].startHour) - (evts[a].endHour - evts[a].startHour)
        || evts[a].startHour - evts[b].startHour,
      );
    for (const i of byDur) {
      if (claimedAsSec.has(i)) continue;
      const secs = getOverlaps(i).filter((j) => !claimedAsSec.has(j) && !secsOf.has(j));
      secsOf.set(i, secs);
      secs.forEach((j) => claimedAsSec.add(j));
    }
    const result = new Map();
    for (let i = 0; i < evts.length; i++) {
      if (secsOf.has(i)) {
        result.set(i, { role: 'primary', totalSecondary: secsOf.get(i).length });
      } else {
        let found = false;
        for (const [, secs] of secsOf) {
          const sIdx = secs.indexOf(i);
          if (sIdx >= 0) {
            result.set(i, { role: 'secondary', secondaryIndex: sIdx, totalSecondary: secs.length });
            found = true; break;
          }
        }
        if (!found) result.set(i, { role: 'primary', totalSecondary: 0 });
      }
    }
    return result;
  };

  const [expandedEventId, setExpandedEventId] = useState(null);
  const [expandedEmptyFolds, setExpandedEmptyFolds] = useState(() => new Set());
  const eventSignature = useMemo(() => (
    (events || [])
      .map((event) => `${event.id || event.title}:${event.startHour}-${event.endHour}`)
      .join('|')
  ), [events]);

  useEffect(() => {
    setExpandedEventId(null);
    setExpandedEmptyFolds(new Set());
  }, [dateKey, eventSignature]);

  useEffect(() => {
    let cancelled = false;
    setWeather(null);
    fetchWeatherForDate(dateKey)
      .then((next) => {
        if (!cancelled) setWeather(next);
      })
      .catch(() => {
        if (!cancelled) setWeather({ error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  const timeScale = useMemo(() => {
    const rawFolds = [];
    for (const event of events || []) {
      const duration = event.endHour - event.startHour;
      if (duration < LONG_EVENT_FOLD_THRESHOLD_HOURS) continue;
      if ((event.id || '') === expandedEventId) continue;

      const foldStart = Math.max(
        SCHEDULE_START_HOUR,
        Math.ceil(event.startHour),
      );
      const foldEnd = Math.min(
        SCHEDULE_END_HOUR + 1,
        Math.floor(event.endHour) - 1,
      );

      if (foldEnd - foldStart >= 2) {
        rawFolds.push({ start: foldStart, end: foldEnd, type: 'event', eventId: event.id || '' });
      }
    }

    const getScanEndHour = () => {
      if (dateKey > TODAY_KEY) return SCHEDULE_START_HOUR;
      if (dateKey < TODAY_KEY) return SCHEDULE_END_HOUR + 1;
      const now = new Date();
      return Math.max(
        SCHEDULE_START_HOUR,
        Math.min(SCHEDULE_END_HOUR + 1, now.getHours()),
      );
    };

    const scanEndHour = getScanEndHour();
    if (scanEndHour > SCHEDULE_START_HOUR) {
      const emptyHours = [];
      for (let hour = SCHEDULE_START_HOUR; hour < scanEndHour; hour++) {
        const hourStart = hour;
        const hourEnd = hour + 1;
        const isCovered = (events || []).some((event) => (
          event.startHour < hourEnd && event.endHour > hourStart
        ));
        if (!isCovered) emptyHours.push(hour);
      }

      let runStart = null;
      let prevHour = null;
      const flushRun = () => {
        if (runStart == null || prevHour == null) return;
        const runLength = prevHour - runStart + 1;
        if (runLength > EMPTY_HOUR_FOLD_THRESHOLD_HOURS) {
          const foldStart = runStart + 1;
          const foldEnd = prevHour;
          const foldId = `empty:${dateKey}:${foldStart}-${foldEnd}`;
          if (foldEnd > foldStart && !expandedEmptyFolds.has(foldId)) {
            rawFolds.push({ start: foldStart, end: foldEnd, type: 'empty', foldId });
          }
        }
      };

      for (const hour of emptyHours) {
        if (runStart == null) {
          runStart = hour;
          prevHour = hour;
          continue;
        }
        if (hour === prevHour + 1) {
          prevHour = hour;
          continue;
        }
        flushRun();
        runStart = hour;
        prevHour = hour;
      }
      flushRun();
    }

    rawFolds.sort((a, b) => a.start - b.start || a.end - b.end);
    const folds = [];
    for (const fold of rawFolds) {
      const prev = folds[folds.length - 1];
      if (prev && fold.start <= prev.end) {
        prev.end = Math.max(prev.end, fold.end);
        prev.type = prev.type === fold.type ? prev.type : 'mixed';
        prev.foldId = prev.foldId || fold.foldId;
      } else {
        folds.push({ ...fold });
      }
    }

    const hourTop = (hour) => {
      let top = (hour - SCHEDULE_START_HOUR) * HOUR_PX;
      for (const fold of folds) {
        if (hour <= fold.start) continue;

        if (hour < fold.end) {
          top -= (hour - fold.start) * HOUR_PX;
          top += ((hour - fold.start) / (fold.end - fold.start)) * FOLD_MARKER_PX;
        } else {
          top -= (fold.end - fold.start) * HOUR_PX;
          top += FOLD_MARKER_PX;
        }
      }
      return top;
    };

    return {
      folds,
      hourTop,
      hourHeight(hour) {
        return hourTop(hour + 1) - hourTop(hour);
      },
      foldStartingAt(hour) {
        return folds.find((fold) => fold.start === hour) || null;
      },
    };
  }, [events, expandedEventId, expandedEmptyFolds, dateKey]);

  return (
  <div className="paper-surface page-shadow fadein" style={{
    borderRadius: 14,
    padding: isMobile ? '26px 18px 22px' : '48px 56px',
    maxWidth: 1240, margin: '0 auto',
    minHeight: isMobile ? 'auto' : 820,
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr',
    gridTemplateRows: isMobile ? 'auto auto auto' : 'auto 1fr',
    columnGap: isMobile ? 0 : 44,
    rowGap: isMobile ? 18 : 24,
  }}>
    {/* Header */}
    <div style={{ gridColumn: '1 / -1' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        {formatDisplayDate(dateKey, { weekday: 'long' })} · {dateKey.slice(8, 10)} · {dateKey.slice(5, 7)} · {dateKey.slice(0, 4)}
      </div>
      <h2 className="font-serif" style={{
        margin: 0, fontSize: scheduleHeaderFont, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.05,
      }}>
        <span style={{ color: 'var(--ink)', fontStyle: 'normal' }}>
          {parseDateKey(dateKey).getUTCDate()}
          <sup style={{ fontSize: '0.45em', verticalAlign: 'super', marginLeft: 2, marginRight: 4 }}>
            {getOrdinal(parseDateKey(dateKey).getUTCDate())}
          </sup>
        </span>
        <span style={{ fontStyle: 'italic', color: 'var(--ink)' }}>
          {' '}
          {getMonthLabel(dateKey)}
        </span>
        <span style={{ color: 'rgba(132, 53, 13, 0.35)', fontStyle: 'italic' }}> · Journal</span>
      </h2>
    </div>

    {/* Left: schedule */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section>
        <div className="cal-column" style={{
          position: 'relative',
          border: 'none',
          borderRadius: 0,
          background: 'transparent',
          overflow: 'hidden',
        }}>
          {/* Hour rows */}
          {(() => {
            const rows = [];
            let h = SCHEDULE_START_HOUR;
            while (h <= SCHEDULE_END_HOUR) {
              const fold = timeScale.foldStartingAt(h);
              if (fold) {
                const startLabel = h === 0 ? '12 am' : h === 12 ? 'noon' : h < 12 ? `${h} am` : `${h-12} pm`;
                rows.push({
                  h,
                  label: startLabel,
                  height: FOLD_MARKER_PX,
                  folded: true,
                  fold,
                });
                h = fold.end;
                continue;
              }
              const label = h === 0 ? '12 am' : h === 12 ? 'noon' : h < 12 ? `${h} am` : `${h-12} pm`;
              rows.push({ h, label, height: timeScale.hourHeight(h), folded: false });
              h += 1;
            }
            return rows.map((row, i) => {
              const isLast = i === rows.length - 1;
              return (
                <div key={row.h} style={{
                  display: 'grid', gridTemplateColumns: `${scheduleLabelWidth}px 1fr`,
                  height: row.height,
                  borderBottom: isLast ? 'none' : '1px solid var(--rule-soft)',
                  background: row.folded ? 'rgba(178, 151, 124, 0.06)' : 'transparent',
                  cursor: row.folded && row.fold && row.fold.foldId ? 'pointer' : 'default',
                }}
                role={row.folded && row.fold && row.fold.foldId ? 'button' : undefined}
                tabIndex={row.folded && row.fold && row.fold.foldId ? 0 : undefined}
                aria-label={row.folded && row.fold && row.fold.foldId ? `Expand folded empty hours from ${row.label}` : undefined}
                onClick={row.folded && row.fold && row.fold.foldId ? () => {
                  setExpandedEmptyFolds((current) => {
                    const next = new Set(current);
                    next.add(row.fold.foldId);
                    return next;
                  });
                } : undefined}
                onKeyDown={row.folded && row.fold && row.fold.foldId ? (ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    setExpandedEmptyFolds((current) => {
                      const next = new Set(current);
                      next.add(row.fold.foldId);
                      return next;
                    });
                  }
                } : undefined}
                >
                  <div style={{
                    fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--ink-4)', fontVariantNumeric: 'tabular-nums',
                    padding: row.folded ? '6px 10px 0 12px' : '4px 10px 0 12px',
                    background: 'transparent',
                  }}>
                    {row.label}
                    {row.folded && (
                      <span style={{
                        display: 'inline-block',
                        marginLeft: 4,
                        fontSize: 9,
                        letterSpacing: '0.08em',
                        opacity: 0.62,
                      }}>
                        (folded)
                      </span>
                    )}
                  </div>
                  <div style={{
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {row.folded && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        right: 10,
                        top: '50%',
                        borderTop: '1px dashed var(--rule)',
                      }} />
                    )}
                  </div>
                </div>
              );
            });
          })()}

          {/* Absolute-positioned event blocks */}
          <div style={{
            position: 'absolute',
            left: scheduleLabelWidth, right: 0,
            top: 0,
            bottom: 0,
            overflow: 'visible',
            pointerEvents: 'none',
          }}>
            {(() => {
            const layoutMap = computeLayout(events);
            return events.map((e, i) => {
              const cat      = EVENT_CATEGORIES[e.categoryId] || { fill: '#eee', ink: '#333', label: e.categoryId };
              const eventId  = e.id || `${dateKey}:${i}`;
              const note     = String(e.note || '').trim();
              const tags     = Array.isArray(e.tags) ? e.tags.filter(Boolean) : [];
              const hasDetails  = Boolean(note || tags.length);
              const isExpanded  = expandedEventId === eventId;
              const rawTop      = timeScale.hourTop(e.startHour) - timeScale.hourTop(SCHEDULE_START_HOUR);
              const rawBottom   = timeScale.hourTop(e.endHour)   - timeScale.hourTop(SCHEDULE_START_HOUR);
              const top         = Math.round(rawTop);
              const naturalHeight = Math.max(12, Math.round(rawBottom - rawTop) - SCHEDULE_EVENT_GAP_PX);
              const hh          = DATA ? DATA.hourLabel : formatHourLabel;
              const layout      = layoutMap.get(i) || { role: 'primary', totalSecondary: 0 };
              const isSecondary = layout.role === 'secondary';
              const stickyOffset = 22;

              if (isSecondary) {
                const stickyHeight = isExpanded
                  ? Math.max(naturalHeight + 52, note ? 156 : 112)
                  : STICKY_COLLAPSED_H;
                return (
                  <div
                    key={i}
                    title={e.title}
                    style={{
                      position: 'absolute',
                      right: stickyOffset,
                      width: STICKY_W,
                      top,
                      height: stickyHeight,
                      background: softenEventFill(cat.fill),
                      color: cat.ink,
                      borderRadius: 10,
                      boxShadow: isExpanded
                        ? '0 8px 18px rgba(94, 73, 49, 0.10), 0 1px 4px rgba(94, 73, 49, 0.05)'
                        : '0 5px 12px rgba(94, 73, 49, 0.08), 0 1px 3px rgba(94, 73, 49, 0.04)',
                      border: '0.5px solid rgba(255,255,255,0.38)',
                      overflow: 'hidden',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      zIndex: isExpanded ? 12 : 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: isExpanded ? 'flex-start' : 'center',
                      gap: isExpanded ? 6 : 0,
                      padding: isExpanded ? '10px 10px 12px' : '0 10px',
                      transform: `rotate(${(layout.secondaryIndex || 0) % 2 === 0 ? -1.2 : 1.2}deg)`,
                    }}
                    onClick={() => setExpandedEventId((cur) => cur === eventId ? null : eventId)}
                    role={hasDetails ? 'button' : undefined}
                    tabIndex={hasDetails ? 0 : undefined}
                    aria-expanded={hasDetails ? isExpanded : undefined}
                    onKeyDown={hasDetails ? (ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        setExpandedEventId((cur) => cur === eventId ? null : eventId);
                      }
                    } : undefined}
                  >
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: cat.ink,
                      lineHeight: 1,
                      letterSpacing: '0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      minWidth: 0,
                      display: 'block',
                    }}>
                      {e.title}
                    </span>
                    {!isExpanded && (
                      <span style={{ fontSize: 9, opacity: 0.6, display: 'block', lineHeight: 1.2 }}>
                        {e.durationMinutes >= 60
                          ? `${Math.floor(e.durationMinutes / 60)}h${e.durationMinutes % 60 ? ` ${e.durationMinutes % 60}m` : ''}`
                          : `${e.durationMinutes}m`}
                      </span>
                    )}
                    {isExpanded && note && (
                      <span style={{
                        fontSize: 10,
                        lineHeight: 1.3,
                        opacity: 0.78,
                        whiteSpace: 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 7,
                      }}>
                        {note}
                      </span>
                    )}
                    {isExpanded && tags.length > 0 && (
                      <span style={{
                        fontSize: 9,
                        opacity: 0.62,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        whiteSpace: 'normal',
                      }}>
                        {tags.join(' · ')}
                      </span>
                    )}
                  </div>
                );
              }

              // ── Primary or expanded secondary ────────────────────────────────
              const height          = isExpanded ? Math.max(naturalHeight, note ? 116 : 72) : naturalHeight;
              const duration        = e.endHour - e.startHour;
              const compact         = (duration < 0.8 || naturalHeight < 44) && !isExpanded;
              const canPreviewDetails = note && naturalHeight >= 72;
              const primaryHasSecondary = layout.totalSecondary > 0;
              const contentMaxWidth = primaryHasSecondary && !compact ? `calc(${Math.round(PRIMARY_TEXT_RATIO * 100)}% - 8px)` : '100%';

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 6,
                    right: 6,
                    top,
                    height,
                    background: cat.fill,
                    color: cat.ink,
                    borderRadius: 6,
                    padding: compact ? '2px 10px' : '6px 10px',
                    fontSize: 12,
                    lineHeight: 1.3,
                    boxShadow: isExpanded && isSecondary ? '0 2px 16px rgba(0,0,0,0.12)' : 'none',
                    display: 'flex',
                    flexDirection: compact ? 'row' : 'column',
                    justifyContent: compact ? 'space-between' : 'flex-start',
                    alignItems: compact ? 'center' : 'flex-start',
                    gap: 4,
                    overflow: 'hidden',
                    pointerEvents: 'auto',
                    zIndex: isExpanded ? 10 : 1,
                    cursor: hasDetails ? 'pointer' : 'default',
                  }}
                  role={hasDetails ? 'button' : undefined}
                  tabIndex={hasDetails ? 0 : undefined}
                  aria-expanded={hasDetails ? isExpanded : undefined}
                    onClick={hasDetails ? () => setExpandedEventId((cur) => cur === eventId ? null : eventId) : undefined}
                  onKeyDown={hasDetails ? (ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      setExpandedEventId((cur) => cur === eventId ? null : eventId);
                    }
                  } : undefined}
                >
                  {isExpanded && (
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setExpandedEventId(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        border: 0,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.45)',
                        color: cat.ink,
                        width: 18,
                        height: 18,
                        fontSize: 11,
                        lineHeight: 1,
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        padding: 0,
                      }}
                      aria-label="Collapse event"
                    >
                      ×
                    </button>
                  )}
                  <span style={{
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: contentMaxWidth,
                    minWidth: 0,
                  }}>
                    {e.title}
                  </span>
                  <span style={{
                    fontSize: 10,
                    opacity: 0.75,
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    maxWidth: contentMaxWidth,
                    minWidth: 0,
                    flexShrink: compact ? 0 : 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {hh(e.startHour)} – {hh(e.endHour)}{' · '}
                    {e.durationMinutes >= 60
                      ? `${Math.floor(e.durationMinutes / 60)}h${e.durationMinutes % 60 ? ` ${e.durationMinutes % 60}m` : ''}`
                      : `${e.durationMinutes}m`}
                  </span>
                  {!isExpanded && !canPreviewDetails && hasDetails && !compact && (
                    <span style={{ fontSize: 10, opacity: 0.72, fontStyle: 'italic', maxWidth: contentMaxWidth }}>tap for details</span>
                  )}
                  {(canPreviewDetails || isExpanded) && note && (
                    <span style={{
                      fontSize: 10.5, lineHeight: 1.35, opacity: 0.88,
                      whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: isExpanded ? 6 : 2,
                      maxWidth: contentMaxWidth,
                    }}>
                      {note}
                    </span>
                  )}
                  {isExpanded && tags.length > 0 && (
                    <span style={{ fontSize: 9.5, opacity: 0.72, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'normal' }}>
                      {tags.join(' · ')}
                    </span>
                  )}
                </div>
              );
            });
            })()}
          </div>
        </div>
      </section>
    </div>

    {/* Right: must-do → weather/mood → one line → morning pages (moved bottom) */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section style={{
        position: 'relative', padding: isMobile ? 16 : 20,
        border: '1px solid var(--rule-soft)',
        borderRadius: 10,
        background: 'var(--paper-2)',
        overflow: 'hidden',
      }}>
        <div className="dot-grid" style={{
          position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none',
        }} />
        <div className="eyebrow" style={{ position: 'relative', marginBottom: 10 }}>Diary</div>
        <div className="font-serif" style={{
          position: 'relative', margin: 0, fontSize: 12, lineHeight: 1.7,
          color: 'var(--ink)',
          maxHeight: isMobile ? 'none' : 280, overflowY: 'auto', paddingRight: 4,
        }}>
          {summaryText ? (
            <p style={{
              margin: 0, fontSize: 12, lineHeight: 1.7,
              color: 'var(--ink)', fontStyle: 'italic',
              whiteSpace: 'pre-wrap',
            }}>
              <span style={{ fontSize: 24, lineHeight: 1.25 }}>{toSingleLineSentence(summaryText)}</span>
              {summaryText !== toSingleLineSentence(summaryText) && (
                <>
                  {'\n'}
                  {summaryText.slice(toSingleLineSentence(summaryText).length).trimStart()}
                </>
              )}
            </p>
          ) : (
            <p style={{ margin: 0, color: 'var(--ink-3)', fontStyle: 'italic' }}>
              No summary yet for today.
            </p>
          )}
        </div>
        {DATA && DATA.DIARY_BY_DAY && DATA.DIARY_BY_DAY[dateKey] && DATA.DIARY_BY_DAY[dateKey].length > 0 && (
          <div style={{ position: 'relative', paddingTop: 4 }}>
            <DiaryEntries entries={DATA.DIARY_BY_DAY[dateKey]} />
          </div>
        )}
      </section>

      <section style={{
        background: 'var(--paper-2)',
        border: '1px solid var(--rule-soft)',
        borderRadius: 10,
        padding: isMobile ? '16px 16px' : '20px 22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <Eyebrow rule={false}>Must Do</Eyebrow>
          <span style={{ fontSize: 10, color: 'var(--ink-3)', fontStyle: 'italic' }}>（开发中）</span>
        </div>
        <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0,
          display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mustDo.map((t, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ paddingTop: 4 }}>
                <Tick on={t.done} />
              </span>
              <span className="font-serif" style={{
                flex: 1,
                ...TODO_TEXT_STYLE,
                color: t.done ? 'var(--ink-3)' : 'var(--ink)',
                textDecorationLine: t.done ? 'line-through' : 'none',
                textDecorationColor: 'var(--ink-4)',
              }}>
                {t.text}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{
        background: 'var(--paper-2)',
        border: '1px solid var(--rule-soft)',
        borderRadius: 10,
        padding: isMobile ? '16px 16px' : '20px 22px',
      }}>
        <Eyebrow rule={false}>Weather · Mood</Eyebrow>
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginTop: 14,
        }}>
          <div>
            <div className="font-serif" style={{ fontSize: 26, color: 'var(--ink)', fontWeight: 500 }}>
              {weather && !weather.error
                ? `${weather.min}°`
                : '—'}
              <span style={{ color: 'var(--ink-3)', fontSize: 18 }}>
                {weather && !weather.error ? ` / ${weather.max}°` : ' / —'}
              </span>
            </div>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
              {weather && !weather.error ? weather.label : 'loading weather'}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{
                  width: 16, height: 16, borderRadius: 999,
                  border: '1px solid var(--rule)',
                  background: n <= mood.rating ? 'var(--accent)' : 'transparent',
                }}/>
              ))}
            </div>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 6 }}>
              {mood.labels.join(' · ')}
            </div>
          </div>
        </div>
      </section>

      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end',
        color: 'var(--ink-3)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        <span>Day {Math.floor((parseDateKey(dateKey) - parseDateKey(`${parseDateKey(dateKey).getUTCFullYear()}-01-01`)) / 86400000) + 1} / 365</span>
      </div>
    </div>
  </div>
);
};

// ─────────────────────────── Monthly ───────────────────────────
const DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const Monthly = ({ dateKey, onSelectDate, isMobile = false }) => {
  const cells = buildMonthlyCells(dateKey);
  const palette = (window.JOURNAL_DATA && window.JOURNAL_DATA.CATEGORY_PALETTE) || {};
  const monthDate = parseDateKey(dateKey);
  const activeMonth = getMonthLabel(dateKey);
  const year = monthDate.getUTCFullYear();
  const daysInMonth = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate();
  const weekCount = new Set(cells.map((_, index) => Math.floor(index / 7))).size;
  const monthlyMinWidth = 720;
  const monthSummary = getLatestMonthSummaryLine(dateKey)
    || toSingleLineSentence(
      (((DATA && DATA.journal && DATA.journal.month && DATA.journal.month[dateKey.slice(0, 7)] || {}).summary || {}).body)
        || getWeeklyReflection(DATA ? DATA.dateRange(`${year}-${String(monthDate.getUTCMonth() + 1).padStart(2, '0')}-01`, `${year}-${String(monthDate.getUTCMonth() + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`) : [])
    );

  return (
    <div className="paper-surface page-shadow fadein" style={{
      borderRadius: 14,
      padding: isMobile ? '28px 18px 24px' : '44px 48px',
      maxWidth: 1160, margin: '0 auto',
      minHeight: 820,
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box',
      minWidth: 0,
    }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 0,
        paddingBottom: 20, borderBottom: '1px solid var(--rule)', marginBottom: 20,
      }}>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">Month · {String(monthDate.getUTCMonth() + 1).padStart(2, '0')} of 12</div>
          <h2 className="font-serif" style={{
            margin: '4px 0 0', fontSize: isMobile ? 52 : 72, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 0.95,
          }}>
            {activeMonth}
          </h2>
          <div className="font-serif" style={{
            fontSize: isMobile ? 15 : 18, fontStyle: 'italic', color: 'var(--ink-3)', marginTop: 6,
            whiteSpace: isMobile ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '100%' : 680,
          }}>
            latest — {monthSummary}
          </div>
        </div>
        <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Year</div>
          <div className="font-serif" style={{ fontSize: 32, color: 'var(--ink)', fontVariantNumeric: 'oldstyle-nums' }}>
            {year}
          </div>
        </div>
      </header>

      <div style={{
        overflowX: isMobile ? 'auto' : 'visible',
        overflowY: 'visible',
        paddingBottom: isMobile ? 6 : 0,
        marginInline: isMobile ? -2 : 0,
      }}>
        <div style={{ minWidth: isMobile ? monthlyMinWidth : 'auto' }}>
          {/* Week header */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1,
            marginBottom: 8,
          }}>
            {DOW.map(d => (
              <div key={d} style={{
                padding: '8px 10px',
                fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--ink-3)', fontWeight: 500,
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1,
            background: 'var(--rule-soft)',
            border: '1px solid var(--rule-soft)',
            borderRadius: 10, overflow: 'hidden',
            flex: 1,
          }}>
            {cells.map((c, i) => {
              const events = (!c.muted && c.events) || [];
              const cats = (!c.muted && c.cats) || [];
              return (
                <div
                  key={c.key || i}
                  className="cal-cell"
                  data-muted={c.muted}
                  data-today={c.isToday}
                  onClick={!c.muted && onSelectDate ? () => onSelectDate(c.key) : undefined}
                  style={!c.muted && onSelectDate ? { cursor: 'pointer' } : undefined}
                  title={!c.muted && events.length > 0 ? events.map((event) => event.title).join(' · ') : undefined}
                >
                  <span className="cal-num">{c.n}</span>
                  {events.length > 0 && (
                    <EventStrip
                      events={events}
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        alignContent: 'flex-start',
                        maxHeight: 44,
                        overflow: 'hidden',
                      }}
                    />
                  )}
                  {events.length === 0 && cats.length > 0 && (
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', columnGap: 6, rowGap: 2,
                      marginTop: 8,
                      fontSize: 9.5, lineHeight: 1.3,
                      letterSpacing: '0.04em',
                      fontStyle: 'italic',
                    }}>
                      {cats.slice(0, 3).map((catId, j) => {
                        const p = palette[catId];
                        if (!p) return null;
                        return (
                          <span key={j} style={{ color: p.ink || 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                            <span style={{ color: p.fill, marginRight: 3 }}>•</span>
                            {p.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer rail */}
      <footer style={{
        marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        color: 'var(--ink-3)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>
        <span>{weekCount} weeks · {daysInMonth} days</span>
        <span>{String(monthDate.getUTCMonth() + 1).padStart(2, '0')}</span>
      </footer>
    </div>
  );
};

// ─────────────────────────── App ───────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "Warm Paper",
  "accent": "whisper",
  "showPaperGrain": true,
  "fontScale": 1.0
}/*EDITMODE-END*/;

const App = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState(INITIAL_VIEW);
  const [cursorKey, setCursorKey] = useState(INITIAL_CURSOR_KEY);
  const [isMobile, setIsMobile] = useState(getIsMobileViewport);
  const weekDateKeys = useMemo(() => getWeekDateKeys(cursorKey), [cursorKey]);
  const weekDays = useMemo(() => getWeekData(cursorKey), [cursorKey]);
  const weekTodos = useMemo(() => getWeekTodos(weekDateKeys), [weekDateKeys]);
  const dailyTodos = useMemo(() => getDayTodos(cursorKey, 5), [cursorKey]);
  const dailyEvents = useMemo(() => (
    (DATA && DATA.journal && DATA.journal.day && DATA.journal.day[cursorKey] && DATA.journal.day[cursorKey].events)
    || (DATA && DATA.eventsByDay[cursorKey])
    || []
  ), [cursorKey]);
  const weekNotes = useMemo(() => getWeekNotes(weekDateKeys), [weekDateKeys]);
  const weekReflection = useMemo(() => getWeeklyReflection(weekDateKeys), [weekDateKeys]);
  const dailyChecksKey = (dk) => `journal-daily-checks-${dk}`;
  const [checks, setChecks] = useState(() => {
    let daily;
    try {
      const saved = localStorage.getItem(dailyChecksKey(cursorKey));
      daily = saved ? JSON.parse(saved) : dailyTodos.map((x) => x.done);
    } catch (_) {
      daily = dailyTodos.map((x) => x.done);
    }
    return { todos: weekTodos.map((x) => x.done), daily };
  });
  const toggleCheck = (key, i) => setChecks((c) => {
    const arr = [...c[key]]; arr[i] = !arr[i];
    const next = { ...c, [key]: arr };
    if (key === 'daily') {
      try { localStorage.setItem(dailyChecksKey(cursorKey), JSON.stringify(next.daily)); } catch (_) {}
    }
    return next;
  });
  // Apply theme + accent density via CSS vars on :root
  useEffect(() => {
    const palette = THEMES[t.theme] || THEMES['Warm Paper'];
    const root = document.documentElement;
    Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v));

    // Accent intensity — tweak the wash alpha without changing the hue
    const { washAlpha } = ACCENT_DENSITY[t.accent] || ACCENT_DENSITY.whisper;
    // Parse base wash OKLCH and adjust as alpha layer via overlay
    // Simpler: scale --accent-wash toward --paper-2 by mixing
    const base = palette['--accent-wash'];
    root.style.setProperty('--accent-wash',
      `color-mix(in oklch, ${base} ${Math.round(washAlpha*100)}%, var(--paper-2))`);

    root.style.setProperty('font-size', `${16 * t.fontScale}px`);

    // Paper grain toggle
    document.body.dataset.grain = t.showPaperGrain ? 'on' : 'off';
  }, [t.theme, t.accent, t.fontScale, t.showPaperGrain]);

  useEffect(() => {
    setChecks(c => ({
      ...c,
      todos: weekTodos.map(x => x.done),
    }));
  }, [weekTodos]);

  useEffect(() => {
    let daily;
    try {
      const saved = localStorage.getItem(dailyChecksKey(cursorKey));
      daily = saved ? JSON.parse(saved) : dailyTodos.map((x) => x.done);
    } catch (_) {
      daily = dailyTodos.map((x) => x.done);
    }
    setChecks((c) => ({ ...c, daily }));
  }, [dailyTodos, cursorKey]);

  useEffect(() => {
    const onResize = () => setIsMobile(getIsMobileViewport());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const label = view === 'daily'
    ? formatDisplayDate(cursorKey, { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', ' ·')
    : view === 'weekly'
      ? (() => { const { week, year } = getISOWeek(cursorKey); return `Week ${week} · ${year}`; })()
      : `${getMonthLabel(cursorKey)} ${parseDateKey(cursorKey).getUTCFullYear()}`;

  const onPrev = () => {
    setCursorKey((current) => (
      view === 'daily' ? addDays(current, -1)
      : view === 'weekly' ? addDays(current, -7)
      : addMonths(current, -1)
    ));
  };
  const onNext = () => {
    setCursorKey((current) => (
      view === 'daily' ? addDays(current, 1)
      : view === 'weekly' ? addDays(current, 7)
      : addMonths(current, 1)
    ));
  };

  return (
    <div className="app-bg" data-screen-label={`Journal · ${view}`}>
      <div className="max-shell">
        <RepositoryHeader isMobile={isMobile} />
        <Header
          view={view}
          setView={setView}
          label={label}
          onPrev={onPrev}
          onNext={onNext}
          isMobile={isMobile}
          alternateHref={view === 'weekly' ? `WeeklyDaily.html?date=${getWeekStartKey(cursorKey)}` : ''}
        />

        <main>
          {view === 'weekly' && (
            isMobile ? (
              <div className="fadein">
                <WeeklyMobile
                  weekDays={weekDays}
                  todos={weekTodos}
                  weekStartKey={getWeekStartKey(cursorKey)}
                  weekNumber={getWeekNumber(cursorKey)}
                  weekNotes={weekNotes}
                  weekReflection={weekReflection}
                  onSelectDate={(key) => { setCursorKey(key); setView('daily'); }}
                />
              </div>
            ) : (
              <div className="fadein" style={{
                display: 'flex', alignItems: 'stretch', justifyContent: 'center',
              }}>
                <WeeklyLeft
                  weekDays={weekDays}
                  isMobile={false}
                  onSelectDate={(key) => { setCursorKey(key); setView('daily'); }}
                />
                <WeeklyRight
                  todos={weekTodos}
                  weekStartKey={getWeekStartKey(cursorKey)}
                  weekNumber={getWeekNumber(cursorKey)}
                  weekNotes={weekNotes}
                  weekReflection={weekReflection}
                  isMobile={false}
                />
              </div>
            )
          )}
          {view === 'daily' && (
            <Daily
              checks={checks}
              toggleCheck={toggleCheck}
              dateKey={cursorKey}
              events={dailyEvents}
              mustDo={dailyTodos}
              isMobile={isMobile}
            />
          )}
          {view === 'monthly' && (
            <Monthly
              dateKey={cursorKey}
              onSelectDate={(key) => { setCursorKey(key); setView('daily'); }}
              isMobile={isMobile}
            />
          )}
        </main>

      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Palette" />
        <TweakSelect label="Theme"
          value={t.theme}
          options={Object.keys(THEMES)}
          onChange={v => setTweak('theme', v)} />
        <TweakRadio label="Accent"
          value={t.accent}
          options={['whisper','muted','confident']}
          onChange={v => setTweak('accent', v)} />

        <TweakSection label="Paper" />
        <TweakToggle label="Paper grain"
          value={t.showPaperGrain}
          onChange={v => setTweak('showPaperGrain', v)} />
        <TweakSlider label="Type scale"
          value={t.fontScale}
          min={0.9} max={1.15} step={0.01}
          onChange={v => setTweak('fontScale', v)} />
      </TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
