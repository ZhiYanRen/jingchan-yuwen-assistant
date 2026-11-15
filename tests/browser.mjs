import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:4177/jingchan-yuwen-assistant/';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
await mkdir('work/qa',{recursive:true});const reports=[];
try{
 for(const [width,height] of [[1440,1000],[1194,834],[834,1194],[768,1024],[375,812],[812,375]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.getByRole('heading',{name:'课文听写',exact:true}).waitFor({timeout:3000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`);
  await page.getByLabel('选择册次').selectOption('lower');assert.equal(await page.getByLabel('选择课文').inputValue(),'l1');
  await page.getByRole('button',{name:'开始听写',exact:true}).click();await page.getByRole('button',{name:'查看答案',exact:true}).click();await page.getByRole('button',{name:'加入错题',exact:true}).click();
  assert.equal(await page.locator('#mistake-count').textContent(),'1');
  await page.reload();await page.getByRole('heading',{name:'课文听写',exact:true}).waitFor();assert.equal(await page.locator('#mistake-count').textContent(),'1');
  await page.getByRole('link',{name:'错题小本',exact:true}).click();await page.locator('.mistake-card').first().waitFor();
  await page.getByRole('button',{name:'记一题',exact:true}).click();await page.getByLabel('题目或易错词').fill('测试题');await page.getByLabel('正确答案').fill('正确答案');await page.getByLabel('订正笔记').fill('先理解再记忆');await page.getByRole('button',{name:'保存错题',exact:true}).click();assert.equal(await page.locator('.mistake-card').count(),2);
  await page.getByRole('button',{name:'编辑测试题',exact:true}).click();await page.getByLabel('订正笔记').fill('已经订正');await page.getByRole('button',{name:'保存错题',exact:true}).click();assert(await page.getByText('已经订正',{exact:true}).isVisible());
  const del=page.getByRole('button',{name:'删除测试题',exact:true});await del.click();assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'取消');await page.keyboard.press('Escape');assert(await del.evaluate(el=>el===document.activeElement));
  await del.click();await page.getByRole('button',{name:'删除错题',exact:true}).click();assert.equal(await page.locator('.mistake-card').count(),1);
  await page.getByRole('link',{name:'语文积累',exact:true}).click();await page.getByRole('button',{name:'收藏寒食',exact:true}).click();await page.getByRole('button',{name:'我的收藏',exact:true}).click();assert.equal(await page.locator('.collection-card').count(),1);
  await page.getByRole('button',{name:'记一则',exact:true}).click();await page.getByLabel('标题').fill('我的好句');await page.getByLabel('积累内容').fill('<img src=x onerror=alert(1)> 春天来了。');await page.getByRole('button',{name:'保存积累',exact:true}).click();await page.getByRole('button',{name:'我的积累',exact:true}).click();assert(await page.getByText('<img src=x onerror=alert(1)> 春天来了。',{exact:true}).isVisible());assert.equal(await page.locator('main img[src=x]').count(),0);
  await page.getByRole('link',{name:'学习设置',exact:true}).click();const event=page.waitForEvent('download');await page.getByRole('button',{name:'导出学习备份',exact:true}).click();await event;
  await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"app":"other"}')});await page.locator('#import-error').waitFor();
  await page.getByRole('link',{name:'课文听写',exact:true}).click();await page.getByRole('button',{name:'重新选课',exact:true}).click();await page.getByLabel('练习方式').selectOption('type');await page.getByRole('button',{name:'开始听写',exact:true}).click();await page.getByLabel('写下听到的词语').fill('错误');await page.getByRole('button',{name:'核对答案',exact:true}).click();assert(await page.getByText('再记一遍',{exact:true}).isVisible());await page.getByRole('button',{name:'下一个词',exact:true}).click();
  await page.getByLabel('写下听到的词语').fill('保留输入');await page.reload();assert.equal(await page.getByLabel('写下听到的词语').inputValue(),'保留输入');
  await page.setViewportSize({width:height,height:width});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'rotation');await page.setViewportSize({width,height});await page.screenshot({path:`work/qa/practice-${width}.png`,fullPage:true});await page.getByRole('button',{name:'重新选课',exact:true}).click();await page.screenshot({path:`work/qa/home-${width}.png`,fullPage:true});
  assert.deepEqual(errors,[]);reports.push({width,height,checks:'册次、听写、核对、持久化、错题CRUD、收藏、自建积累转义、备份错误、输入恢复、旋转、无溢出'});await context.close();
 }
 await writeFile('work/qa/report.json',JSON.stringify(reports,null,2));console.log('Browser flows passed across 6 viewports');
}finally{await browser.close();}
