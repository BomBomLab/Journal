export function buildJournalData({ timelineStateText, rawDiary, rawTodos, isSample = false }) {
  const TIMELINE = JSON.parse(timelineStateText);
  const TIMEZONE = TIMELINE.timezone || 'Asia/Shanghai';

  const CATEGORY_MAP = {};
  const SUBCATEGORY_MAP = {};
  const EVENT_NODE_MAP = {};
  for (const cat of TIMELINE.taxonomy.categories || []) {
    CATEGORY_MAP[cat.id] = { label: cat.label, color: cat.color };
    for (const sub of cat.children || []) {
      SUBCATEGORY_MAP[sub.id] = { label: sub.label, parentId: cat.id };
    }
  }
  for (const node of TIMELINE.taxonomy.eventNodes || []) {
    EVENT_NODE_MAP[node.id] = { label: node.label, parentId: node.parentId };
  }

  const CATEGORY_PALETTE = {
    life:          { label: 'Life',          fill: '#F4E7CE', ink: '#6d5a2d' },
    work:          { label: 'Work',          fill: '#BEDAE3', ink: '#3d5a64' },
    study:         { label: 'Study',         fill: '#C6DBDA', ink: '#3d5f5d' },
    exercise:      { label: 'Exercise',      fill: '#F3EA93', ink: '#6b6426' },
    entertainment: { label: 'Entertainment', fill: '#FFD1DB', ink: '#7a3e4c' },
    health:        { label: 'Health',        fill: '#C4D4B1', ink: '#4d5b3a' },
    social:        { label: 'Social',        fill: '#D3C7E6', ink: '#4b4266' },
    care:          { label: 'Care',          fill: '#ECD5E3', ink: '#6a4458' },
    travel:        { label: 'Travel',        fill: '#F1B598', ink: '#6d3a1e' },
    rest:          { label: 'Rest',          fill: '#FDECDF', ink: '#7a5a40' },
  };

  const SH_OFFSET_MIN = 8 * 60;
  const toShanghai = (isoUtc) => {
    const d = new Date(isoUtc);
    return new Date(d.getTime() + SH_OFFSET_MIN * 60 * 1000);
  };

  const shanghaiParts = (isoUtc) => {
    const d = toShanghai(isoUtc);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();
    return {
      dateKey: `${y}-${m}-${day}`,
      hour,
      minute,
      decimalHour: hour + minute / 60,
    };
  };

  const hourLabel = (h) => {
    const rounded = Math.round(h * 60) / 60;
    const hh = Math.floor(rounded);
    const mm = Math.round((rounded - hh) * 60);
    const suffix = hh >= 12 ? 'pm' : 'am';
    const h12 = ((hh + 11) % 12) + 1;
    return mm === 0 ? `${h12} ${suffix}` : `${h12}:${String(mm).padStart(2, '0')} ${suffix}`;
  };

  const eventsByDay = {};
  for (const [srcDateKey, bucket] of Object.entries(TIMELINE.facts || {})) {
    for (const f of bucket.events || []) {
      const startP = shanghaiParts(f.startAt);
      const endP = shanghaiParts(f.endAt);
      const common = {
        id: f.id,
        title: f.title,
        note: f.note,
        categoryId: f.categoryId,
        subcategoryId: f.subcategoryId,
        eventNodeId: f.eventNodeId,
        tags: f.tags || [],
        confidence: f.confidence,
        sourceDateKey: srcDateKey,
        startAtUtc: f.startAt,
        endAtUtc: f.endAt,
      };

      if (startP.dateKey === endP.dateKey) {
        let endHour = endP.decimalHour;
        if (endHour - startP.decimalHour < 0.05) {
          endHour = Math.min(24 - 1 / 3600, startP.decimalHour + 0.25);
        }
        (eventsByDay[startP.dateKey] ||= []).push({
          ...common,
          startHour: startP.decimalHour,
          endHour,
        });
      } else {
        (eventsByDay[startP.dateKey] ||= []).push({
          ...common,
          startHour: startP.decimalHour,
          endHour: 24,
          crossDay: 'start',
        });
        (eventsByDay[endP.dateKey] ||= []).push({
          ...common,
          startHour: 0,
          endHour: endP.decimalHour,
          crossDay: 'end',
        });
      }
    }
  }

  for (const k of Object.keys(eventsByDay)) {
    eventsByDay[k].sort((a, b) => a.startHour - b.startHour);
  }

  const parseDiaryDay = (md) => {
    if (!md) return { summary: '', periods: {}, entries: [] };
    const normalized = String(md).replace(/\r\n/g, '\n').trim();
    const summaryMatch = normalized.match(/## Summary\s*\n([\s\S]*?)(?:\n## Entries\b|$)/i);
    const entriesMatch = normalized.match(/## Entries\s*\n([\s\S]*)$/i);
    const periods = {};
    let summary = '';

    if (summaryMatch) {
      const section = summaryMatch[1];
      ['AM', 'PM'].forEach((period) => {
        const match = section.match(new RegExp(`### ${period}\\s*\\n([\\s\\S]*?)(?=\\n### (?:AM|PM)\\b|$)`, 'i'));
        const text = match ? match[1].trim() : '';
        if (text && text !== '_Not updated yet._') {
          periods[period] = text;
        }
      });
      summary = ['AM', 'PM'].map((period) => periods[period]).filter(Boolean).join('\n\n');
    }

    const entries = [];
    const entryBlock = entriesMatch ? entriesMatch[1].trim() : '';
    if (entryBlock) {
      const parts = entryBlock.split(/^## /gm).filter(Boolean);
      for (const part of parts) {
        const firstNl = part.indexOf('\n');
        const header = (firstNl >= 0 ? part.slice(0, firstNl) : part).trim();
        const body = (firstNl >= 0 ? part.slice(firstNl + 1) : '').trim();
        const m = header.match(/^(\d{1,2}):(\d{2})\s*(.*)$/);
        if (m) {
          entries.push({
            hour: parseInt(m[1], 10),
            minute: parseInt(m[2], 10),
            decimalHour: parseInt(m[1], 10) + parseInt(m[2], 10) / 60,
            title: m[3].trim(),
            body,
          });
        } else {
          entries.push({ hour: null, minute: null, decimalHour: null, title: header, body });
        }
      }
    }

    return { summary, periods, entries };
  };

  const DIARY_BY_DAY = {};
  const DIARY_SUMMARY_BY_DAY = {};
  for (const [dk, md] of Object.entries(rawDiary || {})) {
    const parsed = parseDiaryDay(md);
    DIARY_BY_DAY[dk] = parsed.entries;
    DIARY_SUMMARY_BY_DAY[dk] = parsed.summary;
  }

  const TODO_BY_DAY = rawTodos || {};

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

  const getWeekStartKey = (dateKey) => {
    const date = parseDateKey(dateKey);
    const day = date.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(dateKey, diff);
  };

  const splitSummaryHighlights = (text) => {
    const normalized = String(text || '').replace(/\n+/g, ' ').trim();
    if (!normalized) return [];
    const parts = normalized.match(/[^.!?。！？]+[.!?。！？]?/g) || [];
    return parts.map((line) => line.trim()).filter(Boolean);
  };

  const buildJournalTasks = (dateKey) => (
    ((TODO_BY_DAY[dateKey] || []).filter((item) => item.status !== 'dropped')).map((item) => ({
      text: item.text,
      done: item.status === 'done',
      status: item.status || 'open',
      source: item.source || '',
      note: item.note || '',
      sourceDateKey: dateKey,
      updatedAt: item.updatedAt || '',
      createdAt: item.createdAt || '',
    }))
  );

  const buildJournalSummary = (dateKey, events) => {
    const body = DIARY_SUMMARY_BY_DAY[dateKey] || '';
    const derived = body || (
      (events[0] && events[1])
        ? `${events[0].title} led the day, followed by ${events[1].title}.`
        : (events[0] ? `${events[0].title} took the main stretch of the day.` : '')
    );
    return {
      body: derived,
      highlights: splitSummaryHighlights(derived).slice(0, 3),
      sourceType: body ? 'diary' : (derived ? 'derived' : 'empty'),
    };
  };

  const buildJournal = () => {
    const dateKeys = Array.from(new Set([
      ...Object.keys(eventsByDay),
      ...Object.keys(DIARY_SUMMARY_BY_DAY),
      ...Object.keys(TODO_BY_DAY),
    ])).sort();
    const day = {};
    const week = {};
    const month = {};

    dateKeys.forEach((dateKey) => {
      const events = (eventsByDay[dateKey] || []).map((event) => ({
        ...event,
        durationMinutes: Math.round((event.endHour - event.startHour) * 60),
        displayTime: `${hourLabel(event.startHour)} - ${hourLabel(event.endHour)}`,
        color: (CATEGORY_PALETTE[event.categoryId] || {}).fill || '#eee',
      }));
      day[dateKey] = {
        scopeType: 'day',
        anchorDateKey: dateKey,
        rangeStartKey: dateKey,
        rangeEndKey: dateKey,
        events,
        tasks: buildJournalTasks(dateKey),
        summary: buildJournalSummary(dateKey, events),
      };
    });

    dateKeys.forEach((dateKey) => {
      const weekKey = getWeekStartKey(dateKey);
      if (!week[weekKey]) {
        const dates = Array.from({ length: 7 }, (_, index) => addDays(weekKey, index));
        const days = dates.map((dk) => {
          const dayEntry = day[dk] || {
            events: [],
            tasks: buildJournalTasks(dk),
            summary: buildJournalSummary(dk, []),
          };
          return {
            dateKey: dk,
            dayNumber: Number(dk.slice(8, 10)),
            weekday: parseDateKey(dk).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
            events: dayEntry.events,
            tasks: dayEntry.tasks,
            summaryText: dayEntry.summary.body,
            highlightEventTitle: dayEntry.events[0] ? dayEntry.events[0].title : '',
            metrics: {
              eventCount: dayEntry.events.length,
              taskCount: dayEntry.tasks.length,
            },
          };
        });
        const allEvents = days.flatMap((item) => item.events);
        week[weekKey] = {
          scopeType: 'week',
          anchorDateKey: weekKey,
          rangeStartKey: dates[0],
          rangeEndKey: dates[6],
          days,
          events: allEvents,
          tasks: days
            .flatMap((item) => item.tasks)
            .filter((task, index, array) => array.findIndex((candidate) => (
              candidate.text === task.text && candidate.sourceDateKey === task.sourceDateKey
            )) === index),
          priorities: allEvents
            .filter((event) => event.categoryId !== 'rest' && event.categoryId !== 'travel')
            .slice()
            .sort((a, b) => b.durationMinutes - a.durationMinutes)
            .slice(0, 3)
            .map((event) => event.title),
          notes: days
            .filter((item) => item.summaryText)
            .slice(0, 3)
            .map((item) => ({ dateKey: item.dateKey, text: item.summaryText })),
          summary: {
            body: days.map((item) => item.summaryText).filter(Boolean).slice(0, 3).join(' '),
            highlights: days.map((item) => item.summaryText).filter(Boolean).slice(0, 3),
            sourceType: 'mixed',
          },
        };
      }

      const monthKey = dateKey.slice(0, 7);
      if (!month[monthKey]) {
        const dates = dateKeys.filter((dk) => dk.startsWith(monthKey));
        const days = dates.map((dk) => {
          const dayEntry = day[dk];
          return {
            dateKey: dk,
            dayNumber: Number(dk.slice(8, 10)),
            events: dayEntry.events,
            tasks: dayEntry.tasks,
            categories: Array.from(new Set(dayEntry.events.map((event) => event.categoryId))),
            summaryText: dayEntry.summary.body,
          };
        });
        month[monthKey] = {
          scopeType: 'month',
          anchorDateKey: `${monthKey}-01`,
          rangeStartKey: dates[0] || `${monthKey}-01`,
          rangeEndKey: dates[dates.length - 1] || `${monthKey}-01`,
          days,
          tasks: days.flatMap((item) => item.tasks),
          summary: {
            body: days.map((item) => item.summaryText).filter(Boolean).slice(0, 4).join(' '),
            highlights: days.map((item) => item.summaryText).filter(Boolean).slice(0, 4),
            sourceType: 'mixed',
          },
        };
      }
    });

    return { day, week, month };
  };

  const journal = buildJournal();

  return {
    __isSample: Boolean(isSample),
    TIMEZONE,
    CATEGORY_MAP,
    SUBCATEGORY_MAP,
    EVENT_NODE_MAP,
    CATEGORY_PALETTE,
    eventsByDay,
    DIARY_BY_DAY,
    DIARY_SUMMARY_BY_DAY,
    TODO_BY_DAY,
    journal,
    hourLabel,
    getDay(dateKey) {
      return {
        events: eventsByDay[dateKey] || [],
        diary: DIARY_BY_DAY[dateKey] || [],
        diarySummary: DIARY_SUMMARY_BY_DAY[dateKey] || '',
        todos: TODO_BY_DAY[dateKey] || [],
      };
    },
    dateRange(startKey, endKey) {
      const a = parseDateKey(startKey);
      const b = parseDateKey(endKey);
      const out = [];
      for (let t = a.getTime(); t <= b.getTime(); t += 86400000) {
        out.push(formatDateKey(new Date(t)));
      }
      return out;
    },
    dominantCategory(dateKey) {
      const events = eventsByDay[dateKey] || [];
      if (!events.length) return null;
      const totals = {};
      for (const e of events) {
        totals[e.categoryId] = (totals[e.categoryId] || 0) + (e.endHour - e.startHour);
      }
      return Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];
    },
  };
}
