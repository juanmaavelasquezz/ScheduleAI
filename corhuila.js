// PACR42 schedules: recover columns before parsing, including page continuations.
// No personal header fields are retained or sent to a model by this parser.
export function parseCorhuila(pages) {
 const first=pages[0]||[];
 if(!first.some(i=>/PACR42/.test(i.str)))return null;
 const names=['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];
 const headings=names.map(name=>first.find(i=>i.str.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()===name));
 if(headings.some(x=>!x))throw Error('No pude identificar las columnas del horario. No se importó ninguna clase.');
 const anchors=headings.map(x=>x.transform[4]);
 const columns=names.map(()=>[]);let ended=false;
 for(let pageIndex=0;pageIndex<pages.length&&!ended;pageIndex++){
  const items=pages[pageIndex];const detail=items.find(i=>/Detalle\s+de\s+las\s+Materias/i.test(i.str.replace(/\u00a0/g,' ')));
  const top=pageIndex===0?headings[0].transform[5]:Infinity;
  const bottom=detail?.transform[5]??-Infinity;
  for(const item of [...items].sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4])){
   const x=item.transform[4],y=item.transform[5];if(y>=top||y<=bottom||x<anchors[0]-28||x>anchors[6]+60)continue;
   const col=anchors.reduce((best,a,i)=>Math.abs(x-a)<Math.abs(x-anchors[best])?i:best,0);
   const text=item.str.replace(/\u00a0/g,' ').trim();if(text)columns[col].push(text);
  }
  if(detail)ended=true;
 }
 const iso=s=>{const [d,m,y]=s.split('/');return `${y.length===2?'20'+y:y}-${m}-${d}`};
 const clock=(h,m,ap)=>`${String(Number(h)%12+(ap.toLowerCase()==='pm'?12:0)).padStart(2,'0')}:${m}`;
 const entries=[];
 for(let dayIndex=0;dayIndex<7;dayIndex++){
  const text=columns[dayIndex].join('\n');
  const blocks=text.split(/(?=Cod\.\s*\d+)/).filter(b=>/^Cod\.\s*\d+/.test(b));
  for(const block of blocks){
   const subject=block.match(/Prog\.\s*\d+\s*\n([\s\S]*?)\nGrupo\./)?.[1].replace(/\s+/g,' ').trim();
   const time=block.match(/(\d{1,2}):(\d{2})\s*(am|pm)\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)/i);
   const dateRanges=[...block.matchAll(/(\d{2}\/\d{2}\/\d{2,4})\s*-\s*(\d{2}\/\d{2}\/\d{2,4})/g)].map(m=>({startDate:iso(m[1]),endDate:iso(m[2])}));
   if(!subject||!time||!dateRanges.length)throw Error('Una clase quedó incompleta al leer las páginas. Revisa el documento; no se importó nada.');
   const location=block.match(/Aula\.[ \t]*([^]*?)(?=\n\d{2}\/|\n\d{1,2}:|$)/)?.[1].replace(/\s+/g,' ').trim()||'';
   entries.push({dayIndex,subject,startTime:clock(...time.slice(1,4)),endTime:clock(...time.slice(4,7)),dateRanges,location,professor:''});
  }
 }
 if(!entries.length)throw Error('El horario no contiene clases reconocibles.');
 return {entries,tasks:[],reply:`Encontré ${entries.length} bloques de clase con sus fechas de vigencia. Revisa la propuesta antes de guardar. Esta lectura no consume créditos de IA.`};
}
