export function classOccursOn(entry,date){
 const day=(new Date(date+'T12:00:00Z').getUTCDay()+6)%7;
 return entry.dayIndex===day && (!entry.dateRanges?.length || entry.dateRanges.some(r=>date>=r.startDate&&date<=r.endDate));
}
export const rangeLabel=entry=>entry.dateRanges?.length?entry.dateRanges.map(r=>`${r.startDate} → ${r.endDate}`).join(' · '):'Repite semanalmente';
export const todayCO = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const addDays = (date,n) => {const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10)};
export function holidays(year){
 const out={}; const put=(m,d,name,monday=false)=>{let dt=`${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;if(monday)dt=addDays(dt,(8-new Date(dt+'T12:00:00Z').getUTCDay())%7);out[dt]=name};
 [[1,1,'Año Nuevo'],[5,1,'Día del Trabajo'],[7,20,'Independencia'],[8,7,'Batalla de Boyacá'],[12,8,'Inmaculada Concepción'],[12,25,'Navidad']].forEach(x=>put(...x));
 [[1,6,'Reyes Magos'],[3,19,'San José'],[6,29,'San Pedro y San Pablo'],[8,15,'Asunción'],[10,12,'Diversidad Étnica y Cultural'],[11,1,'Todos los Santos'],[11,11,'Independencia de Cartagena']].forEach(x=>put(...x,true));
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;
 const easter=`${year}-${String(Math.floor(n/31)).padStart(2,'0')}-${String(n%31+1).padStart(2,'0')}`;
 [[-3,'Jueves Santo'],[-2,'Viernes Santo'],[43,'Ascensión'],[64,'Corpus Christi'],[71,'Sagrado Corazón']].forEach(([offset,name])=>{out[addDays(easter,offset)]=name});return out;
}
export const holidayOn=date=>holidays(Number(date.slice(0,4)))[date];
export function agendaReply(message,schedule,tasks,today=todayCO()){
 const q=message.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/\b(agrega|anade|crea|pon|elimina|borra|cambia|mueve|programa)\b/.test(q))return null;
 if(!/\b(que|cual|muestra|dime|ver|agenda|horario|tareas|pendientes)\b/.test(q))return null;
 if(/tareas|pendientes/.test(q)&&! /hoy|manana|semana|otro dia|lunes|martes|miercoles|jueves|viernes|sabado|domingo/.test(q)){return tasks.filter(t=>!t.completed).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).map(t=>`• ${t.dueDate} · ${t.title}`).join('\n')||'No tienes tareas pendientes.';}
 let start=today,end=today; const dow=new Date(today+'T12:00:00Z').getUTCDay();
 if(/(proxima|otra|siguiente) semana|semana (proxima|entrante|siguiente)/.test(q)){start=addDays(today,8-(dow||7));end=addDays(start,6)}
 else if(/esta semana/.test(q)){start=addDays(today,1-(dow||7));end=addDays(start,6)}
 else if(/pasado manana/.test(q))start=end=addDays(today,2);
 else if(/manana|otro dia/.test(q))start=end=addDays(today,1);
 else {const days=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];const target=days.findIndex(x=>q.includes(x));if(target>=0)start=end=addDays(today,(target-dow+7)%7);else if(!/hoy|tareas|pendientes|horario|agenda/.test(q))return null;}
 const rows=[];for(let date=start;date<=end;date=addDays(date,1)){
 const idx=(new Date(date+'T12:00:00Z').getUTCDay()+6)%7,holiday=holidayOn(date);
 const cls=schedule.filter(x=>classOccursOn(x,date)).sort((a,b)=>a.startTime.localeCompare(b.startTime));
 const ts=tasks.filter(t=>!t.completed).flatMap(t=>[{...t},...(t.pendingDates||[]).map(p=>({...t,...p}))]).filter(t=>t.dueDate===date);
 rows.push(`${date}${holiday?' · Festivo: '+holiday:''}\n${cls.map(x=>`• ${x.startTime}–${x.endTime} ${x.subject}${holiday?' (confirma si hay clase)':''}`).concat(ts.map(t=>`• Entrega: ${t.title}${t.dueTime?' · '+t.dueTime:''}`)).join('\n')||'Sin clases ni tareas registradas.'}`);
 }return rows.join('\n\n');
}
