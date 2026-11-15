---
version: alpha
name: 静婵语文小助手
description: 六年级学生的月光书房，围绕听写、积累与订正展开。
colors:
  primary: '#47459B'
  secondary: '#EDECF8'
  accent: '#FFBC78'
  background: '#F7F8FC'
  surface: '#FFFFFF'
  text: '#25243D'
  muted: '#64647B'
  border: '#E0E2EE'
  success: '#237351'
  danger: '#B73953'
typography:
  sans:
    fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif'
  reading:
    fontFamily: '"Songti SC", "Noto Serif CJK SC", SimSun, serif'
rounded:
  DEFAULT: '16px'
  small: '12px'
  large: '24px'
spacing:
  unit: '8px'
  panel: '24px'
  section: '32px'
components:
  button: {}
  card: {}
  dialog: {}
---

# 静婵的月光书房

## Overview
面向小学六年级学生，简体中文。iPad 上每日听写与复习的产品界面，固定功能导航和聚焦任务区，不采用宣传首页。沿用已有月牙书页原创标识。唯一表达重点是听写卡上的月光、书页与田字格；周边保持安静，避免幼儿卡通、排行榜和无意义积分。

已使用 Ponytail full、UI/UX Pro Max design-system、Frontend Design 与 Premium。搜索所得教育应用的触控与清晰导航建议适用；营销首屏、英文衬线字体建议不适用，改用中文阅读字体。用户授权直接实施，技术栈采用原生 HTML/CSS/JS，不增加运行依赖。

## Colors
本文件镜像 public/styles.css 的 :root 语义变量；CSS 为运行时唯一 token owner。primary→--primary，secondary→--soft，accent→--apricot，background→--bg，surface→--surface，text→--ink，muted→--muted，border→--line，success→--success，danger→--danger。紫色负责主操作与当前选择，杏色仅作点缀，绿色/红色必须配合结果文字。仅提供明亮主题，系统暗色不改变配色。全局滚动条使用 --scroll-thumb/--scroll-track 及 forced-colors 降级。

## Typography
sans 对应 --font-ui，reading 对应 --font-reading。正文16px、行高1.65；小字最低12px，主要说明14px以上；课题24–32px，答案32px以上。古诗和听写答案使用宋体，操作文字使用系统黑体。不加载外部字体，避免联网与字体切换。

## Layout
>=1200px为220px导航，1000–1199px为184px导航，弹性任务区及224–280px辅助区；760–999px保留176px导航并将辅助区排在任务后；<760px使用底部四项导航与单列内容。内容区最大宽1400px，24–32px间距，触控控件最小44px。文档滚动，导航可粘附；任何区域不锁死内容高度。安全区和手机底栏留白，弹窗不超过可见窗口，键盘弹出后允许滚动到输入框。

## Elevation & Depth
白色卡片、细边框与轻阴影建立书桌层次；紫色听写卡使用静态光晕，不使用持续漂浮或模糊滤镜。

## Shapes
卡片24px、内部块16px、控件12px。胶囊只用于册次、类型和状态。

## Components
所有屏幕共享 .button、.field、.card、.empty、toast() 与原生 dialog 包装。圆角映射 --radius=16px、--radius-small=12px、--radius-large=24px；间距 --space=8px、--panel=24px、--section=32px。SVG 线性图标统一描边，不把 emoji 当图标。

品牌资源：public/icon.svg 为可维护原创源、导航 Logo/favicon；public/icons/apple-touch-icon.png 为180px主屏幕图标，icon-192.png/icon-512.png用于manifest。应用岛复制同一SVG。所有路径相对项目目录。

动效：--motion=180ms 的颜色、transform与opacity过渡，页面入场240ms，按压缩放0.98；仅结果成功瞬间短暂强调。减少动态效果时取消动画与位移，保留文字和颜色反馈。无需GSAP。

## Do's and Don'ts
按册、单元选择内容；练习中不显露答案，用户主动核对后显示。略读课文无官方词语表时明确标记拓展选词，不谎称教材必写。保留断点和表单草稿；错误必须可恢复。模拟浏览器验收与iPad真机验收区分记录。
