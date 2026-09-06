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
function sourceFieldValue(row,keys){
  const fields=row&&row.source_fields&&typeof row.source_fields==='object'?row.source_fields:{};
  for(const key of keys){const value=fields[key];if(value!==null&&value!==undefined&&String(value).trim())return String(value).trim()}
  return '';
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
  const values=rows.filter(row=>row.com_percent!==null&&row.com_percent!==undefined&&String(row.com_percent)!=='');
  if(!values.length)return missingValue();
  return values.map(row=>`<div class="yearValueLine"><span>${esc(row.dates_text||'Date not stated')}</span><b>${esc(row.com_percent)}%</b></div>`).join('');
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
    const contact=String(row.contact||sourceFieldValue(row,['CONTACT INFO'])||'').trim();
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
  return `<details class="historyItem"><summary><span><b>${esc(x.source_year)}</b> · ${esc(x.dates_text||'Date not stated')}</span><span>${esc(x.final_cost_text||x.event_cost_text||'')}</span></summary><div class="historyBody">${historyEvidenceFlag(x)}${x.participation_status?`<div class="detailLine"><b>Participation</b><span>${esc(x.participation_status)}</span></div>`:''}${x.address?`<div class="detailLine"><b>Location</b><span>${esc(x.address)}${x.city?' · '+esc(x.city):''}</span></div>`:''}${x.booth?`<div class="detailLine"><b>Booth / space</b><span>${esc(x.booth)}</span></div>`:''}${x.coi?`<div class="detailLine"><b>COI</b><span>${esc(x.coi)}</span></div>`:''}${x.setup_info?`<div class="detailLine"><b>Setup</b><span>${esc(x.setup_info)}</span></div>`:''}${x.breakdown_info?`<div class="detailLine"><b>Breakdown</b><span>${esc(x.breakdown_info)}</span></div>`:''}${x.event_cost_text?`<div class="detailLine"><b>Event cost</b><span>${esc(x.event_cost_text)}</span></div>`:''}${x.final_cost_text?`<div class="detailLine"><b>Final cost</b><span>${esc(x.final_cost_text)}</span></div>`:''}${x.savings_text?`<div class="detailLine"><b>Savings</b><span>${esc(x.savings_text)}</span></div>`:''}${x.payment_status_text?`<div class="detailLine"><b>Payment</b><span>${esc(x.payment_status_text)}</span></div>`:''}${x.application_status_text?`<div class="detailLine"><b>Application</b><span>${esc(x.application_status_text)}</span></div>`:''}${x.calendar_status_text?`<div class="detailLine"><b>Calendar</b><span>${esc(x.calendar_status_text)}</span></div>`:''}${x.issued_appts!=null?`<div class="detailLine"><b>Issued / demos</b><span>${esc(x.issued_appts)} / ${esc(x.demos??'—')}</span></div>`:''}${x.gross_sales_count!=null?`<div class="detailLine"><b>Gross sales</b><span>${esc(x.gross_sales_count)} · ${money(x.gross_sales_value)}</span></div>`:''}${x.net_sales_count!=null?`<div class="detailLine"><b>Net sales</b><span>${esc(x.net_sales_count)} · ${money(x.net_revenue)}</span></div>`:''}${x.nsli!=null?`<div class="detailLine"><b>NSLI</b><span>${money(x.nsli)}</span></div>`:''}${x.com_percent!=null?`<div class="detailLine"><b>Event COM</b><span>${esc(x.com_percent)}%</span></div>`:''}${sourceFieldValue(x,['DIRECT + SETUP COM %'])?`<div class="detailLine"><b>Direct + setup COM</b><span>${esc(sourceFieldValue(x,['DIRECT + SETUP COM %']))}</span></div>`:''}${x.verification_status?`<div class="detailLine"><b>Verification</b><span>${esc(x.verification_status)}</span></div>`:''}${x.contact?`<div class="detailLine"><b>Contact</b><span>${esc(x.contact)}${contactActions(x.contact)}</span></div>`:''}${x.notes?`<div class="detailLine"><b>Notes</b><span>${esc(x.notes)}</span></div>`:''}<div class="actions"><a class="btn secondary sourceBtn" target="_blank" href="${historySourceUrl(x)}">${x.source_system==='GMAIL_CALENDAR'?'Open source email':'Open source row'}</a>${supplementalEvidenceLinks(x)}</div></div></details>`;
}
function yearScorecard(year,rows,lpItems,cumulativeItems){
  const recordCount=rows.length;
  const lpCount=lpItems.length;
  const cumulativeCount=cumulativeItems.length;
  const eventCosts=datedValues(rows,row=>row.final_cost_text||row.event_cost_text,v=>esc(v));
  const setupCosts=sourceFieldYearValues(rows,['DIRECT + SETUP COST']);
  const directSetupCom=sourceFieldYearValues(rows,['DIRECT + SETUP COM %']);
  const payment=datedValues(rows,row=>row.payment_status_text,v=>esc(v));
  const participation=datedValues(rows,row=>row.participation_status,v=>esc(v));
  const coi=datedValues(rows,row=>row.coi,v=>esc(v));
  const details=recordCount?`<details class="yearRecords"><summary>Preserved records & sources · ${recordCount}</summary><div class="historyList">${rows.map(historyItem).join('')}</div></details>`:'<div class="yearNoOccurrence">No preserved occurrence record for this year.</div>';
  return `<div class="yearScorecard"><div class="yearScoreHeader"><div><span>Year snapshot</span><b>${esc(year)}</b></div><div>${recordCount} record${recordCount===1?'':'s'} · ${lpCount} annual LP · ${cumulativeCount} cumulative LP</div></div><div class="yearFieldGrid"><div class="yearField wide"><span>Dates</span><div>${plainValues(rows,row=>row.dates_text,v=>esc(v))}</div></div><div class="yearField wide"><span>Booth / space</span><div>${datedValues(rows,row=>row.booth,v=>esc(v))}</div></div><div class="yearField"><span>Show cost</span><div>${eventCosts}</div></div><div class="yearField"><span>Direct + setup cost</span><div>${setupCosts}</div></div><div class="yearField"><span>Event COM</span><div>${comYearValues(rows)}</div></div><div class="yearField"><span>Direct + setup COM</span><div>${directSetupCom}</div></div></div><div class="yearMetricGrid"><div><span>Issued</span><b>${numericYearTotal(rows,'issued_appts',v=>Number(v).toLocaleString())}</b></div><div><span>Demos</span><b>${numericYearTotal(rows,'demos',v=>Number(v).toLocaleString())}</b></div><div><span>Net sales</span><b>${numericYearTotal(rows,'net_sales_count',v=>Number(v).toLocaleString())}</b></div><div><span>Net revenue</span><b>${numericYearTotal(rows,'net_revenue',money)}</b></div><div><span>Gross sales</span><b>${numericYearTotal(rows,'gross_sales_count',v=>Number(v).toLocaleString())}</b></div><div><span>Gross volume</span><b>${numericYearTotal(rows,'gross_sales_value',money)}</b></div><div class="wide"><span>NSLI</span><b>${numericYearTotal(rows,'nsli',money)}</b></div></div><div class="yearField full"><span>Show contact</span><div>${contactYearValues(rows)}</div></div><div class="yearStatusGrid"><div><span>Payment</span><div>${payment}</div></div><div><span>Participation</span><div>${participation}</div></div><div><span>COI</span><div>${coi}</div></div></div><div class="yearLpSection"><div class="yearSubhead">LeadPerfection annual-period performance</div>${lpYearHtml(lpItems)}</div><div class="yearLpSection cumulativeLpSection"><div class="yearSubhead">LeadPerfection cumulative / lifetime attribution</div>${cumulativeLpYearHtml(cumulativeItems)}</div>${details}</div>`;
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
async function openCatalog(id){
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
    const selectedHistoryYear=state.catalogFilters.historyYear==='ALL'?null:Number(state.catalogFilters.historyYear);
    const focusedHistoryYear=Number.isFinite(selectedHistoryYear)&&years.includes(selectedHistoryYear)?selectedHistoryYear:null;
    const orderedYears=focusedHistoryYear?[focusedHistoryYear,...years.filter(y=>y!==focusedHistoryYear)]:years;
    const historyHtml=years.length?orderedYears.map((year,i)=>{
      const rows=h.filter(x=>Number(x.source_year||0)===year);
      const lpItems=perf.filter(x=>Number(x.source_year||0)===year);
      const cumulativeItems=cum.filter(x=>Number(x.source_year||0)===year);
      return `<details class="historyYear ${focusedHistoryYear===year?'focusedYear':''}" ${i===0?'open':''}><summary><span>${esc(year)}${focusedHistoryYear===year?'<span class="yearFocusTag">Selected year</span>':''}</span><span>${rows.length} record${rows.length===1?'':'s'} · ${lpItems.length} annual LP · ${cumulativeItems.length} cumulative LP</span></summary><div class="historyYearBody">${yearScorecard(year,rows,lpItems,cumulativeItems)}</div></details>`;
    }).join(''):'<div class="empty">No preserved yearly history or performance evidence is linked to this profile.</div>';
    const latestContact=[...h].filter(x=>String(x.contact||sourceFieldValue(x,['CONTACT INFO'])||'').trim()).sort((a,b)=>Number(b.source_year||0)-Number(a.source_year||0)||Number(b.source_row||0)-Number(a.source_row||0))[0]||null;
    const latestContactText=latestContact?String(latestContact.contact||sourceFieldValue(latestContact,['CONTACT INFO'])||'').trim():'';
    const latestContactHtml=`<div class="latestContact"><div class="k">Latest known show contact</div>${latestContact?`<div class="latestContactValue"><b>${esc(latestContactText)}</b><span>Preserved ${esc(latestContact.source_year)} record</span>${contactActions(latestContactText)}</div>`:`<div class="latestContactValue"><b class="yearMissing">${HISTORY_MISSING}</b></div>`}</div>`;
    const historyFocusNote=focusedHistoryYear?`<div class="sourceWarn yearFocusNote"><b>${esc(focusedHistoryYear)} selected</b> · That year is opened first. Other preserved years remain available below.</div>`:'';
    const profileLabel=lpSourceOnly?'LP source only':(p.tier||p.source_type.replaceAll('_',' '));
    const lpSourceOnlyNotice=lpSourceOnly?`<div class="sourceWarn historyIntro"><b>LP source-only identity.</b> This profile exists only to anchor specific LeadPerfection attribution. It does not assert Paradise attended, worked, staffed, booked, paid for, or completed the event; no history occurrence was created.</div>`:'';
    const yearSectionLabel=lpSourceOnly?'LeadPerfection evidence years':'Preserved historical years';
    $('#detailBody').innerHTML=`<h2>${esc(p.canonical_event)}</h2><div class="subtitle">${esc(p.profile_id)} · ${esc(profileLabel)}</div><div class="detailGrid"><div class="detail"><div class="k">Lifetime occurrences</div><div class="val">${esc(p.occurrences??'—')}</div></div><div class="detail"><div class="k">Preserved history records</div><div class="val">${h.length}</div></div><div class="detail"><div class="k">Lifetime net</div><div class="val">${money(p.lifetime_net_volume)}</div></div><div class="detail"><div class="k">Lifetime net sales</div><div class="val">${esc(p.lifetime_net_sales??'—')}</div></div><div class="detail"><div class="k">Lifetime close volume</div><div class="val">${money(p.lifetime_close_volume)}</div></div><div class="detail"><div class="k">LP annual sources</div><div class="val">${perf.length}</div></div><div class="detail"><div class="k">LP cumulative sources</div><div class="val">${cum.length}</div></div></div>${latestContactHtml}${aliases.length?`<div class="block"><div class="k">Known aliases</div><div class="val">${aliases.map(esc).join(' · ')}</div></div>`:''}${mfcs.length?`<div class="block"><div class="k">Current operating control</div><div class="actions">${mfcs.map(x=>`<button class="btn primary catalogMfcBtn" data-mfc="${esc(x)}">Open ${esc(x)}</button>`).join('')}</div></div>`:''}${lifetimeSource?`<div class="block"><div class="k">Lifetime performance source</div><div class="actions">${lifetimeSource}</div></div>`:''}${lpSourceOnlyNotice}<div class="sourceWarn historyIntro"><b>Year cards are source-first.</b> Annual-period LeadPerfection values answer what the restricted calendar-year report showed. Cumulative/lifetime values come from the separate 2012–2026 report-period query. Neither LeadPerfection layer is treated as attendance proof, and cumulative values do not overwrite annual history.</div>${operatingHtml?`<div class="sectionTitle"><span>Current operating year${operatingRows.length===1?'':'s'}</span><span>${operatingRows.length} control${operatingRows.length===1?'':'s'}</span></div><div class="historyList currentYearList">${operatingHtml}</div>`:''}${historyFocusNote}<div class="sectionTitle"><span>${esc(yearSectionLabel)}</span><span>${years.length} year${years.length===1?'':'s'}</span></div><div class="historyList">${historyHtml}</div><div class="actions"><button class="btn secondary" id="catalogCloseBtn">Close</button></div>`;
    $('#catalogCloseBtn').onclick=()=>closeModal('detailModal');
    $$('.catalogMfcBtn').forEach(b=>b.onclick=()=>openDetail(b.dataset.mfc));
    $$('.currentMfcBtn').forEach(b=>b.onclick=()=>openDetail(b.dataset.mfc));
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
function closeModal(id){$('#'+id).classList.remove('show')}
$('.nav button').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render();if(state.tab==='shows'&&state.showMode==='ALL'&&!state.catalogLoaded&&!state.catalogLoading)loadCatalog();if(state.tab==='shows'&&state.showMode==='UNLINKED'&&!state.unlinkedLp.loaded&&!state.unlinkedLp.loading)loadUnlinkedLp();window.scrollTo(0,0)});
$('#refreshBtn').onclick=async()=>{toast('Reloading operating data…');await bootstrap();if(state.catalogLoaded)await loadCatalog(true);if(state.unlinkedLp.loaded)await loadUnlinkedLp(true);toast('Current')};
$$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')}));
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
bootstrap();

