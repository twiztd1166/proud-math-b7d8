import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/app-shows.js','utf8');
const calendarSource=fs.readFileSync('public/app-calendar.js','utf8');
const coreSource=fs.readFileSync('public/app-core.js','utf8');
const modalSource=fs.readFileSync('public/app-modals.js','utf8');
const bindSource=fs.readFileSync('public/app-bind.js','utf8');
if(!source.includes('function annualPlanDeadlineRows(horizonDays=45)'))throw new Error('Next Steps 2027 deadline selector missing');
if(!source.includes('function annualPlanDeadlineSection()'))throw new Error('Next Steps 2027 deadline section missing');
if(!source.includes("${annualPlanDeadlineSection()}"))throw new Error('Next Steps does not render 2027 deadline section');
if(!source.includes("No-deadline planning rows stay in Calendar → 2027."))throw new Error('2027 deadline lane does not preserve no-deadline rows in Calendar');
if(!coreSource.includes("state.tab==='today'||state.tab==='calendar'||(state.tab==='shows'&&state.showMode==='PLAN2027')"))throw new Error('Annual plan load completion does not rerender Next Steps');
if(!coreSource.includes("state.tab==='today'||(state.tab==='calendar'&&state.calendarYear===2027)||(state.tab==='shows'&&state.showMode==='PLAN2027')"))throw new Error('Bootstrap does not load annual plan for Next Steps');
if(!modalSource.includes("state.tab==='today'||state.tab==='calendar'||(state.tab==='shows'&&state.showMode==='PLAN2027')"))throw new Error('Primary nav does not load annual plan when opening Next Steps');
if(!bindSource.includes("[data-annual-deadline-plan]"))throw new Error('2027 deadline cards cannot open the matching annual-plan row');
if(!source.includes('Planning detail'))throw new Error('Annual card is missing preserved planning-detail disclosure');
if(!source.includes("const legacyPlanningDetail=String(row.legacy_next_action||'').trim()"))throw new Error('Annual card does not read preserved legacy_next_action');
if(!source.includes("!/\\bGMAIL:[A-Za-z0-9_-]+\\b/i.test(legacyPlanningDetail)"))throw new Error('Annual card does not suppress account-specific Gmail draft tokens');
if(!source.includes('function annualPlanIsAuditDuplicate(row)'))throw new Error('Annual plan duplicate-suppression helper missing');
if(!source.includes("if(filter==='AUDIT_DUPLICATES')"))throw new Error('Annual plan audit-duplicates filter missing');
if(!source.includes('if(auditDuplicate)return false'))throw new Error('Normal annual-plan views do not suppress duplicate controls');
if(!source.includes("['AUDIT_DUPLICATES','Audit duplicates '+auditRows.length]"))throw new Error('Audit duplicate filter chip missing');
if(!source.includes("const rows=(p.rows||[]).filter(row=>!annualPlanIsAuditDuplicate(row));"))throw new Error('Legacy 2027 calendar helper still counts duplicate-suppressed rows');
if(!calendarSource.includes("const rows=(p.rows||[]).filter(row=>!annualPlanIsAuditDuplicate(row));"))throw new Error('Active 2027 calendar renderer still counts duplicate-suppressed rows');
if(!calendarSource.includes("const unscheduledPursue=pursue.filter(row=>calendarMonthNumber(row)===null);"))throw new Error('Active 2027 calendar drops PURSUE rows without a fixed month');
if(!calendarSource.includes('Date TBD / On-demand'))throw new Error('Active 2027 calendar is missing the unscheduled PURSUE section');
if(!source.includes('Duplicate-suppressed legacy controls are preserved for audit/history but hidden from normal planning views'))throw new Error('Annual duplicate-suppression explanation missing');
const start=source.indexOf('function annualPlanSourceUrl');
const end=source.indexOf('function annualPlanMonthKey',start);
if(start<0||end<0)throw new Error('Annual operational helper block not found');
const block=source.slice(start,end);

