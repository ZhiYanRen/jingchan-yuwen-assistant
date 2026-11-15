import {watchUpdates} from './updates.js';
import {APP,KEY,createState,grade,addMistake,validateBackup} from './domain.js';
import {load,save} from './storage.js';
const $=s=>document.querySelector(s),main=$('#main'),dialog=$('#dialog');
dialog.addEventListener('keydown',e=>{
 if(e.key!=='Tab')return;
 const controls=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(el=>el.getClientRects().length);
 const first=controls[0],last=controls.at(-1);
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={headphones:'M4 14v-3a8 8 0 0 1 16 0v3M4 13H3v7h4v-7H4m16 0h1v7h-4v-7h3',book:'M12 5v15M12 5C8 2 3 3 2 4v15c3-2 7-1 10 1 3-2 7-3 10-1V4c-3-2-7-1-10 1Z',pen:'m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-4L4 15v5ZM13 20h8',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',play:'m9 5 11 7-11 7V5Z',sound:'M10 4 5 8H2v8h3l5 4V4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',arrow:'M4 12h16m-6-6 6 6-6 6',check:'m5 12 4 4L20 5',star:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z',plus:'M12 5v14M5 12h14',refresh:'M20 8a8 8 0 1 0 0 8M20 3v5h-5',leaf:'M20 3C6 2 2 10 6 16s15 0 14-13ZM5 20l10-11',moon:'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z',search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6',download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7'};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.book}"/></svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
let catalog,state,storageBlocked=false,storageRaw=null,externalConflict=false,view='dictation',searches={collection:'',mistakes:''},mistakePage=0,collectionUnit='all',hint=false,toastTimer,modalReturn,pendingImport,voiceTimer,composing=false,saveRetry,pointerDown=false;
const book=()=>catalog.books.find(b=>b.id===state.book);
const lesson=()=>book().lessons.find(l=>l.id===state.selected[state.book])||book().lessons[0];
const allCollections=()=>[...catalog.collections,...state.custom];
const button=(text,act,options='')=>`<button ${options.includes('class=')?'':'class="button"'} type="button" data-act="${act}" ${options}>${text}</button>`;
function toast(text){clearTimeout(toastTimer);$('#status').textContent=text;$('#status').classList.add('visible');toastTimer=setTimeout(()=>$('#status').classList.remove('visible'),3200);}
function storageBanner(message){$('#persistent-error').hidden=false;$('#persistent-error').innerHTML=`<span>${esc(message)}</span><button class="button small" data-act="export">导出当前备份</button>${storageRaw?'<button class="button small" data-act="raw-export">下载原始记录</button>':''}<a href="#settings">导入备份</a>`;$('#save-label').textContent='尚未保存 · 请先备份';}
function persist(){clearTimeout(saveRetry);if(storageBlocked||externalConflict)return false;let result;try{result=save(localStorage,state);}catch{result={ok:false};}if(!result.ok){storageBanner('当前浏览器无法保存。可以继续本次学习，请及时导出备份；记录仍保留在本次页面中。');saveRetry=setTimeout(persist,3000);return false;}$('#save-label').textContent='已保存在这台设备';$('#persistent-error').hidden=true;return true;}
function stopVoice(){clearTimeout(voiceTimer);window.speechSynthesis?.cancel();const el=$('#voice-status');if(el)el.textContent='点击朗读，听清后再写。';}
function speak(text){
 stopVoice();const status=$('#voice-status');
 const explain='当前没有可用的中文语音。请检查系统中文语音与音量，也可以显示拼音继续练习。';
 if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){if(status)status.textContent=explain;toast(explain);return;}
 const synth=window.speechSynthesis,voices=synth.getVoices(),voice=voices.find(v=>/^zh[-_]CN/i.test(v.lang))||voices.find(v=>/^zh/i.test(v.lang));
 if(voices.length&&!voice){if(status)status.textContent=explain;return;}
 const utter=new SpeechSynthesisUtterance(text);utter.lang='zh-CN';utter.rate=state.settings.rate;if(voice)utter.voice=voice;
 if(status)status.textContent='正在准备朗读…';
 utter.onstart=()=>{clearTimeout(voiceTimer);if(status)status.textContent='正在朗读，听清后在纸上或输入框书写。';};
 utter.onend=()=>{clearTimeout(voiceTimer);if(status)status.textContent='朗读完成，需要时可以再听一遍。';};
 utter.onerror=()=>{clearTimeout(voiceTimer);if(status)status.textContent=explain;};
 voiceTimer=setTimeout(()=>{if(status)status.textContent='若没有听到声音，请检查静音与系统中文语音，或显示拼音继续练习。';},7000);
 synth.speak(utter);
}
function render(focus=false){
 const active=document.activeElement,aid=active?.id,act=active?.dataset.act,item=active?.dataset.id,pos=active?.selectionStart;
 $('#book').value=state.book;$('#mistake-count').textContent=state.mistakes.filter(m=>!m.mastered).length;
 document.querySelectorAll('[data-view]').forEach(a=>{if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 main.innerHTML=({dictation:dictationView,collection:collectionView,mistakes:mistakesView,settings:settingsView}[view])();
 if(focus)$('#page-title')?.focus();else if(aid){const next=document.getElementById(aid);next?.focus({preventScroll:true});if(typeof pos==='number'&&typeof next?.setSelectionRange==='function'&&next.type!=='number')try{next.setSelectionRange(pos,pos);}catch{}}
 else if(act){[...main.querySelectorAll('[data-act]')].find(el=>el.dataset.act===act&&el.dataset.id===item)?.focus({preventScroll:true});}
}
function heading(title,subtitle,action=''){return `<div class="page-heading"><div><p class="eyebrow">静婵的语文书房</p><h1 id="page-title" tabindex="-1">${title}</h1><p>${subtitle}</p></div>${action}</div>`;}
function unitOptions(selected='all',all=true,lessonsOnly=false){return `${all?'<option value="all">全部单元</option>':''}${Array.from({length:book().units},(_,i)=>i+1).filter(n=>!lessonsOnly||book().lessons.some(l=>l.unit===n)).map(n=>`<option value="${n}" ${String(selected)===String(n)?'selected':''}>第${['一','二','三','四','五','六','七','八'][n-1]}单元</option>`).join('')}`;}
function lessonOptions(selected=lesson().id){return book().lessons.map(l=>`<option value="${l.id}" ${l.id===selected?'selected':''}>${l.number}. ${esc(l.title)}</option>`).join('');}
function asideCard(){const complete=state.progress.completed.length;return `<aside class="study-aside"><section class="card progress-card"><div class="mini-title">${icon('leaf')}<h2>一点一滴，都算数</h2></div><div class="stat-line"><strong>${state.progress.answered}</strong><span>累计练习词语</span></div><div class="mini-stats"><div><b>${state.progress.correct}</b><span>写对词语</span></div><div><b>${complete}</b><span>完成课文</span></div></div><p class="muted">从一次听清、一次写对开始，<br>把进步留在每一天。</p></section><section class="card tip-card"><span class="tip-icon">${icon('pen')}</span><h2>听 · 写 · 想</h2><ol><li>先听清楚，不急着落笔。</li><li>认真书写，留意形近字。</li><li>核对后，把错词再记一遍。</li></ol><a href="#mistakes">去看看错题小本 ${icon('arrow')}</a></section><p class="aside-quote">“不积跬步，无以至千里。”<small>——《荀子·劝学》</small></p></aside>`;}
function dictationView(){
 return heading('课文听写','听一个词，认真写下；小小的坚持，也有大大的收获。')+`<div class="learning-grid"><div class="task-column">${state.practice&&state.practice.book===state.book?practiceView():setupView()}</div>${asideCard()}</div>`;
}
function setupView(){
 const l=lesson(),unit=state.units[state.book],lessons=book().lessons.filter(x=>unit==='all'||x.unit===Number(unit));
 return `<section class="welcome-card"><div><span class="tag">六年级 · ${state.book==='upper'?'上册':'下册'}</span><h2>今天，从一课开始。</h2><p>准备好纸和笔，给自己一段专注的时间。</p></div><div class="book-art" aria-hidden="true"><svg viewBox="0 0 240 150"><circle cx="170" cy="50" r="35" fill="#FFDAA8"/><path d="M24 70Q70 44 119 70Q168 44 214 70L220 135Q167 112 119 136Q70 112 18 135Z" fill="#C6C5EE"/><path d="M29 59Q76 40 119 65Q166 40 210 59L211 123Q166 104 119 127Q73 104 27 123Z" fill="#fff"/><path d="M119 65v62M45 72q30-7 55 6M44 88q30-7 55 6M145 78q23-9 47-4M145 94q23-9 47-4" fill="none" stroke="#AAA8D7" stroke-width="3" stroke-linecap="round"/><path d="m74 18 2 8 8 2-8 2-2 8-2-8-8-2 8-2Z" fill="#FFBC78"/></svg></div></section>
 <section class="card setup-card"><div class="section-heading"><h2>选择今天的课文</h2><span class="muted">共 ${book().lessons.length} 课</span></div><div class="select-grid"><label class="field">选择单元<select id="unit">${unitOptions(unit,true,true)}</select></label><label class="field">选择课文<select id="lesson">${lessons.map(x=>`<option value="${x.id}" ${x.id===l.id?'selected':''}>${x.number}. ${esc(x.title)}</option>`).join('')}</select></label></div>
 <div class="selected-lesson"><span class="lesson-number">${String(l.number).padStart(2,'0')}</span><div><h3>${esc(l.title)}</h3><p>第${l.unit}单元 · ${l.words.length}词 · ${l.kind}</p></div>${icon('book')}</div>
 <div class="select-grid"><label class="field">练习方式<select id="mode"><option value="paper" ${state.settings.mode==='paper'?'selected':''}>纸上听写 · 自己核对</option><option value="type" ${state.settings.mode==='type'?'selected':''}>输入答案 · 自动核对</option></select></label><label class="field">词语顺序<select id="order"><option value="sequential" ${state.settings.order==='sequential'?'selected':''}>按顺序练习</option><option value="shuffle" ${state.settings.order==='shuffle'?'selected':''}>打乱顺序练习</option></select></label></div>
 <button class="button primary start-button" data-act="start">${icon('play')} 开始听写 ${icon('arrow')}</button><p class="helper">每个词由你点击朗读，按自己的节奏来。</p>
 <details class="word-preview"><summary>预习本课选词 <span>${l.words.length}词</span></summary><div class="word-chips">${l.words.map(w=>`<span>${esc(w.text)}<small>${esc(w.pinyin)}</small></span>`).join('')}</div></details></section>
 <p class="source-note">${icon('book')} 上册2024审核修订本；下册按官方平台目录。教材词表与拓展选词分别标注。<a href="#settings">查看教材说明</a></p>`;
}
function practiceView(){
 const p=state.practice,w=p.queue[p.index],graded=Object.hasOwn(p.results,p.index),result=p.results[p.index];
 if(p.done){const correct=Object.values(p.results).filter(Boolean).length;return `<section class="card finished"><span class="success-mark">${icon('check')}</span><p class="eyebrow">给认真练习的你</p><h2>这一轮，练完啦！</h2><p>${esc(p.title)} · ${p.queue.length}个词</p><div class="finish-score"><strong>${correct}</strong><span>/${p.queue.length} 词写对</span></div><p>${correct===p.queue.length?'每一笔认真，都值得被看见。':'不会的词已经留在错题小本，过一会儿再练一次。'}</p><div class="button-row">${button('重新选课','reset')}${button('再练一遍','restart','class="button primary"')}</div><a href="#mistakes">去复习错题 ${icon('arrow')}</a></section>`;}
 return `<section class="card practice-panel"><div class="section-heading"><div><span class="tag">${esc(p.title)}</span><h2>把听到的词，写下来</h2></div>${button('重新选课','reset','class="button ghost small"')}</div><div class="progress-label"><span>第 ${p.index+1} / ${p.queue.length} 个词</span><span>已核对 ${Object.keys(p.results).length} 个</span></div><progress max="${p.queue.length}" value="${Object.keys(p.results).length}" aria-label="本轮听写进度"></progress>
 <div class="listening-stage"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><span class="stage-label">${p.revealed?'认真核对每一个字':'用耳朵听，用心记'}</span><button class="listen-button" data-act="speak" aria-label="朗读当前词语">${icon('sound')}</button><p id="voice-status" role="status">点击朗读，听清后再写。</p></div>
 <div class="practice-tools"><label class="inline-field">语速<select id="rate" aria-label="朗读语速"><option value="0.6" ${state.settings.rate===0.6?'selected':''}>慢一些</option><option value="0.8" ${state.settings.rate===0.8?'selected':''}>适中</option><option value="1" ${state.settings.rate===1?'selected':''}>正常</option></select></label><button class="button ghost small" data-act="hint" aria-pressed="${hint}">${hint?'隐藏拼音':'显示拼音'}</button></div>
 ${hint?`<p class="pinyin">${esc(w.pinyin)}</p>`:''}
 ${state.settings.mode==='type'?`<form id="answer-form" novalidate><label class="field answer-field">写下听到的词语<input id="answer" maxlength="1000" autocomplete="off" value="${esc(p.answer)}" ${graded?'readonly':''} aria-describedby="answer-error"></label><p id="answer-error" class="field-error" role="status"></p>${!graded?'<button class="button primary full" type="submit">核对答案</button>':''}</form>`:`<div class="paper-guide"><div class="writing-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div><p>在纸上写好后，再打开答案。</p></div>`}
 ${p.revealed?`<div class="answer-result ${graded?(result?'correct':'incorrect'):''}" role="status"><span>${graded?(result?'写对啦':'再记一遍'):'正确答案'}</span><strong>${esc(w.text)}</strong><small>${esc(w.pinyin)}</small></div>${!graded?`<div class="button-row">${button('加入错题','wrong')}${button(icon('check')+' 我写对了','right','class="button positive"')}</div>`:''}`:state.settings.mode==='paper'?button('查看答案','reveal','class="button primary full"'):''}
 <div class="practice-bottom">${button('上一个词','previous',p.index===0?'disabled':'')}${button(p.index===p.queue.length-1?'查看本轮结果':'下一个词','next',!graded?'disabled':'')}</div></section>`;
}
function startPractice(queue=lesson().words,title=lesson().title,lessonId=lesson().id){stopVoice();hint=false;const list=structuredClone(queue);if(state.settings.order==='shuffle')for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}state.practice={book:state.book,lesson:lessonId,queue:list,title,index:0,results:{},revealed:false,answer:'',done:false};persist();render();$('#page-title').focus();}
function mark(correct){const p=state.practice;if(!p||Object.hasOwn(p.results,p.index))return;const w=p.queue[p.index];p.results[p.index]=correct;p.revealed=true;state.progress.answered++;if(correct)state.progress.correct++;else addMistake(state,{book:p.book,lesson:p.lesson,question:w.text,answer:w.text,note:p.answer?'本次写成：'+p.answer:'纸上听写时写错，留意字形。'});persist();render();toast(correct?'写对啦，继续保持。':'已加入错题小本，记住这个词。');}
function collectionView(){
 const type=state.filters.collection,q=searches.collection.trim();let rows=allCollections().filter(c=>c.book===state.book&&(collectionUnit==='all'||c.unit===Number(collectionUnit))&&(type==='全部'||type==='我的收藏'&&state.stars.includes(c.id)||c.kind===type)&&(!q||[c.title,c.body,c.note].join(' ').includes(q)));
 return heading('语文积累','让读过的诗、记住的句子，慢慢变成自己的语言。',button(icon('plus')+' 记一则','new-collection','class="button primary"'))+`<div class="filter-bar"><label class="search-field">${icon('search')}<input id="collection-search" type="search" aria-label="搜索积累" placeholder="找一首诗、一个句子…" value="${esc(searches.collection)}">${searches.collection?button('×','clear-collection-search','class="clear-search" aria-label="清除积累搜索"'):''}</label><label class="inline-field">单元<select id="collection-unit" aria-label="筛选积累单元">${unitOptions(collectionUnit)}</select></label></div><div class="chips" aria-label="积累类型">${['全部','古诗文','日积月累','阅读写作','我的收藏','我的积累'].map(t=>button(t,'collection-filter',`data-id="${t}" aria-pressed="${type===t}" class="chip"`)).join('')}</div><p class="list-summary">${book().title} · 找到 ${rows.length} 则积累</p><div class="collection-grid">${rows.length?rows.map(c=>`<article class="card collection-card"><div class="section-heading"><span class="tag">第${c.unit}单元 · ${c.kind}</span>${button(icon('star'),'star',`class="icon-button ${state.stars.includes(c.id)?'is-starred':''}" data-id="${esc(c.id)}" aria-pressed="${state.stars.includes(c.id)}" aria-label="${state.stars.includes(c.id)?'取消收藏':'收藏'}${esc(c.title)}"`)}</div><h2>${esc(c.title)}</h2><p class="collection-body ${c.kind==='古诗文'?'poem':''}">${esc(c.body)}</p><p class="collection-note">${esc(c.note)}</p><div class="card-actions">${button(icon('check')+' '+(state.mastered.includes(c.id)?'已掌握':'标记掌握'),'master-collection',`class="button small ghost" data-id="${esc(c.id)}" aria-pressed="${state.mastered.includes(c.id)}"`)}${c.kind==='我的积累'?`${button('编辑','edit-collection',`class="button small ghost" data-id="${esc(c.id)}" aria-label="编辑${esc(c.title)}"`)}${button('删除','delete-collection',`class="button small ghost danger-text" data-id="${esc(c.id)}" aria-label="删除${esc(c.title)}"`)}`:''}</div></article>`).join(''):empty('这里还没有积累',q?'换个关键词试试，或清除筛选。':type==='我的收藏'?'点击积累卡片上的星星，把喜欢的内容留在这里。':'可以记下课堂上的好句，或清除筛选查看内置积累。',button('清除筛选','clear-collection'))}</div>`;
}
function empty(title,body,action=''){return `<div class="empty card">${icon('book')}<h2>${title}</h2><p>${body}</p>${action}</div>`;}
function mistakesView(){
 const type=state.filters.mistakes,q=searches.mistakes.trim(),rows=state.mistakes.filter(m=>m.book===state.book&&(type==='全部'||type==='已掌握'&&m.mastered||type==='待复习'&&!m.mastered)&&(!q||[m.question,m.answer,m.note].join(' ').includes(q)));mistakePage=Math.min(mistakePage,Math.max(0,Math.ceil(rows.length/20)-1));
 return heading('错题小本','把不会的留在这里，把每一次订正变成下一次的底气。',button(icon('plus')+' 记一题','new-mistake','class="button primary"'))+`<div class="notebook-banner"><div>${icon('pen')}<span>错一次没关系，记住就有收获。</span></div><p>听写错词会自动收录，也可以手动记录课堂错题。</p></div><div class="filter-bar"><label class="search-field">${icon('search')}<input id="mistake-search" type="search" aria-label="搜索错题" placeholder="搜索题目、答案或笔记" value="${esc(searches.mistakes)}">${searches.mistakes?button('×','clear-mistake-search','class="clear-search" aria-label="清除错题搜索"'):''}</label><div class="chips compact">${['待复习','已掌握','全部'].map(t=>button(t,'mistake-filter',`class="chip" data-id="${t}" aria-pressed="${type===t}"`)).join('')}</div></div><p class="list-summary">${book().title} · ${rows.length}道${type==='全部'?'错题':type+'错题'}</p><div class="mistake-list">${rows.length?rows.slice(mistakePage*20,mistakePage*20+20).map(m=>{const l=book().lessons.find(x=>x.id===m.lesson);return `<article class="card mistake-card"><div class="mistake-header"><span class="tag">${esc(l.title)} · ${esc(m.category)}</span><span class="muted">记录 ${m.times} 次</span></div><h2>${esc(m.question)}</h2><div class="correction"><span>正确答案</span><p>${esc(m.answer)}</p></div>${m.note?`<p class="mistake-note">${esc(m.note)}</p>`:''}<div class="card-actions">${button(icon('check')+' '+(m.mastered?'还需复习':'我已掌握'),'master-mistake',`class="button small ${m.mastered?'ghost':'positive'}" data-id="${esc(m.id)}"`)}${m.category==='听写错词'?`${button(icon('sound')+' 再练一次','retry-word',`class="button small ghost" data-id="${esc(m.id)}"`)}`:''}${button('编辑','edit-mistake',`class="button small ghost" data-id="${esc(m.id)}" aria-label="编辑${esc(m.question)}"`)}${button('删除','delete-mistake',`class="button small ghost danger-text" data-id="${esc(m.id)}" aria-label="删除${esc(m.question)}"`)}</div></article>`;}).join(''):empty(q?'没有找到这道题':type==='已掌握'?'掌握的错题会留在这里':'还没有待复习的错题',q?'换个关键词，或者清空搜索再试。':'可以先练一课听写，或记录刚刚遇到的易错点。',button('记一题','new-mistake')+button('清除筛选','clear-mistakes'))}</div>${rows.length>20?`<div class="pagination">${button('上一页','mistakes-prev',mistakePage===0?'disabled':'')}<span>第${mistakePage+1} / ${Math.ceil(rows.length/20)}页</span>${button('下一页','mistakes-next',(mistakePage+1)*20>=rows.length?'disabled':'')}</div>`:''}`;
}
function settingsView(){return heading('学习设置','照顾好学习记录，也找到适合自己的节奏。')+`<div class="settings-grid"><section class="card"><div class="mini-title">${icon('download')}<h2>学习备份</h2></div><p>错题、收藏、自己的积累和听写进度，仅保存在当前浏览器。换设备或清理浏览器前，请先导出备份。</p><p class="info-note">本机保存不会自动同步到其他设备。导入备份会替换当前全部学习记录。</p><div class="button-row">${button(icon('download')+' 导出学习备份','export','class="button primary"')}<label class="button">选择备份文件<input type="file" id="import-file" accept=".json,application/json" class="file-input"></label></div><p id="import-error" class="field-error" role="alert" hidden></p><p class="muted">仅支持本应用导出的 JSON 备份，最大 5 MB。</p></section>
 <section class="card"><div class="mini-title">${icon('sound')}<h2>朗读与离线使用</h2></div><p>朗读使用设备的中文语音，首次使用请检查音量与静音状态。没有听到声音时，可显示拼音继续练习。</p><label class="field">默认朗读语速<select id="rate"><option value="0.6" ${state.settings.rate===0.6?'selected':''}>慢一些</option><option value="0.8" ${state.settings.rate===0.8?'selected':''}>适中</option><option value="1" ${state.settings.rate===1?'selected':''}>正常</option></select></label>${button('试听中文语音','test-voice')}<p id="voice-status" role="status"></p><p id="offline-status" class="muted">首次联网打开并完成缓存后，可离线使用。离线朗读取决于系统是否已安装中文语音。</p></section>
 <section class="card book-description"><div class="mini-title">${icon('book')}<h2>教材与内容说明</h2></div><p><strong>人教统编版 · 小学六年级上下册</strong></p><p>上册使用封面标注“2024年审核通过”的26课修订目录；下册使用国家平台可核验的17课目录，另含10篇古诗词诵读。两册均为小学六三学制。</p><p>内置508个练习词、48则积累。377个词来自所核验教材词语表，其余为课文拓展选词，界面分别标注；学习方法提示为自主整理，不是出版社配套教参。未收录现代课文全文。</p><p>下册官方文件未标注2024审核修订，本应用不把它标成已确认的2024修订本。尚未核验你手中课本的具体印次；请以实际纸质教材为准。</p><div class="source-links"><a href="https://basic.smartedu.cn/tchMaterial" target="_blank" rel="noopener noreferrer">国家中小学智慧教育平台 ${icon('arrow')}</a><a href="https://jc.pep.com.cn/" target="_blank" rel="noopener noreferrer">人教社电子教材 ${icon('arrow')}</a></div></section>
 <section class="card"><div class="mini-title">${icon('moon')}<h2>你的随身语文书房</h2></div><p>在 iPad 的 Safari 中，使用“分享 → 添加到主屏幕”，像打开 App 一样开始学习。</p><p>新版会在完整下载并自动保存后加载，恢复听写位置和输入。正在输入中文、播放语音或填写弹窗时会等待操作结束。</p><p class="muted">版本 @@VERSION@@ · 全部学习功能在浏览器本机运行。</p><p class="muted">专属月牙书页标识为本项目原创设计。</p></section></div>`;}
function openDialog(html){modalReturn={id:document.activeElement?.id,label:document.activeElement?.getAttribute('aria-label'),act:document.activeElement?.dataset.act};$('#dialog-body').innerHTML=html;dialog.showModal();}
function closeDialog(){dialog.close();}
dialog.addEventListener('close',()=>{pendingImport=null;const target=modalReturn?.id?document.getElementById(modalReturn.id):modalReturn?.label?[...document.querySelectorAll('[aria-label]')].find(e=>e.getAttribute('aria-label')===modalReturn.label):modalReturn?.act?[...document.querySelectorAll('[data-act]')].find(e=>e.dataset.act===modalReturn.act):null;(target||$('#page-title'))?.focus({preventScroll:true});});
function field(label,name,value='',opts=''){return `<label class="field">${label}<input name="${name}" value="${esc(value)}" ${opts}></label>`;}
function showForm(kind,id){
 const isMistake=kind==='mistake',record=id?(isMistake?state.mistakes:state.custom).find(x=>x.id===id):null,draft=(state.drafts[kind]?.book===state.book&&(state.drafts[kind].id||'')===(id||'')?state.drafts[kind]:null)||record||{},title=isMistake?(id?'编辑错题':'记一题'):(id?'编辑积累':'记一则');
 openDialog(`<form id="entry-form" data-kind="${kind}" data-id="${id||''}" novalidate><div class="dialog-heading"><h2 id="dialog-title">${title}</h2><button type="button" class="icon-button" data-act="close-dialog" aria-label="关闭">×</button></div><p class="muted">${book().title} · ${id?'修改后会保留原来的记录。':'输入会暂存在这台设备，可稍后继续。'}</p>${isMistake?`<label class="field">所属课文<select name="lesson">${lessonOptions(draft.lesson||lesson().id)}</select></label>${field('题目或易错词','question',draft.question,'required maxlength="2000"')}${field('正确答案','answer',draft.answer,'required maxlength="2000"')}<label class="field">订正笔记<textarea class="resize-none" name="note" maxlength="4000" rows="3">${esc(draft.note)}</textarea></label>`:`<label class="field">所属单元<select name="unit">${unitOptions(draft.unit||1,false)}</select></label>${field('标题','title',draft.title,'required maxlength="120"')}<label class="field">积累内容<textarea class="resize-none" name="body" maxlength="6000" rows="5" required>${esc(draft.body)}</textarea></label>${field('出处或小提示','note',draft.note,'maxlength="1000"')}`}<p id="form-error" class="field-error" role="alert"></p><div class="dialog-actions">${button('取消','close-dialog')}<button class="button primary" type="submit">${isMistake?'保存错题':'保存积累'}</button></div></form>`);
}
function confirmDelete(kind,id){const record=(kind==='mistake'?state.mistakes:state.custom).find(x=>x.id===id);if(!record)return;openDialog(`<h2 id="dialog-title">删除${kind==='mistake'?'错题':'积累'}</h2><p>确定删除“${esc(record.question||record.title)}”吗？这条记录将从当前设备移除。</p><div class="dialog-actions">${button('取消','close-dialog','autofocus')}<button class="button danger" data-act="confirm-delete" data-kind="${kind}" data-id="${id}">删除${kind==='mistake'?'错题':'积累'}</button></div>`);}
function download(content,name){const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportBackup(){download(JSON.stringify({app:APP,schema:1,exportedAt:new Date().toISOString(),state},null,2),'静婵语文-学习备份-'+new Date().toLocaleDateString('sv-SE')+'.json');toast('备份已生成，请妥善保存。');}
async function importFile(file){
 const error=$('#import-error');if(!file)return;
 try{if(file.size>5*1024*1024)throw new Error('文件超过5 MB，请选择本应用导出的备份。');const validated=validateBackup(JSON.parse(await file.text()),catalog);openDialog(`<h2 id="dialog-title">导入学习备份</h2><p>将用备份中的 ${validated.mistakes.length} 道错题、${validated.custom.length} 则自建积累和练习进度，替换当前设备的全部记录。</p><p class="info-note">建议先导出当前备份。取消不会改变现有记录。</p><div class="dialog-actions">${button('先导出当前备份','export')}${button('取消','close-dialog','autofocus')}${button('替换并导入','confirm-import','class="button danger"')}</div>`);pendingImport=validated;error.hidden=true;}
 catch(e){error.textContent=e instanceof SyntaxError?'文件不是有效的 JSON 备份，请重新选择。':e.message;error.hidden=false;}finally{$('#import-file').value='';}
}
function formSubmit(e){
 const form=e.target;if(form.id==='answer-form'){e.preventDefault();if(e.isComposing||composing)return;if(!state.practice.answer.trim()){$('#answer-error').textContent='先写下听到的词语，再核对答案。';$('#answer').focus();return;}mark(grade(state.practice.answer,state.practice.queue[state.practice.index].text));return;}
 if(form.id!=='entry-form')return;e.preventDefault();const invalid=[...form.elements].find(el=>el.required&&!el.value.trim());if(invalid){$('#form-error').textContent='请填写'+invalid.closest('label').firstChild.textContent.trim()+'。';invalid.setAttribute('aria-invalid','true');invalid.setAttribute('aria-describedby','form-error');invalid.focus();return;}
 const values=Object.fromEntries(new FormData(form)),kind=form.dataset.kind,id=form.dataset.id;
 if(kind==='mistake'){
  if(id){const m=state.mistakes.find(x=>x.id===id);Object.assign(m,values,{updated:Date.now()});}else addMistake(state,{...values,book:state.book,category:'课堂错题'});
  state.drafts.mistake=null;state.filters.mistakes='全部';searches.mistakes='';mistakePage=0;
 }else{
  const entry={...values,unit:Number(values.unit),book:state.book,kind:'我的积累'};
  if(id)Object.assign(state.custom.find(x=>x.id===id),entry);else state.custom.unshift({...entry,id:'custom-'+crypto.randomUUID()});state.drafts.collection=null;state.filters.collection='我的积累';collectionUnit='all';searches.collection='';
 }
 persist();render();closeDialog();toast(kind==='mistake'?'错题已保存。':'积累已保存。');
}
document.addEventListener('submit',formSubmit);
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-act]');if(!el||el.disabled)return;const act=el.dataset.act,id=el.dataset.id;if(act==='retry-load'){boot();return;}if(!state)return;
 if(act==='clear-collection-search'||act==='clear-mistake-search'){const isCollection=act==='clear-collection-search';searches[isCollection?'collection':'mistakes']='';render();$(isCollection?'#collection-search':'#mistake-search').focus();}
 else if(act==='start')startPractice();
 else if(act==='speak')speak(state.practice.queue[state.practice.index].text);
 else if(act==='test-voice')speak('每天进步一点点，认真书写每一个字。');
 else if(act==='hint'){hint=!hint;render();}
 else if(act==='reveal'){state.practice.revealed=true;persist();render();}
 else if(act==='right'||act==='wrong')mark(act==='right');
 else if(act==='next'){const p=state.practice;if(!Object.hasOwn(p.results,p.index))return;stopVoice();hint=false;if(p.index===p.queue.length-1){p.done=true;const source=catalog.books.find(b=>b.id===p.book).lessons.find(l=>l.id===p.lesson);if(p.queue.length===source.words.length&&p.queue.every(w=>source.words.some(x=>x.text===w.text))&&!state.progress.completed.includes(p.lesson))state.progress.completed.push(p.lesson);}else{p.index++;p.revealed=Object.hasOwn(p.results,p.index);p.answer='';}persist();render();}
 else if(act==='previous'){stopVoice();hint=false;state.practice.index=Math.max(0,state.practice.index-1);state.practice.revealed=Object.hasOwn(state.practice.results,state.practice.index);state.practice.answer='';persist();render();}
 else if(act==='reset'){stopVoice();state.practice=null;persist();render();}
 else if(act==='restart'){const p=state.practice;startPractice(p.queue,p.title,p.lesson);}
 else if(act==='collection-filter'){state.filters.collection=id;persist();render();}
 else if(act==='mistake-filter'){state.filters.mistakes=id;mistakePage=0;persist();render();}
 else if(act==='clear-collection'){state.filters.collection='全部';collectionUnit='all';searches.collection='';persist();render();}
 else if(act==='clear-mistakes'){state.filters.mistakes='全部';searches.mistakes='';persist();render();}
 else if(act==='star'||act==='master-collection'){const list=act==='star'?state.stars:state.mastered,i=list.indexOf(id);if(i<0)list.push(id);else list.splice(i,1);persist();render();toast(act==='star'?(i<0?'已收藏。':'已取消收藏。'):(i<0?'已标记掌握。':'已恢复为未掌握。'));}
 else if(act==='master-mistake'){const m=state.mistakes.find(x=>x.id===id);m.mastered=!m.mastered;persist();render();toast(m.mastered?'已标记掌握，随时可以再复习。':'已放回待复习。');}
 else if(act==='retry-word'){const m=state.mistakes.find(x=>x.id===id),l=book().lessons.find(x=>x.id===m.lesson),w=l.words.find(w=>w.text===m.answer)||{text:m.answer,pinyin:''};startPractice([w],l.title+' · 错词复习',m.lesson);location.hash='dictation';}
 else if(act==='new-mistake'||act==='edit-mistake')showForm('mistake',id);
 else if(act==='new-collection'||act==='edit-collection')showForm('collection',id);
 else if(act==='delete-mistake'||act==='delete-collection')confirmDelete(act==='delete-mistake'?'mistake':'collection',id);
 else if(act==='confirm-delete'){if(el.dataset.kind==='mistake')state.mistakes=state.mistakes.filter(x=>x.id!==id);else{state.custom=state.custom.filter(x=>x.id!==id);state.stars=state.stars.filter(x=>x!==id);state.mastered=state.mastered.filter(x=>x!==id);}persist();render();closeDialog();toast('记录已删除。');}
 else if(act==='close-dialog')closeDialog();
 else if(act==='export')exportBackup();
 else if(act==='raw-export')download(storageRaw,'静婵语文-原始记录.json');
 else if(act==='confirm-import'&&pendingImport){stopVoice();state=pendingImport;storageBlocked=false;externalConflict=false;storageRaw=null;$('#persistent-error').hidden=true;persist();render();closeDialog();toast('学习备份已导入。');}
 else if(act==='mistakes-prev'||act==='mistakes-next'){mistakePage+=act==='mistakes-prev'?-1:1;render();$('#page-title').focus();}
 else if(act==='retry-load')boot();
});
document.addEventListener('change',e=>{
 if(!state)return;const el=e.target;
 if(el.id==='book'){stopVoice();state.book=el.value;collectionUnit='all';mistakePage=0;persist();render();}
 else if(el.id==='unit'){state.units[state.book]=el.value==='all'?'all':Number(el.value);const valid=book().lessons.filter(l=>el.value==='all'||l.unit===Number(el.value));if(!valid.some(l=>l.id===lesson().id))state.selected[state.book]=valid[0]?.id||book().lessons[0].id;persist();render();}
 else if(el.id==='lesson'){state.selected[state.book]=el.value;persist();render();}
 else if(el.id==='mode'||el.id==='order'){state.settings[el.id]=el.value;persist();}
 else if(el.id==='rate'){stopVoice();state.settings.rate=Number(el.value);persist();}
 else if(el.id==='collection-unit'){collectionUnit=el.value;render();}
 else if(el.id==='import-file')importFile(el.files[0]);
});
function onInput(e){if(!state)return;const el=e.target;if(e.isComposing&&(el.id==='collection-search'||el.id==='mistake-search'))return;if(el.id==='answer'){state.practice.answer=el.value;persist();}
 else if(el.id==='collection-search'||el.id==='mistake-search'){searches[el.id==='collection-search'?'collection':'mistakes']=el.value;mistakePage=0;render();}
 else if(el.closest('#entry-form')){if(el.tagName==='TEXTAREA'){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,400)+'px';}el.removeAttribute('aria-invalid');const form=el.closest('form');state.drafts[form.dataset.kind]={...Object.fromEntries(new FormData(form)),book:state.book,id:form.dataset.id||''};persist();}
}
document.addEventListener('input',onInput);document.addEventListener('compositionstart',()=>{composing=true;});document.addEventListener('compositionend',e=>{composing=false;onInput(e);});
function route(){if(!state)return;const next=location.hash.slice(1);view=['dictation','collection','mistakes','settings'].includes(next)?next:'dictation';stopVoice();if(dialog.open)closeDialog();render(true);}
window.addEventListener('hashchange',route);
document.addEventListener('pointerdown',()=>{pointerDown=true;});window.addEventListener('pointerup',()=>{pointerDown=false;});window.addEventListener('pointercancel',()=>{pointerDown=false;});
window.addEventListener('storage',e=>{if(e.key!==KEY||!state)return;externalConflict=true;storageBanner('另一窗口更新了学习记录。为避免覆盖，请先导出当前进度，再重新打开应用。');});
window.addEventListener('pagehide',()=>{if(state){const draft=$('#answer');if(draft&&state.practice)state.practice.answer=draft.value;const form=$('#entry-form');if(dialog.open&&form)state.drafts[form.dataset.kind]={...Object.fromEntries(new FormData(form)),book:state.book,id:form.dataset.id||''};persist();}stopVoice();});
async function boot(){
 try{main.innerHTML='<div class="loading"><span class="spinner"></span><p>正在打开语文书房…</p></div>';const res=await fetch('./data.json');if(!res.ok)throw new Error();catalog=await res.json();let result;try{result=load(localStorage,catalog);}catch{result={ok:false,state:createState(),raw:null};}state=result.state;storageRaw=result.raw;storageBlocked=!result.ok;if(storageBlocked)storageBanner(storageRaw?'本机记录无法读取，原始记录未被覆盖。请先下载原始记录，再导入有效备份。':'浏览器暂不允许保存记录。可以继续本次学习，并导出备份。');route();try{const saved=JSON.parse(sessionStorage.getItem('jingchan-restore-focus')||'null');sessionStorage.removeItem('jingchan-restore-focus');const target=saved?.id&&document.getElementById(saved.id);if(target){target.focus({preventScroll:true});if(typeof saved.start==='number'&&target.setSelectionRange)target.setSelectionRange(saved.start,saved.end);}}catch{}
 if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{watchUpdates(reg,{ready:()=>!composing&&!pointerDown&&!dialog.open&&!window.speechSynthesis?.speaking,saveBeforeReload:()=>{if(!persist())return false;try{const active=document.activeElement;sessionStorage.setItem('jingchan-restore-focus',JSON.stringify({id:active?.id,start:active?.selectionStart,end:active?.selectionEnd}));return true;}catch{return false;}}});return navigator.serviceWorker.ready;}).then(()=>{const note=$('#offline-status');if(note)note.textContent='学习内容已缓存，可离线打开。离线语音取决于系统中文语音。';}).catch(()=>{const note=$('#offline-status');if(note)note.textContent='离线缓存暂未完成，请保持联网使用；学习记录仍保存在本机。';});
 }catch{main.innerHTML=empty('书房暂时没有打开','教材资料加载失败，请检查网络后再试；已有学习记录不会被删除。',button('重新加载','retry-load'));}
}
boot();
