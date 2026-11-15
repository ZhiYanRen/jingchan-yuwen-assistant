import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const mod = await import('../public/domain.js').catch(()=>({}));
const storage = await import('../public/storage.js').catch(()=>({}));
test('文字判分忽略空白但保留错别字',()=>{
 assert.equal(typeof mod.grade,'function','grade尚未实现');
 assert.equal(mod.grade('  一 碧 千 里\n','一碧千里'),true);
 assert.equal(mod.grade('一壁千里','一碧千里'),false);
});
test('重复错词合并、重新练习保留订正历史',()=>{
 assert.equal(typeof mod.addMistake,'function','错词尚未实现');
 const state=mod.createState();
 mod.addMistake(state,{book:'upper',lesson:'u1',question:'境界',answer:'境界',note:'竟界'});
 mod.addMistake(state,{book:'upper',lesson:'u1',question:'境界',answer:'境界',note:'镜界'});
 assert.equal(state.mistakes.length,1);assert.equal(state.mistakes[0].times,2);
});
test('备份接受合法状态，拒绝跨应用/畸形/过量/未知课文',()=>{
 assert.equal(typeof mod.validateBackup,'function','备份尚未实现');
 const data={books:[{id:'upper',lessons:[{id:'u1'}]},{id:'lower',lessons:[{id:'l1'}]}]};
 const state=mod.createState();
 const wrap={app:'jingchan-yuwen',schema:1,state};
 assert.deepEqual(mod.validateBackup(wrap,data),state);
 for(const bad of [{...wrap,app:'other'},{...wrap,state:null},{...wrap,state:{...state,book:'bad'}},{...wrap,state:{...state,mistakes:[{id:'x',book:'upper',lesson:'bad',question:'q',answer:'a'}]}},{...wrap,state:{...state,stars:Array(5001).fill('x')}}]) assert.throws(()=>mod.validateBackup(bad,data));
});
test('损坏存储和不可用存储不覆盖原始值',()=>{
 assert.equal(typeof storage.load,'function','存储尚未实现');
 const bad={getItem:()=>'{broken',setItem:()=>assert.fail('不能覆盖')};
 const result=storage.load(bad,{books:[]});assert.equal(result.ok,false);assert.equal(result.raw,'{broken');
 assert.equal(storage.save({setItem:()=>{throw new Error('quota')}},mod.createState()).ok,false);
});
test('2024审核上册与官方下册课号正确，所有课文均有可追溯选词',async()=>{
 const data=JSON.parse(await readFile(new URL('../public/data.json',import.meta.url),'utf8'));
 assert.equal(data.books[0].lessons.length,26);assert.equal(data.books[1].lessons.length,17);
 assert.equal(data.books[0].lessons[6].title,'我的战友邱少云');
 assert.equal(data.books[0].lessons[19].title,'文言文二则');
 assert.equal(data.books[1].lessons[5].title,'骑鹅旅行记（节选）');
 const ids=new Set();
 for(const b of data.books) for(const l of b.lessons){assert(!ids.has(l.id));ids.add(l.id);assert(l.words.length>=3);assert(l.unit>=1);for(const w of l.words){assert(w.text&&w.pinyin);}}
 assert(data.collections.length>=40);assert.match(data.books[0].edition,/2024/);assert.equal(data.books[1].lessons[12].title,'董存瑞舍身炸暗堡');
});
test('导入拒绝含标记的ID和超出册次的单元',async()=>{
 const data=JSON.parse(await readFile(new URL('../public/data.json',import.meta.url),'utf8'));
 const state=mod.createState();
 const entry={id:'custom-\"><img src=x onerror=alert(1)>',book:'upper',unit:1,title:'标题',body:'内容',note:'',kind:'我的积累'};
 assert.throws(()=>mod.validateBackup({app:'jingchan-yuwen',schema:1,state:{...state,custom:[entry]}},data));
 assert.throws(()=>mod.validateBackup({app:'jingchan-yuwen',schema:1,state:{...state,custom:[{...entry,id:'custom-valid',book:'lower',unit:8}]}},data));
});