const sandbox={
  annualPlanDateText: row => row.event_start ? String(row.event_start) : (row.expected_window_text||'2027 date not yet published'),
  annualPlanBudgetText: row => row.budget_min!=null ? ('$'+Number(row.budget_min).toLocaleString('en-US')) : 'Not verified',
  encodeURIComponent,
  URLSearchParams,
};
vm.createContext(sandbox);
vm.runInContext(`${block}
this.api={annualPlanSourceUrl,annualPlanIsAuditDuplicate,annualPlanOutreachProfile,annualPlanEmailDraft,annualPlanCallScript,annualPlanOperationalLabel};
`,sandbox);

const sourceObject=sandbox.api.annualPlanSourceUrl({url:'https://example.com/app',type:'OFFICIAL'});
if(sourceObject!=='https://example.com/app')throw new Error('Object source URL was not normalized');
if(sandbox.api.annualPlanSourceUrl({type:'HISTORY'})!=='')throw new Error('Non-URL evidence object became a link');

if(!sandbox.api.annualPlanIsAuditDuplicate({publication_status:'DUPLICATE_SUPPRESSED_TO_CANONICAL'}))throw new Error('Duplicate-suppressed annual row not recognized');
if(sandbox.api.annualPlanIsAuditDuplicate({publication_status:'OFFICIAL_2027_DATE_VERIFIED'}))throw new Error('Canonical annual row misclassified as audit duplicate');

const emailRow={
  plan_id:'2027-LIFE-011-PRIMARY',
  profile_id:'LIFE-011',
  occurrence_label:'Fort Lauderdale Home Design & Remodeling Show — Jan. 2027',
  event_start:'2027-01-29',
  cost_status:'KNOWN_VERIFIED',
  budget_min:6900,
  operational_action_code:'CONTACT_ORGANIZER',
  operational_contact_email:'adam@example.com',
  operational_contact_cc:'team@example.com',
  legacy_next_action:'Email Adam now. Confirm category eligibility, current price, exact placement/floor plan, payment/cancellation, COI, electric/internet and lead rights. Internal PURSUE note GMAIL:abc123 historical $212,279.',
};
const email=sandbox.api.annualPlanEmailDraft(emailRow);
if(!email||email.email!=='adam@example.com'||email.cc!=='team@example.com'||!email.href.startsWith('mailto:'))throw new Error('Annual email draft missing');
if(!email.href.includes('cc=team%40example.com'))throw new Error('Annual email draft lost CC routing');
for(const expected of ['Fort Lauderdale Home Design','eligibility/category','current all-in price/package','available footprint/placement','payment and cancellation/refund terms','insurance/COI requirements','lead-capture/category/exclusivity rights']){
  if(!email.body.includes(expected))throw new Error(`Annual email missing bespoke item: ${expected}`);
}
for(const forbidden of ['PURSUE','LIFE-011','GMAIL:abc123','$212,279']){
  if(email.body.includes(forbidden)||email.subject.includes(forbidden))throw new Error(`Internal annual planning text leaked externally: ${forbidden}`);
}
if(sandbox.api.annualPlanOperationalLabel(emailRow)!=='CREATE EMAIL DRAFT')throw new Error('Email manager move mismatch');

const callRow={
  plan_id:'2027-LIFE-092-TASTE-FEB',
  occurrence_label:'Galbani Taste of Little Italy — Feb. 5–7, 2027',
  event_start:'2027-02-05',
  cost_status:'QUOTE_REQUIRED',
  operational_action_code:'CONTACT_ORGANIZER',
  operational_contact_phone:'561-427-0500',
  legacy_next_action:'Contact organizer and confirm the current package price, footprint/location, category acceptance, lead-capture rights and payment/cancellation terms.',
};
const call=sandbox.api.annualPlanCallScript(callRow);
if(!call||call.phone!=='561-427-0500'||call.href!=='tel:5614270500')throw new Error('Annual call script missing');
if(!call.script.includes('ONLY ASK / CONFIRM THESE REMAINING ITEMS'))throw new Error('Annual call script lacks focused ask section');
if(sandbox.api.annualPlanOperationalLabel(callRow)!=='CREATE CALL SCRIPT')throw new Error('Call manager move mismatch');

