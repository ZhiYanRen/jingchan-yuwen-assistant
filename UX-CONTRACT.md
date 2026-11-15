# 静婵语文小助手 · 交互约定

依据：用户要求六年级2024年人教统编版上下册、课文听写/语文积累/错题小本；AGENTS.md要求静态、iPad优先、本机保存和自动发布。DESIGN.md仅拥有视觉规范，本文件拥有行为。

## 页面与状态
hash导航 #dictation、#collection、#mistakes、#settings，刷新/浏览器返回可用。每页保存册次、单元与筛选，练习断点、错题草稿不放URL（个人信息不分享）。册次选择作用于全站，保留每册所选课文。听写/核对/下一题不自动播放下一题，避免iPad播放策略与中断；提供重听、上一词、下一词、语速与乱序。语音不可用时显示恢复说明和看拼音练习；不把看拼音称为听写音频。纸上听写→显示答案→标记写对/加入错题；输入模式按规范化文字核对并收录错词。题目只计分一次，下一题可继续，刷新恢复同一题。

## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | HTML select | 本文件/DOM | 册次/单元/课文/语速 | browser.mjs键盘与触控 |
| Form | showForm()/field() + 应用校验 | app.js | 错题/积累 | CRUD/失败输入保留 |
| Scrollbar | styles.css全局规则 | DESIGN.md | forced-colors | browser.mjs |
| Toast | toast() + #status | app.js | 成功/提示 | live region |
| CRUD | dialog + storage.js | 本文件 | 新建/编辑/删除确认 | domain.test.mjs与browser.mjs |
| Dialog | HTML dialog + openDialog() | app.js | 表单/删除确认/备份导入 | Escape/焦点恢复/Tab |

## 数据与恢复
唯一存储键 jingchan-yuwen-v1，localStorage，仅此浏览器，不自动跨设备同步。学习记录不请求服务器，不采集儿童身份。每次状态变化即时保存，输入草稿在input后保存；IME合成中保留原始草稿但不判分，合成结束后再次保存。存储失败保留内存状态、常驻失败条、每3秒重试并允许下载备份；损坏的存储不自动覆盖，提示下载原始内容并从备份恢复。跨标签变化提示重新载入，不静默覆盖其他标签的记录。

备份JSON带app和schema，严格验证大小、数据结构、长度、枚举值与书目引用。导入先验证再提示将替换当前记录，并提供先导出按钮；验证失败原数据不动。删除错题和自建积累需具名确认，焦点初始放取消；关闭返回原触发按钮（不存在时回页面标题）。编辑成功回原列表，保留筛选。内置内容不能删除/编辑，只能收藏与标记掌握。

## 输入与反馈
所有文字渲染转义，不使用用户内容拼HTML属性或事件。无alert/confirm/prompt。所有交互为原生button/a/select/input，具有标签、可见焦点、按压反馈。失效按钮disabled；状态通过同一live region；严重错误常驻并可重试。搜索支持中文输入法，不在composition时重绘，默认本机过滤无需延迟请求。列表显示结果数，错题每页20项并提供上一页/下一页，空状态有下一步，查询无结果可清空。

## 发布/离线
相对资源路径与hash路由，Pages子路径可刷新。service worker只缓存本应用静态资源，完整安装后激活；不强制刷新进行中的练习。每60秒、联网与返回前台检查更新；完整下载后，先成功保存且输入法组合、指针、语音和弹窗操作已结束才激活并自动刷新，恢复hash页面、练习与输入焦点，个人数据留在独立localStorage。离线中文语音是否可用取决于系统语音，界面明确说明。添加主屏幕通过manifest与apple-touch-icon，尚需iPad真机验证。

所有原生select允许系统负责选项弹层几何；不自绘弹层。按钮统一由button()构造，document上的click事件按data-act分发；这是真实事件绑定，不依赖内联脚本。textarea禁止拖动改变布局，输入时自动增高至400px后内部滚动。搜索显式清除按钮清空本页查询并回到搜索框。
