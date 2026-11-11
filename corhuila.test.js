import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import pdf from 'pdf-parse/lib/pdf-parse.js';import {parseCorhuila} from './corhuila.js';import {classOccursOn,agendaReply} from './academic.js';
process.env.NODE_ENV='test';const {app,validatePlan}=await import('./server.js');
const item=(str,x,y)=>({str,transform:[1,0,0,1,x,y]});
const headers=['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'].map((s,i)=>item(s,110+i*65,600));
test('Continued column preserves separated date ranges; ignores student header',()=>{
 const pages=[[item('PACR42_GWT',490,700),...headers,...['Cod. 123','Prog. 90','MATERIA DE','PRUEBA','Grupo. 1','03/08/26 - 10/08/26','Aula.'].map((s,i)=>item(s,95,550-i*10))],[...['24/08/26 - 05/10/26','8:20 pm-10:00 pm'].map((s,i)=>item(s,95,750-i*10)),item('Detalle de las Materias:',45,600)]];
 const p=validatePlan(parseCorhuila(pages));assert.equal(p.entries.length,1);const e=p.entries[0];assert.equal(e.subject,'MATERIA DE PRUEBA');assert.equal(e.startTime,'20:20');assert.equal(e.location,'');assert.equal(e.dateRanges.length,2);assert.equal(classOccursOn(e,'2026-08-17'),false);assert.equal(classOccursOn(e,'2026-08-24'),true);assert.equal(classOccursOn(e,'2026-10-12'),false);
});
test('Unrecognized formats fall back; incomplete recognized tables fail closed',()=>{assert.equal(parseCorhuila([]),null);assert.throws(()=>parseCorhuila([[item('PACR42_GWT',490,700)]]));});
test('Actual PDF upload: nine exact slots, date boundaries, no OpenAI request',{skip:!process.env.SCHEDULE_TEST_PDF},async()=>{
 const expected=[[0,'18:30','20:10'],[0,'20:20','22:00'],[1,'18:30','20:10'],[2,'10:00','11:40'],[2,'18:30','20:10'],[2,'20:20','22:00'],[3,'07:00','07:50'],[3,'21:10','22:00'],[4,'06:00','08:30']];
 delete process.env.OPENAI_KEY;delete process.env.OPENAI_API_KEY;
 const server=app.listen(0);await new Promise(resolve=>server.once('listening',resolve));
 try{const form=new FormData();form.append('file',new Blob([fs.readFileSync(process.env.SCHEDULE_TEST_PDF)]),'schedule.pdf');const r=await fetch(`http://localhost:${server.address().port}/api/chat-file`,{method:'POST',body:form});assert.equal(r.status,200);const data=await r.json();const p=JSON.parse(data.text);assert.deepEqual(p.entries.map(e=>[e.dayIndex,e.startTime,e.endTime]),expected);assert.equal(p.entries[3].location,'');assert.equal(p.entries[0].dateRanges.length,4);assert.equal(p.entries[1].dateRanges.length,4);assert.equal(p.entries.filter(e=>classOccursOn(e,'2026-11-16')).length,0);assert.equal(p.entries.filter(e=>classOccursOn(e,'2026-11-18')).length,3);assert.equal(p.entries.filter(e=>classOccursOn(e,'2026-11-25')).length,0);assert.match(agendaReply('que tengo el lunes',p.entries,[],'2026-11-11'),/Sin clases/);assert.doesNotMatch(JSON.stringify(p),/Estudiante|Código/);
 }finally{await new Promise(resolve=>server.close(resolve))}
});
