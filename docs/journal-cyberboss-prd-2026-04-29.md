# Journal / Cyberboss 集成 PRD

日期：2026-04-29
来源：user的微信输入与后续 review
状态：进行中

## 总览

这份文档记录 Journal 接入 Cyberboss timeline / diary / todo 数据时需要解决的问题、验收标准和当前完成状态。

当前代码已完成第一批 P0 修复和部分 P1 体验增强；剩余重点是月视图密度、颜色映射、timeline 重叠场景复现验证，以及统一测试入口。

## 状态汇总

| 编号 | 项目 | 状态 |
| --- | --- | --- |
| P0-1 | 默认日期 | 已完成 |
| P0-2 | Diary entries 展开 | 已完成 |
| P0-3 | Todo 只读 | 已完成 |
| P0-4 | Weekly duplicate | 已完成 |
| P1-6 | Duration 展示 | 已完成 |
| P1-7 | Weekly 跳 Daily | 已完成 |
| P1-8 | Daily 长事件时间轴折叠 | 已完成 |
| P1-9 | Daily 空白完整小时自动折叠 | 已完成 |
| P1 | Timeline 重叠与可读性 | 部分完成，待截图复现验证 |
| P2 | 分类颜色映射 | 待处理 |
| P2 | 月视图密度 | 待处理 |
| P2 | 自定义 Diary adapter / importer | 待处理 |
| P2 | Whereabouts 位置上下文集成 | 重要不紧急，暂不处理 |
| Tooling | `npm test` 校验入口 | 待确认 |

## 产品目标

1. 让 Journal 对 Cyberboss 数据的视觉和语义表达保持一致。//可以不一致，journal有自己的设计语言
2. 兼容当前 Cyberboss diary 输出格式。
3. 在没有写入 API 前，不提供会让用户误以为已持久化的交互。
4. 提升 daily / weekly / monthly 视图里的 timeline 可读性。//重点是设计给人感受的一致性
5. 建立一个 reviewer 可以直接运行的最小校验入口。//看不懂

## 0420 接入cyberboss的准备
关于 Journal 之后作为 Cyberboss 工具调用，我建议优先优化这些点：

  1. 稳定数据入口
      - Journal 不应该直接读 Cyberboss 内部临时结构。
      - 最好定义一个明确的 journal-data.json / buildJournalData(input) schema：timeline、diary、todo 都走这个适配层。
      - Cyberboss 调 Journal 时只负责输出这个标准输入。
  2. CLI 工具化
      - 给 Journal 加一个明确命令，例如：

        journal build --input cyberboss-export.json --out public/runtime.js
        journal preview --port 8767
        journal screenshot --date 2026-04-25 --view daily
      - Cyberboss 工具调用 CLI，比直接拼路径和改源码安全。
  3. 真实数据 / sample 数据显式区分
      - 这个规则要固化到工具接口里：
          - mode=runtime：默认 today / latest
          - mode=sample：默认 2026-04-25
      - 不要让后续 agent 再把 sample 的 4/25 当成错误硬编码。
  4. 只读边界
      - Journal 目前应定位成展示工具，不负责写 Cyberboss todo/diary。
      - 如果以后要支持编辑，必须走 Cyberboss 的写 API，而不是 Journal 自己改文件。
  5. 可验证输出
      - Cyberboss 调用 Journal 后，最好能拿到结构化结果：

        {
          "url": "http://localhost:8767/Journal.html",
          "date": "2026-04-30",
          "view": "daily",
          "warnings": []
        }
      - 这样微信里可以直接反馈“已生成/有数据缺失/日期为空”。
  6. 截图能力
      - Cyberboss 很适合调用 Journal 生成 daily/weekly/monthly 截图发回微信。
      - Journal 侧需要稳定 selector、固定 viewport、等待字体/数据加载完成，再截图。
  7. 错误信息
      - 缺 diary、todo、timeline、日期为空、端口占用、runtime.js 构建失败，都要返回明确错误，不要只让浏览器白屏。
  8. Diary adapter / importer
      - Journal 作为工具不应强制所有接入方采用 Cyberboss 当前 diary markdown 写法。
      - 当前可继续兼容 `## Summary / ### AM / ### PM / ## Entries / ## HH:MM Title`，但这只能作为内置 adapter 之一。
      - 后续需要支持自定义 diary adapter / importer，把用户已有日记格式转换成 Journal 的内部展示数据。
      - 接入方应能保留自己熟悉的日记结构、语言风格和字段命名；Journal 只要求 adapter 输出稳定的 summary / entries 展示层数据。
      - 不允许把单个用户的语言偏好、写作口吻或 Cyberboss 私有 instruction 固化为 Journal 的通用数据契约。


