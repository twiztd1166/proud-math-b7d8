const API='https://taxlrlfsobtnbasjcnuf.supabase.co/functions/v1/shows-api';
const SHEET='https://docs.google.com/spreadsheets/d/1Fyyypme7AYFEUwLbIPPNaixYR7Lwiwegs2hRTu02wYk/edit';
let state={
  shows:[],calendarOpportunities:[],researchCalendarControls:[],payments:[],activity:[],settings:{},
  reconciliation:{summary:{rows:0,aligned:0,changed:0,changed_fields:0},rows:[]},
  sourceRefresh:{latest:null,conflicts:[]},recoveryHealth:null,
  catalog:[],catalogSummary:null,catalogLoaded:false,catalogLoading:false,catalogError:null,catalogLimit:60,deepLinkedProfile:null,deepLinkedYear:null,
  unlinkedLp:{annual:[],cumulative:[],summary:null,category:'ALL',loaded:false,loading:false,error:null},
  annualPlan:{year:2027,rows:[],summary:null,run:null,filter:'ALL',loaded:false,loading:false,error:null},
  calendarYear:2026,
  showMode:'ALL',tab:'today',search:'',showQuickView:'NONE',
  catalogSort:'RECOMMENDED',
  catalogFilters:{
    profileState:'ALL',historyYear:'ALL',lpYear:'ALL',cumulativeLpYear:'ALL',tier:'ALL',historyDepth:'ALL',
    contact:'ANY',booth:'ANY',cost:'ANY',com:'ANY',performance:'ANY',historyPayment:'ANY',application:'ANY',lp:'ANY',cumulativeLp:'ANY',coi:'ANY',worked:'ANY',
    comBand:'ALL',lifetimeNetBand:'ALL',currentCostBand:'ALL',currentCostStatus:'ALL',currentCommitmentStatus:'ALL',currentPlacementStatus:'ALL',currentScheduleStatus:'ALL',currentLogisticsStatus:'ALL',
    currentStatus:'ALL',currentTreatment:'ALL',confirmation:'ALL',currentEventYear:'ALL',
  },
  currentSort:'BOOKING',
  currentFilters:{
    status:'ALL',treatment:'IN PLAY',eventYear:'ALL',timing:'ALL',
    confirmation:'ALL',owner:'ALL',evidence:'ALL',payment:'ALL',costBand:'ALL',followUp:'ANY',
  },
};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function nativeBridgeAvailable(){return Boolean(window.webkit?.messageHandlers?.paradiseNative)}
function nativeBridgePost(action,payload={}){
  try{
    if(!nativeBridgeAvailable())return false;
    window.webkit.messageHandlers.paradiseNative.postMessage({action,...payload});
    return true;
  }catch(_){return false}
}
function nativeHaptic(){nativeBridgePost('haptic')}
function researchEmailAddresses(value){
  return [...new Set((String(value||'').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[]).map(email=>email.trim()))];
}
function researchPhoneNumbers(value){
  return [...new Set((String(value||'').match(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}/g)||[]).map(phone=>phone.trim()))];
}
function researchPhoneHref(phone){
  return 'tel:'+String(phone||'').replace(/[^\d+]/g,'');
}
function researchEmailParticipationLabel(row){
  const d=row?.detail_data&&typeof row.detail_data==='object'?row.detail_data:{};
  const text=[row?.route_type,d.booking_status,d.eligibility_text,d.action_label].filter(Boolean).join(' ').toUpperCase();
  const sponsor=/SPONSOR|PARTNER/.test(text);
  const vendor=/VENDOR/.test(text);
  const exhibitor=/EXHIBITOR/.test(text);
  if(sponsor&&vendor)return 'vendor/sponsorship opportunity';
  if(sponsor&&exhibitor)return 'exhibitor/sponsorship opportunity';
  if(sponsor)return 'sponsorship opportunity';
  if(exhibitor)return 'exhibitor opportunity';
  if(vendor)return 'vendor opportunity';
  return 'participation opportunity';
}
function researchCompactText(value,max=180){
  const text=String(value??'').replace(/\s+/g,' ').trim();
  if(!text)return '';
  return text.length<=max?text:text.slice(0,Math.max(0,max-1)).trimEnd()+'…';
}
function researchFact(value,status='',max=180){
  const text=researchCompactText(value,max);
  if(!text)return null;
  const statusText=String(status||'').trim().toUpperCase();
  const valueText=text.toUpperCase();
  const unavailable=/^(?:NOT VERIFIED|NOT REVERIFIED|UNKNOWN|N\/A|NONE|NOT AVAILABLE)\b/.test(valueText)||
    /^NO (?:CURRENT )?.*\bVERIFIED\b/.test(valueText)||
    /^NOT VERIFIED\b/.test(statusText)||
    /PENDING CURRENT PUBLICATION/.test(statusText);
  if(unavailable)return null;
  const confirm=/TO CONFIRM|MUST BE CONFIRM|RECONFIRM|REVERIFY|NEEDS? CONFIRM|CONFLICT|ESTIMATED|PARTIAL|RECOVERED|NOT SEPARATELY POSTED|NOT VERIFIED|CUSTOM QUOTE|GET QUOTE|TO QUOTE|PRICE TO CONFIRM|TERMS TO CONFIRM|PACKAGE TO QUOTE/.test(statusText+' '+valueText);
  return {text,confirm};
}
function researchExternalHistoryText(value){
  let text=researchCompactText(value,220);
  if(!text)return '';
  const participation=text.match(/^Paradise\s+(?:definitively\s+)?paid and enrolled for\s+(.+?)\s+in\s+(\d{4})\b/i);
  if(participation)return `Paradise participated in ${participation[1]} in ${participation[2]}`;
  text=text.split(/\b(?:Treat as|Do not treat|not net-new)\b/i)[0].trim();
  text=text
    .replace(/\b(?:HIST|PROSPECT|LIFE)-[A-Z0-9_-]+\b/gi,'')
    .replace(/\b(?:in|via|under)\s*,\s*/gi,', ')
    .replace(/\s+,/g,',')
    .replace(/\s*[·|/]\s*$/,'')
    .replace(/\s{2,}/g,' ')
    .trim();
  return text.replace(/[;,.\s]+$/,'').trim();
}
function researchExternalFactText(value){
  const text=String(value||'').trim();
  if(!text)return '';
  const letters=text.replace(/[^A-Za-z]/g,'');
  if(letters&&letters===letters.toUpperCase())return text.charAt(0)+text.slice(1).toLowerCase();
  return text;
}
function researchContactPerson(value){
  const text=String(value||'').trim();
  if(!text)return '';
  const first=text.split(/[·•|;]/)[0].trim();
  const clean=first.replace(/\b(?:email|phone|cell|office)\b.*$/i,'').trim();
  if(!/^[A-Z][A-Za-z'’.-]+(?:\s+[A-Z][A-Za-z'’.-]+){1,2}$/.test(clean))return '';
  if(/\b(?:CITY|COUNTY|TOWN|EVENTS?|OFFICE|PROGRAM|INQUIR(?:Y|IES)|SALES|SPONSORSHIP|VENDOR|PARTNERSHIP|CHAMBER|CENTER|CENTRE|PARKS?|RECREATION|SHOWS?|FAIR|SPEEDWAY|TEAM|MAIN STREET|DEPARTMENT)\b/i.test(clean))return '';
  return clean;
}
function researchFirstName(name){
  return String(name||'').trim().split(/\s+/)[0]||'';
}
function researchOutreachDateLabel(row){
  const explicit=String(row?.date_text||'').trim();
  if(explicit)return explicit;
  if(row?.event_start){
    const range=date(row.event_start)+(row.event_end&&row.event_end!==row.event_start?' – '+date(row.event_end):'');
    return range;
  }
  if(row?.estimated_sort_date)return 'estimated '+date(row.estimated_sort_date);
  return 'date TBD';
}
function researchHasKnownTerm(parts,pattern){
  return parts.filter(Boolean).join(' ').toUpperCase().match(pattern)!==null;
}
function researchOutreachProfile(row){
  const d=row?.detail_data&&typeof row.detail_data==='object'?row.detail_data:{};
  const event=String(row?.event_label||'this event').trim();
  const range=researchOutreachDateLabel(row);
  const route=researchEmailParticipationLabel(row);
  const person=researchContactPerson(d.contact_text);
  const email=researchEmailAddresses(d.contact_text)[0]||'';
  const phone=researchPhoneNumbers(d.contact_text)[0]||'';
  const researchStatus=String(row?.research_status||'').toUpperCase();
  const boundedException=researchStatus.includes('NOT_REVERIFIED');

  const booking=researchFact(d.booking_status||row?.research_status,'',190);
  const eligibility=researchFact(d.eligibility_text,row?.route_type,190);
  const cost=researchFact(d.current_cost_text||row?.price_text,d.current_cost_status,180);
  const deadline=researchFact(
    d.deadline_text||row?.deadline_text||(row?.deadline_date?date(row.deadline_date):''),
    '',
    180
  );
  const venue=researchFact(d.venue_text||row?.city,d.venue_status,180);
  const logistics=researchFact(d.logistics_text,d.logistics_status,190);
  const commitment=researchFact(d.commitment_terms_text,d.commitment_status,180);
  const rawCommitmentText=String(d.commitment_terms_text||'').trim();
  const history=researchFact(d.historical_signal,'',180);
  const attendance=researchFact(d.attendance_text,'',160);

  const historyLooksInternal=history&&/^(?:HIST|PROSPECT|LIFE|R\d{4})[-A-Z0-9_ ·/]+$/i.test(history.text);
  const externalHistory=history?researchExternalHistoryText(history.text):'';
  const positiveHistory=history&&!historyLooksInternal&&externalHistory&&!/NO LINKED|NO PRIOR|NONE FOUND|NOT VERIFIED|NO KNOWN/i.test(history.text)
    ?{text:externalHistory,confirm:Boolean(history.confirm)}
    :null;
  const facts=[];
  const addFact=(label,fact)=>{if(fact&&fact.text)facts.push({label,text:fact.text,confirm:Boolean(fact.confirm)})};
  addFact('Eligibility / route',eligibility);
  addFact('Current booking status',booking);
  addFact('Prior Paradise participation',positiveHistory);
  addFact('Current price / package',cost);
  addFact('Application / commitment timing',deadline);
  addFact('Venue / location',venue);
  addFact('Booth / setup / logistics',logistics);
  addFact('Payment / commitment terms',commitment);
  addFact('Audience / attendance',attendance);

  const questions=[];
  const addQuestion=q=>{if(q&&!questions.includes(q))questions.push(q)};
  const eligibilityContext=[eligibility?.text,booking?.text,d.operational_guard,d.next_action].filter(Boolean);
  const eligibilityNeedsConfirm=researchHasKnownTerm(
    eligibilityContext,
    /\b(?:SUBJECT TO (?:CITY |ORGANIZER )?(?:ACCEPTANCE|APPROVAL)|SELECTION\s*\/\s*APPROVAL REQUIRED|(?:PARADISE(?: EXTERIORS)?|HOME[- ]?IMPROVEMENT|HOME[- ]?SERVICES?)\b.{0,80}\b(?:ELIGIBIL(?:ITY|E)|FIT|ACCEPTANCE|APPROVAL)\b.{0,80}\b(?:CONFIRM|RECONFIRM|VERIFY)|CONFIRM\b.{0,80}\b(?:PARADISE(?: EXTERIORS)?|HOME[- ]?IMPROVEMENT|HOME[- ]?SERVICES?)\b.{0,80}\b(?:ELIGIBIL(?:ITY|E)|FIT|ACCEPTANCE|APPROVAL)|CURATED\b.{0,80}\b(?:FIT|ACCEPTANCE|APPROVAL))\b/
  );
  if(boundedException)addQuestion('Please confirm the event date and current participation route before we rely on the recovered record.');
  if(!eligibility||eligibility.confirm||eligibilityNeedsConfirm)addQuestion('Please confirm Paradise Exteriors is eligible for the stated vendor/sponsor/exhibitor route.');
  if(!cost){
    addQuestion('Please confirm the current price/package and any required deposit.');
  }else if(cost.confirm){
    const costText=String(cost.text||'').toUpperCase();
    const publishedPriceKnown=/\$\s*\d/.test(cost.text)&&!/RECOVERED|NOT CURRENT|NOT VERIFIED|TO CONFIRM|PRICE TO CONFIRM|PACKAGE TO QUOTE|CUSTOM QUOTE|GET QUOTE|TO QUOTE/.test(costText);
    addQuestion(publishedPriceKnown
      ?'Please confirm which published package remains available and any required deposit.'
      :'Please confirm the current price/package and any required deposit.');
  }
  const questionAvailability=typeof researchAvailability==='function'?researchAvailability(row):null;
  const questionAvailabilityCode=String(questionAvailability?.code||'').toUpperCase();
  const questionStatusText=String(d.booking_status||row?.research_status||'').toUpperCase();
  const lateForQuestions=questionAvailabilityCode
    ?questionAvailabilityCode==='LATE'
    :/LATE[- ]INVENTORY|LATE INQUIRY|LATE AVAILABILITY|APPLICATION DEADLINE PASSED|REGISTRATION DEADLINE PASSED|SPONSORSHIP REGISTRATION DEADLINE PASSED/.test(questionStatusText);
  if(!deadline){
    addQuestion(lateForQuestions
      ?'If late participation is possible, please confirm any new cutoff or response deadline.'
      :'Please confirm the current application or commitment deadline.');
  }else if(deadline.confirm){
    const deadlineText=String(deadline.text||'').toUpperCase();
    addQuestion(lateForQuestions||/\bPASSED\b/.test(deadlineText)
      ?'If late participation is possible, please confirm any new cutoff or response deadline.'
      :'Please confirm the current application or commitment deadline.');
  }
  if(!venue||venue.confirm)addQuestion('Please confirm the exact event/booth location or placement.');
  const logisticsHasSetup=researchHasKnownTerm([logistics?.text,commitment?.text],/\b(?:BOOTH|SPACE|FOOTPRINT|SETUP|LOAD[- ]?IN|TENT|TABLE|POWER|ACTIVATION)\b/);
  if(!logistics||logistics.confirm||!logisticsHasSetup)addQuestion('Please confirm the booth/activation footprint plus setup and load-in requirements.');
  const commitmentKnowledge=[commitment?.text,rawCommitmentText].filter(Boolean);
  const paymentTimingKnown=researchHasKnownTerm(commitmentKnowledge,/\b(?:FULL PAYMENT|PAYMENT\s+(?:IS\s+)?(?:DUE|REQUIRED)|DUE\s+(?:UPON|BY)|DEPOSIT|CASHIER(?:'S)? CHECK|MONEY ORDER|ACH|CREDIT CARD|CHECK REQUIRED)\b/);
  const nonRefundKnown=researchHasKnownTerm(commitmentKnowledge,/\b(?:NON[- ]?REFUND\w*|NO REFUND|ALL SALES (?:ARE )?FINAL)\b/);
  const refundTermsKnown=nonRefundKnown||researchHasKnownTerm(commitmentKnowledge,/\b(?:REFUNDS?\s+(?:ONLY|IF|UNLESS|WHEN|WITHIN|AVAILABLE|ISSUED)|CANCELLATION\s+(?:FEE|POLICY|WINDOW|DEADLINE|BY|BEFORE|AFTER))\b/);
  if(!commitment||commitment.confirm){
    const hasKnownCommitmentTerm=paymentTimingKnown||refundTermsKnown||nonRefundKnown;
    if(!hasKnownCommitmentTerm){
      addQuestion('Please confirm payment timing, cancellation/refund terms, and any non-refundable commitment.');
    }else{
      const unresolvedCommitment=[];
      if(!paymentTimingKnown)unresolvedCommitment.push('payment timing and any required deposit');
      if(!refundTermsKnown)unresolvedCommitment.push('cancellation/refund terms');
      if(!nonRefundKnown)unresolvedCommitment.push('whether any payment or commitment is non-refundable');
      if(unresolvedCommitment.length){
        const tail=unresolvedCommitment.length===1
          ?unresolvedCommitment[0]
          :unresolvedCommitment.slice(0,-1).join(', ')+' and '+unresolvedCommitment.at(-1);
        addQuestion('Please confirm '+tail+'.');
      }
    }
  }
  const knownText=[eligibility?.text,booking?.text,logistics?.text,commitment?.text,rawCommitmentText].filter(Boolean);
  if(!researchHasKnownTerm(knownText,/\b(?:COI|INSURANCE|CERTIFICATE OF INSURANCE)\b/))addQuestion('Are there insurance or COI requirements?');
  const restrictionText=[...knownText,cost?.text].filter(Boolean);
  if(!researchHasKnownTerm(restrictionText,/\b(?:EXCLUSIV|RESTRICT|CATEGORY)\w*/))addQuestion('Are there category exclusivity rules or home-improvement/vendor restrictions?');
  const actionCode=String(d.operational_action_code||'').trim().toUpperCase();
  const applicationActionCodes=['EMAIL_THEN_APPLY','CALL_THEN_APPLY'];
  const hasApplicationPath=Boolean(String(d.action_url||'').trim())&&(
    applicationActionCodes.includes(actionCode)||
    /APPL|REGISTER|SIGN.?UP/i.test(String(d.action_label||''))
  );

  const statusText=String(d.booking_status||row?.research_status||'').toUpperCase();
  const availability=typeof researchAvailability==='function'?researchAvailability(row):null;
  const availabilityCode=String(availability?.code||'').toUpperCase();
  const contactThenApply=['EMAIL_THEN_APPLY','CALL_THEN_APPLY'].includes(actionCode);
  const alternate=availabilityCode==='ALTERNATE';
  const outreachRoute=alternate&&/SPONSOR|PARTNER/.test(statusText)?'sponsorship opportunity':route;
  const late=availabilityCode
    ?availabilityCode==='LATE'
    :/LATE[- ]INVENTORY|LATE INQUIRY|LATE AVAILABILITY|APPLICATION DEADLINE PASSED|REGISTRATION DEADLINE PASSED|SPONSORSHIP REGISTRATION DEADLINE PASSED/.test(statusText);
  const availabilityUncertain=boundedException||contactThenApply||!booking||booking.confirm||
    ['LATE','CONFIRM','LIMITED','ALTERNATE','CLOSED','REVERIFY'].includes(availabilityCode)||
    /WAITLIST|SOLD OUT|CLOSED|TO CONFIRM|MUST BE CONFIRMED|INQUIRY|LIMITED|NOT (YET )?PUBLISHED|NOT ESTABLISHED|INACTIVE/.test(statusText);
  return {
    event,range,route:outreachRoute,person,email,phone,boundedException,late,alternate,availabilityUncertain,
    facts:facts.slice(0,7),
    questions:questions.slice(0,8),
    hasApplicationPath,
  };
}
function researchEmailDraft(row){
  const profile=researchOutreachProfile(row);
  if(!profile.email)return null;
  const greeting=profile.person?`Hello ${researchFirstName(profile.person)},`:'Hello,';
  const subject=`Paradise Exteriors — ${profile.event} — ${profile.late?'late availability':profile.route.replace(/ opportunity$/,'')} inquiry`;
  const availabilityLine=profile.late
    ?'We understand the standard deadline may have passed. We are checking whether any late inventory or alternate participation option remains available.'
    :(profile.alternate
      ?`We understand the standard participation lane is closed. We are interested in the currently active ${profile.route} and want to confirm that alternate route before moving forward.`
      :(profile.availabilityUncertain
        ?`We are interested in the ${profile.route} and want to confirm the current availability before moving forward.`
        :`We are interested in the ${profile.route}. Our current research indicates the opportunity is active, and we would like to move toward the correct next step.`));
  const factLines=profile.facts
    .filter(f=>!f.confirm&&f.label!=='Current booking status')
    .map(f=>`• ${f.label}: ${researchExternalFactText(f.text)}`);
  const questionLines=profile.questions.map(q=>`• ${q}`);
  const body=[
    greeting,
    '',
    `I’m reaching out on behalf of Paradise Exteriors regarding ${profile.event} (${profile.range}).`,
    '',
    availabilityLine,
    '',
    factLines.length?'Our current research shows:':'',
    ...factLines,
    factLines.length?'':'',
    questionLines.length?'Rather than repeat items already established, could you please confirm only the remaining points below?':'',
    ...questionLines,
    questionLines.length?'':'',
    profile.late
      ?'If late participation is possible, please let us know the correct way to proceed.'
      :(profile.hasApplicationPath
        ?'If these details are still current, we can use the published application path.'
        :'Once those items are confirmed, please let us know the correct next step.'),
    '',
    'Thank you,',
    'Paradise Exteriors',
  ].filter((line,index,arr)=>line!==''||index===0||arr[index-1]!=='').join('\n').trim();
  return {
    email:profile.email,
    subject,
    body,
    href:`mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    factCount:profile.facts.length,
    questionCount:profile.questions.length,
  };
}
function researchCallScript(row){
  const profile=researchOutreachProfile(row);
  if(profile.email||!profile.phone)return null;
  const askFor=profile.person?`Ask for ${profile.person} if needed.\n\n`:'';
  const opening=profile.late
    ?`Hi, I’m calling on behalf of Paradise Exteriors about ${profile.event} (${profile.range}). We understand the standard deadline may have passed, and I’m checking whether any late inventory or alternate participation option is still available.`
    :(profile.alternate
      ?`Hi, I’m calling on behalf of Paradise Exteriors about ${profile.event} (${profile.range}). We understand the standard participation lane is closed. We’re interested in the currently active ${profile.route}, and I’d like to confirm that alternate route before we move forward.`
      :(profile.availabilityUncertain
        ?`Hi, I’m calling on behalf of Paradise Exteriors about ${profile.event} (${profile.range}). We’re interested in the ${profile.route}, and I’d like to confirm the current availability before we move forward.`
        :`Hi, I’m calling on behalf of Paradise Exteriors about ${profile.event} (${profile.range}). We’re interested in the ${profile.route}. Our notes show the opportunity is active, and I’d like to confirm the next step.`));
  const factLines=profile.facts.map(f=>`• ${f.label}: ${f.text}${f.confirm?' (needs confirmation)':''}`);
  const questionLines=profile.questions.map(q=>`• ${q}`);
  const script=[
    askFor.trim(),
    'CALL OPENING',
    opening,
    '',
    factLines.length?'REFERENCE — ALREADY IN THE SHOW RECORD':'',
    ...factLines,
    factLines.length?'':'',
    questionLines.length?'ONLY ASK / CONFIRM THESE REMAINING ITEMS':'',
    ...questionLines,
    questionLines.length?'':'',
    profile.late
      ?'CLOSE: If late participation is possible, confirm the correct way to proceed and record the outcome in Manager Notes.'
      :(profile.hasApplicationPath
        ?'CLOSE: Confirm the details, use the published application path if still valid, and record the outcome in Manager Notes.'
        :'CLOSE: Confirm the correct next step and record the outcome in Manager Notes.'),
  ].filter((line,index,arr)=>line!==''||index===0||arr[index-1]!=='').join('\n').trim();
  return {
    phone:profile.phone,
    href:researchPhoneHref(profile.phone),
    script,
    factCount:profile.facts.length,
    questionCount:profile.questions.length,
  };
}
async function shareShowSummary(show){
  const event=String(show?.event||'Paradise Shows');
  const eventRange=typeof bookingEventRange==='function'?bookingEventRange(show):[date(show?.event_start),show?.event_end&&show.event_end!==show.event_start?date(show.event_end):''].filter(Boolean).join(' – ');
  const next=String(show?.follow_up||'').trim();
  const text=[eventRange,next?('Next action: '+next):''].filter(Boolean).join('\n');
  const profile=typeof currentProfileForShow==='function'?currentProfileForShow(show):null;
  const route=profile?.profile_id?('#show/'+encodeURIComponent(profile.profile_id)):'#current';
  const nativeUrl='paradiseshows://shows';
  const webUrl='https://paradise-shows-public.proud-math-b7d8.pages.dev/'+route;
  if(nativeBridgePost('share',{title:event,text,url:nativeUrl}))return true;
  if(navigator.share){
    try{await navigator.share({title:event,text,url:webUrl});return true}catch(error){if(error?.name==='AbortError')return false}
  }
  try{await navigator.clipboard.writeText([event,text,webUrl].filter(Boolean).join('\n'));toast('Show summary copied');return true}catch(_){return false}
}
function isLpSourceOnly(p){
  return Array.isArray(p?.source_rows)&&p.source_rows.some(r=>r&&r.source_kind==='LP_SOURCE_ONLY');
}

const SHOW_VIEW_STORAGE='paradise-shows-view-v1';
const SHOW_SEARCH_SESSION='paradise-shows-search-v1';
const SHOW_CATALOG_FILTER_KEYS=['profileState','historyYear','lpYear','cumulativeLpYear','tier','historyDepth','contact','booth','cost','com','performance','historyPayment','application','lp','cumulativeLp','coi','worked','comBand','lifetimeNetBand','currentCostBand','currentCostStatus','currentCommitmentStatus','currentPlacementStatus','currentScheduleStatus','currentLogisticsStatus','currentStatus','currentTreatment','confirmation','currentEventYear'];
const SHOW_CURRENT_FILTER_KEYS=['status','treatment','eventYear','timing','confirmation','owner','evidence','payment','costBand','followUp'];
const SHOW_CATALOG_SORTS=['RECOMMENDED','BOOKING_DECISION','CRITICAL_DEADLINE','CURRENT_FIRST','NEXT_OPPORTUNITY','CURRENT_COST_LOW','CURRENT_COST_HIGH','NAME_ASC','NAME_DESC','LATEST_HISTORY','HISTORY_DEPTH','HISTORY_RECORDS','OCCURRENCES','WORKED_YEARS','LOWEST_COM','HIGHEST_COM','LIFETIME_NET','LIFETIME_SALES','CLOSE_VOLUME','ISSUED','NET_2025','NET_2024','DATA_COMPLETE','MISSING_DATA'];
const SHOW_CURRENT_SORTS=['PRIORITY','BOOKING','EVENT_ASC','EVENT_DESC','ACTION_DUE','STATUS','COST_LOW','COST_HIGH','NAME_ASC','NAME_DESC','OWNER','CONFIRMATION','EVIDENCE','PAYMENT'];
const SHOW_QUICK_VIEWS=['NONE','ALL_LIVE_REBOOK','ALL_RESOLUTION_PARADISE_ACTION','ALL_RESOLUTION_ORGANIZER_RESPONSE','ALL_RESOLUTION_WAIT_PUBLICATION','ALL_RESOLUTION_RECONCILE_EXISTING','ALL_READY_COMMIT','ALL_PREBOOK_REQUIRED','ALL_WATCH_GATED_LIVE','ALL_HOLD_RECONCILE_LIVE','ALL_ACT_NOW','ALL_ACT_LATER','ALL_QUOTE_REQUIRED','ALL_NO_PRIOR_PLACEMENT','ALL_REBOOK','ALL_HISTORICAL_OUTREACH','ALL_REBOOK_PURSUE','ALL_REBOOK_WATCH','ALL_REBOOK_HOLD','ALL_HISTORICAL_2013','ALL_TOP_NET','ALL_LOW_COM','ALL_MISSING','ALL_HIST_ONLY','ALL_LP_SOURCE_ONLY','ALL_CURRENT_LINKED','CURRENT_BOOK_NOW','CURRENT_COMMITTED','CURRENT_WATCH','CURRENT_IN_PLAY','CURRENT_DUE7','CURRENT_EVIDENCE','CURRENT_NO_DATE','CURRENT_COST_HIGH'];

function persistedString(v,max=120){return typeof v==='string'?v.slice(0,max):null}
function restoreShowViewState(){
  try{
    const raw=localStorage.getItem(SHOW_VIEW_STORAGE);
    const saved=raw?JSON.parse(raw):null;
    if(saved&&saved.v===1){
      if(['ALL','CURRENT','UNLINKED','PLAN2027'].includes(saved.showMode))state.showMode=saved.showMode;
      if([2026,2027].includes(Number(saved.calendarYear)))state.calendarYear=Number(saved.calendarYear);
      if(SHOW_QUICK_VIEWS.includes(saved.showQuickView))state.showQuickView=saved.showQuickView;
      if(state.showQuickView.startsWith('ALL_')&&state.showMode!=='ALL')state.showQuickView='NONE';
      if(state.showQuickView.startsWith('CURRENT_')&&state.showMode!=='CURRENT')state.showQuickView='NONE';
      if(state.showMode==='UNLINKED'||state.showMode==='PLAN2027')state.showQuickView='NONE';
      if(SHOW_CATALOG_SORTS.includes(saved.catalogSort))state.catalogSort=saved.catalogSort;
      if(SHOW_CURRENT_SORTS.includes(saved.currentSort))state.currentSort=saved.currentSort;
      if(saved.catalogFilters&&typeof saved.catalogFilters==='object'){
        for(const key of SHOW_CATALOG_FILTER_KEYS){
          const value=persistedString(saved.catalogFilters[key]);
          if(value!==null)state.catalogFilters[key]=value;
        }
      }
      if(saved.currentFilters&&typeof saved.currentFilters==='object'){
        for(const key of SHOW_CURRENT_FILTER_KEYS){
          const value=persistedString(saved.currentFilters[key]);
          if(value!==null)state.currentFilters[key]=value;
        }
      }
    }
  }catch{}
  try{
    const search=sessionStorage.getItem(SHOW_SEARCH_SESSION);
    if(search!==null)state.search=search.slice(0,240);
  }catch{}
}
function persistShowViewState(){
  try{
    localStorage.setItem(SHOW_VIEW_STORAGE,JSON.stringify({
      v:1,
      showMode:state.showMode,
      calendarYear:state.calendarYear,
      showQuickView:state.showQuickView,
      catalogSort:state.catalogSort,
      currentSort:state.currentSort,
      catalogFilters:Object.fromEntries(SHOW_CATALOG_FILTER_KEYS.map(key=>[key,state.catalogFilters[key]])),
      currentFilters:Object.fromEntries(SHOW_CURRENT_FILTER_KEYS.map(key=>[key,state.currentFilters[key]])),
    }));
  }catch{}
  try{sessionStorage.setItem(SHOW_SEARCH_SESSION,String(state.search||'').slice(0,240))}catch{}
}
restoreShowViewState();
function applyLocationView(){
  const raw=String(location.hash||'').replace(/^#/,'');
  const hash=raw.toLowerCase();
  const profileMatch=raw.match(/^show\/((?:LIFE|HIST|CURRENT)-\d{3}|LPONLY-\d{4}-\d{3}|PROSPECT-[A-Z0-9-]+)(?:\/year\/(20\d{2}))?$/i);
  const calendarMatch=raw.match(/^calendar\/(2026|2027)$/i);
  if(profileMatch){state.tab='shows';state.showMode='ALL';state.deepLinkedProfile=profileMatch[1].toUpperCase();state.deepLinkedYear=profileMatch[2]?Number(profileMatch[2]):null}
  else if(calendarMatch){state.tab='calendar';state.calendarYear=Number(calendarMatch[1]);state.deepLinkedProfile=null;state.deepLinkedYear=null}
  else if(hash==='shows'){state.tab='shows';state.showMode='ALL';state.deepLinkedProfile=null;state.deepLinkedYear=null}
  else if(hash==='current'){state.tab='shows';state.showMode='CURRENT';state.deepLinkedProfile=null;state.deepLinkedYear=null}
  else if(hash==='plan2027'){state.tab='shows';state.showMode='PLAN2027';state.deepLinkedProfile=null;state.deepLinkedYear=null}
  else if(hash==='unlinked'){state.tab='shows';state.showMode='UNLINKED';state.deepLinkedProfile=null;state.deepLinkedYear=null}
  else if(['today','calendar','payments','control'].includes(hash)){state.tab=hash;state.deepLinkedProfile=null;state.deepLinkedYear=null}
}
function syncLocationView(){
  const hash=state.deepLinkedProfile
    ?'show/'+state.deepLinkedProfile+(Number.isFinite(Number(state.deepLinkedYear))&&Number(state.deepLinkedYear)>=2000?'/year/'+Number(state.deepLinkedYear):'')
    :(state.tab==='shows'
      ?(state.showMode==='CURRENT'?'current':state.showMode==='PLAN2027'?'plan2027':state.showMode==='UNLINKED'?'unlinked':'shows')
      :state.tab==='calendar'?'calendar/'+state.calendarYear:state.tab);
  try{history.replaceState(null,'','#'+hash)}catch{}
}
function ensureActiveRouteData(){
  const prospectRoute=String(state.deepLinkedProfile||'').startsWith('PROSPECT-');
  if((state.tab==='today'||(state.tab==='shows'&&['ALL','CURRENT'].includes(state.showMode)))&&!state.catalogLoaded&&!state.catalogLoading)loadCatalog();
  if(state.tab==='shows'&&state.showMode==='UNLINKED'&&!state.unlinkedLp.loaded&&!state.unlinkedLp.loading)loadUnlinkedLp();
  if((state.tab==='today'||(state.tab==='calendar'&&state.calendarYear===2027)||(state.tab==='shows'&&state.showMode==='PLAN2027')||prospectRoute)&&!state.annualPlan.loaded&&!state.annualPlan.loading)loadAnnualPlan();
}
function openDeepLinkedProfileIfReady(){
  const id=String(state.deepLinkedProfile||'').trim();
  if(!id||typeof openCatalog!=='function')return;
  const prospect=id.startsWith('PROSPECT-');
  if(prospect&&!state.annualPlan.loaded)return;
  if(!prospect&&!state.catalogLoaded)return;
  const modalOpen=document.querySelector('#detailModal')?.classList.contains('show');
  if(modalOpen&&state.deepLinkRenderedProfile===id)return;
  state.deepLinkRenderedProfile=id;
  openCatalog(id,state.deepLinkedYear);
}
function activateLocationView(){
  applyLocationView();
  state.deepLinkRenderedProfile=null;
  if(typeof render==='function')render();
  ensureActiveRouteData();
  openDeepLinkedProfileIfReady();
  try{window.scrollTo(0,0)}catch{}
}
window.addEventListener('hashchange',activateLocationView);
applyLocationView();

function appRequestHeaders(){
  return {'Content-Type':'application/json'};
}
async function startApp(){
  const bottom=document.querySelector('.bottom');
  if(bottom)bottom.style.display='';
  await bootstrap();
}
async function call(action,payload={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const headers=appRequestHeaders();
    const r=await fetch(API,{method:'POST',headers,body:JSON.stringify({action,...payload}),signal:controller.signal});
    const j=await r.json().catch(()=>({ok:false,error:'Invalid response'}));
    if(!r.ok||!j.ok){
      const error=new Error(j.error||'Request failed');error.status=r.status;throw error;
    }
    return j;
  }catch(e){
    if(e&&e.name==='AbortError')throw new Error('Request timed out. Tap Reload to try again.');
    throw e;
  }finally{clearTimeout(timer)}
}
async function callWrite(action,payload={}){
  return call(action,payload);
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function money(v){if(v===null||v===undefined||v==='')return '—';const n=Number(v);return Number.isFinite(n)?n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}):v}
function date(v){if(!v)return '—';const d=new Date(v+'T12:00:00');return isNaN(d)?v:d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function badgeClass(s){return ({'RECONCILE':'reconcile','DATE ONLY':'dateonly','HOLD':'hold','READY':'ready','OPEN':'open'})[s]||'hold'}
function daysFromToday(v){if(!v)return null;const t=new Date();t.setHours(0,0,0,0);const d=new Date(v+'T12:00:00');return Math.round((d-t)/86400000)}
function dueClass(v){const n=daysFromToday(v);return n===null?'':n<0?'over':n<=3?'soon':''}
function dueLabel(v){const n=daysFromToday(v);if(n===null)return 'No action date';if(n<0)return `Overdue · ${Math.abs(n)}d`;if(n===0)return 'Today';if(n===1)return 'Tomorrow';return date(v)}
function activeActions(){return state.shows.filter(s=>{const n=daysFromToday(s.action_due);return s.action_due&&s.follow_up&&s.follow_up!=='—'&&s.this_year!=='SKIP THIS YEAR'&&n!==null&&n<=7}).sort((a,b)=>a.action_due.localeCompare(b.action_due))}
function paymentAttention(){return state.payments.filter(p=>p.status!=='PAID'&&(p.due_status==='OVERDUE'||p.due_status==='DUE TODAY'||p.due_status==='DUE ≤7 DAYS'||p.status==='PARTIAL'||p.status==='HOLD / REVIEW')).sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999')))}
function paymentPill(p){const s=String(p.status||'SCHEDULED');const c=s==='PAID'?'paid':s==='PARTIAL'?'partial':s.includes('HOLD')?'review':'';return `<span class="pill ${c}">${esc(s)}</span>`}
function activityName(a){if(a.kind==='show'){const s=state.shows.find(x=>x.mfc_id===a.mfc_id);return s?`${s.event} · ${a.mfc_id}`:a.mfc_id}const p=state.payments.find(x=>x.payment_id===a.payment_id);return p?`${p.event} · ${p.installment}`:'Payment'}
function fieldLabel(f){return ({show_status:'Status',follow_up:'Next action',owner:'Owner',action_due:'Action due',this_year:'This year',skip_reason:'Skip reason',posted_amount:'Posted amount',posted_date:'Posted date',clearing:'Clearing',payment_owner:'Payment owner',notes:'Operating note',balance:'Balance',status:'Payment status',approval:'Approval',due_status:'Due status',__NEW_SOURCE_ROW__:'New Sheet row',__MISSING_SOURCE_ROW__:'Missing Sheet row',__BASELINE_MISSING__:'Baseline missing'})[f]||f}



async function loadUnlinkedLp(force=false){
  const u=state.unlinkedLp;
  if(u.loading||(!force&&u.loaded))return;
  u.loading=true;u.error=null;
  if(state.tab==='shows'&&state.showMode==='UNLINKED')render();
  try{
    const d=await call('catalogUnlinked');
    u.annual=d.annual||[];u.cumulative=d.cumulative||[];u.summary=d.summary||null;if(!state.catalogSummary&&d.run)state.catalogSummary=d.run;u.loaded=true;
  }catch(e){
    u.error=e.message||'Unable to load unlinked LeadPerfection evidence.';
    toast('Unlinked LeadPerfection evidence unavailable');
  }finally{
    u.loading=false;
    if(state.tab==='shows'&&state.showMode==='UNLINKED')render();
  }
}
async function loadAnnualPlan(force=false){
  const p=state.annualPlan;
  if(p.loading||(!force&&p.loaded))return;
  p.loading=true;p.error=null;
  if(state.tab==='today'||state.tab==='calendar'||(state.tab==='shows'&&state.showMode==='PLAN2027'))render();
  try{
    const d=await call('annualPlan',{year:p.year});
    p.rows=d.rows||[];p.summary=d.summary||null;p.run=d.run||null;p.loaded=true;
  }catch(e){
    p.error=e.message||'Unable to load the 2027 annual plan.';
    toast('2027 annual plan unavailable');
  }finally{
    p.loading=false;
    if(state.tab==='today'||state.tab==='calendar'||(state.tab==='shows'&&state.showMode==='PLAN2027'))render();
    openDeepLinkedProfileIfReady();
  }
}
async function loadCatalog(force=false){
  if(state.catalogLoading||(!force&&state.catalogLoaded))return;
  state.catalogLoading=true;state.catalogError=null;
  if(state.tab==='shows')render();
  try{
    const d=await call('catalog');
    state.catalog=d.profiles||[];state.catalogSummary=d.summary||null;state.catalogLoaded=true;state.catalogLimit=60;
  }catch(e){
    state.catalogError=e.message||'Unable to load full show database.';
    toast('Full show database unavailable');
  }finally{
    state.catalogLoading=false;
    if(state.tab==='today'||state.tab==='shows')render();
    openDeepLinkedProfileIfReady();
  }
}

async function bootstrap(){
  try{
    const d=await call('bootstrap');state.shows=d.shows;state.calendarOpportunities=d.calendarOpportunities||[];state.researchCalendarControls=d.researchCalendarControls||[];state.payments=d.payments;state.activity=d.activity||[];state.settings=d.settings||{};state.reconciliation=d.reconciliation||{summary:{rows:0,aligned:0,changed:0,changed_fields:0},rows:[]};state.sourceRefresh=d.sourceRefresh||{latest:null,conflicts:[]};state.recoveryHealth=d.recoveryHealth||null;
    const sr=state.sourceRefresh.latest;$('#asOf').textContent=sr?`Operating DB · Sheet checked ${sr.source_as_of}`:`Operating DB · source snapshot ${state.settings.snapshot_as_of||'not set'}`;render();
    ensureActiveRouteData();
  }catch(e){
    toast(e.message);$('#content').innerHTML='<div class="empty">Unable to load current operating data.</div>'
  }
}

