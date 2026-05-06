import './data.generated.js';

const { useEffect, useMemo, useState } = React;

const DATA = window.JOURNAL_DATA;
const QUERY_PARAMS = new URLSearchParams(window.location.search);
const SCHEDULE_START_HOUR = 0;
const SCHEDULE_END_HOUR = 23;
const HOUR_PX = 57;
const SCHEDULE_EVENT_GAP_PX = 6;
const LONG_EVENT_FOLD_THRESHOLD_HOURS = 4;
const EMPTY_HOUR_FOLD_THRESHOLD_HOURS = 2;
const FOLD_MARKER_PX = 24;
const WEEKLY_LONG_EVENT_MIN_SUPPORT_DAYS = 2;
const EVENT_CATEGORIES = (DATA && DATA.CATEGORY_PALETTE) || {};

const parseDateKey = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDateKey = (date) => (
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
);

const formatLocalDateKey = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
);

const TODAY_KEY = formatLocalDateKey(new Date());
const getIsMobileViewport = () => (
  window.matchMedia ? window.matchMedia('(max-width: 760px)').matches : window.innerWidth <= 760
);

const addDays = (dateKey, days) => {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
};

const getWeekStartKey = (dateKey) => {
  const date = parseDateKey(dateKey);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return formatDateKey(date);
};

const formatDisplayDate = (dateKey, options) => (
  parseDateKey(dateKey).toLocaleDateString('en-US', { timeZone: 'UTC', ...options })
);

const getOrdinal = (n) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'st';
  if (mod10 === 2 && mod100 !== 12) return 'nd';
  if (mod10 === 3 && mod100 !== 13) return 'rd';
  return 'th';
};

const getMonthLabel = (dateKey) => formatDisplayDate(dateKey, { month: 'long' });