## P0：数据正确性与用户信任

### P0-1 默认日期

状态：已完成

原问题：
- App 之前硬编码落到 `2026-04-25`，真实数据打开时也会默认进入 4 月 25 日。//这部分的解决方案不对，我要求加上判断条件：用户当前打开是runtime还是sample。runtime真实数据打开今日；sample必须展示 4 月 25 日。把这个规则作为注释写进代码里，避免agent review重复提出issue。
- 但 sample 预览不能简单改成 today，因为 sample 数据当天可能为空或不适合展示。

需求：
- 真实 runtime 优先打开今天；如果今天没有数据，则打开最新可用日期。
- sample 预览继续落到 `2026-04-25`。
- sample 和真实 runtime 必须通过数据标志区分，而不是在 UI 里靠猜测。

实现：
- `buildJournalData` 增加 `isSample = false` 参数。
- 真实数据默认 `__isSample: false`。
- sample 构建脚本显式传 `isSample: true`。
- UI 里通过 `DATA.__isSample` 判断：sample 才使用 `DEFAULT_LANDING_KEY = 2026-04-25`；真实数据优先 today / latest。

验收：
- 真实数据不会固定打开 4 月 25 日。
- 今天有数据时打开今天。
- 今天无数据时打开最新可用日期。
- sample 预览继续打开 `2026-04-25`。

### P0-2 Diary entries 展开

状态：已完成

原问题：
- Journal 对 diary 的解析和展示不完整，历史 Cyberboss diary 内容容易退化成 timeline event title fallback。
- 用户看不到 diary 条目的具体时间、标题和正文。

需求：
- 支持当前 diary markdown 的 summary 和 entries。
- 有真实 diary summary/details 时，优先显示真实 diary 内容。
- Diary Summary 卡片底部可以展开详情。

实现：
- 新增 `DiaryEntries` 折叠组件。
- Diary Summary 卡片底部显示 `▼ N diary entries`。
- 点击后展示每条 diary entry 的时间、title、body。
- 没有 entries 时不渲染展开按钮。

验收：
- Cyberboss diary markdown 能显示在 Journal 中。
- Diary summary 不会在有真实 diary 内容时被 event title fallback 替代。
- Diary entries 可以在 daily 视图里展开查看。

后续可选增强：
- 给展开按钮补 `aria-expanded` / `aria-controls`。//不要出现任何展开收起按钮，还原点击展开，再次点击收起（把这个规则作为注释写进代码里，避免agent review重复提出issue。）
- 如果 diary markdown 后续出现更多格式变体，再补 parser case。

### P0-3 Todo 只读

状态：已完成

原问题：
- Cyberboss todo schema 尚未稳定。
- 旧 UI 里 daily todo 可以点选，weekly todo 还可以编辑和点选，但这些交互没有可靠写入，刷新后会回退。

需求：
- 暂时禁用 todo 写入交互。
- Todos 以只读形式展示。
- 明确标注「开发中」，避免用户以为当前交互会保存。
- 只读不等于丢失完成状态。

实现：
- Weekly todo 从可编辑 `<input>` 改成只读 `<span>`。
- Weekly todo 渲染完整 `{ text, done }`，保留已完成勾选和删除线。
- Daily Must Do 移除 tick 的 `onClick`。
- `Tick` 组件增加 prop guard：没有 `onClick` 时不设置 checkbox role、`aria-checked`、`tabIndex`，避免键盘触发伪交互。
- Daily / Weekly 两处都显示「（开发中）」提示。
- Daily Must Do 的 tick、文字颜色、删除线统一读 `t.done`，不再读旧的 `checks.daily` 或 stale `localStorage`。

验收：
- Daily todo checkbox 不可交互。
- Weekly todo checkbox 不可交互，文本不可编辑。
- UI 不暗示更改已经保存。
- 已完成 todo 仍然显示完成态。
- 旧 localStorage 不会污染只读 UI 的完成态显示。

### P0-4 Weekly duplicate summary

状态：已完成

原问题：
- Weekly diary 区域会在 notes 后重复显示第一条 summary，造成内容重复。

需求：
- 移除重复展示。
- Weekly summary / reflection 只出现一次。

