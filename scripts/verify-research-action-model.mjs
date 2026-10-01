import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/app-shows.js','utf8');
const genericCardStart=source.indexOf('function nextStepCard(p,lane)');
const genericCardEnd=source.indexOf('function nextStepSection',genericCardStart);
if(genericCardStart<0||genericCardEnd<0)throw new Error('Generic nextStepCard block not found');
const genericCardSource=source.slice(genericCardStart,genericCardEnd);
if(genericCardSource.includes('actionGuard'))throw new Error('Generic nextStepCard illegally references research-only actionGuard');

const researchCardStart=source.indexOf('function researchNextStepCard(row)');
const researchCardEnd=source.indexOf('function researchNextStepSection',researchCardStart);
if(researchCardStart<0||researchCardEnd<0)throw new Error('Research next-step card block not found');
const researchCardSource=source.slice(researchCardStart,researchCardEnd);
if(!researchCardSource.includes("const actionGuard=String(d.operational_guard||'').trim()"))throw new Error('Research next-step card is missing local actionGuard definition');
if(!researchCardSource.includes("const operationalCode=String(d.operational_action_code||'').trim().toUpperCase()"))throw new Error('Research card is missing structured action-code routing');
if(!researchCardSource.includes("const applyButton=applyHref?"))throw new Error('Research card is missing action-aware apply button');
if(!researchCardSource.includes("const inquiryButton=inquiryHref?"))throw new Error('Research card is missing action-aware inquiry button');

const modalSource=fs.readFileSync('public/app-modals.js','utf8');
const researchDetailStart=modalSource.indexOf('function openResearchDetail(id)');
const researchDetailEnd=modalSource.indexOf('function openDetail(id)',researchDetailStart);
if(researchDetailStart<0||researchDetailEnd<0)throw new Error('Research detail block not found');
const researchDetailSource=modalSource.slice(researchDetailStart,researchDetailEnd);
if(!researchDetailSource.includes("const operationalCode=String(d.operational_action_code||'').trim().toUpperCase()"))throw new Error('Research detail is missing structured action-code routing');
if(!researchDetailSource.includes("const applyButton=applyHref?"))throw new Error('Research detail is missing action-aware apply button');
if(!researchDetailSource.includes("const inquiryButton=inquiryHref?"))throw new Error('Research detail is missing action-aware inquiry button');
const start=source.indexOf('function researchAvailability');
const end=source.indexOf('function researchValueSignal',start);
if(start<0||end<0)throw new Error('Research action block not found');

const block=source.slice(start,end);
const sandbox={
  researchEmailDraft: row => /@/.test(String(row?.detail_data?.contact_text||'')) ? {email:'x@example.com'} : null,
  researchCallScript: row => !/@/.test(String(row?.detail_data?.contact_text||'')) ? {phone:'555'} : null,
};
vm.createContext(sandbox);
vm.runInContext(`${block}
this.api={researchAvailability,researchStructuredAction,researchManagerMove};
`,sandbox);

const jupiterRow={
  research_status:'CURRENT_REVERIFIED',
  detail_data:{booking_status:'BUSINESS EXHIBITOR REGISTRATION ROUTE LIVE · SPONSOR DEADLINE PASSED'},
};
const jupiterAvailability=sandbox.api.researchAvailability(jupiterRow);
if(jupiterAvailability.code!=='OPEN')throw new Error(`Live exhibitor route was misclassified by unrelated sponsor deadline: ${JSON.stringify(jupiterAvailability)}`);

const reviewRow={
  disposition:'PURSUE',
  research_status:'CURRENT_REVERIFIED',
  detail_data:{
    operational_action_code:'REVIEW',
    next_action:'Review / decide.',
    booking_status:'CURRENT VENDOR AND SPONSOR OPTIONS ACTIVE · $5,000 CAPTAIN SOLD OUT',
    contact_text:'tcbrewmasters@gmail.com',
  },
};
const reviewMove=sandbox.api.researchManagerMove(reviewRow);
if(reviewMove.label!=='REVIEW / DECIDE')throw new Error(`Structured REVIEW was overridden: ${JSON.stringify(reviewMove)}`);

const lateEmailRow={
  disposition:'PURSUE',
  research_status:'CURRENT_REVERIFIED',
  detail_data:{
    operational_action_code:'EMAIL_DRAFT',
    next_action:'Create email draft for late availability.',
    booking_status:'APPLICATION DEADLINE PASSED · LATE-INVENTORY INQUIRY ONLY',
    contact_text:'vendors@example.com',
  },
};
const lateMove=sandbox.api.researchManagerMove(lateEmailRow);
if(lateMove.label!=='CREATE EMAIL DRAFT — LATE INVENTORY')throw new Error(`Late email action lost urgency: ${JSON.stringify(lateMove)}`);

