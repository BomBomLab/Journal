import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const repoRoot = new URL('..', import.meta.url);
const privateDir = path.join(new URL('.', repoRoot).pathname, 'data', 'private-source');
const publicDir = path.join(new URL('.', repoRoot).pathname, 'data', 'public');
const publicDiaryDir = path.join(publicDir, 'diary');

const privateTimelinePath = process.env.JOURNAL_PRIVATE_TIMELINE_STATE
  || path.join(os.homedir(), '.cyberboss', 'timeline', 'timeline-state.json');
const privateTodosPath = process.env.JOURNAL_PRIVATE_TODOS
  || path.join(os.homedir(), '.cyberboss', 'todos.json');

const TODO_TEMPLATES = [
  'reply messages',
  'review notes',
  'finish admin',
  'plan next steps',
  'reading block',
  'exercise',
  'errands',
  'tidy desk',
];

const EVENT_NODE_TITLES = {
  'evt.breakfast': 'Breakfast',
  'evt.lunch': 'Lunch',
  'evt.dinner': 'Dinner',
  'evt.shower': 'Shower',
  'evt.cleanup': 'Cleanup',
  'evt.commute': 'Commute',
  'evt.focus_coding': 'Deep Work',
  'evt.meeting': 'Meeting',
  'evt.reading': 'Reading',
  'evt.learning': 'Course Study',
  'evt.walk': 'Walk',
  'evt.workout': 'Workout',
  'evt.watch_show': 'Movie',
  'evt.short_video': 'Short Videos',
  'evt.phone_scroll': 'Phone Scroll',
  'evt.headache_rest': 'Recovery',
  'evt.medication': 'Medication',
  'evt.hospital_visit': 'Medical Visit',
  'evt.chatting': 'Coffee Chat',
  'evt.sleep': 'Sleep',
  'evt.nap': 'Nap',
};

const SUBCATEGORY_TITLES = {
  'life.meal': 'Meal',
  'life.hygiene': 'Shower',
  'life.chores': 'Cleanup',
  'life.shopping': 'Shopping',
  'life.errand': 'Errand',
  'life.other': 'Admin',
  'work.coding': 'Deep Work',
  'work.meeting': 'Meeting',
  'work.writing': 'Writing',
  'work.communication': 'Messages',
  'work.other': 'Work Block',
  'study.reading': 'Reading',
  'study.course': 'Course Study',
  'study.practice': 'Practice',
  'study.review': 'Review',
  'study.other': 'Study Block',
  'exercise.walk': 'Walk',
  'exercise.workout': 'Workout',
  'exercise.stretch': 'Stretch',
  'exercise.other': 'Exercise Block',
  'entertainment.video': 'Movie',
  'entertainment.game': 'Game',
  'entertainment.social_media': 'Social Scroll',
  'entertainment.music': 'Music',
  'entertainment.other': 'Entertainment',
  'health.rest': 'Recovery',
  'health.medication': 'Medication',
  'health.pain': 'Symptom Care',
  'health.hospital': 'Medical Visit',
  'health.other': 'Health Block',
  'social.chat': 'Coffee Chat',
  'social.call': 'Call',
  'social.family': 'Family Time',
  'social.other': 'Social Time',
  'care.pet': 'Pet Care',
  'care.household': 'Household Care',
  'care.self': 'Self Care',
  'care.other': 'Care Block',
  'travel.commute': 'Commute',
  'travel.transit': 'Transit',
  'travel.other': 'Travel',
  'rest.sleep': 'Sleep',
  'rest.nap': 'Nap',
  'rest.idle': 'Idle Time',
  'rest.other': 'Rest',
};

const CATEGORY_TITLES = {
  life: 'Life Block',
  work: 'Work Block',
  study: 'Study Block',
  exercise: 'Exercise Block',
  entertainment: 'Leisure Block',
  health: 'Health Block',
  social: 'Social Time',
  care: 'Care Block',
  travel: 'Travel',
  rest: 'Rest',
};

