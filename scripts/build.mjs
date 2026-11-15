import {cp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),src=new URL('public/',root),dist=new URL('dist/',root);
const files=await readdir(src,{recursive:true});
const h=createHash('sha256').update(await readFile(new URL(import.meta.url)));for(const f of files.sort()){try{h.update(f);h.update(await readFile(new URL(f,src)));}catch(e){if(e.code!=='EISDIR')throw e;}}
const version=h.digest('hex').slice(0,12);
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});await cp(src,dist,{recursive:true});
const renamed=['app.js','domain.js','storage.js','updates.js','styles.css','data.json'];
const asset=f=>f.replace(/\.(\w+)$/,`-${version}.$1`);
for(const f of renamed){let content=await readFile(new URL(f,dist),'utf8');for(const ref of renamed)content=content.replaceAll(`./${ref}`,`./${asset(ref)}`);content=content.replaceAll('@@VERSION@@',version);await writeFile(new URL(asset(f),dist),content);await rm(new URL(f,dist));}
let html=await readFile(new URL('index.html',dist),'utf8');for(const f of renamed)html=html.replaceAll(`./${f}`,`./${asset(f)}`);await writeFile(new URL('index.html',dist),html.replaceAll('@@VERSION@@',version));
const cacheFiles=(await readdir(dist,{recursive:true})).filter(f=>/\.(html|js|css|json|svg|png|webmanifest)$/.test(f)).map(f=>'./'+f);
await writeFile(new URL('sw.js',dist),`const CACHE='jingchan-${version}';const FILES=${JSON.stringify(['./',...cacheFiles])};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('jingchan-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||(e.request.mode==='navigate'?await c.match('./index.html'):null)||fetch(e.request)));});\n`);
console.log(`Built static dist: ${version}`);
