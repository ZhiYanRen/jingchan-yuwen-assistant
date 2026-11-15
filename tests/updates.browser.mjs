import {chromium} from '@playwright/test';
import {cp,mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
const root=await mkdtemp(join(tmpdir(),'jingchan-update-test-'));
let browser,server;
try{
 await mkdir(join(root,'scripts'));await cp('scripts/build.mjs',join(root,'scripts/build.mjs'));await cp('public',join(root,'public'),{recursive:true});
 const html=await readFile(join(root,'public/index.html'),'utf8');
 async function release(n){await writeFile(join(root,'public/index.html'),html.replace('</head>',`<script>window.testVersion=${n}</script></head>`));execFileSync(process.execPath,[join(root,'scripts/build.mjs')]);await cp(join(root,'dist'),join(root,'release'+n),{recursive:true});}
 await release(1);await release(2);let active=1;
 server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),path=u.pathname.replace(/^\/jingchan-yuwen-assistant\//,'')||'index.html';if(path.includes('..'))throw Error();const data=await readFile(join(root,'release'+active,path));res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json'})[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const context=await browser.newContext(),page=await context.newPage(),base=`http://127.0.0.1:${server.address().port}/jingchan-yuwen-assistant/`;
 await page.goto(base);await page.locator('.start-button').waitFor();await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 await page.getByLabel('练习方式').selectOption('type');await page.getByRole('button',{name:'开始听写',exact:true}).click();await page.getByLabel('写下听到的词语').fill('自动保存的草稿');
 await page.locator('#answer').dispatchEvent('compositionstart');active=2;await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update();});
 await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window.testVersion),1,'不能打断中文输入');
 await page.locator('#answer').dispatchEvent('compositionend');
 await page.waitForFunction(()=>window.testVersion===2,null,{timeout:15000});await page.locator('#answer').waitFor();assert.equal(await page.locator('#answer').inputValue(),'自动保存的草稿');
 await context.setOffline(true);await page.reload();await page.locator('#answer').waitFor();assert.equal(await page.locator('#answer').inputValue(),'自动保存的草稿');assert.equal(await page.evaluate(()=>window.testVersion),2);
 console.log('PASS automatic complete update, IME deferral, draft restoration and offline reload');
}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});}
