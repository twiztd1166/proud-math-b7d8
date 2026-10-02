import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/app-shows.js','utf8');
if(!source.includes('Planning detail'))throw new Error('Annual card is missing preserved planning-detail disclosure');
if(!source.includes("const legacyPlanningDetail=String(row.legacy_next_action||'').trim()"))throw new Error('Annual card does not read preserved legacy_next_action');
if(!source.includes("!/\\bGMAIL:[A-Za-z0-9_-]+\\b/i.test(legacyPlanningDetail)"))throw new Error('Annual card does not suppress account-specific Gmail draft tokens');
if(!source.includes('function annualPlanIsAuditDuplicate(row)'))throw new Error('Annual plan duplicate-suppression helper missing');
if(!source.includes("if(filter==='AUDIT_DUPLICATES')"))throw new Error('Annual plan audit-duplicates filter missing');
if(!source.includes('if(auditDuplicate)return false'))throw new Error('Normal annual-plan views do not suppress duplicate controls');
if(!source.includes("['AUDIT_DUPLICATES','Audit duplicates '+auditRows.length]"))throw new Error('Audit duplicate filter chip missing');
if(!source.includes("const rows=(p.rows||[]).filter(row=>!annualPlanIsAuditDuplicate(row));"))throw new Error('2027 calendar still counts duplicate-suppressed rows');
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

console.log({
  annual_operational_actions:'PASS',
  email_draft:'PASS',
  call_script:'PASS',
  object_source_url:'PASS',
  duplicate_suppression:'PASS',
});
