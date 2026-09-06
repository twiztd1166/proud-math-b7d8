function supplementalEvidenceLinks(h){
  const f=h&&h.source_fields&&typeof h.source_fields==='object'?h.source_fields:{};
  const items=[];
  if(Array.isArray(f.supplemental_participation_evidence))items.push(...f.supplemental_participation_evidence);
  if(f.supplemental_payment_evidence&&typeof f.supplemental_payment_evidence==='object')items.push({...f.supplemental_payment_evidence,evidence_type:f.supplemental_payment_evidence.evidence_type||'PAYMENT_EVIDENCE'});
  return items.filter(x=>x&&x.gmail_url).map((x,i)=>{
    const kind=String(x.evidence_type||`EVIDENCE_${i+1}`).replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
    return `<a class="btn secondary sourceBtn" target="_blank" href="${esc(x.gmail_url)}">Open ${esc(kind)}</a>`;
  }).join('');
}
function historySourceUrl(h){
  if(h.source_system==='GMAIL_CALENDAR'&&h.source_locator)return h.source_locator;
  const key=`${h.source_spreadsheet_id}|${h.source_tab}`;
  const gids={
    '1UTZlRC6irD-jgGm_N5hpexAT2PvBuCZ_A5KFV8AtWbw|East Coast 2021':'437979327',
    '1Fyyypme7AYFEUwLbIPPNaixYR7Lwiwegs2hRTu02wYk|East Coast 2022':'1053945701',
    '1Fyyypme7AYFEUwLbIPPNaixYR7Lwiwegs2hRTu02wYk|East Coast DND 2022':'1908346327',
    '1iwWYuT7pEBSpIoTnSl5VIw6A6lBufGu_VBBeqP2Ew9o|East Coast DND 2022':'439834478',
    '1oaqIgiElrKX3qF2yNcVjyehwwuVrV8hrKVdNItJkHoU|Von East Coast 22':'439834478',
    '10AG0WAfmNvOt44Mk0QJ0I72oRmKMMuROFFb4aV8oVfc|June':'0',
    '10AG0WAfmNvOt44Mk0QJ0I72oRmKMMuROFFb4aV8oVfc|July':'1824473511',
    '10AG0WAfmNvOt44Mk0QJ0I72oRmKMMuROFFb4aV8oVfc|August':'209663882',
    '10AG0WAfmNvOt44Mk0QJ0I72oRmKMMuROFFb4aV8oVfc|September':'101522836',
    '10AG0WAfmNvOt44Mk0QJ0I72oRmKMMuROFFb4aV8oVfc|October':'120693532'
  };
  const gid=gids[key]||'';const last=h.source_kind==='PAYMENT_TRACKER'?'J':h.source_year===2025?'AE':'M';
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(h.source_spreadsheet_id)}/edit${gid!==''?`#gid=${gid}&range=A${h.source_row}:${last}${h.source_row}`:''}`;
}
function historyEvidenceFlag(x){
  if(x.source_kind==='DND_OPPORTUNITY')return '<div class="historyFlag dnd">DID NOT DO · preserved opportunity</div>';
  if(x.source_kind==='PAYMENT_TRACKER')return '<div class="historyFlag tracker">2024 payment / calendar tracker</div>';
  if(x.source_kind==='BOOKING_CALENDAR'&&String(x.participation_status||'').startsWith('DID NOT PARTICIPATE'))return '<div class="historyFlag dnd">DID NOT PARTICIPATE · preserved cancellation</div>';
  if(x.source_kind==='BOOKING_CALENDAR')return '<div class="historyFlag tracker">2023 internal booking calendar · not completion evidence</div>';
  if(x.source_kind==='GMAIL_EVENT_EVIDENCE'&&String(x.participation_status||'').startsWith('WORKED'))return '<div class="historyFlag confirmed">2023 Gmail evidence · participation expressly supported</div>';
  if(x.source_kind==='GMAIL_EVENT_EVIDENCE')return '<div class="historyFlag evidence">2023 Gmail event evidence · read source before inferring attendance</div>';
  return '';
}

const HISTORY_MISSING='Not found in preserved source';
function normalizeSourceFieldKey(key){return String(key??'').toLowerCase().replace(/\\s+/g,' ').trim()}
function sourceFieldValue(row,keys){
  const fields=row&&row.source_fields&&typeof row.source_fields==='object'?row.source_fields:{};
  for(const key of keys){const value=fields[key];if(value!==null&&value!==undefined&&String(value).trim())return String(value).trim()}
  const wanted=new Set(keys.map(normalizeSourceFieldKey));
  for(const [fieldKey,value] of Object.entries(fields)){
    if(wanted.has(normalizeSourceFieldKey(fieldKey))&&value!==null&&value!==undefined&&String(value).trim())return String(value).trim();
  }
  return '';
}
function sourceSemanticState(value){
  const text=String(value??'').trim();
  if(!text)return 'MISSING';
  const normalized=text.toLowerCase();
  const naTokens=['n/a','na','not applicable','none'];
  if(naTokens.some(token=>normalized===token||normalized.startsWith(token+' ')))return 'NA';
  const unknownTokens=['unknown','unk','not known','not found','not available','missing','tbd','unavailable','not calculated','not calculable','cannot calculate'];
  if(unknownTokens.some(token=>normalized===token||normalized.startsWith(token+' '))||['?','—','-'].includes(normalized))return 'UNKNOWN';
  return 'VALUE';
}
function historyContactValue(row){return String(row?.contact||sourceFieldValue(row,['CONTACT INFO','CONTACT_NAME','CONTACT'])||'').trim()}
function historyBoothValue(row){return String(row?.booth||sourceFieldValue(row,['BOOTH / SPACE LOCATION','BOOTH #'])||'').trim()}
function historyCostValue(row){return String(row?.final_cost_text||row?.event_cost_text||sourceFieldValue(row,['FINAL / NEGOTIATED COST','FINAL NEGOTIATED COST','EVENT COST','COST'])||'').trim()}
function governedStatusStateValue(value){
  const text=String(value??'').trim();
  if(!text)return '';
  const upper=text.toUpperCase();
  const naMarkers=['AGGREGATED','BUNDLE AGGREGATE','DO NOT DOUBLE COUNT','NO EVENT-SPECIFIC','DO NOT ALLOCATE','MONTH-RESOLVED ELSEWHERE','MAPS TO '];
  return naMarkers.some(marker=>upper.includes(marker))?'N/A — '+text:'UNKNOWN — '+text;
}
function historyCostStateValue(row){
  const value=historyCostValue(row);
  if(value)return value;
  const verification=sourceFieldValue(row,['VERIFICATION STATUS']);
  const upper=verification.toUpperCase();
  if(upper.includes('COST UNVERIFIED')||upper.includes('COST UNKNOWN')||upper.includes('COST NOT RECOVERED'))return 'UNKNOWN — '+verification;
  return '';
}
function historyPerformancePresent(row){
  return ['issued_appts','demos','gross_sales_count','gross_sales_value','net_sales_count','net_revenue','nsli']
    .some(field=>row?.[field]!==null&&row?.[field]!==undefined&&String(row[field]).trim()!=='');
}
function historyPerformanceStateValue(row){
  if(historyPerformancePresent(row))return 'PRESENT';
  return governedStatusStateValue(sourceFieldValue(row,['PERFORMANCE MATCH STATUS']));
}
function historyEventComValue(row){
  if(row?.com_percent!==null&&row?.com_percent!==undefined&&String(row.com_percent).trim()!=='')return String(row.com_percent).trim()+'%';
  return sourceFieldValue(row,['COM % (EVENT COST ÷ NET REV)']);
}
function historyComStateValue(row){
  const value=historyEventComValue(row);
  if(value)return value;
  const performanceState=historyPerformanceStateValue(row);
  if(sourceSemanticState(performanceState)==='NA')return 'N/A — performance not separately attributable';
  if(sourceSemanticState(performanceState)==='UNKNOWN')return 'UNKNOWN — performance attribution unresolved';
  return governedStatusStateValue(sourceFieldValue(row,['FULL COM STATUS']));
}
function historyDirectSetupCostValue(row){return sourceFieldValue(row,['DIRECT + SETUP COST'])}
function historyDirectSetupComValue(row){return sourceFieldValue(row,['DIRECT + SETUP COM %'])}
function completenessText(rows,getter){
  if(!rows.length)return 'No preserved history records';
  const counts={VALUE:0,UNKNOWN:0,NA:0,MISSING:0};
  rows.forEach(row=>{counts[sourceSemanticState(getter(row))]++});
  const parts=[counts.VALUE+' value'+(counts.VALUE===1?'':'s')];
  if(counts.UNKNOWN)parts.push(counts.UNKNOWN+' explicit unknown');
  if(counts.NA)parts.push(counts.NA+' N/A');
  if(counts.MISSING)parts.push(counts.MISSING+' missing');
  return parts.join(' · ');
}
function metricCompletenessText(rows){
  return completenessText(rows,historyPerformanceStateValue);
}
function missingValue(){return '<span class="yearMissing">'+HISTORY_MISSING+'</span>'}
function uniqueText(values){
  const seen=new Set(),out=[];
  for(const value of values){const text=String(value??'').trim();if(text&&!seen.has(text)){seen.add(text);out.push(text)}}
  return out;
}
function plainValues(rows,getter,formatter=v=>esc(v)){
  const values=uniqueText(rows.map(getter));
  if(!values.length)return missingValue();
  return values.map(value=>`<div class="yearPlainValue"><b>${formatter(value)}</b></div>`).join('');
}
function datedValues(rows,getter,formatter=v=>esc(v)){
  const values=[];
  for(const row of rows){
    const raw=getter(row);
    if(raw===null||raw===undefined||String(raw).trim()==='')continue;
    const dateLabel=String(row.dates_text||'Date not stated').trim();
    const key=dateLabel+'|'+String(raw).trim();
    if(values.some(x=>x.key===key))continue;
    values.push({key,dateLabel,value:formatter(raw)});
  }
  if(!values.length)return missingValue();
  return values.map(x=>`<div class="yearValueLine"><span>${esc(x.dateLabel)}</span><b>${x.value}</b></div>`).join('');
}
function numericYearTotal(rows,field,formatter=v=>esc(v)){
  const values=rows.map(row=>Number(row[field])).filter(Number.isFinite);
  if(!values.length)return missingValue();
  const total=values.reduce((sum,value)=>sum+value,0);
  const coverage=values.length<rows.length?`<small>${values.length}/${rows.length} records</small>`:'';
  return `<strong>${formatter(total)}</strong>${coverage}`;
}
function comYearValues(rows){
  return datedValues(rows,row=>historyComStateValue(row),v=>esc(v));
}
function sourceFieldYearValues(rows,keys){
  return datedValues(rows,row=>sourceFieldValue(row,keys),v=>esc(v));
}
function contactActions(value){
  const text=String(value||'');
  const emails=uniqueText(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[]);
  const phones=uniqueText(text.match(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?:\s*(?:x|ext\.?)\s*\d+)?/gi)||[]);
  if(!emails.length&&!phones.length)return '';
  return `<div class="contactActions">${phones.map(phone=>{const dial=phone.replace(/[^\d+]/g,'');return `<a class="contactBtn" href="tel:${esc(dial)}">Call ${esc(phone)}</a>`}).join('')}${emails.map(email=>`<a class="contactBtn" href="mailto:${esc(email)}">Email ${esc(email)}</a>`).join('')}</div>`;
}
function contactYearValues(rows){
  const values=[];
  for(const row of rows){
    const contact=historyContactValue(row);
    if(!contact)continue;
    const key=String(row.dates_text||'Date not stated')+'|'+contact;
    if(values.some(x=>x.key===key))continue;
    values.push({key,row,contact});
  }
  if(!values.length)return missingValue();
  return values.map(x=>`<div class="yearContactLine"><span>${esc(x.row.dates_text||'Date not stated')}</span><div><b>${esc(x.contact)}</b>${contactActions(x.contact)}</div></div>`).join('');
}
function lpYearHtml(items){
  if(!items.length)return '<div class="yearLpEmpty">No LeadPerfection performance source is linked to this year.</div>';
  return items.map(x=>{
    const reports=(Array.isArray(x.report_months)?x.report_months:[]).filter(m=>m.gmail_url);
    const reportHtml=reports.length?`<details class="sourceReports"><summary>Source reports · ${reports.length} month${reports.length===1?'':'s'}</summary><div class="reportLinkList">${reports.map(m=>`<a class="btn secondary sourceBtn" target="_blank" href="${esc(m.gmail_url)}">Open ${esc(m.month||'LP report')}</a>`).join('')}</div></details>`:'';
    return `<div class="yearLpCard"><div class="yearLpHead"><b>${esc(x.source_label||'LeadPerfection')}</b><span>${esc(String(x.match_status||'').replaceAll('_',' '))}</span></div><div class="yearMetricGrid compact"><div><span>Issued</span><b>${esc(x.issued??'—')}</b></div><div><span>Opportunities</span><b>${esc(x.opportunities??'—')}</b></div><div><span>Demos</span><b>${esc(x.demos??'—')}</b></div><div><span>Close sales</span><b>${esc(x.close_sales_count??'—')}</b></div><div class="wide"><span>Close volume</span><b>${money(x.close_sales_volume)}</b></div></div>${x.verification_status?`<div class="yearVerification">${esc(x.verification_status)}</div>`:''}${reportHtml}</div>`;
  }).join('');
}
function cumulativeLpStatus(value){
  const status=String(value||'').toUpperCase();
  if(status==='EXACT_UNCHANGED')return 'Exact annual match';
  if(status==='MATURED')return 'Matured in cumulative';
  if(status==='CUMULATIVE_ONLY')return 'Cumulative only';
  return status?status.replaceAll('_',' '):'Cumulative attribution';
}
function cumulativeLpYearHtml(items){
  if(!items.length)return '<div class="yearLpEmpty">No 2012–2026 cumulative/lifetime LeadPerfection attribution is linked to this year.</div>';
  return items.map(x=>{
    const sourceUrl=String(x.source_report_url||'').trim();
    const sourceLink=sourceUrl?`<div class="actions"><a class="btn secondary sourceBtn" target="_blank" href="${esc(sourceUrl)}">Open 2012–2026 cumulative report</a></div>`:'';
    const status=cumulativeLpStatus(x.comparison_status);
    const reconciliationNote=String(x.source_fields?.controlled_reconciliation_note||'').trim();
    return `<div class="yearLpCard cumulativeLpCard"><div class="yearLpHead"><b>${esc(x.source_label||'LeadPerfection cumulative attribution')}</b><span>${esc(status)}</span></div><div class="yearMetricGrid compact"><div><span>Raw</span><b>${esc(x.raw_count??'—')}</b></div><div><span>Set</span><b>${esc(x.set_count??'—')}</b></div><div><span>Issue</span><b>${esc(x.issue_count??'—')}</b></div><div><span>Demo</span><b>${esc(x.demo_count??'—')}</b></div><div><span>Gross closes</span><b>${esc(x.gross_close_count??'—')}</b></div><div><span>Gross volume</span><b>${money(x.gross_close_volume)}</b></div><div><span>Net closes</span><b>${esc(x.net_close_count??'—')}</b></div><div><span>Net volume</span><b>${money(x.net_close_volume)}</b></div></div><div class="yearVerification">2012–2026 report-period attribution · not attendance proof</div>${reconciliationNote?`<div class="yearVerification">${esc(reconciliationNote)}</div>`:''}${sourceLink}</div>`;
  }).join('');
}
function historyItem(x){
  const performanceStatus=sourceFieldValue(x,['PERFORMANCE MATCH STATUS']);
  const fullComStatus=sourceFieldValue(x,['FULL COM STATUS']);
  return `<details class="historyItem"><summary><span><b>${esc(x.source_year)}</b> · ${esc(x.dates_text||'Date not stated')}</span><span>${esc(historyCostStateValue(x))}</span></summary><div class="historyBody">${historyEvidenceFlag(x)}${x.participation_status?`<div class="detailLine"><b>Participation</b><span>${esc(x.participation_status)}</span></div>`:''}${(x.address||x.city)?`<div class="detailLine"><b>Location</b><span>${x.address?esc(x.address):''}${x.address&&x.city?' · ':''}${x.city?esc(x.city):''}</span></div>`:''}${x.booth?`<div class="detailLine"><b>Booth / space</b><span>${esc(x.booth)}</span></div>`:''}${x.coi?`<div class="detailLine"><b>COI</b><span>${esc(x.coi)}</span></div>`:''}${x.setup_info?`<div class="detailLine"><b>Setup</b><span>${esc(x.setup_info)}</span></div>`:''}${x.breakdown_info?`<div class="detailLine"><b>Breakdown</b><span>${esc(x.breakdown_info)}</span></div>`:''}${x.event_cost_text?`<div class="detailLine"><b>Event cost</b><span>${esc(x.event_cost_text)}</span></div>`:''}${x.final_cost_text?`<div class="detailLine"><b>Final cost</b><span>${esc(x.final_cost_text)}</span></div>`:''}${x.savings_text?`<div class="detailLine"><b>Savings</b><span>${esc(x.savings_text)}</span></div>`:''}${x.payment_status_text?`<div class="detailLine"><b>Payment</b><span>${esc(x.payment_status_text)}</span></div>`:''}${x.application_status_text?`<div class="detailLine"><b>Application</b><span>${esc(x.application_status_text)}</span></div>`:''}${x.calendar_status_text?`<div class="detailLine"><b>Calendar</b><span>${esc(x.calendar_status_text)}</span></div>`:''}${x.issued_appts!=null?`<div class="detailLine"><b>Issued / demos</b><span>${esc(x.issued_appts)} / ${esc(x.demos??'—')}</span></div>`:''}${x.gross_sales_count!=null?`<div class="detailLine"><b>Gross sales</b><span>${esc(x.gross_sales_count)} · ${money(x.gross_sales_value)}</span></div>`:''}${x.net_sales_count!=null?`<div class="detailLine"><b>Net sales</b><span>${esc(x.net_sales_count)} · ${money(x.net_revenue)}</span></div>`:''}${x.nsli!=null?`<div class="detailLine"><b>NSLI</b><span>${money(x.nsli)}</span></div>`:''}${historyEventComValue(x)?`<div class="detailLine"><b>Event COM</b><span>${esc(historyEventComValue(x))}</span></div>`:''}${performanceStatus?`<div class="detailLine"><b>Performance attribution</b><span>${esc(performanceStatus)}</span></div>`:''}${fullComStatus?`<div class="detailLine"><b>COM status</b><span>${esc(fullComStatus)}</span></div>`:''}${sourceFieldValue(x,['DIRECT + SETUP COM %'])?`<div class="detailLine"><b>Direct + setup COM</b><span>${esc(sourceFieldValue(x,['DIRECT + SETUP COM %']))}</span></div>`:''}${x.verification_status?`<div class="detailLine"><b>Verification</b><span>${esc(x.verification_status)}</span></div>`:''}${historyContactValue(x)?`<div class="detailLine"><b>Contact</b><span>${esc(historyContactValue(x))}${contactActions(historyContactValue(x))}</span></div>`:''}${x.notes?`<div class="detailLine"><b>Notes</b><span>${esc(x.notes)}</span></div>`:''}<div class="actions"><a class="btn secondary sourceBtn" target="_blank" href="${historySourceUrl(x)}">${x.source_system==='GMAIL_CALENDAR'?'Open source email':'Open source row'}</a>${supplementalEvidenceLinks(x)}</div></div></details>`;
}
const CLEANUP_SOURCE_PRIORITIES={
  contact:['SHOW_HISTORY','DND_OPPORTUNITY','GMAIL_EVENT_EVIDENCE','BOOKING_CALENDAR','ARCHIVED_SCHEDULE','SHOW_PERFORMANCE','SHOW_COST_REGISTER','PAYMENT_TRACKER'],
  booth:['SHOW_HISTORY','GMAIL_EVENT_EVIDENCE','BOOKING_CALENDAR','ARCHIVED_SCHEDULE','DND_OPPORTUNITY','PAYMENT_TRACKER','SHOW_COST_REGISTER','SHOW_PERFORMANCE'],
  cost:['SHOW_COST_REGISTER','PAYMENT_TRACKER','SHOW_HISTORY','BOOKING_CALENDAR','GMAIL_EVENT_EVIDENCE','ARCHIVED_SCHEDULE','DND_OPPORTUNITY','SHOW_PERFORMANCE'],
  com:['SHOW_HISTORY','SHOW_PERFORMANCE','SHOW_COST_REGISTER','GMAIL_EVENT_EVIDENCE','BOOKING_CALENDAR','ARCHIVED_SCHEDULE','PAYMENT_TRACKER','DND_OPPORTUNITY'],
  performance:['SHOW_PERFORMANCE','SHOW_HISTORY','GMAIL_EVENT_EVIDENCE','BOOKING_CALENDAR','ARCHIVED_SCHEDULE','SHOW_COST_REGISTER','PAYMENT_TRACKER','DND_OPPORTUNITY'],
  payment:['PAYMENT_TRACKER','GMAIL_EVENT_EVIDENCE','BOOKING_CALENDAR','SHOW_HISTORY','DND_OPPORTUNITY','ARCHIVED_SCHEDULE','SHOW_COST_REGISTER','SHOW_PERFORMANCE'],
  application:['PAYMENT_TRACKER','GMAIL_EVENT_EVIDENCE','BOOKING_CALENDAR','SHOW_HISTORY','DND_OPPORTUNITY','ARCHIVED_SCHEDULE','SHOW_COST_REGISTER','SHOW_PERFORMANCE'],
  coi:['SHOW_HISTORY','GMAIL_EVENT_EVIDENCE','BOOKING_CALENDAR','ARCHIVED_SCHEDULE','DND_OPPORTUNITY','PAYMENT_TRACKER','SHOW_COST_REGISTER','SHOW_PERFORMANCE'],
};
const CLEANUP_FIELD_GUIDANCE={
  contact:'Check organizer/contact details in the preserved event source.',
  booth:'Check assignment, map, acceptance, or space details in the preserved event source.',
  cost:'Check cost register, payment tracker, contract, or event source evidence.',
  com:'COM requires source-backed event cost and event-level performance; do not derive it from unmatched or aggregate LP.',
  performance:'Check preserved performance evidence and annual LP attribution separately; LP is not attendance proof.',
  payment:'Check payment tracker or preserved payment/event correspondence.',
  application:'Check application, approval, or event correspondence.',
  coi:'Check preserved event/organizer insurance evidence; do not infer a COI from attendance.',
};
function cleanupInvestigationSourceUrl(row){
  if(row?.source_system==='GMAIL_CALENDAR'&&String(row?.source_locator||'').trim())return String(row.source_locator).trim();
  if(String(row?.source_spreadsheet_id||'').trim()&&Number.isFinite(Number(row?.source_row)))return historySourceUrl(row);
  return '';
}
function cleanupInvestigationRows(rows,field){
  const priority=CLEANUP_SOURCE_PRIORITIES[field]||[];
  const rank=row=>{const i=priority.indexOf(String(row?.source_kind||''));return i<0?priority.length+1:i};
  const sorted=[...(rows||[])].sort((a,b)=>rank(a)-rank(b)||Number(b.source_row||0)-Number(a.source_row||0));
  const seen=new Set(),out=[];
  for(const row of sorted){
    const url=cleanupInvestigationSourceUrl(row);
    if(!url||seen.has(url))continue;
    seen.add(url);out.push(row);
    if(out.length>=2)break;
  }
  return out;
}
function cleanupLpInvestigationLinks(lpItems,field){
  if(!['performance','com'].includes(field))return '';
  const reports=[];
  for(const item of lpItems||[]){
    for(const report of Array.isArray(item?.report_months)?item.report_months:[]){
      if(report?.gmail_url&&!reports.some(x=>x.gmail_url===report.gmail_url))reports.push(report);
    }
  }
  return reports.slice(0,2).map(report=>`<a class="cleanupSourceLink" target="_blank" href="${esc(report.gmail_url)}">Check annual LP source${report.month?' · '+esc(report.month):''}</a>`).join('');
}
function cleanupInvestigationHtml(field,rows,lpItems){
  const label=CLEANUP_FIELD_LABELS[field]||field;
  const sources=cleanupInvestigationRows(rows,field);
  const rowLinks=sources.map(row=>{
    const place=[row.source_workbook,row.source_tab,row.source_row?('row '+row.source_row):''].filter(Boolean).join(' · ');
    return `<a class="cleanupSourceLink" target="_blank" href="${esc(cleanupInvestigationSourceUrl(row))}">Check preserved source${place?' · '+esc(place):''}</a>`;
  }).join('');
  const lpLinks=cleanupLpInvestigationLinks(lpItems,field);
  const links=rowLinks+lpLinks;
  const sourceArea=links?`<div class="cleanupSourceLinks">${links}</div>`:'<div class="cleanupNoSource">No direct preserved source URL is captured for this field; review the preserved records & sources below.</div>';
  return `<div class="cleanupInvestigation"><div><b>${esc(label)}</b><span>${esc(CLEANUP_FIELD_GUIDANCE[field]||'Check the preserved source before making any inference.')}</span></div>${sourceArea}<small>Investigation link only — a source may confirm the field, preserve it as unknown/N/A, or contain no additional answer.</small></div>`;
}
function cleanupChecklistHtml(profile,year,rows=[],lpItems=[]){
  if(!profile||typeof cleanupSupportedFieldsForProfileYear!=='function'||typeof missingFieldsForYear!=='function')return '';
  const supported=cleanupSupportedFieldsForProfileYear(profile,year).filter(key=>!(cleanupAllNonparticipation(profile,year)&&CLEANUP_EXECUTION_ONLY_FIELDS.has(key)));
  const missing=missingFieldsForYear(profile,year);
  if(!supported.length)return '';
  const missingLabels=missing.map(key=>CLEANUP_FIELD_LABELS[key]||key);
  const supportedLabels=supported.map(key=>CLEANUP_FIELD_LABELS[key]||key);
  const investigations=missing.length?`<div class="cleanupInvestigations">${missing.map(field=>cleanupInvestigationHtml(field,rows,lpItems)).join('')}</div>`:'';
  return `<div class="yearCleanupChecklist"><div class="yearCleanupHead"><div><span>Cleanup checklist</span><b>${esc(year)}</b></div><strong class="${missing.length?'needsWork':'complete'}">${missing.length?missing.length+' missing':'No actionable missing fields'}</strong></div>${missing.length?`<div class="yearCleanupMissing">${missingLabels.map(label=>`<span>${esc(label)}</span>`).join('')}</div>`:'<div class="yearCleanupComplete">No source-family-supported, applicable fields are truly missing for this year.</div>'}${investigations}<div class="yearCleanupNote">Expected fields are scoped to this profile's exact year + preserved source family (25%+ family coverage). Supplemental merged evidence creates an expectation only on rows that actually carry that supplemental source. Explicit unknown, N/A, and execution-only fields for explicit non-participation do not count as missing.</div></div>`;
}
function yearScorecard(year,rows,lpItems,cumulativeItems,cleanupChecklist=''){
  const recordCount=rows.length;
  const lpCount=lpItems.length;
  const cumulativeCount=cumulativeItems.length;
  const eventCosts=datedValues(rows,row=>historyCostStateValue(row),v=>esc(v));
  const setupCosts=datedValues(rows,row=>historyDirectSetupCostValue(row),v=>esc(v));
  const directSetupCom=datedValues(rows,row=>historyDirectSetupComValue(row),v=>esc(v));
  const location=datedValues(rows,row=>[row.address,row.city].filter(Boolean).join(row.address&&row.city?' · ':''),v=>esc(v));
  const setup=datedValues(rows,row=>row.setup_info,v=>esc(v));
  const breakdown=datedValues(rows,row=>row.breakdown_info,v=>esc(v));
  const savings=datedValues(rows,row=>row.savings_text,v=>esc(v));
  const notes=datedValues(rows,row=>row.notes,v=>esc(v));
  const payment=datedValues(rows,row=>row.payment_status_text,v=>esc(v));
  const participation=datedValues(rows,row=>row.participation_status,v=>esc(v));
  const coi=datedValues(rows,row=>row.coi,v=>esc(v));
  const application=datedValues(rows,row=>row.application_status_text,v=>esc(v));
  const calendar=datedValues(rows,row=>row.calendar_status_text,v=>esc(v));
  const completeness=`<div class="yearSubhead">Source-field completeness</div><div class="yearStatusGrid"><div><span>Contact</span><div>${esc(completenessText(rows,historyContactValue))}</div></div><div><span>Booth / space</span><div>${esc(completenessText(rows,historyBoothValue))}</div></div><div><span>Show cost</span><div>${esc(completenessText(rows,historyCostStateValue))}</div></div><div><span>Direct + setup cost</span><div>${esc(completenessText(rows,historyDirectSetupCostValue))}</div></div><div><span>Event COM</span><div>${esc(completenessText(rows,historyComStateValue))}</div></div><div><span>Direct + setup COM</span><div>${esc(completenessText(rows,historyDirectSetupComValue))}</div></div><div><span>COI</span><div>${esc(completenessText(rows,row=>row.coi))}</div></div><div><span>Payment</span><div>${esc(completenessText(rows,row=>row.payment_status_text))}</div></div><div><span>Application</span><div>${esc(completenessText(rows,row=>row.application_status_text))}</div></div><div><span>History performance</span><div>${esc(metricCompletenessText(rows))}</div></div></div><div class="yearVerification">Completeness is counted per preserved history record. Missing means no field/value was found in the preserved source. Explicit unknown and N/A remain separate source states. LeadPerfection attribution is audited separately below.</div>`;
  const details=recordCount?`<details class="yearRecords"><summary>Preserved records & sources · ${recordCount}</summary><div class="historyList">${rows.map(historyItem).join('')}</div></details>`:'<div class="yearNoOccurrence">No preserved occurrence record for this year.</div>';
  return `<div class="yearScorecard"><div class="yearScoreHeader"><div><span>Year snapshot</span><b>${esc(year)}</b></div><div>${recordCount} record${recordCount===1?'':'s'} · ${lpCount} annual LP · ${cumulativeCount} cumulative LP</div></div>${cleanupChecklist}<div class="yearFieldGrid"><div class="yearField wide"><span>Dates</span><div>${plainValues(rows,row=>row.dates_text,v=>esc(v))}</div></div><div class="yearField wide"><span>Location</span><div>${location}</div></div><div class="yearField wide"><span>Booth / space</span><div>${datedValues(rows,row=>historyBoothValue(row),v=>esc(v))}</div></div><div class="yearField"><span>Show cost</span><div>${eventCosts}</div></div><div class="yearField"><span>Direct + setup cost</span><div>${setupCosts}</div></div><div class="yearField"><span>Event COM</span><div>${comYearValues(rows)}</div></div><div class="yearField"><span>Direct + setup COM</span><div>${directSetupCom}</div></div><div class="yearField wide"><span>Setup</span><div>${setup}</div></div><div class="yearField wide"><span>Breakdown</span><div>${breakdown}</div></div><div class="yearField wide"><span>Savings / discount</span><div>${savings}</div></div></div><div class="yearMetricGrid"><div><span>Issued</span><b>${numericYearTotal(rows,'issued_appts',v=>Number(v).toLocaleString())}</b></div><div><span>Demos</span><b>${numericYearTotal(rows,'demos',v=>Number(v).toLocaleString())}</b></div><div><span>Net sales</span><b>${numericYearTotal(rows,'net_sales_count',v=>Number(v).toLocaleString())}</b></div><div><span>Net revenue</span><b>${numericYearTotal(rows,'net_revenue',money)}</b></div><div><span>Gross sales</span><b>${numericYearTotal(rows,'gross_sales_count',v=>Number(v).toLocaleString())}</b></div><div><span>Gross volume</span><b>${numericYearTotal(rows,'gross_sales_value',money)}</b></div><div class="wide"><span>NSLI</span><b>${numericYearTotal(rows,'nsli',money)}</b></div></div><div class="yearField full"><span>Show contact</span><div>${contactYearValues(rows)}</div></div><div class="yearStatusGrid"><div><span>Payment</span><div>${payment}</div></div><div><span>Participation</span><div>${participation}</div></div><div><span>COI</span><div>${coi}</div></div><div><span>Application</span><div>${application}</div></div><div><span>Calendar</span><div>${calendar}</div></div></div>${completeness}<div class="yearField full"><span>Notes</span><div>${notes}</div></div><div class="yearLpSection"><div class="yearSubhead">LeadPerfection annual-period performance</div>${lpYearHtml(lpItems)}</div><div class="yearLpSection cumulativeLpSection"><div class="yearSubhead">LeadPerfection cumulative / lifetime attribution</div>${cumulativeLpYearHtml(cumulativeItems)}</div>${details}</div>`;
}