const PUBLIC_MONTH_KEY = '2026-04';
const FEATURED_WEEK_DATES = new Set([
  '2026-04-21',
  '2026-04-22',
  '2026-04-23',
  '2026-04-24',
  '2026-04-25',
  '2026-04-26',
  '2026-04-27',
]);

const FEATURED_WEEK_TEMPLATES = {
  '2026-04-21': [
    ['evt.commute', 'travel', 'travel.commute', '2026-04-21T08:25', '2026-04-21T09:05'],
    ['evt.focus_coding', 'work', 'work.coding', '2026-04-21T09:30', '2026-04-21T11:50'],
    ['evt.lunch', 'life', 'life.meal', '2026-04-21T12:15', '2026-04-21T12:55'],
    ['evt.focus_coding', 'work', 'work.coding', '2026-04-21T13:20', '2026-04-21T16:30'],
    ['evt.workout', 'exercise', 'exercise.workout', '2026-04-21T19:10', '2026-04-21T20:05'],
  ],
  '2026-04-22': [
    ['evt.sleep', 'rest', 'rest.sleep', '2026-04-22T00:40', '2026-04-22T07:35'],
    ['evt.chatting', 'social', 'social.chat', '2026-04-22T10:40', '2026-04-22T11:35'],
    ['evt.lunch', 'life', 'life.meal', '2026-04-22T12:10', '2026-04-22T12:45'],
    ['evt.focus_coding', 'work', 'work.coding', '2026-04-22T13:30', '2026-04-22T16:10'],
    ['evt.dinner', 'life', 'life.meal', '2026-04-22T18:45', '2026-04-22T19:20'],
  ],
  '2026-04-23': [
    ['evt.sleep', 'rest', 'rest.sleep', '2026-04-23T00:10', '2026-04-23T06:50'],
    ['evt.reading', 'study', 'study.reading', '2026-04-23T08:40', '2026-04-23T09:30'],
    ['evt.focus_coding', 'work', 'work.coding', '2026-04-23T10:10', '2026-04-23T12:00'],
    ['evt.lunch', 'life', 'life.meal', '2026-04-23T12:30', '2026-04-23T13:05'],
    ['evt.walk', 'exercise', 'exercise.walk', '2026-04-23T18:10', '2026-04-23T18:55'],
  ],
  '2026-04-24': [
    ['evt.sleep', 'rest', 'rest.sleep', '2026-04-24T01:00', '2026-04-24T08:20'],
    ['evt.chatting', 'social', 'social.chat', '2026-04-24T09:40', '2026-04-24T10:20'],
    ['evt.lunch', 'life', 'life.meal', '2026-04-24T12:10', '2026-04-24T12:50'],
    ['evt.watch_show', 'entertainment', 'entertainment.video', '2026-04-24T13:30', '2026-04-24T14:25'],
    ['evt.focus_coding', 'work', 'work.coding', '2026-04-24T15:10', '2026-04-24T17:05'],
  ],
  '2026-04-25': [
    { eventNodeId: 'evt.sleep', categoryId: 'rest', subcategoryId: 'rest.sleep', startLocal: '2026-04-25T00:20', endLocal: '2026-04-25T06:40' },
    { eventNodeId: 'evt.workout', categoryId: 'exercise', subcategoryId: 'exercise.workout', startLocal: '2026-04-25T07:10', endLocal: '2026-04-25T08:25', title: 'Tennis' },
    { eventNodeId: 'evt.breakfast', categoryId: 'life', subcategoryId: 'life.meal', startLocal: '2026-04-25T08:35', endLocal: '2026-04-25T08:55' },
    { eventNodeId: 'evt.commute', categoryId: 'travel', subcategoryId: 'travel.commute', startLocal: '2026-04-25T09:05', endLocal: '2026-04-25T09:45' },
    { eventNodeId: 'evt.focus_coding', categoryId: 'work', subcategoryId: 'work.coding', startLocal: '2026-04-25T10:00', endLocal: '2026-04-25T12:10' },
    { eventNodeId: 'evt.meeting', categoryId: 'work', subcategoryId: 'work.meeting', startLocal: '2026-04-25T10:40', endLocal: '2026-04-25T11:15' },
    { eventNodeId: 'evt.lunch', categoryId: 'life', subcategoryId: 'life.meal', startLocal: '2026-04-25T12:20', endLocal: '2026-04-25T13:00' },
    { eventNodeId: 'evt.call', categoryId: 'social', subcategoryId: 'social.call', startLocal: '2026-04-25T12:35', endLocal: '2026-04-25T12:55' },
    { eventNodeId: 'evt.chatting', categoryId: 'social', subcategoryId: 'social.chat', startLocal: '2026-04-25T15:10', endLocal: '2026-04-25T16:05', title: 'Coffee Catch-up' },
    { eventNodeId: 'evt.meeting', categoryId: 'work', subcategoryId: 'work.communication', startLocal: '2026-04-25T15:25', endLocal: '2026-04-25T15:50', title: 'Messages' },
    { eventNodeId: 'evt.dinner', categoryId: 'life', subcategoryId: 'life.meal', startLocal: '2026-04-25T19:10', endLocal: '2026-04-25T19:50' },
  ],
  '2026-04-26': [
    ['evt.phone_scroll', 'entertainment', 'entertainment.social_media', '2026-04-26T00:40', '2026-04-26T01:05'],
    ['evt.sleep', 'rest', 'rest.sleep', '2026-04-26T01:20', '2026-04-26T09:10'],
    ['evt.shower', 'life', 'life.hygiene', '2026-04-26T09:40', '2026-04-26T10:00'],
    ['evt.focus_coding', 'work', 'work.coding', '2026-04-26T10:30', '2026-04-26T12:20'],
    ['evt.shopping', 'life', 'life.shopping', '2026-04-26T15:30', '2026-04-26T16:05'],
  ],
  '2026-04-27': [
    ['evt.sleep', 'rest', 'rest.sleep', '2026-04-27T00:50', '2026-04-27T08:05'],
    ['evt.commute', 'travel', 'travel.commute', '2026-04-27T08:30', '2026-04-27T09:00'],
    ['evt.breakfast', 'life', 'life.meal', '2026-04-27T09:15', '2026-04-27T09:35'],
    ['evt.focus_coding', 'work', 'work.other', '2026-04-27T10:20', '2026-04-27T12:10'],
    ['evt.lunch', 'life', 'life.meal', '2026-04-27T12:45', '2026-04-27T13:20'],
  ],
};