实现：
- `getWeeklyReflection` 改为取本周最后一天的 `summaryText`。
- 不再重复使用 `weekNotes` 第一条作为 reflection。

验收：
- Weekly diary 区域不再重复同一条 summary。

## P1：Timeline 可用性

### P1-6 Duration 展示

状态：已完成

原问题：
- Timeline event 不显示持续时间，用户只能从起止时间自己推算。

需求：
- 在空间允许的位置显示 duration。
- 使用紧凑格式，例如 `35m`、`1h`、`1h 20m`。
- 短事件不能因为 duration 文字导致严重挤压。

实现：
- Primary 时间行显示类似 `9 am – 10 am · 1h`。
- Secondary sticky 折叠态显示 `1h` / `35m` 小标。

验收：
- Daily timeline blocks 能直接看到 duration。
- 短块使用紧凑小标，避免明显文字碰撞。

### P1-7 Weekly 跳 Daily

状态：已完成

原问题：
- Weekly timeline 不能快速跳到某一天的 daily view。

需求：
- 点击 weekly day row 跳转到对应日期的 daily view。
- 支持键盘可达。

实现：
- Weekly 每一行可点击。
- 点击后 `setCursorKey(dateKey)` 并切换到 `daily`。
- 支持键盘 `Enter`。

验收：
- Weekly day row 可以点击。
- 点击后进入正确日期的 daily view。
- 键盘 `Enter` 可以触发同样跳转。

后续可选增强：
- 补 Space 键触发，以更接近 button 键盘语义。

### P1-8 Daily 长事件时间轴折叠

状态：已完成

原问题：
- Daily 时间轴里 `Sleep` 等超过 4 小时的长事件会占用大量垂直空间。
- 之前固定压缩 0-8 点会破坏时间轴精度：例如 `Sleep 00:30-06:50` 和 `Tennis 07:15-08:20` 在视觉上接近 8 点线，容易被误判为重叠或重复。
- 用户需要的是“折叠中间低信息小时”，不是把每个小时等比例压扁。

需求：
- 当某个 event 持续超过 4 小时时，默认折叠该 event 中间的完整小时段。
- 折叠不是压缩：折叠区只显示一条固定高度 marker。
- 示例：`12:30 am – 6:50 am` 默认显示 `12 am / 1 am (folded) / 5 am / 6 am`。
- 点击该长 event 后，临时展开它对应的折叠区，显示完整小时刻度：`12 am / 1 am / 2 am / 3 am / 4 am / 5 am / 6 am`。
- 折叠/展开时，hour row 和 event block 必须共用同一套 `timeScale.hourTop()` 坐标，不能出现小时线与事件位置脱节。
- 折叠 marker 文案使用起点小时，例如 `1 am (folded)`，不显示 `1 am - 5 am folded`。

实现：
- Daily 视图新增动态 `timeScale`。
- `timeScale` 根据当天超过 4h 的 event 生成 fold 区间。
- fold 区间规则：
  - `foldStart = ceil(event.startHour)`
  - `foldEnd = floor(event.endHour) - 1`
  - 至少折叠 2 个小时才生成 marker。
- 当前展开的 event 不生成自己的 fold，因此点击长 event 会恢复完整小时刻度。
- 折叠 marker 固定高度为 `24px`。
- 样本数据增加非 4 月 25 日的长事件测试：
  - `2026-04-28`：`Cycling`，07:30-12:10。
  - `2026-04-29`：`Deep Work`，10:00-15:30。

验收：
- `Sleep 00:30-06:50` 默认折叠为 `1 am (folded)`，视觉上保留 12/1/5/6 的时间边界。
- 点击 `Sleep` 后，1/2/3/4/5/6 小时刻度完整展开。
- `Cycling` 和 `Deep Work` 等非 sleep 的超过 4h event 也触发同样折叠/展开规则。
- 非重叠事件不能因为折叠坐标出现重复标签、伪重叠或错位。

### P1-9 Daily 空白完整小时自动折叠

状态：已完成

原问题：
- Daily 时间轴中没有 event 的大段空白会占用大量垂直空间，降低扫描效率。
- 不能简单按相邻 event gap 折叠，否则 event 刷新后时间尺度会频繁跳动，用户也容易丢失整天的时间感。