const getWeekRangeLabel = (weekStartKey) => {
  const weekEndKey = addDays(weekStartKey, 6);
  const start = parseDateKey(weekStartKey);
  const end = parseDateKey(weekEndKey);
  const sameMonth = start.getUTCFullYear() === end.getUTCFullYear()
    && start.getUTCMonth() === end.getUTCMonth();
  if (sameMonth) {
    return `${getMonthLabel(weekStartKey)} ${start.getUTCDate()} - ${end.getUTCDate()}`;
  }
  return `${formatDisplayDate(weekStartKey, { month: 'short', day: 'numeric' })} - ${formatDisplayDate(weekEndKey, { month: 'short', day: 'numeric' })}`;
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

const formatHourLabel = (hour) => {
  const whole = Math.floor(hour);
  const minute = Math.round((hour - whole) * 60);
  const suffix = whole >= 12 ? 'pm' : 'am';
  const displayHour = whole % 12 === 0 ? 12 : whole % 12;
  return minute ? `${displayHour}:${String(minute).padStart(2, '0')}${suffix}` : `${displayHour}${suffix}`;
};

const softenEventFill = (fill) => (
  `color-mix(in srgb, ${fill} 76%, white 24%)`
);

const Chevron = ({ dir = 'left', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left'
      ? <polyline points="15 18 9 12 15 6" />
      : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

const computeLayout = (evts) => {
  if (!evts.length) return new Map();
  const getOverlaps = (i) => evts
    .map((_, j) => j)
    .filter((j) => j !== i && evts[j].startHour < evts[i].endHour && evts[j].endHour > evts[i].startHour);
  const claimedAsSec = new Set();
  const secsOf = new Map();
  const byDur = evts.map((_, i) => i)
    .sort((a, b) => (
      (evts[b].endHour - evts[b].startHour) - (evts[a].endHour - evts[a].startHour)
      || evts[a].startHour - evts[b].startHour
    ));
  for (const i of byDur) {
    if (claimedAsSec.has(i)) continue;
    const secs = getOverlaps(i).filter((j) => !claimedAsSec.has(j) && !secsOf.has(j));
    secsOf.set(i, secs);
    secs.forEach((j) => claimedAsSec.add(j));
  }
  const result = new Map();
  for (let i = 0; i < evts.length; i += 1) {
    if (secsOf.has(i)) {
      result.set(i, { role: 'primary', totalSecondary: secsOf.get(i).length });
      continue;
    }
    let found = false;
    for (const [, secs] of secsOf) {
      const sIdx = secs.indexOf(i);
      if (sIdx >= 0) {
        result.set(i, { role: 'secondary', secondaryIndex: sIdx, totalSecondary: secs.length });
        found = true;
        break;
      }
    }
    if (!found) result.set(i, { role: 'primary', totalSecondary: 0 });
  }
  return result;
};

const useTimeScale = ({ dateKey, events, expandedEventId, expandedEmptyFolds }) => useMemo(() => {
  const rawFolds = [];
  for (const event of events || []) {
    const duration = event.endHour - event.startHour;
    if (duration < LONG_EVENT_FOLD_THRESHOLD_HOURS) continue;
    if ((event.id || '') === expandedEventId) continue;

    const foldStart = Math.max(SCHEDULE_START_HOUR, Math.ceil(event.startHour));
    const foldEnd = Math.min(SCHEDULE_END_HOUR + 1, Math.floor(event.endHour) - 1);

    if (foldEnd - foldStart >= 2) {
      rawFolds.push({ start: foldStart, end: foldEnd, type: 'event', eventId: event.id || '' });
    }
  }

  const getScanEndHour = () => {
    if (dateKey > TODAY_KEY) return SCHEDULE_START_HOUR;
    if (dateKey < TODAY_KEY) return SCHEDULE_END_HOUR + 1;
    const now = new Date();
    return Math.max(SCHEDULE_START_HOUR, Math.min(SCHEDULE_END_HOUR + 1, now.getHours()));
  };

  const scanEndHour = getScanEndHour();
  if (scanEndHour > SCHEDULE_START_HOUR) {
    const emptyHours = [];
    for (let hour = SCHEDULE_START_HOUR; hour < scanEndHour; hour += 1) {
      const isCovered = (events || []).some((event) => (
        event.startHour < hour + 1 && event.endHour > hour
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
      } else if (hour === prevHour + 1) {
        prevHour = hour;
      } else {
        flushRun();
        runStart = hour;
        prevHour = hour;
      }
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
}, [dateKey, events, expandedEmptyFolds, expandedEventId]);

const createTimeScaleFromFolds = (folds) => {
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
};

const useWeeklySharedTimeScale = ({ weekDays, expandedEmptyFolds }) => useMemo(() => {
  if (weekDays.length !== 7) {
    return createTimeScaleFromFolds([]);
  }

  const eligibleDays = weekDays.filter((day) => day.dateKey <= TODAY_KEY);
  if (!eligibleDays.length) return createTimeScaleFromFolds([]);

  const rawFolds = [];
  const foldableEventHours = [];
  const emptyHours = [];

  for (let hour = SCHEDULE_START_HOUR; hour <= SCHEDULE_END_HOUR; hour += 1) {
    const hourEnd = hour + 1;
    const daysWithAnyData = eligibleDays.filter((day) => (day.events || []).length > 0);
    const daysWithLongCoverage = daysWithAnyData.filter((day) => (
      (day.events || []).some((event) => (
        event.endHour - event.startHour >= LONG_EVENT_FOLD_THRESHOLD_HOURS
        && event.startHour < hourEnd
        && event.endHour > hour
      ))
    ));
    const daysWithConflictingData = daysWithAnyData.filter((day) => (
      !daysWithLongCoverage.includes(day)
      && (day.events || []).some((event) => event.startHour < hourEnd && event.endHour > hour)
    ));
    const hasEnoughSupport = daysWithLongCoverage.length >= Math.min(WEEKLY_LONG_EVENT_MIN_SUPPORT_DAYS, daysWithAnyData.length);
    if (hasEnoughSupport && daysWithConflictingData.length === 0) foldableEventHours.push(hour);

    const allKnownDaysEmpty = daysWithAnyData.every((day) => (
      !(day.events || []).some((event) => event.startHour < hourEnd && event.endHour > hour)
    ));
    if (daysWithAnyData.length > 0 && allKnownDaysEmpty) emptyHours.push(hour);
  }

  const pushEventRuns = (hours) => {
    let runStart = null;
    let prevHour = null;
    const flushRun = () => {
      if (runStart == null || prevHour == null) return;
      const foldStart = runStart;
      const foldEnd = prevHour + 1;
      if (foldEnd - foldStart >= 2) {
        rawFolds.push({ start: foldStart, end: foldEnd, type: 'event', foldId: `event:week:${foldStart}-${foldEnd}` });
      }
    };
    for (const hour of hours) {
      if (runStart == null) {
        runStart = hour;
        prevHour = hour;
      } else if (hour === prevHour + 1) {
        prevHour = hour;
      } else {
        flushRun();
        runStart = hour;
        prevHour = hour;
      }
    }
    flushRun();
  };

  const pushEmptyRuns = (hours) => {
    let runStart = null;
    let prevHour = null;
    const flushRun = () => {
      if (runStart == null || prevHour == null) return;
      const runLength = prevHour - runStart + 1;
      if (runLength > EMPTY_HOUR_FOLD_THRESHOLD_HOURS) {
        const foldStart = runStart + 1;
        const foldEnd = prevHour === SCHEDULE_END_HOUR ? prevHour + 1 : prevHour;
        const foldId = `empty:week:${foldStart}-${foldEnd}`;
        if (foldEnd > foldStart && !expandedEmptyFolds.has(foldId)) {
          rawFolds.push({ start: foldStart, end: foldEnd, type: 'empty', foldId });
        }
      }
    };
    for (const hour of hours) {
      if (runStart == null) {
        runStart = hour;
        prevHour = hour;
      } else if (hour === prevHour + 1) {
        prevHour = hour;
      } else {
        flushRun();
        runStart = hour;
        prevHour = hour;
      }
    }
    flushRun();
  };

  pushEventRuns(foldableEventHours);
  pushEmptyRuns(emptyHours);

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

  return createTimeScaleFromFolds(folds);
}, [expandedEmptyFolds, weekDays]);

const buildTimeRows = (timeScale) => {
  const rows = [];
  let h = SCHEDULE_START_HOUR;
  while (h <= SCHEDULE_END_HOUR) {
    const fold = timeScale.foldStartingAt(h);
    if (fold) {
      const label = h === 0 ? '12 am' : h === 12 ? 'noon' : h < 12 ? `${h} am` : `${h - 12} pm`;
      rows.push({ h, label, height: FOLD_MARKER_PX, folded: true, fold });
      h = fold.end;
      continue;
    }
    const label = h === 0 ? '12 am' : h === 12 ? 'noon' : h < 12 ? `${h} am` : `${h - 12} pm`;
    rows.push({ h, label, height: timeScale.hourHeight(h), folded: false });
    h += 1;
  }
  return rows;
};

const SharedTimeAxis = ({ rows, weekNumber, onExpandFold }) => (
  <aside style={{
    minWidth: 64,
    borderLeft: '1px solid var(--rule-soft)',
    display: 'flex',
    flexDirection: 'column',
  }}>
    <header style={{
      height: 76,
      padding: '12px 8px 10px',
      borderBottom: '1px solid var(--rule)',
      background: 'color-mix(in srgb, var(--paper-2) 88%, white 12%)',
    }}>
      <div className="eyebrow" style={{ fontSize: 8, letterSpacing: '0.14em' }}>Week {weekNumber}</div>
    </header>
    <section>
      {rows.map((row, i) => {
        const isLast = i === rows.length - 1;
        const canExpand = row.folded && row.fold && row.fold.foldId;
        return (
          <div
            key={row.h}
            style={{
              height: row.height,
              borderBottom: isLast ? 'none' : '1px solid var(--rule-soft)',
              background: row.folded ? 'rgba(178, 151, 124, 0.06)' : 'transparent',
              cursor: canExpand ? 'pointer' : 'default',
              padding: row.folded ? '5px 6px 0 8px' : '4px 6px 0 8px',
              boxSizing: 'border-box',
              position: 'relative',
            }}
            role={canExpand ? 'button' : undefined}
            tabIndex={canExpand ? 0 : undefined}
            onClick={canExpand ? () => onExpandFold(row.fold.foldId) : undefined}
            onKeyDown={canExpand ? (ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                onExpandFold(row.fold.foldId);
              }
            } : undefined}
          >
            <div style={{
              fontSize: 8,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink-4)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}>
              {row.label}
              {row.folded && <span style={{ display: 'block', fontSize: 7, opacity: 0.62 }}>(folded)</span>}
            </div>
          </div>
        );
      })}
    </section>
  </aside>
);

const viewSwitchLinkStyle = (active) => ({
  textDecoration: 'none',
});

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

const WeeklyDailyHeader = ({ weekStartKey, onPrev, onNext, isMobile }) => (
  <header style={{ marginBottom: isMobile ? 22 : 28 }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr',
      justifyItems: isMobile ? 'center' : 'stretch',
      alignItems: 'center',
      gap: 10,
      padding: isMobile ? '0' : '0 6px',
      rowGap: isMobile ? 12 : 0,
    }}>
      <div style={{ display: isMobile ? 'none' : 'block' }} />
      <nav className="pill-group" aria-label="Journal view tabs">
        <a className="pill" data-on={false} href={`Journal.html?view=daily&date=${weekStartKey}`} style={viewSwitchLinkStyle(false)}>Daily</a>
        <a className="pill" data-on href={`Journal.html?view=weekly&date=${weekStartKey}`} style={viewSwitchLinkStyle(true)}>Weekly Grid</a>
        <a className="pill" data-on={false} href={`Journal.html?view=monthly&date=${weekStartKey}`} style={viewSwitchLinkStyle(false)}>Monthly</a>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifySelf: isMobile ? 'center' : 'end' }}>
        <button type="button" className="icon-btn" onClick={onPrev} aria-label="Previous week" style={iconButtonStyle}>
          <Chevron dir="left" />
        </button>
        <span style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
          minWidth: 120,
          textAlign: 'center',
          fontWeight: 500,
        }}>
          Week {getWeekNumber(weekStartKey)} · {getISOWeek(weekStartKey).year}
        </span>
        <button type="button" className="icon-btn" onClick={onNext} aria-label="Next week" style={iconButtonStyle}>
          <Chevron dir="right" />
        </button>
      </div>
    </div>
  </header>
);

