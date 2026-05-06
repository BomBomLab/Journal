var WeeklyDailyRuntime = (() => {
  // src/build-journal-data.js
  function buildJournalData({ timelineStateText: timelineStateText2, rawDiary: rawDiary2, rawTodos: rawTodos2, isSample = false }) {
    const TIMELINE = JSON.parse(timelineStateText2);
    const TIMEZONE = TIMELINE.timezone || "Asia/Shanghai";
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
      life: { label: "Life", fill: "#F4E7CE", ink: "#6d5a2d" },
      work: { label: "Work", fill: "#BEDAE3", ink: "#3d5a64" },
      study: { label: "Study", fill: "#C6DBDA", ink: "#3d5f5d" },
      exercise: { label: "Exercise", fill: "#F3EA93", ink: "#6b6426" },
      entertainment: { label: "Entertainment", fill: "#FFD1DB", ink: "#7a3e4c" },
      health: { label: "Health", fill: "#C4D4B1", ink: "#4d5b3a" },
      social: { label: "Social", fill: "#D3C7E6", ink: "#4b4266" },
      care: { label: "Care", fill: "#ECD5E3", ink: "#6a4458" },
      travel: { label: "Travel", fill: "#F1B598", ink: "#6d3a1e" },
      rest: { label: "Rest", fill: "#FDECDF", ink: "#7a5a40" }
    };
    const SH_OFFSET_MIN = 8 * 60;
    const toShanghai = (isoUtc) => {
      const d = new Date(isoUtc);
      return new Date(d.getTime() + SH_OFFSET_MIN * 60 * 1e3);
    };
    const shanghaiParts = (isoUtc) => {
      const d = toShanghai(isoUtc);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      const hour = d.getUTCHours();
      const minute = d.getUTCMinutes();
      return {
        dateKey: `${y}-${m}-${day}`,
        hour,
        minute,
        decimalHour: hour + minute / 60
      };
    };
    const hourLabel = (h) => {
      const rounded = Math.round(h * 60) / 60;
      const hh = Math.floor(rounded);
      const mm = Math.round((rounded - hh) * 60);
      const suffix = hh >= 12 ? "pm" : "am";
      const h12 = (hh + 11) % 12 + 1;
      return mm === 0 ? `${h12} ${suffix}` : `${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
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
          endAtUtc: f.endAt
        };
        if (startP.dateKey === endP.dateKey) {
          let endHour = endP.decimalHour;
          if (endHour - startP.decimalHour < 0.05) {
            endHour = Math.min(24 - 1 / 3600, startP.decimalHour + 0.25);
          }
          (eventsByDay[startP.dateKey] ||= []).push({
            ...common,
            startHour: startP.decimalHour,
            endHour
          });
        } else {
          (eventsByDay[startP.dateKey] ||= []).push({
            ...common,
            startHour: startP.decimalHour,
            endHour: 24,
            crossDay: "start"
          });
          (eventsByDay[endP.dateKey] ||= []).push({
            ...common,
            startHour: 0,
            endHour: endP.decimalHour,
            crossDay: "end"
          });
        }
      }
    }
    for (const k of Object.keys(eventsByDay)) {
      eventsByDay[k].sort((a, b) => a.startHour - b.startHour);
    }
    const parseDiaryDay = (md) => {
      if (!md) return { summary: "", periods: {}, entries: [] };
      const normalized = String(md).replace(/\r\n/g, "\n").trim();
      const summaryMatch = normalized.match(/## Summary\s*\n([\s\S]*?)(?:\n## Entries\b|$)/i);
      const entriesMatch = normalized.match(/## Entries\s*\n([\s\S]*)$/i);
      const periods = {};
      let summary = "";
      if (summaryMatch) {
        const section = summaryMatch[1];
        ["AM", "PM"].forEach((period) => {
          const match = section.match(new RegExp(`### ${period}\\s*\\n([\\s\\S]*?)(?=\\n### (?:AM|PM)\\b|$)`, "i"));
          const text = match ? match[1].trim() : "";
          if (text && text !== "_Not updated yet._") {
            periods[period] = text;
          }
        });
        summary = ["AM", "PM"].map((period) => periods[period]).filter(Boolean).join("\n\n");
      }
      const entries = [];
      const entryBlock = entriesMatch ? entriesMatch[1].trim() : "";
      if (entryBlock) {
        const parts = entryBlock.split(/^## /gm).filter(Boolean);
        for (const part of parts) {
          const firstNl = part.indexOf("\n");
          const header = (firstNl >= 0 ? part.slice(0, firstNl) : part).trim();
          const body = (firstNl >= 0 ? part.slice(firstNl + 1) : "").trim();
          const m = header.match(/^(\d{1,2}):(\d{2})\s*(.*)$/);
          if (m) {
            entries.push({
              hour: parseInt(m[1], 10),
              minute: parseInt(m[2], 10),
              decimalHour: parseInt(m[1], 10) + parseInt(m[2], 10) / 60,
              title: m[3].trim(),
              body
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
    for (const [dk, md] of Object.entries(rawDiary2 || {})) {
      const parsed = parseDiaryDay(md);
      DIARY_BY_DAY[dk] = parsed.entries;
      DIARY_SUMMARY_BY_DAY[dk] = parsed.summary;
    }
    const TODO_BY_DAY = rawTodos2 || {};
    const parseDateKey2 = (dateKey) => {
      const [y, m, d] = dateKey.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    };
    const formatDateKey2 = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    const addDays2 = (dateKey, days) => {
      const date = parseDateKey2(dateKey);
      date.setUTCDate(date.getUTCDate() + days);
      return formatDateKey2(date);
    };
    const getWeekStartKey2 = (dateKey) => {
      const date = parseDateKey2(dateKey);
      const day = date.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      return addDays2(dateKey, diff);
    };
    const splitSummaryHighlights = (text) => {
      const normalized = String(text || "").replace(/\n+/g, " ").trim();
      if (!normalized) return [];
      const parts = normalized.match(/[^.!?。！？]+[.!?。！？]?/g) || [];
      return parts.map((line) => line.trim()).filter(Boolean);
    };
    const buildJournalTasks = (dateKey) => (TODO_BY_DAY[dateKey] || []).filter((item) => item.status !== "dropped").map((item) => ({
      text: item.text,
      done: item.status === "done",
      status: item.status || "open",
      source: item.source || "",
      note: item.note || "",
      sourceDateKey: dateKey,
      updatedAt: item.updatedAt || "",
      createdAt: item.createdAt || ""
    }));
    const buildJournalSummary = (dateKey, events) => {
      const body = DIARY_SUMMARY_BY_DAY[dateKey] || "";
      const derived = body || (events[0] && events[1] ? `${events[0].title} led the day, followed by ${events[1].title}.` : events[0] ? `${events[0].title} took the main stretch of the day.` : "");
      return {
        body: derived,
        highlights: splitSummaryHighlights(derived).slice(0, 3),
        sourceType: body ? "diary" : derived ? "derived" : "empty"
      };
    };
    const buildJournal = () => {
      const dateKeys = Array.from(/* @__PURE__ */ new Set([
        ...Object.keys(eventsByDay),
        ...Object.keys(DIARY_SUMMARY_BY_DAY),
        ...Object.keys(TODO_BY_DAY)
      ])).sort();
      const day = {};
      const week = {};
      const month = {};
      dateKeys.forEach((dateKey) => {
        const events = (eventsByDay[dateKey] || []).map((event) => ({
          ...event,
          durationMinutes: Math.round((event.endHour - event.startHour) * 60),
          displayTime: `${hourLabel(event.startHour)} - ${hourLabel(event.endHour)}`,
          color: (CATEGORY_PALETTE[event.categoryId] || {}).fill || "#eee"
        }));
        day[dateKey] = {
          scopeType: "day",
          anchorDateKey: dateKey,
          rangeStartKey: dateKey,
          rangeEndKey: dateKey,
          events,
          tasks: buildJournalTasks(dateKey),
          summary: buildJournalSummary(dateKey, events)
        };
      });
      dateKeys.forEach((dateKey) => {
        const weekKey = getWeekStartKey2(dateKey);
        if (!week[weekKey]) {
          const dates = Array.from({ length: 7 }, (_, index) => addDays2(weekKey, index));
          const days = dates.map((dk) => {
            const dayEntry = day[dk] || {
              events: [],
              tasks: buildJournalTasks(dk),
              summary: buildJournalSummary(dk, [])
            };
            return {
              dateKey: dk,
              dayNumber: Number(dk.slice(8, 10)),
              weekday: parseDateKey2(dk).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
              events: dayEntry.events,
              tasks: dayEntry.tasks,
              summaryText: dayEntry.summary.body,
              highlightEventTitle: dayEntry.events[0] ? dayEntry.events[0].title : "",
              metrics: {
                eventCount: dayEntry.events.length,
                taskCount: dayEntry.tasks.length
              }
            };
          });
          const allEvents = days.flatMap((item) => item.events);
          week[weekKey] = {
            scopeType: "week",
            anchorDateKey: weekKey,
            rangeStartKey: dates[0],
            rangeEndKey: dates[6],
            days,
            events: allEvents,
            tasks: days.flatMap((item) => item.tasks).filter((task, index, array) => array.findIndex((candidate) => candidate.text === task.text && candidate.sourceDateKey === task.sourceDateKey) === index),
            priorities: allEvents.filter((event) => event.categoryId !== "rest" && event.categoryId !== "travel").slice().sort((a, b) => b.durationMinutes - a.durationMinutes).slice(0, 3).map((event) => event.title),
            notes: days.filter((item) => item.summaryText).slice(0, 3).map((item) => ({ dateKey: item.dateKey, text: item.summaryText })),
            summary: {
              body: days.map((item) => item.summaryText).filter(Boolean).slice(0, 3).join(" "),
              highlights: days.map((item) => item.summaryText).filter(Boolean).slice(0, 3),
              sourceType: "mixed"
            }
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
              summaryText: dayEntry.summary.body
            };
          });
          month[monthKey] = {
            scopeType: "month",
            anchorDateKey: `${monthKey}-01`,
            rangeStartKey: dates[0] || `${monthKey}-01`,
            rangeEndKey: dates[dates.length - 1] || `${monthKey}-01`,
            days,
            tasks: days.flatMap((item) => item.tasks),
            summary: {
              body: days.map((item) => item.summaryText).filter(Boolean).slice(0, 4).join(" "),
              highlights: days.map((item) => item.summaryText).filter(Boolean).slice(0, 4),
              sourceType: "mixed"
            }
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
          diarySummary: DIARY_SUMMARY_BY_DAY[dateKey] || "",
          todos: TODO_BY_DAY[dateKey] || []
        };
      },
      dateRange(startKey, endKey) {
        const a = parseDateKey2(startKey);
        const b = parseDateKey2(endKey);
        const out = [];
        for (let t = a.getTime(); t <= b.getTime(); t += 864e5) {
          out.push(formatDateKey2(new Date(t)));
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
      }
    };
  }

  // src/data.generated.js
  var timelineStateText = '{\n  "version": 1,\n  "timezone": "Asia/Shanghai",\n  "taxonomy": {\n    "categories": [\n      {\n        "id": "life",\n        "label": "Life",\n        "color": "var(--cat-life)",\n        "children": [\n          {\n            "id": "life.meal",\n            "label": "Meals"\n          },\n          {\n            "id": "life.hygiene",\n            "label": "Hygiene"\n          },\n          {\n            "id": "life.chores",\n            "label": "Chores"\n          },\n          {\n            "id": "life.shopping",\n            "label": "Shopping"\n          },\n          {\n            "id": "life.errand",\n            "label": "Errands"\n          },\n          {\n            "id": "life.other",\n            "label": "Other Life"\n          }\n        ]\n      },\n      {\n        "id": "work",\n        "label": "Work",\n        "color": "var(--cat-work)",\n        "children": [\n          {\n            "id": "work.coding",\n            "label": "Coding"\n          },\n          {\n            "id": "work.meeting",\n            "label": "Meetings"\n          },\n          {\n            "id": "work.writing",\n            "label": "Writing"\n          },\n          {\n            "id": "work.communication",\n            "label": "Communication"\n          },\n          {\n            "id": "work.other",\n            "label": "Other Work"\n          }\n        ]\n      },\n      {\n        "id": "study",\n        "label": "Study",\n        "color": "var(--cat-study)",\n        "children": [\n          {\n            "id": "study.reading",\n            "label": "Reading"\n          },\n          {\n            "id": "study.course",\n            "label": "Courses"\n          },\n          {\n            "id": "study.practice",\n            "label": "Practice"\n          },\n          {\n            "id": "study.review",\n            "label": "Review"\n          },\n          {\n            "id": "study.other",\n            "label": "Other Study"\n          }\n        ]\n      },\n      {\n        "id": "exercise",\n        "label": "Exercise",\n        "color": "var(--cat-exercise)",\n        "children": [\n          {\n            "id": "exercise.walk",\n            "label": "Walks"\n          },\n          {\n            "id": "exercise.workout",\n            "label": "Workouts"\n          },\n          {\n            "id": "exercise.stretch",\n            "label": "Stretching"\n          },\n          {\n            "id": "exercise.other",\n            "label": "Other Exercise"\n          }\n        ]\n      },\n      {\n        "id": "entertainment",\n        "label": "Entertainment",\n        "color": "var(--cat-entertainment)",\n        "children": [\n          {\n            "id": "entertainment.video",\n            "label": "Video"\n          },\n          {\n            "id": "entertainment.game",\n            "label": "Games"\n          },\n          {\n            "id": "entertainment.social_media",\n            "label": "Social Media"\n          },\n          {\n            "id": "entertainment.music",\n            "label": "Music"\n          },\n          {\n            "id": "entertainment.other",\n            "label": "Other Entertainment"\n          }\n        ]\n      },\n      {\n        "id": "health",\n        "label": "Health",\n        "color": "var(--cat-health)",\n        "children": [\n          {\n            "id": "health.rest",\n            "label": "Recovery"\n          },\n          {\n            "id": "health.medication",\n            "label": "Medication"\n          },\n          {\n            "id": "health.pain",\n            "label": "Symptom Care"\n          },\n          {\n            "id": "health.hospital",\n            "label": "Medical Visit"\n          },\n          {\n            "id": "health.other",\n            "label": "Other Health"\n          }\n        ]\n      },\n      {\n        "id": "social",\n        "label": "Social",\n        "color": "var(--cat-social)",\n        "children": [\n          {\n            "id": "social.chat",\n            "label": "Chat"\n          },\n          {\n            "id": "social.call",\n            "label": "Calls"\n          },\n          {\n            "id": "social.family",\n            "label": "Family Time"\n          },\n          {\n            "id": "social.other",\n            "label": "Other Social"\n          }\n        ]\n      },\n      {\n        "id": "care",\n        "label": "Care",\n        "color": "var(--cat-care)",\n        "children": [\n          {\n            "id": "care.pet",\n            "label": "Pet Care"\n          },\n          {\n            "id": "care.household",\n            "label": "Household Care"\n          },\n          {\n            "id": "care.self",\n            "label": "Self Care"\n          },\n          {\n            "id": "care.other",\n            "label": "Other Care"\n          }\n        ]\n      },\n      {\n        "id": "travel",\n        "label": "Travel",\n        "color": "var(--cat-travel)",\n        "children": [\n          {\n            "id": "travel.commute",\n            "label": "Commute"\n          },\n          {\n            "id": "travel.transit",\n            "label": "Transit"\n          },\n          {\n            "id": "travel.other",\n            "label": "Other Travel"\n          }\n        ]\n      },\n      {\n        "id": "rest",\n        "label": "Rest",\n        "color": "var(--cat-rest)",\n        "children": [\n          {\n            "id": "rest.sleep",\n            "label": "Sleep"\n          },\n          {\n            "id": "rest.nap",\n            "label": "Nap"\n          },\n          {\n            "id": "rest.idle",\n            "label": "Idle Time"\n          },\n          {\n            "id": "rest.other",\n            "label": "Other Rest"\n          }\n        ]\n      }\n    ],\n    "eventNodes": [\n      {\n        "id": "evt.breakfast",\n        "label": "Breakfast",\n        "aliases": [\n          "breakfast",\n          "morning meal"\n        ],\n        "parentId": "life.meal",\n        "status": "official"\n      },\n      {\n        "id": "evt.lunch",\n        "label": "Lunch",\n        "aliases": [\n          "lunch",\n          "midday meal"\n        ],\n        "parentId": "life.meal",\n        "status": "official"\n      },\n      {\n        "id": "evt.dinner",\n        "label": "Dinner",\n        "aliases": [\n          "dinner",\n          "evening meal"\n        ],\n        "parentId": "life.meal",\n        "status": "official"\n      },\n      {\n        "id": "evt.shower",\n        "label": "Shower",\n        "aliases": [\n          "shower",\n          "wash up"\n        ],\n        "parentId": "life.hygiene",\n        "status": "official"\n      },\n      {\n        "id": "evt.cleanup",\n        "label": "Cleanup",\n        "aliases": [\n          "room reset",\n          "tidying up"\n        ],\n        "parentId": "life.chores",\n        "status": "official"\n      },\n      {\n        "id": "evt.commute",\n        "label": "Commute",\n        "aliases": [\n          "commute",\n          "ride to work",\n          "ride home"\n        ],\n        "parentId": "travel.commute",\n        "status": "official"\n      },\n      {\n        "id": "evt.focus_coding",\n        "label": "Focused Coding",\n        "aliases": [\n          "coding",\n          "shipping code",\n          "implementation"\n        ],\n        "parentId": "work.coding",\n        "status": "official"\n      },\n      {\n        "id": "evt.meeting",\n        "label": "Meeting",\n        "aliases": [\n          "meeting",\n          "sync"\n        ],\n        "parentId": "work.meeting",\n        "status": "official"\n      },\n      {\n        "id": "evt.reading",\n        "label": "Reading",\n        "aliases": [\n          "reading",\n          "read a book"\n        ],\n        "parentId": "study.reading",\n        "status": "official"\n      },\n      {\n        "id": "evt.learning",\n        "label": "Course Study",\n        "aliases": [\n          "course",\n          "studying",\n          "lesson"\n        ],\n        "parentId": "study.course",\n        "status": "official"\n      },\n      {\n        "id": "evt.walk",\n        "label": "Walk",\n        "aliases": [\n          "walk",\n          "go for a walk"\n        ],\n        "parentId": "exercise.walk",\n        "status": "official"\n      },\n      {\n        "id": "evt.workout",\n        "label": "Workout",\n        "aliases": [\n          "workout",\n          "training"\n        ],\n        "parentId": "exercise.workout",\n        "status": "official"\n      },\n      {\n        "id": "evt.watch_show",\n        "label": "Watch a Show",\n        "aliases": [\n          "watching a show",\n          "tv time"\n        ],\n        "parentId": "entertainment.video",\n        "status": "official"\n      },\n      {\n        "id": "evt.short_video",\n        "label": "Short Video Scroll",\n        "aliases": [\n          "short videos",\n          "reels",\n          "scrolling videos"\n        ],\n        "parentId": "entertainment.social_media",\n        "status": "official"\n      },\n      {\n        "id": "evt.phone_scroll",\n        "label": "Phone Scroll",\n        "aliases": [\n          "phone scrolling",\n          "doomscrolling"\n        ],\n        "parentId": "entertainment.social_media",\n        "status": "official"\n      },\n      {\n        "id": "evt.headache_rest",\n        "label": "Headache Recovery",\n        "aliases": [\n          "resting with a headache"\n        ],\n        "parentId": "health.rest",\n        "status": "official"\n      },\n      {\n        "id": "evt.medication",\n        "label": "Medication",\n        "aliases": [\n          "taking medicine",\n          "medication"\n        ],\n        "parentId": "health.medication",\n        "status": "official"\n      },\n      {\n        "id": "evt.hospital_visit",\n        "label": "Medical Visit",\n        "aliases": [\n          "clinic visit",\n          "hospital visit",\n          "doctor appointment"\n        ],\n        "parentId": "health.hospital",\n        "status": "official"\n      },\n      {\n        "id": "evt.chatting",\n        "label": "Chat",\n        "aliases": [\n          "chatting",\n          "replying to messages"\n        ],\n        "parentId": "social.chat",\n        "status": "official"\n      },\n      {\n        "id": "evt.sleep",\n        "label": "Sleep",\n        "aliases": [\n          "sleep",\n          "went to sleep"\n        ],\n        "parentId": "rest.sleep",\n        "status": "official"\n      },\n      {\n        "id": "evt.nap",\n        "label": "Nap",\n        "aliases": [\n          "nap",\n          "power nap"\n        ],\n        "parentId": "rest.nap",\n        "status": "official"\n      }\n    ]\n  },\n  "facts": {\n    "2026-04-01": {\n      "status": "draft",\n      "updatedAt": "2026-04-01T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-01:evt.sleep:0",\n          "startAt": "2026-03-31T16:35:00.000Z",\n          "endAt": "2026-03-31T23:20:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-01:evt.commute:1",\n          "startAt": "2026-04-01T00:10:00.000Z",\n          "endAt": "2026-04-01T00:55:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 45-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.commute",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-01:evt.focus_coding:2",\n          "startAt": "2026-04-01T02:00:00.000Z",\n          "endAt": "2026-04-01T04:10:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-01:evt.lunch:3",\n          "startAt": "2026-04-01T04:25:00.000Z",\n          "endAt": "2026-04-01T05:00:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-02": {\n      "status": "draft",\n      "updatedAt": "2026-04-02T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-02:evt.reading:0",\n          "startAt": "2026-04-02T00:40:00.000Z",\n          "endAt": "2026-04-02T01:30:00.000Z",\n          "title": "Reading",\n          "note": "Reading filled a focused 50-minute block.",\n          "categoryId": "study",\n          "subcategoryId": "study.reading",\n          "eventNodeId": "evt.reading",\n          "tags": [\n            "study",\n            "reading"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-02:evt.focus_coding:1",\n          "startAt": "2026-04-02T02:15:00.000Z",\n          "endAt": "2026-04-02T03:50:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-02:evt.chatting:2",\n          "startAt": "2026-04-02T08:20:00.000Z",\n          "endAt": "2026-04-02T09:05:00.000Z",\n          "title": "Coffee Chat",\n          "note": "Coffee Chat filled a focused 45-minute block.",\n          "categoryId": "social",\n          "subcategoryId": "social.chat",\n          "eventNodeId": "evt.chatting",\n          "tags": [\n            "social",\n            "coffee-chat"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-03": {\n      "status": "draft",\n      "updatedAt": "2026-04-03T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-03:evt.sleep:0",\n          "startAt": "2026-04-02T17:00:00.000Z",\n          "endAt": "2026-04-03T00:10:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-03:evt.shower:1",\n          "startAt": "2026-04-03T01:00:00.000Z",\n          "endAt": "2026-04-03T01:20:00.000Z",\n          "title": "Shower",\n          "note": "Shower landed as a short life block.",\n          "categoryId": "life",\n          "subcategoryId": "life.hygiene",\n          "eventNodeId": "evt.shower",\n          "tags": [\n            "life",\n            "shower"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-03:evt.watch_show:2",\n          "startAt": "2026-04-03T12:30:00.000Z",\n          "endAt": "2026-04-03T13:40:00.000Z",\n          "title": "Movie",\n          "note": "Movie filled a focused 70-minute block.",\n          "categoryId": "entertainment",\n          "subcategoryId": "entertainment.video",\n          "eventNodeId": "evt.watch_show",\n          "tags": [\n            "entertainment",\n            "movie"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-04": {\n      "status": "draft",\n      "updatedAt": "2026-04-04T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-04:evt.commute:0",\n          "startAt": "2026-04-04T00:25:00.000Z",\n          "endAt": "2026-04-04T01:05:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 40-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.commute",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-04:evt.meeting:1",\n          "startAt": "2026-04-04T02:00:00.000Z",\n          "endAt": "2026-04-04T02:45:00.000Z",\n          "title": "Meeting",\n          "note": "Meeting filled a focused 45-minute block.",\n          "categoryId": "work",\n          "subcategoryId": "work.meeting",\n          "eventNodeId": "evt.meeting",\n          "tags": [\n            "work",\n            "meeting"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-04:evt.lunch:2",\n          "startAt": "2026-04-04T04:15:00.000Z",\n          "endAt": "2026-04-04T04:50:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-04:evt.workout:3",\n          "startAt": "2026-04-04T10:20:00.000Z",\n          "endAt": "2026-04-04T11:10:00.000Z",\n          "title": "Workout",\n          "note": "Workout filled a focused 50-minute block.",\n          "categoryId": "exercise",\n          "subcategoryId": "exercise.workout",\n          "eventNodeId": "evt.workout",\n          "tags": [\n            "exercise",\n            "workout"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-05": {\n      "status": "draft",\n      "updatedAt": "2026-04-05T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-05:evt.breakfast:0",\n          "startAt": "2026-04-05T00:30:00.000Z",\n          "endAt": "2026-04-05T00:55:00.000Z",\n          "title": "Breakfast",\n          "note": "Breakfast filled a focused 25-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.breakfast",\n          "tags": [\n            "life",\n            "breakfast"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-05:evt.reading:1",\n          "startAt": "2026-04-05T01:30:00.000Z",\n          "endAt": "2026-04-05T02:20:00.000Z",\n          "title": "Reading",\n          "note": "Reading filled a focused 50-minute block.",\n          "categoryId": "study",\n          "subcategoryId": "study.reading",\n          "eventNodeId": "evt.reading",\n          "tags": [\n            "study",\n            "reading"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-05:evt.phone_scroll:2",\n          "startAt": "2026-04-05T14:20:00.000Z",\n          "endAt": "2026-04-05T14:50:00.000Z",\n          "title": "Phone Scroll",\n          "note": "Phone Scroll filled a focused 30-minute block.",\n          "categoryId": "entertainment",\n          "subcategoryId": "entertainment.social_media",\n          "eventNodeId": "evt.phone_scroll",\n          "tags": [\n            "entertainment",\n            "phone-scroll"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-06": {\n      "status": "draft",\n      "updatedAt": "2026-04-06T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-06:evt.sleep:0",\n          "startAt": "2026-04-05T16:20:00.000Z",\n          "endAt": "2026-04-05T22:45:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-06:evt.focus_coding:1",\n          "startAt": "2026-04-06T01:40:00.000Z",\n          "endAt": "2026-04-06T04:30:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-06:evt.dinner:2",\n          "startAt": "2026-04-06T11:10:00.000Z",\n          "endAt": "2026-04-06T11:45:00.000Z",\n          "title": "Dinner",\n          "note": "Dinner filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.dinner",\n          "tags": [\n            "life",\n            "dinner"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-06:evt.chatting:3",\n          "startAt": "2026-04-06T12:15:00.000Z",\n          "endAt": "2026-04-06T13:00:00.000Z",\n          "title": "Coffee Chat",\n          "note": "Coffee Chat filled a focused 45-minute block.",\n          "categoryId": "social",\n          "subcategoryId": "social.chat",\n          "eventNodeId": "evt.chatting",\n          "tags": [\n            "social",\n            "coffee-chat"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-07": {\n      "status": "draft",\n      "updatedAt": "2026-04-07T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-07:evt.walk:0",\n          "startAt": "2026-04-06T23:50:00.000Z",\n          "endAt": "2026-04-07T00:35:00.000Z",\n          "title": "Walk",\n          "note": "Walk filled a focused 45-minute block.",\n          "categoryId": "exercise",\n          "subcategoryId": "exercise.walk",\n          "eventNodeId": "evt.walk",\n          "tags": [\n            "exercise",\n            "walk"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-07:evt.lunch:1",\n          "startAt": "2026-04-07T04:20:00.000Z",\n          "endAt": "2026-04-07T04:55:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-07:evt.cleanup:2",\n          "startAt": "2026-04-07T09:40:00.000Z",\n          "endAt": "2026-04-07T10:05:00.000Z",\n          "title": "Cleanup",\n          "note": "Cleanup filled a focused 25-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.chores",\n          "eventNodeId": "evt.cleanup",\n          "tags": [\n            "life",\n            "cleanup"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-07:evt.watch_show:3",\n          "startAt": "2026-04-07T13:00:00.000Z",\n          "endAt": "2026-04-07T14:05:00.000Z",\n          "title": "Movie",\n          "note": "Movie filled a focused 65-minute block.",\n          "categoryId": "entertainment",\n          "subcategoryId": "entertainment.video",\n          "eventNodeId": "evt.watch_show",\n          "tags": [\n            "entertainment",\n            "movie"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-08": {\n      "status": "draft",\n      "updatedAt": "2026-04-08T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-08:evt.commute:0",\n          "startAt": "2026-04-08T01:10:00.000Z",\n          "endAt": "2026-04-08T01:50:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 40-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.transit",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-08:evt.learning:1",\n          "startAt": "2026-04-08T03:00:00.000Z",\n          "endAt": "2026-04-08T04:00:00.000Z",\n          "title": "Course Study",\n          "note": "Course Study filled a focused 60-minute block.",\n          "categoryId": "study",\n          "subcategoryId": "study.course",\n          "eventNodeId": "evt.learning",\n          "tags": [\n            "study",\n            "course-study"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-08:evt.hospital_visit:2",\n          "startAt": "2026-04-08T07:30:00.000Z",\n          "endAt": "2026-04-08T08:20:00.000Z",\n          "title": "Medical Visit",\n          "note": "Medical Visit filled a focused 50-minute block.",\n          "categoryId": "health",\n          "subcategoryId": "health.hospital",\n          "eventNodeId": "evt.hospital_visit",\n          "tags": [\n            "health",\n            "medical-visit"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-09": {\n      "status": "draft",\n      "updatedAt": "2026-04-09T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-09:evt.sleep:0",\n          "startAt": "2026-04-08T16:35:00.000Z",\n          "endAt": "2026-04-08T23:20:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-09:evt.commute:1",\n          "startAt": "2026-04-09T00:10:00.000Z",\n          "endAt": "2026-04-09T00:55:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 45-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.commute",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-09:evt.focus_coding:2",\n          "startAt": "2026-04-09T02:00:00.000Z",\n          "endAt": "2026-04-09T04:10:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-09:evt.lunch:3",\n          "startAt": "2026-04-09T04:25:00.000Z",\n          "endAt": "2026-04-09T05:00:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-10": {\n      "status": "draft",\n      "updatedAt": "2026-04-10T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-10:evt.reading:0",\n          "startAt": "2026-04-10T00:40:00.000Z",\n          "endAt": "2026-04-10T01:30:00.000Z",\n          "title": "Reading",\n          "note": "Reading filled a focused 50-minute block.",\n          "categoryId": "study",\n          "subcategoryId": "study.reading",\n          "eventNodeId": "evt.reading",\n          "tags": [\n            "study",\n            "reading"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-10:evt.focus_coding:1",\n          "startAt": "2026-04-10T02:15:00.000Z",\n          "endAt": "2026-04-10T03:50:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-10:evt.chatting:2",\n          "startAt": "2026-04-10T08:20:00.000Z",\n          "endAt": "2026-04-10T09:05:00.000Z",\n          "title": "Coffee Chat",\n          "note": "Coffee Chat filled a focused 45-minute block.",\n          "categoryId": "social",\n          "subcategoryId": "social.chat",\n          "eventNodeId": "evt.chatting",\n          "tags": [\n            "social",\n            "coffee-chat"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-11": {\n      "status": "draft",\n      "updatedAt": "2026-04-11T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-11:evt.sleep:0",\n          "startAt": "2026-04-10T17:00:00.000Z",\n          "endAt": "2026-04-11T00:10:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-11:evt.shower:1",\n          "startAt": "2026-04-11T01:00:00.000Z",\n          "endAt": "2026-04-11T01:20:00.000Z",\n          "title": "Shower",\n          "note": "Shower landed as a short life block.",\n          "categoryId": "life",\n          "subcategoryId": "life.hygiene",\n          "eventNodeId": "evt.shower",\n          "tags": [\n            "life",\n            "shower"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-11:evt.watch_show:2",\n          "startAt": "2026-04-11T12:30:00.000Z",\n          "endAt": "2026-04-11T13:40:00.000Z",\n          "title": "Movie",\n          "note": "Movie filled a focused 70-minute block.",\n          "categoryId": "entertainment",\n          "subcategoryId": "entertainment.video",\n          "eventNodeId": "evt.watch_show",\n          "tags": [\n            "entertainment",\n            "movie"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-12": {\n      "status": "draft",\n      "updatedAt": "2026-04-12T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-12:evt.commute:0",\n          "startAt": "2026-04-12T00:25:00.000Z",\n          "endAt": "2026-04-12T01:05:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 40-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.commute",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-12:evt.meeting:1",\n          "startAt": "2026-04-12T02:00:00.000Z",\n          "endAt": "2026-04-12T02:45:00.000Z",\n          "title": "Meeting",\n          "note": "Meeting filled a focused 45-minute block.",\n          "categoryId": "work",\n          "subcategoryId": "work.meeting",\n          "eventNodeId": "evt.meeting",\n          "tags": [\n            "work",\n            "meeting"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-12:evt.lunch:2",\n          "startAt": "2026-04-12T04:15:00.000Z",\n          "endAt": "2026-04-12T04:50:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-12:evt.workout:3",\n          "startAt": "2026-04-12T10:20:00.000Z",\n          "endAt": "2026-04-12T11:10:00.000Z",\n          "title": "Workout",\n          "note": "Workout filled a focused 50-minute block.",\n          "categoryId": "exercise",\n          "subcategoryId": "exercise.workout",\n          "eventNodeId": "evt.workout",\n          "tags": [\n            "exercise",\n            "workout"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-13": {\n      "status": "draft",\n      "updatedAt": "2026-04-13T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-13:evt.breakfast:0",\n          "startAt": "2026-04-13T00:30:00.000Z",\n          "endAt": "2026-04-13T00:55:00.000Z",\n          "title": "Breakfast",\n          "note": "Breakfast filled a focused 25-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.breakfast",\n          "tags": [\n            "life",\n            "breakfast"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-13:evt.reading:1",\n          "startAt": "2026-04-13T01:30:00.000Z",\n          "endAt": "2026-04-13T02:20:00.000Z",\n          "title": "Reading",\n          "note": "Reading filled a focused 50-minute block.",\n          "categoryId": "study",\n          "subcategoryId": "study.reading",\n          "eventNodeId": "evt.reading",\n          "tags": [\n            "study",\n            "reading"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-13:evt.phone_scroll:2",\n          "startAt": "2026-04-13T14:20:00.000Z",\n          "endAt": "2026-04-13T14:50:00.000Z",\n          "title": "Phone Scroll",\n          "note": "Phone Scroll filled a focused 30-minute block.",\n          "categoryId": "entertainment",\n          "subcategoryId": "entertainment.social_media",\n          "eventNodeId": "evt.phone_scroll",\n          "tags": [\n            "entertainment",\n            "phone-scroll"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-14": {\n      "status": "draft",\n      "updatedAt": "2026-04-14T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-14:evt.sleep:0",\n          "startAt": "2026-04-13T16:20:00.000Z",\n          "endAt": "2026-04-13T22:45:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-14:evt.focus_coding:1",\n          "startAt": "2026-04-14T01:40:00.000Z",\n          "endAt": "2026-04-14T04:30:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-14:evt.dinner:2",\n          "startAt": "2026-04-14T11:10:00.000Z",\n          "endAt": "2026-04-14T11:45:00.000Z",\n          "title": "Dinner",\n          "note": "Dinner filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.dinner",\n          "tags": [\n            "life",\n            "dinner"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-14:evt.chatting:3",\n          "startAt": "2026-04-14T12:15:00.000Z",\n          "endAt": "2026-04-14T13:00:00.000Z",\n          "title": "Coffee Chat",\n          "note": "Coffee Chat filled a focused 45-minute block.",\n          "categoryId": "social",\n          "subcategoryId": "social.chat",\n          "eventNodeId": "evt.chatting",\n          "tags": [\n            "social",\n            "coffee-chat"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-15": {\n      "status": "draft",\n      "updatedAt": "2026-04-15T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-15:evt.walk:0",\n          "startAt": "2026-04-14T23:50:00.000Z",\n          "endAt": "2026-04-15T00:35:00.000Z",\n          "title": "Walk",\n          "note": "Walk filled a focused 45-minute block.",\n          "categoryId": "exercise",\n          "subcategoryId": "exercise.walk",\n          "eventNodeId": "evt.walk",\n          "tags": [\n            "exercise",\n            "walk"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-15:evt.lunch:1",\n          "startAt": "2026-04-15T04:20:00.000Z",\n          "endAt": "2026-04-15T04:55:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-15:evt.cleanup:2",\n          "startAt": "2026-04-15T09:40:00.000Z",\n          "endAt": "2026-04-15T10:05:00.000Z",\n          "title": "Cleanup",\n          "note": "Cleanup filled a focused 25-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.chores",\n          "eventNodeId": "evt.cleanup",\n          "tags": [\n            "life",\n            "cleanup"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-15:evt.watch_show:3",\n          "startAt": "2026-04-15T13:00:00.000Z",\n          "endAt": "2026-04-15T14:05:00.000Z",\n          "title": "Movie",\n          "note": "Movie filled a focused 65-minute block.",\n          "categoryId": "entertainment",\n          "subcategoryId": "entertainment.video",\n          "eventNodeId": "evt.watch_show",\n          "tags": [\n            "entertainment",\n            "movie"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-16": {\n      "status": "draft",\n      "updatedAt": "2026-04-16T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-16:evt.commute:0",\n          "startAt": "2026-04-16T01:10:00.000Z",\n          "endAt": "2026-04-16T01:50:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 40-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.transit",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-16:evt.learning:1",\n          "startAt": "2026-04-16T03:00:00.000Z",\n          "endAt": "2026-04-16T04:00:00.000Z",\n          "title": "Course Study",\n          "note": "Course Study filled a focused 60-minute block.",\n          "categoryId": "study",\n          "subcategoryId": "study.course",\n          "eventNodeId": "evt.learning",\n          "tags": [\n            "study",\n            "course-study"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-16:evt.hospital_visit:2",\n          "startAt": "2026-04-16T07:30:00.000Z",\n          "endAt": "2026-04-16T08:20:00.000Z",\n          "title": "Medical Visit",\n          "note": "Medical Visit filled a focused 50-minute block.",\n          "categoryId": "health",\n          "subcategoryId": "health.hospital",\n          "eventNodeId": "evt.hospital_visit",\n          "tags": [\n            "health",\n            "medical-visit"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-17": {\n      "status": "draft",\n      "updatedAt": "2026-04-17T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-17:evt.sleep:0",\n          "startAt": "2026-04-16T16:35:00.000Z",\n          "endAt": "2026-04-16T23:20:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-17:evt.commute:1",\n          "startAt": "2026-04-17T00:10:00.000Z",\n          "endAt": "2026-04-17T00:55:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 45-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.commute",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-17:evt.focus_coding:2",\n          "startAt": "2026-04-17T02:00:00.000Z",\n          "endAt": "2026-04-17T04:10:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-17:evt.lunch:3",\n          "startAt": "2026-04-17T04:25:00.000Z",\n          "endAt": "2026-04-17T05:00:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-18": {\n      "status": "draft",\n      "updatedAt": "2026-04-18T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-18:evt.reading:0",\n          "startAt": "2026-04-18T00:40:00.000Z",\n          "endAt": "2026-04-18T01:30:00.000Z",\n          "title": "Reading",\n          "note": "Reading filled a focused 50-minute block.",\n          "categoryId": "study",\n          "subcategoryId": "study.reading",\n          "eventNodeId": "evt.reading",\n          "tags": [\n            "study",\n            "reading"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-18:evt.focus_coding:1",\n          "startAt": "2026-04-18T02:15:00.000Z",\n          "endAt": "2026-04-18T03:50:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-18:evt.chatting:2",\n          "startAt": "2026-04-18T08:20:00.000Z",\n          "endAt": "2026-04-18T09:05:00.000Z",\n          "title": "Coffee Chat",\n          "note": "Coffee Chat filled a focused 45-minute block.",\n          "categoryId": "social",\n          "subcategoryId": "social.chat",\n          "eventNodeId": "evt.chatting",\n          "tags": [\n            "social",\n            "coffee-chat"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-19": {\n      "status": "draft",\n      "updatedAt": "2026-04-19T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-19:evt.sleep:0",\n          "startAt": "2026-04-18T17:00:00.000Z",\n          "endAt": "2026-04-19T00:10:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-19:evt.shower:1",\n          "startAt": "2026-04-19T01:00:00.000Z",\n          "endAt": "2026-04-19T01:20:00.000Z",\n          "title": "Shower",\n          "note": "Shower landed as a short life block.",\n          "categoryId": "life",\n          "subcategoryId": "life.hygiene",\n          "eventNodeId": "evt.shower",\n          "tags": [\n            "life",\n            "shower"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-19:evt.watch_show:2",\n          "startAt": "2026-04-19T12:30:00.000Z",\n          "endAt": "2026-04-19T13:40:00.000Z",\n          "title": "Movie",\n          "note": "Movie filled a focused 70-minute block.",\n          "categoryId": "entertainment",\n          "subcategoryId": "entertainment.video",\n          "eventNodeId": "evt.watch_show",\n          "tags": [\n            "entertainment",\n            "movie"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-20": {\n      "status": "draft",\n      "updatedAt": "2026-04-20T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-20:evt.sleep:5",\n          "startAt": "2026-04-19T16:50:00.000Z",\n          "endAt": "2026-04-19T23:55:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-20:evt.commute:0",\n          "startAt": "2026-04-20T00:25:00.000Z",\n          "endAt": "2026-04-20T01:05:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 40-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.commute",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-20:evt.meeting:1",\n          "startAt": "2026-04-20T02:00:00.000Z",\n          "endAt": "2026-04-20T02:45:00.000Z",\n          "title": "Meeting",\n          "note": "Meeting filled a focused 45-minute block.",\n          "categoryId": "work",\n          "subcategoryId": "work.meeting",\n          "eventNodeId": "evt.meeting",\n          "tags": [\n            "work",\n            "meeting"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-20:evt.lunch:2",\n          "startAt": "2026-04-20T04:15:00.000Z",\n          "endAt": "2026-04-20T04:50:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-20:evt.workout:3",\n          "startAt": "2026-04-20T10:20:00.000Z",\n          "endAt": "2026-04-20T11:10:00.000Z",\n          "title": "Workout",\n          "note": "Workout filled a focused 50-minute block.",\n          "categoryId": "exercise",\n          "subcategoryId": "exercise.workout",\n          "eventNodeId": "evt.workout",\n          "tags": [\n            "exercise",\n            "workout"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-21": {\n      "status": "draft",\n      "updatedAt": "2026-04-21T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-21:evt.sleep:5",\n          "startAt": "2026-04-20T16:30:00.000Z",\n          "endAt": "2026-04-20T23:45:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-21:evt.commute:0",\n          "startAt": "2026-04-21T00:25:00.000Z",\n          "endAt": "2026-04-21T01:05:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 40-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.commute",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-21:evt.focus_coding:1",\n          "startAt": "2026-04-21T01:30:00.000Z",\n          "endAt": "2026-04-21T03:50:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-21:evt.lunch:2",\n          "startAt": "2026-04-21T04:15:00.000Z",\n          "endAt": "2026-04-21T04:55:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 40-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-21:evt.focus_coding:3",\n          "startAt": "2026-04-21T05:20:00.000Z",\n          "endAt": "2026-04-21T08:30:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-21:evt.workout:4",\n          "startAt": "2026-04-21T11:10:00.000Z",\n          "endAt": "2026-04-21T12:05:00.000Z",\n          "title": "Workout",\n          "note": "Workout filled a focused 55-minute block.",\n          "categoryId": "exercise",\n          "subcategoryId": "exercise.workout",\n          "eventNodeId": "evt.workout",\n          "tags": [\n            "exercise",\n            "workout"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-22": {\n      "status": "draft",\n      "updatedAt": "2026-04-22T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-22:evt.sleep:0",\n          "startAt": "2026-04-21T16:40:00.000Z",\n          "endAt": "2026-04-21T23:35:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-22:evt.chatting:1",\n          "startAt": "2026-04-22T02:40:00.000Z",\n          "endAt": "2026-04-22T03:35:00.000Z",\n          "title": "Coffee Chat",\n          "note": "Coffee Chat filled a focused 55-minute block.",\n          "categoryId": "social",\n          "subcategoryId": "social.chat",\n          "eventNodeId": "evt.chatting",\n          "tags": [\n            "social",\n            "coffee-chat"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-22:evt.lunch:2",\n          "startAt": "2026-04-22T04:10:00.000Z",\n          "endAt": "2026-04-22T04:45:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-22:evt.focus_coding:3",\n          "startAt": "2026-04-22T05:30:00.000Z",\n          "endAt": "2026-04-22T08:10:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-22:evt.dinner:4",\n          "startAt": "2026-04-22T10:45:00.000Z",\n          "endAt": "2026-04-22T11:20:00.000Z",\n          "title": "Dinner",\n          "note": "Dinner filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.dinner",\n          "tags": [\n            "life",\n            "dinner"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-23": {\n      "status": "draft",\n      "updatedAt": "2026-04-23T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-23:evt.sleep:0",\n          "startAt": "2026-04-22T16:10:00.000Z",\n          "endAt": "2026-04-22T22:50:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-23:evt.reading:1",\n          "startAt": "2026-04-23T00:40:00.000Z",\n          "endAt": "2026-04-23T01:30:00.000Z",\n          "title": "Reading",\n          "note": "Reading filled a focused 50-minute block.",\n          "categoryId": "study",\n          "subcategoryId": "study.reading",\n          "eventNodeId": "evt.reading",\n          "tags": [\n            "study",\n            "reading"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-23:evt.focus_coding:2",\n          "startAt": "2026-04-23T02:10:00.000Z",\n          "endAt": "2026-04-23T04:00:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-23:evt.lunch:3",\n          "startAt": "2026-04-23T04:30:00.000Z",\n          "endAt": "2026-04-23T05:05:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-23:evt.walk:4",\n          "startAt": "2026-04-23T10:10:00.000Z",\n          "endAt": "2026-04-23T10:55:00.000Z",\n          "title": "Walk",\n          "note": "Walk filled a focused 45-minute block.",\n          "categoryId": "exercise",\n          "subcategoryId": "exercise.walk",\n          "eventNodeId": "evt.walk",\n          "tags": [\n            "exercise",\n            "walk"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-24": {\n      "status": "draft",\n      "updatedAt": "2026-04-24T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-24:evt.sleep:0",\n          "startAt": "2026-04-23T17:00:00.000Z",\n          "endAt": "2026-04-24T00:20:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-24:evt.chatting:1",\n          "startAt": "2026-04-24T01:40:00.000Z",\n          "endAt": "2026-04-24T02:20:00.000Z",\n          "title": "Coffee Chat",\n          "note": "Coffee Chat filled a focused 40-minute block.",\n          "categoryId": "social",\n          "subcategoryId": "social.chat",\n          "eventNodeId": "evt.chatting",\n          "tags": [\n            "social",\n            "coffee-chat"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-24:evt.lunch:2",\n          "startAt": "2026-04-24T04:10:00.000Z",\n          "endAt": "2026-04-24T04:50:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 40-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-24:evt.watch_show:3",\n          "startAt": "2026-04-24T05:30:00.000Z",\n          "endAt": "2026-04-24T06:25:00.000Z",\n          "title": "Movie",\n          "note": "Movie filled a focused 55-minute block.",\n          "categoryId": "entertainment",\n          "subcategoryId": "entertainment.video",\n          "eventNodeId": "evt.watch_show",\n          "tags": [\n            "entertainment",\n            "movie"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-24:evt.focus_coding:4",\n          "startAt": "2026-04-24T07:10:00.000Z",\n          "endAt": "2026-04-24T09:05:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-25": {\n      "status": "draft",\n      "updatedAt": "2026-04-25T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-25:evt.sleep:0",\n          "startAt": "2026-04-24T16:30:00.000Z",\n          "endAt": "2026-04-24T22:50:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-25:evt.workout:1",\n          "startAt": "2026-04-24T23:15:00.000Z",\n          "endAt": "2026-04-25T00:20:00.000Z",\n          "title": "Tennis",\n          "note": "Tennis filled a focused 65-minute block.",\n          "categoryId": "exercise",\n          "subcategoryId": "exercise.workout",\n          "eventNodeId": "evt.workout",\n          "tags": [\n            "exercise",\n            "tennis"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-25:evt.breakfast:2",\n          "startAt": "2026-04-25T00:35:00.000Z",\n          "endAt": "2026-04-25T00:55:00.000Z",\n          "title": "Breakfast",\n          "note": "Breakfast landed as a short life block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.breakfast",\n          "tags": [\n            "life",\n            "breakfast"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-25:evt.commute:3",\n          "startAt": "2026-04-25T01:05:00.000Z",\n          "endAt": "2026-04-25T01:45:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 40-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.commute",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-25:evt.focus_coding:4",\n          "startAt": "2026-04-25T02:00:00.000Z",\n          "endAt": "2026-04-25T04:10:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-25:evt.meeting:5",\n          "startAt": "2026-04-25T02:40:00.000Z",\n          "endAt": "2026-04-25T03:15:00.000Z",\n          "title": "Meeting",\n          "note": "Meeting filled a focused 35-minute block.",\n          "categoryId": "work",\n          "subcategoryId": "work.meeting",\n          "eventNodeId": "evt.meeting",\n          "tags": [\n            "work",\n            "meeting"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-25:evt.lunch:6",\n          "startAt": "2026-04-25T04:20:00.000Z",\n          "endAt": "2026-04-25T05:00:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 40-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-25:evt.call:7",\n          "startAt": "2026-04-25T04:35:00.000Z",\n          "endAt": "2026-04-25T04:55:00.000Z",\n          "title": "Call",\n          "note": "Call landed as a short social block.",\n          "categoryId": "social",\n          "subcategoryId": "social.call",\n          "eventNodeId": "evt.call",\n          "tags": [\n            "social",\n            "call"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-25:evt.chatting:8",\n          "startAt": "2026-04-25T07:10:00.000Z",\n          "endAt": "2026-04-25T08:05:00.000Z",\n          "title": "Coffee Catch-up",\n          "note": "Coffee Catch-up filled a focused 55-minute block.",\n          "categoryId": "social",\n          "subcategoryId": "social.chat",\n          "eventNodeId": "evt.chatting",\n          "tags": [\n            "social",\n            "coffee-catch-up"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-25:evt.meeting:9",\n          "startAt": "2026-04-25T07:25:00.000Z",\n          "endAt": "2026-04-25T07:50:00.000Z",\n          "title": "Messages",\n          "note": "Messages filled a focused 25-minute block.",\n          "categoryId": "work",\n          "subcategoryId": "work.communication",\n          "eventNodeId": "evt.meeting",\n          "tags": [\n            "work",\n            "messages"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-25:evt.dinner:10",\n          "startAt": "2026-04-25T11:10:00.000Z",\n          "endAt": "2026-04-25T11:50:00.000Z",\n          "title": "Dinner",\n          "note": "Dinner filled a focused 40-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.dinner",\n          "tags": [\n            "life",\n            "dinner"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-26": {\n      "status": "draft",\n      "updatedAt": "2026-04-26T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-26:evt.phone_scroll:0",\n          "startAt": "2026-04-25T16:40:00.000Z",\n          "endAt": "2026-04-25T17:05:00.000Z",\n          "title": "Phone Scroll",\n          "note": "Phone Scroll filled a focused 25-minute block.",\n          "categoryId": "entertainment",\n          "subcategoryId": "entertainment.social_media",\n          "eventNodeId": "evt.phone_scroll",\n          "tags": [\n            "entertainment",\n            "phone-scroll"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-26:evt.sleep:1",\n          "startAt": "2026-04-25T17:20:00.000Z",\n          "endAt": "2026-04-26T01:10:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-26:evt.shower:2",\n          "startAt": "2026-04-26T01:40:00.000Z",\n          "endAt": "2026-04-26T02:00:00.000Z",\n          "title": "Shower",\n          "note": "Shower landed as a short life block.",\n          "categoryId": "life",\n          "subcategoryId": "life.hygiene",\n          "eventNodeId": "evt.shower",\n          "tags": [\n            "life",\n            "shower"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-26:evt.focus_coding:3",\n          "startAt": "2026-04-26T02:30:00.000Z",\n          "endAt": "2026-04-26T04:20:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-26:evt.shopping:4",\n          "startAt": "2026-04-26T07:30:00.000Z",\n          "endAt": "2026-04-26T08:05:00.000Z",\n          "title": "Shopping",\n          "note": "Shopping filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.shopping",\n          "eventNodeId": "evt.shopping",\n          "tags": [\n            "life",\n            "shopping"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-27": {\n      "status": "draft",\n      "updatedAt": "2026-04-27T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-27:evt.sleep:0",\n          "startAt": "2026-04-26T16:50:00.000Z",\n          "endAt": "2026-04-27T00:05:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-27:evt.commute:1",\n          "startAt": "2026-04-27T00:30:00.000Z",\n          "endAt": "2026-04-27T01:00:00.000Z",\n          "title": "Commute",\n          "note": "Commute filled a focused 30-minute block.",\n          "categoryId": "travel",\n          "subcategoryId": "travel.commute",\n          "eventNodeId": "evt.commute",\n          "tags": [\n            "travel",\n            "commute"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-27:evt.breakfast:2",\n          "startAt": "2026-04-27T01:15:00.000Z",\n          "endAt": "2026-04-27T01:35:00.000Z",\n          "title": "Breakfast",\n          "note": "Breakfast landed as a short life block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.breakfast",\n          "tags": [\n            "life",\n            "breakfast"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-27:evt.focus_coding:3",\n          "startAt": "2026-04-27T02:20:00.000Z",\n          "endAt": "2026-04-27T04:10:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.other",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-27:evt.lunch:4",\n          "startAt": "2026-04-27T04:45:00.000Z",\n          "endAt": "2026-04-27T05:20:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-28": {\n      "status": "draft",\n      "updatedAt": "2026-04-28T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-28:evt.workout:0",\n          "startAt": "2026-04-27T23:30:00.000Z",\n          "endAt": "2026-04-28T04:10:00.000Z",\n          "title": "Cycling",\n          "note": "Cycling covered a longer stretch of the day.",\n          "categoryId": "exercise",\n          "subcategoryId": "exercise.other",\n          "eventNodeId": "evt.workout",\n          "tags": [\n            "exercise",\n            "cycling"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-28:evt.lunch:1",\n          "startAt": "2026-04-28T04:25:00.000Z",\n          "endAt": "2026-04-28T05:00:00.000Z",\n          "title": "Lunch",\n          "note": "Lunch filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.lunch",\n          "tags": [\n            "life",\n            "lunch"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-28:evt.chatting:2",\n          "startAt": "2026-04-28T08:20:00.000Z",\n          "endAt": "2026-04-28T09:05:00.000Z",\n          "title": "Coffee Chat",\n          "note": "Coffee Chat filled a focused 45-minute block.",\n          "categoryId": "social",\n          "subcategoryId": "social.chat",\n          "eventNodeId": "evt.chatting",\n          "tags": [\n            "social",\n            "coffee-chat"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-28:evt.watch_show:3",\n          "startAt": "2026-04-28T13:00:00.000Z",\n          "endAt": "2026-04-28T14:05:00.000Z",\n          "title": "Movie",\n          "note": "Movie filled a focused 65-minute block.",\n          "categoryId": "entertainment",\n          "subcategoryId": "entertainment.video",\n          "eventNodeId": "evt.watch_show",\n          "tags": [\n            "entertainment",\n            "movie"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-29": {\n      "status": "draft",\n      "updatedAt": "2026-04-29T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-29:evt.breakfast:0",\n          "startAt": "2026-04-29T00:30:00.000Z",\n          "endAt": "2026-04-29T00:55:00.000Z",\n          "title": "Breakfast",\n          "note": "Breakfast filled a focused 25-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.breakfast",\n          "tags": [\n            "life",\n            "breakfast"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-29:evt.focus_coding:1",\n          "startAt": "2026-04-29T02:00:00.000Z",\n          "endAt": "2026-04-29T07:30:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-29:evt.walk:2",\n          "startAt": "2026-04-29T10:10:00.000Z",\n          "endAt": "2026-04-29T10:55:00.000Z",\n          "title": "Walk",\n          "note": "Walk filled a focused 45-minute block.",\n          "categoryId": "exercise",\n          "subcategoryId": "exercise.walk",\n          "eventNodeId": "evt.walk",\n          "tags": [\n            "exercise",\n            "walk"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-29:evt.dinner:3",\n          "startAt": "2026-04-29T11:20:00.000Z",\n          "endAt": "2026-04-29T12:00:00.000Z",\n          "title": "Dinner",\n          "note": "Dinner filled a focused 40-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.dinner",\n          "tags": [\n            "life",\n            "dinner"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    },\n    "2026-04-30": {\n      "status": "draft",\n      "updatedAt": "2026-04-30T12:00:00.000Z",\n      "source": null,\n      "events": [\n        {\n          "id": "synthetic:2026-04-30:evt.sleep:0",\n          "startAt": "2026-04-29T16:20:00.000Z",\n          "endAt": "2026-04-29T22:45:00.000Z",\n          "title": "Sleep",\n          "note": "Sleep covered a longer stretch of the day.",\n          "categoryId": "rest",\n          "subcategoryId": "rest.sleep",\n          "eventNodeId": "evt.sleep",\n          "tags": [\n            "rest",\n            "sleep"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-30:evt.focus_coding:1",\n          "startAt": "2026-04-30T01:40:00.000Z",\n          "endAt": "2026-04-30T04:30:00.000Z",\n          "title": "Deep Work",\n          "note": "Deep Work covered a longer stretch of the day.",\n          "categoryId": "work",\n          "subcategoryId": "work.coding",\n          "eventNodeId": "evt.focus_coding",\n          "tags": [\n            "work",\n            "deep-work"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-30:evt.dinner:2",\n          "startAt": "2026-04-30T11:10:00.000Z",\n          "endAt": "2026-04-30T11:45:00.000Z",\n          "title": "Dinner",\n          "note": "Dinner filled a focused 35-minute block.",\n          "categoryId": "life",\n          "subcategoryId": "life.meal",\n          "eventNodeId": "evt.dinner",\n          "tags": [\n            "life",\n            "dinner"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        },\n        {\n          "id": "synthetic:2026-04-30:evt.chatting:3",\n          "startAt": "2026-04-30T12:15:00.000Z",\n          "endAt": "2026-04-30T13:00:00.000Z",\n          "title": "Coffee Chat",\n          "note": "Coffee Chat filled a focused 45-minute block.",\n          "categoryId": "social",\n          "subcategoryId": "social.chat",\n          "eventNodeId": "evt.chatting",\n          "tags": [\n            "social",\n            "coffee-chat"\n          ],\n          "confidence": 0.35,\n          "sourceMessageIds": []\n        }\n      ]\n    }\n  },\n  "proposals": []\n}\n';
  var rawDiary = {
    "2026-04-01": "## Summary\n\n### AM\n\nMorning moved through Sleep, Commute, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Lunch.\n\n## Entries\n\n## 00:35 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 08:10 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 10:00 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 12:25 Lunch\n\nA generic life block stayed on the record here for the public sample.\n",
    "2026-04-02": "## Summary\n\n### AM\n\nMorning moved through Reading, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Coffee Chat.\n\n## Entries\n\n## 08:40 Reading\n\nA generic study block stayed on the record here for the public sample.\n\n## 10:15 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 16:20 Coffee Chat\n\nA generic social block stayed on the record here for the public sample.\n",
    "2026-04-03": "## Summary\n\n### AM\n\nMorning moved through Sleep, Shower.\n\n### PM\n\nAfternoon and evening focused on Movie.\n\n## Entries\n\n## 01:00 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 09:00 Shower\n\nA generic life block stayed on the record here for the public sample.\n\n## 20:30 Movie\n\nA generic entertainment block stayed on the record here for the public sample.\n",
    "2026-04-04": "## Summary\n\n### AM\n\nMorning moved through Commute, Meeting.\n\n### PM\n\nAfternoon and evening focused on Lunch, Workout.\n\n## Entries\n\n## 08:25 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 10:00 Meeting\n\nA generic work block stayed on the record here for the public sample.\n\n## 12:15 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 18:20 Workout\n\nA generic exercise block stayed on the record here for the public sample.\n",
    "2026-04-05": "## Summary\n\n### AM\n\nMorning moved through Breakfast, Reading.\n\n### PM\n\nAfternoon and evening focused on Phone Scroll.\n\n## Entries\n\n## 08:30 Breakfast\n\nA generic life block stayed on the record here for the public sample.\n\n## 09:30 Reading\n\nA generic study block stayed on the record here for the public sample.\n\n## 22:20 Phone Scroll\n\nA generic entertainment block stayed on the record here for the public sample.\n",
    "2026-04-06": "## Summary\n\n### AM\n\nMorning moved through Sleep, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Dinner, Coffee Chat.\n\n## Entries\n\n## 00:20 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 09:40 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 19:10 Dinner\n\nA generic life block stayed on the record here for the public sample.\n\n## 20:15 Coffee Chat\n\nA generic social block stayed on the record here for the public sample.\n",
    "2026-04-07": "## Summary\n\n### AM\n\nMorning moved through Walk.\n\n### PM\n\nAfternoon and evening focused on Lunch, Cleanup, Movie.\n\n## Entries\n\n## 07:50 Walk\n\nA generic exercise block stayed on the record here for the public sample.\n\n## 12:20 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 17:40 Cleanup\n\nA generic life block stayed on the record here for the public sample.\n\n## 21:00 Movie\n\nA generic entertainment block stayed on the record here for the public sample.\n",
    "2026-04-08": "## Summary\n\n### AM\n\nMorning moved through Commute, Course Study.\n\n### PM\n\nAfternoon and evening focused on Medical Visit.\n\n## Entries\n\n## 09:10 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 11:00 Course Study\n\nA generic study block stayed on the record here for the public sample.\n\n## 15:30 Medical Visit\n\nA generic health block stayed on the record here for the public sample.\n",
    "2026-04-09": "## Summary\n\n### AM\n\nMorning moved through Sleep, Commute, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Lunch.\n\n## Entries\n\n## 00:35 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 08:10 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 10:00 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 12:25 Lunch\n\nA generic life block stayed on the record here for the public sample.\n",
    "2026-04-10": "## Summary\n\n### AM\n\nMorning moved through Reading, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Coffee Chat.\n\n## Entries\n\n## 08:40 Reading\n\nA generic study block stayed on the record here for the public sample.\n\n## 10:15 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 16:20 Coffee Chat\n\nA generic social block stayed on the record here for the public sample.\n",
    "2026-04-11": "## Summary\n\n### AM\n\nMorning moved through Sleep, Shower.\n\n### PM\n\nAfternoon and evening focused on Movie.\n\n## Entries\n\n## 01:00 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 09:00 Shower\n\nA generic life block stayed on the record here for the public sample.\n\n## 20:30 Movie\n\nA generic entertainment block stayed on the record here for the public sample.\n",
    "2026-04-12": "## Summary\n\n### AM\n\nMorning moved through Commute, Meeting.\n\n### PM\n\nAfternoon and evening focused on Lunch, Workout.\n\n## Entries\n\n## 08:25 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 10:00 Meeting\n\nA generic work block stayed on the record here for the public sample.\n\n## 12:15 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 18:20 Workout\n\nA generic exercise block stayed on the record here for the public sample.\n",
    "2026-04-13": "## Summary\n\n### AM\n\nMorning moved through Breakfast, Reading.\n\n### PM\n\nAfternoon and evening focused on Phone Scroll.\n\n## Entries\n\n## 08:30 Breakfast\n\nA generic life block stayed on the record here for the public sample.\n\n## 09:30 Reading\n\nA generic study block stayed on the record here for the public sample.\n\n## 22:20 Phone Scroll\n\nA generic entertainment block stayed on the record here for the public sample.\n",
    "2026-04-14": "## Summary\n\n### AM\n\nMorning moved through Sleep, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Dinner, Coffee Chat.\n\n## Entries\n\n## 00:20 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 09:40 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 19:10 Dinner\n\nA generic life block stayed on the record here for the public sample.\n\n## 20:15 Coffee Chat\n\nA generic social block stayed on the record here for the public sample.\n",
    "2026-04-15": "## Summary\n\n### AM\n\nMorning moved through Walk.\n\n### PM\n\nAfternoon and evening focused on Lunch, Cleanup, Movie.\n\n## Entries\n\n## 07:50 Walk\n\nA generic exercise block stayed on the record here for the public sample.\n\n## 12:20 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 17:40 Cleanup\n\nA generic life block stayed on the record here for the public sample.\n\n## 21:00 Movie\n\nA generic entertainment block stayed on the record here for the public sample.\n",
    "2026-04-16": "## Summary\n\n### AM\n\nMorning moved through Commute, Course Study.\n\n### PM\n\nAfternoon and evening focused on Medical Visit.\n\n## Entries\n\n## 09:10 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 11:00 Course Study\n\nA generic study block stayed on the record here for the public sample.\n\n## 15:30 Medical Visit\n\nA generic health block stayed on the record here for the public sample.\n",
    "2026-04-17": "## Summary\n\n### AM\n\nMorning moved through Sleep, Commute, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Lunch.\n\n## Entries\n\n## 00:35 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 08:10 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 10:00 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 12:25 Lunch\n\nA generic life block stayed on the record here for the public sample.\n",
    "2026-04-18": "## Summary\n\n### AM\n\nMorning moved through Reading, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Coffee Chat.\n\n## Entries\n\n## 08:40 Reading\n\nA generic study block stayed on the record here for the public sample.\n\n## 10:15 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 16:20 Coffee Chat\n\nA generic social block stayed on the record here for the public sample.\n",
    "2026-04-19": "## Summary\n\n### AM\n\nMorning moved through Sleep, Shower.\n\n### PM\n\nAfternoon and evening focused on Movie.\n\n## Entries\n\n## 01:00 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 09:00 Shower\n\nA generic life block stayed on the record here for the public sample.\n\n## 20:30 Movie\n\nA generic entertainment block stayed on the record here for the public sample.\n",
    "2026-04-20": "## Summary\n\n### AM\n\nMorning moved through Sleep, Commute, Meeting.\n\n### PM\n\nAfternoon and evening focused on Lunch, Workout.\n\n## Entries\n\n## 00:50 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 08:25 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 10:00 Meeting\n\nA generic work block stayed on the record here for the public sample.\n\n## 12:15 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 18:20 Workout\n\nA generic exercise block stayed on the record here for the public sample.\n",
    "2026-04-21": "## Summary\n\n### AM\n\nMorning moved through Sleep, Commute, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Lunch, Deep Work, Workout.\n\n## Entries\n\n## 00:30 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 08:25 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 09:30 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 12:15 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 13:20 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 19:10 Workout\n\nA generic exercise block stayed on the record here for the public sample.\n",
    "2026-04-22": "## Summary\n\n### AM\n\nMorning moved through Sleep, Coffee Chat.\n\n### PM\n\nAfternoon and evening focused on Lunch, Deep Work, Dinner.\n\n## Entries\n\n## 00:40 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 10:40 Coffee Chat\n\nA generic social block stayed on the record here for the public sample.\n\n## 12:10 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 13:30 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 18:45 Dinner\n\nA generic life block stayed on the record here for the public sample.\n",
    "2026-04-23": "## Summary\n\n### AM\n\nMorning moved through Sleep, Reading, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Lunch, Walk.\n\n## Entries\n\n## 00:10 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 08:40 Reading\n\nA generic study block stayed on the record here for the public sample.\n\n## 10:10 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 12:30 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 18:10 Walk\n\nA generic exercise block stayed on the record here for the public sample.\n",
    "2026-04-24": "## Summary\n\n### AM\n\nMorning moved through Sleep, Coffee Chat.\n\n### PM\n\nAfternoon and evening focused on Lunch, Movie, Deep Work.\n\n## Entries\n\n## 01:00 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 09:40 Coffee Chat\n\nA generic social block stayed on the record here for the public sample.\n\n## 12:10 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 13:30 Movie\n\nA generic entertainment block stayed on the record here for the public sample.\n\n## 15:10 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n",
    "2026-04-25": "## Summary\n\n### AM\n\nMorning moved through Sleep, Tennis, Breakfast.\n\n### PM\n\nAfternoon and evening focused on Lunch, Call, Coffee Catch-up.\n\n## Entries\n\n## 00:30 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 07:15 Tennis\n\nA generic exercise block stayed on the record here for the public sample.\n\n## 08:35 Breakfast\n\nA generic life block stayed on the record here for the public sample.\n\n## 09:05 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 10:00 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 10:40 Meeting\n\nA generic work block stayed on the record here for the public sample.\n\n## 12:20 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 12:35 Call\n\nA generic social block stayed on the record here for the public sample.\n\n## 15:10 Coffee Catch-up\n\nA generic social block stayed on the record here for the public sample.\n\n## 15:25 Messages\n\nA generic work block stayed on the record here for the public sample.\n\n## 19:10 Dinner\n\nA generic life block stayed on the record here for the public sample.\n",
    "2026-04-26": "## Summary\n\n### AM\n\nMorning moved through Phone Scroll, Sleep, Shower.\n\n### PM\n\nAfternoon and evening focused on Shopping.\n\n## Entries\n\n## 00:40 Phone Scroll\n\nA generic entertainment block stayed on the record here for the public sample.\n\n## 01:20 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 09:40 Shower\n\nA generic life block stayed on the record here for the public sample.\n\n## 10:30 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 15:30 Shopping\n\nA generic life block stayed on the record here for the public sample.\n",
    "2026-04-27": "## Summary\n\n### AM\n\nMorning moved through Sleep, Commute, Breakfast.\n\n### PM\n\nAfternoon and evening focused on Lunch.\n\n## Entries\n\n## 00:50 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 08:30 Commute\n\nA generic travel block stayed on the record here for the public sample.\n\n## 09:15 Breakfast\n\nA generic life block stayed on the record here for the public sample.\n\n## 10:20 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 12:45 Lunch\n\nA generic life block stayed on the record here for the public sample.\n",
    "2026-04-28": "## Summary\n\n### AM\n\nMorning moved through Cycling.\n\n### PM\n\nAfternoon and evening focused on Lunch, Coffee Chat, Movie.\n\n## Entries\n\n## 07:30 Cycling\n\nA generic exercise block stayed on the record here for the public sample.\n\n## 12:25 Lunch\n\nA generic life block stayed on the record here for the public sample.\n\n## 16:20 Coffee Chat\n\nA generic social block stayed on the record here for the public sample.\n\n## 21:00 Movie\n\nA generic entertainment block stayed on the record here for the public sample.\n",
    "2026-04-29": "## Summary\n\n### AM\n\nMorning moved through Breakfast, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Walk, Dinner.\n\n## Entries\n\n## 08:30 Breakfast\n\nA generic life block stayed on the record here for the public sample.\n\n## 10:00 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 18:10 Walk\n\nA generic exercise block stayed on the record here for the public sample.\n\n## 19:20 Dinner\n\nA generic life block stayed on the record here for the public sample.\n",
    "2026-04-30": "## Summary\n\n### AM\n\nMorning moved through Sleep, Deep Work.\n\n### PM\n\nAfternoon and evening focused on Dinner, Coffee Chat.\n\n## Entries\n\n## 00:20 Sleep\n\nA generic rest block stayed on the record here for the public sample.\n\n## 09:40 Deep Work\n\nA generic work block stayed on the record here for the public sample.\n\n## 19:10 Dinner\n\nA generic life block stayed on the record here for the public sample.\n\n## 20:15 Coffee Chat\n\nA generic social block stayed on the record here for the public sample.\n"
  };
  var rawTodos = {
    "2026-04-25": [
      {
        "text": "reply messages",
        "status": "done",
        "source": "sanitized-sample"
      },
      {
        "text": "review notes",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "finish admin",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-26": [
      {
        "text": "reply messages",
        "status": "done",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-27": [
      {
        "text": "reply messages",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "review notes",
        "status": "done",
        "source": "sanitized-sample"
      },
      {
        "text": "finish admin",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "plan next steps",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "reading block",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "exercise",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "errands",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-28": [
      {
        "text": "reply messages",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "review notes",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "finish admin",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "plan next steps",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "reading block",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "exercise",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "errands",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "tidy desk",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "reply messages",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "review notes",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "finish admin",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-29": [
      {
        "text": "reply messages",
        "status": "open",
        "source": "sanitized-sample"
      },
      {
        "text": "review notes",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-01": [
      {
        "text": "reply messages",
        "status": "done",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-02": [
      {
        "text": "review notes",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-03": [
      {
        "text": "finish admin",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-04": [
      {
        "text": "plan next steps",
        "status": "done",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-05": [
      {
        "text": "reading block",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-06": [
      {
        "text": "exercise",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-07": [
      {
        "text": "errands",
        "status": "done",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-08": [
      {
        "text": "tidy desk",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-09": [
      {
        "text": "reply messages",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-10": [
      {
        "text": "review notes",
        "status": "done",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-11": [
      {
        "text": "finish admin",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-12": [
      {
        "text": "plan next steps",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-13": [
      {
        "text": "reading block",
        "status": "done",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-14": [
      {
        "text": "exercise",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-15": [
      {
        "text": "errands",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-16": [
      {
        "text": "tidy desk",
        "status": "done",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-17": [
      {
        "text": "reply messages",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-18": [
      {
        "text": "review notes",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-19": [
      {
        "text": "finish admin",
        "status": "done",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-20": [
      {
        "text": "plan next steps",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-21": [
      {
        "text": "reading block",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-22": [
      {
        "text": "exercise",
        "status": "done",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-23": [
      {
        "text": "errands",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-24": [
      {
        "text": "tidy desk",
        "status": "open",
        "source": "sanitized-sample"
      }
    ],
    "2026-04-30": [
      {
        "text": "exercise",
        "status": "open",
        "source": "sanitized-sample"
      }
    ]
  };
  window.JOURNAL_DATA = buildJournalData({ timelineStateText, rawDiary, rawTodos, isSample: true });

  // src/weekly-daily.jsx
  var { useEffect, useMemo, useState } = React;
  var DATA = window.JOURNAL_DATA;
  var QUERY_PARAMS = new URLSearchParams(window.location.search);
  var SCHEDULE_START_HOUR = 0;
  var SCHEDULE_END_HOUR = 23;
  var HOUR_PX = 57;
  var SCHEDULE_EVENT_GAP_PX = 6;
  var LONG_EVENT_FOLD_THRESHOLD_HOURS = 4;
  var EMPTY_HOUR_FOLD_THRESHOLD_HOURS = 2;
  var FOLD_MARKER_PX = 24;
  var WEEKLY_LONG_EVENT_MIN_SUPPORT_DAYS = 2;
  var EVENT_CATEGORIES = DATA && DATA.CATEGORY_PALETTE || {};
  var parseDateKey = (key) => {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };
  var formatDateKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  var formatLocalDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  var TODAY_KEY = formatLocalDateKey(/* @__PURE__ */ new Date());
  var getIsMobileViewport = () => window.matchMedia ? window.matchMedia("(max-width: 760px)").matches : window.innerWidth <= 760;
  var addDays = (dateKey, days) => {
    const date = parseDateKey(dateKey);
    date.setUTCDate(date.getUTCDate() + days);
    return formatDateKey(date);
  };
  var getWeekStartKey = (dateKey) => {
    const date = parseDateKey(dateKey);
    const day = date.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setUTCDate(date.getUTCDate() + diff);
    return formatDateKey(date);
  };
  var formatDisplayDate = (dateKey, options) => parseDateKey(dateKey).toLocaleDateString("en-US", { timeZone: "UTC", ...options });
  var getOrdinal = (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "st";
    if (mod10 === 2 && mod100 !== 12) return "nd";
    if (mod10 === 3 && mod100 !== 13) return "rd";
    return "th";
  };
  var getISOWeek = (dateKey) => {
    const date = parseDateKey(dateKey);
    const dayNum = date.getUTCDay() || 7;
    const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 4 - dayNum));
    const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
    return {
      week: Math.ceil(((thursday - yearStart) / 864e5 + 1) / 7),
      year: thursday.getUTCFullYear()
    };
  };
  var getWeekNumber = (dateKey) => getISOWeek(dateKey).week;
  var formatHourLabel = (hour) => {
    const whole = Math.floor(hour);
    const minute = Math.round((hour - whole) * 60);
    const suffix = whole >= 12 ? "pm" : "am";
    const displayHour = whole % 12 === 0 ? 12 : whole % 12;
    return minute ? `${displayHour}:${String(minute).padStart(2, "0")}${suffix}` : `${displayHour}${suffix}`;
  };
  var softenEventFill = (fill) => `color-mix(in srgb, ${fill} 76%, white 24%)`;
  var Chevron = ({ dir = "left", size = 16 }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }, dir === "left" ? /* @__PURE__ */ React.createElement("polyline", { points: "15 18 9 12 15 6" }) : /* @__PURE__ */ React.createElement("polyline", { points: "9 18 15 12 9 6" }));
  var computeLayout = (evts) => {
    if (!evts.length) return /* @__PURE__ */ new Map();
    const getOverlaps = (i) => evts.map((_, j) => j).filter((j) => j !== i && evts[j].startHour < evts[i].endHour && evts[j].endHour > evts[i].startHour);
    const claimedAsSec = /* @__PURE__ */ new Set();
    const secsOf = /* @__PURE__ */ new Map();
    const byDur = evts.map((_, i) => i).sort((a, b) => evts[b].endHour - evts[b].startHour - (evts[a].endHour - evts[a].startHour) || evts[a].startHour - evts[b].startHour);
    for (const i of byDur) {
      if (claimedAsSec.has(i)) continue;
      const secs = getOverlaps(i).filter((j) => !claimedAsSec.has(j) && !secsOf.has(j));
      secsOf.set(i, secs);
      secs.forEach((j) => claimedAsSec.add(j));
    }
    const result = /* @__PURE__ */ new Map();
    for (let i = 0; i < evts.length; i += 1) {
      if (secsOf.has(i)) {
        result.set(i, { role: "primary", totalSecondary: secsOf.get(i).length });
        continue;
      }
      let found = false;
      for (const [, secs] of secsOf) {
        const sIdx = secs.indexOf(i);
        if (sIdx >= 0) {
          result.set(i, { role: "secondary", secondaryIndex: sIdx, totalSecondary: secs.length });
          found = true;
          break;
        }
      }
      if (!found) result.set(i, { role: "primary", totalSecondary: 0 });
    }
    return result;
  };
  var createTimeScaleFromFolds = (folds) => {
    const hourTop = (hour) => {
      let top = (hour - SCHEDULE_START_HOUR) * HOUR_PX;
      for (const fold of folds) {
        if (hour <= fold.start) continue;
        if (hour < fold.end) {
          top -= (hour - fold.start) * HOUR_PX;
          top += (hour - fold.start) / (fold.end - fold.start) * FOLD_MARKER_PX;
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
      }
    };
  };
  var useWeeklySharedTimeScale = ({ weekDays, expandedEmptyFolds }) => useMemo(() => {
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
      const daysWithLongCoverage = daysWithAnyData.filter((day) => (day.events || []).some((event) => event.endHour - event.startHour >= LONG_EVENT_FOLD_THRESHOLD_HOURS && event.startHour < hourEnd && event.endHour > hour));
      const daysWithConflictingData = daysWithAnyData.filter((day) => !daysWithLongCoverage.includes(day) && (day.events || []).some((event) => event.startHour < hourEnd && event.endHour > hour));
      const hasEnoughSupport = daysWithLongCoverage.length >= Math.min(WEEKLY_LONG_EVENT_MIN_SUPPORT_DAYS, daysWithAnyData.length);
      if (hasEnoughSupport && daysWithConflictingData.length === 0) foldableEventHours.push(hour);
      const allKnownDaysEmpty = daysWithAnyData.every((day) => !(day.events || []).some((event) => event.startHour < hourEnd && event.endHour > hour));
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
          rawFolds.push({ start: foldStart, end: foldEnd, type: "event", foldId: `event:week:${foldStart}-${foldEnd}` });
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
            rawFolds.push({ start: foldStart, end: foldEnd, type: "empty", foldId });
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
        prev.type = prev.type === fold.type ? prev.type : "mixed";
        prev.foldId = prev.foldId || fold.foldId;
      } else {
        folds.push({ ...fold });
      }
    }
    return createTimeScaleFromFolds(folds);
  }, [expandedEmptyFolds, weekDays]);
  var buildTimeRows = (timeScale) => {
    const rows = [];
    let h = SCHEDULE_START_HOUR;
    while (h <= SCHEDULE_END_HOUR) {
      const fold = timeScale.foldStartingAt(h);
      if (fold) {
        const label2 = h === 0 ? "12 am" : h === 12 ? "noon" : h < 12 ? `${h} am` : `${h - 12} pm`;
        rows.push({ h, label: label2, height: FOLD_MARKER_PX, folded: true, fold });
        h = fold.end;
        continue;
      }
      const label = h === 0 ? "12 am" : h === 12 ? "noon" : h < 12 ? `${h} am` : `${h - 12} pm`;
      rows.push({ h, label, height: timeScale.hourHeight(h), folded: false });
      h += 1;
    }
    return rows;
  };
  var SharedTimeAxis = ({ rows, weekNumber, onExpandFold }) => /* @__PURE__ */ React.createElement("aside", { style: {
    minWidth: 64,
    borderLeft: "1px solid var(--rule-soft)",
    display: "flex",
    flexDirection: "column"
  } }, /* @__PURE__ */ React.createElement("header", { style: {
    height: 76,
    padding: "12px 8px 10px",
    borderBottom: "1px solid var(--rule)",
    background: "color-mix(in srgb, var(--paper-2) 88%, white 12%)"
  } }, /* @__PURE__ */ React.createElement("div", { className: "eyebrow", style: { fontSize: 8, letterSpacing: "0.14em" } }, "Week ", weekNumber)), /* @__PURE__ */ React.createElement("section", null, rows.map((row, i) => {
    const isLast = i === rows.length - 1;
    const canExpand = row.folded && row.fold && row.fold.foldId;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: row.h,
        style: {
          height: row.height,
          borderBottom: isLast ? "none" : "1px solid var(--rule-soft)",
          background: row.folded ? "rgba(178, 151, 124, 0.06)" : "transparent",
          cursor: canExpand ? "pointer" : "default",
          padding: row.folded ? "5px 6px 0 8px" : "4px 6px 0 8px",
          boxSizing: "border-box",
          position: "relative"
        },
        role: canExpand ? "button" : void 0,
        tabIndex: canExpand ? 0 : void 0,
        onClick: canExpand ? () => onExpandFold(row.fold.foldId) : void 0,
        onKeyDown: canExpand ? (ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            onExpandFold(row.fold.foldId);
          }
        } : void 0
      },
      /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 8,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--ink-4)",
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
        overflow: "hidden"
      } }, row.label, row.folded && /* @__PURE__ */ React.createElement("span", { style: { display: "block", fontSize: 7, opacity: 0.62 } }, "(folded)"))
    );
  })));
  var viewSwitchLinkStyle = (active) => ({
    textDecoration: "none"
  });
  var RepositoryHeader = ({ isMobile }) => /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: isMobile ? 14 : 18,
    padding: isMobile ? "0 2px" : "0 6px",
    background: "transparent",
    color: "var(--ink-2)",
    height: 12,
    lineHeight: "12px"
  } }, /* @__PURE__ */ React.createElement(
    "a",
    {
      href: "https://github.com/BomBomLab/Journal/blob/main/README.md",
      target: "_blank",
      rel: "noreferrer",
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink-3)",
        textDecoration: "none",
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        fontWeight: 600,
        whiteSpace: "nowrap",
        lineHeight: "12px"
      }
    },
    "BomBomLab/Journal"
  ));
  var WeeklyDailyHeader = ({ weekStartKey, onPrev, onNext, isMobile }) => /* @__PURE__ */ React.createElement("header", { style: { marginBottom: isMobile ? 22 : 28 } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr auto 1fr",
    justifyItems: isMobile ? "center" : "stretch",
    alignItems: "center",
    gap: 10,
    padding: isMobile ? "0" : "0 6px",
    rowGap: isMobile ? 12 : 0
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: isMobile ? "none" : "block" } }), /* @__PURE__ */ React.createElement("nav", { className: "pill-group", "aria-label": "Journal view tabs" }, /* @__PURE__ */ React.createElement("a", { className: "pill", "data-on": false, href: `Journal.html?view=daily&date=${weekStartKey}`, style: viewSwitchLinkStyle(false) }, "Daily"), /* @__PURE__ */ React.createElement("a", { className: "pill", "data-on": true, href: `Journal.html?view=weekly&date=${weekStartKey}`, style: viewSwitchLinkStyle(true) }, "Weekly Grid"), /* @__PURE__ */ React.createElement("a", { className: "pill", "data-on": false, href: `Journal.html?view=monthly&date=${weekStartKey}`, style: viewSwitchLinkStyle(false) }, "Monthly")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, justifySelf: isMobile ? "center" : "end" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "icon-btn", onClick: onPrev, "aria-label": "Previous week", style: iconButtonStyle }, /* @__PURE__ */ React.createElement(Chevron, { dir: "left" })), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--ink-2)",
    minWidth: 120,
    textAlign: "center",
    fontWeight: 500
  } }, "Week ", getWeekNumber(weekStartKey), " \xB7 ", getISOWeek(weekStartKey).year), /* @__PURE__ */ React.createElement("button", { type: "button", className: "icon-btn", onClick: onNext, "aria-label": "Next week", style: iconButtonStyle }, /* @__PURE__ */ React.createElement(Chevron, { dir: "right" })))));
  var DailyScheduleColumn = ({ dateKey, events, timeScale, rows }) => {
    const [expandedEventId, setExpandedEventId] = useState(null);
    const eventSignature = useMemo(() => (events || []).map((event) => `${event.id || event.title}:${event.startHour}-${event.endHour}`).join("|"), [events]);
    useEffect(() => {
      setExpandedEventId(null);
    }, [dateKey, eventSignature]);
    const layoutMap = computeLayout(events);
    const dayNumber = parseDateKey(dateKey).getUTCDate();
    const weekday = formatDisplayDate(dateKey, { weekday: "short" });
    return /* @__PURE__ */ React.createElement("article", { style: {
      minWidth: 188,
      borderLeft: "1px solid var(--rule-soft)",
      display: "flex",
      flexDirection: "column"
    } }, /* @__PURE__ */ React.createElement("header", { style: {
      height: 76,
      padding: "12px 12px 10px",
      borderBottom: "1px solid var(--rule)",
      background: "color-mix(in srgb, var(--paper-2) 88%, white 12%)"
    } }, /* @__PURE__ */ React.createElement("div", { className: "eyebrow", style: { fontSize: 8.5, letterSpacing: "0.18em" } }, weekday), /* @__PURE__ */ React.createElement("div", { className: "font-serif", style: { display: "flex", alignItems: "baseline", gap: 3, marginTop: 3 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 34, lineHeight: 1, fontWeight: 500 } }, dayNumber), /* @__PURE__ */ React.createElement("sup", { style: { fontSize: 13 } }, getOrdinal(dayNumber)))), /* @__PURE__ */ React.createElement("section", { style: { position: "relative", overflow: "hidden", background: "transparent" } }, rows.map((row, i) => {
      const isLast = i === rows.length - 1;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: row.h,
          style: {
            height: row.height,
            borderBottom: isLast ? "none" : "1px solid var(--rule-soft)",
            background: row.folded ? "rgba(178, 151, 124, 0.06)" : "transparent",
            position: "relative"
          }
        },
        row.folded && /* @__PURE__ */ React.createElement("div", { style: {
          position: "absolute",
          left: 0,
          right: 8,
          top: "50%",
          borderTop: "1px dashed var(--rule)"
        } })
      );
    }), /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      overflow: "visible",
      pointerEvents: "none"
    } }, (events || []).map((event, index) => {
      const cat = EVENT_CATEGORIES[event.categoryId] || { fill: "#eee", ink: "#333", label: event.categoryId };
      const eventId = event.id || `${dateKey}:${index}`;
      const note = String(event.note || "").trim();
      const tags = Array.isArray(event.tags) ? event.tags.filter(Boolean) : [];
      const hasDetails = Boolean(note || tags.length);
      const isExpanded = expandedEventId === eventId;
      const rawTop = timeScale.hourTop(event.startHour) - timeScale.hourTop(SCHEDULE_START_HOUR);
      const rawBottom = timeScale.hourTop(event.endHour) - timeScale.hourTop(SCHEDULE_START_HOUR);
      const top = Math.round(rawTop);
      const naturalHeight = Math.max(12, Math.round(rawBottom - rawTop) - SCHEDULE_EVENT_GAP_PX);
      const layout = layoutMap.get(index) || { role: "primary", totalSecondary: 0 };
      const isSecondary = layout.role === "secondary";
      const hh = DATA ? DATA.hourLabel : formatHourLabel;
      if (isSecondary) {
        const stickyHeight = isExpanded ? Math.max(naturalHeight + 42, note ? 132 : 96) : 22;
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: eventId,
            title: event.title,
            style: {
              position: "absolute",
              right: 10,
              width: 58,
              top,
              height: stickyHeight,
              background: softenEventFill(cat.fill),
              color: cat.ink,
              borderRadius: 10,
              boxShadow: isExpanded ? "0 8px 18px rgba(94, 73, 49, 0.10), 0 1px 4px rgba(94, 73, 49, 0.05)" : "0 5px 12px rgba(94, 73, 49, 0.08), 0 1px 3px rgba(94, 73, 49, 0.04)",
              border: "0.5px solid rgba(255,255,255,0.38)",
              overflow: "hidden",
              pointerEvents: "auto",
              cursor: "pointer",
              zIndex: isExpanded ? 12 : 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: isExpanded ? "flex-start" : "center",
              gap: isExpanded ? 5 : 0,
              padding: isExpanded ? "8px 8px 10px" : "0 8px",
              transform: `rotate(${(layout.secondaryIndex || 0) % 2 === 0 ? -1.2 : 1.2}deg)`
            },
            onClick: () => setExpandedEventId((cur) => cur === eventId ? null : eventId),
            role: hasDetails ? "button" : void 0,
            tabIndex: hasDetails ? 0 : void 0,
            "aria-expanded": hasDetails ? isExpanded : void 0
          },
          /* @__PURE__ */ React.createElement("span", { style: {
            fontSize: 9.5,
            fontWeight: 600,
            color: cat.ink,
            lineHeight: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
            display: "block"
          } }, event.title),
          !isExpanded && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 8, opacity: 0.6, display: "block", lineHeight: 1.2 } }, event.durationMinutes >= 60 ? `${Math.floor(event.durationMinutes / 60)}h${event.durationMinutes % 60 ? ` ${event.durationMinutes % 60}m` : ""}` : `${event.durationMinutes}m`),
          isExpanded && note && /* @__PURE__ */ React.createElement("span", { style: {
            fontSize: 9,
            lineHeight: 1.3,
            opacity: 0.78,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 7
          } }, note)
        );
      }
      const height = isExpanded ? Math.max(naturalHeight, note ? 108 : 70) : naturalHeight;
      const duration = event.endHour - event.startHour;
      const compact = (duration < 0.8 || naturalHeight < 44) && !isExpanded;
      const canPreviewDetails = note && naturalHeight >= 72;
      const primaryHasSecondary = layout.totalSecondary > 0;
      const contentMaxWidth = primaryHasSecondary && !compact ? "calc(66% - 8px)" : "100%";
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: eventId,
          style: {
            position: "absolute",
            left: 5,
            right: 5,
            top,
            height,
            background: cat.fill,
            color: cat.ink,
            borderRadius: 6,
            padding: compact ? "2px 7px" : "6px 8px",
            fontSize: 11,
            lineHeight: 1.25,
            display: "flex",
            flexDirection: compact ? "row" : "column",
            justifyContent: compact ? "space-between" : "flex-start",
            alignItems: compact ? "center" : "flex-start",
            gap: 3,
            overflow: "hidden",
            pointerEvents: "auto",
            zIndex: isExpanded ? 10 : 1,
            cursor: hasDetails ? "pointer" : "default"
          },
          role: hasDetails ? "button" : void 0,
          tabIndex: hasDetails ? 0 : void 0,
          "aria-expanded": hasDetails ? isExpanded : void 0,
          onClick: hasDetails ? () => setExpandedEventId((cur) => cur === eventId ? null : eventId) : void 0
        },
        /* @__PURE__ */ React.createElement("span", { style: {
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: contentMaxWidth,
          minWidth: 0
        } }, event.title),
        /* @__PURE__ */ React.createElement("span", { style: {
          fontSize: 9,
          opacity: 0.75,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          maxWidth: contentMaxWidth,
          minWidth: 0,
          flexShrink: compact ? 0 : 1,
          overflow: "hidden",
          textOverflow: "ellipsis"
        } }, hh(event.startHour), " \u2013 ", hh(event.endHour), " \xB7 ", event.durationMinutes >= 60 ? `${Math.floor(event.durationMinutes / 60)}h${event.durationMinutes % 60 ? ` ${event.durationMinutes % 60}m` : ""}` : `${event.durationMinutes}m`),
        !isExpanded && !canPreviewDetails && hasDetails && !compact && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, opacity: 0.72, fontStyle: "italic", maxWidth: contentMaxWidth } }, "tap for details"),
        (canPreviewDetails || isExpanded) && note && /* @__PURE__ */ React.createElement("span", { style: {
          fontSize: 9.5,
          lineHeight: 1.3,
          opacity: 0.88,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: isExpanded ? 6 : 2,
          maxWidth: contentMaxWidth
        } }, note)
      );
    }))));
  };
  var WeeklyDailyApp = () => {
    const latestDateKey = useMemo(() => {
      const keys = Object.keys(DATA && DATA.journal && DATA.journal.day || {}).sort();
      return keys[keys.length - 1] || TODAY_KEY;
    }, []);
    const requestedDateKey = QUERY_PARAMS.get("date");
    const initialWeekStartKey = requestedDateKey && /^\d{4}-\d{2}-\d{2}$/.test(requestedDateKey) ? getWeekStartKey(requestedDateKey) : getWeekStartKey(latestDateKey);
    const [weekStartKey, setWeekStartKey] = useState(initialWeekStartKey);
    const [expandedEmptyFolds, setExpandedEmptyFolds] = useState(() => /* @__PURE__ */ new Set());
    const [isMobile, setIsMobile] = useState(getIsMobileViewport);
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
      const dateKey = addDays(weekStartKey, index);
      const day = DATA && DATA.journal && DATA.journal.day && DATA.journal.day[dateKey];
      return { dateKey, events: day && day.events || DATA && DATA.eventsByDay && DATA.eventsByDay[dateKey] || [] };
    }), [weekStartKey]);
    const sharedTimeScale = useWeeklySharedTimeScale({ weekDays, expandedEmptyFolds });
    const sharedRows = useMemo(() => buildTimeRows(sharedTimeScale), [sharedTimeScale]);
    useEffect(() => {
      setExpandedEmptyFolds(/* @__PURE__ */ new Set());
    }, [weekStartKey]);
    useEffect(() => {
      const onResize = () => setIsMobile(getIsMobileViewport());
      onResize();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);
    const expandSharedFold = (foldId) => {
      setExpandedEmptyFolds((current) => {
        const next = new Set(current);
        next.add(foldId);
        return next;
      });
    };
    return /* @__PURE__ */ React.createElement("main", { style: { minHeight: "100vh", padding: isMobile ? "20px 14px 40px" : "40px 28px 80px", overflowX: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1460, margin: "0 auto" } }, /* @__PURE__ */ React.createElement(RepositoryHeader, { isMobile }), /* @__PURE__ */ React.createElement(
      WeeklyDailyHeader,
      {
        weekStartKey,
        onPrev: () => setWeekStartKey(addDays(weekStartKey, -7)),
        onNext: () => setWeekStartKey(addDays(weekStartKey, 7)),
        isMobile
      }
    ), /* @__PURE__ */ React.createElement("section", { className: "paper-surface page-shadow", style: {
      borderRadius: isMobile ? 10 : 14,
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      overscrollBehaviorX: "contain",
      maxWidth: "100%",
      border: "1px solid var(--rule-soft)"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      minWidth: 1380,
      display: "grid",
      gridTemplateColumns: "64px repeat(7, minmax(188px, 1fr))"
    } }, /* @__PURE__ */ React.createElement(SharedTimeAxis, { rows: sharedRows, weekNumber: getWeekNumber(weekStartKey), onExpandFold: expandSharedFold }), weekDays.map((day) => /* @__PURE__ */ React.createElement(
      DailyScheduleColumn,
      {
        key: day.dateKey,
        dateKey: day.dateKey,
        events: day.events,
        timeScale: sharedTimeScale,
        rows: sharedRows
      }
    ))))));
  };
  var iconButtonStyle = {
    appearance: "none",
    border: 0,
    borderRadius: 999,
    background: "transparent",
    color: "var(--ink-3)",
    width: 28,
    height: 28,
    display: "inline-grid",
    placeItems: "center",
    padding: 0,
    cursor: "pointer"
  };
  ReactDOM.createRoot(document.getElementById("weekly-root")).render(/* @__PURE__ */ React.createElement(WeeklyDailyApp, null));
})();
