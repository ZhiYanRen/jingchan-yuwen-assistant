import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,cp,readFile,readdir,appendFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
test('构建可复现，图标和缓存逻辑变化都产生新版本且产物只含公共资源',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jingchan-build-'));
 try{
  await mkdir(join(root,'scripts'));await cp(new URL('../scripts/build.mjs',import.meta.url),join(root,'scripts/build.mjs'));await cp(new URL('../public/',import.meta.url),join(root,'public'),{recursive:true});
  const build=()=>execFileSync(process.execPath,[join(root,'scripts/build.mjs')],{encoding:'utf8'}).trim();
  const first=build();assert.equal(build(),first);
  const html=await readFile(join(root,'dist/index.html'),'utf8');assert.match(html,/app-[a-f0-9]{12}\.js/);
  const files=await readdir(join(root,'dist'),{recursive:true});assert(!files.some(f=>/AGENTS|work\/|\.env|node_modules/.test(f)));
  await appendFile(join(root,'public/icon.svg'),'\n');const second=build();assert.notEqual(second,first);
  await appendFile(join(root,'scripts/build.mjs'),'\n// cache implementation changed\n');assert.notEqual(build(),second,'缓存逻辑变更也必须变更发布指纹');
 }finally{await rm(root,{recursive:true,force:true});}
});