const CURRENT_MISSING='Not found in current operating source';
function currentMissingValue(){return '<span class="yearMissing">'+CURRENT_MISSING+'</span>'}
function operatingEventYear(show){
  const raw=String(show?.event_start||show?.event_end||'');
  const year=Number(raw.slice(0,4));
  return Number.isFinite(year)&&year>=2000?year:new Date().getFullYear();
}
function operatingDateRange(show){
  if(!show?.event_start&&!show?.event_end)return missingValue();
  const start=show.event_start?date(show.event_start):'Date not stated';
  const end=show.event_end&&show.event_end!==show.event_start?date(show.event_end):'';
  return `<strong>${esc(end?start+' – '+end:start)}</strong>`;
}
function currentOperatingScorecard(show){
  const year=operatingEventYear(show);
  const detail=show&&show.source_detail&&typeof show.source_detail==='object'?show.source_detail:{};
  const payment=String(detail.payment_status||show.payment_due_text||'').trim();
  const sourceCheck=String(detail.last_source_check||'').trim();
  const currentTreatment=String(show.this_year||show.yearly_status||'').trim();
  const historicalBenchmark=show.historical_direct_setup!==null&&show.historical_direct_setup!==undefined&&String(show.historical_direct_setup)!==''
    ? money(show.historical_direct_setup)
    : CURRENT_MISSING;
  const bookingLimit=show.max_booking_cost!==null&&show.max_booking_cost!==undefined&&String(show.max_booking_cost)!==''
    ? money(show.max_booking_cost)
    : CURRENT_MISSING;
  return `<div class="yearScorecard currentOperatingCard">
    <div class="yearScoreHeader"><div><span>Current operating · ${esc(show.mfc_id)}</span><b>${esc(year)}</b></div><div>${esc(show.show_status||'OPEN')} · ${esc(show.confirmation||'UNVERIFIED')}</div></div>
    <div class="currentEventName">${esc(show.event||'Current show')}</div>
    <div class="yearFieldGrid">
      <div class="yearField wide"><span>Dates</span><div>${operatingDateRange(show)}</div></div>
      <div class="yearField wide"><span>Booth / space</span><div>${currentMissingValue()}</div></div>
      <div class="yearField"><span>Show cost</span><div>${currentMissingValue()}</div></div>
      <div class="yearField"><span>Direct + setup cost</span><div>${currentMissingValue()}</div></div>
      <div class="yearField"><span>Event COM</span><div>${currentMissingValue()}</div></div>
      <div class="yearField"><span>Direct + setup COM</span><div>${currentMissingValue()}</div></div>
    </div>
    <div class="yearMetricGrid">
      <div><span>Issued</span><b>${currentMissingValue()}</b></div>
      <div><span>Demos</span><b>${currentMissingValue()}</b></div>
      <div><span>Net sales</span><b>${currentMissingValue()}</b></div>
      <div><span>Net revenue</span><b>${currentMissingValue()}</b></div>
      <div><span>Gross sales</span><b>${currentMissingValue()}</b></div>
      <div><span>Gross volume</span><b>${currentMissingValue()}</b></div>
      <div class="wide"><span>NSLI</span><b>${currentMissingValue()}</b></div>
    </div>
    <div class="yearField full"><span>Current-year show contact</span><div>${currentMissingValue()}</div></div>
    <div class="yearStatusGrid">
      <div><span>Payment</span><div>${payment?esc(payment):currentMissingValue()}</div></div>
      <div><span>Current treatment</span><div>${currentTreatment?esc(currentTreatment):currentMissingValue()}</div></div>
      <div><span>COI</span><div>${currentMissingValue()}</div></div>
    </div>
    <div class="currentPlanning">
      <div class="yearSubhead">Current planning & control</div>
      <div class="currentPlanningGrid">
        <div><span>Status</span><b>${esc(show.show_status||'—')}</b></div>
        <div><span>Decision</span><b>${esc(show.decision||'—')}</b></div>
        <div><span>Booking status</span><b>${esc(show.booking_status||'—')}</b></div>
        <div><span>Confirmation</span><b>${esc(show.confirmation||'—')}</b></div>
        <div><span>Max booking cost</span><b>${esc(bookingLimit)}</b></div>
        <div><span>Historical direct + setup benchmark</span><b>${esc(historicalBenchmark)}</b></div>
        <div class="wide"><span>Planning performance benchmark</span><b>${esc(show.performance||CURRENT_MISSING)}</b></div>
        <div><span>Owner</span><b>${esc(show.owner||CURRENT_MISSING)}</b></div>
        <div><span>Action due</span><b>${show.action_due?esc(dueLabel(show.action_due)):CURRENT_MISSING}</b></div>
        <div class="wide"><span>Next action</span><b>${esc(show.follow_up||CURRENT_MISSING)}</b></div>
        ${sourceCheck?`<div class="wide"><span>Source check</span><b>${esc(sourceCheck)}</b></div>`:''}
      </div>
      <div class="currentPlanningNote">Historical benchmark fields are planning context only. They are not labeled as ${esc(year)} performance.</div>
      <div class="actions"><button class="btn primary currentMfcBtn" data-mfc="${esc(show.mfc_id)}">Open current control</button></div>
    </div>
  </div>`;
}
async function openCatalog(id,focusYear=null){
  const incomingFocusYear=Number(focusYear||state.deepLinkedYear||0);
  state.deepLinkedProfile=id;
  state.deepLinkedYear=Number.isFinite(incomingFocusYear)&&incomingFocusYear>=2000?incomingFocusYear:null;
  syncLocationView();
  $('#detailBody').innerHTML='<h2>Loading show history…</h2><div class="subtitle">Reading the preserved show database.</div>';
  $('#detailModal').classList.add('show');
  try{
    const d=await call('catalogHistory',{profileId:id}),p=d.profile,h=d.history||[],perf=d.performance||[],cum=d.cumulativePerformance||[],mfcs=Array.isArray(p.matched_mfc_ids)?p.matched_mfc_ids:[];
    const aliases=(p.aliases||[]).filter(x=>String(x).trim()&&String(x)!==p.canonical_event);
    const sourceRows=Array.isArray(p.source_rows)?p.source_rows:[];
    const lpSourceOnly=isLpSourceOnly(p);
    const lifetimeSource=sourceRows.filter(x=>x&&x.spreadsheet_id&&Number.isFinite(Number(x.row))).map(x=>`<a class="btn secondary sourceBtn" target="_blank" href="https://docs.google.com/spreadsheets/d/${encodeURIComponent(x.spreadsheet_id)}/edit#gid=977393722&range=A${Number(x.row)}:R${Number(x.row)}">Lifetime source row ${Number(x.row)}</a>`).join('');
    const operatingRows=mfcs.map(mfc=>state.shows.find(show=>show.mfc_id===mfc)).filter(Boolean).sort((a,b)=>operatingEventYear(b)-operatingEventYear(a)||String(a.event||'').localeCompare(String(b.event||'')));
    const operatingHtml=operatingRows.length?operatingRows.map(currentOperatingScorecard).join(''):'';
    const years=[...new Set([...h.map(x=>Number(x.source_year||0)),...perf.map(x=>Number(x.source_year||0)),...cum.map(x=>Number(x.source_year||0))].filter(Number.isFinite).filter(Boolean))].sort((a,b)=>b-a);
    const routeFocusYear=Number.isFinite(Number(state.deepLinkedYear))&&years.includes(Number(state.deepLinkedYear))?Number(state.deepLinkedYear):null;
    if(state.deepLinkedYear&&!routeFocusYear){state.deepLinkedYear=null;syncLocationView()}
    const catalogProfile=state.catalog.find(x=>x.profile_id===id)||null;
    const routeMissingFields=routeFocusYear&&catalogProfile&&typeof missingFieldsForYear==='function'?missingFieldsForYear(catalogProfile,routeFocusYear):[];
    const cleanupQueue=routeFocusYear&&typeof cleanupQueueProfilesForYear==='function'?cleanupQueueProfilesForYear(routeFocusYear):[];
    const cleanupQueueIndex=cleanupQueue.findIndex(x=>x.profile_id===id);
    const cleanupPrev=cleanupQueueIndex>0?cleanupQueue[cleanupQueueIndex-1]:null;
    const cleanupNext=cleanupQueueIndex>=0&&cleanupQueueIndex<cleanupQueue.length-1?cleanupQueue[cleanupQueueIndex+1]:null;
    const cleanupQueueNav=cleanupQueueIndex>=0?`<div class="cleanupQueueNav"><div class="cleanupQueueProgress"><span>${esc(routeFocusYear)} cleanup queue</span><b>${cleanupQueueIndex+1} of ${cleanupQueue.length}</b></div><div class="cleanupQueueActions"><button class="btn secondary cleanupQueueMove" data-profile="${esc(cleanupPrev?.profile_id||'')}" data-year="${esc(routeFocusYear)}" ${cleanupPrev?'':'disabled'}>Previous</button><button class="btn secondary" id="cleanupQueueBackBtn">Back to queue</button><button class="btn primary cleanupQueueMove" data-profile="${esc(cleanupNext?.profile_id||'')}" data-year="${esc(routeFocusYear)}" ${cleanupNext?'':'disabled'}>Next</button></div></div>`:'';
    const activeYearFilters=[
      {label:'History',value:state.catalogFilters.historyYear},
      {label:'Annual LP',value:state.catalogFilters.lpYear},
      {label:'Cumulative LP',value:state.catalogFilters.cumulativeLpYear},
      ...(routeFocusYear?[{label:'Cleanup',value:String(routeFocusYear)}]:[]),
    ].filter(x=>x.value!=='ALL').map(x=>({...x,year:Number(x.value)})).filter(x=>Number.isFinite(x.year)&&years.includes(x.year));
    const selectedEvidenceYears=[...new Set(activeYearFilters.map(x=>x.year))];
    const focusedEvidenceYear=selectedEvidenceYears[0]??null;
    const selectedEvidenceYearSet=new Set(selectedEvidenceYears);
    const orderedYears=selectedEvidenceYears.length?[...selectedEvidenceYears,...years.filter(y=>!selectedEvidenceYearSet.has(y))]:years;
    const historyHtml=years.length?orderedYears.map((year,i)=>{
      const rows=h.filter(x=>Number(x.source_year||0)===year);
      const lpItems=perf.filter(x=>Number(x.source_year||0)===year);
      const cumulativeItems=cum.filter(x=>Number(x.source_year||0)===year);
      const selectedForYear=activeYearFilters.filter(x=>x.year===year);
      const filterTag=selectedForYear.length?`<span class="yearFocusTag">${esc(selectedForYear.map(x=>x.label).join(' + '))} focus</span>`:'';
      const cleanupChecklist=routeFocusYear===year?cleanupChecklistHtml(catalogProfile,year,rows,lpItems):'';
      return `<details class="historyYear ${selectedForYear.length?'focusedYear':''}" data-history-year="${esc(year)}" ${i===0?'open':''}><summary><span>${esc(year)}${filterTag}</span><span>${rows.length} record${rows.length===1?'':'s'} · ${lpItems.length} annual LP · ${cumulativeItems.length} cumulative LP</span></summary><div class="historyYearBody">${yearScorecard(year,rows,lpItems,cumulativeItems,cleanupChecklist)}</div></details>`;
    }).join(''):'<div class="empty">No year-by-year history or LeadPerfection evidence is linked to this profile.</div>';
    const latestContact=[...h].filter(x=>historyContactValue(x)).sort((a,b)=>Number(b.source_year||0)-Number(a.source_year||0)||Number(b.source_row||0)-Number(a.source_row||0))[0]||null;
    const latestContactText=latestContact?historyContactValue(latestContact):'';
    const latestContactHtml=`<div class="latestContact"><div class="k">Latest known show contact</div>${latestContact?`<div class="latestContactValue"><b>${esc(latestContactText)}</b><span>Preserved ${esc(latestContact.source_year)} record</span>${contactActions(latestContactText)}</div>`:`<div class="latestContactValue"><b class="yearMissing">${HISTORY_MISSING}</b></div>`}</div>`;
    const historyFocusNote=focusedEvidenceYear?`<div class="sourceWarn yearFocusNote"><b>${routeFocusYear?esc(routeFocusYear)+' cleanup year opened first':selectedEvidenceYears.length===1?esc(focusedEvidenceYear)+' opened first':'Selected evidence years shown first: '+selectedEvidenceYears.map(esc).join(' · ')}</b>${routeFocusYear?` · ${routeMissingFields.length} source-supported field${routeMissingFields.length===1?'':'s'} missing. The checklist is at the top of the ${esc(routeFocusYear)} year card.`:` · Active year filter${activeYearFilters.length===1?'':'s'}: ${activeYearFilters.map(x=>esc(x.label+' '+x.year)).join(' · ')}.`} All evidence years remain available below.</div>`:'';
    const profileLabel=lpSourceOnly?'LP source only':(p.tier||p.source_type.replaceAll('_',' '));
    const lpSourceOnlyNotice=lpSourceOnly?`<div class="sourceWarn historyIntro"><b>LP source-only identity.</b> This profile exists only to anchor specific LeadPerfection attribution. It does not assert Paradise attended, worked, staffed, booked, paid for, or completed the event; no history occurrence was created.</div>`:'';
    const yearSectionLabel='Year-by-year evidence';
    $('#detailBody').innerHTML=`<h2>${esc(p.canonical_event)}</h2><div class="subtitle">${esc(p.profile_id)} · ${esc(profileLabel)}</div>${cleanupQueueNav}<div class="detailGrid"><div class="detail"><div class="k">Lifetime occurrences</div><div class="val">${esc(p.occurrences??'—')}</div></div><div class="detail"><div class="k">Preserved history records</div><div class="val">${h.length}</div></div><div class="detail"><div class="k">Lifetime net</div><div class="val">${money(p.lifetime_net_volume)}</div></div><div class="detail"><div class="k">Lifetime net sales</div><div class="val">${esc(p.lifetime_net_sales??'—')}</div></div><div class="detail"><div class="k">Lifetime close volume</div><div class="val">${money(p.lifetime_close_volume)}</div></div><div class="detail"><div class="k">LP annual sources</div><div class="val">${perf.length}</div></div><div class="detail"><div class="k">LP cumulative sources</div><div class="val">${cum.length}</div></div></div>${latestContactHtml}${aliases.length?`<div class="block"><div class="k">Known aliases</div><div class="val">${aliases.map(esc).join(' · ')}</div></div>`:''}${mfcs.length?`<div class="block"><div class="k">Current operating control</div><div class="actions">${mfcs.map(x=>`<button class="btn primary catalogMfcBtn" data-mfc="${esc(x)}">Open ${esc(x)}</button>`).join('')}</div></div>`:''}${lifetimeSource?`<div class="block"><div class="k">Lifetime performance source</div><div class="actions">${lifetimeSource}</div></div>`:''}${lpSourceOnlyNotice}<div class="sourceWarn historyIntro"><b>Year cards are source-first.</b> Annual-period LeadPerfection values answer what the restricted calendar-year report showed. Cumulative/lifetime values come from the separate 2012–2026 report-period query. Neither LeadPerfection layer is treated as attendance proof, and cumulative values do not overwrite annual history.</div>${operatingHtml?`<div class="sectionTitle"><span>Current operating year${operatingRows.length===1?'':'s'}</span><span>${operatingRows.length} control${operatingRows.length===1?'':'s'}</span></div><div class="historyList currentYearList">${operatingHtml}</div>`:''}${historyFocusNote}<div class="sectionTitle"><span>${esc(yearSectionLabel)}</span><span>${years.length} year${years.length===1?'':'s'}</span></div><div class="historyList">${historyHtml}</div><div class="actions"><button class="btn secondary" id="catalogCloseBtn">Close</button></div>`;
    $('#catalogCloseBtn').onclick=()=>closeModal('detailModal');
    $('.catalogMfcBtn').forEach(b=>b.onclick=()=>openDetail(b.dataset.mfc));
    $('.currentMfcBtn').forEach(b=>b.onclick=()=>openDetail(b.dataset.mfc));
    $('.cleanupQueueMove[data-profile]').forEach(b=>b.onclick=()=>{const profile=String(b.dataset.profile||'').trim(),year=Number(b.dataset.year||0);if(!profile||!Number.isFinite(year))return;state.deepLinkedProfile=profile;state.deepLinkedYear=year;syncLocationView();openCatalog(profile,year)});
    const cleanupBack=$('#cleanupQueueBackBtn');if(cleanupBack)cleanupBack.onclick=()=>{state.catalogFilters.historyYear=String(routeFocusYear);state.showQuickView='ALL_MISSING';state.catalogSort='MISSING_DATA';state.catalogLimit=60;closeModal('detailModal');render()};
  }catch(e){
    $('#detailBody').innerHTML=`<h2>History unavailable</h2><div class="subtitle">${esc(e.message)}</div><div class="actions"><button class="btn secondary" id="catalogCloseBtn">Close</button></div>`;$('#catalogCloseBtn').onclick=()=>closeModal('detailModal');
  }
}
function openDetail(id){
  const s=state.shows.find(x=>x.mfc_id===id);if(!s)return;
  $('#detailBody').innerHTML=`<h2>${esc(s.event)}</h2><div class="subtitle">${esc(s.mfc_id)} · ${esc(s.restart_wave||'')}</div><div class="detailGrid"><div class="detail"><div class="k">Status</div><div class="val"><span class="badge ${badgeClass(s.show_status)}">${esc(s.show_status)}</span></div></div><div class="detail"><div class="k">Decision</div><div class="val">${esc(s.decision||'—')}</div></div><div class="detail"><div class="k">Event</div><div class="val">${date(s.event_start)}${s.event_end&&s.event_end!==s.event_start?' – '+date(s.event_end):''}</div></div><div class="detail"><div class="k">Max booking cost</div><div class="val">${money(s.max_booking_cost)}</div></div><div class="detail"><div class="k">Owner</div><div class="val">${esc(s.owner||'—')}</div></div><div class="detail"><div class="k">Action due</div><div class="val">${esc(dueLabel(s.action_due))}</div></div><div class="detail"><div class="k">This year</div><div class="val">${esc(s.this_year||'IN PLAY')}</div></div><div class="detail"><div class="k">Skip reason</div><div class="val">${esc(s.skip_reason||'—')}</div></div></div><div class="block"><div class="k">Next action</div><div class="val">${esc(s.follow_up||'—')}</div></div><div class="block"><div class="k">Booking status</div><div class="val">${esc(s.booking_status||'—')}</div></div><div class="block"><div class="k">Payment / due</div><div class="val">${esc(s.payment_due_text||'—')}</div></div><div class="actions"><button class="btn secondary" id="detailCloseBtn">Close</button><a class="btn secondary" style="text-decoration:none;text-align:center" target="_blank" href="${SHEET}#gid=1286011977&range=B${s.source_sheet_row}:AH${s.source_sheet_row}">Source row</a><button class="btn primary" id="detailEditBtn">Edit show</button></div>`;
  $('#detailCloseBtn').onclick=()=>closeModal('detailModal');$('#detailEditBtn').onclick=()=>openEdit(s.mfc_id);$('#detailModal').classList.add('show');
}
function openEdit(id){
  const s=state.shows.find(x=>x.mfc_id===id);if(!s)return;closeModal('detailModal');
  $('#editBody').innerHTML=`<h2>Edit ${esc(s.event)}</h2><div class="subtitle">Only operating fields below can be changed.</div><div class="field"><label>SHOW STATUS</label><select id="eStatus">${['READY','RECONCILE','DATE ONLY','HOLD','OPEN'].map(v=>`<option ${s.show_status===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>NEXT ACTION</label><textarea id="eFollow">${esc(s.follow_up||'')}</textarea></div><div class="field"><label>OWNER</label><input id="eOwner" value="${esc(s.owner||'')}" /></div><div class="field"><label>ACTION DUE</label><input id="eDue" type="date" value="${esc(s.action_due||'')}" /></div><div class="field"><label>THIS YEAR</label><select id="eThisYear"><option ${s.this_year==='IN PLAY'?'selected':''}>IN PLAY</option><option ${s.this_year==='SKIP THIS YEAR'?'selected':''}>SKIP THIS YEAR</option></select></div><div class="field" id="skipField"><label>SKIP REASON</label><textarea id="eSkip">${esc(s.skip_reason||'')}</textarea></div><div class="editnote">Pricing, formulas, evidence, cap treatment and payment controls are not editable from the mobile app.</div><div class="actions"><button class="btn secondary" id="editCancelBtn">Cancel</button><button class="btn primary" id="saveBtn">Save changes</button></div>`;
  $('#editCancelBtn').onclick=()=>closeModal('editModal');$('#saveBtn').onclick=()=>saveEdit(s.mfc_id);const sync=()=>$('#skipField').style.display=$('#eThisYear').value==='SKIP THIS YEAR'?'block':'none';$('#eThisYear').onchange=sync;sync();$('#editModal').classList.add('show');
}
async function saveEdit(id){
  const patch={show_status:$('#eStatus').value,follow_up:$('#eFollow').value,owner:$('#eOwner').value,action_due:$('#eDue').value||null,this_year:$('#eThisYear').value,skip_reason:$('#eSkip').value};
  if(patch.this_year==='SKIP THIS YEAR'&&!patch.skip_reason.trim()){toast('Add a skip reason before saving.');return}
  const b=$('#saveBtn');b.disabled=true;b.textContent='Saving…';
  try{await call('updateShow',{mfcId:id,patch});closeModal('editModal');toast('Show updated');await bootstrap();}
  catch(e){toast(e.message)}finally{b.disabled=false;b.textContent='Save changes'}
}
function openPayment(id){
  const p=state.payments.find(x=>x.payment_id===id);if(!p)return;
  $('#paymentBody').innerHTML=`<h2>${esc(p.event)} · ${esc(p.contract_year)}</h2><div class="subtitle">${esc(p.installment)} · due ${date(p.due)}</div><div class="detailGrid"><div class="detail"><div class="k">Contract amount</div><div class="val">${money(p.amount)}</div></div><div class="detail"><div class="k">Balance</div><div class="val">${money(p.balance??p.amount)}</div></div><div class="detail"><div class="k">Status</div><div class="val">${paymentPill(p)}</div></div><div class="detail"><div class="k">Due status</div><div class="val">${esc(p.due_status||'—')}</div></div></div><div class="field"><label>POSTED AMOUNT</label><input id="pPosted" inputmode="decimal" type="number" min="0" max="${Number(p.amount||0)}" step="0.01" value="${esc(p.posted_amount??'')}" /></div><div class="field"><label>POSTED DATE</label><input id="pDate" type="date" value="${esc(p.posted_date||'')}" /></div><div class="field"><label>CLEARING</label><select id="pClearing"><option value="">—</option>${['UNVERIFIED','PENDING','CLEARED'].map(v=>`<option ${p.clearing===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>PAYMENT OWNER</label><input id="pOwner" value="${esc(p.payment_owner||'')}" /></div><div class="field"><label>OPERATING NOTE</label><textarea id="pNotes">${esc(p.notes||'')}</textarea></div><div class="editnote">Contract amount, installment, due date and agreement references are protected. Status, approval, balance and due status are calculated by the app from posting/clearing.</div><div class="actions"><button class="btn secondary" id="paymentCancelBtn">Cancel</button><button class="btn primary" id="paySaveBtn">Save payment</button></div>`;
  $('#paymentCancelBtn').onclick=()=>closeModal('paymentModal');$('#paySaveBtn').onclick=()=>savePayment(p.payment_id);$('#paymentModal').classList.add('show');
}
async function savePayment(id){
  const patch={posted_amount:$('#pPosted').value,posted_date:$('#pDate').value||null,clearing:$('#pClearing').value||null,payment_owner:$('#pOwner').value,notes:$('#pNotes').value};
  const b=$('#paySaveBtn');b.disabled=true;b.textContent='Saving…';
  try{const d=await call('updatePayment',{paymentId:id,patch});state.payments=state.payments.map(p=>p.payment_id===id?d.payment:p);closeModal('paymentModal');toast('Payment updated');await bootstrap();}
  catch(e){toast(e.message)}finally{b.disabled=false;b.textContent='Save payment'}
}
function closeModal(id){$('#'+id).classList.remove('show');if(id==='detailModal'){state.deepLinkedProfile=null;state.deepLinkedYear=null;syncLocationView()}}
$('.nav button').forEach(b=>b.onclick=()=>{state.deepLinkedProfile=null;state.deepLinkedYear=null;state.tab=b.dataset.tab;syncLocationView();render();if(state.tab==='shows'&&state.showMode==='ALL'&&!state.catalogLoaded&&!state.catalogLoading)loadCatalog();if(state.tab==='shows'&&state.showMode==='UNLINKED'&&!state.unlinkedLp.loaded&&!state.unlinkedLp.loading)loadUnlinkedLp();window.scrollTo(0,0)});
$('#refreshBtn').onclick=async()=>{toast('Reloading operating data…');await bootstrap();if(state.catalogLoaded)await loadCatalog(true);if(state.unlinkedLp.loaded)await loadUnlinkedLp(true);toast('Current')};
$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m){m.classList.remove('show');if(m.id==='detailModal'){state.deepLinkedProfile=null;state.deepLinkedYear=null;syncLocationView()}}}));
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
bootstrap();