需求：
- 不以相邻 event 之间的 gap 作为折叠单位。
- 以整条 timeline 的 hour grid 为基础，扫描完整空白小时。
- 只有完整小时没有任何 event 覆盖，才视为空白小时。
- 连续完整空白小时超过 2 小时时，折叠中间小时，保留两端边界小时。
- 今天只折叠当前时间之前已经完整过去的空白小时，不折叠未来时间。
- events 刷新后重新计算空白折叠；如果新 event 覆盖原空白小时，该小时自动退出折叠。
- 空白折叠和长 event 折叠必须合并进同一套 `timeScale.hourTop()` 坐标。

实现：
- Daily `timeScale` 增加 empty-hour fold candidates。
- 以 `SCHEDULE_START_HOUR` 到扫描终点逐小时判断是否被任意 event 覆盖。
- 历史日期扫描全天；今天只扫描到当前整点；未来日期不生成空白折叠。
- 空白折叠 marker 固定高度为 `24px`，点击 marker 可展开该空白折叠段。

验收：
- 连续 2 个完整空白小时不折叠。
- 连续 3 个或更多完整空白小时折叠中间小时。
- 今天当前时间之后的空白小时不折叠。
- 新增 event 覆盖原空白小时后，折叠重新计算且不造成 event 错位。

### Timeline 重叠与可读性

状态：部分完成，待复现验证

原问题：
- 同类型颜色块视觉上容易融合。
- 文本可能被遮挡。
- 标题可能不显示。
- 某张有七个事件的截图里，timeline 难以区分。

现有设计意图：
- User 设计过 overlapping event sticky notes。

当前实现观察：
- Daily 视图已有 overlap group / primary event / secondary sticky bookmark 的渲染逻辑。
- 但还没有用用户提到的那张「七个事件」截图或同构数据做复现验证。
- 用户实测结果：小标签设计不稳定。很多重叠场景没有出现小标签；部分不重叠时间反而出现了自身的重复小标签。

待确认：
- 问题来自 overlap 分类、渲染分支、CSS stacking / clipping、daily vs weekly/monthly 分支差异、event 数据 shape，还是截图路径没有走 sticky-note 逻辑。

需求：
- 重叠事件必须视觉可分。
- 同色或同分类相邻/重叠事件不能看起来像一个整体。
- 空间足够时 event title 应保持可见。
- 短事件至少应通过 tooltip、点击、compact label 等方式可发现。

验收：
- 多个重叠事件的某一天可以一眼区分。
- 重叠事件要么进入 sticky notes，要么有其他清晰分隔方式。
- 同色块有足够边界、间距或层级，避免视觉融合。

下一步：
- 用实际问题截图对应的数据复现。
- 如果 sticky 逻辑没有覆盖该场景，修正 overlap 分组或渲染分支。
- 如果是 CSS 层级/裁切问题，修 clipping / z-index / label fallback。
- 单独排查 secondary sticky / 小标签的生成条件，避免漏标重叠事件，也避免非重叠事件生成重复小标签。

## P2：视觉一致性与月视图

### 分类颜色映射

状态：待处理

原问题：//不给予处理，这是journal作为前端UI设计的一部分
- Timeline 和 Journal 的 category color 不一致。
- 例如 Cyberboss/timeline 中 life 更接近粉色，entertainment 更接近玫瑰红；Journal 当前 palette 中 entertainment 偏粉，life 偏黄。
- 页面之间切换会产生语义不连续。

需求：
- 调整 Journal colors，使其更接近当前 Cyberboss timeline category colors。
- 后续 Cyberboss timeline 也可能反向迁移到 Journal palette，但本轮先保证 Journal 不冲突。

验收：
- Life / entertainment / 主要分类在不同视图间不再语义冲突。
- 调整后仍符合 Journal 的整体视觉风格。

下一步：
- 确认当前 Cyberboss canonical category color map。
- 做颜色对照表，再改 Journal palette。

### 月视图密度

状态：待处理

原问题：
- Monthly view 通常只显示两个事件，甚至多于两个时只看到一个和 overflow。
- 真实使用时，用户很难从月视图快速形成一天的印象。

需求：
- 压缩 tag / event 显示尺寸。
- 在空间允许时显示更多 event title。
- overflow dots 或 compact marker hover 时展示剩余 event titles。

验收：
- Month cells 能提供更丰富的一天印象。
- overflow 内容可发现，同时不让 calendar 变得嘈杂。

### Whereabouts 位置上下文集成

状态：重要不紧急，暂不处理

背景：
- `whereabouts-mcp` 已安装在 Cyberboss 侧，可通过 location server 接收 iPhone Shortcut 或其他采集端提交的位置数据。
- 目前不配置 Shortcut，不启动持续采集；本项只记录后续接入 Journal 的产品和数据边界。

