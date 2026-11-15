import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:4177/jingchan-yuwen-assistant/';
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const c=await browser.newContext({viewport:{width:834,height:1194},reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage();await p.goto(base);await p.locator('.start-button').waitFor();
 assert.equal(await p.locator('.page-heading').evaluate(el=>getComputedStyle(el).animationName),'none');
 await p.getByLabel('选择册次').focus();await p.keyboard.press('Tab');assert(await p.getByLabel('选择单元').evaluate(el=>el===document.activeElement));await p.getByLabel('选择册次').selectOption('lower');
 await p.getByRole('link',{name:'错题小本',exact:true}).click();await p.getByRole('button',{name:'记一题',exact:true}).first().click();
 await p.getByRole('button',{name:'保存错题',exact:true}).click();assert(await p.getByLabel('题目或易错词').evaluate(el=>el===document.activeElement));assert.equal(await p.getByLabel('题目或易错词').getAttribute('aria-invalid'),'true');
 const controls=await p.locator('dialog button,dialog input,dialog select,dialog textarea').count();for(let i=0;i<controls+3;i++){await p.keyboard.press('Tab');assert(await p.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)));}await p.keyboard.press('Escape');assert(await p.getByRole('button',{name:'记一题',exact:true}).first().evaluate(el=>el===document.activeElement));
 await p.getByRole('link',{name:'语文积累',exact:true}).click();await p.getByLabel('搜索积累').fill('找不到的词');await p.getByRole('button',{name:'清除积累搜索',exact:true}).click();assert.equal(await p.getByLabel('搜索积累').inputValue(),'');assert(await p.getByLabel('搜索积累').evaluate(el=>el===document.activeElement));
 for(const el of await p.locator('button,a,select,input').all()){if(!await el.isVisible())continue;const box=await el.boundingBox();assert(box.height>=43&&box.width>=43,`touch target ${await el.textContent()}`);}
 await p.getByRole('link',{name:'课文听写',exact:true}).click();await p.getByRole('button',{name:'开始听写',exact:true}).click();await p.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true}));await p.getByRole('button',{name:'朗读当前词语',exact:true}).click();assert.match(await p.locator('#voice-status').textContent(),/没有可用的中文语音/);await p.getByRole('button',{name:'显示拼音',exact:true}).click();assert(await p.locator('.pinyin').isVisible());
 await p.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});await p.setViewportSize({width:375,height:812});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.getByRole('button',{name:'重新选课',exact:true}).click();assert(await p.locator('.mobile-brand img').isVisible());
 // 200% text-scale simulation supplements viewport checks; this is not a physical device zoom test.
 await p.addStyleTag({content:'body{font-size:200%}'});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await c.close();console.log('PASS native select value and keyboard focus, modal validation/trap/return, search clear, 44px targets, reduced motion, unavailable speech, dark preference and text-scale smoke');
}finally{await browser.close();}
