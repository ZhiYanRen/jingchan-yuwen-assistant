# 验证记录 · 2026-11-15

## 已执行

- `npm test`：7项通过。覆盖文字核对、错词去重、备份边界、损坏存储保护、课程归属、导入ID与册次单元校验、发布指纹与构建可复现。
- `npm run build`：成功，只输出public静态资源至dist；模块、样式、数据按内容指纹命名，worker逻辑也进入版本计算。
- `npm run test:browser`：Chrome和匹配已安装运行库的WebKit均模拟1440×1000、1194×834、834×1194、768×1024、375×812、812×375。上下册、纸写自评、输入核对、刷新恢复、错题CRUD、收藏、自建内容转义、备份错误和旋转无横向溢出均通过。
- `node tests/resilience.browser.mjs`：单元选择刷新/备份往返，导入取消与确认，新建草稿恢复，单个错词复练不计完成整课、完整课练习正确计数，损坏记录不覆盖、模拟存储满后自动重试、首次教材加载失败后重试通过。
- `node tests/updates.browser.mjs`：使用临时构建目录和真实service worker验证，首次打开无需手动刷新即可接受后续新版本；中文输入中延迟激活，完成后自动更新且恢复草稿；真实断网重载使用完整缓存。通过。
- `node tests/experience.browser.mjs`：键盘焦点顺序、表单验证、弹窗Tab循环与Escape焦点恢复、搜索显式清除、代表性页面44px目标、减少动态效果、无中文语音的恢复提示、暗色偏好下明亮主题，以及200%文本放大冒烟检查通过。
- Premium `audit_project.py . --mode strict`：0问题。`designmd lint DESIGN.md`：0错误，6条组件未引用镜像token的非阻塞提示；运行CSS是token唯一所有者。
- `git diff --check`及敏感模式扫描通过；work、研究教材文件、备份、依赖和dist均被忽略，公开产物不含教材整本或个人学习记录。

## 独立审查

Ponytail Review只读审查发现3项真实问题，已全部用失败用例复现并修复：单元数字被存成字符串导致记录读取失败；单词复习误计整课完成；首次安装后忽略后续controllerchange。未以审查报告替代本机验证。

## 明确限制

上述为桌面Chrome/WebKit和触控视口模拟，未进行iPad真机、iOS Safari系统中文语音听辨、软键盘、主屏幕启动和真实200%浏览器缩放验收。原生select使用系统选择器；已测试值变化和键盘焦点，未验证iPad系统选项弹层的实际显示。

上册封面与目录已核对为2024审核修订；下册官方文件未确认2024审核修订，应用内、README和SOURCES分别注明。用户纸质教材的具体印次仍未核实。

## 发布

主功能提交1b9d5cf，GitHub Actions运行43692010330成功；正式网站https://zhiyanren.github.io/jingchan-yuwen-assistant/已访问并验证HTML、指纹模块、样式、manifest、所有PNG图标与service worker。线上iPad视口下下册输入核对与刷新恢复通过。

应用岛提交47754d3，运行43692801844成功；线上目录published与Logo加载正确，实际点击语文小帮手入口打开新窗口，目标地址正确且window.opener为null。

WebKit回归额外发现Safari鼠标点击不一定先聚焦按钮，已将弹窗返回目标改为显式传入实际触发按钮，而非只取document.activeElement；六视口完整CRUD回归通过。
