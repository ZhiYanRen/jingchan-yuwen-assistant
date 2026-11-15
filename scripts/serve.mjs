import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';
const root=resolve('dist'),prefix='/jingchan-yuwen-assistant/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
createServer(async(req,res)=>{
 try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path===prefix.slice(0,-1)){res.writeHead(302,{Location:prefix});return res.end();}if(path.startsWith(prefix))path=path.slice(prefix.length);else path=path.slice(1);const file=resolve(root,path||'index.html');if(!file.startsWith(root+sep)){res.writeHead(403);return res.end();}const content=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT||4177),'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4177/jingchan-yuwen-assistant/'));
