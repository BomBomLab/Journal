var JournalRuntime = (() => {
  // src/tweaks-panel.jsx
  var __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;width:100%;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;height:22px;
    border-radius:6px;cursor:default;padding:0}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}
`;
  function useTweaks2(defaults) {
    const [values, setValues] = React.useState(defaults);
    const setTweak = React.useCallback((key, val) => {
      setValues((prev) => ({ ...prev, [key]: val }));
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [key]: val } }, "*");
    }, []);
    return [values, setTweak];
  }
  function TweaksPanel2({ title = "Tweaks", children }) {
    const [open, setOpen] = React.useState(false);
    const dragRef = React.useRef(null);
    const offsetRef = React.useRef({ x: 16, y: 16 });
    const PAD = 16;
    const clampToViewport = React.useCallback(() => {
      const panel = dragRef.current;
      if (!panel) return;
      const w = panel.offsetWidth, h = panel.offsetHeight;
      const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
      const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
      offsetRef.current = {
        x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
        y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
      };
      panel.style.right = offsetRef.current.x + "px";
      panel.style.bottom = offsetRef.current.y + "px";
    }, []);
    React.useEffect(() => {
      if (!open) return;
      clampToViewport();
      if (typeof ResizeObserver === "undefined") {
        window.addEventListener("resize", clampToViewport);
        return () => window.removeEventListener("resize", clampToViewport);
      }
      const ro = new ResizeObserver(clampToViewport);
      ro.observe(document.documentElement);
      return () => ro.disconnect();
    }, [open, clampToViewport]);
    React.useEffect(() => {
      const onMsg = (e) => {
        const t = e?.data?.type;
        if (t === "__activate_edit_mode") setOpen(true);
        else if (t === "__deactivate_edit_mode") setOpen(false);
      };
      window.addEventListener("message", onMsg);
      window.parent.postMessage({ type: "__edit_mode_available" }, "*");
      return () => window.removeEventListener("message", onMsg);
    }, []);
    const dismiss = () => {
      setOpen(false);
      window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*");
    };
    const onDragStart = (e) => {
      const panel = dragRef.current;
      if (!panel) return;
      const r = panel.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY;
      const startRight = window.innerWidth - r.right;
      const startBottom = window.innerHeight - r.bottom;
      const move = (ev) => {
        offsetRef.current = {
          x: startRight - (ev.clientX - sx),
          y: startBottom - (ev.clientY - sy)
        };
        clampToViewport();
      };
      const up = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };
    if (!open) return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("style", null, __TWEAKS_STYLE), /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: dragRef,
        className: "twk-panel",
        style: { right: offsetRef.current.x, bottom: offsetRef.current.y }
      },
      /* @__PURE__ */ React.createElement("div", { className: "twk-hd", onMouseDown: onDragStart }, /* @__PURE__ */ React.createElement("b", null, title), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "twk-x",
          "aria-label": "Close tweaks",
          onMouseDown: (e) => e.stopPropagation(),
          onClick: dismiss
        },
        "\u2715"
      )),
      /* @__PURE__ */ React.createElement("div", { className: "twk-body" }, children)
    ));
  }
  function TweakSection2({ label, children }) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "twk-sect" }, label), children);
  }
  function TweakRow({ label, value, children, inline = false }) {
    return /* @__PURE__ */ React.createElement("div", { className: inline ? "twk-row twk-row-h" : "twk-row" }, /* @__PURE__ */ React.createElement("div", { className: "twk-lbl" }, /* @__PURE__ */ React.createElement("span", null, label), value != null && /* @__PURE__ */ React.createElement("span", { className: "twk-val" }, value)), children);
  }
  function TweakSlider2({ label, value, min = 0, max = 100, step = 1, unit = "", onChange }) {
    return /* @__PURE__ */ React.createElement(TweakRow, { label, value: `${value}${unit}` }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        className: "twk-slider",
        min,
        max,
        step,
        value,
        onChange: (e) => onChange(Number(e.target.value))
      }
    ));
  }
  function TweakToggle2({ label, value, onChange }) {
    return /* @__PURE__ */ React.createElement("div", { className: "twk-row twk-row-h" }, /* @__PURE__ */ React.createElement("div", { className: "twk-lbl" }, /* @__PURE__ */ React.createElement("span", null, label)), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "twk-toggle",
        "data-on": value ? "1" : "0",
        role: "switch",
        "aria-checked": !!value,
        onClick: () => onChange(!value)
      },
      /* @__PURE__ */ React.createElement("i", null)
    ));
  }
  function TweakRadio2({ label, value, options, onChange }) {
    const trackRef = React.useRef(null);
    const [dragging, setDragging] = React.useState(false);
    const opts = options.map((o) => typeof o === "object" ? o : { value: o, label: o });
    const idx = Math.max(0, opts.findIndex((o) => o.value === value));
    const n = opts.length;
    const valueRef = React.useRef(value);
    valueRef.current = value;
    const segAt = (clientX) => {
      const r = trackRef.current.getBoundingClientRect();
      const inner = r.width - 4;
      const i = Math.floor((clientX - r.left - 2) / inner * n);
      return opts[Math.max(0, Math.min(n - 1, i))].value;
    };
    const onPointerDown = (e) => {
      setDragging(true);
      const v0 = segAt(e.clientX);
      if (v0 !== valueRef.current) onChange(v0);
      const move = (ev) => {
        if (!trackRef.current) return;
        const v = segAt(ev.clientX);
        if (v !== valueRef.current) onChange(v);
      };
      const up = () => {
        setDragging(false);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
    return /* @__PURE__ */ React.createElement(TweakRow, { label }, /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: trackRef,
        role: "radiogroup",
        onPointerDown,
        className: dragging ? "twk-seg dragging" : "twk-seg"
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "twk-seg-thumb",
          style: {
            left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
            width: `calc((100% - 4px) / ${n})`
          }
        }
      ),
      opts.map((o) => /* @__PURE__ */ React.createElement("button", { key: o.value, type: "button", role: "radio", "aria-checked": o.value === value }, o.label))
    ));
  }
  function TweakSelect2({ label, value, options, onChange }) {
    return /* @__PURE__ */ React.createElement(TweakRow, { label }, /* @__PURE__ */ React.createElement("select", { className: "twk-field", value, onChange: (e) => onChange(e.target.value) }, options.map((o) => {
      const v = typeof o === "object" ? o.value : o;
      const l = typeof o === "object" ? o.label : o;
      return /* @__PURE__ */ React.createElement("option", { key: v, value: v }, l);
    })));
  }
  function TweakText({ label, value, placeholder, onChange }) {
    return /* @__PURE__ */ React.createElement(TweakRow, { label }, /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "twk-field",
        type: "text",
        value,
        placeholder,
        onChange: (e) => onChange(e.target.value)
      }
    ));
  }
  function TweakNumber({ label, value, min, max, step = 1, unit = "", onChange }) {
    const clamp = (n) => {
      if (min != null && n < min) return min;
      if (max != null && n > max) return max;
      return n;
    };
    const startRef = React.useRef({ x: 0, val: 0 });
    const onScrubStart = (e) => {
      e.preventDefault();
      startRef.current = { x: e.clientX, val: value };
      const decimals = (String(step).split(".")[1] || "").length;
      const move = (ev) => {
        const dx = ev.clientX - startRef.current.x;
        const raw = startRef.current.val + dx * step;
        const snapped = Math.round(raw / step) * step;
        onChange(clamp(Number(snapped.toFixed(decimals))));
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "twk-num" }, /* @__PURE__ */ React.createElement("span", { className: "twk-num-lbl", onPointerDown: onScrubStart }, label), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value,
        min,
        max,
        step,
        onChange: (e) => onChange(clamp(Number(e.target.value)))
      }
    ), unit && /* @__PURE__ */ React.createElement("span", { className: "twk-num-unit" }, unit));
  }
  function TweakColor({ label, value, onChange }) {
    return /* @__PURE__ */ React.createElement("div", { className: "twk-row twk-row-h" }, /* @__PURE__ */ React.createElement("div", { className: "twk-lbl" }, /* @__PURE__ */ React.createElement("span", null, label)), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "color",
        className: "twk-swatch",
        value,
        onChange: (e) => onChange(e.target.value)
      }
    ));
  }
  function TweakButton({ label, onClick, secondary = false }) {
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: secondary ? "twk-btn secondary" : "twk-btn",
        onClick
      },
      label
    );
  }
  Object.assign(window, {
    useTweaks: useTweaks2,
    TweaksPanel: TweaksPanel2,
    TweakSection: TweakSection2,
    TweakRow,
    TweakSlider: TweakSlider2,
    TweakToggle: TweakToggle2,
    TweakRadio: TweakRadio2,
    TweakSelect: TweakSelect2,
    TweakText,
    TweakNumber,
    TweakColor,
    TweakButton
  });

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

  // src/app.jsx
  var { useState, useMemo, useEffect } = React;
  var MOBILE_BREAKPOINT = 860;
  var JOURNAL_LOCATION = {
    name: "Shenzhen",
    latitude: 22.5431,
    longitude: 114.0579,
    timezone: "Asia/Shanghai"
  };
  var THEMES = {
    "Warm Paper": {
      "--paper": "oklch(0.970 0.012 75)",
      "--paper-2": "oklch(0.988 0.008 80)",
      "--paper-edge": "oklch(0.945 0.014 70)",
      "--ink": "oklch(0.305 0.018 55)",
      "--ink-2": "oklch(0.480 0.014 58)",
      "--ink-3": "oklch(0.680 0.012 62)",
      "--ink-4": "oklch(0.820 0.010 68)",
      "--rule": "oklch(0.880 0.014 65)",
      "--rule-soft": "oklch(0.935 0.012 70)",
      "--accent": "oklch(0.660 0.070 42)",
      "--accent-ink": "oklch(0.520 0.080 40)",
      "--accent-wash": "oklch(0.955 0.022 50)",
      "--accent-dot": "oklch(0.880 0.040 48)"
    },
    "Bone + Sepia": {
      "--paper": "oklch(0.975 0.006 90)",
      "--paper-2": "oklch(0.992 0.004 90)",
      "--paper-edge": "oklch(0.950 0.008 88)",
      "--ink": "oklch(0.285 0.020 60)",
      "--ink-2": "oklch(0.460 0.016 60)",
      "--ink-3": "oklch(0.660 0.012 65)",
      "--ink-4": "oklch(0.810 0.008 70)",
      "--rule": "oklch(0.870 0.010 70)",
      "--rule-soft": "oklch(0.930 0.008 75)",
      "--accent": "oklch(0.600 0.060 55)",
      "--accent-ink": "oklch(0.460 0.070 50)",
      "--accent-wash": "oklch(0.950 0.018 65)",
      "--accent-dot": "oklch(0.870 0.035 55)"
    },
    "Aged Linen": {
      "--paper": "oklch(0.955 0.020 68)",
      "--paper-2": "oklch(0.975 0.015 72)",
      "--paper-edge": "oklch(0.925 0.022 64)",
      "--ink": "oklch(0.310 0.022 45)",
      "--ink-2": "oklch(0.490 0.018 48)",
      "--ink-3": "oklch(0.690 0.015 55)",
      "--ink-4": "oklch(0.820 0.014 60)",
      "--rule": "oklch(0.870 0.020 58)",
      "--rule-soft": "oklch(0.920 0.018 62)",
      "--accent": "oklch(0.640 0.080 35)",
      "--accent-ink": "oklch(0.500 0.090 32)",
      "--accent-wash": "oklch(0.935 0.032 42)",
      "--accent-dot": "oklch(0.860 0.050 40)"
    }
  };
  var ACCENT_DENSITY = {
    whisper: { washAlpha: 0.55, chipOpacity: 0.85 },
    muted: { washAlpha: 0.85, chipOpacity: 1 },
    confident: { washAlpha: 1, chipOpacity: 1 }
  };
  var Chevron = ({ dir = "left", size = 16 }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }, dir === "left" ? /* @__PURE__ */ React.createElement("polyline", { points: "15 18 9 12 15 6" }) : /* @__PURE__ */ React.createElement("polyline", { points: "9 18 15 12 9 6" }));
  var DOW_LABELS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var getIsMobileViewport = () => typeof window !== "undefined" ? window.innerWidth <= MOBILE_BREAKPOINT : false;
  var summarizeDay = (events) => {
    if (!events || !events.length) return "";
    const candidates = events.filter((e) => e.categoryId !== "rest").filter((e) => !(e.subcategoryId || "").startsWith("life.hygiene")).slice().sort((a, b) => b.endHour - b.startHour - (a.endHour - a.startHour));
    return (candidates[0] || events[0]).title;
  };
  var DATA = window.JOURNAL_DATA;
  var QUERY_PARAMS = new URLSearchParams(window.location.search);
  var ALL_DATE_KEYS = (() => {
    const keys = /* @__PURE__ */ new Set([
      ...Object.keys(DATA && DATA.eventsByDay || {}),
      ...Object.keys(DATA && DATA.DIARY_SUMMARY_BY_DAY || {}),
      ...Object.keys(DATA && DATA.TODO_BY_DAY || {})
    ]);
    return Array.from(keys).sort();
  })();
  var TODAY_KEY = (() => {
    const now = /* @__PURE__ */ new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();
  var DEFAULT_LANDING_KEY = "2026-04-25";
  var isSampleData = Boolean(DATA && DATA.__isSample);
  var REQUESTED_DATE_KEY = (() => {
    const value = QUERY_PARAMS.get("date");
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && ALL_DATE_KEYS.includes(value) ? value : "";
  })();
  var INITIAL_VIEW = (() => {
    const value = QUERY_PARAMS.get("view");
    return ["daily", "weekly", "monthly"].includes(value) ? value : "daily";
  })();
  var INITIAL_CURSOR_KEY = (() => {
    if (isSampleData && ALL_DATE_KEYS.includes(DEFAULT_LANDING_KEY)) return DEFAULT_LANDING_KEY;
    if (REQUESTED_DATE_KEY) return REQUESTED_DATE_KEY;
    if (ALL_DATE_KEYS.includes(TODAY_KEY)) return TODAY_KEY;
    return ALL_DATE_KEYS[ALL_DATE_KEYS.length - 1] || TODAY_KEY;
  })();
  var parseDateKey = (dateKey) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };
  var formatDateKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  var addDays = (dateKey, days) => {
    const date = parseDateKey(dateKey);
    date.setUTCDate(date.getUTCDate() + days);
    return formatDateKey(date);
  };
  var addMonths = (dateKey, delta) => {
    const date = parseDateKey(dateKey);
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + delta);
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return formatDateKey(date);
  };
  var formatDisplayDate = (dateKey, options) => parseDateKey(dateKey).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
  var getOrdinal = (n) => {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return "th";
    const mod10 = n % 10;
    if (mod10 === 1) return "st";
    if (mod10 === 2) return "nd";
    if (mod10 === 3) return "rd";
    return "th";
  };
  var getWeekStartKey = (dateKey) => {
    const date = parseDateKey(dateKey);
    const day = date.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(dateKey, diff);
  };
  var getWeekDateKeys = (dateKey) => {
    const startKey = getWeekStartKey(dateKey);
    return Array.from({ length: 7 }, (_, index) => addDays(startKey, index));
  };
  var getDateMeta = (dateKey) => {
    const date = parseDateKey(dateKey);
    return {
      key: dateKey,
      date,
      dayNumber: date.getUTCDate(),
      dayLabel: DOW_LABELS[date.getUTCDay()],
      monthLabel: formatDisplayDate(dateKey, { month: "short" }).toLowerCase()
    };
  };
  var getDayTodos = (dateKey, limit = 6) => {
    if (DATA && DATA.journal && DATA.journal.day && DATA.journal.day[dateKey]) {
      const tasks = DATA.journal.day[dateKey].tasks || [];
      return Array.from({ length: limit }, (_, index) => tasks[index] || { text: "", done: false });
    }
    const todos = (DATA && DATA.TODO_BY_DAY[dateKey] || []).filter((item) => item.status !== "dropped");
    return Array.from({ length: limit }, (_, index) => {
      const item = todos[index];
      return { text: item ? item.text : "", done: item ? item.status === "done" : false };
    });
  };
  var getWeekTodos = (dateKeys, limit = 6) => {
    const weekKey = dateKeys[0];
    if (DATA && DATA.journal && DATA.journal.week && DATA.journal.week[weekKey]) {
      const tasks = DATA.journal.week[weekKey].tasks || [];
      return Array.from({ length: limit }, (_, index) => tasks[index] || { text: "", done: false });
    }
    const merged = [];
    const seen = /* @__PURE__ */ new Set();
    dateKeys.forEach((dateKey) => {
      (DATA && DATA.TODO_BY_DAY[dateKey] || []).filter((item) => item.status !== "dropped").forEach((item) => {
        if (seen.has(item.text)) return;
        seen.add(item.text);
        merged.push({ text: item.text, done: item.status === "done" });
      });
    });
    return Array.from({ length: limit }, (_, index) => merged[index] || { text: "", done: false });
  };
  var getWeekData = (dateKey) => {
    const todayKey = TODAY_KEY;
    const weekKey = getWeekStartKey(dateKey);
    if (DATA && DATA.journal && DATA.journal.week && DATA.journal.week[weekKey]) {
      return (DATA.journal.week[weekKey].days || []).map((day) => ({
        dateKey: day.dateKey,
        date: day.dayNumber,
        day: String(day.weekday || "").toLowerCase(),
        month: formatDisplayDate(day.dateKey, { month: "short" }).toLowerCase(),
        events: day.events || [],
        tasks: day.metrics ? day.metrics.eventCount : (day.events || []).length,
        isToday: day.dateKey === todayKey
      }));
    }
    return getWeekDateKeys(dateKey).map((dk) => {
      const meta = getDateMeta(dk);
      const events = DATA && DATA.eventsByDay[dk] || [];
      return {
        dateKey: dk,
        date: meta.dayNumber,
        day: meta.dayLabel,
        month: meta.monthLabel,
        events,
        tasks: events.length,
        isToday: dk === todayKey
      };
    });
  };
  var getWeekNotes = (dateKeys) => {
    const weekKey = dateKeys[0];
    if (DATA && DATA.journal && DATA.journal.week && DATA.journal.week[weekKey]) {
      return (DATA.journal.week[weekKey].notes || []).map((note) => ({
        ...note,
        text: toSingleLineSentence(note.text)
      })).filter((note) => note.text);
    }
    return dateKeys.map((dateKey) => {
      const summary = DATA && DATA.DIARY_SUMMARY_BY_DAY[dateKey] || "";
      const text = summary ? toSingleLineSentence(summary) : toSingleLineSentence(summarizeDay(DATA && DATA.eventsByDay[dateKey] || []));
      return { dateKey, text };
    }).filter((item) => item.text);
  };
  var getWeeklyReflection = (dateKeys) => {
    const weekKey = dateKeys[0];
    if (DATA && DATA.journal && DATA.journal.week && DATA.journal.week[weekKey]) {
      const days = DATA.journal.week[weekKey].days || [];
      const lastSummary = days.slice().reverse().map((d) => toSingleLineSentence(d.summaryText)).find(Boolean);
      return lastSummary || "No recorded rhythm for this week yet.";
    }
    const categoryTotals = {};
    let longestEvent = null;
    dateKeys.forEach((dateKey) => {
      (DATA && DATA.eventsByDay[dateKey] || []).forEach((event) => {
        const duration = event.endHour - event.startHour;
        categoryTotals[event.categoryId] = (categoryTotals[event.categoryId] || 0) + duration;
        if (!longestEvent || duration > longestEvent.endHour - longestEvent.startHour) {
          longestEvent = event;
        }
      });
    });
    const topCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => DATA && DATA.CATEGORY_PALETTE[id] && DATA.CATEGORY_PALETTE[id].label || id.toUpperCase());
    if (!topCategories.length) return "No recorded rhythm for this week yet.";
    if (!longestEvent) return `${topCategories.join(" and ")} set the pace for this week.`;
    return `${topCategories.join(" and ")} set the pace this week, with "${longestEvent.title}" taking the longest single stretch.`;
  };
  var getMonthLabel = (dateKey) => formatDisplayDate(dateKey, { month: "long" });
  var getDaySummaryText = (dateKey) => DATA && DATA.journal && DATA.journal.day && DATA.journal.day[dateKey] && DATA.journal.day[dateKey].summary && DATA.journal.day[dateKey].summary.body || DATA && DATA.DIARY_SUMMARY_BY_DAY[dateKey] || "";
  var toSingleLineSentence = (text) => {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    if (!normalized) return "";
    const match = normalized.match(/.+?[.!?。！？](?=\s|$)/);
    return (match ? match[0] : normalized).trim();
  };
  var getLatestMonthSummaryLine = (dateKey) => {
    const monthKey = dateKey.slice(0, 7);
    const monthEntry = DATA && DATA.journal && DATA.journal.month && DATA.journal.month[monthKey];
    if (monthEntry && Array.isArray(monthEntry.days)) {
      const latest = monthEntry.days.slice().sort((a, b) => a.dateKey.localeCompare(b.dateKey)).reverse().map((day) => toSingleLineSentence(day.summaryText)).find(Boolean);
      if (latest) return latest;
    }
    return "";
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
  var buildMonthlyCells = (dateKey) => {
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
        const cellDate = new Date(gridStart.getTime() + index * 864e5);
        const cellKey = formatDateKey(cellDate);
        const dayEntry = monthDays.get(cellKey);
        return {
          key: cellKey,
          n: cellDate.getUTCDate(),
          muted: cellDate.getUTCMonth() !== monthIndex,
          events: dayEntry ? dayEntry.events || [] : [],
          cats: dayEntry ? dayEntry.categories || [] : [],
          isToday: cellKey === TODAY_KEY
        };
      });
    }
    const todayMeta = getDateMeta(TODAY_KEY);
    return Array.from({ length: totalCells }, (_, index) => {
      const cellDate = new Date(gridStart.getTime() + index * 864e5);
      const cellKey = formatDateKey(cellDate);
      const events = DATA && DATA.eventsByDay[cellKey] || [];
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
        isToday: cellKey === todayMeta.key
      };
    });
  };
  var Eyebrow = ({ children, rule = true, style }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, ...style || {} } }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, children), rule && /* @__PURE__ */ React.createElement("hr", { className: "divider-rule" }));
  var Tick = ({ on, onClick }) => /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "tick",
      "data-on": on ? "true" : "false",
      onClick: onClick || void 0,
      role: onClick ? "checkbox" : void 0,
      "aria-checked": onClick ? on : void 0,
      tabIndex: onClick ? 0 : void 0,
      style: onClick ? void 0 : { opacity: 0.45, cursor: "default" }
    }
  );
  var TODO_TEXT_STYLE = {
    fontFamily: "'Cormorant Garamond', 'Garamond', serif",
    fontSize: 12,
    lineHeight: 1.4,
    fontStyle: "italic"
  };
  var EVENT_BLOCK_GAP_PX = 2;
  var formatHourLabel = (value) => {
    const h = Math.floor(value);
    const m = Math.round((value - h) * 60);
    const suffix = h >= 12 ? "pm" : "am";
    const h12 = (h + 11) % 12 + 1;
    return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
  };
  var softenEventFill = (fill) => `color-mix(in oklch, ${fill} 78%, white)`;
  var WEATHER_CODE_LABELS = {
    0: "clear",
    1: "mostly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "foggy",
    48: "icy fog",
    51: "light drizzle",
    53: "drizzle",
    55: "dense drizzle",
    61: "light rain",
    63: "rain",
    65: "heavy rain",
    66: "freezing rain",
    67: "heavy freezing rain",
    71: "light snow",
    73: "snow",
    75: "heavy snow",
    77: "snow grains",
    80: "rain showers",
    81: "showers",
    82: "heavy showers",
    85: "snow showers",
    86: "heavy snow showers",
    95: "thunderstorm",
    96: "storm + hail",
    99: "severe storm"
  };
  var WEATHER_CACHE = /* @__PURE__ */ new Map();
  var MOOD_KEYWORDS = [
    { words: ["hopeful", "warm", "light", "lighter", "alive", "soft", "vivid", "playful", "steady", "funny", "win"], score: 1, labels: ["hopeful", "light"] },
    { words: ["restless", "drift", "floaty", "tired", "late", "fatigued", "underpowered"], score: -1, labels: ["tired", "drifty"] },
    { words: ["risk", "stuck", "staying awake", "unresolved", "drag", "heavy", "hard"], score: -1, labels: ["heavy", "uneasy"] },
    { words: ["reset", "gentle", "calm", "clear", "grounded"], score: 1, labels: ["calm", "steady"] }
  ];
  var deriveMoodFromSummary = (summaryText) => {
    const text = String(summaryText || "").toLowerCase();
    if (!text) return { rating: 3, labels: ["quiet", "unclear"] };
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
      labels: finalLabels.length ? finalLabels : rating >= 4 ? ["steady", "hopeful"] : rating <= 2 ? ["tired", "uneasy"] : ["mixed", "steady"]
    };
  };
  var fetchWeatherForDate = async (dateKey) => {
    if (WEATHER_CACHE.has(dateKey)) return WEATHER_CACHE.get(dateKey);
    const isPastOrToday = dateKey <= TODAY_KEY;
    const base = isPastOrToday ? "https://archive-api.open-meteo.com/v1/archive" : "https://api.open-meteo.com/v1/forecast";
    const params = new URLSearchParams({
      latitude: String(JOURNAL_LOCATION.latitude),
      longitude: String(JOURNAL_LOCATION.longitude),
      timezone: JOURNAL_LOCATION.timezone,
      start_date: dateKey,
      end_date: dateKey,
      daily: "weather_code,temperature_2m_max,temperature_2m_min"
    });
    const url = `${base}?${params.toString()}`;
    const promise = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`weather ${response.status}`);
      return response.json();
    }).then((json) => {
      const daily = json && json.daily;
      if (!daily || !daily.time || !daily.time.length) throw new Error("weather empty");
      return {
        max: Math.round(daily.temperature_2m_max[0]),
        min: Math.round(daily.temperature_2m_min[0]),
        code: daily.weather_code[0],
        label: WEATHER_CODE_LABELS[daily.weather_code[0]] || "unknown"
      };
    });
    WEATHER_CACHE.set(dateKey, promise);
    return promise;
  };
  var EventChip = ({ event, block = false }) => {
    const cat = DATA && DATA.CATEGORY_PALETTE[event.categoryId] || { fill: "#eee", ink: "#333" };
    return /* @__PURE__ */ React.createElement("span", { style: {
      display: block ? "block" : "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: block ? "2px 6px" : "2px 8px",
      borderRadius: block ? 6 : 999,
      background: cat.fill,
      color: cat.ink,
      fontFamily: "'Cormorant Garamond', 'Garamond', serif",
      fontSize: 11.5,
      lineHeight: 1.35,
      fontStyle: "italic",
      whiteSpace: block ? "nowrap" : "normal",
      overflow: "hidden",
      textOverflow: "ellipsis"
    } }, event.title);
  };
  var EventStrip = ({ events, empty = null, style }) => /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 12,
    color: "var(--ink-2)",
    display: "flex",
    flexWrap: "wrap",
    columnGap: EVENT_BLOCK_GAP_PX,
    rowGap: EVENT_BLOCK_GAP_PX,
    alignItems: "center",
    minWidth: 0,
    ...style
  } }, events.length === 0 ? empty : events.map((ev, j) => /* @__PURE__ */ React.createElement(EventChip, { key: ev.id || j, event: ev })));
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
  var Header = ({ view, setView, label, onPrev, onNext, isMobile, alternateHref = "" }) => /* @__PURE__ */ React.createElement("header", { style: {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr auto 1fr",
    alignItems: "center",
    justifyItems: isMobile ? "center" : "stretch",
    marginBottom: isMobile ? 22 : 28,
    padding: isMobile ? "0" : "0 6px",
    rowGap: isMobile ? 12 : 0
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: isMobile ? "none" : "block" } }), /* @__PURE__ */ React.createElement("div", { className: "pill-group", role: "tablist" }, ["daily", "weekly", "monthly"].map((v) => {
    const isWeekly = v === "weekly";
    const labelText = isWeekly && view === "weekly" ? "Weekly Page" : v[0].toUpperCase() + v.slice(1);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: v,
        className: "pill",
        "data-on": view === v,
        onClick: () => {
          if (isWeekly && view === "weekly" && alternateHref) {
            window.location.href = alternateHref;
            return;
          }
          setView(v);
        }
      },
      labelText
    );
  })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, justifySelf: isMobile ? "center" : "end" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "icon-btn", onClick: onPrev, "aria-label": "Previous" }, /* @__PURE__ */ React.createElement(Chevron, { dir: "left" })), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--ink-2)",
    minWidth: isMobile ? 0 : 120,
    textAlign: "center",
    fontWeight: 500
  } }, label), /* @__PURE__ */ React.createElement("button", { type: "button", className: "icon-btn", onClick: onNext, "aria-label": "Next" }, /* @__PURE__ */ React.createElement(Chevron, { dir: "right" }))));
  var WeeklyHeader = ({ weekStartKey, weekNumber, isMobile = false }) => /* @__PURE__ */ React.createElement("section", { style: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: isMobile ? 12 : 18,
    marginBottom: isMobile ? 24 : 32
  } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0, flex: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "Week of"), /* @__PURE__ */ React.createElement("h2", { className: "font-serif", style: {
    margin: "4px 0 0",
    fontWeight: 400,
    letterSpacing: "0.02em",
    color: "var(--ink)",
    lineHeight: 1,
    whiteSpace: isMobile ? "normal" : "nowrap"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontVariantNumeric: "oldstyle-nums", fontSize: isMobile ? 48 : 72 } }, parseDateKey(weekStartKey).getUTCDate(), /* @__PURE__ */ React.createElement("sup", { style: { fontSize: "0.45em", verticalAlign: "super", marginLeft: 2 } }, getOrdinal(parseDateKey(weekStartKey).getUTCDate()))), /* @__PURE__ */ React.createElement("span", { style: { color: "rgba(132, 53, 13, 0.35)", fontStyle: "italic", fontSize: isMobile ? 22 : 36 } }, " of "), /* @__PURE__ */ React.createElement("span", { style: { fontSize: isMobile ? 40 : 64, overflowWrap: "anywhere" } }, getMonthLabel(weekStartKey))), /* @__PURE__ */ React.createElement("div", { className: "font-serif", style: {
    fontSize: isMobile ? 15 : 18,
    color: "var(--ink-3)",
    fontStyle: "italic",
    marginTop: 4
  } }, parseDateKey(weekStartKey).getUTCFullYear())), /* @__PURE__ */ React.createElement("div", { style: { flex: "0 0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "eyebrow", style: { textAlign: "right", marginBottom: 6 } }, "Week"), /* @__PURE__ */ React.createElement("div", { className: "week-num", style: { textAlign: "right" } }, weekNumber)));
  var WeeklyTimeline = ({ weekDays, compact = false, onSelectDate }) => /* @__PURE__ */ React.createElement("section", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Eyebrow, null, "The Week"), /* @__PURE__ */ React.createElement("ul", { style: {
    listStyle: "none",
    margin: "16px 0 0",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: compact ? 0 : 2
  } }, weekDays.map((d, i) => /* @__PURE__ */ React.createElement(
    "li",
    {
      key: i,
      style: {
        display: "grid",
        gridTemplateColumns: compact ? "40px 42px 1fr auto" : "44px 54px 1fr auto",
        alignItems: "flex-start",
        gap: compact ? 8 : 10,
        padding: compact ? "10px 0" : "12px 0",
        borderBottom: "1px solid var(--rule-soft)",
        background: d.isToday ? "color-mix(in oklch, var(--accent-wash) 60%, transparent)" : "transparent",
        cursor: onSelectDate ? "pointer" : "default"
      },
      onClick: onSelectDate ? () => onSelectDate(d.dateKey) : void 0,
      role: onSelectDate ? "button" : void 0,
      tabIndex: onSelectDate ? 0 : void 0,
      onKeyDown: onSelectDate ? (ev) => {
        if (ev.key === "Enter") onSelectDate(d.dateKey);
      } : void 0
    },
    /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6,
      color: d.isToday ? "#E8704E" : "var(--ink)"
    } }, /* @__PURE__ */ React.createElement("span", { className: "font-serif", style: { fontSize: compact ? 20 : 22, fontWeight: 500, fontVariantNumeric: "oldstyle-nums" } }, String(d.date).padStart(2, "0"))),
    /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 10,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--ink-3)",
      fontWeight: 500
    } }, d.day),
    /* @__PURE__ */ React.createElement(
      EventStrip,
      {
        events: d.events,
        empty: /* @__PURE__ */ React.createElement("span", { style: { color: "var(--ink-4)" } }, "\u2014")
      }
    ),
    /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 10,
      color: "var(--ink-3)",
      fontVariantNumeric: "tabular-nums",
      minWidth: 28,
      textAlign: "right"
    } }, d.tasks > 0 ? `${d.tasks} \u2610` : "\u2014")
  ))));
  var WeeklyNotes = ({ weekNotes, weekReflection, isMobile }) => /* @__PURE__ */ React.createElement("section", { style: {
    flex: 1,
    padding: 20,
    border: "1px solid var(--rule-soft)",
    borderRadius: 8,
    background: "var(--paper-2)",
    position: "relative",
    overflow: "hidden",
    marginBottom: 24
  } }, /* @__PURE__ */ React.createElement("div", { className: "dot-grid", style: {
    position: "absolute",
    inset: 0,
    opacity: 0.55,
    pointerEvents: "none"
  } }), /* @__PURE__ */ React.createElement("div", { className: "font-serif", style: {
    position: "relative",
    fontSize: 12,
    color: "var(--ink)",
    lineHeight: 1.7,
    fontStyle: "italic",
    maxHeight: isMobile ? 320 : 360,
    overflowY: "auto",
    paddingRight: 4
  } }, weekNotes.map((note) => /* @__PURE__ */ React.createElement("p", { key: note.dateKey, style: { margin: "0 0 14px" } }, /* @__PURE__ */ React.createElement("span", { className: "accent-chip" }, formatDisplayDate(note.dateKey, { month: "short", day: "numeric" }).toLowerCase()), /* @__PURE__ */ React.createElement("span", { style: {
    display: "-webkit-box",
    marginLeft: 8,
    marginTop: 6,
    overflow: "hidden",
    textOverflow: "ellipsis",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2
  } }, note.text))), /* @__PURE__ */ React.createElement("p", { style: {
    margin: 0,
    color: "var(--ink-2)",
    fontStyle: "italic",
    display: "-webkit-box",
    overflow: "hidden",
    textOverflow: "ellipsis",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3
  } }, weekReflection)));
  var WeeklyTodos = ({ todos, isMobile }) => /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 10 } }, /* @__PURE__ */ React.createElement(Eyebrow, { rule: false }, "To Do"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--ink-3)", fontStyle: "italic" } }, "\uFF08\u5F00\u53D1\u4E2D\uFF09")), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 14
  } }, todos.map((t, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    paddingBottom: 6,
    borderBottom: "1px solid var(--rule-soft)"
  } }, /* @__PURE__ */ React.createElement(Tick, { on: t.done }), /* @__PURE__ */ React.createElement("span", { className: "font-serif", style: {
    ...TODO_TEXT_STYLE,
    color: t.done ? "var(--ink-3)" : "var(--ink)",
    textDecorationLine: t.done ? "line-through" : "none",
    textDecorationColor: "var(--ink-4)",
    flex: 1
  } }, t.text || "\u2014")))));
  var WeeklyLeft = ({ weekDays, isMobile, onSelectDate }) => /* @__PURE__ */ React.createElement("div", { className: "paper-surface spine-shadow-r", style: {
    borderRadius: isMobile ? 14 : "14px 0 0 14px",
    padding: isMobile ? "28px 22px 24px" : "44px 46px 40px",
    width: isMobile ? "100%" : "50%",
    minHeight: isMobile ? "auto" : 820,
    display: "flex",
    flexDirection: "column",
    position: "relative"
  } }, /* @__PURE__ */ React.createElement(WeeklyTimeline, { weekDays, compact: isMobile, onSelectDate }), /* @__PURE__ */ React.createElement("footer", { style: {
    marginTop: 28,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    color: "var(--ink-3)",
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase"
  } }, /* @__PURE__ */ React.createElement("span", null, "Mon \u2014 Sun"), /* @__PURE__ */ React.createElement("span", null, "I")));
  var WeeklyRight = ({ todos, weekStartKey, weekNumber, weekNotes, weekReflection, isMobile }) => /* @__PURE__ */ React.createElement("div", { className: "paper-surface spine-shadow-l", style: {
    borderRadius: isMobile ? 14 : "0 14px 14px 0",
    padding: isMobile ? "28px 22px 24px" : "44px 46px 40px",
    width: isMobile ? "100%" : "50%",
    minHeight: isMobile ? "auto" : 820,
    display: "flex",
    flexDirection: "column",
    position: "relative"
  } }, /* @__PURE__ */ React.createElement(WeeklyHeader, { weekStartKey, weekNumber }), /* @__PURE__ */ React.createElement(WeeklyNotes, { weekNotes, weekReflection, isMobile }), /* @__PURE__ */ React.createElement(
    WeeklyTodos,
    {
      todos,
      isMobile
    }
  ), /* @__PURE__ */ React.createElement("footer", { style: {
    marginTop: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    color: "var(--ink-3)",
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase"
  } }, /* @__PURE__ */ React.createElement("span", null, `${formatDisplayDate(weekStartKey, { month: "short", day: "numeric" })} \u2014 ${formatDisplayDate(addDays(weekStartKey, 6), { month: "short", day: "numeric" })}`), /* @__PURE__ */ React.createElement("span", null, "II")));
  var WeeklyMobile = ({ weekDays, todos, weekStartKey, weekNumber, weekNotes, weekReflection, onSelectDate }) => /* @__PURE__ */ React.createElement("div", { className: "paper-surface", style: {
    borderRadius: 14,
    padding: "28px 22px 24px",
    width: "100%",
    boxSizing: "border-box",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 24
  } }, /* @__PURE__ */ React.createElement(WeeklyHeader, { weekStartKey, weekNumber, isMobile: true }), /* @__PURE__ */ React.createElement(WeeklyTimeline, { weekDays, compact: true, onSelectDate }), /* @__PURE__ */ React.createElement(WeeklyNotes, { weekNotes, weekReflection, isMobile: true }), /* @__PURE__ */ React.createElement(
    WeeklyTodos,
    {
      todos,
      isMobile: true
    }
  ));
  var DiaryEntries = ({ entries }) => {
    const [open, setOpen] = useState(false);
    if (!entries || !entries.length) return null;
    return /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, position: "relative" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        style: {
          background: "none",
          border: "none",
          padding: 0,
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--accent-ink)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "'Cormorant Garamond', serif"
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9 } }, open ? "\u25B2" : "\u25BC"),
      open ? "hide entries" : `${entries.length} diary entries`
    ), open && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8 } }, entries.map((entry, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
      marginTop: 10,
      paddingLeft: 10,
      borderLeft: "2px solid var(--rule)"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 10,
      letterSpacing: "0.06em",
      color: "var(--accent-ink)",
      fontFamily: "'Cormorant Garamond', serif"
    } }, entry.hour != null ? `${String(entry.hour).padStart(2, "0")}:${String(entry.minute).padStart(2, "0")}` : "", entry.title ? ` \xB7 ${entry.title}` : ""), entry.body && /* @__PURE__ */ React.createElement("p", { style: {
      margin: "4px 0 0",
      fontSize: 11,
      lineHeight: 1.6,
      color: "var(--ink-2)",
      fontStyle: "italic",
      fontFamily: "'Cormorant Garamond', serif",
      whiteSpace: "pre-wrap"
    } }, entry.body)))));
  };
  var SCHEDULE_START_HOUR = 0;
  var SCHEDULE_END_HOUR = 23;
  var HOUR_PX = 57;
  var SCHEDULE_EVENT_GAP_PX = 6;
  var LONG_EVENT_FOLD_THRESHOLD_HOURS = 4;
  var EMPTY_HOUR_FOLD_THRESHOLD_HOURS = 2;
  var FOLD_MARKER_PX = 24;
  var EVENT_CATEGORIES = DATA && DATA.CATEGORY_PALETTE || {};
  var Daily = ({ checks, toggleCheck, dateKey, events, mustDo, isMobile }) => {
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
    const computeLayout = (evts) => {
      if (!evts.length) return /* @__PURE__ */ new Map();
      const getOverlaps = (i) => evts.map((_, j) => j).filter((j) => j !== i && evts[j].startHour < evts[i].endHour && evts[j].endHour > evts[i].startHour);
      const claimedAsSec = /* @__PURE__ */ new Set();
      const secsOf = /* @__PURE__ */ new Map();
      const byDur = evts.map((_, i) => i).sort(
        (a, b) => evts[b].endHour - evts[b].startHour - (evts[a].endHour - evts[a].startHour) || evts[a].startHour - evts[b].startHour
      );
      for (const i of byDur) {
        if (claimedAsSec.has(i)) continue;
        const secs = getOverlaps(i).filter((j) => !claimedAsSec.has(j) && !secsOf.has(j));
        secsOf.set(i, secs);
        secs.forEach((j) => claimedAsSec.add(j));
      }
      const result = /* @__PURE__ */ new Map();
      for (let i = 0; i < evts.length; i++) {
        if (secsOf.has(i)) {
          result.set(i, { role: "primary", totalSecondary: secsOf.get(i).length });
        } else {
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
      }
      return result;
    };
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [expandedEmptyFolds, setExpandedEmptyFolds] = useState(() => /* @__PURE__ */ new Set());
    const eventSignature = useMemo(() => (events || []).map((event) => `${event.id || event.title}:${event.startHour}-${event.endHour}`).join("|"), [events]);
    useEffect(() => {
      setExpandedEventId(null);
      setExpandedEmptyFolds(/* @__PURE__ */ new Set());
    }, [dateKey, eventSignature]);
    useEffect(() => {
      let cancelled = false;
      setWeather(null);
      fetchWeatherForDate(dateKey).then((next) => {
        if (!cancelled) setWeather(next);
      }).catch(() => {
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
        if ((event.id || "") === expandedEventId) continue;
        const foldStart = Math.max(
          SCHEDULE_START_HOUR,
          Math.ceil(event.startHour)
        );
        const foldEnd = Math.min(
          SCHEDULE_END_HOUR + 1,
          Math.floor(event.endHour) - 1
        );
        if (foldEnd - foldStart >= 2) {
          rawFolds.push({ start: foldStart, end: foldEnd, type: "event", eventId: event.id || "" });
        }
      }
      const getScanEndHour = () => {
        if (dateKey > TODAY_KEY) return SCHEDULE_START_HOUR;
        if (dateKey < TODAY_KEY) return SCHEDULE_END_HOUR + 1;
        const now = /* @__PURE__ */ new Date();
        return Math.max(
          SCHEDULE_START_HOUR,
          Math.min(SCHEDULE_END_HOUR + 1, now.getHours())
        );
      };
      const scanEndHour = getScanEndHour();
      if (scanEndHour > SCHEDULE_START_HOUR) {
        const emptyHours = [];
        for (let hour = SCHEDULE_START_HOUR; hour < scanEndHour; hour++) {
          const hourStart = hour;
          const hourEnd = hour + 1;
          const isCovered = (events || []).some((event) => event.startHour < hourEnd && event.endHour > hourStart);
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
              rawFolds.push({ start: foldStart, end: foldEnd, type: "empty", foldId });
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
          prev.type = prev.type === fold.type ? prev.type : "mixed";
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
    }, [events, expandedEventId, expandedEmptyFolds, dateKey]);
    return /* @__PURE__ */ React.createElement("div", { className: "paper-surface page-shadow fadein", style: {
      borderRadius: 14,
      padding: isMobile ? "26px 18px 22px" : "48px 56px",
      maxWidth: 1240,
      margin: "0 auto",
      minHeight: isMobile ? "auto" : 820,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr",
      gridTemplateRows: isMobile ? "auto auto auto" : "auto 1fr",
      columnGap: isMobile ? 0 : 44,
      rowGap: isMobile ? 18 : 24
    } }, /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ React.createElement("div", { className: "eyebrow", style: { marginBottom: 8 } }, formatDisplayDate(dateKey, { weekday: "long" }), " \xB7 ", dateKey.slice(8, 10), " \xB7 ", dateKey.slice(5, 7), " \xB7 ", dateKey.slice(0, 4)), /* @__PURE__ */ React.createElement("h2", { className: "font-serif", style: {
      margin: 0,
      fontSize: scheduleHeaderFont,
      fontWeight: 500,
      letterSpacing: "-0.01em",
      lineHeight: 1.05
    } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--ink)", fontStyle: "normal" } }, parseDateKey(dateKey).getUTCDate(), /* @__PURE__ */ React.createElement("sup", { style: { fontSize: "0.45em", verticalAlign: "super", marginLeft: 2, marginRight: 4 } }, getOrdinal(parseDateKey(dateKey).getUTCDate()))), /* @__PURE__ */ React.createElement("span", { style: { fontStyle: "italic", color: "var(--ink)" } }, " ", getMonthLabel(dateKey)), /* @__PURE__ */ React.createElement("span", { style: { color: "rgba(132, 53, 13, 0.35)", fontStyle: "italic" } }, " \xB7 Journal"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 24 } }, /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("div", { className: "cal-column", style: {
      position: "relative",
      border: "none",
      borderRadius: 0,
      background: "transparent",
      overflow: "hidden"
    } }, (() => {
      const rows = [];
      let h = SCHEDULE_START_HOUR;
      while (h <= SCHEDULE_END_HOUR) {
        const fold = timeScale.foldStartingAt(h);
        if (fold) {
          const startLabel = h === 0 ? "12 am" : h === 12 ? "noon" : h < 12 ? `${h} am` : `${h - 12} pm`;
          rows.push({
            h,
            label: startLabel,
            height: FOLD_MARKER_PX,
            folded: true,
            fold
          });
          h = fold.end;
          continue;
        }
        const label = h === 0 ? "12 am" : h === 12 ? "noon" : h < 12 ? `${h} am` : `${h - 12} pm`;
        rows.push({ h, label, height: timeScale.hourHeight(h), folded: false });
        h += 1;
      }
      return rows.map((row, i) => {
        const isLast = i === rows.length - 1;
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: row.h,
            style: {
              display: "grid",
              gridTemplateColumns: `${scheduleLabelWidth}px 1fr`,
              height: row.height,
              borderBottom: isLast ? "none" : "1px solid var(--rule-soft)",
              background: row.folded ? "rgba(178, 151, 124, 0.06)" : "transparent",
              cursor: row.folded && row.fold && row.fold.foldId ? "pointer" : "default"
            },
            role: row.folded && row.fold && row.fold.foldId ? "button" : void 0,
            tabIndex: row.folded && row.fold && row.fold.foldId ? 0 : void 0,
            "aria-label": row.folded && row.fold && row.fold.foldId ? `Expand folded empty hours from ${row.label}` : void 0,
            onClick: row.folded && row.fold && row.fold.foldId ? () => {
              setExpandedEmptyFolds((current) => {
                const next = new Set(current);
                next.add(row.fold.foldId);
                return next;
              });
            } : void 0,
            onKeyDown: row.folded && row.fold && row.fold.foldId ? (ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                setExpandedEmptyFolds((current) => {
                  const next = new Set(current);
                  next.add(row.fold.foldId);
                  return next;
                });
              }
            } : void 0
          },
          /* @__PURE__ */ React.createElement("div", { style: {
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-4)",
            fontVariantNumeric: "tabular-nums",
            padding: row.folded ? "6px 10px 0 12px" : "4px 10px 0 12px",
            background: "transparent"
          } }, row.label, row.folded && /* @__PURE__ */ React.createElement("span", { style: {
            display: "inline-block",
            marginLeft: 4,
            fontSize: 9,
            letterSpacing: "0.08em",
            opacity: 0.62
          } }, "(folded)")),
          /* @__PURE__ */ React.createElement("div", { style: {
            position: "relative",
            overflow: "hidden"
          } }, row.folded && /* @__PURE__ */ React.createElement("div", { style: {
            position: "absolute",
            left: 0,
            right: 10,
            top: "50%",
            borderTop: "1px dashed var(--rule)"
          } }))
        );
      });
    })(), /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: scheduleLabelWidth,
      right: 0,
      top: 0,
      bottom: 0,
      overflow: "visible",
      pointerEvents: "none"
    } }, (() => {
      const layoutMap = computeLayout(events);
      return events.map((e, i) => {
        const cat = EVENT_CATEGORIES[e.categoryId] || { fill: "#eee", ink: "#333", label: e.categoryId };
        const eventId = e.id || `${dateKey}:${i}`;
        const note = String(e.note || "").trim();
        const tags = Array.isArray(e.tags) ? e.tags.filter(Boolean) : [];
        const hasDetails = Boolean(note || tags.length);
        const isExpanded = expandedEventId === eventId;
        const rawTop = timeScale.hourTop(e.startHour) - timeScale.hourTop(SCHEDULE_START_HOUR);
        const rawBottom = timeScale.hourTop(e.endHour) - timeScale.hourTop(SCHEDULE_START_HOUR);
        const top = Math.round(rawTop);
        const naturalHeight = Math.max(12, Math.round(rawBottom - rawTop) - SCHEDULE_EVENT_GAP_PX);
        const hh = DATA ? DATA.hourLabel : formatHourLabel;
        const layout = layoutMap.get(i) || { role: "primary", totalSecondary: 0 };
        const isSecondary = layout.role === "secondary";
        const stickyOffset = 22;
        if (isSecondary) {
          const stickyHeight = isExpanded ? Math.max(naturalHeight + 52, note ? 156 : 112) : STICKY_COLLAPSED_H;
          return /* @__PURE__ */ React.createElement(
            "div",
            {
              key: i,
              title: e.title,
              style: {
                position: "absolute",
                right: stickyOffset,
                width: STICKY_W,
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
                alignItems: "flex-start",
                justifyContent: isExpanded ? "flex-start" : "center",
                gap: isExpanded ? 6 : 0,
                padding: isExpanded ? "10px 10px 12px" : "0 10px",
                transform: `rotate(${(layout.secondaryIndex || 0) % 2 === 0 ? -1.2 : 1.2}deg)`
              },
              onClick: () => setExpandedEventId((cur) => cur === eventId ? null : eventId),
              role: hasDetails ? "button" : void 0,
              tabIndex: hasDetails ? 0 : void 0,
              "aria-expanded": hasDetails ? isExpanded : void 0,
              onKeyDown: hasDetails ? (ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  setExpandedEventId((cur) => cur === eventId ? null : eventId);
                }
              } : void 0
            },
            /* @__PURE__ */ React.createElement("span", { style: {
              fontSize: 11,
              fontWeight: 600,
              color: cat.ink,
              lineHeight: 1,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "100%",
              minWidth: 0,
              display: "block"
            } }, e.title),
            !isExpanded && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, opacity: 0.6, display: "block", lineHeight: 1.2 } }, e.durationMinutes >= 60 ? `${Math.floor(e.durationMinutes / 60)}h${e.durationMinutes % 60 ? ` ${e.durationMinutes % 60}m` : ""}` : `${e.durationMinutes}m`),
            isExpanded && note && /* @__PURE__ */ React.createElement("span", { style: {
              fontSize: 10,
              lineHeight: 1.3,
              opacity: 0.78,
              whiteSpace: "normal",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 7
            } }, note),
            isExpanded && tags.length > 0 && /* @__PURE__ */ React.createElement("span", { style: {
              fontSize: 9,
              opacity: 0.62,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "normal"
            } }, tags.join(" \xB7 "))
          );
        }
        const height = isExpanded ? Math.max(naturalHeight, note ? 116 : 72) : naturalHeight;
        const duration = e.endHour - e.startHour;
        const compact = (duration < 0.8 || naturalHeight < 44) && !isExpanded;
        const canPreviewDetails = note && naturalHeight >= 72;
        const primaryHasSecondary = layout.totalSecondary > 0;
        const contentMaxWidth = primaryHasSecondary && !compact ? `calc(${Math.round(PRIMARY_TEXT_RATIO * 100)}% - 8px)` : "100%";
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: i,
            style: {
              position: "absolute",
              left: 6,
              right: 6,
              top,
              height,
              background: cat.fill,
              color: cat.ink,
              borderRadius: 6,
              padding: compact ? "2px 10px" : "6px 10px",
              fontSize: 12,
              lineHeight: 1.3,
              boxShadow: isExpanded && isSecondary ? "0 2px 16px rgba(0,0,0,0.12)" : "none",
              display: "flex",
              flexDirection: compact ? "row" : "column",
              justifyContent: compact ? "space-between" : "flex-start",
              alignItems: compact ? "center" : "flex-start",
              gap: 4,
              overflow: "hidden",
              pointerEvents: "auto",
              zIndex: isExpanded ? 10 : 1,
              cursor: hasDetails ? "pointer" : "default"
            },
            role: hasDetails ? "button" : void 0,
            tabIndex: hasDetails ? 0 : void 0,
            "aria-expanded": hasDetails ? isExpanded : void 0,
            onClick: hasDetails ? () => setExpandedEventId((cur) => cur === eventId ? null : eventId) : void 0,
            onKeyDown: hasDetails ? (ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                setExpandedEventId((cur) => cur === eventId ? null : eventId);
              }
            } : void 0
          },
          isExpanded && /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: (ev) => {
                ev.stopPropagation();
                setExpandedEventId(null);
              },
              style: {
                position: "absolute",
                top: 6,
                right: 6,
                border: 0,
                borderRadius: 999,
                background: "rgba(255,255,255,0.45)",
                color: cat.ink,
                width: 18,
                height: 18,
                fontSize: 11,
                lineHeight: 1,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                padding: 0
              },
              "aria-label": "Collapse event"
            },
            "\xD7"
          ),
          /* @__PURE__ */ React.createElement("span", { style: {
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: contentMaxWidth,
            minWidth: 0
          } }, e.title),
          /* @__PURE__ */ React.createElement("span", { style: {
            fontSize: 10,
            opacity: 0.75,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            maxWidth: contentMaxWidth,
            minWidth: 0,
            flexShrink: compact ? 0 : 1,
            overflow: "hidden",
            textOverflow: "ellipsis"
          } }, hh(e.startHour), " \u2013 ", hh(e.endHour), " \xB7 ", e.durationMinutes >= 60 ? `${Math.floor(e.durationMinutes / 60)}h${e.durationMinutes % 60 ? ` ${e.durationMinutes % 60}m` : ""}` : `${e.durationMinutes}m`),
          !isExpanded && !canPreviewDetails && hasDetails && !compact && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, opacity: 0.72, fontStyle: "italic", maxWidth: contentMaxWidth } }, "tap for details"),
          (canPreviewDetails || isExpanded) && note && /* @__PURE__ */ React.createElement("span", { style: {
            fontSize: 10.5,
            lineHeight: 1.35,
            opacity: 0.88,
            whiteSpace: "normal",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: isExpanded ? 6 : 2,
            maxWidth: contentMaxWidth
          } }, note),
          isExpanded && tags.length > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9.5, opacity: 0.72, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "normal" } }, tags.join(" \xB7 "))
        );
      });
    })())))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement("section", { style: {
      position: "relative",
      padding: isMobile ? 16 : 20,
      border: "1px solid var(--rule-soft)",
      borderRadius: 10,
      background: "var(--paper-2)",
      overflow: "hidden"
    } }, /* @__PURE__ */ React.createElement("div", { className: "dot-grid", style: {
      position: "absolute",
      inset: 0,
      opacity: 0.5,
      pointerEvents: "none"
    } }), /* @__PURE__ */ React.createElement("div", { className: "eyebrow", style: { position: "relative", marginBottom: 10 } }, "Diary"), /* @__PURE__ */ React.createElement("div", { className: "font-serif", style: {
      position: "relative",
      margin: 0,
      fontSize: 12,
      lineHeight: 1.7,
      color: "var(--ink)",
      maxHeight: isMobile ? "none" : 280,
      overflowY: "auto",
      paddingRight: 4
    } }, summaryText ? /* @__PURE__ */ React.createElement("p", { style: {
      margin: 0,
      fontSize: 12,
      lineHeight: 1.7,
      color: "var(--ink)",
      fontStyle: "italic",
      whiteSpace: "pre-wrap"
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24, lineHeight: 1.25 } }, toSingleLineSentence(summaryText)), summaryText !== toSingleLineSentence(summaryText) && /* @__PURE__ */ React.createElement(React.Fragment, null, "\n", summaryText.slice(toSingleLineSentence(summaryText).length).trimStart())) : /* @__PURE__ */ React.createElement("p", { style: { margin: 0, color: "var(--ink-3)", fontStyle: "italic" } }, "No summary yet for today.")), DATA && DATA.DIARY_BY_DAY && DATA.DIARY_BY_DAY[dateKey] && DATA.DIARY_BY_DAY[dateKey].length > 0 && /* @__PURE__ */ React.createElement("div", { style: { position: "relative", paddingTop: 4 } }, /* @__PURE__ */ React.createElement(DiaryEntries, { entries: DATA.DIARY_BY_DAY[dateKey] }))), /* @__PURE__ */ React.createElement("section", { style: {
      background: "var(--paper-2)",
      border: "1px solid var(--rule-soft)",
      borderRadius: 10,
      padding: isMobile ? "16px 16px" : "20px 22px"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 10 } }, /* @__PURE__ */ React.createElement(Eyebrow, { rule: false }, "Must Do"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--ink-3)", fontStyle: "italic" } }, "\uFF08\u5F00\u53D1\u4E2D\uFF09")), /* @__PURE__ */ React.createElement("ul", { style: {
      listStyle: "none",
      margin: "14px 0 0",
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: 12
    } }, mustDo.map((t, i) => /* @__PURE__ */ React.createElement("li", { key: i, style: { display: "flex", alignItems: "flex-start", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { paddingTop: 4 } }, /* @__PURE__ */ React.createElement(Tick, { on: t.done })), /* @__PURE__ */ React.createElement("span", { className: "font-serif", style: {
      flex: 1,
      ...TODO_TEXT_STYLE,
      color: t.done ? "var(--ink-3)" : "var(--ink)",
      textDecorationLine: t.done ? "line-through" : "none",
      textDecorationColor: "var(--ink-4)"
    } }, t.text))))), /* @__PURE__ */ React.createElement("section", { style: {
      background: "var(--paper-2)",
      border: "1px solid var(--rule-soft)",
      borderRadius: 10,
      padding: isMobile ? "16px 16px" : "20px 22px"
    } }, /* @__PURE__ */ React.createElement(Eyebrow, { rule: false }, "Weather \xB7 Mood"), /* @__PURE__ */ React.createElement("div", { style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 14,
      marginTop: 14
    } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-serif", style: { fontSize: 26, color: "var(--ink)", fontWeight: 500 } }, weather && !weather.error ? `${weather.min}\xB0` : "\u2014", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--ink-3)", fontSize: 18 } }, weather && !weather.error ? ` / ${weather.max}\xB0` : " / \u2014")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase" } }, weather && !weather.error ? weather.label : "loading weather")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ React.createElement("span", { key: n, style: {
      width: 16,
      height: 16,
      borderRadius: 999,
      border: "1px solid var(--rule)",
      background: n <= mood.rating ? "var(--accent)" : "transparent"
    } }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase", marginTop: 6 } }, mood.labels.join(" \xB7 "))))), /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: "auto",
      display: "flex",
      justifyContent: "flex-end",
      color: "var(--ink-3)",
      fontSize: 10,
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    } }, /* @__PURE__ */ React.createElement("span", null, "Day ", Math.floor((parseDateKey(dateKey) - parseDateKey(`${parseDateKey(dateKey).getUTCFullYear()}-01-01`)) / 864e5) + 1, " / 365"))));
  };
  var DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var Monthly = ({ dateKey, onSelectDate, isMobile = false }) => {
    const cells = buildMonthlyCells(dateKey);
    const palette = window.JOURNAL_DATA && window.JOURNAL_DATA.CATEGORY_PALETTE || {};
    const monthDate = parseDateKey(dateKey);
    const activeMonth = getMonthLabel(dateKey);
    const year = monthDate.getUTCFullYear();
    const daysInMonth = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate();
    const weekCount = new Set(cells.map((_, index) => Math.floor(index / 7))).size;
    const monthlyMinWidth = 720;
    const monthSummary = getLatestMonthSummaryLine(dateKey) || toSingleLineSentence(
      ((DATA && DATA.journal && DATA.journal.month && DATA.journal.month[dateKey.slice(0, 7)] || {}).summary || {}).body || getWeeklyReflection(DATA ? DATA.dateRange(`${year}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}-01`, `${year}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`) : [])
    );
    return /* @__PURE__ */ React.createElement("div", { className: "paper-surface page-shadow fadein", style: {
      borderRadius: 14,
      padding: isMobile ? "28px 18px 24px" : "44px 48px",
      maxWidth: 1160,
      margin: "0 auto",
      minHeight: 820,
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      minWidth: 0
    } }, /* @__PURE__ */ React.createElement("header", { style: {
      display: "flex",
      alignItems: isMobile ? "flex-start" : "flex-end",
      justifyContent: "space-between",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? 12 : 0,
      paddingBottom: 20,
      borderBottom: "1px solid var(--rule)",
      marginBottom: 20
    } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "Month \xB7 ", String(monthDate.getUTCMonth() + 1).padStart(2, "0"), " of 12"), /* @__PURE__ */ React.createElement("h2", { className: "font-serif", style: {
      margin: "4px 0 0",
      fontSize: isMobile ? 52 : 72,
      fontWeight: 400,
      letterSpacing: "-0.01em",
      lineHeight: 0.95
    } }, activeMonth), /* @__PURE__ */ React.createElement("div", { className: "font-serif", style: {
      fontSize: isMobile ? 15 : 18,
      fontStyle: "italic",
      color: "var(--ink-3)",
      marginTop: 6,
      whiteSpace: isMobile ? "normal" : "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: isMobile ? "100%" : 680
    } }, "latest \u2014 ", monthSummary)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: isMobile ? "left" : "right" } }, /* @__PURE__ */ React.createElement("div", { className: "eyebrow", style: { marginBottom: 4 } }, "Year"), /* @__PURE__ */ React.createElement("div", { className: "font-serif", style: { fontSize: 32, color: "var(--ink)", fontVariantNumeric: "oldstyle-nums" } }, year))), /* @__PURE__ */ React.createElement("div", { style: {
      overflowX: isMobile ? "auto" : "visible",
      overflowY: "visible",
      paddingBottom: isMobile ? 6 : 0,
      marginInline: isMobile ? -2 : 0
    } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: isMobile ? monthlyMinWidth : "auto" } }, /* @__PURE__ */ React.createElement("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 1,
      marginBottom: 8
    } }, DOW.map((d) => /* @__PURE__ */ React.createElement("div", { key: d, style: {
      padding: "8px 10px",
      fontSize: 10,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "var(--ink-3)",
      fontWeight: 500
    } }, d))), /* @__PURE__ */ React.createElement("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 1,
      background: "var(--rule-soft)",
      border: "1px solid var(--rule-soft)",
      borderRadius: 10,
      overflow: "hidden",
      flex: 1
    } }, cells.map((c, i) => {
      const events = !c.muted && c.events || [];
      const cats = !c.muted && c.cats || [];
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: c.key || i,
          className: "cal-cell",
          "data-muted": c.muted,
          "data-today": c.isToday,
          onClick: !c.muted && onSelectDate ? () => onSelectDate(c.key) : void 0,
          style: !c.muted && onSelectDate ? { cursor: "pointer" } : void 0,
          title: !c.muted && events.length > 0 ? events.map((event) => event.title).join(" \xB7 ") : void 0
        },
        /* @__PURE__ */ React.createElement("span", { className: "cal-num" }, c.n),
        events.length > 0 && /* @__PURE__ */ React.createElement(
          EventStrip,
          {
            events,
            style: {
              marginTop: 8,
              fontSize: 11,
              alignContent: "flex-start",
              maxHeight: 44,
              overflow: "hidden"
            }
          }
        ),
        events.length === 0 && cats.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
          display: "flex",
          flexWrap: "wrap",
          columnGap: 6,
          rowGap: 2,
          marginTop: 8,
          fontSize: 9.5,
          lineHeight: 1.3,
          letterSpacing: "0.04em",
          fontStyle: "italic"
        } }, cats.slice(0, 3).map((catId, j) => {
          const p = palette[catId];
          if (!p) return null;
          return /* @__PURE__ */ React.createElement("span", { key: j, style: { color: p.ink || "var(--ink-2)", whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement("span", { style: { color: p.fill, marginRight: 3 } }, "\u2022"), p.label);
        }))
      );
    })))), /* @__PURE__ */ React.createElement("footer", { style: {
      marginTop: 20,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      color: "var(--ink-3)",
      fontSize: 10,
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    } }, /* @__PURE__ */ React.createElement("span", null, weekCount, " weeks \xB7 ", daysInMonth, " days"), /* @__PURE__ */ React.createElement("span", null, String(monthDate.getUTCMonth() + 1).padStart(2, "0"))));
  };
  var TWEAK_DEFAULTS = (
    /*EDITMODE-BEGIN*/
    {
      "theme": "Warm Paper",
      "accent": "whisper",
      "showPaperGrain": true,
      "fontScale": 1
    }
  );
  var App = () => {
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
    const [view, setView] = useState(INITIAL_VIEW);
    const [cursorKey, setCursorKey] = useState(INITIAL_CURSOR_KEY);
    const [isMobile, setIsMobile] = useState(getIsMobileViewport);
    const weekDateKeys = useMemo(() => getWeekDateKeys(cursorKey), [cursorKey]);
    const weekDays = useMemo(() => getWeekData(cursorKey), [cursorKey]);
    const weekTodos = useMemo(() => getWeekTodos(weekDateKeys), [weekDateKeys]);
    const dailyTodos = useMemo(() => getDayTodos(cursorKey, 5), [cursorKey]);
    const dailyEvents = useMemo(() => DATA && DATA.journal && DATA.journal.day && DATA.journal.day[cursorKey] && DATA.journal.day[cursorKey].events || DATA && DATA.eventsByDay[cursorKey] || [], [cursorKey]);
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
      const arr = [...c[key]];
      arr[i] = !arr[i];
      const next = { ...c, [key]: arr };
      if (key === "daily") {
        try {
          localStorage.setItem(dailyChecksKey(cursorKey), JSON.stringify(next.daily));
        } catch (_) {
        }
      }
      return next;
    });
    useEffect(() => {
      const palette = THEMES[t.theme] || THEMES["Warm Paper"];
      const root = document.documentElement;
      Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v));
      const { washAlpha } = ACCENT_DENSITY[t.accent] || ACCENT_DENSITY.whisper;
      const base = palette["--accent-wash"];
      root.style.setProperty(
        "--accent-wash",
        `color-mix(in oklch, ${base} ${Math.round(washAlpha * 100)}%, var(--paper-2))`
      );
      root.style.setProperty("font-size", `${16 * t.fontScale}px`);
      document.body.dataset.grain = t.showPaperGrain ? "on" : "off";
    }, [t.theme, t.accent, t.fontScale, t.showPaperGrain]);
    useEffect(() => {
      setChecks((c) => ({
        ...c,
        todos: weekTodos.map((x) => x.done)
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
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);
    const label = view === "daily" ? formatDisplayDate(cursorKey, { weekday: "short", month: "short", day: "numeric" }).replace(",", " \xB7") : view === "weekly" ? (() => {
      const { week, year } = getISOWeek(cursorKey);
      return `Week ${week} \xB7 ${year}`;
    })() : `${getMonthLabel(cursorKey)} ${parseDateKey(cursorKey).getUTCFullYear()}`;
    const onPrev = () => {
      setCursorKey((current) => view === "daily" ? addDays(current, -1) : view === "weekly" ? addDays(current, -7) : addMonths(current, -1));
    };
    const onNext = () => {
      setCursorKey((current) => view === "daily" ? addDays(current, 1) : view === "weekly" ? addDays(current, 7) : addMonths(current, 1));
    };
    return /* @__PURE__ */ React.createElement("div", { className: "app-bg", "data-screen-label": `Journal \xB7 ${view}` }, /* @__PURE__ */ React.createElement("div", { className: "max-shell" }, /* @__PURE__ */ React.createElement(RepositoryHeader, { isMobile }), /* @__PURE__ */ React.createElement(
      Header,
      {
        view,
        setView,
        label,
        onPrev,
        onNext,
        isMobile,
        alternateHref: view === "weekly" ? `WeeklyDaily.html?date=${getWeekStartKey(cursorKey)}` : ""
      }
    ), /* @__PURE__ */ React.createElement("main", null, view === "weekly" && (isMobile ? /* @__PURE__ */ React.createElement("div", { className: "fadein" }, /* @__PURE__ */ React.createElement(
      WeeklyMobile,
      {
        weekDays,
        todos: weekTodos,
        weekStartKey: getWeekStartKey(cursorKey),
        weekNumber: getWeekNumber(cursorKey),
        weekNotes,
        weekReflection,
        onSelectDate: (key) => {
          setCursorKey(key);
          setView("daily");
        }
      }
    )) : /* @__PURE__ */ React.createElement("div", { className: "fadein", style: {
      display: "flex",
      alignItems: "stretch",
      justifyContent: "center"
    } }, /* @__PURE__ */ React.createElement(
      WeeklyLeft,
      {
        weekDays,
        isMobile: false,
        onSelectDate: (key) => {
          setCursorKey(key);
          setView("daily");
        }
      }
    ), /* @__PURE__ */ React.createElement(
      WeeklyRight,
      {
        todos: weekTodos,
        weekStartKey: getWeekStartKey(cursorKey),
        weekNumber: getWeekNumber(cursorKey),
        weekNotes,
        weekReflection,
        isMobile: false
      }
    ))), view === "daily" && /* @__PURE__ */ React.createElement(
      Daily,
      {
        checks,
        toggleCheck,
        dateKey: cursorKey,
        events: dailyEvents,
        mustDo: dailyTodos,
        isMobile
      }
    ), view === "monthly" && /* @__PURE__ */ React.createElement(
      Monthly,
      {
        dateKey: cursorKey,
        onSelectDate: (key) => {
          setCursorKey(key);
          setView("daily");
        },
        isMobile
      }
    ))), /* @__PURE__ */ React.createElement(TweaksPanel, { title: "Tweaks" }, /* @__PURE__ */ React.createElement(TweakSection, { label: "Palette" }), /* @__PURE__ */ React.createElement(
      TweakSelect,
      {
        label: "Theme",
        value: t.theme,
        options: Object.keys(THEMES),
        onChange: (v) => setTweak("theme", v)
      }
    ), /* @__PURE__ */ React.createElement(
      TweakRadio,
      {
        label: "Accent",
        value: t.accent,
        options: ["whisper", "muted", "confident"],
        onChange: (v) => setTweak("accent", v)
      }
    ), /* @__PURE__ */ React.createElement(TweakSection, { label: "Paper" }), /* @__PURE__ */ React.createElement(
      TweakToggle,
      {
        label: "Paper grain",
        value: t.showPaperGrain,
        onChange: (v) => setTweak("showPaperGrain", v)
      }
    ), /* @__PURE__ */ React.createElement(
      TweakSlider,
      {
        label: "Type scale",
        value: t.fontScale,
        min: 0.9,
        max: 1.15,
        step: 0.01,
        onChange: (v) => setTweak("fontScale", v)
      }
    )));
  };
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
})();
