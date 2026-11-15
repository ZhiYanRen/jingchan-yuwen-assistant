export const APP = 'jingchan-yuwen';
export const KEY = 'jingchan-yuwen-v1';
export const grade = (answer, expected) => answer.normalize('NFKC').replace(/\s/g, '') === expected.normalize('NFKC').replace(/\s/g, '');
export function createState() {
  return {book:'upper',selected:{upper:'u1',lower:'l1'},units:{upper:'all',lower:'all'},settings:{rate:0.8,mode:'paper',order:'sequential'},practice:null,progress:{answered:0,correct:0,completed:[]},mistakes:[],stars:[],mastered:[],custom:[],drafts:{mistake:null,collection:null},filters:{collection:'全部',mistakes:'待复习'}};
}
export function addMistake(state, item) {
  const existing = state.mistakes.find(m=>m.book===item.book && m.lesson===item.lesson && m.question===item.question && m.answer===item.answer);
  if (existing) {existing.times++;existing.mastered=false;existing.note=item.note;existing.updated=Date.now();return existing;}
  const entry={...item,id:crypto.randomUUID(),category:item.category||'听写错词',times:1,mastered:false,created:Date.now(),updated:Date.now()};
  state.mistakes.unshift(entry);return entry;
}
export function validateBackup(value, catalog) {
  const fail=()=>{throw new Error('备份内容不完整或不属于此应用，请选择导出的原始备份文件。');};
  if (!value || value.app!==APP || value.schema!==1 || !value.state || typeof value.state!=='object') fail();
  const s=value.state, base=createState();
  const str=(v,max=2000)=>typeof v==='string'&&v.length<=max;
  const num=(v,max=1e9)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
  const arr=(v,max=5000)=>Array.isArray(v)&&v.length<=max;
  const book=v=>['upper','lower'].includes(v);
  const id=v=>str(v,100)&&/^[a-zA-Z0-9-]+$/.test(v);
  const unit=(b,n)=>num(n,catalog.books.find(x=>x.id===b)?.units||8)&&n>0;
  const lesson=(b,id)=>catalog.books.some(x=>x.id===b&&x.lessons.some(l=>l.id===id));
  if (!book(s.book)||!s.selected||!s.units||!s.settings||!s.progress||!s.drafts||!s.filters) fail();
  for (const b of ['upper','lower']) {
    if(!str(s.selected[b],20)||!lesson(b,s.selected[b])||!(s.units[b]==='all'||unit(b,s.units[b]))) fail();
  }
  if(![0.6,0.8,1].includes(s.settings.rate)||!['paper','type'].includes(s.settings.mode)||!['sequential','shuffle'].includes(s.settings.order)) fail();
  if(!num(s.progress.answered)||!num(s.progress.correct)||s.progress.correct>s.progress.answered||!arr(s.progress.completed,100)||!s.progress.completed.every(id=>str(id,20)&&catalog.books.some(b=>b.lessons.some(l=>l.id===id)))) fail();
  if(!arr(s.mistakes)||!arr(s.custom,1000)||!arr(s.stars)||!arr(s.mastered)) fail();
  const ids=new Set();
  for(const m of s.mistakes){
    if(!m||!id(m.id)||ids.has(m.id)||!book(m.book)||!lesson(m.book,m.lesson)||!str(m.question)||!m.question.trim()||!str(m.answer)||!m.answer.trim()||!str(m.note,4000)||!str(m.category,50)||!num(m.times,1000000)||m.times<1||typeof m.mastered!=='boolean'||!num(m.created,1e14)||!num(m.updated,1e14)) fail();
    ids.add(m.id);
  }
  const customIds=new Set();
  for(const c of s.custom){
    if(!c||!id(c.id)||!c.id.startsWith('custom-')||customIds.has(c.id)||!book(c.book)||!unit(c.book,c.unit)||!str(c.title,120)||!c.title.trim()||!str(c.body,6000)||!c.body.trim()||!str(c.note,1000)||c.kind!=='我的积累') fail();
    customIds.add(c.id);
  }
  const allIds=new Set([...(catalog.collections||[]).map(c=>c.id),...customIds]);
  for(const list of [s.stars,s.mastered]) if(!list.every(id=>str(id,100)&&allIds.has(id))||new Set(list).size!==list.length) fail();
  for(const key of ['mistake','collection']) {
    const d=s.drafts[key];if(d!==null){if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).length>12||!Object.entries(d).every(([k,v])=>str(k,50)&&str(v,6000))) fail();}
  }
  if(!['全部','古诗文','日积月累','阅读写作','我的收藏','我的积累'].includes(s.filters.collection)||!['待复习','已掌握','全部'].includes(s.filters.mistakes)) fail();
  if(s.practice!==null){
    const p=s.practice;
    if(!p||!book(p.book)||!lesson(p.book,p.lesson)||!arr(p.queue,1000)||!p.queue.length||!p.queue.every(w=>w&&str(w.text,200)&&w.text.trim()&&str(w.pinyin,1000))||!num(p.index,p.queue.length-1)||typeof p.revealed!=='boolean'||!str(p.answer,1000)||!p.results||typeof p.results!=='object'||Array.isArray(p.results)||Object.keys(p.results).length>p.queue.length||!Object.entries(p.results).every(([k,v])=>/^\d+$/.test(k)&&Number(k)<p.queue.length&&typeof v==='boolean')||typeof p.done!=='boolean'||!str(p.title,200)) fail();
  }
  // Select only known fields; imported objects never become configuration/prototype sources.
  for(const k of Object.keys(base))base[k]=structuredClone(s[k]);
  return base;
}
