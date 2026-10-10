const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Exercise the production projection functions without starting the app UI.
const source=fs.readFileSync('app.js','utf8');
const begin=source.indexOf('  const ROSTER_PROJECTION_PROFILES=');
const end=source.indexOf('  function projectedSettingsForDate',begin);
assert.ok(begin>=0&&end>begin);
const context={
  current:{settings:{homeLine:'ARMADALE',rosterLineNumber:3,rosterLineAnchorDate:'2026-10-04'}},
  parseDate:value=>new Date(value+'T00:00:00'),
  startOfRosterDay:date=>new Date(date.getFullYear(),date.getMonth(),date.getDate()),
  addRosterDays:(date,days)=>{const result=new Date(date);result.setDate(result.getDate()+days);return result},
  projectionRoleForSettings:()=> 'SENIOR_TRANSIT'
};
vm.createContext(context);
vm.runInContext(source.slice(begin,end),context);
const project=date=>context.rosterProjectionForDate(context.parseDate(date));
const fortnight=start=>Array.from({length:14},(_,day)=>{
  const date=context.addRosterDays(context.parseDate(start),day);
  return context.rosterProjectionForDate(date).mark||'-';
}).join('');

assert.equal(project('2026-10-10').line,3);
assert.equal(project('2026-10-17').line,3);
assert.equal(project('2026-10-18').line,4);
assert.equal(project('2026-11-01').line,5);
assert.equal(fortnight('2026-10-04'),'---XXXXX--XXX-');
assert.equal(fortnight('2026-10-18'),'-MMMM-----MMMM');
assert.equal(fortnight('2026-11-01'),'M---MMMMM---XX');
assert.equal(project('2026-11-29').line,1);
assert.equal(fortnight('2026-11-29'),'-XXXXX-----XXX');
assert.equal(fortnight('2026-09-06'),'-XXXXX-----XXX');
assert.equal(project('2026-12-27').line,3);

// Regular Transit retains its original line pattern and source times.
context.projectionRoleForSettings=()=> 'TRANSIT';
assert.equal(fortnight('2026-10-04'),'XX----XXXX--XX');
assert.equal(project('2026-10-10').line,3);
assert.equal(project('2026-10-18').line,4);
assert.ok(project('2026-10-10').start);
assert.equal(context.current.settings.rosterLineNumber,3);
assert.equal(context.current.settings.rosterLineAnchorDate,'2026-10-04');
console.log('Roster projection alignment tests passed.');
