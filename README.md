# 语文小帮手

[在线使用语文小帮手](https://zhiyanren.github.io/jingchan-yuwen-assistant/) · [应用岛入口](https://zhiyanren.github.io/app-island/)

六年级语文学习书房：课文听写、语文积累、错题小本。iPad 优先，兼容手机和电脑，学习数据仅保存在当前浏览器。完整新版下载后自动保存、加载并恢复练习，输入中文、播放语音或操作弹窗时延后更新。

## 内容与功能

- 上册：人教统编小学语文，封面标注 **2024年审核通过** 的26课修订目录。
- 下册：国家中小学智慧教育平台可核验的17课目录，另含10篇古诗词诵读；该文件未标注2024审核修订，不能据此声称下册为2024修订本。
- 508个练习词，其中377个来自所核验教材词语表，其余为明确标记的拓展选词；48则古诗文、日积月累与自主编写的阅读写作提示。
- 纸上听写自评、输入答案核对、语速选择、乱序练习、断点恢复；中文朗读使用设备系统语音。
- 听写错词自动收录，错题可手动新增、编辑、删除、标记掌握和再次练习；积累支持收藏、自建内容。
- 本机自动保存；备份导出、校验后确认导入；不自动跨设备同步。

教材依据、定位及版权边界见 [SOURCES.md](SOURCES.md)，视觉与交互约定见 [DESIGN.md](DESIGN.md)、[UX-CONTRACT.md](UX-CONTRACT.md)。未收录现代课文全文，不把选词整理标成出版社配套教参。

## 开发、验证与构建

Node.js 22.16+；无生产运行依赖。开发依赖仅用于浏览器验证与图标生成。

```sh
npm ci
npm test
npm run build
npm start
npm run test:browser
node tests/resilience.browser.mjs
node tests/updates.browser.mjs
node tests/experience.browser.mjs
```

本地预览：http://127.0.0.1:4177/jingchan-yuwen-assistant/ 。浏览器检查默认使用本机 Google Chrome，`TEST_BROWSER=webkit`可切换内核，`PLAYWRIGHT_MODULE`与`PLAYWRIGHT_BROWSERS_PATH`可选择已安装的匹配运行库；其他环境通过 `BROWSER_EXECUTABLE` 配置路径，通过 `TEST_URL` 指向预览或已部署网址。

`public/`为静态源文件，构建只发布`dist/`；脚本、样式和教材数据使用内容指纹文件名，避免混合版本。所有资源相对路径、hash页面导航，适配Pages项目子路径。

## 发布

唯一公开仓库：[ZhiYanRen/jingchan-yuwen-assistant](https://github.com/ZhiYanRen/jingchan-yuwen-assistant)。主干`main`，Pages来源为GitHub Actions；工作流`.github/workflows/pages.yml`在main推送时验证、构建并发布dist，PR只验证。正式网站：https://zhiyanren.github.io/jingchan-yuwen-assistant/ ，已完成部署和线上页面、资源、听写核对与刷新恢复验证。

应用岛目录`app-island/public/projects.json`已登记为published并完成发布；已核验Logo、正式目标网址、新窗口打开与opener隔离。

## 已知限制

- 未核验用户手中纸质教材的具体印次；上下册版本来源分别标注，请对照自己的课本。
- 系统中文语音、离线语音与读音取决于设备，部分多音字需对照纸质教材；可显示人工校对过的拼音辅助练习。
- 清理浏览器网站数据会删除本机记录；换设备前请导出备份，导入会在确认后替换当前记录。
- 已通过Chrome与WebKit六种视口的模拟浏览器验证，不能替代iPad真机、真实软键盘和主屏幕图标验收。