const sourceOnly={
  operational_action_code:'CONTACT_ORGANIZER',
  occurrence_label:'Source-only event',
  legacy_next_action:'Contact organizer for current terms.',
};
if(sandbox.api.annualPlanOperationalLabel(sourceOnly)!=='CONTACT ORGANIZER')throw new Error('Source-only contact label mismatch');

const deadlineStart=source.indexOf('function annualPlanDeadlineRows');
const deadlineEnd=source.indexOf('function renderToday',deadlineStart);
if(deadlineStart<0||deadlineEnd<0)throw new Error('Annual Next Steps deadline helper block not found');
const deadlineBlock=source.slice(deadlineStart,deadlineEnd);
const deadlineSandbox={
  state:{
    annualPlan:{loaded:true,rows:[
      {plan_id:'overdue',plan_year:2027,action_due:'2026-09-01',canonical_event:'Overdue Show',priority:'HIGH',publication_status:'OFFICIAL'},
      {plan_id:'near',plan_year:2027,action_due:'2026-11-02',canonical_event:'Near Show',priority:'HIGH',publication_status:'OFFICIAL'},
      {plan_id:'later',plan_year:2027,action_due:'2027-01-08',canonical_event:'Later Show',priority:'HIGH',publication_status:'OFFICIAL'},
      {plan_id:'nodue',plan_year:2027,action_due:null,canonical_event:'No Due Show',priority:'HIGH',publication_status:'OFFICIAL'},
      {plan_id:'audit',plan_year:2027,action_due:'2026-10-15',canonical_event:'Audit Duplicate',priority:'HIGH',publication_status:'DUPLICATE_SUPPRESSED_TO_CANONICAL'},
    ]},
    payments:[
      {payment_id:'MFC-006|2027|Installment 1|2026-09-01|13000.00',source_instance_id:'MFC-006',due:'2026-09-01'},
      {payment_id:'MFC-006|2028|Installment 2|2027-09-01|13500.00',source_instance_id:'MFC-006',due:'2027-09-01'},
    ],
  },
  researchEasternTodayKey:()=> '2026-10-01',
  researchDateOrdinal:value=>{
    const m=String(value||'').slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m?Math.floor(Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3]))/86400000):null;
  },
  annualPlanIsAuditDuplicate:row=>String(row?.publication_status||'').toUpperCase().includes('DUPLICATE_SUPPRESSED'),
};
vm.createContext(deadlineSandbox);
vm.runInContext(`${deadlineBlock}\nthis.deadlineApi={annualPlanDeadlineRows,annualPlanPaymentMatch};\n`,deadlineSandbox);
const deadlineRows=deadlineSandbox.deadlineApi.annualPlanDeadlineRows();
if(deadlineRows.map(row=>row.plan_id).join(',')!=='overdue,near')throw new Error('2027 deadline lane must include overdue + next-45-day rows only');
if(deadlineSandbox.deadlineApi.annualPlanDeadlineRows(0).map(row=>row.plan_id).join(',')!=='overdue')throw new Error('2027 deadline horizon does not preserve overdue actions');
const matchedPayment=deadlineSandbox.deadlineApi.annualPlanPaymentMatch({
  operational_action_code:'VERIFY_PAYMENT',
  mfc_ids:['MFC-006'],
  action_due:'2026-09-01',
});
if(!matchedPayment||matchedPayment.payment_id!=='MFC-006|2027|Installment 1|2026-09-01|13000.00')throw new Error('2027 payment action did not match exact MFC + due-date control');
if(deadlineSandbox.deadlineApi.annualPlanPaymentMatch({operational_action_code:'REVIEW_DECIDE',mfc_ids:['MFC-006'],action_due:'2026-09-01'})!==null)throw new Error('Non-payment annual action incorrectly matched a payment');
if(!source.includes('data-annual-payment'))throw new Error('2027 payment deadline card is missing direct payment action');
if(!bindSource.includes('[data-annual-payment]'))throw new Error('2027 payment deadline button is not bound to payment modal');

console.log({
  annual_operational_actions:'PASS',
  email_draft:'PASS',
  call_script:'PASS',
  object_source_url:'PASS',
  duplicate_suppression:'PASS',
  next_steps_2027_deadlines:'PASS',
  next_steps_2027_payment_link:'PASS',
});