const DailyScheduleColumn = ({ dateKey, events, timeScale, rows }) => {
  const [expandedEventId, setExpandedEventId] = useState(null);
  const eventSignature = useMemo(() => (
    (events || []).map((event) => `${event.id || event.title}:${event.startHour}-${event.endHour}`).join('|')
  ), [events]);

  useEffect(() => {
    setExpandedEventId(null);
  }, [dateKey, eventSignature]);

  const layoutMap = computeLayout(events);
  const dayNumber = parseDateKey(dateKey).getUTCDate();
  const weekday = formatDisplayDate(dateKey, { weekday: 'short' });

  return (
    <article style={{
      minWidth: 188,
      borderLeft: '1px solid var(--rule-soft)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        height: 76,
        padding: '12px 12px 10px',
        borderBottom: '1px solid var(--rule)',
        background: 'color-mix(in srgb, var(--paper-2) 88%, white 12%)',
      }}>
        <div className="eyebrow" style={{ fontSize: 8.5, letterSpacing: '0.18em' }}>{weekday}</div>
        <div className="font-serif" style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 3 }}>
          <span style={{ fontSize: 34, lineHeight: 1, fontWeight: 500 }}>{dayNumber}</span>
          <sup style={{ fontSize: 13 }}>{getOrdinal(dayNumber)}</sup>
        </div>
      </header>

      <section style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
        {rows.map((row, i) => {
            const isLast = i === rows.length - 1;
            return (
              <div
                key={row.h}
                style={{
                  height: row.height,
                  borderBottom: isLast ? 'none' : '1px solid var(--rule-soft)',
                  background: row.folded ? 'rgba(178, 151, 124, 0.06)' : 'transparent',
                  position: 'relative',
                }}
              >
                {row.folded && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 8,
                    top: '50%',
                    borderTop: '1px dashed var(--rule)',
                  }} />
                )}
              </div>
            );
        })}

        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          overflow: 'visible',
          pointerEvents: 'none',
        }}>
          {(events || []).map((event, index) => {
            const cat = EVENT_CATEGORIES[event.categoryId] || { fill: '#eee', ink: '#333', label: event.categoryId };
            const eventId = event.id || `${dateKey}:${index}`;
            const note = String(event.note || '').trim();
            const tags = Array.isArray(event.tags) ? event.tags.filter(Boolean) : [];
            const hasDetails = Boolean(note || tags.length);
            const isExpanded = expandedEventId === eventId;
            const rawTop = timeScale.hourTop(event.startHour) - timeScale.hourTop(SCHEDULE_START_HOUR);
            const rawBottom = timeScale.hourTop(event.endHour) - timeScale.hourTop(SCHEDULE_START_HOUR);
            const top = Math.round(rawTop);
            const naturalHeight = Math.max(12, Math.round(rawBottom - rawTop) - SCHEDULE_EVENT_GAP_PX);
            const layout = layoutMap.get(index) || { role: 'primary', totalSecondary: 0 };
            const isSecondary = layout.role === 'secondary';
            const hh = DATA ? DATA.hourLabel : formatHourLabel;

            if (isSecondary) {
              const stickyHeight = isExpanded ? Math.max(naturalHeight + 42, note ? 132 : 96) : 22;
              return (
                <div
                  key={eventId}
                  title={event.title}
                  style={{
                    position: 'absolute',
                    right: 10,
                    width: 58,
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
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    gap: isExpanded ? 5 : 0,
                    padding: isExpanded ? '8px 8px 10px' : '0 8px',
                    transform: `rotate(${(layout.secondaryIndex || 0) % 2 === 0 ? -1.2 : 1.2}deg)`,
                  }}
                  onClick={() => setExpandedEventId((cur) => (cur === eventId ? null : eventId))}
                  role={hasDetails ? 'button' : undefined}
                  tabIndex={hasDetails ? 0 : undefined}
                  aria-expanded={hasDetails ? isExpanded : undefined}
                >
                  <span style={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: cat.ink,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    display: 'block',
                  }}>
                    {event.title}
                  </span>
                  {!isExpanded && (
                    <span style={{ fontSize: 8, opacity: 0.6, display: 'block', lineHeight: 1.2 }}>
                      {event.durationMinutes >= 60
                        ? `${Math.floor(event.durationMinutes / 60)}h${event.durationMinutes % 60 ? ` ${event.durationMinutes % 60}m` : ''}`
                        : `${event.durationMinutes}m`}
                    </span>
                  )}
                  {isExpanded && note && (
                    <span style={{
                      fontSize: 9,
                      lineHeight: 1.3,
                      opacity: 0.78,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 7,
                    }}>
                      {note}
                    </span>
                  )}
                </div>
              );
            }

            const height = isExpanded ? Math.max(naturalHeight, note ? 108 : 70) : naturalHeight;
            const duration = event.endHour - event.startHour;
            const compact = (duration < 0.8 || naturalHeight < 44) && !isExpanded;
            const canPreviewDetails = note && naturalHeight >= 72;
            const primaryHasSecondary = layout.totalSecondary > 0;
            const contentMaxWidth = primaryHasSecondary && !compact ? 'calc(66% - 8px)' : '100%';

            return (
              <div
                key={eventId}
                style={{
                  position: 'absolute',
                  left: 5,
                  right: 5,
                  top,
                  height,
                  background: cat.fill,
                  color: cat.ink,
                  borderRadius: 6,
                  padding: compact ? '2px 7px' : '6px 8px',
                  fontSize: 11,
                  lineHeight: 1.25,
                  display: 'flex',
                  flexDirection: compact ? 'row' : 'column',
                  justifyContent: compact ? 'space-between' : 'flex-start',
                  alignItems: compact ? 'center' : 'flex-start',
                  gap: 3,
                  overflow: 'hidden',
                  pointerEvents: 'auto',
                  zIndex: isExpanded ? 10 : 1,
                  cursor: hasDetails ? 'pointer' : 'default',
                }}
                role={hasDetails ? 'button' : undefined}
                tabIndex={hasDetails ? 0 : undefined}
                aria-expanded={hasDetails ? isExpanded : undefined}
                onClick={hasDetails ? () => setExpandedEventId((cur) => (cur === eventId ? null : eventId)) : undefined}
              >
                <span style={{
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: contentMaxWidth,
                  minWidth: 0,
                }}>
                  {event.title}
                </span>
                <span style={{
                  fontSize: 9,
                  opacity: 0.75,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  maxWidth: contentMaxWidth,
                  minWidth: 0,
                  flexShrink: compact ? 0 : 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {hh(event.startHour)} – {hh(event.endHour)}{' · '}
                  {event.durationMinutes >= 60
                    ? `${Math.floor(event.durationMinutes / 60)}h${event.durationMinutes % 60 ? ` ${event.durationMinutes % 60}m` : ''}`
                    : `${event.durationMinutes}m`}
                </span>
                {!isExpanded && !canPreviewDetails && hasDetails && !compact && (
                  <span style={{ fontSize: 9, opacity: 0.72, fontStyle: 'italic', maxWidth: contentMaxWidth }}>tap for details</span>
                )}
                {(canPreviewDetails || isExpanded) && note && (
                  <span style={{
                    fontSize: 9.5,
                    lineHeight: 1.3,
                    opacity: 0.88,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: isExpanded ? 6 : 2,
                    maxWidth: contentMaxWidth,
                  }}>
                    {note}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </article>
  );
};

const WeeklyDailyApp = () => {
  const latestDateKey = useMemo(() => {
    const keys = Object.keys((DATA && DATA.journal && DATA.journal.day) || {}).sort();
    return keys[keys.length - 1] || TODAY_KEY;
  }, []);
  const requestedDateKey = QUERY_PARAMS.get('date');
  const initialWeekStartKey = requestedDateKey && /^\d{4}-\d{2}-\d{2}$/.test(requestedDateKey)
    ? getWeekStartKey(requestedDateKey)
    : getWeekStartKey(latestDateKey);
  const [weekStartKey, setWeekStartKey] = useState(initialWeekStartKey);
  const [expandedEmptyFolds, setExpandedEmptyFolds] = useState(() => new Set());
  const [isMobile, setIsMobile] = useState(getIsMobileViewport);
  const weekDays = useMemo(() => (
    Array.from({ length: 7 }, (_, index) => {
      const dateKey = addDays(weekStartKey, index);
      const day = DATA && DATA.journal && DATA.journal.day && DATA.journal.day[dateKey];
      return { dateKey, events: (day && day.events) || (DATA && DATA.eventsByDay && DATA.eventsByDay[dateKey]) || [] };
    })
  ), [weekStartKey]);
  const sharedTimeScale = useWeeklySharedTimeScale({ weekDays, expandedEmptyFolds });
  const sharedRows = useMemo(() => buildTimeRows(sharedTimeScale), [sharedTimeScale]);

  useEffect(() => {
    setExpandedEmptyFolds(new Set());
  }, [weekStartKey]);

  useEffect(() => {
    const onResize = () => setIsMobile(getIsMobileViewport());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const expandSharedFold = (foldId) => {
    setExpandedEmptyFolds((current) => {
      const next = new Set(current);
      next.add(foldId);
      return next;
    });
  };

  return (
    <main style={{ minHeight: '100vh', padding: isMobile ? '20px 14px 40px' : '40px 28px 80px', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 1460, margin: '0 auto' }}>
        <RepositoryHeader isMobile={isMobile} />
        <WeeklyDailyHeader
          weekStartKey={weekStartKey}
          onPrev={() => setWeekStartKey(addDays(weekStartKey, -7))}
          onNext={() => setWeekStartKey(addDays(weekStartKey, 7))}
          isMobile={isMobile}
        />

        <section className="paper-surface page-shadow" style={{
          borderRadius: isMobile ? 10 : 14,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          maxWidth: '100%',
          border: '1px solid var(--rule-soft)',
        }}>
          <div style={{
            minWidth: 1380,
            display: 'grid',
            gridTemplateColumns: '64px repeat(7, minmax(188px, 1fr))',
          }}>
            <SharedTimeAxis rows={sharedRows} weekNumber={getWeekNumber(weekStartKey)} onExpandFold={expandSharedFold} />
            {weekDays.map((day) => (
              <DailyScheduleColumn
                key={day.dateKey}
                dateKey={day.dateKey}
                events={day.events}
                timeScale={sharedTimeScale}
                rows={sharedRows}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

const iconButtonStyle = {
  appearance: 'none',
  border: 0,
  borderRadius: 999,
  background: 'transparent',
  color: 'var(--ink-3)',
  width: 28,
  height: 28,
  display: 'inline-grid',
  placeItems: 'center',
  padding: 0,
  cursor: 'pointer',
};

ReactDOM.createRoot(document.getElementById('weekly-root')).render(<WeeklyDailyApp />);