const MONTH_FILLER_DAY_TEMPLATES = [
  [
    ['evt.sleep', 'rest', 'rest.sleep', '00:35', '07:20'],
    ['evt.commute', 'travel', 'travel.commute', '08:10', '08:55'],
    ['evt.focus_coding', 'work', 'work.coding', '10:00', '12:10'],
    ['evt.lunch', 'life', 'life.meal', '12:25', '13:00'],
  ],
  [
    ['evt.reading', 'study', 'study.reading', '08:40', '09:30'],
    ['evt.focus_coding', 'work', 'work.coding', '10:15', '11:50'],
    ['evt.chatting', 'social', 'social.chat', '16:20', '17:05'],
  ],
  [
    ['evt.sleep', 'rest', 'rest.sleep', '01:00', '08:10'],
    ['evt.shower', 'life', 'life.hygiene', '09:00', '09:20'],
    ['evt.watch_show', 'entertainment', 'entertainment.video', '20:30', '21:40'],
  ],
  [
    ['evt.commute', 'travel', 'travel.commute', '08:25', '09:05'],
    ['evt.meeting', 'work', 'work.meeting', '10:00', '10:45'],
    ['evt.lunch', 'life', 'life.meal', '12:15', '12:50'],
    ['evt.workout', 'exercise', 'exercise.workout', '18:20', '19:10'],
  ],
  [
    ['evt.breakfast', 'life', 'life.meal', '08:30', '08:55'],
    ['evt.reading', 'study', 'study.reading', '09:30', '10:20'],
    ['evt.phone_scroll', 'entertainment', 'entertainment.social_media', '22:20', '22:50'],
  ],
  [
    ['evt.sleep', 'rest', 'rest.sleep', '00:20', '06:45'],
    ['evt.focus_coding', 'work', 'work.coding', '09:40', '12:30'],
    ['evt.dinner', 'life', 'life.meal', '19:10', '19:45'],
    ['evt.chatting', 'social', 'social.chat', '20:15', '21:00'],
  ],
  [
    ['evt.walk', 'exercise', 'exercise.walk', '07:50', '08:35'],
    ['evt.lunch', 'life', 'life.meal', '12:20', '12:55'],
    ['evt.cleanup', 'life', 'life.chores', '17:40', '18:05'],
    ['evt.watch_show', 'entertainment', 'entertainment.video', '21:00', '22:05'],
  ],
  [
    ['evt.commute', 'travel', 'travel.transit', '09:10', '09:50'],
    ['evt.learning', 'study', 'study.course', '11:00', '12:00'],
    ['evt.hospital_visit', 'health', 'health.hospital', '15:30', '16:20'],
  ],
];

