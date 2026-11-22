const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({window:{}});
for(const file of ['agreementData.js','shiftData.js','annualLeaveLoading.js','payCalculator.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),context);
}
const {PayCalc}=context.window;
const settings={classification:'STO3',classificationOverride:true,baseRate:44.37,homeLine:'ARMADALE',
  wdMult:1,satMult:1.5,sunMult:2,addHoursMult:1.84,weekendOtMult:2,lease:546.95,gesb:100,postTax:10.4,extraTax:0};
const calc=(days,startDate,overrides={})=>PayCalc.calculate({days,startDate,settings:{...settings,...overrides}});
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.00001,`${actual} != ${expected}`);

// Anonymised 8 October payroll evidence: 7h40m worked, 2.33h annual leave.
const shortened={code:'2M',type:'Rostered',start:'07:00',finish:'14:40',
  scheduledStart:'07:00',scheduledFinish:'17:00',bookOffHours:2.33,bookOffLeaveType:'annual'};
const annual=calc([shortened],'2026-10-08');
close(annual.breakdown.workedPay,340.17);
close(annual.annualLeaveDetails[0].basePay,103.38);
close(annual.annualLeaveDetails[0].loadingPay,29.76);
close(annual.breakdown.annualLeavePay,133.14);
close(annual.dayTotals[0].additionalPay,0);
close(annual.hours,7+40/60+2.33);
const personal=calc([{...shortened,bookOffLeaveType:'sick'}],'2026-10-08');
close(personal.breakdown.sickLeavePay,103.38);
close(personal.leaveUsage.personal,2.33);
close(personal.breakdown.annualLeavePay,0);
const night=calc([{...shortened,code:'2A',scheduledStart:'16:30',scheduledFinish:'02:30',
  start:'18:30',finish:'02:30',bookOffHours:2,bookOffLeaveType:'sick'}],'2026-10-14');
close(night.hours,10);
close(night.breakdown.sickLeavePay,88.74);
const holiday=calc([{...shortened,bookOffLeaveType:'sick'}],'2026-09-28');
close(holiday.breakdown.sickLeavePay,0);
assert.ok(holiday.calculationWarnings.some(message=>message.includes('public holiday')));

const easter=calc([{code:'ADL',leaveHours:10}],'2026-10-31');
close(easter.gross,443.70);
close(easter.breakdown.easterLeavePay,443.70);
close(easter.leaveUsage.easter,10);
close(easter.leaveUsage.annual,0);
assert.equal(easter.annualLeaveDetails.length,0);

assert.equal(calc([{code:'ADL'}],'2026-01-02').gross,0);
assert.equal(calc([{code:'ADL',type:'Off'}],'2026-10-31').gross,0);
const adlOnHoliday=calc([{code:'ADL',leaveHours:8}],'2026-09-28');
close(adlOnHoliday.breakdown.easterLeavePay,354.96);
assert.equal(adlOnHoliday.publicHolidayDetails.length,0);

const supervisor={code:'AA1',type:'Picked-up OT',hd:true,actingSupervisor:true,start:'15:30',finish:'01:30'};
const twoShifts=calc([supervisor,supervisor],'2026-10-12');
close(twoShifts.dayTotals[0].additionalPay,941.47);
close(twoShifts.dayTotals[1].additionalPay,941.47);
close(twoShifts.gross,1882.94);
close(calc([{...supervisor,actingSupervisor:false}],'2026-10-12').gross,906.016);
close(calc([{...supervisor,finish:'17:30'}],'2026-10-12').gross,152.67);
const updated=calc([supervisor,supervisor],'2026-10-12',{supervisorRate:52,supervisorRateEffective:'2026-10-13'});
close(updated.dayTotals[0].additionalPay,941.47);
close(updated.dayTotals[1].additionalPay,962);
const weekend=calc([{...supervisor,start:'22:00',finish:'02:00'}],'2026-10-16');
close(weekend.gross,2*49.24*1.84+2*49.24*2);
assert.ok(weekend.calculationWarnings.some(message=>message.includes('weekend')));
const extended={...supervisor,finish:'02:30'};
const standardExtended=calc([{...extended,actingSupervisor:false}],'2026-10-12');
close(calc([extended],'2026-10-12').gross,standardExtended.gross);
assert.ok(calc([extended],'2026-10-12').calculationWarnings.some(message=>message.includes('up to 10 hours')));

// Isolate withholding from roster and reimbursement classification.
const grossAt=(gross,overrides={},start='2026-10-04')=>{
  const baseRate=44.37;
  return calc([{code:'Sick',leaveHours:gross/baseRate}],start,{...overrides,baseRate});
};
for(const [gross,tax,net] of [[4443.78,852,2934.43],[6723.59,1644,4422.24],[4556,888,3010.65]]){
  const result=grossAt(gross);
  assert.equal(result.tax,tax);
  close(result.net,net);
}
// Published weekly ATO sample at 1,844 dollars, doubled for fortnightly pay.
assert.equal(grossAt(3688,{lease:0,gesb:0,paygScale:2}).tax,818);
assert.equal(grossAt(3688,{lease:0,gesb:0,paygScale:1}).tax,1038);
assert.equal(grossAt(4443.78,{},'2026-06-21').tax,852,'payment falls after 1 July despite June cycle start');
// F2025L00647 Schedule 1, fortnightly sample data and effective-date boundary.
assert.equal(grossAt(3688,{lease:0,gesb:0,paygScale:2},'2026-05-31').tax,828);
assert.equal(grossAt(3688,{lease:0,gesb:0,paygScale:1},'2026-05-31').tax,1050);
assert.equal(grossAt(3688,{lease:0,gesb:0,paygScale:2},'2025-05-18').tax,828);
assert.equal(grossAt(3688,{lease:0,gesb:0,paygScale:2},'2026-06-07').tax,818);
assert.equal(grossAt(3688,{lease:0,gesb:0,paygScale:2},'2026-06-14').tax,818);
// F2026L00716 Schedule 1, fortnightly sample rows near published thresholds.
for(const [gross,scale1,scale2] of [[722,128,0],[724,130,0],[1074,198,52],[1076,200,54],[2562,678,458],[5190,1568,1298],[5192,1568,1298]]){
  assert.equal(grossAt(gross,{lease:0,gesb:0,paygScale:'1'}).tax,scale1);
  assert.equal(grossAt(gross,{lease:0,gesb:0,paygScale:2}).tax,scale2);
}
const packaged=grossAt(3688+646.95,{postTax:10.40,extraTax:12,paygScale:2});
close(packaged.taxable,3688);
assert.equal(packaged.tax,830);
close(packaged.net,2847.60);
assert.equal(grossAt(4443.78,{extraTax:12}).tax,864);

const travel=calc([{code:'PS',type:'Picked-up OT',start:'09:00',finish:'14:30',offline:true,workedRosterLine:'PERTH'}],'2026-10-30');
close(travel.breakdown.additionalHoursPay,449.0244);
close(travel.breakdown.extrasPay,44.37);
close(travel.reimbursements,4.116);
close(travel.taxable,0);
console.log('Payroll correction regressions passed');
