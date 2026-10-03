import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const api=fs.readFileSync('supabase/functions/shows-api/index.ts','utf8');
const modal=fs.readFileSync('public/app-modals.js','utf8');

const start=api.indexOf('function derive(old: any, u: any) {');
const end=api.indexOf('\n\nDeno.serve',start);
assert.ok(start>=0&&end>start,'payment derive() block not found');
const deriveSource=api.slice(start,end).replace('function derive(old: any, u: any) {','function derive(old,u) {');
const sandbox={dd:()=>10,clears:new Set(['UNVERIFIED','PENDING','CLEARED']),Error,Number,Math,Object};
vm.createContext(sandbox);
vm.runInContext(deriveSource+'\nthis.derive=derive;',sandbox);

const old={
  amount:100,
  due:'2026-10-13',
  posted_amount:100,
  posted_date:'2026-10-01',
  clearing:'CLEARED',
};

const preserved=sandbox.derive(old,{});
assert.equal(preserved.posted_amount,100,'omitted posted_amount must preserve old value');
assert.equal(preserved.posted_date,'2026-10-01','omitted posted_date must preserve old value');
assert.equal(preserved.clearing,'CLEARED','omitted clearing must preserve old value');
assert.equal(preserved.status,'PAID','preserved fully-cleared payment must remain PAID');

const cleared=sandbox.derive(old,{posted_amount:null,posted_date:null,clearing:null});
assert.equal(cleared.posted_amount,null,'explicit blank posted amount must clear old value');
assert.equal(cleared.posted_date,null,'explicit blank posted date must clear old value');
assert.equal(cleared.clearing,null,'explicit blank clearing state must clear old value');
assert.equal(cleared.balance,100,'cleared posting must restore full balance');
assert.equal(cleared.status,'SCHEDULED','cleared future posting must derive scheduled state');

assert.ok(api.includes("String(u.notes||'').length>4000"),'payment API note limit is not 4,000 characters');
assert.ok(api.includes("payment_owner||'').length>120"),'payment API owner limit is not 120 characters');
assert.ok(modal.includes('id="pOwner" maxlength="120"'),'payment-owner UI maxlength missing');
assert.ok(modal.includes('id="pNotes" maxlength="4000"'),'payment-note UI maxlength missing');

console.log(JSON.stringify({
  payment_edit_contract:'PASS',
  preserve_omitted_fields:'PASS',
  clear_explicit_posting_fields:'PASS',
  payment_note_limit:4000,
  payment_owner_limit:120,
}));
