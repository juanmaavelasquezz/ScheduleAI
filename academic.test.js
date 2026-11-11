import test from 'node:test';
import assert from 'node:assert/strict';
import {holidays,agendaReply} from './academic.js';
test('Colombia 2026: fixed, Monday transfers and Easter',()=>{const h=holidays(2026);assert.equal(Object.keys(h).length,18);for(const d of ['2026-01-12','2026-03-23','2026-04-02','2026-04-03','2026-05-18','2026-06-08','2026-06-15','2026-11-16','2026-12-25'])assert.ok(h[d],d)});
test('Next week starts Monday and includes pending occurrences',()=>{const r=agendaReply('que tengo para la otra semana', [{dayIndex:0,startTime:'08:00',endTime:'09:00',subject:'Cálculo'}],[{title:'Ensayo',dueDate:'2026-11-12',pendingDates:[{dueDate:'2026-11-17'}]}],'2026-11-11');assert.match(r,/2026-11-16/);assert.match(r,/2026-11-22/);assert.match(r,/Ensayo/);assert.match(r,/Festivo/);assert.doesNotMatch(r,/2026-11-12/)});
test('Tomorrow crosses year boundary',()=>assert.match(agendaReply('que tengo mañana',[],[],'2026-12-31'),/2027-01-01/));
test('Mutations and casual chat do not become agenda queries',()=>{assert.equal(agendaReply('agrega clase el lunes',[],[]),null);assert.equal(agendaReply('qué opinas de las películas',[],[]),null)});