const applyRow={
  disposition:'PURSUE',
  research_status:'CURRENT_REVERIFIED',
  detail_data:{
    operational_action_code:'APPLY',
    next_action:'Open application / apply.',
    booking_status:'CURRENT SPONSOR OPTIONS ACTIVE · PREMIUM TIER SOLD OUT',
    contact_text:'organizer@example.com',
  },
};
const applyMove=sandbox.api.researchManagerMove(applyRow);
if(applyMove.label!=='OPEN APPLICATION / APPLY')throw new Error(`Structured APPLY was overridden: ${JSON.stringify(applyMove)}`);

const inquiryRow={
  disposition:'WATCH',
  research_status:'CURRENT_REVERIFIED',
  detail_data:{
    operational_action_code:'OPEN_INQUIRY',
    next_action:'Open exhibitor inquiry form.',
    action_url:'https://example.com/inquiry',
    booking_status:'CURRENT EXHIBITOR SPACE INQUIRY ACTIVE',
    contact_text:'organizer@example.com',
  },
};
const inquiryMove=sandbox.api.researchManagerMove(inquiryRow);
if(inquiryMove.label!=='OPEN INQUIRY / REQUEST FORM')throw new Error(`Structured OPEN_INQUIRY was overridden: ${JSON.stringify(inquiryMove)}`);

const reviewAvailability=sandbox.api.researchAvailability(reviewRow);
if(reviewAvailability.code!=='OPEN')throw new Error(`Active vendor/sponsor options were misclassified by one sold-out tier: ${JSON.stringify(reviewAvailability)}`);

const nascarRow={
  research_status:'CURRENT_REVERIFIED',
  detail_data:{booking_status:'CURRENT PARTNERSHIP/CORPORATE INQUIRY OPEN · SELECT FAN HOSPITALITY SOLD OUT/WAITLIST'},
};
const nascarAvailability=sandbox.api.researchAvailability(nascarRow);
if(nascarAvailability.code!=='OPEN')throw new Error(`Open partnership route was misclassified by sold-out hospitality: ${JSON.stringify(nascarAvailability)}`);

const hollywoodRow={
  research_status:'CURRENT_REVERIFIED',
  detail_data:{booking_status:'MERCHANT/INFORMATIONAL APPLICATIONS CLOSED · SPONSORSHIP ROUTE CURRENT'},
};
const hollywoodAvailability=sandbox.api.researchAvailability(hollywoodRow);
if(hollywoodAvailability.code!=='ALTERNATE')throw new Error(`Closed merchant lane with current sponsorship did not stay alternate-only: ${JSON.stringify(hollywoodAvailability)}`);

const snowRow={
  research_status:'CURRENT_REVERIFIED',
  detail_data:{booking_status:'CURRENT 2026 BUSINESS SPONSORSHIP ROUTE ACTIVE · NONPROFIT VENDOR SPACES FILLED'},
};
const snowAvailability=sandbox.api.researchAvailability(snowRow);
if(snowAvailability.code!=='ALTERNATE')throw new Error(`Filled nonprofit vendor lane with active business sponsorship did not stay alternate-only: ${JSON.stringify(snowAvailability)}`);

const confirmOnlyRow={
  research_status:'CURRENT_REVERIFIED',
  detail_data:{booking_status:'CURRENT EXHIBITOR PRODUCT LISTED · AVAILABILITY / CATEGORY TO CONFIRM'},
};
const confirmOnlyAvailability=sandbox.api.researchAvailability(confirmOnlyRow);
if(confirmOnlyAvailability.code!=='CONFIRM')throw new Error(`Unknown availability was mislabeled as limited/open: ${JSON.stringify(confirmOnlyAvailability)}`);

const guardText='Reverify current terms before commitment.';
if(!guardText)throw new Error('Guard fixture invalid');

console.log({
  research_action_model:'PASS',
  jupiter_live_route_with_sponsor_deadline:jupiterAvailability.label,
  structured_review:reviewMove.label,
  late_email:lateMove.label,
  structured_apply:applyMove.label,
  structured_inquiry:inquiryMove.label,
  active_with_one_tier_sold_out:reviewAvailability.label,
  partnership_open_with_hospitality_sold_out:nascarAvailability.label,
  closed_lane_with_active_alternate:hollywoodAvailability.label,
  availability_to_confirm:confirmOnlyAvailability.label,
});