需求：
- 后续由 Cyberboss 负责采集和聚合位置数据，Journal 只消费按天聚合后的派生 schema。
- 不直接把 raw GPS store 写入 Journal runtime，避免经纬度、地址、行动轨迹在预览或 sample 数据中泄露。
- Journal 侧新增 `whereaboutsByDay` 一类数据入口，用于表达每日位置上下文，例如主要停留地点、停留时长、移动次数、粗略移动距离、电量趋势。
- Daily 视图优先以轻量 context 区块呈现，不默认塞进主 timeline；只有显著移动事件才考虑进入 timeline 辅助层。
- Weekly / Monthly 后续可做按天 chip 或密度提示，例如 Home / Work / Out / Travel。

建议 schema：

```json
{
  "whereaboutsByDay": {
    "2026-04-30": {
      "summary": {
        "mobilityState": "staying",
        "currentPlaceTag": "home",
        "stayCount": 3,
        "moveCount": 2,
        "totalKnownStayDurationMinutes": 540,
        "totalMajorMoveDistanceMeters": 12000
      },
      "stays": [
        {
          "startAt": "2026-04-30T09:00:00+08:00",
          "endAt": "2026-04-30T12:30:00+08:00",
          "durationMinutes": 210,
          "placeTag": "home",
          "address": "Home",
          "sampleCount": 8
        }
      ],
      "moves": [
        {
          "movedAt": "2026-04-30T13:10:00+08:00",
          "fromPlaceTag": "home",
          "toPlaceTag": "work",
          "distanceMeters": 8200
        }
      ],
      "batteryTrend": {
        "sampleCount": 12,
        "firstLevelPercent": 82,
        "latestLevelPercent": 54,
        "deltaPercent": -28
      }
    }
  }
}
```

验收：
- Journal 可以在不暴露 raw GPS 经纬度的情况下展示位置上下文。
- sample 数据必须脱敏或使用虚构地点。
- 不影响现有 daily / weekly / monthly 的 diary、todo、event 展示。
- 没有位置数据时 UI 安静降级，不出现空卡片或错误状态。

## Testing / Tooling

状态：待确认

当前脚本：
- `sanitize:data`
- `build`
- `preview`

问题：
- 目前没有 `test` script。

建议：

```json
"test": "npm run build"
```

目的：
- 给 reviewer 一个标准校验入口。
- 确认 runtime generation 能完成。
- 暂不引入依赖或完整测试框架。

约束：
- 之前约定 package 变更需要先确认。
- 当前已运行 `npm run build` 作为手动验证，但尚未新增 `npm test`。

## 当前 TODO

1. 月视图密度和 weekly/monthly 一致性
   让 month cell 承载更丰富的一天信息，同时保持和 weekly view 一致的视觉逻辑。

2. 设计系统和颜色映射
   梳理 palette、category/event color mapping、共享 token，沉淀到更清晰的 design-system 层。

3. Timeline 重叠问题复现
   找到七事件截图对应的数据或构造同等 case，确认 sticky-note 渲染是否覆盖真实问题；重点验证“小标签缺失”和“非重叠事件重复小标签”两个失败模式。

4. 测试入口
   在确认后添加 `"test": "npm run build"`。

5. Whereabouts 位置上下文集成
   重要不紧急；先保留为 PRD 待办，不配置 iPhone Shortcut，不做采集和 UI 实现。

## 流程规则

1. 大范围改代码前先给出具体修改计划。
2. 与 package / tooling 相关的变更先确认。
3. 只读检查和现有 build 可以直接运行，除非 User 要求暂停。
4. 如果 User 指出某个推测方向不对，不保留错误 speculative fix。
5. 低电量或时间紧时，优先 P0 correctness fixes 和小验证闭环。

## 开放问题

1. 七事件重叠问题具体来自哪张截图/哪个日期/哪个视图？
2. Overlapping sticky notes 是否应成为唯一重叠方案，还是某些事件仍允许共享 lane？
3. 当前 canonical Cyberboss category color map 是哪一份？
4. Cyberboss diary MCP 还有哪些 markdown 变体需要支持？
5. `npm test` 是否现在添加为 `npm run build`？

## 建议后续顺序

1. 复现七事件 overlap 截图。
2. 修 overlap 的真实根因。
3. 提升 monthly density。
4. 对齐 category colors。
5. 确认并添加 `npm test`。
