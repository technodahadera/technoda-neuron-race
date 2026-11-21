import {questions} from './questions.js';
import {assets} from './assets.js';

const lifetime = 4 * 60 * 60 * 1000;
const total = questions.length;
const github = 'https://technodahadera.github.io';
const json = (payload, status = 200) => Response.json(payload, {status, headers:{'Cache-Control':'no-store'}});
const fail = (message, status = 400) => json({error:message}, status);
const baseHeaders = {'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const randomCode = () => String(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000);
const validCode = c => typeof c === 'string' && /^\d{6}$/.test(c);
const validToken = t => typeof t === 'string' && /^[0-9a-f-]{36}$/.test(t);
const deadline = () => Date.now();

function current(player) {
  const solved = new Set(JSON.parse(player.solved));
  if(solved.size >= total) return null;
  let cursor = player.turn;
  while(solved.has(cursor % total)) cursor++;
  const [topic, text, answers, explanation] = questions[cursor % total];
  const offset = (parseInt(player.token.slice(0,8),16) + 3*cursor) % answers.length;
  const order = answers.map((_,i)=>(i+offset)%answers.length);
  return {cursor, topic, text, choices:order.map(i=>answers[i]), answer:order.indexOf(0), explanation, solved};
}
function studentState(room, player) {
  const q = room.phase === 'race' ? current(player) : null;
  return {phase:room.phase, name:player.name, correct:player.correct, total,
    question:q && {cursor:q.cursor,topic:q.topic,text:q.text,choices:q.choices}};
}
async function activeRoom(db, code) {
  if(!validCode(code)) return null;
  return db.prepare('SELECT * FROM rooms WHERE code=? AND expires>?').bind(code,deadline()).first();
}
async function roomPlayer(db, code, token) {
  if(!validToken(token)) return null;
  return db.prepare('SELECT * FROM players WHERE code=? AND token=?').bind(code,token).first();
}
async function createRoom(db) {
  const now = deadline();
  await db.batch([
    db.prepare('DELETE FROM players WHERE code IN (SELECT code FROM rooms WHERE expires<=?)').bind(now),
    db.prepare('DELETE FROM rooms WHERE expires<=?').bind(now)
  ]);
  for(let attempt=0; attempt<5; attempt++){
    const code = randomCode();
    const secret = crypto.randomUUID();
    const res = await db.prepare('INSERT OR IGNORE INTO rooms(code,secret,expires) VALUES (?,?,?)').bind(code,secret,now+lifetime).run();
    if(res.meta.changes) return json({code,secret,total},201);
  }
  return fail('לא הצלחנו לפתוח חדר. נסו שוב.',503);
}
async function join(db, room, body) {
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/gu,' ') : '';
  if(!/^[\p{L}\p{N}][\p{L}\p{M}\p{N} _׳״.'-]{0,17}$/u.test(name)) return fail('בחרו כינוי בן 1–18 תווים.');
  if(room.phase !== 'lobby') return fail('ההצטרפות לחדר הזה הסתיימה.',409);
  const token = crypto.randomUUID();
  const row = await db.prepare(
    `INSERT OR IGNORE INTO players(token,code,name)
     SELECT ?,code,? FROM rooms WHERE code=? AND phase='lobby' AND expires > ?
     AND (SELECT COUNT(*) FROM players WHERE code=rooms.code)<60
     RETURNING *`
  ).bind(token,name,room.code,deadline()).first();
  if(!row) return fail('הכינוי כבר בשימוש או שהחדר נסגר להצטרפות.',409);
  return json({token,...studentState(room,row)},201);
}
async function answer(db, room, player, body) {
  if(room.phase !== 'race') return fail('המרוץ אינו פעיל כרגע.',409);
  const q = current(player);
  if(!q || q.cursor !== body.cursor) return fail('השאלה כבר התקדמה. רעננו את המצב.',409);
  if(!Number.isInteger(body.choice) || body.choice<0 || body.choice>=q.choices.length) return fail('בחרו תשובה.');
  const correct = body.choice===q.answer;
  if(correct) q.solved.add(q.cursor % total);
  const done = q.solved.size===total;
  const next = await db.prepare(
    `UPDATE players SET correct=?,turn=?,solved=?,finished=?
     WHERE token=? AND turn=? AND EXISTS (SELECT 1 FROM rooms WHERE code=? AND phase='race' AND expires>?)
     RETURNING *`
  ).bind(q.solved.size,q.cursor+1,JSON.stringify([...q.solved]),done?deadline():null,player.token,player.turn,room.code,deadline()).first();
  if(!next) return fail('המרוץ התעדכן. רעננו את המצב.',409);
  return json({wasCorrect:correct, explanation:q.explanation, ...studentState(room,next)});
}
async function host(db, room, action, key) {
  if(!validToken(key) || room.secret !== key) return fail('מפתח ההפעלה של המורה חסר או שגוי.',403);
  if(action==='start' || action==='finish'){
    const phase = action==='start'?'race':'finished';
    if(action==='start'){
      const r=await db.prepare(`UPDATE rooms SET phase='race' WHERE code=? AND phase='lobby'
       AND EXISTS (SELECT 1 FROM players WHERE code=rooms.code)`).bind(room.code).run();
      if(!r.meta.changes && room.phase!=='race') return fail('צריך לפחות משתתף אחד כדי להתחיל.',409);
    }else{
      await db.prepare("UPDATE rooms SET phase='finished' WHERE code=? AND phase='race'").bind(room.code).run();
    }
    return json({phase});
  }
  const rows = await db.prepare(
    'SELECT name,correct,finished FROM players WHERE code=? ORDER BY correct DESC, finished ASC, name ASC'
  ).bind(room.code).all();
  return json({code:room.code,phase:room.phase,total,players:rows.results});
}
async function api(req, db, url) {
  const action = url.pathname.split('/').at(-1);
  const reads = ['status','board'];
  if(req.method !== (reads.includes(action)?'GET':'POST')) return fail('פעולה לא נתמכת.',405);
  if(!db) return fail('השירות הכיתתי אינו מחובר כרגע.',503);
  let body={};
  if(req.method==='POST'){
    const data=await req.text();
    if(data.length>1024) return fail('הבקשה ארוכה מדי.',413);
    try { body=JSON.parse(data); } catch { return fail('בקשה לא תקינה.'); }
    if(!body || typeof body!=='object' || Array.isArray(body)) return fail('בקשה לא תקינה.');
  }
  if(action==='create') return createRoom(db);
  const code=body.code??url.searchParams.get('code');
  const room=await activeRoom(db,code);
  if(!room) return fail('החדר לא קיים או שפג תוקפו. בדקו את הקוד.',404);
  if(action==='join') return join(db,room,body);
  const key=req.headers.get('Authorization')?.replace(/^Bearer /,'');
  if(['board','start','finish'].includes(action)) return host(db,room,action,key);
  const player=await roomPlayer(db,code,key);
  if(!player) return fail('החיבור לשחקן לא נמצא. הצטרפו שוב.',401);
  if(action==='status') return json(studentState(room,player));
  if(action==='answer') return answer(db,room,player,body);
  return fail('פעולה לא נמצאה.',404);
}
export default {
  async fetch(req,env) {
    const url=new URL(req.url);
    const origin=req.headers.get('Origin');
    const headers=new Headers(baseHeaders);
    const allowed=!origin || origin===url.origin || origin===github;
    if(origin && allowed){
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Headers','authorization, content-type');
      headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');
      headers.set('Vary','Origin');
    }
    if(url.pathname.startsWith('/api/')){
      if(!allowed) return fail('מקור הבקשה אינו מאושר.',403);
      if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
      let response;
      try { response=await api(req,env.DB,url); }
      catch { response=fail('אירעה תקלה בחיבור למשחק. נסו שוב.',503); }
      for(const [k,v] of headers) response.headers.set(k,v);
      return response;
    }
    if(!['GET','HEAD'].includes(req.method)) return fail('פעולה לא נתמכת.',405);
    const asset=assets[url.pathname==='/'?'index.html':url.pathname.slice(1)];
    if(!asset) return new Response('Not found',{status:404,headers});
    headers.set('Content-Type',asset[0]);
    headers.set('Cache-Control','no-cache');
    return new Response(req.method==='HEAD'?null:(asset[0]==='font/ttf'?Uint8Array.from(atob(asset[1]),x=>x.charCodeAt(0)):asset[1]),{headers});
  }
};
