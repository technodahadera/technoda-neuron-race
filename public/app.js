import qrcode from './qrcode.mjs';
import {diagram, distance} from './neuron.js';

const root=document.querySelector('#app');
const params=new URLSearchParams(location.search);
const API=location.hostname==='technodahadera.github.io'?'https://technoda-neuron-race.workspace-022996.chatgpt.site':'';
const palette=['#69e8fb','#ffb884','#bfb0ff','#7cedb9','#ffa5d4','#ffdd79','#a0afff','#c5ed83'];
let teacher=read('teacher');
let learner=read('learner');
let view='';
let timer=null;
let revision=0;
let busy=false;
let pollBusy=false;

function read(key){try{return JSON.parse(localStorage.getItem('neuron-'+key));}catch{return null;}}
function save(key,value){try{if(value)localStorage.setItem('neuron-'+key,JSON.stringify(value));else localStorage.removeItem('neuron-'+key);}catch{}}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const selected=id=>document.getElementById(id);
function setView(name,html){
  view=name; revision++;
  clearInterval(timer);
  timer=null;
  root.innerHTML=html;
  document.body.dataset.view=name;
}
function say(message){selected('notice').textContent=message||'';}
function button(id,label,className='primary'){return `<button type="button" id="${id}" class="${className}">${label}</button>`;}
function listen(id,handler){selected(id)?.addEventListener('click',handler);}
async function request(action,{body,key,code}={}){
  const target=new URL(`${API}/api/${action}`,location.origin);
  if(code)target.searchParams.set('code',code);
  const response=await fetch(target,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(key?{Authorization:'Bearer '+key}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(8000)});
  const result=await response.json().catch(()=>null);
  if(!response.ok || !result) throw new Error(result?.error || 'החיבור למשחק נקטע. נסו שוב.');
  return result;
}
function home(){
  setView('home',`<div class="landing"><section class="intro"><p class="topic">מערכים 9 ו־10</p><h1>מרוץ<br>האות העצבי<span>.</span></h1><p class="lede">כל תשובה נכונה מקרבת את האות שלכם לתא המטרה. מי יגיע ראשון?</p>
  <div class="actions">${button('new-room','פתיחת חדר למורה')}${button('join-room','הצטרפות כתלמיד','secondary')}</div>
  ${teacher?button('resume-room','חזרה לחדר האחרון','quiet'):''}</section><div class="hero-art">${diagram()}</div></div>`);
  listen('new-room',create);
  listen('join-room',()=>joinScreen());
  listen('resume-room',()=>openBoard());
}
function joinScreen(code=''){
  setView('join',`<section class="phone-card"><p class="topic">מרוץ האות העצבי</p><h1>מצטרפים למרוץ</h1><p class="lede">הקלידו את הקוד שמופיע במסך הכיתה ובחרו כינוי.</p>
  <form id="join-form"><label for="room-code">קוד חדר</label><input id="room-code" name="code" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" dir="ltr" value="${esc(code)}" autocomplete="off">
  <label for="nickname">כינוי למשחק</label><input id="nickname" name="name" required maxlength="18" autocomplete="off">
  <button class="primary" type="submit">הצטרפות</button></form>${button('home','חזרה למסך הראשי','quiet')}</section>`);
  listen('home',()=>{say();home();});
  selected('join-form').addEventListener('submit',async ev=>{
    ev.preventDefault();
    if(busy)return;
    const form=ev.currentTarget;
    const code=form.elements.code.value;
    if(learner?.code===code) {student();return;}
    await action(form.querySelector('button'),async()=>{
      const response=await request('join',{body:{code,name:form.elements.name.value}});
      learner={code,token:response.token};
      save('learner',learner);
      student(response);
    });
  });
}
async function action(control,fn){
  if(busy)return;
  busy=true;
  if(control)control.disabled=true;
  say();
  try{await fn();}catch(e){say(e.message==='Failed to fetch'?'החיבור למשחק נקטע. נסו שוב.':e.message);}
  finally{busy=false;if(control?.isConnected)control.disabled=false;}
}
async function create(){
  await action(selected('new-room'),async()=>{
    teacher=await request('create',{body:{}});
    save('teacher',teacher);
    openBoard();
  });
}
function qr(link){
  const matrix=qrcode(0,'M');
  matrix.addData(link);
  matrix.make();
  return matrix.createSvgTag(4,12,'סרקו להצטרפות','קוד הצטרפות','',true);
}
function studentLink(code){const link=new URL('./',location.href);link.searchParams.set('join',code);return link.href;}
function openBoard(){
  if(!teacher){home();return;}
  const link=studentLink(teacher.code);
  setView('board',`<section class="board-head"><div><p class="topic">מסך הכיתה</p><h1>מרוץ האות העצבי</h1></div><div class="host-actions">${button('full','מסך מלא','quiet')}${button('board-main','ראשי','quiet')}${button('phase-action','התחלת המרוץ')}</div></section>
  <div class="board-layout"><section class="track"><div class="track-head"><span id="phase-label">טוען את החדר</span><span id="board-count"></span></div>${diagram()}<div id="board-end"></div></section>
  <aside class="board-side"><div id="board-join"><strong class="room-code" dir="ltr">${teacher.code}</strong><div class="qr">${qr(link)}</div><button id="copy-link" class="quiet" type="button">העתקת קישור הצטרפות</button></div>
  <h2>דירוג חי</h2><ol id="ranking" class="ranking"></ol></aside></div>`);
  listen('full',()=>{const promise=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();promise?.catch(()=>say('הדפדפן חסם מעבר למסך מלא.'));});
  listen('board-main',()=>{say();home();});
  listen('copy-link',async()=>{try{await navigator.clipboard.writeText(link);say('קישור ההצטרפות הועתק.');}catch{say(link);}});
  let lastPhase='';
  let previous='';
  let ticks=new Map();
  async function refresh(){
    if(view!=='board'||pollBusy)return;
    const rev=revision;
    pollBusy=true;
    try{
      const state=await request('board',{code:teacher.code,key:teacher.secret});
      if(view!=='board'||rev!==revision)return;
      if(selected('notice').dataset.net){delete selected('notice').dataset.net;say();}
      const fingerprint=JSON.stringify(state);
      if(previous===fingerprint)return;
      previous=fingerprint;
      if(lastPhase!==state.phase){
        lastPhase=state.phase;
        const labels={lobby:'ממתינים להצטרפות',race:'המרוץ בעיצומו',finished:'המרוץ הסתיים'};
        selected('phase-label').textContent=labels[state.phase];
        selected('board-join').hidden=state.phase!=='lobby';
        const control=selected('phase-action');
        control.textContent={lobby:'התחלת המרוץ',race:'סיום המרוץ',finished:'פתיחת מרוץ חדש'}[state.phase];
        control.onclick=()=>state.phase==='finished'?create():action(control,async()=>{
          await request(state.phase==='lobby'?'start':'finish',{body:{code:teacher.code},key:teacher.secret});
          await refresh();
        });
      }
      if(state.phase==='lobby'&&!busy)selected('phase-action').disabled=!state.players.length;
      const completed=state.players.filter(p=>p.finished).length;
      selected('board-count').textContent=`${state.players.length} משתתפים · ${completed} הגיעו ליעד`;
      selected('board-end').textContent=state.phase==='finished'&&state.players.length?`מקום ראשון: ${state.players[0].name}`:'';
      showRunners(state.players,ticks,state.total);
      const display=state.phase==='finished'?state.players:state.players.slice(0,12);
      selected('ranking').innerHTML=display.length?display.map((p,i)=>`<li><span class="rank-no">${i+1}</span><span class="dot" style="--player:${ticks.get(p.name).color}"></span><span class="rank-name">${esc(p.name)}</span><strong dir="ltr">${p.correct}/${state.total}</strong></li>`).join(''):'<li class="empty">המצטרפים יופיעו כאן</li>';
    } catch(e){
      if(view==='board'&&rev===revision){
        if(e.message.includes('פג תוקפו')){save('teacher',null);teacher=null;home();say(e.message);}
        else{selected('notice').dataset.net='1';say(e.message);}
      }
    }finally{pollBusy=false;}
  }
  refresh();
  timer=setInterval(refresh,1400);
}
function showRunners(players,ticks,total){
  const group=selected('runners');
  const ns='http://www.w3.org/2000/svg';
  const piles=new Map();
  for(const p of [...players].sort((a,b)=>a.name.localeCompare(b.name))){
    let runner=ticks.get(p.name);
    if(!runner){
      const node=document.createElementNS(ns,'g');
      const index=ticks.size;
      const color=palette[index%palette.length];
      node.classList.add('runner');
      node.innerHTML=`<circle r="10" fill="${color}" opacity=".24"/><circle r="5.5" fill="${color}"/><title></title><text y="-12" text-anchor="middle" fill="#fff" stroke="#141127" stroke-width="3" paint-order="stroke" font-size="14"></text>`;
      runner={node,color,index};
      ticks.set(p.name,runner);
      group.append(node);
    }
    const pile=piles.get(p.correct)||0;
    piles.set(p.correct,pile+1);
    const x=distance(p.correct)+(pile>=9?(pile%3-1)*11:0);
    const dy=(pile===0?0:Math.ceil((pile%9)/2)*((pile%2)?-1:1))*16;
    runner.node.style.transform=`translate(${x}px,${255+dy}px)`;
    runner.node.querySelector('title').textContent=`${p.name} · ${p.correct}/${total}`;
    runner.node.querySelector('text').textContent=pile<2&&players.length<=14?p.name:'';
  }
}
function student(initial){
  if(!learner){joinScreen(params.get('join')||'');return;}
  setView('student','<section class="phone-card" id="student-card"><p>מתחברים לחדר…</p></section>');
  let shown='';
  let feedback=null;
  function show(state){
    const fingerprint=JSON.stringify([state.phase,state.correct,state.question?.cursor,feedback]);
    if(fingerprint===shown)return;
    shown=fingerprint;
    const card=selected('student-card');
    const finished=state.phase==='finished'||state.correct===state.total;
    const header=`<p class="topic">${esc(state.name)} · חדר ${learner.code}</p><div class="progress" aria-label="התקדמות"><span style="width:${100*state.correct/state.total}%"></span></div><p class="count">${state.correct} מתוך ${state.total} צעדים</p>`;
    let content;
    if(finished)content=`<h1>${state.correct===state.total?'הגעתם לתא המטרה!':'המרוץ הסתיים'}</h1><p class="lede">התקדמות סופית: ${state.correct} תשובות נכונות.</p>${button('leave','חזרה למסך הראשי','secondary')}`;
    else if(feedback)content=`<h1 class="feedback ${feedback.correct?'good':''}">${feedback.correct?'תשובה נכונה!':'האות נשאר במקומו'}</h1><p class="lede">${esc(feedback.explanation)}</p>${button('next','לשאלה הבאה')}`;
    else if(state.phase==='lobby')content='<h1>אתם בחדר!</h1><p class="lede">כשהמורה יתחיל את המרוץ, השאלה הראשונה תופיע כאן.</p>';
    else content=`<p class="question-topic">${esc(state.question.topic)}</p><h1 class="question">${esc(state.question.text)}</h1><div class="choices">${state.question.choices.map((v,i)=>`<button class="answer" data-choice="${i}" type="button"><span>${'אבגד'[i]}</span>${esc(v)}</button>`).join('')}</div>`;
    card.innerHTML=header+content;
    listen('leave',()=>{save('learner',null);learner=null;home();});
    listen('next',()=>{feedback=null;show(state);});
    card.querySelectorAll('[data-choice]').forEach(el=>el.onclick=()=>action(el,async()=>{
      const next=await request('answer',{body:{code:learner.code,cursor:state.question.cursor,choice:Number(el.dataset.choice)},key:learner.token});
      feedback={correct:next.wasCorrect,explanation:next.explanation};
      show(next);
    }));
  }
  async function refresh(){
    if(view!=='student'||pollBusy||busy||feedback)return;
    const rev=revision;
    pollBusy=true;
    try{
      const status=await request('status',{code:learner.code,key:learner.token});
      if(view==='student'&&rev===revision)show(status);
    }catch(e){if(view==='student'&&rev===revision)say(e.message);}
    finally{pollBusy=false;}
  }
  if(initial)show(initial);
  else refresh();
  timer=setInterval(refresh,1800);
}
const invite=params.get('join');
if(invite&&learner?.code===invite)student();
else if(invite)joinScreen(invite);
else if(learner)student();
else home();
