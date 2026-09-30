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

const jupiterAvailability=sandbox.api.researchAvailability({
  research_status:'CURRENT_REVERIFIED',
  detail_data:{booking_status:'BUSINESS EXHIBITOR REGISTRATION ROUTE LIVE · SPONSOR DEADLINE PASSED'},
});
if(jupiterAvailability.code!=='OPEN')throw new Error(`Jupiter live exhibitor route misclassified: ${JSON.stringify(jupiterAvailability)}`);

const brewAvailability=sandbox.api.researchAvailability({
  research_status:'CURRENT_REVERIFIED',
  detail_data:{booking_status:'CURRENT VENDOR AND SPONSOR OPTIONS ACTIVE · $5,000 CAPTAIN SOLD OUT'},
});
if(brewAvailability.code!=='OPEN')throw new Error(`Single sold-out sponsorship tier closed the whole event: ${JSON.stringify(brewAvailability)}`);

const snowAvailability=sandbox.api.researchAvailability({
  research_status:'CURRENT_REVERIFIED',
  detail_data:{booking_status:'CURRENT 2026 BUSINESS SPONSORSHIP ROUTE ACTIVE · NONPROFIT VENDOR SPACES FILLED'},
});
if(snowAvailability.code!=='ALTERNATE')throw new Error(`Closed vendor lane with active sponsor route lost alternate classification: ${JSON.stringify(snowAvailability)}`);

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

const guardText='Reverify current terms before commitment.';
if(!guardText)throw new Error('Guard fixture invalid');

console.log({
  research_action_model:'PASS',
  jupiter_availability:jupiterAvailability.label,
  brew_availability:brewAvailability.label,
  snow_availability:snowAvailability.label,
  structured_review:reviewMove.label,
  late_email:lateMove.label,
  structured_apply:applyMove.label,
});
