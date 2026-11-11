import {todayCO, agendaReply, holidayOn, addDays} from './academic.js';
import './redesign.css';
const storage = {get: async key => {const value=localStorage.getItem(key);return value===null?null:{value}},set: async (key,value) => localStorage.setItem(key,value)};
import { useState, useEffect, useRef } from "react";

const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const PALETTE = ['#74d5c6','#34D399','#FB923C','#F472B6','#60A5FA','#A78BFA','#FBBF24','#2DD4BF','#F87171','#4ADE80'];

function subjectColor(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length;
  return PALETTE[h];
}

const DOW = new Date(todayCO()+'T12:00:00Z').getUTCDay();
const TODAY_IDX = DOW === 0 ? 6 : DOW - 1;
const SK = 'schedai_v4_sched';
const TK = 'schedai_v4_tasks';
const CK = 'schedai_v4_config_days';

const FONT_URL = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap";

const s = {
  wrap: { display:'flex', flexDirection:'column', height:'100vh', width:'100%', margin:'0 auto', background:'#111b29', color:'#edf4fc', fontFamily:"'DM Sans', sans-serif", overflow:'hidden', position:'relative' },
  hdr: { flexShrink:0, padding:'16px 18px 0', borderBottom:'1px solid rgba(255,255,255,.07)', background:'#111b29' },
  logo: { fontFamily:"-apple-system, BlinkMacSystemFont, sans-serif", fontSize:'19px', fontWeight:800, background:'linear-gradient(120deg,#74d5c6 30%,#60A5FA)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'10px', display:'inline-block' },
  nav: { display:'flex', gap:0 },
  nb: (on) => ({ flex:1, padding:'9px 4px', border:'none', background:'transparent', color: on?'#74d5c6':'rgba(255,255,255,.38)', fontFamily:"'DM Sans',sans-serif", fontSize:'12.5px', fontWeight: on?600:400, cursor:'pointer', borderBottom: on?'2px solid #74d5c6':'2px solid transparent', transition:'all .2s', position:'relative' }),
  badge: { position:'absolute', top:'6px', right:'6px', background:'#EF4444', borderRadius:'99px', padding:'1px 5px', fontSize:'9px', color:'white', fontWeight:700 },
  content: { flex:1, overflow:'hidden', display:'flex', flexDirection:'column' },
  scr: { flex:1, overflowY:'auto', scrollbarWidth:'none' },

  // Day tabs
  dtabsWrap: { display:'flex', gap:'7px', padding:'13px 15px 0', overflowX:'auto', scrollbarWidth:'none' },
  dt: (on, today) => ({ flexShrink:0, padding:'6px 13px', borderRadius:'99px', border: on?'1px solid #218a80':today?'1px solid rgba(129,140,248,.45)':'1px solid rgba(255,255,255,.1)', background: on?'#218a80':'transparent', color: on?'white':today?'#74d5c6':'rgba(255,255,255,.42)', fontFamily:"'DM Sans',sans-serif", fontSize:'12px', cursor:'pointer', transition:'all .2s', fontWeight: on?600:400 }),

  // Schedule
  sv: { padding:'14px 15px' },
  dh: { fontFamily:"-apple-system, BlinkMacSystemFont, sans-serif", fontSize:'18px', fontWeight:800, marginBottom:'13px', display:'flex', alignItems:'baseline', gap:'8px' },
  dhSub: { fontSize:'12px', fontWeight:400, color:'rgba(255,255,255,.3)', fontFamily:"'DM Sans',sans-serif" },
  empty: { textAlign:'center', padding:'50px 0', color:'rgba(255,255,255,.22)' },
  emptyIcon: { fontSize:'42px', marginBottom:'8px' },
  emptyTxt: { fontSize:'13px' },
  emptyHint: { fontSize:'11.5px', marginTop:'4px', color:'rgba(255,255,255,.15)' },
  ec: { display:'flex', gap:'10px', marginBottom:'10px' },
  et: { width:'48px', textAlign:'right', flexShrink:0 },
  ets: { fontSize:'13px', fontWeight:600 },
  ete: { fontSize:'11px', color:'rgba(255,255,255,.32)' },
  el: (col) => ({ width:'2px', background:col, borderRadius:'2px', flexShrink:0, position:'relative' }),
  elDot: (col) => ({ position:'absolute', top:'5px', left:'-3px', width:'8px', height:'8px', borderRadius:'50%', background:col }),
  eb: { flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'12px', padding:'10px 12px', cursor:'pointer' },
  es: (col) => ({ fontSize:'14.5px', fontWeight:600, marginBottom:'3px', color:col }),
  em: { fontSize:'11.5px', color:'rgba(255,255,255,.36)' },
  xbtn: { background:'none', border:'none', color:'rgba(255,255,255,.2)', cursor:'pointer', fontSize:'17px', padding:'0 3px', lineHeight:1 },
  clrBtn: { width:'100%', padding:'9px', background:'rgba(239,68,68,.07)', border:'1px dashed rgba(239,68,68,.22)', borderRadius:'9px', color:'rgba(239,68,68,.55)', fontSize:'12px', cursor:'pointer', marginTop:'10px', fontFamily:"'DM Sans',sans-serif" },

  // Tasks
  tv: { padding:'14px 15px' },
  th: { fontFamily:"-apple-system, BlinkMacSystemFont, sans-serif", fontSize:'18px', fontWeight:800, marginBottom:'13px' },
  tc: (cls) => {
    const base = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'13px', padding:'12px 14px', marginBottom:'8px' };
    if (cls==='urgent'||cls==='overdue') return {...base, borderColor:'rgba(239,68,68,.28)', background:'rgba(239,68,68,.05)'};
    if (cls==='soon') return {...base, borderColor:'rgba(251,191,36,.22)', background:'rgba(251,191,36,.04)'};
    if (cls==='done') return {...base, opacity:.37};
    return {...base, borderColor:'rgba(52,211,153,.14)'};
  },
  thr: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'6px' },
  tt: (done) => ({ fontSize:'14px', fontWeight:600, flex:1, marginRight:'8px', textDecoration:done?'line-through':'none' }),
  tbg: (cls) => {
    const map = {
      urgent:{bg:'rgba(239,68,68,.18)',color:'#FCA5A5'},
      overdue:{bg:'rgba(239,68,68,.25)',color:'#FCA5A5'},
      soon:{bg:'rgba(251,191,36,.18)',color:'#FDE68A'},
      ok:{bg:'rgba(52,211,153,.15)',color:'#6EE7B7'},
      done:{bg:'rgba(255,255,255,.1)',color:'rgba(255,255,255,.45)'}
    };
    const c = map[cls]||map.ok;
    return { padding:'3px 8px', borderRadius:'99px', fontSize:'11px', fontWeight:600, whiteSpace:'nowrap', background:c.bg, color:c.color };
  },
  tmeta: { display:'flex', gap:'10px', fontSize:'12px', color:'rgba(255,255,255,.38)', flexWrap:'wrap' },
  tact: { display:'flex', gap:'6px', marginTop:'9px', flexWrap:'wrap' },
  wabtn: (urgent) => ({ display:'flex', alignItems:'center', gap:'5px', padding:'6px 11px', background: urgent?'#22C55E':'rgba(37,211,102,.65)', border:'none', borderRadius:'8px', color:'white', fontSize:'12px', fontWeight:600, cursor:'pointer', textDecoration:'none', transition:'opacity .2s' }),
  cbtn: { padding:'6px 10px', background:'rgba(255,255,255,.07)', border:'none', borderRadius:'8px', color:'rgba(255,255,255,.52)', fontSize:'12px', cursor:'pointer' },
  dbtn: { padding:'6px 8px', background:'rgba(239,68,68,.1)', border:'none', borderRadius:'8px', color:'#FCA5A5', fontSize:'12px', cursor:'pointer' },

  // Chat
  cv: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 },
  mtgl: { display:'flex', margin:'10px 14px 0', background:'rgba(255,255,255,.05)', borderRadius:'9px', padding:'3px', flexShrink:0 },
  mb: (on) => ({ flex:1, padding:'7px', border:'none', background: on?'#218a80':'transparent', color: on?'white':'rgba(255,255,255,.42)', fontSize:'12.5px', cursor:'pointer', borderRadius:'7px', transition:'all .2s', fontFamily:"'DM Sans',sans-serif", fontWeight: on?500:400 }),
  cms: { flex:1, overflowY:'auto', padding:'10px 14px', scrollbarWidth:'none', minHeight:0 },
  msgWrap: { marginBottom:'10px' },
  aiB: { background:'rgba(79,70,229,.13)', border:'1px solid rgba(79,70,229,.22)', borderRadius:'13px 13px 13px 4px', padding:'10px 12px', fontSize:'13.5px', lineHeight:1.55, whiteSpace:'pre-wrap', maxWidth:'88%', display:'inline-block' },
  usrW: { display:'flex', justifyContent:'flex-end' },
  usrB: { background:'#218a80', borderRadius:'13px 13px 4px 13px', padding:'9px 12px', fontSize:'13.5px', maxWidth:'82%', lineHeight:1.42, display:'inline-block' },
  typing: { display:'flex', gap:'4px', alignItems:'center', padding:'10px 12px', background:'rgba(79,70,229,.1)', borderRadius:'13px 13px 13px 4px', width:'54px' },
  dot: (n) => ({ width:'6px', height:'6px', borderRadius:'50%', background:'#74d5c6', animation:`bounce 1.2s ${n*0.2}s infinite` }),
  sug: { display:'flex', gap:'7px', padding:'7px 13px', overflowX:'auto', scrollbarWidth:'none', flexShrink:0 },
  sg: { flexShrink:0, padding:'6px 11px', border:'1px solid rgba(79,70,229,.33)', borderRadius:'99px', color:'#74d5c6', fontSize:'12px', cursor:'pointer', background:'rgba(79,70,229,.08)', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif" },
  cia: { flexShrink:0, padding:'9px 13px 13px', borderTop:'1px solid rgba(255,255,255,.06)', background:'#111b29' },
  ciar: { display:'flex', gap:'7px', alignItems:'flex-end' },
  cita: { flex:1, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'11px', padding:'9px 12px', color:'white', fontFamily:"'DM Sans',sans-serif", fontSize:'14px', resize:'none', outline:'none', minHeight:'40px', maxHeight:'90px' },
  sndbtn: (dis) => ({ width:'40px', height:'40px', borderRadius:'10px', background: dis?'rgba(79,70,229,.4)':'#218a80', border:'none', color:'white', fontSize:'20px', cursor: dis?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background .2s' }),

  modalBackdrop: { position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(11,11,24,.85)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'20px' },
  modalBox: { background:'#15152A', border:'1px solid rgba(255,255,255,.1)', borderRadius:'16px', padding:'20px', width:'100%', maxWidth:'360px', color:'white', display:'flex', flexDirection:'column', gap:'12px', boxSizing:'border-box' },
  modalTitle: { fontSize:'18px', fontWeight:800, fontFamily:"-apple-system, BlinkMacSystemFont, sans-serif", marginBottom:'4px' },
  input: { background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'10px 12px', color:'white', fontSize:'14px', fontFamily:"'DM Sans',sans-serif", width:'100%', boxSizing:'border-box', outline:'none' },
  select: { background:'#1E1E36', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'10px 12px', color:'white', fontSize:'14px', fontFamily:"'DM Sans',sans-serif", width:'100%', boxSizing:'border-box', outline:'none' },
  btnRow: { display:'flex', gap:'10px', marginTop:'8px' },
  btnPri: { flex:1, padding:'10px', background:'#218a80', borderRadius:'8px', border:'none', color:'white', fontWeight:600, cursor:'pointer' },
  btnSec: { flex:1, padding:'10px', background:'transparent', border:'1px solid rgba(255,255,255,.2)', borderRadius:'8px', color:'white', fontWeight:600, cursor:'pointer' },
  addBtn: { background:'rgba(79,70,229,.15)', border:'1px dashed rgba(79,70,229,.4)', borderRadius:'8px', padding:'6px 12px', color:'#74d5c6', fontSize:'13px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 },
  toggleBtn: { display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'12px', padding:'12px 16px', cursor:'pointer', width:'100%', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", fontSize:'14px', color:'white', transition:'all .2s' },
  toggleTrack: (on) => ({ width:'42px', height:'24px', borderRadius:'12px', background: on ? '#218a80' : 'rgba(255,255,255,.2)', position:'relative', transition:'background .3s' }),
  toggleNub: (on) => ({ width:'18px', height:'18px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left: on ? '21px' : '3px', transition:'left .3s', boxShadow:'0 1px 3px rgba(0,0,0,.3)' }),
};

export default function App() {
  const [pendingImport, setPendingImport] = useState(null);
  const [view, setView] = useState('home');
  const [homeMonth, setHomeMonth] = useState(new Date());
  const [homeSelDate, setHomeSelDate] = useState(todayCO());
  const [day, setDay] = useState(TODAY_IDX);
  const [sched, setSched] = useState([]);
  const [deletedSched, setDeletedSched] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [msgs, setMsgs] = useState([{
    r:'ai',
    t:'¡Hola! 👋 Soy tu asistente de horarios.\n\nTengo dos modos:\n\n📅 Horario — Dime tus clases y te armo el horario:\n"Matemáticas lunes y miércoles de 8 a 10am, Física jueves 2-4pm"\n\n📝 Tareas — Dime tus pendientes y gestiono recordatorios:\n"Entregar ensayo de historia el viernes, parcial de cálculo el martes"\n\nConsulta tu agenda o importa tus clases. WhatsApp permite compartir recordatorios manualmente. ¿Empezamos?'
  }]);
  const [inp, setInp] = useState('');
  const [mode, setMode] = useState('schedule');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null);

  const [showSchedModal, setShowSchedModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configStep, setConfigStep] = useState('main'); 
  const [classesToDelete, setClassesToDelete] = useState([]);
  const [showWeekends, setShowWeekends] = useState(false);
  const visibleDays = showWeekends ? [0,1,2,3,4,5,6] : [0,1,2,3,4];
  const [mSched, setMSched] = useState({ subject:'', dayIndex: TODAY_IDX, startTime:'08:00', endTime:'10:00', location:'', professor:'' });
  const [editSchedId, setEditSchedId] = useState(null);
  const [isRepeated, setIsRepeated] = useState(false);
  const [extraDays, setExtraDays] = useState([]);
  const [expandedSchedId, setExpandedSchedId] = useState(null);
  const [editTaskId, setEditTaskId] = useState(null);
  const [isTaskRepeated, setIsTaskRepeated] = useState(false);
  const [extraTaskDays, setExtraTaskDays] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [mTask, setMTask] = useState({ title:'', subject:'', dueDate: todayCO(), dueTime: '23:59', remindFreq: 'auto' });
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [calTaskId, setCalTaskId] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date());
  const [calTooltipId, setCalTooltipId] = useState(null);
  
  const AI_HINTS = [
    "Consulta tus clases y entregas",
    "Agrega automáticamente tu horario...",
    "Anota tu próxima tarea aquí...",
    "¿Qué clases tengo el lunes?",
    "Planifica tu semana en segundos..."
  ];
  const [aiHintIdx, setAiHintIdx] = useState(0);

  useEffect(() => {
    const hintInterval = setInterval(() => {
      setAiHintIdx(prev => (prev + 1) % AI_HINTS.length);
    }, 4000);
    return () => clearInterval(hintInterval);
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = FONT_URL;
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = `@keyframes fadeText{0%{opacity:0;transform:translateY(2px)}100%{opacity:1;transform:translateY(0)}} @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}} @keyframes floatUp{0%{opacity:0;transform:translateY(10px) scale(0.98)}100%{opacity:1;transform:translateY(0) scale(1)}} @keyframes pop{0%{opacity:0;transform:translateX(-50%) translateY(5px) scale(0.8)}100%{opacity:1;transform:translateX(-50%) translateY(-5px) scale(1)}} *::-webkit-scrollbar{display:none;} .cita-el:focus{border-color:rgba(79,70,229,.55)!important;}`;
    document.head.appendChild(style);
    load();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs]);

  async function load() {
    try { const r = await storage.get(SK); if(r) setSched(JSON.parse(r.value)); } catch(e){}
    try { const r = await storage.get('sched_del'); if(r) setDeletedSched(JSON.parse(r.value)); } catch(e){}
    try { const r = await storage.get(TK); if(r) setTasks(JSON.parse(r.value)); } catch(e){}
    try { 
      const r = await storage.get(CK); 
      if(r) {
        const val = JSON.parse(r.value);
        if(Array.isArray(val)) setShowWeekends(val.includes(5));
        else setShowWeekends(!!val);
      }
    } catch(e){}
  }

  async function putSched(arr) { setSched(arr); try { await storage.set(SK, JSON.stringify(arr)); } catch(e){} }
  async function putDeletedSched(arr) { setDeletedSched(arr); try { await storage.set('sched_del', JSON.stringify(arr)); } catch(e){} }
  async function putTasks(arr) { setTasks(arr); try { await storage.set(TK, JSON.stringify(arr)); } catch(e){} }

  function daysLeft(d) {
    const t = new Date(); t.setHours(0,0,0,0);
    const x = new Date(d+'T12:00:00'); x.setHours(0,0,0,0);
    return Math.ceil((x-t)/86400000);
  }

  function getReminderOptions(d) {
    const dl = daysLeft(d);
    if (dl < 1) return [
      { val: '1h', label: 'Cada 1 hora' },
      { val: '2h', label: 'Cada 2 horas' },
      { val: '4h', label: 'Cada 4 horas' }
    ];
    if (dl <= 3) return [
      { val: '12h', label: 'Cada 12 horas' },
      { val: '1d', label: 'Cada 1 día' }
    ];
    return [
      { val: '2d', label: 'Cada 2 días' },
      { val: '3d', label: 'Cada 3 días' },
      { val: '7d', label: 'Cada semana' }
    ];
  }

  function urgency(task) {
    if (task.completed) return 'done';
    const dl = daysLeft(task.dueDate);
    if (dl < 0) return 'overdue';
    if (dl <= 3) return 'urgent';
    if (dl <= 7) return 'soon';
    return 'ok';
  }

  function badgeText(task) {
    const dl = daysLeft(task.dueDate);
    if (task.completed) return '✓ Completada';
    if (dl < 0) return `Vencida hace ${Math.abs(dl)}d`;
    if (dl === 0) return '⚠️ ¡Hoy!';
    if (dl === 1) return '⚠️ Mañana';
    if (dl <= 3) return `⚠️ ${dl} días`;
    if (dl <= 7) return `⏰ ${dl} días`;
    return `✅ ${dl} días`;
  }

  function waLink(task) {
    const dl = daysLeft(task.dueDate);
    const df = new Date(task.dueDate+'T12:00:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'});
    const msg = `🔔 *Recordatorio de tarea*\n\n📚 Materia: *${task.subject}*\n📝 ${task.title}\n📅 Entrega: *${df}*\n⏳ Quedan: *${dl} día${dl!==1?'s':''}*\n\n¡Recuerda completarla a tiempo! 💪`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  async function send() {
    if (!inp.trim() || busy) return;
    const txt = inp.trim();
    const localReply = agendaReply(txt, sched, tasks);
    if(localReply){setMsgs(p=>[...p,{r:'user',t:txt},{r:'ai',t:localReply}]);setInp('');return;}
    setInp('');
    if (taRef.current) taRef.current.style.height = '36px';
    setMsgs(p=>[...p,{r:'user',t:txt}]);
    setBusy(true);
    const today = todayCO();


    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ message: txt, today: todayCO() })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const raw = data.text || '{}';
      const cleanRaw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanRaw);
      const ts = Date.now();
      let confirmParts = [];

      if(parsed.entries?.length || parsed.tasks?.length) setPendingImport(parsed);
      setMsgs(p=>[...p,{r:'ai',t:parsed.reply || 'Revisa los datos extraídos antes de guardarlos.'}]);
    } catch(e) {
      console.error('API error:', e);
      setMsgs(p=>[...p,{r:'ai',t:e.message || 'No se pudo procesar la solicitud.'}]);
    }
    setBusy(false);
  }

  // ── Enviar con archivo adjunto ──
  async function sendWithFile() {
    if ((!inp.trim() && !attachedFile) || busy) return;
    const txt = inp.trim() || 'Analiza este archivo y extrae la información relevante';
    const file = attachedFile;
    setInp('');
    setAttachedFile(null);
    if (taRef.current) taRef.current.style.height = '40px';
    setMsgs(p=>[...p,{r:'user',t: file ? `📎 ${file.name}\n${txt}` : txt}]);
    setBusy(true);
    const today = todayCO();


    try {
      const formData = new FormData();
      formData.append('today', todayCO());
      formData.append('message', txt);
      if (file) formData.append('file', file);

      const endpoint = file ? '/api/chat-file' : '/api/chat';
      const fetchOpts = file
        ? { method:'POST', body: formData }
        : { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message: txt, today: todayCO() }) };

      const res = await fetch(endpoint, fetchOpts);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const raw = data.text || '{}';
      const cleanRaw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanRaw);
      const ts = Date.now();
      let confirmParts = [];

      if(parsed.entries?.length || parsed.tasks?.length) setPendingImport(parsed);
      setMsgs(p=>[...p,{r:'ai',t:parsed.reply || 'Revisa los datos extraídos antes de guardarlos.'}]);
    } catch(e) {
      console.error('File upload error:', e);
      setMsgs(p=>[...p,{r:'ai',t:e.message || 'No se pudo leer el documento.'}]);
    }
    setBusy(false);
  }

  const daySched = sched.filter(e=>e.dayIndex===day).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  const tasksSorted = [...tasks].sort((a,b)=>{
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  const urgentCount = tasks.filter(t=>!t.completed && daysLeft(t.dueDate)<=3 && daysLeft(t.dueDate)>=0).length;

  const allSuggest = ['Matemáticas lunes y miércoles 8-10am','Entregar ensayo el viernes','Física martes y jueves 2-4pm','Parcial de cálculo el martes','Inglés viernes 6-8pm','Taller en 4 días'];

  const handleSaveSched = async () => {
    if(!mSched.subject.trim()) return;
    let next;
    const ts = Date.now();
    if (editSchedId) {
      next = sched.map(x => x.id === editSchedId ? { ...x, ...mSched } : x);
    } else {
      const primary = { ...mSched, id:`m${ts}` };
      const additions = [primary];
      if (isRepeated) {
        extraDays.forEach((ed, i) => {
          additions.push({ ...mSched, dayIndex: ed.dayIndex, startTime: ed.startTime, endTime: ed.endTime, id: `m${ts}_${i}` });
        });
      }
      next = [...sched, ...additions];
    }
    await putSched(next);
    setShowSchedModal(false);
    setEditSchedId(null);
    setIsRepeated(false);
    setExtraDays([]);
    setMSched({ subject:'', dayIndex: TODAY_IDX, startTime:'08:00', endTime:'10:00', location:'', professor:'' });
  };

  const handleSaveTask = async () => {
    if(!mTask.title.trim()) return;
    let next;
    const ts = Date.now();
    
    // Ensure chronological sorting of pending dates
    const pending = [...extraTaskDays].sort((a,b)=>{
      const tA = new Date(`${a.dueDate}T${a.dueTime}`);
      const tB = new Date(`${b.dueDate}T${b.dueTime}`);
      return tA - tB;
    });

    if(editTaskId) {
      next = tasks.map(t => t.id === editTaskId ? { ...t, ...mTask, pendingDates: isTaskRepeated ? pending : [] } : t);
    } else {
      const primary = { ...mTask, id:`t${ts}`, completed:false, pendingDates: isTaskRepeated ? pending : [] };
      next = [...tasks, primary];
    }
    await putTasks(next);
    setShowTaskModal(false);
    setEditTaskId(null);
    setIsTaskRepeated(false);
    setExtraTaskDays([]);
    setMTask({ title:'', subject:'', dueDate: todayCO(), dueTime:'23:59', remindFreq:'auto' });
  };

  const handleAddExtraTask = () => {
    const lastDate = extraTaskDays.length > 0 ? extraTaskDays[extraTaskDays.length-1].dueDate : mTask.dueDate;
    const d = new Date(lastDate);
    d.setDate(d.getDate() + 1);
    setExtraTaskDays(prev => [...prev, { dueDate: d.toISOString().split('T')[0], dueTime: mTask.dueTime }]);
  };

  const handleUpdateExtraTask = (idx, field, val) => {
    setExtraTaskDays(p => p.map((e,i) => i===idx ? {...e, [field]:val} : e));
  };
  
  const handleRemoveExtraTask = (idx) => {
    setExtraTaskDays(p => p.filter((e,i) => i!==idx));
  };

  const handleToggleExtraDay = (dIdx) => {
    if(dIdx === mSched.dayIndex) return;
    setExtraDays(prev => {
      if(prev.find(ed => ed.dayIndex === dIdx)) return prev.filter(ed => ed.dayIndex !== dIdx);
      return [...prev, { dayIndex: dIdx, startTime: mSched.startTime, endTime: mSched.endTime }].sort((a,b)=>a.dayIndex-b.dayIndex);
    });
  };

  const handleExtraTimeChange = (idx, field, val) => {
    setExtraDays(prev => prev.map((ed, i) => i === idx ? { ...ed, [field]: val } : ed));
  };

  const handleToggleWeekends = () => {
    const next = !showWeekends;
    setShowWeekends(next);
    if (!next && day > 4) setDay(0);
    storage.set(CK, JSON.stringify(next)).catch(()=>{});
  };

  return (
    <div className="app-shell" style={s.wrap}>
      {pendingImport && <div className="review" role="dialog" aria-modal="true" aria-label="Revisar importación"><article><h2>Revisa tu nuevo plan</h2><p>Comprueba días y horas antes de guardar. Puedes editar cada elemento después.</p><pre>{(pendingImport.entries||[]).map(e=>`${DAYS[e.dayIndex]} · ${e.startTime}–${e.endTime} · ${e.subject}`).concat((pendingImport.tasks||[]).map(t=>`${t.dueDate} · ${t.title}`)).join('\n')}</pre><button onClick={()=>setPendingImport(null)}>Cancelar</button><button onClick={()=>{
       const stamp=Date.now();const es=(pendingImport.entries||[]).filter(e=>!sched.some(x=>x.dayIndex===e.dayIndex&&x.startTime===e.startTime&&x.endTime===e.endTime&&x.subject.toLowerCase()===e.subject.toLowerCase()));
       const ts=(pendingImport.tasks||[]).filter(t=>!tasks.some(x=>x.title.toLowerCase()===t.title.toLowerCase()&&x.dueDate===t.dueDate));
       putSched([...sched,...es.map((e,i)=>({...e,id:`ai-e-${stamp}-${i}`}))]);putTasks([...tasks,...ts.map((t,i)=>({...t,id:`ai-t-${stamp}-${i}`,completed:false}))]);setPendingImport(null);
      }}>Guardar en mi agenda</button></article></div>}
      {view !== 'chatFullscreen' && (
        <div style={s.hdr}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <div style={{...s.logo, marginBottom:0}}>ScheduleAI</div>
            <button style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'16px'}} onClick={()=>setShowConfigModal(true)} title="Configuración">⚙️</button>
          </div>
          <div style={s.nav}>
            {[['home','🏠 Inicio'],['schedule','📅 Horario'],['tasks','✅ Tareas']].map(([v,label])=>(
              <button key={v} style={s.nb(view===v)} onClick={()=>setView(v)}>
                {label}
                {v==='tasks' && urgentCount>0 && <span style={s.badge}>{urgentCount}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={s.content}>
        {/* ── Home View ── */}
        {view==='home' && (
          <div style={s.scr}>
            <div className='welcome'><small>TU ESPACIO DE ESTUDIO</small><h1>Un día con propósito.</h1><p>Clases, entregas y tiempo para avanzar. Todo en un lugar.</p></div>
            <div style={{padding:'20px 15px'}}>
              <button style={{width:'100%', marginBottom:'25px', padding:'16px 20px', background:'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)', border:'1px solid rgba(139, 92, 246, 0.3)', borderRadius:'20px', display:'flex', alignItems:'center', gap:'14px', cursor:'pointer', transition:'all 0.3s ease', boxShadow:'0 8px 32px rgba(79,70,229,0.15), inset 0 1px 0 rgba(255,255,255,0.1)', backdropFilter:'blur(10px)'}} onClick={() => setView('chatFullscreen')} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{fontSize:'22px', background:'linear-gradient(135deg, #74d5c6, #C084FC)', WebkitBackgroundClip:'text', color:'transparent', filter:'drop-shadow(0 2px 4px rgba(139,92,246,0.3))'}}>✨</div>
                <div style={{display:'flex', flexDirection:'column', flex:1, textAlign:'left'}}>
                  <span style={{fontSize:'14px', fontWeight:700, background:'linear-gradient(90deg, #E0E7FF, #C084FC)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'0.3px'}}>Asistente Schedule AI</span>
                  <span key={aiHintIdx} style={{fontSize:'12px', color:'rgba(255,255,255,.5)', fontWeight:500, marginTop:'3px', animation:'fadeText 0.5s ease backwards'}}>{AI_HINTS[aiHintIdx]}</span>
                </div>
                <div style={{width:'32px', height:'32px', borderRadius:'10px', background:'rgba(139,92,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#C084FC', fontSize:'16px', fontWeight:'bold'}}>
                  ›
                </div>
              </button>

              <div style={{...s.th, marginBottom:'20px'}}>Resumen General</div>
              
              {/* Calendario Global */}
              <div style={{background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'16px', padding:'18px 20px', color:'white', display:'flex', flexDirection:'column', gap:'16px', marginBottom:'20px'}}>
                <div style={{textAlign:'center', fontWeight:700, fontSize:'16px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <button style={{background:'rgba(255,255,255,.05)', borderRadius:'8px', border:'none', color:'#74d5c6', cursor:'pointer', fontSize:'16px', width:'30px', height:'30px'}} onClick={()=>{
                    const nm = new Date(homeMonth); nm.setMonth(nm.getMonth()-1); setHomeMonth(nm);
                  }}>‹</button>
                  {homeMonth.toLocaleDateString('es-CO',{month:'long', year:'numeric'}).replace(/^\w/, c=>c.toUpperCase())}
                  <button style={{background:'rgba(255,255,255,.05)', borderRadius:'8px', border:'none', color:'#74d5c6', cursor:'pointer', fontSize:'16px', width:'30px', height:'30px'}} onClick={()=>{
                    const nm = new Date(homeMonth); nm.setMonth(nm.getMonth()+1); setHomeMonth(nm);
                  }}>›</button>
                </div>
                
                <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'8px', textAlign:'center', fontSize:'12px', color:'rgba(255,255,255,.4)', fontWeight:600}}>
                  {['D','L','M','M','J','V','S'].map((d,i)=><div key={i}>{d}</div>)}
                </div>
                
                <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'8px'}}>
                  {(() => {
                     const y = homeMonth.getFullYear();
                     const m = homeMonth.getMonth();
                     const firstDay = new Date(y, m, 1).getDay();
                     const daysInMonth = new Date(y, m+1, 0).getDate();
                     
                     // Fechas de tareas
                     const allTaskDates = [];
                     tasks.forEach(t => {
                       if(!t.completed) {
                         allTaskDates.push(t.dueDate);
                         if(t.pendingDates) t.pendingDates.forEach(pd => allTaskDates.push(pd.dueDate));
                       }
                     });
                     
                     const blanks = Array.from({length: firstDay}).map((_,i)=><div key={`hb${i}`}/>);
                     const days = Array.from({length: daysInMonth}).map((_, i) => {
                       const day = i+1;
                       const dStr = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                       
                       const hasTask = allTaskDates.includes(dStr);
                       const hasClass = sched.some(e => {
                         const jsDay = new Date(`${dStr}T12:00:00`).getDay();
                         const internalDayIndex = jsDay === 0 ? 6 : jsDay - 1; 
                         return e.dayIndex === internalDayIndex;
                       });
                       
                       const isSelected = homeSelDate === dStr;
                       const isToday = todayCO() === dStr;
                       
                       const bg = isSelected ? '#218a80' : isToday ? 'rgba(255,255,255,.1)' : 'transparent';
                       
                       return (
                         <div key={day} style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                           <button 
                             style={{width:'34px', height:'34px', borderRadius:'50%', background: bg, border:'none', color: isSelected || isToday ? 'white' : 'rgba(255,255,255,.7)', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, transition:'all .2s'}}
                             title={holidayOn(dStr) || dStr} onClick={() => setHomeSelDate(dStr)}
                           >
                             {day}
                           </button>
                           <div style={{display:'flex', gap:'2px', marginTop:'3px', height:'4px'}}>
                             {hasClass && <div style={{width:'4px', height:'4px', borderRadius:'50%', background:'#34D399'}}/>}
                             {holidayOn(dStr) && <div style={{width:5,height:5,borderRadius:'50%',background:'#FBBF24'}}/>}{hasTask && <div style={{width:'4px', height:'4px', borderRadius:'50%', background:'#F87171'}}/>}
                           </div>
                         </div>
                       );
                     });
                     return [...blanks, ...days];
                  })()}
                </div>
                <div style={{display:'flex', justifyContent:'center', gap:'12px', fontSize:'11px', color:'rgba(255,255,255,.4)', marginTop:'4px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'4px'}}><div style={{width:'6px', height:'6px', borderRadius:'50%', background:'#34D399'}}/> Días con clases</div>
                  <div style={{display:'flex', alignItems:'center', gap:'4px'}}><div style={{width:'6px', height:'6px', borderRadius:'50%', background:'#F87171'}}/> Tareas</div>
                </div>
              </div>
              
              {holidayOn(homeSelDate) && <div className='holiday-note'>🇨🇴 {holidayOn(homeSelDate)} · Festivo nacional. Confirma con tu institución si hay clases.</div>}
              {/* Vista Detallada del Día */}
              <div style={{background:'rgba(255,255,255,.02)', borderRadius:'16px', padding:'18px 20px'}}>
                <div style={{fontSize:'16px', fontWeight:700, fontFamily:"-apple-system, BlinkMacSystemFont, sans-serif", marginBottom:'15px', color:'white'}}>
                  Agenda del {new Date(homeSelDate+'T12:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'long'})}
                </div>
                
                {(() => {
                  const selJsDay = new Date(`${homeSelDate}T12:00:00`).getDay();
                  const dIdx = selJsDay === 0 ? 6 : selJsDay - 1;
                  
                  const dClasses = sched.filter(e => e.dayIndex === dIdx).sort((a,b)=>a.startTime.localeCompare(b.startTime));
                  const dTasks = tasks.map(t => {
                    if(!t.completed && t.dueDate === homeSelDate) return {...t, exactTime: t.dueTime};
                    if(!t.completed && t.pendingDates) {
                      const match = t.pendingDates.find(pd => pd.dueDate === homeSelDate);
                      if(match) return {...t, exactTime: match.dueTime};
                    }
                    return null;
                  }).filter(Boolean);
                  
                  if (dClasses.length === 0 && dTasks.length === 0) {
                    return <div style={{fontSize:'13px', color:'rgba(255,255,255,.4)', padding:'10px 0', textAlign:'center'}}>Día libre, no hay clases ni tareas. ✨</div>;
                  }
                  
                  return (
                    <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                      {dTasks.length > 0 && (
                        <div>
                          <div style={{fontSize:'12px', color:'#F87171', fontWeight:700, marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Tareas del día ({dTasks.length})</div>
                          {dTasks.map((t, idx) => (
                            <div key={`dt${idx}`} style={{background:'rgba(248,113,113,.08)', borderLeft:'3px solid #F87171', padding:'10px 12px', borderRadius:'4px 8px 8px 4px', marginBottom:'6px'}}>
                              <div style={{fontSize:'13px', fontWeight:600, color:'white'}}>{t.title}</div>
                              <div style={{fontSize:'11.5px', color:'rgba(255,255,255,.5)', marginTop:'2px', display:'flex', justifyContent:'space-between'}}>
                                <span>{t.subject}</span>
                                {t.exactTime && <span style={{color:'#FCA5A5'}}>A las {t.exactTime}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {dClasses.length > 0 && (
                        <div style={{marginTop: dTasks.length > 0 ? '10px' : 0}}>
                          <div style={{fontSize:'12px', color:'#34D399', fontWeight:700, marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Clases programadas ({dClasses.length})</div>
                          {dClasses.map(c => (
                            <div key={`dc${c.id}`} style={{display:'flex', gap:'12px', background:'rgba(255,255,255,.04)', padding:'10px 12px', borderRadius:'10px', marginBottom:'6px', alignItems:'center'}}>
                              <div style={{fontSize:'13px', color:'#A7F3D0', fontWeight:700, minWidth:'45px', textAlign:'right'}}>{c.startTime}</div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:'13.5px', fontWeight:600, color:'white'}}>{c.subject}</div>
                                {c.location && <div style={{fontSize:'11px', color:'rgba(255,255,255,.4)', marginTop:'2px'}}>📍 {c.location}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>



          </div>
        )}

        {/* ── Schedule View ── */}
        {view==='schedule' && (
          <div style={s.scr}>
            <div style={s.dtabsWrap}>
              {visibleDays.map(i => {
                const d = DAYS[i];
                return (
                  <button key={i} style={s.dt(day===i, i===TODAY_IDX&&day!==i)} onClick={()=>setDay(i)}>
                    {d.slice(0,3)}{i===TODAY_IDX ? ' ●' : ''}
                  </button>
                );
              })}
            </div>
            <div style={s.sv}>{(()=>{const date=addDays(todayCO(),day-TODAY_IDX);const h=holidayOn(date);return h?<div className='holiday-note'>🇨🇴 {date} · {h}. Confirma si tu institución tiene clase.</div>:null})()}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'13px'}}>
                <div style={{...s.dh, marginBottom:0}}>
                  {DAYS[day]}
                  <span style={s.dhSub}>
                    {day===TODAY_IDX?'(hoy) — ':''}{daySched.length} clase{daySched.length!==1?'s':''}
                  </span>
                </div>
              </div>
              {daySched.length===0 ? (
                <div style={s.empty}>
                  <div style={s.emptyIcon}>📚</div>
                  <div style={s.emptyTxt}>Sin clases este día</div>
                  <div style={s.emptyHint}>Usa el Asistente IA para agregar tu horario</div>
                </div>
              ) : daySched.map(e=>{
                const col = subjectColor(e.subject);
                const pendingTasksCount = tasks.filter(t => !t.completed && t.subject === e.subject).length;
                const isExpanded = expandedSchedId === e.id;

                return (
                  <div key={e.id} style={s.ec}>
                    <div style={s.et}>
                      <div style={s.ets}>{e.startTime}</div>
                      <div style={s.ete}>{e.endTime}</div>
                    </div>
                    <div style={s.el(col)}>
                      <div style={s.elDot(col)}/>
                    </div>
                    <div style={s.eb} onClick={() => setExpandedSchedId(isExpanded ? null : e.id)}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div style={s.es(col)}>{e.subject}</div>
                      </div>

                      {!isExpanded && pendingTasksCount > 0 && (
                        <div style={{fontSize:'11.5px', color:'rgba(251,191,36,.8)', marginTop:'2px'}}>
                          💡 {pendingTasksCount} tarea{pendingTasksCount!==1?'s':''} pendiente{pendingTasksCount!==1?'s':''}
                        </div>
                      )}

                      {isExpanded && (
                        <div style={{borderTop:'1px solid rgba(255,255,255,.05)', paddingTop:'10px', marginTop:'10px'}}>
                          <div style={s.em}>
                            {e.location?`📍 ${e.location}`:''}{e.location&&e.professor?' · ':''}{e.professor?`👤 ${e.professor}`:''}
                            {!e.location&&!e.professor&&'📍 Sin detalles adicionales'}
                          </div>
                          
                          <div style={{fontSize:'12px', color: pendingTasksCount > 0 ? 'rgba(251,191,36,.8)' : 'rgba(52,211,153,.8)', marginTop:'6px', marginBottom:'10px'}}>
                            {pendingTasksCount > 0 ? `💡 Tienes ${pendingTasksCount} tarea${pendingTasksCount!==1?'s':''} pendiente${pendingTasksCount!==1?'s':''}` : '✅ Sin tareas pendientes'}
                          </div>
                          
                          <div style={s.tact}>
                            <button style={{...s.cbtn, background:'rgba(255,255,255,.1)'}} onClick={(ev)=>{
                              ev.stopPropagation();
                              setEditTaskId(null);
                              setIsTaskRepeated(false);
                              setExtraTaskDays([]);
                              setShowCustomSubject(false);
                              setMTask({ title:'', subject:e.subject, dueDate: todayCO(), dueTime:'23:59', remindFreq:'auto' });
                              setShowTaskModal(true);
                            }}>
                              📝 Añadir Tarea
                            </button>
                            <button style={s.cbtn} onClick={(ev)=>{
                              ev.stopPropagation();
                              setEditSchedId(e.id);
                              setIsRepeated(false);
                              setExtraDays([]);
                              setMSched({ subject:e.subject, dayIndex:e.dayIndex, startTime:e.startTime, endTime:e.endTime, location:e.location||'', professor:e.professor||'' });
                              setShowSchedModal(true);
                            }}>
                              ✏️ Editar
                            </button>
                            <button style={s.dbtn} onClick={(ev)=>{ev.stopPropagation(); putSched(sched.filter(x=>x.id!==e.id));}}>
                              🗑
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <button style={{...s.clrBtn, background:'rgba(79,70,229,.15)', border:'1px dashed rgba(79,70,229,.4)', color:'#74d5c6', marginTop:'15px', fontWeight:600}} onClick={()=>{
                setEditSchedId(null);
                setIsRepeated(false);
                setExtraDays([]);
                setMSched({ subject:'', dayIndex: day, startTime:'08:00', endTime:'10:00', location:'', professor:'' });
                setShowSchedModal(true);
              }}>
                + Añadir clase manualmente
              </button>
            </div>
          </div>
        )}

        {/* ── Tasks View ── */}
        {view==='tasks' && (
          <div style={s.scr}>
            <div style={s.tv}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'13px'}}>
                <div style={{...s.th, marginBottom:0}}>Mis Tareas</div>
                <button style={s.addBtn} onClick={()=>{
                  setEditTaskId(null);
                  setIsTaskRepeated(false);
                  setExtraTaskDays([]);
                  setShowCustomSubject(false);
                  setMTask({ title:'', subject:'', dueDate: todayCO(), dueTime: '23:59', remindFreq: 'auto' });
                  setShowTaskModal(true);
                }}>+ Añadir tarea</button>
              </div>
              {tasksSorted.length===0 ? (
                <div style={s.empty}>
                  <div style={s.emptyIcon}>📝</div>
                  <div style={s.emptyTxt}>Sin tareas registradas</div>
                  <div style={s.emptyHint}>Usa el Asistente IA para agregar tareas con fecha de entrega</div>
                </div>
              ) : tasksSorted.map(task=>{
                const urg = urgency(task);
                const dl = daysLeft(task.dueDate);
                const isReminder = !task.completed && dl<=3 && dl>=0;
                const isExpanded = expandedTaskId === task.id;
                return (
                  <div key={task.id} style={{...s.tc(urg), cursor:'pointer'}} onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}>
                    <div style={s.thr}>
                      <div style={s.tt(task.completed)}>{task.title}</div>
                      <span style={s.tbg(urg)}>{badgeText(task)}</span>
                    </div>
                    <div style={s.tmeta}>
                      <span>📚 {task.subject}</span>
                      <span>📅 {new Date(task.dueDate+'T12:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'short',year:'numeric'})}</span>
                      {task.dueTime && <span>⏰ {task.dueTime}</span>}
                    </div>
                    
                    {isExpanded && (
                      <div style={{borderTop:'1px solid rgba(255,255,255,.05)', paddingTop:'10px', marginTop:'10px'}}>
                        {!task.completed && task.pendingDates && task.pendingDates.length > 0 && (
                          <div style={{fontSize:'12px', color:'rgba(255,255,255,.5)', marginBottom:'10px'}}>
                            <strong style={{color:'rgba(255,255,255,.7)'}}>Se repite también el:</strong><br/>
                            {task.pendingDates.slice(0, 2).map((pd, pdi) => (
                              <div key={pdi} style={{marginTop:'4px'}}>• {new Date(pd.dueDate+'T12:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'short'})}{pd.dueTime ? ` a las ${pd.dueTime}`:''}</div>
                            ))}
                            {task.pendingDates.length > 2 && (
                               <button style={{...s.addBtn, padding:'4px 8px', marginTop:'8px'}} onClick={(e)=>{
                                  e.stopPropagation();
                                  setCalTaskId(task.id);
                                  setCalMonth(new Date(task.pendingDates[0].dueDate + 'T12:00:00'));
                                  setCalTooltipId(null);
                               }}>
                                 📅 Ver calendario ({task.pendingDates.length} fechas más)
                               </button>
                            )}
                          </div>
                        )}
                        {!task.completed && (
                          <div style={s.tact}>
                            <a style={s.wabtn(isReminder)} href={waLink(task)} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}>
                              <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor">
                                <path d="M16 3C9.4 3 4 8.4 4 15c0 2.3.7 4.5 1.9 6.3L4 29l7.9-1.8c1.7.9 3.6 1.4 5.6 1.4h.1C24.2 28.5 28.6 22.5 28.6 15S22.6 3 16 3zm0 23.5c-1.8 0-3.5-.5-5-1.4l-.4-.2-4.1.9.9-4-.2-.4C6.8 19.6 6 17.4 6 15c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10.5-10 10.5zm5.5-7.7c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1s-1.2-.5-2.3-1.4c-.8-.7-1.4-1.7-1.5-2-.2-.3 0-.5.1-.6l.4-.5.3-.6v-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4s-1 1-1 2.4 1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.1-1.4-.1-.1-.2-.2-.5-.3z"/>
                              </svg>
                              {isReminder ? '¡Recordatorio!' : 'Enviar WhatsApp'}
                            </a>
                            <button style={s.cbtn} onClick={(e)=>{
                              e.stopPropagation();
                              let nextTasks = tasks.map(t => {
                                if (t.id === task.id) {
                                  if (t.pendingDates && t.pendingDates.length > 0) {
                                    const nextPend = [...t.pendingDates];
                                    const upD = nextPend.shift();
                                    return { ...t, dueDate: upD.dueDate, dueTime: upD.dueTime, remindFreq: upD.remindFreq || t.remindFreq, pendingDates: nextPend };
                                  }
                                  return { ...t, completed: true };
                                }
                                return t;
                              });
                              putTasks(nextTasks);
                            }}>
                              ✓ Listo
                            </button>
                            <button style={s.cbtn} onClick={(e)=>{
                              e.stopPropagation();
                              setEditTaskId(task.id);
                              const pend = task.pendingDates || [];
                              setIsTaskRepeated(pend.length > 0);
                              setExtraTaskDays(pend);
                              setShowCustomSubject(false); // Can be reset or determined based on uniqueSubjects
                              setMTask({ title:task.title, subject:task.subject, dueDate:task.dueDate, dueTime:task.dueTime||'23:59', remindFreq:task.remindFreq||'auto' });
                              setShowTaskModal(true);
                            }}>
                              ✏️ Editar
                            </button>
                            <button style={s.dbtn} onClick={(e)=>{e.stopPropagation(); putTasks(tasks.filter(t=>t.id!==task.id));}}>
                              🗑
                            </button>
                          </div>
                        )}
                        {task.completed && (
                          <div style={s.tact}>
                            <button style={s.dbtn} onClick={(e)=>{e.stopPropagation(); putTasks(tasks.filter(t=>t.id!==task.id));}}>Eliminar</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Chat View ── */}
      </div>

        {/* ── Chat FullScreen View ── */}
        {view === 'chatFullscreen' && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(8px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
            <div style={{display:'flex', flexDirection:'column', width:'100%', maxWidth:'420px', height:'85vh', maxHeight:'700px', background:'#12121F', borderRadius:'20px', border:'1px solid rgba(255,255,255,.1)', boxShadow:'0 25px 80px rgba(0,0,0,.6), 0 0 60px rgba(79,70,229,.12)', overflow:'hidden', animation:'floatUp .3s ease'}}>
            <div style={{padding:'16px 18px 12px', background:'rgba(18, 18, 31, 0.95)', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', flexShrink:0}}>
              <button style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:0}} onClick={()=>setView('home')}>
                <div style={{width:'32px', height:'32px', borderRadius:'10px', background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'16px', transition:'all .2s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}>‹</div>
              </button>
              <div style={{flex:1, textAlign:'center'}}>
                <div style={{fontWeight:800, fontSize:'14px', background:'linear-gradient(90deg, #E0E7FF, #C084FC)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'0.5px'}}>Asistente Schedule AI</div>
                <div style={{fontSize:'10px', color:'#34D399', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', marginTop:'2px', textTransform:'uppercase', letterSpacing:'1px'}}><div style={{width:'5px', height:'5px', background:'#34D399', borderRadius:'50%'}}></div> En Línea</div>
              </div>
              <div style={{width:'32px'}}></div>
            </div>

            <div style={{flex:1, overflowY:'auto', padding:'14px 14px', scrollBehavior:'smooth', scrollbarWidth:'none', minHeight:0}}>
              {msgs.map((m,i)=>(
                <div key={i} style={s.msgWrap}>
                  {m.r==='ai'
                    ? <div style={{...s.aiB, maxWidth:'92%'}}>{m.t}</div>
                    : <div style={s.usrW}><div style={{...s.usrB, maxWidth:'85%'}}>{m.t}</div></div>
                  }
                </div>
              ))}
              {busy && (
                <div style={s.msgWrap}>
                  <div style={s.typing}>
                    <div style={{...s.dot(0),animationName:'bounce'}}/>
                    <div style={{...s.dot(1),animationName:'bounce'}}/>
                    <div style={{...s.dot(2),animationName:'bounce'}}/>
                  </div>
                </div>
              )}
              <div ref={endRef} style={{height:'20px'}}/>
            </div>

            <div style={{flexShrink:0, padding:'8px 12px', background:'rgba(18,18,31,.98)', borderTop:'1px solid rgba(255,255,255,.06)'}}>
              <div style={{display:'flex', gap:'6px', padding:'4px 0 6px', overflowX:'auto', scrollbarWidth:'none'}}>
                {allSuggest.map((sg,i)=>(
                  <button key={i} style={{...s.sg, fontSize:'11px', padding:'5px 9px'}} onClick={()=>setInp(sg)}>{sg}</button>
                ))}
              </div>
              {attachedFile && (
                <div style={{display:'flex', alignItems:'center', gap:'8px', padding:'5px 10px', margin:'0 0 6px', background:'rgba(79,70,229,.12)', border:'1px solid rgba(79,70,229,.25)', borderRadius:'8px', fontSize:'11px', color:'#C4B5FD'}}>
                  <span>📎 {attachedFile.name}</span>
                  <button style={{background:'none', border:'none', color:'#FCA5A5', cursor:'pointer', fontSize:'13px', padding:'0 2px', lineHeight:1}} onClick={()=>setAttachedFile(null)}>×</button>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" style={{display:'none'}} onChange={e => { if(e.target.files[0]) setAttachedFile(e.target.files[0]); e.target.value=''; }} />
              <div style={{display:'flex', gap:'6px', alignItems:'flex-end', paddingBottom:'4px'}}>
                <button style={{width:'36px', height:'36px', borderRadius:'9px', background: attachedFile ? 'rgba(79,70,229,.3)' : 'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.08)', color: attachedFile ? '#74d5c6' : 'rgba(255,255,255,.45)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .2s'}} onClick={()=>fileRef.current?.click()} title="Adjuntar PDF o Word">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>
                <textarea
                  ref={taRef}
                  className="cita-el"
                  style={{...s.cita, fontSize:'13px', minHeight:'36px', padding:'8px 10px'}}
                  placeholder="Di lo que necesitas organizar..."
                  value={inp}
                  onChange={e=>{
                    setInp(e.target.value);
                    if(taRef.current){taRef.current.style.height='36px'; taRef.current.style.height=Math.min(taRef.current.scrollHeight,85)+'px';}
                  }}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault(); attachedFile ? sendWithFile() : send();}}}
                  rows={1}
                />
                <button style={{...s.sndbtn(!inp.trim()&&!attachedFile||busy), width:'36px', height:'36px', borderRadius:'9px', fontSize:'17px'}} onClick={attachedFile ? sendWithFile : send} disabled={!inp.trim()&&!attachedFile||busy}>
                  ↑
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

      {showSchedModal && (
        <div style={s.modalBackdrop}>
          <div style={s.modalBox}>
            <div style={s.modalTitle}>{editSchedId ? 'Editar Clase' : 'Agregar Clase'}</div>
            <input style={s.input} placeholder="Nombre de materia" value={mSched.subject} onChange={e=>setMSched({...mSched,subject:e.target.value})} />
            
            <select style={s.select} value={mSched.dayIndex} onChange={e=>{
              const val = parseInt(e.target.value);
              setMSched({...mSched,dayIndex:val});
              setExtraDays(p=>p.filter(x=>x.dayIndex!==val));
            }}>
              {DAYS.map((d,i)=><option key={i} value={i}>{d}</option>)}
            </select>

            <div style={{display:'flex',gap:'10px'}}>
              <input type="time" style={s.input} value={mSched.startTime} onChange={e=>setMSched({...mSched,startTime:e.target.value})} />
              <input type="time" style={s.input} value={mSched.endTime} onChange={e=>setMSched({...mSched,endTime:e.target.value})} />
            </div>
            
            <input style={s.input} placeholder="Salón/Ubicación (Opcional)" value={mSched.location} onChange={e=>setMSched({...mSched,location:e.target.value})} />
            <input style={s.input} placeholder="Profesor (Opcional)" value={mSched.professor} onChange={e=>setMSched({...mSched,professor:e.target.value})} />

            {!editSchedId && (
              <div style={{...s.toggleBtn, padding:'10px 12px'}} onClick={()=>setIsRepeated(!isRepeated)}>
                <span style={{fontSize:'13px', color:'rgba(255,255,255,.7)'}}>¿Se repite otros días?</span>
                <div style={s.toggleTrack(isRepeated)}><div style={s.toggleNub(isRepeated)}/></div>
              </div>
            )}
            
            {isRepeated && !editSchedId && (
              <div style={{display:'flex', flexDirection:'column', gap:'10px', background:'rgba(0,0,0,.2)', padding:'12px', borderRadius:'8px', border:'1px solid rgba(255,255,255,.05)'}}>
                <div style={{fontSize:'12px', color:'rgba(255,255,255,.5)'}}>Selecciona los días adicionales:</div>
                <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                  {DAYS.map((d,i) => {
                    if(i === mSched.dayIndex) return null;
                    const isOn = extraDays.some(ed => ed.dayIndex === i);
                    return (
                      <button key={i} style={{...s.dt(isOn, false), padding:'5px 10px'}} onClick={()=>handleToggleExtraDay(i)}>
                        {d.slice(0,3)}
                      </button>
                    )
                  })}
                </div>
                {extraDays.length > 0 && (
                  <div style={{display:'flex', flexDirection:'column', gap:'8px', marginTop:'8px'}}>
                    {extraDays.map((ed, idx) => (
                      <div key={ed.dayIndex} style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <div style={{fontSize:'13px', width:'35px', color:'white', fontWeight:600}}>{DAYS[ed.dayIndex].slice(0,3)}</div>
                        <input type="time" style={{...s.input, flex:1, padding:'6px'}} value={ed.startTime} onChange={e=>handleExtraTimeChange(idx,'startTime',e.target.value)} />
                        <span style={{color:'rgba(255,255,255,.3)'}}>-</span>
                        <input type="time" style={{...s.input, flex:1, padding:'6px'}} value={ed.endTime} onChange={e=>handleExtraTimeChange(idx,'endTime',e.target.value)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={s.btnRow}>
              <button style={s.btnSec} onClick={()=>{setEditSchedId(null); setIsRepeated(false); setExtraDays([]); setShowSchedModal(false)}}>Cancelar</button>
              <button style={s.btnPri} onClick={handleSaveSched}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div style={s.modalBackdrop}>
          <div style={{...s.modalBox, maxHeight:'90vh', overflowY:'auto', scrollbarWidth:'none'}}>
            <div style={s.modalTitle}>{editTaskId ? 'Editar Tarea' : 'Agregar Tarea'}</div>
            <input style={s.input} placeholder="¿Qué tienes que hacer?" value={mTask.title} onChange={e=>setMTask({...mTask,title:e.target.value})} autoFocus />
            
            {(() => {
              const uniqueSubjects = [...new Set(sched.map(c => c.subject).filter(Boolean))];
              const isDropdown = !showCustomSubject && uniqueSubjects.length > 0;
              
              if (isDropdown) {
                return (
                  <select style={s.select} value={mTask.subject || ""} onChange={e => {
                    if (e.target.value === '$$CUSTOM$$') {
                      setShowCustomSubject(true);
                      setMTask({...mTask, subject: ''});
                    } else {
                      setMTask({...mTask, subject: e.target.value});
                    }
                  }}>
                    <option value="" disabled>Selecciona la Clase...</option>
                    {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    <option value="$$CUSTOM$$" style={{color:'#FBBF24', fontWeight:600}}>⚡ Agregar tarea personalizada (Sin vincular)</option>
                  </select>
                );
              } else {
                return (
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <input style={s.input} placeholder="Materia o Proyecto Libre..." value={mTask.subject} onChange={e=>setMTask({...mTask,subject:e.target.value})} />
                    {uniqueSubjects.length > 0 && (
                      <button style={{background:'transparent', border:'none', color:'#74d5c6', fontSize:'11.5px', textAlign:'left', cursor:'pointer', padding:'2px'}} onClick={() => { setShowCustomSubject(false); setMTask({...mTask, subject:''}) }}>
                        ← Volver a elegir de mis Clases
                      </button>
                    )}
                  </div>
                );
              }
            })()}
            
            <div style={{display:'flex',gap:'10px', marginTop:'5px'}}>
              <input type="date" style={s.input} value={mTask.dueDate} onChange={e=>setMTask({...mTask,dueDate:e.target.value})} />
              <input type="time" style={s.input} value={mTask.dueTime} onChange={e=>setMTask({...mTask,dueTime:e.target.value})} />
            </div>

            <div style={{marginTop:'5px'}}>
              <div style={{fontSize:'12.5px', color:'rgba(255,255,255,.5)', marginBottom:'6px'}}>Frecuencia de recordatorio</div>
              <select style={s.select} value={mTask.remindFreq} onChange={e=>setMTask({...mTask,remindFreq:e.target.value})}>
                <option value="auto">Automático (recomendado)</option>
                {getReminderOptions(mTask.dueDate).map((o,i)=><option key={i} value={o.val}>{o.label}</option>)}
              </select>
            </div>

            <div style={{...s.toggleBtn, padding:'10px 12px', marginTop:'5px'}} onClick={()=>setIsTaskRepeated(!isTaskRepeated)}>
              <span style={{fontSize:'13px', color:'rgba(255,255,255,.7)'}}>¿Se repite esta tarea?</span>
              <div style={s.toggleTrack(isTaskRepeated)}><div style={s.toggleNub(isTaskRepeated)}/></div>
            </div>

            {isTaskRepeated && (
              <div style={{display:'flex', flexDirection:'column', gap:'10px', background:'rgba(0,0,0,.2)', padding:'12px', borderRadius:'8px', border:'1px solid rgba(255,255,255,.05)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{fontSize:'12px', color:'rgba(255,255,255,.5)'}}>Entregas adicionales:</div>
                  <button style={{...s.addBtn, padding:'3px 8px'}} onClick={handleAddExtraTask}>+ Añadir fecha</button>
                </div>
                {extraTaskDays.map((etd, idx) => (
                  <div key={idx} style={{display:'flex', gap:'8px', alignItems:'center'}}>
                    <input type="date" style={{...s.input, flex:1, padding:'6px'}} value={etd.dueDate} onChange={e=>handleUpdateExtraTask(idx,'dueDate',e.target.value)} />
                    <input type="time" style={{...s.input, width:'95px', padding:'6px'}} value={etd.dueTime} onChange={e=>handleUpdateExtraTask(idx,'dueTime',e.target.value)} />
                    <button style={s.xbtn} onClick={()=>handleRemoveExtraTask(idx)}>×</button>
                  </div>
                ))}
                {extraTaskDays.length === 0 && (
                  <div style={{fontSize:'12px', color:'rgba(255,255,255,.2)'}}>Añade una fecha extra para crear múltiples tareas iguales a la vez.</div>
                )}
              </div>
            )}

            <div style={{...s.btnRow, marginTop:'10px'}}>
              <button style={s.btnSec} onClick={()=>{setEditTaskId(null); setIsTaskRepeated(false); setExtraTaskDays([]); setShowTaskModal(false)}}>Cancelar</button>
              <button style={s.btnPri} onClick={handleSaveTask}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mini Calendar Popover ── */}
      {calTaskId && (
        <div style={s.modalBackdrop} onClick={() => setCalTaskId(null)}>
          <div style={{background:'rgba(21,21,42,.95)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'16px', padding:'18px 20px', width:'290px', color:'white', display:'flex', flexDirection:'column', gap:'16px', backdropFilter:'blur(10px)', position:'relative', animation:'floatUp 0.3s ease-out forwards'}} onClick={e=>e.stopPropagation()}>
            <button style={{...s.xbtn, position:'absolute', top:'14px', right:'14px'}} onClick={()=>setCalTaskId(null)}>×</button>
            <div style={{textAlign:'center', fontWeight:700, fontSize:'15px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <button style={{background:'rgba(255,255,255,.05)', borderRadius:'8px', border:'none', color:'#74d5c6', cursor:'pointer', fontSize:'16px', width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center'}} onClick={()=>{
                const nm = new Date(calMonth); nm.setMonth(nm.getMonth()-1); setCalMonth(nm); setCalTooltipId(null);
              }}>‹</button>
              {calMonth.toLocaleDateString('es-CO',{month:'long', year:'numeric'}).replace(/^\w/, c=>c.toUpperCase())}
              <button style={{background:'rgba(255,255,255,.05)', borderRadius:'8px', border:'none', color:'#74d5c6', cursor:'pointer', fontSize:'16px', width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center'}} onClick={()=>{
                const nm = new Date(calMonth); nm.setMonth(nm.getMonth()+1); setCalMonth(nm); setCalTooltipId(null);
              }}>›</button>
            </div>
            
            <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'6px', textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,.3)', fontWeight:600}}>
              {['D','L','M','M','J','V','S'].map((d,i)=><div key={i}>{d}</div>)}
            </div>
            
            <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'6px'}}>
              {(() => {
                 const t = tasks.find(x=>x.id===calTaskId);
                 if(!t) return null;
                 const allDates = [ { dueDate: t.dueDate, dueTime: t.dueTime||'' }, ...(t.pendingDates||[]) ];
                 const y = calMonth.getFullYear();
                 const m = calMonth.getMonth();
                 const firstDay = new Date(y, m, 1).getDay();
                 const daysInMonth = new Date(y, m+1, 0).getDate();
                 
                 const blanks = Array.from({length: firstDay}).map((_,i)=><div key={`b${i}`}/>);
                 const days = Array.from({length: daysInMonth}).map((_, i) => {
                   const day = i+1;
                   const dStr = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                   const evs = allDates.filter(ad => ad.dueDate === dStr);
                   const hasEv = evs.length > 0;
                   const isToday = todayCO() === dStr;
                   
                   return (
                     <div key={day} style={{position:'relative', display:'flex', flexDirection:'column', alignItems:'center'}}>
                       <button 
                         style={{width:'30px', height:'30px', borderRadius:'50%', background: isToday ? 'rgba(255,255,255,.1)' : 'transparent', border: hasEv ? '1px solid #218a80' : '1px solid transparent', color: hasEv ? 'white' : 'rgba(255,255,255,.5)', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', cursor: hasEv ? 'pointer':'default', padding:0, transition:'all .2s'}}
                         onClick={(e) => {
                           if(hasEv) {
                             e.stopPropagation();
                             setCalTooltipId(calTooltipId === dStr ? null : dStr);
                           }
                         }}
                       >
                         {day}
                       </button>
                       {hasEv && <div style={{width:'4px', height:'4px', borderRadius:'50%', background:'#74d5c6', marginTop:'3px'}}/>}
                       
                       {/* Animated Tooltip */}
                       {calTooltipId === dStr && (
                         <div style={{position:'absolute', bottom:'100%', left:'50%', background:'#218a80', color:'white', padding:'5px 10px', borderRadius:'8px', fontSize:'11.5px', fontWeight:600, whiteSpace:'nowrap', boxShadow:'0 4px 15px rgba(0,0,0,.4)', zIndex:60, animation:'pop 0.2s ease-out forwards'}}>
                           {evs.map(ev => ev.dueTime ? `⏰ ${ev.dueTime}` : '📌 Todo el día').join(' / ')}
                           <div style={{position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:'6px solid #218a80'}}/>
                         </div>
                       )}
                     </div>
                   );
                 });
                 return [...blanks, ...days];
              })()}
            </div>
            
          </div>
        </div>
      )}

      {showConfigModal && (
        <div style={s.modalBackdrop}>
          <div style={s.modalBox}>
            {configStep === 'main' && (
              <>
                <div style={s.modalTitle}>Configuración</div>
                <div style={{color:'rgba(255,255,255,.5)',fontSize:'13px',marginBottom:'15px'}}>Oculta o muestra sábados y domingos de tu horario.</div>
                <div style={s.toggleBtn} onClick={handleToggleWeekends}>
                  <span>Incluir fin de semana</span>
                  <div style={s.toggleTrack(showWeekends)}>
                    <div style={s.toggleNub(showWeekends)}/>
                  </div>
                </div>
                
                <hr style={{border:'none', borderTop:'1px solid rgba(255,255,255,.05)', margin:'12px 0'}} />
                
                <button style={{width:'100%', padding:'12px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'12px', color:'#FCA5A5', fontSize:'14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:600}} onClick={()=>setConfigStep('menu')}>
                  <span>🗑️ Gestor de Borrado de Clases</span>
                  <span>›</span>
                </button>

                <button style={{width:'100%', padding:'12px', background:'rgba(52, 211, 153,.1)', border:'1px solid rgba(52, 211, 153,.3)', borderRadius:'12px', color:'#A7F3D0', fontSize:'14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:600, marginTop: '8px'}} onClick={()=>setConfigStep('recovery')}>
                  <span>♻️ Recuperador de Datos</span>
                  <span>›</span>
                </button>

                <div style={s.btnRow}>
                  <button style={{...s.btnPri,marginTop:'6px'}} onClick={()=>setShowConfigModal(false)}>Cerrar</button>
                </div>
              </>
            )}

            {configStep === 'menu' && (
              <>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                  <button style={{background:'rgba(255,255,255,.1)', border:'none', color:'white', width:'30px', height:'30px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px'}} onClick={()=>setConfigStep('main')}>‹</button>
                  <div style={{...s.modalTitle, marginBottom:0}}>Borrar Clases</div>
                </div>
                
                <button style={{width:'100%', padding:'14px', background:'rgba(0,0,0,.2)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'12px', color:'white', fontSize:'14px', cursor:'pointer', textAlign:'left', transition:'background .2s'}} onClick={()=>setConfigStep('delete-all-confirm')}>
                  Borrar TODAS las clases
                </button>
                
                <button style={{width:'100%', padding:'14px', background:'rgba(0,0,0,.2)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'12px', color:'white', fontSize:'14px', cursor:'pointer', textAlign:'left', transition:'background .2s'}} onClick={()=>{
                  setClassesToDelete([]);
                  setConfigStep('delete-multi-select');
                }}>
                  Seleccionar clases específicas...
                </button>
              </>
            )}

            {configStep === 'delete-multi-select' && (
              <>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                  <button style={{background:'rgba(255,255,255,.1)', border:'none', color:'white', width:'30px', height:'30px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px'}} onClick={()=>setConfigStep('menu')}>‹</button>
                  <div style={{...s.modalTitle, marginBottom:0}}>Multi-Selección</div>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'18px', maxHeight:'40vh', overflowY:'auto', paddingRight:'5px'}}>
                  {sched.length === 0 ? (
                    <div style={{fontSize:'13px', color:'rgba(255,255,255,.3)', textAlign:'center', marginTop:'20px'}}>No hay clases para borrar.</div>
                  ) : (
                    visibleDays.map(dIdx => {
                      const dayCls = sched.filter(e => e.dayIndex === dIdx).sort((a,b)=>a.startTime.localeCompare(b.startTime));
                      if(dayCls.length === 0) return null;
                      return (
                        <div key={dIdx}>
                          <div style={{fontSize:'12px', color:'rgba(255,255,255,.5)', fontWeight:600, marginBottom:'6px', paddingLeft:'4px'}}>{DAYS[dIdx]}</div>
                          <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                            {dayCls.map(c => {
                              const isSel = classesToDelete.includes(c.id);
                              return (
                                <button key={c.id} style={{width:'100%', padding:'10px 12px', background: isSel ? 'rgba(239,68,68,.1)':'rgba(255,255,255,.03)', border: isSel ? '1px solid rgba(239,68,68,.4)':'1px solid rgba(255,255,255,.05)', borderRadius:'10px', color:'white', fontSize:'13.5px', cursor:'pointer', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all .2s'}} onClick={()=>{
                                  setClassesToDelete(p => p.includes(c.id) ? p.filter(id => id !== c.id) : [...p, c.id]);
                                }}>
                                  <div>
                                    <span style={{fontWeight:600}}>{c.subject}</span>
                                    <span style={{fontSize:'11.5px', color:'rgba(255,255,255,.4)', marginLeft:'8px'}}>{c.startTime}</span>
                                  </div>
                                  <div style={{width:'18px', height:'18px', borderRadius:'4px', border: isSel ? 'none' : '1px solid rgba(255,255,255,.2)', background: isSel ? '#EF4444' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                    {isSel && <span style={{color:'white', fontSize:'12px'}}>✓</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <div style={{display:'flex', width:'100%', marginTop:'10px'}}>
                  {classesToDelete.length === 0 ? (
                    <button style={{width:'100%', padding:'12px', background:'rgba(255,255,255,.05)', border:'none', borderRadius:'10px', color:'rgba(255,255,255,.4)', fontWeight:600, cursor:'default'}}>Selecciona para Borrar</button>
                  ) : (
                    <button style={{width:'100%', padding:'12px', background:'#EF4444', border:'none', borderRadius:'10px', color:'white', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(239,68,68,.3)'}} onClick={()=>setConfigStep('delete-multi-confirm')}>Borrar {classesToDelete.length} Clase{classesToDelete.length!==1?'s':''}</button>
                  )}
                </div>
              </>
            )}

            {configStep === 'recovery' && (
              <>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                  <button style={{background:'rgba(255,255,255,.1)', border:'none', color:'white', width:'30px', height:'30px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px'}} onClick={()=>setConfigStep('main')}>‹</button>
                  <div style={{...s.modalTitle, marginBottom:0}}>Recuperador</div>
                </div>
                <div style={{maxHeight:'50vh', overflowY:'auto'}}>
                  <div style={{color:'rgba(255,255,255,.5)', fontSize:'12px', fontWeight:'bold', marginBottom:'10px'}}>TAREAS COMPLETADAS</div>
                  {tasks.filter(t => t.completed).length === 0 && <div style={{fontSize:'13px', color:'rgba(255,255,255,.3)', marginBottom:'15px'}}>No hay tareas completadas.</div>}
                  {tasks.filter(t => t.completed).map(t => (
                    <div key={t.id} style={{background:'rgba(255,255,255,.05)', padding:'10px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                      <div style={{color:'white', fontSize:'13px', textDecoration:'line-through', opacity:0.6}}>{t.title}</div>
                      <button style={{background:'rgba(52, 211, 153,.2)', color:'#34D399', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px'}} onClick={() => {
                        putTasks(tasks.map(x => x.id === t.id ? {...x, completed: false} : x));
                      }}>Deshacer</button>
                    </div>
                  ))}

                  <div style={{color:'rgba(255,255,255,.5)', fontSize:'12px', fontWeight:'bold', marginTop:'20px', marginBottom:'10px'}}>CLASES ELIMINADAS</div>
                  {deletedSched.length === 0 && <div style={{fontSize:'13px', color:'rgba(255,255,255,.3)'}}>No hay clases eliminadas.</div>}
                  {deletedSched.map(c => (
                    <div key={c.id} style={{background:'rgba(255,255,255,.05)', padding:'10px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                      <div style={{color:'white', fontSize:'13px', opacity:0.6}}>{c.subject}</div>
                      <button style={{background:'rgba(52, 211, 153,.2)', color:'#34D399', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px'}} onClick={() => {
                         putSched([...sched, c]);
                         putDeletedSched(deletedSched.filter(x => x.id !== c.id));
                      }}>Restaurar</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Flotante Advertencia de Borrar TODO */}
      {showConfigModal && configStep === 'delete-all-confirm' && (
        <div style={{...s.modalBackdrop, zIndex:100}}>
          <div style={{background:'rgba(30,10,10,.95)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'320px', color:'white', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'16px', animation:'floatUp 0.3s ease-out forwards', backdropFilter:'blur(8px)'}}>
            <div style={{fontSize:'32px'}}>⚠️</div>
            <div style={{fontSize:'16px', fontWeight:600, fontFamily:"'DM Sans',sans-serif", lineHeight:1.4}}>¿Estás seguro de confirmar esta acción?</div>
            <div style={{fontSize:'13px', color:'rgba(255,255,255,.6)'}}>Se eliminarán por completo TODAS las clases de tu horario. Esta acción no se puede deshacer.</div>
            
            <div style={{display:'flex', gap:'10px', width:'100%', marginTop:'10px'}}>
              <button style={{flex:1, padding:'12px', background:'transparent', border:'1px solid rgba(255,255,255,.2)', borderRadius:'10px', color:'white', fontWeight:600, cursor:'pointer'}} onClick={()=>setConfigStep('menu')}>Cancelar</button>
              <button style={{flex:1, padding:'12px', background:'#EF4444', border:'none', borderRadius:'10px', color:'white', fontWeight:700, cursor:'pointer'}} onClick={()=>{
                putDeletedSched([...deletedSched, ...sched]);
                putSched([]);
                setShowConfigModal(false);
                setConfigStep('main');
              }}>Sí, borrar todo</button>
            </div>
          </div>
        </div>
      )}

      {/* Flotante Advertencia de Selección Múltiple */}
      {showConfigModal && configStep === 'delete-multi-confirm' && classesToDelete.length > 0 && (
        <div style={{...s.modalBackdrop, zIndex:100}}>
          <div style={{background:'rgba(30,10,10,.95)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'320px', color:'white', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'16px', animation:'floatUp 0.3s ease-out forwards', backdropFilter:'blur(8px)'}}>
            <div style={{fontSize:'32px'}}>⚠️</div>
            <div style={{fontSize:'16px', fontWeight:600, fontFamily:"'DM Sans',sans-serif", lineHeight:1.4}}>¿Confirmas demolición táctica?</div>
            <div style={{fontSize:'13px', color:'rgba(255,255,255,.6)'}}>Las <strong>{classesToDelete.length}</strong> clases que seleccionaste se borrarán permanentemente del horario. No podrás deshacerlo.</div>
            
            <div style={{display:'flex', gap:'10px', width:'100%', marginTop:'10px'}}>
              <button style={{flex:1, padding:'12px', background:'transparent', border:'1px solid rgba(255,255,255,.2)', borderRadius:'10px', color:'white', fontWeight:600, cursor:'pointer'}} onClick={()=>setConfigStep('delete-multi-select')}>Cancelar</button>
              <button style={{flex:1, padding:'12px', background:'#EF4444', border:'none', borderRadius:'10px', color:'white', fontWeight:700, cursor:'pointer'}} onClick={()=>{
                const toDel = sched.filter(e => classesToDelete.includes(e.id));
                putDeletedSched([...deletedSched, ...toDel]);
                putSched(sched.filter(e => !classesToDelete.includes(e.id)));
                setShowConfigModal(false);
                setConfigStep('main');
                setClassesToDelete([]);
              }}>Borrar clases</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