function ensureDir(dir) {
  return fs.mkdir(dir, { recursive: true });
}

function genericEventTitle(event, index) {
  return EVENT_NODE_TITLES[event.eventNodeId]
    || SUBCATEGORY_TITLES[event.subcategoryId]
    || CATEGORY_TITLES[event.categoryId]
    || `Event ${index + 1}`;
}

function toGenericNote(title, event) {
  const minutes = Math.max(1, Math.round((new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / 60000));
  if (minutes <= 20) return `${title} landed as a short ${event.categoryId} block.`;
  if (minutes <= 90) return `${title} filled a focused ${minutes}-minute block.`;
  return `${title} covered a longer stretch of the day.`;
}

function tagify(title, categoryId) {
  const core = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return [categoryId, core].filter(Boolean);
}

function hourParts(isoUtc) {
  const date = new Date(new Date(isoUtc).getTime() + 8 * 60 * 60 * 1000);
  return {
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}

function formatTime(isoUtc) {
  const { hour, minute } = hourParts(isoUtc);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function dayParts(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function buildDiaryMarkdown(dateKey, events) {
  const amTitles = [];
  const pmTitles = [];
  const entryBlocks = [];
  events.forEach((event, index) => {
    const title = event.title;
    const block = `${formatTime(event.startAt)} ${title}\n\nA generic ${event.categoryId} block stayed on the record here for the public sample.`;
    entryBlocks.push(`## ${block}`);
    const bucket = hourParts(event.startAt).hour < 12 ? amTitles : pmTitles;
    if (!bucket.includes(title)) bucket.push(title);
    if (index === 0 && bucket.length === 0) bucket.push(title);
  });
  const amSummary = amTitles.length ? `Morning moved through ${amTitles.slice(0, 3).join(', ')}.` : '_Not updated yet._';
  const pmSummary = pmTitles.length ? `Afternoon and evening focused on ${pmTitles.slice(0, 3).join(', ')}.` : '_Not updated yet._';
  return `## Summary\n\n### AM\n\n${amSummary}\n\n### PM\n\n${pmSummary}\n\n## Entries\n\n${entryBlocks.join('\n\n')}\n`;
}

function toUtcIso(localIsoLike) {
  const withSeconds = localIsoLike.length === 16 ? `${localIsoLike}:00` : localIsoLike;
  return new Date(`${withSeconds}+08:00`).toISOString();
}

function createSyntheticEvent({ dateKey, eventNodeId, categoryId, subcategoryId, startLocal, endLocal, index, titleOverride = '' }) {
  const title = titleOverride
    || EVENT_NODE_TITLES[eventNodeId]
    || SUBCATEGORY_TITLES[subcategoryId]
    || CATEGORY_TITLES[categoryId]
    || `Event ${index + 1}`;
  const startAt = toUtcIso(startLocal);
  const endAt = toUtcIso(endLocal);
  const event = {
    id: `synthetic:${dateKey}:${eventNodeId}:${index}`,
    startAt,
    endAt,
    title,
    note: '',
    categoryId,
    subcategoryId,
    eventNodeId,
    tags: [],
    confidence: 0.35,
    sourceMessageIds: [],
  };
  event.note = toGenericNote(title, event);
  event.tags = tagify(title, categoryId);
  return event;
}

function generateFeaturedWeekEvents(dateKey) {
  const template = FEATURED_WEEK_TEMPLATES[dateKey] || [];
  return template.map((entry, index) => {
    if (Array.isArray(entry)) {
      const [eventNodeId, categoryId, subcategoryId, startLocal, endLocal] = entry;
      return createSyntheticEvent({
        dateKey,
        eventNodeId,
        categoryId,
        subcategoryId,
        startLocal,
        endLocal,
        index,
      });
    }
    return createSyntheticEvent({
      dateKey,
      eventNodeId: entry.eventNodeId,
      categoryId: entry.categoryId,
      subcategoryId: entry.subcategoryId,
      startLocal: entry.startLocal,
      endLocal: entry.endLocal,
      index,
      titleOverride: entry.title || '',
    });
  });
}

function generateMonthlyFillerEvents(dateKey, index) {
  const template = MONTH_FILLER_DAY_TEMPLATES[index % MONTH_FILLER_DAY_TEMPLATES.length];
  return template.map(([eventNodeId, categoryId, subcategoryId, startHm, endHm], eventIndex) => (
    createSyntheticEvent({
      dateKey,
      eventNodeId,
      categoryId,
      subcategoryId,
      startLocal: `${dateKey}T${startHm}`,
      endLocal: `${dateKey}T${endHm}`,
      index: eventIndex,
    })
  ));
}

function listMonthDates(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const result = [];
  const date = new Date(Date.UTC(year, month - 1, 1));
  while (date.getUTCMonth() === month - 1) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    result.push(`${y}-${m}-${d}`);
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return result;
}

function enrichPublicSampleTimeline(timeline, todos) {
  const facts = timeline.facts || {};
  const monthDates = listMonthDates(PUBLIC_MONTH_KEY);

  monthDates.forEach((dateKey, index) => {
    const events = FEATURED_WEEK_DATES.has(dateKey)
      ? generateFeaturedWeekEvents(dateKey)
      : generateMonthlyFillerEvents(dateKey, index);

    if (!events.length) {
      return;
    }

    facts[dateKey] = {
      status: 'draft',
      updatedAt: `${dateKey}T12:00:00.000Z`,
      source: null,
      events,
    };

    if (!Array.isArray(todos[dateKey])) {
      todos[dateKey] = [{
        text: TODO_TEMPLATES[index % TODO_TEMPLATES.length],
        status: index % 3 === 0 ? 'done' : 'open',
        source: 'sanitized-sample',
      }];
    }
  });

  timeline.facts = Object.fromEntries(
    Object.entries(facts).sort(([left], [right]) => left.localeCompare(right))
  );
}

function overwriteFeaturedWhiteCollarDay(timeline, todos) {
  const dateKey = '2026-04-25';
  const entries = [
    { eventNodeId: 'evt.sleep', categoryId: 'rest', subcategoryId: 'rest.sleep', startLocal: '2026-04-25T00:30', endLocal: '2026-04-25T06:50' },
    { eventNodeId: 'evt.workout', categoryId: 'exercise', subcategoryId: 'exercise.workout', startLocal: '2026-04-25T07:15', endLocal: '2026-04-25T08:20', title: 'Tennis' },
    { eventNodeId: 'evt.breakfast', categoryId: 'life', subcategoryId: 'life.meal', startLocal: '2026-04-25T08:35', endLocal: '2026-04-25T08:55' },
    { eventNodeId: 'evt.commute', categoryId: 'travel', subcategoryId: 'travel.commute', startLocal: '2026-04-25T09:05', endLocal: '2026-04-25T09:45' },
    { eventNodeId: 'evt.focus_coding', categoryId: 'work', subcategoryId: 'work.coding', startLocal: '2026-04-25T10:00', endLocal: '2026-04-25T12:10' },
    { eventNodeId: 'evt.meeting', categoryId: 'work', subcategoryId: 'work.meeting', startLocal: '2026-04-25T10:40', endLocal: '2026-04-25T11:15' },
    { eventNodeId: 'evt.lunch', categoryId: 'life', subcategoryId: 'life.meal', startLocal: '2026-04-25T12:20', endLocal: '2026-04-25T13:00' },
    { eventNodeId: 'evt.call', categoryId: 'social', subcategoryId: 'social.call', startLocal: '2026-04-25T12:35', endLocal: '2026-04-25T12:55' },
    { eventNodeId: 'evt.chatting', categoryId: 'social', subcategoryId: 'social.chat', startLocal: '2026-04-25T15:10', endLocal: '2026-04-25T16:05', title: 'Coffee Catch-up' },
    { eventNodeId: 'evt.meeting', categoryId: 'work', subcategoryId: 'work.communication', startLocal: '2026-04-25T15:25', endLocal: '2026-04-25T15:50', title: 'Messages' },
    { eventNodeId: 'evt.dinner', categoryId: 'life', subcategoryId: 'life.meal', startLocal: '2026-04-25T19:10', endLocal: '2026-04-25T19:50' },
  ];
  timeline.facts[dateKey] = {
    status: 'draft',
    updatedAt: `${dateKey}T12:00:00.000Z`,
    source: null,
    events: entries.map((entry, index) => createSyntheticEvent({
      dateKey,
      eventNodeId: entry.eventNodeId,
      categoryId: entry.categoryId,
      subcategoryId: entry.subcategoryId,
      startLocal: entry.startLocal,
      endLocal: entry.endLocal,
      index,
      titleOverride: entry.title || '',
    })),
  };
  todos[dateKey] = [
    { text: 'reply messages', status: 'done', source: 'sanitized-sample' },
    { text: 'review notes', status: 'open', source: 'sanitized-sample' },
    { text: 'finish admin', status: 'open', source: 'sanitized-sample' },
  ];
}

function overwriteLongFoldTestDays(timeline) {
  const dayTemplates = {
    '2026-04-28': [
      { eventNodeId: 'evt.workout', categoryId: 'exercise', subcategoryId: 'exercise.other', startLocal: '2026-04-28T07:30', endLocal: '2026-04-28T12:10', title: 'Cycling' },
      { eventNodeId: 'evt.lunch', categoryId: 'life', subcategoryId: 'life.meal', startLocal: '2026-04-28T12:25', endLocal: '2026-04-28T13:00' },
      { eventNodeId: 'evt.chatting', categoryId: 'social', subcategoryId: 'social.chat', startLocal: '2026-04-28T16:20', endLocal: '2026-04-28T17:05' },
      { eventNodeId: 'evt.watch_show', categoryId: 'entertainment', subcategoryId: 'entertainment.video', startLocal: '2026-04-28T21:00', endLocal: '2026-04-28T22:05' },
    ],
    '2026-04-29': [
      { eventNodeId: 'evt.breakfast', categoryId: 'life', subcategoryId: 'life.meal', startLocal: '2026-04-29T08:30', endLocal: '2026-04-29T08:55' },
      { eventNodeId: 'evt.focus_coding', categoryId: 'work', subcategoryId: 'work.coding', startLocal: '2026-04-29T10:00', endLocal: '2026-04-29T15:30' },
      { eventNodeId: 'evt.walk', categoryId: 'exercise', subcategoryId: 'exercise.walk', startLocal: '2026-04-29T18:10', endLocal: '2026-04-29T18:55' },
      { eventNodeId: 'evt.dinner', categoryId: 'life', subcategoryId: 'life.meal', startLocal: '2026-04-29T19:20', endLocal: '2026-04-29T20:00' },
    ],
  };

  Object.entries(dayTemplates).forEach(([dateKey, entries]) => {
    timeline.facts[dateKey] = {
      status: 'draft',
      updatedAt: `${dateKey}T12:00:00.000Z`,
      source: null,
      events: entries.map((entry, index) => createSyntheticEvent({
        dateKey,
        eventNodeId: entry.eventNodeId,
        categoryId: entry.categoryId,
        subcategoryId: entry.subcategoryId,
        startLocal: entry.startLocal,
        endLocal: entry.endLocal,
        index,
        titleOverride: entry.title || '',
      })),
    };
  });
}

async function main() {
  await ensureDir(privateDir);
  await ensureDir(publicDiaryDir);
  const existingDiaryFiles = (await fs.readdir(publicDiaryDir).catch(() => []))
    .filter((file) => file.endsWith('.md'));
  await Promise.all(existingDiaryFiles.map((file) => fs.unlink(path.join(publicDiaryDir, file))));

  const [timelineStateText, todosText] = await Promise.all([
    fs.readFile(privateTimelinePath, 'utf8'),
    fs.readFile(privateTodosPath, 'utf8').catch(() => '{}'),
  ]);

  const privateTimeline = JSON.parse(timelineStateText);
  const privateTodos = JSON.parse(todosText);
  const sanitizedTimeline = {
    version: privateTimeline.version,
    timezone: privateTimeline.timezone,
    taxonomy: structuredClone(privateTimeline.taxonomy),
    facts: {},
    proposals: [],
  };
  const sanitizedTodos = {};
  const sanitizedDiary = {};

  for (const [dateKey, items] of Object.entries(privateTodos || {})) {
    sanitizedTodos[dateKey] = (items || []).map((item, index) => ({
      text: TODO_TEMPLATES[index % TODO_TEMPLATES.length],
      status: item.status || 'open',
      source: 'sanitized-sample',
    }));
  }

  enrichPublicSampleTimeline(sanitizedTimeline, sanitizedTodos);
  overwriteFeaturedWhiteCollarDay(sanitizedTimeline, sanitizedTodos);
  overwriteLongFoldTestDays(sanitizedTimeline);

  for (const [dateKey, bucket] of Object.entries(sanitizedTimeline.facts || {})) {
    sanitizedDiary[dateKey] = buildDiaryMarkdown(dateKey, bucket.events || []);
  }

  const taxonomyOnly = {
    version: sanitizedTimeline.version,
    timezone: sanitizedTimeline.timezone,
    taxonomy: sanitizedTimeline.taxonomy,
  };

  await Promise.all([
    fs.writeFile(path.join(publicDir, 'timeline-state.json'), JSON.stringify(sanitizedTimeline, null, 2) + '\n'),
    fs.writeFile(path.join(publicDir, 'timeline-facts.json'), JSON.stringify(sanitizedTimeline.facts || {}, null, 2) + '\n'),
    fs.writeFile(path.join(publicDir, 'timeline-taxonomy.json'), JSON.stringify(taxonomyOnly, null, 2) + '\n'),
    fs.writeFile(path.join(publicDir, 'todos.json'), JSON.stringify(sanitizedTodos, null, 2) + '\n'),
  ]);

  await Promise.all(
    Object.entries(sanitizedDiary).map(([dateKey, md]) => (
      fs.writeFile(path.join(publicDiaryDir, `${dateKey}.md`), md)
    ))
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
