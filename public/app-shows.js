function currentProfileForShow(show){
  if(!show||!state.catalogLoaded)return null;
  return state.catalog.find(p=>Array.isArray(p?.matched_mfc_ids)&&p.matched_mfc_ids.includes(show.mfc_id))||null;
}
function bookingOpportunityOpen(show){
  const text=[show?.booking_status,show?.source_detail?.follow_up_detail,show?.payment_terms].filter(Boolean).join(' ').toUpperCase();
  return /(APPLICATIONS? OPEN|VENDOR (APPLICATION|INTEREST|CALL)|EXHIBITOR (SALES|SPACE|APPLICATION)|CONTRACT OFFER|REGISTRATION OFFER|SOLICITING|BOOTH AWAITS|APPLY|RESERVATION)/.test(text)
    && !/(EVENT (WAS )?FULL|ALREADY FULL)/.test(text);
}
function bookingCommitted(show){
  const status=String(show?.booking_status||'').toUpperCase();
  const payment=String(show?.source_detail?.payment_status||'').toUpperCase();
  if(/NOT BOOKED|BOOKING NOT|NOT CONFIRMED|NOT VERIFIED|PARTICIPATION NOT/.test(status))return false;
  return /(CONTRACTED|CONTRACT SIGNED|SIGNED CONTRACT|BOOKED|RESERVED|CONFIRMED)/.test(status)||/(COMMITMENT APPROVED|PAID \/ VERIFIED)/.test(payment);
}
function bookingSignal(show){
  const decision=String(show?.decision||'').toUpperCase();
  const end=show?.event_end||show?.event_start||null;
  const endDays=end?daysFromToday(end):null;
  const startDays=show?.event_start?daysFromToday(show.event_start):null;
  const open=bookingOpportunityOpen(show);
  const status=String(show?.booking_status||'').toUpperCase();
  if(endDays!==null&&endDays<0)return {key:'NEXT_CYCLE',label:'NEXT CYCLE',detail:'Current occurrence has passed · get the next date early',weight:7,cls:'next'};
  if(startDays!==null&&startDays<=0&&endDays!==null&&endDays>=0)return {key:'IN_PROGRESS',label:'CURRENT EVENT',detail:'Occurrence has started · use this cycle for execution and next-cycle planning',weight:6,cls:'watch'};
  if(!show?.event_start)return {key:'WATCH_DATE',label:'WATCH FOR DATE',detail:'No current event date · monitor organizer before committing',weight:6,cls:'watch'};
  if(/ACCOUNT GATE|HARD GATE|BOOKING GATE/.test(status))return {key:'GATED',label:'GATED / VERIFY',detail:'Do not book until the current account / eligibility gate is cleared',weight:5,cls:'watch'};
  if(bookingCommitted(show))return {key:'COMMITTED',label:'COMMITTED',detail:'Booking is supported · manage confirmation / payment controls',weight:0,cls:'committed'};
  if(decision.includes('TIER 3'))return {key:'NEGOTIATE_ONLY',label:'NEGOTIATE ONLY',detail:open?'Opportunity is open · proceed only if price / placement improves':'Do not book at current economics without improved terms',weight:4,cls:'negotiate'};
  if(decision.includes('TIER 2'))return {key:'TEST_NEGOTIATE',label:'TEST / NEGOTIATE',detail:open?'Opportunity is open · use only as a controlled test':'Consider only as a controlled test with defined spend',weight:3,cls:'test'};
  if(decision.includes('TIER 1')||decision.includes('RESTART')){
    if(startDays!==null&&startDays<=7)return {key:'LATE_VERIFY',label:'LATE / VERIFY NOW',detail:'Event is within 7 days and booking is not confirmed · verify availability immediately',weight:1,cls:'book'};
    if(open)return {key:'BOOK_NOW',label:'BOOK / APPLY NOW',detail:'High-priority history + current opportunity is open',weight:1,cls:'book'};
    return {key:'PRIORITY_REVIEW',label:'PRIORITY REVIEW',detail:startDays!==null&&startDays>=0?'Future Tier 1 / restart candidate · confirm availability now':'High-priority history · verify next booking opportunity',weight:2,cls:'book'};
  }
  return {key:'REVIEW',label:'REVIEW',detail:open?'Current opportunity is open · review history and terms':'Review history, cost, and current organizer status',weight:3,cls:'review'};
}
function bookingEventRange(show){
  if(!show?.event_start&&!show?.event_end)return 'Date not verified';
  const start=show.event_start?date(show.event_start):'—';
  const end=show.event_end&&show.event_end!==show.event_start?date(show.event_end):'';
  return end?start+' – '+end:start;
}
function bookingTiming(show){
  const signal=bookingSignal(show);
  const due=daysFromToday(show?.action_due);
  if(signal.key==='COMMITTED'){
    if(show?.next_payment_due)return 'Payment due '+date(show.next_payment_due);
    if(due!==null&&due<0)return 'Booking active · follow-up overdue';
    if(show?.action_due)return 'Booking active · follow up '+date(show.action_due);
    return 'Booking active · manage confirmation / payment';
  }
  if(signal.key==='GATED')return 'Now · clear booking / account gate';
  if(signal.key==='IN_PROGRESS')return 'Current event · plan next cycle now';
  if(signal.key==='NEXT_CYCLE')return 'Now · request next cycle / next date';
  if(signal.key==='WATCH_DATE')return 'Monitor · request date when organizer opens';
  if(signal.key==='LATE_VERIFY')return 'Immediate · verify availability now';
  if(signal.key==='BOOK_NOW')return 'Now · opportunity is open';
  if(due!==null&&due<0)return 'Now · follow-up is overdue';
  if(show?.action_due)return 'Follow up by '+date(show.action_due);
  return 'Review current availability now';
}
function bookingBoardSummary(){
  const rows=state.shows.filter(s=>s.this_year!=='SKIP THIS YEAR');
  const signals=rows.map(bookingSignal);
  const count=key=>signals.filter(x=>x.key===key).length;
  return {book:count('BOOK_NOW')+count('PRIORITY_REVIEW')+count('LATE_VERIFY'),committed:count('COMMITTED'),test:count('TEST_NEGOTIATE')+count('NEGOTIATE_ONLY'),watch:count('WATCH_DATE')+count('NEXT_CYCLE')+count('IN_PROGRESS')+count('GATED')};
}
function showCard(s){
  const signal=bookingSignal(s),profile=currentProfileForShow(s);
  const history=profile?`${Number(profile.history_count||0)} history records${profile.lifetime_net_volume!=null?' · '+money(profile.lifetime_net_volume)+' lifetime net':''}`:'';
  const boothHint=profile?.best_observed_specific_booth
    ?`Best outcome-linked specific booth: ${profile.best_observed_specific_booth}${profile.best_observed_specific_booth_year?' ('+profile.best_observed_specific_booth_year+')':''}`
    :(profile?.best_observed_booth
      ?`Best outcome-linked placement: ${profile.best_observed_booth}${profile.best_observed_booth_year?' ('+profile.best_observed_booth_year+')':''}`
      :(profile?.latest_preserved_booth?`Latest placement: ${profile.latest_preserved_booth}${profile.latest_preserved_booth_year?' ('+profile.latest_preserved_booth_year+')':''}`:(profile?.has_booth?'Booth history available':'')));
  const follow=s.follow_up&&s.follow_up!=='—'?`<div class="action">${esc(s.follow_up)}</div>`:'';
  return `<div class="card bookingCard" data-id="${esc(s.mfc_id)}"><div class="row"><div><div class="event">${esc(s.event)}</div><div class="mfc">${esc(s.mfc_id)} · ${esc(s.restart_wave||'')}</div></div><span class="badge ${badgeClass(s.show_status)}">${esc(s.show_status)}</span></div><div class="bookingSignal ${esc(signal.cls)}"><b>${esc(signal.label)}</b><span>${esc(signal.detail)}</span></div><div class="bookingDecision">${esc(s.decision||'Decision not stated')}</div><div class="bookingGrid"><div><span>Event</span><b>${esc(bookingEventRange(s))}</b></div><div><span>Max booking cost</span><b>${s.max_booking_cost!=null?money(s.max_booking_cost):'Not verified'}</b></div><div><span>History</span><b>${history?esc(history):'Loading linked history…'}</b>${boothHint?`<small class="bookingBoothHint">${esc(boothHint)}</small>`:''}</div><div><span>When to act</span><b>${esc(bookingTiming(s))}</b></div></div>${s.performance?`<div class="bookingPerformance"><span>Historical signal</span><b>${esc(s.performance)}</b></div>`:''}${s.booking_status?`<div class="bookingStatusLine"><span>Booking status</span><b>${esc(s.booking_status)}</b></div>`:''}${s.payment_terms&&s.payment_terms!=='—'?`<div class="bookingStatusLine"><span>Booking / payment terms</span><b>${esc(s.payment_terms)}</b></div>`:''}${follow}<div class="meta"><span>${esc(s.owner||'Unassigned')}</span>${s.source_detail?.needs_evidence&&s.source_detail.needs_evidence!=='NONE'?`<span class="pill review">Needs ${esc(s.source_detail.needs_evidence)}</span>`:''}${s.this_year==='SKIP THIS YEAR'?'<span class="pill review">SKIPPED THIS YEAR</span>':''}</div></div>`;
}

function renderToday(){
  const actions=activeActions();const counts=countStatuses();const pay=paymentAttention();const rs=state.reconciliation.summary||{};
  const drift=Number(rs.changed||0),sourceReview=(state.sourceRefresh.conflicts||[]).length;const rh=state.recoveryHealth,recoveryReview=!rh||rh.integrity_status!=='HEALTHY'||rh.hashes_valid!==true||rh.row_counts_valid!==true||rh.coverage_current!==true;
  return `<div class="hero"><h1>Work today / this week</h1><p>Only actionable show work and payment exceptions are surfaced here.</p></div>${recoveryReview?`<div class="alert"><div class="event">Recovery checkpoint needs review</div><div class="action">The latest operating recovery checkpoint did not pass every integrity/coverage control. Review Recovery health in Control before relying on rollback.</div></div>`:''}${sourceReview?`<div class="alert"><div class="event">Google Sheet refresh needs review</div><div class="action">${sourceReview} conflicting field${sourceReview===1?'':'s'} were preserved. Review in Control; nothing conflicting was overwritten.</div></div>`:''}${drift?`<div class="alert"><div class="event">Source reconciliation needs review</div><div class="action">${drift} show${drift===1?'':'s'} changed in the app since the last verified Sheet snapshot. Review in Control before treating the Sheet and app as identical.</div></div>`:''}<div class="stats"><div class="stat"><div class="v">${actions.length}</div><div class="l">Show actions</div></div><div class="stat"><div class="v">${pay.length}</div><div class="l">Payment alerts</div></div><div class="stat"><div class="v">${counts.RECONCILE||0}</div><div class="l">Reconcile</div></div></div>${pay.length?`<div class="sectionTitle"><span>Payment attention</span><span>${pay.length} open</span></div>${pay.map(p=>`<div class="alert paymentCard" data-payment="${esc(p.payment_id)}"><div class="row"><div><div class="event">${esc(p.event)} · ${esc(p.contract_year)}</div><div class="mfc">${esc(p.installment)} · due ${date(p.due)}</div></div>${paymentPill(p)}</div><div class="action">${money(p.balance??p.amount)} remaining · ${esc(p.clearing||'UNVERIFIED')}</div></div>`).join('')}`:''}<div class="sectionTitle"><span>Show priority queue</span><span>${state.shows.length} shows controlled</span></div>${actions.length?actions.map(showCard).join(''):'<div class="empty">No dated show actions are open.</div>'}`
}
function countStatuses(){return state.shows.reduce((a,s)=>(a[s.show_status]=(a[s.show_status]||0)+1,a),{})}
function opportunityCostNumber(op,key){
  const v=op?.[key];
  if(v===null||v===undefined||v==='')return null;
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}
function opportunityCostText(op){
  const min=opportunityCostNumber(op,'booking_cost_min');
  const max=opportunityCostNumber(op,'booking_cost_max');
  if(min===null&&max===null)return '';
  let amount='';
  if(min!==null&&max===null)amount=money(min)+'+';
  else if(min===null&&max!==null)amount='Up to '+money(max);
  else amount=min===max?money(min):`${money(min)}–${money(max)}`;
  return amount+(op?.booking_cost_unit?` · ${op.booking_cost_unit}`:'');
}
function opportunityCostStatusLabel(value){
  const key=String(value||'').toUpperCase();
  return ({
    KNOWN_VERIFIED:'Known verified cost',
    QUOTE_REQUIRED:'Quote required',
    CONTRACT_REVIEW_REQUIRED:'Review current contract',
    RECONCILE_EXISTING:'Reconcile existing booking',
    NOT_PUBLISHED_YET:'Not published yet',
    NEXT_CYCLE_CLOSED:'Next cycle / closed'
  })[key]||String(value||'Not classified').replaceAll('_',' ');
}
function opportunityCommitmentStatusLabel(value){
  const key=String(value||'').toUpperCase();
  return ({
    VERIFIED_CURRENT:'Verified current commitment terms',
    PARTIAL_CURRENT:'Partial current commitment terms',
    AGREEMENT_REQUIRED:'Agreement / quote terms required',
    RECONCILE_EXISTING:'Reconcile existing commitment',
    NOT_PUBLISHED_YET:'Commitment terms not published yet',
    NEXT_CYCLE_CLOSED:'Next cycle / no current commitment'
  })[key]||String(value||'Not classified').replaceAll('_',' ');
}
function opportunityPlacementStatusLabel(value){
  const key=String(value||'').toUpperCase();
  return ({
    ASSIGNED_VERIFIED:'Assigned / verified',
    LISTED_ASSIGNMENT_UNVERIFIED:'Listed / assignment unverified',
    FLOOR_PLAN_AVAILABLE_NOT_SELECTED:'Floor plan available / not selected',
    APPLICATION_OPEN_NOT_ASSIGNED:'Application open / not assigned',
    CONTRACT_REQUEST_NOT_ASSIGNED:'Contract / availability open / not assigned',
    SPONSORSHIP_PLACEMENT_UNVERIFIED:'Sponsorship / activation placement unverified',
    PLACEMENT_NOT_PUBLISHED:'Placement not published',
    NEXT_CYCLE_CLOSED:'Next cycle / no current placement'
  })[key]||String(value||'Not classified').replaceAll('_',' ');
}
function opportunityScheduleStatusLabel(value){
  const key=String(value||'').toUpperCase();
  return ({
    VERIFIED_CURRENT:'Verified current schedule',
    NOT_PUBLISHED_YET:'Hours not published yet',
    CURRENT_SOURCE_HOURS_NOT_RECOVERED:'Hours not recovered from current source',
    SOURCE_CONFLICT_REQUIRES_CONFIRMATION:'Official source conflict / confirm'
  })[key]||String(value||'Not classified').replaceAll('_',' ');
}
function opportunityLogisticsStatusLabel(value){
  const key=String(value||'').toUpperCase();
  return ({
    VERIFIED_CURRENT:'Verified current logistics',
    PARTIAL_CURRENT:'Partial current logistics',
    EXHIBITOR_KIT_REQUIRED:'Exhibitor kit required',
    PROPOSAL_REQUIRED:'Proposal required',
    NOT_PUBLISHED_YET:'Logistics not published yet',
    NEXT_CYCLE_CLOSED:'Next cycle / logistics unavailable'
  })[key]||String(value||'Not classified').replaceAll('_',' ');
}
function rebookContactActions(value,profileId,structuredEmail,structuredPhone){
  const text=String(value||'');
  const emailCandidates=[String(structuredEmail||'').trim(),...(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[])].filter(Boolean);
  const emails=[];const seenEmails=new Set();
  for(const email of emailCandidates){
    const key=email.toLowerCase();
    if(seenEmails.has(key))continue;
    seenEmails.add(key);emails.push(email);
  }
  const phoneCandidates=[String(structuredPhone||'').trim(),...(text.match(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?:\s*(?:x|ext\.?)\s*\d+)?/gi)||[])].filter(Boolean);
  const phones=[];const seenPhones=new Set();
  for(const phone of phoneCandidates){
    const dial=phone.replace(/[^\d+]/g,'');
    const key=dial.replace(/^\+?1(?=\d{10}$)/,'');
    if(!key||seenPhones.has(key))continue;
    seenPhones.add(key);phones.push({label:phone,dial});
  }
  if(!emails.length&&!phones.length)return '';
  return `<div class="contactActions" data-current-contact-actions-profile="${esc(profileId||'')}">${phones.map(phone=>`<a class="contactBtn" href="tel:${esc(phone.dial)}">Call ${esc(phone.label)}</a>`).join('')}${emails.map(email=>`<a class="contactBtn" href="mailto:${esc(email)}">Email ${esc(email)}</a>`).join('')}</div>`;
}
function rebookVenueDirections(value,profileId){
  const text=String(value||'').trim();
  if(!text)return '';
  const url='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(text);
  return `<div class="contactActions" data-current-venue-actions-profile="${esc(profileId||'')}"><a class="contactBtn" target="_blank" rel="noopener noreferrer" href="${esc(url)}">Open venue map</a></div>`;
}
function rebookOpportunityCard(op,compact=false){
  if(!op)return '';
  const rawStatus=String(op.opportunity_status||'').toUpperCase();
  const status=rawStatus.replaceAll('_',' ');
  const exhibitorListed=rawStatus==='EXHIBITOR_LISTED';
  const watchState=rawStatus==='WATCH'||rawStatus==='APPLICATION_CLOSED';
  const heading=exhibitorListed?'Verified current exhibitor listing':(watchState?'Verified current watch':'Verified current opportunity');
  const range=op.event_start
    ?(op.event_end
      ?date(op.event_start)+(op.event_end!==op.event_start?' – '+date(op.event_end):'')
      :'Starts '+date(op.event_start)+' · end date not published / not verified')
    :'Current date not verified';
  const checked=String(op.checked_at||'').slice(0,10);
  const action=op.action_url?`<div class="rebookLiveActions"><a class="btn primary" target="_blank" rel="noopener noreferrer" href="${esc(op.action_url)}">${esc(op.action_label||'Open booking action')}</a></div>`:'';
  const cost=opportunityCostText(op);
  const comparableCost=cost?`<div class="wide" data-current-booking-cost-profile="${esc(op.profile_id)}"><span>Decision-safe current booking cost</span><b>${esc(cost)}${op.booking_cost_basis?` · ${esc(op.booking_cost_basis)}`:''}</b></div>`:'';
  const commitment=op.commitment_terms_text?`<div class="wide" data-current-commitment-profile="${esc(op.profile_id)}"><span>Commitment / payment terms</span><b>${esc(op.commitment_terms_text)}</b></div>`:'';
  const criticalDeadline=op.critical_deadline_date?`<div class="wide" data-current-critical-deadline-profile="${esc(op.profile_id)}"><span>Critical commitment date</span><b>${esc(date(op.critical_deadline_date))}${op.critical_deadline_label?` · ${esc(op.critical_deadline_label)}`:''}${op.critical_deadline_basis?` · ${esc(op.critical_deadline_basis)}`:''}</b></div>`:'';
  const scheduleLabel=opportunityScheduleStatusLabel(op.current_schedule_status);
  const logisticsLabel=opportunityLogisticsStatusLabel(op.current_logistics_status);
  const scheduleSource=op.current_schedule_source_url?`<div class="contactActions" data-current-schedule-source-profile="${esc(op.profile_id)}"><a class="contactBtn" target="_blank" rel="noopener noreferrer" href="${esc(op.current_schedule_source_url)}">Open schedule source</a></div>`:'';
  const schedule=op.current_schedule_text?`<div class="wide" data-current-schedule-profile="${esc(op.profile_id)}"><span>Current schedule / public hours</span><b>${esc(op.current_schedule_text)}</b>${scheduleSource}</div>`:'';
  const logisticsSource=op.current_logistics_source_url?`<div class="contactActions" data-current-logistics-source-profile="${esc(op.profile_id)}"><a class="contactBtn" target="_blank" rel="noopener noreferrer" href="${esc(op.current_logistics_source_url)}">Open logistics source</a></div>`:'';
  const logistics=op.current_logistics_text?`<div class="wide" data-current-logistics-profile="${esc(op.profile_id)}"><span>Day-of-show logistics</span><b>${esc(op.current_logistics_text)}</b>${logisticsSource}</div>`:'';
  const scheduleStatus=`<div data-current-schedule-status-profile="${esc(op.profile_id)}"${compact?'':` data-current-operations-expanded-profile="${esc(op.profile_id)}"`}><span>Current schedule status</span><b>${esc(scheduleLabel)}</b></div>`;
  const logisticsStatus=`<div data-current-logistics-status-profile="${esc(op.profile_id)}"><span>Current logistics status</span><b>${esc(logisticsLabel)}</b></div>`;
  const operationsInline=compact?'':scheduleStatus+schedule+logisticsStatus+logistics;
  const operationsCompact=compact&&(schedule||logistics)
    ?`<details class="rebookOpsDetails" data-current-operations-compact-profile="${esc(op.profile_id)}"><summary><span>Schedule & day-of-show</span><b>${esc(scheduleLabel)} · ${esc(logisticsLabel)}</b></summary><div class="rebookOpsGrid">${scheduleStatus}${schedule}${logisticsStatus}${logistics}</div></details>`
    :'';
  return `<div class="rebookLive"><div class="rebookLiveHead"><span>${esc(heading)}</span><b>${esc(status)}</b></div><div class="rebookLiveGrid"><div data-current-date-profile="${esc(op.profile_id)}"><span>When</span><b>${esc(range)}</b></div><div><span>Current price / terms</span><b>${esc(op.price_text||'Not published / not verified')}</b></div><div data-current-cost-status-profile="${esc(op.profile_id)}"><span>Current cost status</span><b>${esc(opportunityCostStatusLabel(op.current_cost_status))}</b></div><div data-current-commitment-status-profile="${esc(op.profile_id)}"><span>Current commitment status</span><b>${esc(opportunityCommitmentStatusLabel(op.current_commitment_status))}</b></div><div data-current-placement-status-profile="${esc(op.profile_id)}"><span>Current placement status</span><b>${esc(opportunityPlacementStatusLabel(op.current_placement_status))}</b></div>${operationsInline}<div class="wide" data-current-venue-profile="${esc(op.profile_id)}"><span>Venue / address</span><b>${esc(op.venue_text||'Verify current venue with organizer')}</b>${rebookVenueDirections(op.venue_text,op.profile_id)}</div><div class="wide" data-current-placement-profile="${esc(op.profile_id)}"><span>Current booth / placement</span><b>${esc(op.current_placement_text||'No current Paradise placement is verified; confirm with organizer before booking.')}</b></div>${comparableCost}${commitment}${criticalDeadline}${op.prior_cost_text?`<div class="wide"><span>Prior cost / reference status</span><b>${esc(op.prior_cost_text)}</b></div>`:''}<div class="wide"><span>Booking window</span><b>${esc(op.booking_window_text||'Verify directly with organizer')}</b></div><div class="wide" data-current-contact-profile="${esc(op.profile_id)}"><span>Current contact</span><b>${esc(op.contact_text||'Not published')}</b>${rebookContactActions(op.contact_text,op.profile_id,op.contact_email,op.contact_phone)}</div></div>${operationsCompact}${op.notes?`<div class="rebookLiveNote">${esc(op.notes)}</div>`:''}${action}<div class="rebookLiveFoot">${checked?`Checked ${esc(checked)} · `:''}${esc(op.source_label||'Verified current source')}${op.source_url?` · <a target="_blank" rel="noopener noreferrer" href="${esc(op.source_url)}">Open current source</a>`:''}</div></div>`;
}
function bookingReadinessLabel(value){
  const v=String(value||'').toUpperCase();
  return ({
    READY_TO_COMMIT:'Ready to commit',
    PRE_BOOKING_ACTION_REQUIRED:'Pre-booking action required',
    WATCH_GATED:'Watch / gated',
    HOLD_RECONCILE:'Hold / reconcile',
    REVIEW_REQUIRED:'Review required'
  })[v]||'Review required';
}
function resolutionLaneLabel(value){
  const v=String(value||'').toUpperCase();
  return ({
    PARADISE_ACTION:'Paradise action',
    ORGANIZER_RESPONSE:'Organizer response',
    WAIT_FOR_PUBLICATION:'Wait for publication',
    RECONCILE_EXISTING:'Reconcile existing',
    RESEARCH_REQUIRED:'Research required'
  })[v]||String(value||'Not classified').replaceAll('_',' ');
}
function historicalOutreachCycleStatusLabel(value){
  const key=String(value||'').toUpperCase();
  return ({
    ACTIVE_HOST_DATE_REQUIRED:'Active host · date required',
    ACTIVE_SERIES_DATE_UNVERIFIED:'Active series · next date unverified',
    NEXT_CYCLE_NOT_PUBLISHED:'Next cycle not published'
  })[key]||String(value||'Current cycle not classified').replaceAll('_',' ');
}
function historicalOutreachCycle(review){
  const status=String(review?.outreach_cycle_status||'').trim();
  const detail=String(review?.outreach_cycle_text||'').trim();
  const sourceUrl=String(review?.outreach_cycle_source_url||'').trim();
  const sourceLabel=String(review?.outreach_cycle_source_label||'').trim();
  const checked=String(review?.outreach_cycle_checked_at||'').slice(0,10);
  if(!status&&!detail&&!sourceUrl)return '';
  const sourceAction=sourceUrl?`<div class="contactActions" data-historical-outreach-cycle-actions-profile="${esc(review.profile_id)}"><a class="contactBtn" target="_blank" rel="noopener noreferrer" href="${esc(sourceUrl)}">Open cycle source</a></div>`:'';
  const provenance=[checked?`checked ${checked}`:'',sourceLabel].filter(Boolean).join(' · ');
  return `<div class="wide" data-historical-outreach-cycle-profile="${esc(review.profile_id)}"><span>Current cycle status</span><b>${esc(historicalOutreachCycleStatusLabel(status))}</b>${detail?`<div class="rebookCycleText">${esc(detail)}</div>`:''}${sourceAction}${provenance?`<div class="rebookLiveFoot" data-historical-outreach-cycle-source-profile="${esc(review.profile_id)}">${esc(provenance)}</div>`:''}</div>`;
}
function historicalReviewOutreach(review){
  const name=String(review?.outreach_contact_name||'').trim();
  const phone=String(review?.outreach_contact_phone||'').trim();
  const email=String(review?.outreach_contact_email||'').trim();
  const sourceUrl=String(review?.outreach_contact_source_url||'').trim();
  const sourceLabel=String(review?.outreach_contact_source_label||'').trim();
  const checked=String(review?.outreach_contact_checked_at||'').slice(0,10);
  if(!name&&!phone&&!email&&!sourceUrl)return '';
  const contact=[name,phone,email].filter(Boolean).join(' · ');
  const actions=[];
  if(phone){
    const dial=phone.replace(/[^\d+]/g,'');
    if(dial)actions.push(`<a class="contactBtn" href="tel:${esc(dial)}">Call ${esc(phone)}</a>`);
  }
  if(email)actions.push(`<a class="contactBtn" href="mailto:${esc(email)}">Email ${esc(email)}</a>`);
  if(sourceUrl)actions.push(`<a class="contactBtn" target="_blank" rel="noopener noreferrer" href="${esc(sourceUrl)}">Open outreach source</a>`);
  const provenance=[checked?`checked ${checked}`:'',sourceLabel].filter(Boolean).join(' · ');
  return `<div class="wide" data-historical-outreach-profile="${esc(review.profile_id)}"><span>Current outreach contact</span><b>${esc(contact||'Use verified outreach source')}</b>${actions.length?`<div class="contactActions" data-historical-outreach-actions-profile="${esc(review.profile_id)}">${actions.join('')}</div>`:''}${provenance?`<div class="rebookLiveFoot" data-historical-outreach-source-profile="${esc(review.profile_id)}">${esc(provenance)}</div>`:''}</div>`;
}
function rebookReviewCard(review,hasLiveOpportunity=false){
  if(!review)return '';
  const disposition=String(review.disposition||'').toUpperCase()||'REVIEW';
  const checked=String(review.checked_at||'').slice(0,10);
  const evidence=String(review.evidence_date||'').slice(0,10);
  const css=disposition.toLowerCase();
  const live=Boolean(hasLiveOpportunity);
  const heading=live?'Current booking review':'Historical candidate review';
  const readiness=review.booking_readiness?`<div data-booking-readiness-profile="${esc(review.profile_id)}"><span>Booking readiness</span><b>${esc(bookingReadinessLabel(review.booking_readiness))}</b></div>`:'';
  const resolution=live&&review.resolution_lane?`<div data-resolution-lane-profile="${esc(review.profile_id)}"><span>Resolution lane</span><b>${esc(resolutionLaneLabel(review.resolution_lane))}</b></div>`:'';
  const cycle=live?'':historicalOutreachCycle(review);
  const outreach=live?'':historicalReviewOutreach(review);
  return `<div class="rebookReview ${esc(css)}" data-review-profile="${esc(review.profile_id)}" data-review-scope="${live?'live':'historical'}"><div class="rebookReviewHead"><span>${heading}</span><b>${esc(disposition)}</b></div><div class="rebookReviewGrid">${readiness}${resolution}${cycle}${outreach}${review.action_timing?`<div class="wide"><span>When to act</span><b>${esc(review.action_timing)}</b></div>`:''}${review.blockers_text?`<div class="wide"><span>Still needed before booking</span><b>${esc(review.blockers_text)}</b></div>`:''}<div class="wide"><span>Why</span><b>${esc(review.rationale||(live?'Current review requires attention.':'Historical candidate review requires attention.'))}</b></div>${review.next_step?`<div class="wide"><span>Next step</span><b>${esc(review.next_step)}</b></div>`:''}</div>${review.notes?`<div class="rebookReviewNote">${esc(review.notes)}</div>`:''}<div class="rebookReviewFoot">${evidence?`Evidence ${esc(evidence)} · `:''}${checked?`reviewed ${esc(checked)} · `:''}${esc(review.source_label||(live?'Verified current review source':'Verified historical review source'))}${review.source_url?` · <a target="_blank" rel="noopener noreferrer" href="${esc(review.source_url)}">Open review source</a>`:''}</div></div>`;
}
function historicalPlacementValue(value){
  const text=String(value||'').trim();
  return !text||/^(?:n\/a|na|none|unknown|tbd|tba|—|-)$/i.test(text)?'':text;
}
function lpAttributedSpecificPlacementSummary(p){
  const placement=historicalPlacementValue(p?.best_lp_attributed_specific_booth);
  if(!placement)return '';
  const bits=[placement];
  if(p?.best_lp_attributed_specific_booth_year)bits.push(String(p.best_lp_attributed_specific_booth_year));
  const dates=String(p?.best_lp_attributed_specific_booth_dates||'').trim();
  if(dates)bits.push(dates);
  const sales=p?.best_lp_attributed_specific_booth_sales;
  const volume=p?.best_lp_attributed_specific_booth_volume;
  const issued=p?.best_lp_attributed_specific_booth_issued;
  const demos=p?.best_lp_attributed_specific_booth_demos;
  if(sales!==null&&sales!==undefined&&String(sales)!=='')bits.push(String(sales)+' LP close'+(Number(sales)===1?'':'s'));
  if(volume!==null&&volume!==undefined&&String(volume)!=='')bits.push(money(volume)+' LP close volume');
  if(issued!==null&&issued!==undefined&&String(issued)!=='')bits.push(String(issued)+' issued');
  if(demos!==null&&demos!==undefined&&String(demos)!=='')bits.push(String(demos)+' demos');
  bits.push('annual LP attribution · not attendance proof');
  return bits.join(' · ');
}
function lpAttributedPlacementTypeSummary(p){
  const placement=historicalPlacementValue(p?.best_lp_attributed_placement_type);
  if(!placement)return '';
  const bits=[placement];
  if(p?.best_lp_attributed_placement_type_year)bits.push(String(p.best_lp_attributed_placement_type_year));
  const dates=String(p?.best_lp_attributed_placement_type_dates||'').trim();
  if(dates)bits.push(dates);
  const sales=p?.best_lp_attributed_placement_type_sales;
  const volume=p?.best_lp_attributed_placement_type_volume;
  const issued=p?.best_lp_attributed_placement_type_issued;
  const demos=p?.best_lp_attributed_placement_type_demos;
  if(sales!==null&&sales!==undefined&&String(sales)!=='')bits.push(String(sales)+' LP close'+(Number(sales)===1?'':'s'));
  if(volume!==null&&volume!==undefined&&String(volume)!=='')bits.push(money(volume)+' LP close volume');
  if(issued!==null&&issued!==undefined&&String(issued)!=='')bits.push(String(issued)+' issued');
  if(demos!==null&&demos!==undefined&&String(demos)!=='')bits.push(String(demos)+' demos');
  bits.push('annual LP attribution · not exact booth · not attendance proof');
  return bits.join(' · ');
}
function historicalPlacementGuide(p){
  if(!p?.current_rebook_opportunity)return '';
  const specific=historicalPlacementValue(p.best_observed_specific_booth);
  const latest=historicalPlacementValue(p.latest_preserved_booth);
  const lpAttributed=lpAttributedSpecificPlacementSummary(p);
  const lpPlacementType=lpAttributed?'':lpAttributedPlacementTypeSummary(p);
  const lpHtml=lpAttributed
    ?`<div class="rebookContext" data-lp-attributed-placement-profile="${esc(p.profile_id)}"><span>LP-attributed placement evidence</span><b>${esc(lpAttributed)} · One-to-one date-aligned attribution to a preserved history occurrence; not same-row history performance and not proof Paradise attended/worked that placement.</b></div>`
    :(lpPlacementType
      ?`<div class="rebookContext" data-lp-attributed-placement-type-profile="${esc(p.profile_id)}"><span>LP-attributed placement type</span><b>${esc(lpPlacementType)} · One-to-one date-aligned attribution to a preserved history occurrence with an informative non-specific placement descriptor; not an exact booth, not same-row history performance, and not proof Paradise attended/worked that placement.</b></div>`
      :'');
  if(!specific&&!latest)return `<div class="rebookContext" data-historical-placement-profile="${esc(p.profile_id)}"><span>Historical placement guide</span><b>No preserved booth / placement is available for this profile. Do not infer a booth from same-market, same-venue, or unrelated-series history — verify the current floor plan, booth numbering, and availability with the organizer before booking.</b></div>${lpHtml}`;
  let placement='';
  const outcome=[];
  if(specific){
    const when=[p.best_observed_specific_booth_year,p.best_observed_specific_booth_dates]
      .filter(v=>v!==null&&v!==undefined&&String(v).trim()).join(' · ');
    placement=`Outcome-linked prior placement: ${esc(specific)}${when?` (${esc(when)})`:''}`;
    if(p.best_observed_specific_booth_net_sales!==null&&p.best_observed_specific_booth_net_sales!==undefined)outcome.push(`${esc(p.best_observed_specific_booth_net_sales)} net sales`);
    if(p.best_observed_specific_booth_net_revenue!==null&&p.best_observed_specific_booth_net_revenue!==undefined)outcome.push(`${money(p.best_observed_specific_booth_net_revenue)} net revenue`);
    if(p.best_observed_specific_booth_com!==null&&p.best_observed_specific_booth_com!==undefined)outcome.push(`${esc(p.best_observed_specific_booth_com)}% COM`);
  }else{
    const when=[p.latest_preserved_booth_year,p.latest_preserved_booth_dates]
      .filter(v=>v!==null&&v!==undefined&&String(v).trim()).join(' · ');
    placement=`Latest preserved placement: ${esc(latest)}${when?` (${esc(when)})`:''}`;
  }
  return `<div class="rebookContext" data-historical-placement-profile="${esc(p.profile_id)}"><span>Historical placement guide</span><b>${placement}${outcome.length?' · '+outcome.join(' · '):''} · Historical reference only — verify current floor plan / booth numbering / availability before booking.</b></div>${lpHtml}`;
}
function reviewedDecisionEvidenceTarget(p){
  return Boolean(p?.current_rebook_opportunity)||historicalOutreachCandidate(p);
}
function historicalDecisionEvidence(p){
  if(!reviewedDecisionEvidenceTarget(p))return '';
  const bits=[];
  const latest=Number(p.latest_history_year||0);
  if(latest>0)bits.push(`latest history ${esc(latest)}`);
  const workedYears=Object.entries(p.history_field_states||{})
    .filter(([,state])=>Number(state?.worked?.HAS||0)>0)
    .map(([year])=>Number(year))
    .filter(Number.isFinite)
    .sort((a,b)=>b-a);
  const worked=Number(p.worked_year_count||workedYears.length||0);
  const latestWorked=workedYears[0]||null;
  bits.push(worked>0
    ?`${esc(worked)} verified worked year${worked===1?'':'s'}${latestWorked?` · latest verified worked ${esc(latestWorked)}`:''}`
    :'0 verified worked years in preserved evidence (not proof of no participation)');
  const lpYears=(Array.isArray(p.lp_years)?p.lp_years:[]).map(Number).filter(Number.isFinite).sort((a,b)=>b-a);
  const lpCount=Number(p.lp_year_count||lpYears.length||0);
  const latestLp=lpYears[0]||null;
  if(lpCount>0)bits.push(`${esc(lpCount)} annual LP attribution year${lpCount===1?'':'s'}${latestLp?` · latest LP ${esc(latestLp)}`:''} (LP attribution is not attendance proof)`);
  if(p.lifetime_net_sales!==null&&p.lifetime_net_sales!==undefined&&p.lifetime_net_sales!=='')bits.push(`${esc(p.lifetime_net_sales)} lifetime net sales`);
  if(p.lifetime_net_volume!==null&&p.lifetime_net_volume!==undefined&&p.lifetime_net_volume!=='')bits.push(`${money(p.lifetime_net_volume)} lifetime net aggregate`);
  if(p.lowest_preserved_com!==null&&p.lowest_preserved_com!==undefined&&p.lowest_preserved_com!=='')bits.push(`${esc(p.lowest_preserved_com)}% lowest preserved COM`);
  return `<div class="rebookContext" data-historical-decision-evidence-profile="${esc(p.profile_id)}"><span>Historical decision evidence</span><b>${bits.join(' · ')}</b></div>`;
}
function historicalOutcomeLine(p,prefix,label){
  const year=Number(p?.[prefix+'_year']||0);
  if(!year)return '';
  const bits=[String(year)];
  const dates=String(p?.[prefix+'_dates']||'').trim();
  const booth=String(p?.[prefix+'_booth']||'').trim();
  if(dates)bits.push(dates);
  if(booth)bits.push('booth '+booth);
  const netSales=p?.[prefix+'_net_sales'];
  const netRevenue=p?.[prefix+'_net_revenue'];
  const issued=p?.[prefix+'_issued'];
  const demos=p?.[prefix+'_demos'];
  const com=p?.[prefix+'_com'];
  if(netSales!==null&&netSales!==undefined&&String(netSales)!=='')bits.push(String(netSales)+' net sale'+(Number(netSales)===1?'':'s'));
  if(netRevenue!==null&&netRevenue!==undefined&&String(netRevenue)!=='')bits.push(money(netRevenue)+' net revenue');
  if(issued!==null&&issued!==undefined&&String(issued)!=='')bits.push(String(issued)+' issued');
  if(demos!==null&&demos!==undefined&&String(demos)!=='')bits.push(String(demos)+' demos');
  if(com!==null&&com!==undefined&&String(com)!=='')bits.push(String(com)+'% COM');
  const participation=String(p?.[prefix+'_participation_status']||'').trim();
  if(participation)bits.push('source status '+participation);
  return label+': '+bits.join(' · ');
}
function historicalOutcomeSnapshot(p){
  if(!reviewedDecisionEvidenceTarget(p))return '';
  const status=String(p.outcome_evidence_status||'').toUpperCase();
  const labels={
    OCCURRENCE_OUTCOME_AVAILABLE:'Occurrence-level outcome available',
    LIFETIME_ONLY:'Lifetime performance only',
    NO_COMPARABLE_OUTCOME_EVIDENCE:'No comparable outcome evidence'
  };
  const lines=[labels[status]||'Outcome evidence status not classified'];
  if(status==='OCCURRENCE_OUTCOME_AVAILABLE'){
    const latest=historicalOutcomeLine(p,'latest_observed_outcome','Latest observed');
    const best=historicalOutcomeLine(p,'best_observed_outcome','Best observed');
    if(latest)lines.push(latest);
    const same=[
      p.latest_observed_outcome_year,p.latest_observed_outcome_dates,p.latest_observed_outcome_booth,
      p.latest_observed_outcome_net_revenue,p.latest_observed_outcome_net_sales,p.latest_observed_outcome_issued,
      p.latest_observed_outcome_demos,p.latest_observed_outcome_com
    ].map(v=>v===null||v===undefined?'':String(v)).join('|')===[
      p.best_observed_outcome_year,p.best_observed_outcome_dates,p.best_observed_outcome_booth,
      p.best_observed_outcome_net_revenue,p.best_observed_outcome_net_sales,p.best_observed_outcome_issued,
      p.best_observed_outcome_demos,p.best_observed_outcome_com
    ].map(v=>v===null||v===undefined?'':String(v)).join('|');
    if(best&&!same)lines.push(best);
    lines.push('Preserved occurrence-level outcome metrics; not attendance proof unless the source participation status explicitly says worked/attended.');
  }else if(status==='LIFETIME_ONLY'){
    lines.push('Lifetime profile performance exists, but no occurrence-level outcome metrics are preserved. Do not infer zero occurrence performance. Lifetime / LP attribution is not attendance proof.');
  }else if(status==='NO_COMPARABLE_OUTCOME_EVIDENCE'){
    lines.push('No comparable preserved occurrence or lifetime performance is available for this current opportunity. Booking or participation references are not treated as outcome proof.');
  }else{
    lines.push('Outcome evidence classification is unavailable; use the preserved history and LeadPerfection sections before deciding.');
  }
  return `<div class="rebookContext" data-historical-outcome-profile="${esc(p.profile_id)}"><span>Historical outcome snapshot</span><b>${lines.map(esc).join('<br>')}</b></div>`;
}
function liveComparisonDate(op){
  if(!op?.event_start)return 'Date not verified';
  if(op.event_end&&op.event_end!==op.event_start)return date(op.event_start)+' – '+date(op.event_end);
  return op.event_end?date(op.event_start):'Starts '+date(op.event_start);
}
function liveComparisonOutcomeMetrics(p,prefix){
  const year=Number(p?.[prefix+'_year']||0);
  if(!year)return '';
  const bits=[String(year)];
  const netSales=p?.[prefix+'_net_sales'];
  const netRevenue=p?.[prefix+'_net_revenue'];
  const issued=p?.[prefix+'_issued'];
  const demos=p?.[prefix+'_demos'];
  const com=p?.[prefix+'_com'];
  if(netSales!==null&&netSales!==undefined&&String(netSales)!=='')bits.push(String(netSales)+' net sale'+(Number(netSales)===1?'':'s'));
  if(netRevenue!==null&&netRevenue!==undefined&&String(netRevenue)!=='')bits.push(money(netRevenue)+' net');
  if(issued!==null&&issued!==undefined&&String(issued)!=='')bits.push(String(issued)+' issued');
  if(demos!==null&&demos!==undefined&&String(demos)!=='')bits.push(String(demos)+' demos');
  if(com!==null&&com!==undefined&&String(com)!=='')bits.push(String(com)+'% COM');
  return bits.join(' · ');
}
function liveComparisonOutcome(p){
  const status=String(p?.outcome_evidence_status||'').toUpperCase();
  if(status==='OCCURRENCE_OUTCOME_AVAILABLE'){
    const latest=liveComparisonOutcomeMetrics(p,'latest_observed_outcome');
    const best=liveComparisonOutcomeMetrics(p,'best_observed_outcome');
    if(latest&&best&&latest!==best)return 'Latest: '+latest+' · Best: '+best;
    return latest||best||'Occurrence outcome preserved';
  }
  if(status==='LIFETIME_ONLY'){
    const bits=[];
    if(p?.lifetime_net_sales!==null&&p?.lifetime_net_sales!==undefined&&String(p.lifetime_net_sales)!=='')bits.push(String(p.lifetime_net_sales)+' lifetime net sales');
    if(p?.lifetime_net_volume!==null&&p?.lifetime_net_volume!==undefined&&String(p.lifetime_net_volume)!=='')bits.push(money(p.lifetime_net_volume)+' lifetime net');
    return bits.join(' · ')||'Lifetime performance only';
  }
  if(status==='NO_COMPARABLE_OUTCOME_EVIDENCE')return 'No comparable outcome evidence';
  return 'Outcome evidence not classified';
}
function liveComparisonEvidenceDepth(p){
  const count=value=>{const n=Number(value);return Number.isFinite(n)&&n>=0?n:0};
  const records=count(p?.history_count);
  const years=count(p?.history_year_count);
  const worked=count(p?.worked_year_count);
  return `${records} preserved history record${records===1?'':'s'} · ${years} history year${years===1?'':'s'} · ${worked} explicit WORKED/ATTENDED year${worked===1?'':'s'}`;
}
function liveComparisonPlacementMetrics(p,prefix){
  const bits=[];
  const sales=p?.[prefix+'_net_sales'];
  const net=p?.[prefix+'_net_revenue'];
  let issued=p?.[prefix+'_issued'];
  let demos=p?.[prefix+'_demos'];
  if(prefix==='best_observed_specific_booth'&&(issued===null||issued===undefined||String(issued)===''||demos===null||demos===undefined||String(demos)==='')){
    const booth=historicalPlacementValue(p?.best_observed_specific_booth);
    const year=String(p?.best_observed_specific_booth_year??'').trim();
    const dates=String(p?.best_observed_specific_booth_dates??'').trim();
    const sameOccurrence=['latest_observed_outcome','best_observed_outcome']
      .map(key=>({
        booth:historicalPlacementValue(p?.[key+'_booth']),
        year:String(p?.[key+'_year']??'').trim(),
        dates:String(p?.[key+'_dates']??'').trim(),
        issued:p?.[key+'_issued'],
        demos:p?.[key+'_demos'],
      }))
      .find(row=>booth&&row.booth===booth&&row.year===year&&row.dates===dates);
    if(sameOccurrence){
      if(issued===null||issued===undefined||String(issued)==='')issued=sameOccurrence.issued;
      if(demos===null||demos===undefined||String(demos)==='')demos=sameOccurrence.demos;
    }
  }
  if(sales!==null&&sales!==undefined&&String(sales)!=='')bits.push(String(sales)+' net sales');
  if(net!==null&&net!==undefined&&String(net)!=='')bits.push(money(net)+' net');
  if(issued!==null&&issued!==undefined&&String(issued)!=='')bits.push(String(issued)+' issued');
  if(demos!==null&&demos!==undefined&&String(demos)!=='')bits.push(String(demos)+' demos');
  return bits.join(' · ');
}
function liveComparisonPlacement(p){
  const op=p?.current_rebook_opportunity||{};
  const currentGuidance=governedFirstSentence(op.current_placement_text,'');
  const current='Current: '+opportunityPlacementStatusLabel(op.current_placement_status)+(currentGuidance?' · Current guidance: '+currentGuidance:'');
  const specific=historicalPlacementValue(p?.best_observed_specific_booth);
  const outcomePlacement=historicalPlacementValue(p?.best_observed_booth);
  const latest=historicalPlacementValue(p?.latest_preserved_booth);
  let base='';
  if(specific){
    const metrics=liveComparisonPlacementMetrics(p,'best_observed_specific_booth');
    const when=p.best_observed_specific_booth_year?' · '+p.best_observed_specific_booth_year:'';
    base=current+' · Best outcome-linked specific: '+specific+when+(metrics?' · '+metrics:'');
  }else if(outcomePlacement){
    const metrics=liveComparisonPlacementMetrics(p,'best_observed_booth');
    const when=p.best_observed_booth_year?' · '+p.best_observed_booth_year:'';
    base=current+' · Outcome-linked placement note: '+outcomePlacement+when+(metrics?' · '+metrics:'');
  }else if(latest){
    const when=p.latest_preserved_booth_year?' · '+p.latest_preserved_booth_year:'';
    base=current+' · Latest preserved placement: '+latest+when+' · no same-row outcome';
  }else{
    base=current+' · No preserved booth / placement';
  }
  const lpAttributed=lpAttributedSpecificPlacementSummary(p);
  if(lpAttributed)return base+' · LP-attributed specific: '+lpAttributed;
  const lpPlacementType=lpAttributedPlacementTypeSummary(p);
  return lpPlacementType?base+' · LP-attributed placement type: '+lpPlacementType:base;
}
function liveComparisonDeadlineUrgency(op){
  const days=daysFromToday(op?.critical_deadline_date);
  if(days===null)return '';
  if(days<0){
    const overdue=Math.abs(days);
    return overdue+' day'+(overdue===1?'':'s')+' past deadline';
  }
  if(days===0)return 'deadline today';
  return days+' day'+(days===1?'':'s')+' to deadline';
}
function liveComparisonDeadline(op){
  if(!op?.critical_deadline_date)return 'No verified hard deadline';
  const label=String(op.critical_deadline_label||op.critical_deadline_type||'Critical deadline').replaceAll('_',' ');
  const urgency=liveComparisonDeadlineUrgency(op);
  return date(op.critical_deadline_date)+' · '+label+(urgency?' · '+urgency:'');
}
const GOVERNED_SENTENCE_ABBREVIATIONS=new Set([
  'jan','feb','mar','apr','jun','jul','aug','sep','sept','oct','nov','dec',
  'st','mt','ft','dr','mr','mrs','ms','inc','co','corp','ltd','no','vs',
]);
function governedFirstSentence(value,fallback){
  const text=String(value||'').trim().replace(/\s+/g,' ');
  if(!text)return fallback;
  for(let i=0;i<text.length;i++){
    const mark=text[i];
    if(mark==='!'||mark==='?')return text.slice(0,i+1).trim();
    if(mark!=='.')continue;
    const next=text[i+1]||'';
    if(next&&!/\s/.test(next))continue;
    const prefix=text.slice(0,i);
    const token=(prefix.match(/([A-Za-z]+)$/)||[])[1]||'';
    if(GOVERNED_SENTENCE_ABBREVIATIONS.has(token.toLowerCase()))continue;
    if(/(?:\b[A-Za-z]\.)+[A-Za-z]$/.test(prefix))continue;
    return text.slice(0,i+1).trim();
  }
  return text;
}
function liveComparisonDecisionWhy(review){
  return governedFirstSentence(review?.rationale,'Open the show for the governed rationale.');
}
function liveComparisonCurrentCost(op){
  const structured=opportunityCostText(op);
  if(structured)return structured;
  const status=opportunityCostStatusLabel(op?.current_cost_status);
  const context=governedFirstSentence(op?.price_text,'');
  return context?status+' · '+context:status;
}
function liveComparisonPriorCost(op){
  return governedFirstSentence(op?.prior_cost_text,'Prior/reference cost not verified');
}
function liveComparisonNextStep(review){
  return governedFirstSentence(review?.next_step,'Open the show for the governed next step.');
}
function liveComparisonFreshness(op,review){
  const opportunityChecked=String(op?.checked_at||'').slice(0,10);
  const reviewChecked=String(review?.checked_at||'').slice(0,10);
  if(opportunityChecked&&reviewChecked&&opportunityChecked===reviewChecked)return 'Opportunity + decision checked '+opportunityChecked;
  const bits=[];
  if(opportunityChecked)bits.push('Opportunity checked '+opportunityChecked);
  if(reviewChecked)bits.push('Decision reviewed '+reviewChecked);
  return bits.join(' · ')||'Check dates not recorded';
}
function governedScheduleExcerpt(value){
  const text=String(value||'').trim().replace(/\s+/g,' ');
  if(!text)return 'Schedule detail not recorded.';
  const first=governedFirstSentence(text,'Schedule detail not recorded.');
  const hasClock=s=>/(?:\b(?:AM|PM|noon|midnight)\b|\b\d{1,2}:\d{2}\b)/i.test(String(s||''));
  if(hasClock(first)||first.length>=text.length)return first;
  const rest=text.slice(first.length).trim();
  const second=governedFirstSentence(rest,'');
  return second&&hasClock(second)?first+' '+second:first;
}
function liveComparisonSchedule(op){
  const status=opportunityScheduleStatusLabel(op?.current_schedule_status);
  const detail=governedScheduleExcerpt(op?.current_schedule_text);
  return status+(detail?' · '+detail:'');
}
function liveComparisonPriorityDate(op){
  const deadline=String(op?.critical_deadline_date||'').trim();
  const eventDate=String(op?.event_start||'').trim();
  return deadline||eventDate||'9999-12-31';
}
function liveComparisonActionDate(op){
  const deadline=String(op?.critical_deadline_date||'').trim();
  if(deadline){
    const label=String(op?.critical_deadline_label||op?.critical_deadline_type||'Critical deadline').replaceAll('_',' ');
    const urgency=liveComparisonDeadlineUrgency(op);
    return date(deadline)+' · '+label+' · verified hard deadline'+(urgency?' · '+urgency:'');
  }
  const eventDate=String(op?.event_start||'').trim();
  if(!eventDate)return 'No verified action date';
  const days=daysFromToday(eventDate);
  let urgency='';
  if(days!==null){
    if(days<0){const past=Math.abs(days);urgency=past+' day'+(past===1?'':'s')+' past event start';}
    else if(days===0)urgency='event starts today';
    else urgency=days+' day'+(days===1?'':'s')+' to event start';
  }
  return date(eventDate)+' · event start ordering fallback · not a hard deadline'+(urgency?' · '+urgency:'');
}
function liveDecisionCompareBoard(profiles,open=false,actionDateFirst=false){
  const decisionWeight={PURSUE:0,WATCH:1,HOLD:2,RETIRED:3};
  const rows=(profiles||[]).filter(p=>p?.current_rebook_opportunity).slice().sort((a,b)=>{
    const ad=String(a?.current_rebook_review?.disposition||'').toUpperCase();
    const bd=String(b?.current_rebook_review?.disposition||'').toUpperCase();
    const aw=decisionWeight[ad]??9,bw=decisionWeight[bd]??9;
    const aPriority=liveComparisonPriorityDate(a?.current_rebook_opportunity);
    const bPriority=liveComparisonPriorityDate(b?.current_rebook_opportunity);
    const aDate=String(a?.current_rebook_opportunity?.event_start||'9999-12-31');
    const bDate=String(b?.current_rebook_opportunity?.event_start||'9999-12-31');
    if(actionDateFirst)return aPriority.localeCompare(bPriority)||aw-bw||aDate.localeCompare(bDate)||String(a.canonical_event||'').localeCompare(String(b.canonical_event||''));
    return aw-bw||aPriority.localeCompare(bPriority)||aDate.localeCompare(bDate)||String(a.canonical_event||'').localeCompare(String(b.canonical_event||''));
  });
  if(!rows.length)return '';
  const ordering=actionDateFirst
    ?'Action date first: earliest verified hard deadline or event date first; decision is next tie-breaker'
    :'Decision first; within each decision tier, earliest verified hard deadline or event date first';
  const body=rows.map(p=>{
    const op=p.current_rebook_opportunity||{};
    const review=p.current_rebook_review||{};
    const cost=liveComparisonCurrentCost(op);
    const priorCost=liveComparisonPriorCost(op);
    const contactName=String(op.contact_name||'Current organizer/contact').trim();
    const contactActions=rebookContactActions(op.contact_text,p.profile_id,op.contact_email,op.contact_phone);
    const readiness=bookingReadinessLabel(review.booking_readiness);
    const resolutionLane=resolutionLaneLabel(review.resolution_lane);
    const commitmentStatus=opportunityCommitmentStatusLabel(op.current_commitment_status);
    const commitmentTerms=governedFirstSentence(op.commitment_terms_text,'Commitment terms not recorded.');
    const blockers=String(review.blockers_text||'No additional blocker text recorded').trim();
    const timing=String(review.action_timing||'Verify timing').trim();
    const disposition=String(review.disposition||'REVIEW').toUpperCase();
    const decisionWhy=liveComparisonDecisionWhy(review);
    const nextStep=liveComparisonNextStep(review);
    const action=op.action_url?`<a class="liveCompareAction" data-live-compare-action-profile="${esc(p.profile_id)}" target="_blank" rel="noopener noreferrer" href="${esc(op.action_url)}">${esc(op.action_label||'Open action')}</a>`:'—';
    return `<tr data-live-compare-row="${esc(p.profile_id)}">
      <td data-label="Decision" data-live-compare-decision-why-profile="${esc(p.profile_id)}"><div class="liveCompareDecisionCell"><span class="liveCompareDecision ${esc(disposition.toLowerCase())}">${esc(disposition)}</span><small>${esc(decisionWhy)}</small></div></td>
      <td data-label="Show" data-live-compare-venue-profile="${esc(p.profile_id)}"><button type="button" class="liveCompareOpen" data-profile="${esc(p.profile_id)}"><b>${esc(p.canonical_event)}</b><span>${esc(p.profile_id)}</span><small>${esc(op.venue_text||'Venue / address not verified')}</small></button></td>
      <td data-label="Date" data-live-compare-schedule-profile="${esc(p.profile_id)}"><div class="liveCompareDate"><b>${esc(liveComparisonDate(op))}</b><small>Schedule: ${esc(liveComparisonSchedule(op))}</small></div></td>
      <td data-label="Cost" data-live-compare-cost-profile="${esc(p.profile_id)}"><div class="liveCompareCost"><b>Current: ${esc(cost)}</b><span>Prior/reference: ${esc(priorCost)}</span></div></td>
      <td data-label="Historical outcome" data-live-compare-evidence-profile="${esc(p.profile_id)}"><div class="liveCompareOutcome"><b>${esc(liveComparisonOutcome(p))}</b><small>${esc(liveComparisonEvidenceDepth(p))}</small></div></td>
      <td data-label="Placement" data-live-compare-placement-profile="${esc(p.profile_id)}">${esc(liveComparisonPlacement(p))}</td>
      <td data-label="Contact" data-live-compare-contact-profile="${esc(p.profile_id)}"><div class="liveCompareContact"><b>${esc(contactName)}</b>${contactActions}</div></td>
      <td data-label="Readiness" data-live-compare-readiness-profile="${esc(p.profile_id)}"><div class="liveCompareReadiness"><b>${esc(readiness)}</b><span data-live-compare-resolution-profile="${esc(p.profile_id)}">Resolution lane: ${esc(resolutionLane)}</span><span>Commitment: ${esc(commitmentStatus)}</span><small data-live-compare-commitment-profile="${esc(p.profile_id)}">Terms: ${esc(commitmentTerms)}</small><small data-live-compare-freshness-profile="${esc(p.profile_id)}">Freshness: ${esc(liveComparisonFreshness(op,review))}</small><small>Still needed: ${esc(blockers)}</small></div></td>
      <td data-label="Action date" data-live-compare-action-date-profile="${esc(p.profile_id)}" data-live-compare-deadline-profile="${esc(p.profile_id)}">${esc(liveComparisonActionDate(op))}</td>
      <td data-label="When to act">${esc(timing)}</td>
      <td data-label="Next step" data-live-compare-next-step-profile="${esc(p.profile_id)}"><span class="liveCompareNextStep">${esc(nextStep)}</span></td>
      <td data-label="Action">${action}</td>
    </tr>`;
  }).join('');
  return `<details class="liveCompareBoard" data-live-decision-comparison ${open?'open':''}>
    <summary class="liveCompareHead"><div><span>Live opportunity comparison</span><b>${rows.length} governed targets</b></div><small>${esc(ordering)} · governed why · date + governed schedule status/detail · current + prior cost · historical outcome + evidence depth · current + best placement · contact · readiness + governed commitment terms + row-level freshness + blockers · effective action date + basis + live countdown · timing · governed next step · direct action</small></summary>
    <div class="liveCompareScroll"><table><thead><tr><th>Decision</th><th>Show</th><th>Date</th><th>Cost</th><th>Historical outcome</th><th>Placement</th><th>Contact</th><th>Readiness</th><th>Action date</th><th>When to act</th><th>Next step</th><th>Action</th></tr></thead><tbody>${body}</tbody></table></div>
    <div class="liveCompareNote">Historical outcome cells preserve the governed occurrence/lifetime/no-comparable distinction; occurrence rows include issued/demos and show Latest vs Best when those preserved observations differ. Evidence depth counts preserved history records, distinct history years, and years explicitly coded WORKED/ATTENDED; zero explicit worked years is not proof of no participation. Current cost uses the structured verified amount when available; when no structured amount exists, the comparison shows the governed cost status plus the first governed sentence of current price context. Prior/reference cost is historical or reference evidence only unless the text explicitly says it is current, and the comparison shows only its first governed sentence for scanability. Historical placement remains distinct from current assignment. LP-attributed specific placement, when shown, is one-to-one date-aligned annual LeadPerfection performance attribution to a preserved history occurrence; it is not attendance proof and not same-row history performance. LP-attributed placement type is a separate non-specific descriptor tier, is not an exact booth, and carries the same attribution / attendance limitations. The decision reason is the first sentence of the governed review rationale, not a new summary or score. Next step is the first sentence of the governed review next_step, not generated advice. Readiness includes the governed commitment state, the first governed sentence of current commitment terms, row-level opportunity/review check dates, and current blockers; it does not create a new booking score. Freshness dates show when the governed opportunity/review rows were checked; they do not guarantee that an organizer source has not changed since. Resolution lane identifies who or what must resolve the remaining blocker: Paradise action, organizer response, publication wait, existing-booking reconciliation, or further research. Action date uses the verified hard deadline when one exists; otherwise event start is shown only as the ordering fallback and is not promoted to a deadline. The Date cell adds the governed current schedule status plus a compact governed schedule excerpt; if the first sentence has no clock time, one second sentence is included only when it supplies an actual time. Unpublished or unrecovered hours remain labeled as such rather than inferred.</div>
  </details>`;
}
function catalogCard(p){
  const current=Array.isArray(p.matched_mfc_ids)?p.matched_mfc_ids:[];
  const lpOnly=isLpSourceOnly(p);
  const tier=lpOnly?'LP source only':(p.tier||((p.source_type==='HISTORY_ONLY')?'Historical':(p.source_type==='CURRENT_ONLY'?'Current':'Profile')));
  const hist=Number(p.history_count||0),life=Number(p.occurrences||0),years=Array.isArray(p.history_years)?p.history_years:[];
  const candidate=rebookCandidate(p);
  const liveOpportunity=p?.current_rebook_opportunity||null;
  const currentReview=p?.current_rebook_review||null;
  const reviewDisposition=String(currentReview?.disposition||'').toUpperCase();
  const relatedCurrentProfile=String(p?.related_current_profile_id||'').trim();
  const opportunityPill=liveOpportunity
    ?(String(liveOpportunity.opportunity_status||'').toUpperCase()==='EXHIBITOR_LISTED'?'EXHIBITOR LISTED'
      :(String(liveOpportunity.opportunity_status||'').toUpperCase()==='WATCH'?'CURRENT WATCH'
        :(String(liveOpportunity.opportunity_status||'').toUpperCase()==='APPLICATION_CLOSED'?'NEXT-CYCLE WATCH':'LIVE OPPORTUNITY')))
    :'';
  const pill=current.length?current.length+' CURRENT':(lpOnly?'LP SOURCE ONLY':(liveOpportunity?opportunityPill:(relatedCurrentProfile?'SAME SERIES':(reviewDisposition?reviewDisposition:(candidate?'REBOOK CANDIDATE':'READ ONLY')))));
  const cleanupYear=state.showQuickView==='ALL_MISSING'?state.catalogFilters.historyYear:'ALL';
  const missing=cleanupYear!=='ALL'?missingFieldsForYear(p,cleanupYear):[];
  const cleanup=missing.length
    ?`<div class="cleanupQueueLine"><b>${esc(cleanupYear)} · ${missing.length} missing field${missing.length===1?'':'s'}</b><span>${esc(missing.map(key=>CLEANUP_FIELD_LABELS[key]||key).join(' · '))}</span></div>`
    :'';
  const focusAttr=cleanupYear!=='ALL'&&missing.length?` data-focus-year="${esc(cleanupYear)}"`:'';
  const candidateBooth=p?.best_observed_specific_booth
    ?` · best specific booth ${esc(p.best_observed_specific_booth)}${p.best_observed_specific_booth_year?' ('+esc(p.best_observed_specific_booth_year)+')':''}`
    :(p?.best_observed_booth?` · best observed placement ${esc(p.best_observed_booth)}${p.best_observed_booth_year?' ('+esc(p.best_observed_booth_year)+')':''}`:'');
  const candidateSales=p?.lifetime_net_sales!==null&&p?.lifetime_net_sales!==undefined?` · ${esc(p.lifetime_net_sales)} lifetime net sales`:'';
  const preservedBits=[
    p?.latest_preserved_dates?`Last preserved date ${esc(p.latest_preserved_dates)}${p.latest_preserved_dates_year?' ('+esc(p.latest_preserved_dates_year)+')':''}`:'',
    p?.latest_preserved_cost?`Last preserved cost ${esc(p.latest_preserved_cost)}${p.latest_preserved_cost_year?' ('+esc(p.latest_preserved_cost_year)+')':''}`:'',
    p?.latest_preserved_contact?`Preserved contact ${esc(p.latest_preserved_contact)}${p.latest_preserved_contact_year?' ('+esc(p.latest_preserved_contact_year)+')':''}`:'',
  ].filter(Boolean);
  const preservedContext=candidate&&preservedBits.length?`<div class="rebookContext"><span>Historical booking context</span><b>${preservedBits.join(' · ')}</b></div>`:'';
  const nextBooking=candidate?`<div class="rebookNext"><span>Next booking step</span><b>Verify the next occurrence, current availability, current quote / fees, and booking or payment deadline before committing.</b></div>`:'';
  const historicalAgeNote=candidate&&Number(p.latest_history_year||0)<2023?`<div class="rebookAge"><span>Older historical evidence</span><b>Strong history remains eligible because the rebook review starts in 2013. Verify that the organizer / series still exists, the venue or market still fits, and current economics remain attractive before booking.</b></div>`:'';
  const candidateNote=candidate?`<div class="action">Rebook candidate 2013+ · ${esc(p.tier)} · latest preserved history ${esc(p.latest_history_year)} · ${money(p.lifetime_net_volume)} lifetime net${candidateSales}${candidateBooth} · no current control</div>${historicalAgeNote}${preservedContext}${nextBooking}`:'';
  const opportunityCard=liveOpportunity?rebookOpportunityCard(liveOpportunity,true):'';
  const placementGuide=liveOpportunity?historicalPlacementGuide(p):'';
  const decisionEvidence=reviewedDecisionEvidenceTarget(p)?historicalDecisionEvidence(p):'';
  const outcomeEvidence=reviewedDecisionEvidenceTarget(p)?historicalOutcomeSnapshot(p):'';
  const reviewCard=currentReview?rebookReviewCard(currentReview,Boolean(liveOpportunity)):'';
  const seriesRelationNote=relatedCurrentProfile?`<div class="rebookSeries"><span>Same organizer series</span><b>Series decision target is tracked under ${esc(relatedCurrentProfile)}. This legacy source profile remains preserved for history and lifetime-source provenance; it is not a second booking target.</b></div>`:'';
  return `<div class="card catalogCard${focusAttr?' cleanupQueueCard':''}" data-profile="${esc(p.profile_id)}"${focusAttr}><div class="row"><div><div class="event">${esc(p.canonical_event)}</div><div class="mfc">${esc(p.profile_id)} · ${esc(tier)}</div></div><span class="pill ${current.length?'paid':''}">${pill}</span></div><div class="catalogStats"><span><b>${hist}</b> history records</span>${years.length?`<span><b>${years.join(' · ')}</b> history years</span>`:''}<span><b>${life||'—'}</b> lifetime occurrences</span>${p.lifetime_net_volume!=null?`<span><b>${money(p.lifetime_net_volume)}</b> lifetime net</span>`:''}</div>${cleanup}${decisionEvidence}${outcomeEvidence}${reviewCard}${opportunityCard}${placementGuide}${candidateNote}${seriesRelationNote}${lpOnly?'<div class="action">LeadPerfection source identity only · not attendance or worked-show proof</div>':''}${current.length?`<div class="action">Linked current control: ${esc(current.join(', '))}</div>`:''}</div>`;
}
function showEventYear(s){
  const raw=String(s?.event_start||s?.event_end||'');
  const y=Number(raw.slice(0,4));
  return Number.isFinite(y)?y:null;
}
function profileCurrentShows(p){
  const ids=Array.isArray(p.matched_mfc_ids)?p.matched_mfc_ids:[];
  return ids.map(id=>state.shows.find(show=>show.mfc_id===id)).filter(Boolean);
}
function rebookCandidate(p){
  const tier=String(p?.tier||'');
  const latest=Number(p?.latest_history_year||0);
  const net=Number(p?.lifetime_net_volume||0);
  const disposition=String(p?.current_rebook_review?.disposition||'').toUpperCase();
  return profileCurrentShows(p).length===0
    && !String(p?.related_current_profile_id||'').trim()
    && !p?.current_rebook_opportunity
    && !['HOLD','RETIRED'].includes(disposition)
    && (tier==='Platinum'||tier==='Gold')
    && Number.isFinite(net)&&net>0
    && Number.isFinite(latest)&&latest>=2013;
}
function historicalReviewCandidate2013(p){
  const latest=Number(p?.latest_history_year||0);
  const net=Number(p?.lifetime_net_volume||0);
  return profileCurrentShows(p).length===0
    && !String(p?.related_current_profile_id||'').trim()
    && !p?.current_rebook_opportunity
    && Number.isFinite(net)&&net>0
    && Number.isFinite(latest)&&latest>=2013;
}
function triMatch(flag,mode){
  return mode==='ANY'||(mode==='HAS'&&Boolean(flag))||(mode==='MISSING'&&!flag);
}
function coiMatch(p,mode){
  if(mode==='HAS')return Boolean(p.has_coi);
  if(mode==='NO')return !p.has_coi&&Boolean(p.has_coi_status);
  if(mode==='UNKNOWN')return !p.has_coi_status;
  if(mode==='MISSING')return !p.has_coi;
  return true;
}
const HISTORY_FIELD_KEYS=['contact','booth','cost','com','performance','payment','application','coi'];
const CLEANUP_FIELD_LABELS={contact:'Contact',booth:'Booth / space',cost:'Show cost',com:'Event COM',performance:'Performance',payment:'Payment status',application:'Application status',coi:'COI'};
const cleanupFieldSupportCache=new Map();
let pendingCleanupQueue=false;
function emptyHistoryState(){return {VALUE:0,UNKNOWN:0,NA:0,MISSING:0}}
function historyFieldState(p,key,year='ALL'){
  const state=year!=='ALL'?p?.history_field_states?.[String(year)]?.[key]:p?.history_field_totals?.[key];
  return state&&typeof state==='object'?state:emptyHistoryState();
}
function historyFieldMatch(p,key,mode,year='ALL',legacyFlag=''){
  if(mode==='ANY')return true;
  const s=historyFieldState(p,key,year),hasSummary=Object.values(s).some(v=>Number(v)>0);
  if(!hasSummary&&year==='ALL'&&legacyFlag){
    if(mode==='HAS')return Boolean(p?.[legacyFlag]);
    if(mode==='MISSING')return !p?.[legacyFlag];
    return false;
  }
  const value=Number(s.VALUE||0),unknown=Number(s.UNKNOWN||0),na=Number(s.NA||0);
  if(mode==='HAS')return value>0;
  if(mode==='UNKNOWN')return unknown>0;
  if(mode==='NA')return na>0;
  if(mode==='MISSING')return value===0&&unknown===0&&na===0;
  return true;
}
function historyCoiMatch(p,mode,year='ALL'){
  if(mode==='ANY')return true;
  const state=historyFieldState(p,'coi',year);
  const summary=year!=='ALL'
    ?p?.history_field_states?.[String(year)]||{}
    :p?.history_coi_summary||{};
  const affirmative=Number(year!=='ALL'?summary.coi_affirmative:summary.affirmative||0);
  const nonaffirmative=Number(year!=='ALL'?summary.coi_known_nonaffirmative:summary.known_nonaffirmative||0);
  const value=Number(state.VALUE||0),unknown=Number(state.UNKNOWN||0),na=Number(state.NA||0);
  if(!value&&!unknown&&!na&&year==='ALL'&&!p?.history_field_totals)return coiMatch(p,mode);
  if(mode==='HAS')return affirmative>0;
  if(mode==='NO')return affirmative===0&&nonaffirmative>0;
  if(mode==='UNKNOWN')return affirmative===0&&nonaffirmative===0&&unknown>0;
  if(mode==='NA')return affirmative===0&&nonaffirmative===0&&na>0;
  if(mode==='MISSING')return affirmative===0&&nonaffirmative===0&&unknown===0&&na===0&&value===0;
  return true;
}
function historyWorkedMatch(p,mode,year='ALL'){
  if(mode==='ANY')return true;
  if(year==='ALL')return triMatch(Number(p.worked_year_count||0)>0,mode);
  const w=p?.history_field_states?.[String(year)]?.worked||{HAS:0,MISSING:0};
  const has=Number(w.HAS||0)>0;
  return mode==='HAS'?has:mode==='MISSING'?!has:true;
}
function scopedComValue(p,which='min'){
  const year=state.catalogFilters.historyYear;
  if(year!=='ALL'){
    const y=p?.history_field_states?.[String(year)];
    const v=which==='max'?y?.com_max:y?.com_min;
    return v===null||v===undefined||v===''?null:Number(v);
  }
  const v=which==='max'?p.highest_preserved_com:p.lowest_preserved_com;
  return v===null||v===undefined||v===''?null:Number(v);
}
const CLEANUP_COMMON_FIELD_MIN_COVERAGE=.25;
const CLEANUP_EXECUTION_ONLY_FIELDS=new Set(['com','performance','payment','application','coi']);
function cleanupAllNonparticipation(p,year){
  const n=p?.history_field_states?.[String(year)]?.nonparticipation||{HAS:0,MISSING:0};
  return Number(n.HAS||0)>0&&Number(n.MISSING||0)===0;
}
function historyFieldIsCoded(p,key,year){
  const s=historyFieldState(p,key,year);
  return Number(s.VALUE||0)>0||Number(s.UNKNOWN||0)>0||Number(s.NA||0)>0;
}
function legacyCleanupSupportedFieldsForYear(year){
  if(year==='ALL')return [];
  return HISTORY_FIELD_KEYS.filter(key=>{
    let coded=0,total=0;
    for(const p of state.catalog){
      if(!Array.isArray(p?.history_years)||!p.history_years.map(String).includes(String(year)))continue;
      const s=historyFieldState(p,key,year);
      coded+=Number(s.VALUE||0)+Number(s.UNKNOWN||0)+Number(s.NA||0);
      total+=Number(s.VALUE||0)+Number(s.UNKNOWN||0)+Number(s.NA||0)+Number(s.MISSING||0);
    }
    return total>0&&coded/total>=CLEANUP_COMMON_FIELD_MIN_COVERAGE;
  });
}
function cleanupSupportedFieldsForProfileYear(p,year){
  if(year==='ALL')return [];
  const raw=p?.history_field_support?.[String(year)];
  if(Array.isArray(raw))return HISTORY_FIELD_KEYS.filter(key=>raw.includes(key));
  return legacyCleanupSupportedFieldsForYear(year);
}
function scopedCompletenessScore(p){
  const year=state.catalogFilters.historyYear;
  if(year==='ALL')return Number(p.data_completeness_score||0);
  const supported=cleanupSupportedFieldsForProfileYear(p,year)
    .filter(key=>!(cleanupAllNonparticipation(p,year)&&CLEANUP_EXECUTION_ONLY_FIELDS.has(key)));
  if(!supported.length)return 0;
  return supported.filter(key=>historyFieldIsCoded(p,key,year)).length/supported.length;
}
function cleanupSupportedFieldsForYear(year){
  if(year==='ALL')return [];
  const sample=state.catalog.find(p=>p?.history_field_support_rule)?.history_field_support_rule||{};
  const cacheKey=[String(state.catalogSummary?.id||state.catalog.length),String(year),String(sample.scope||'legacy'),String(sample.min_coded_ratio??'legacy')].join('|');
  if(cleanupFieldSupportCache.has(cacheKey))return cleanupFieldSupportCache.get(cacheKey);
  const supported=HISTORY_FIELD_KEYS.filter(key=>state.catalog.some(p=>cleanupSupportedFieldsForProfileYear(p,year).includes(key)));
  cleanupFieldSupportCache.set(cacheKey,supported);
  return supported;
}
function missingFieldsForYear(p,year){
  if(year==='ALL'||!Array.isArray(p?.history_years)||!p.history_years.map(String).includes(String(year)))return [];
  return cleanupSupportedFieldsForProfileYear(p,year).filter(key=>{
    if(cleanupAllNonparticipation(p,year)&&CLEANUP_EXECUTION_ONLY_FIELDS.has(key))return false;
    return !historyFieldIsCoded(p,key,year);
  });
}
function missingFieldCountForYear(p,year){return missingFieldsForYear(p,year).length}
function cleanupQueueProfilesForYear(year){
  if(year==='ALL')return [];
  return state.catalog
    .filter(p=>!isLpSourceOnly(p)&&missingFieldCountForYear(p,year)>0)
    .slice()
    .sort((a,b)=>missingFieldCountForYear(b,year)-missingFieldCountForYear(a,year)||String(a.canonical_event||'').localeCompare(String(b.canonical_event||''),undefined,{sensitivity:'base'}));
}
function cleanupQueueIntro(){
  if(state.showQuickView!=='ALL_MISSING'||state.catalogFilters.historyYear==='ALL')return '';
  const year=state.catalogFilters.historyYear,supported=cleanupSupportedFieldsForYear(year);
  if(!supported.length)return '';
  const labels=supported.map(key=>CLEANUP_FIELD_LABELS[key]||key);
  return `<div class="sourceWarn cleanupQueueIntro"><b>${esc(year)} cleanup queue.</b> Ranked against fields regularly coded in each profile's exact year + preserved source family (25%+ family coverage). Supplemental merged evidence is scoped only to rows that actually carry that supplemental source. Year-wide supported fields: ${esc(labels.join(' · '))}. Explicit unknown, N/A, and execution-only fields for explicit non-participation do not count as missing.</div>`;
}
function rangeMatch(value,band){
  if(band==='ALL')return true;
  if(value===null||value===undefined||value==='')return band==='MISSING';
  const n=Number(value);if(!Number.isFinite(n))return band==='MISSING';
  if(band==='UNDER5')return n<5;
  if(band==='5_10')return n>=5&&n<10;
  if(band==='10_15')return n>=10&&n<15;
  if(band==='15_25')return n>=15&&n<25;
  if(band==='25PLUS')return n>=25;
  if(band==='UNDER25K')return n<25000;
  if(band==='25_100K')return n>=25000&&n<100000;
  if(band==='100_250K')return n>=100000&&n<250000;
  if(band==='250KPLUS')return n>=250000;
  if(band==='UNDER500')return n<500;
  if(band==='500_1000')return n>=500&&n<1000;
  if(band==='1000_2500')return n>=1000&&n<2500;
  if(band==='2500_5000')return n>=2500&&n<5000;
  if(band==='5000PLUS')return n>=5000;
  return true;
}
function catalogActiveFilterCount(){
  const f=state.catalogFilters;
  const defaults={profileState:'ALL',historyYear:'ALL',lpYear:'ALL',cumulativeLpYear:'ALL',tier:'ALL',historyDepth:'ALL',contact:'ANY',booth:'ANY',cost:'ANY',com:'ANY',performance:'ANY',historyPayment:'ANY',application:'ANY',lp:'ANY',cumulativeLp:'ANY',coi:'ANY',worked:'ANY',comBand:'ALL',lifetimeNetBand:'ALL',currentCostBand:'ALL',currentCostStatus:'ALL',currentCommitmentStatus:'ALL',currentPlacementStatus:'ALL',currentScheduleStatus:'ALL',currentLogisticsStatus:'ALL',currentStatus:'ALL',currentTreatment:'ALL',confirmation:'ALL',currentEventYear:'ALL'};
  return Object.keys(defaults).filter(k=>String(f[k])!==String(defaults[k])).length;
}
function currentActiveFilterCount(){
  const f=state.currentFilters;
  const defaults={status:'ALL',treatment:'ALL',eventYear:'ALL',timing:'ALL',confirmation:'ALL',owner:'ALL',evidence:'ALL',payment:'ALL',costBand:'ALL',followUp:'ANY'};
  return Object.keys(defaults).filter(k=>String(f[k])!==String(defaults[k])).length;
}
function catalogFilterSummary(){
  const f=state.catalogFilters,out=[],add=(key,label)=>out.push({key,label});
  const labels={
    profileState:{CURRENT:'Has current control',HISTORICAL:'Has historical evidence',CURRENT_ONLY:'Current only',HISTORY_ONLY:'Historical only',LP_SOURCE_ONLY:'LP source only'},
    contact:{HAS:'Has contact',UNKNOWN:'Contact explicitly unknown',NA:'Contact N/A',MISSING:'Contact missing'},booth:{HAS:'Has booth',UNKNOWN:'Booth explicitly unknown',NA:'Booth N/A',MISSING:'Booth missing'},cost:{HAS:'Has cost',UNKNOWN:'Cost explicitly unknown',NA:'Cost N/A',MISSING:'Cost missing'},
    com:{HAS:'Has COM',UNKNOWN:'COM explicitly unknown',NA:'COM N/A',MISSING:'COM missing'},performance:{HAS:'Has show-history performance',MISSING:'Show-history performance missing'},
    historyPayment:{HAS:'Has payment status',UNKNOWN:'Payment explicitly unknown',NA:'Payment N/A',MISSING:'Payment status missing'},application:{HAS:'Has application status',UNKNOWN:'Application explicitly unknown',NA:'Application N/A',MISSING:'Application status missing'},
    lp:{HAS:'Has annual LP',MISSING:'Missing annual LP'},cumulativeLp:{HAS:'Has cumulative LP',MISSING:'Missing cumulative LP'},
    coi:{HAS:'COI on file',NO:'Explicit no COI',UNKNOWN:'COI explicitly unknown',NA:'COI N/A',MISSING:'COI missing'},worked:{HAS:'Verified worked evidence',MISSING:'No verified worked evidence'},
    currentTreatment:{'IN PLAY':'In Play',SKIPPED:'Skipped'}
  };
  if(f.profileState!=='ALL')add('profileState',labels.profileState[f.profileState]||f.profileState);
  if(f.historyYear!=='ALL')add('historyYear','History '+f.historyYear);
  if(f.lpYear!=='ALL')add('lpYear','Annual LP '+f.lpYear);
  if(f.cumulativeLpYear!=='ALL')add('cumulativeLpYear','Cumulative LP '+f.cumulativeLpYear);
  if(f.tier!=='ALL')add('tier',f.tier==='OTHER'?'Untiered':f.tier[0]+f.tier.slice(1).toLowerCase());
  if(f.historyDepth!=='ALL')add('historyDepth',f.historyDepth+'+ history years');
  const scope=f.historyYear!=='ALL'?f.historyYear+' · ':'';
  for(const key of ['contact','booth','cost','com','performance','historyPayment','application','coi','worked'])if(f[key]!=='ANY')add(key,scope+(labels[key][f[key]]||f[key]));
  for(const key of ['lp','cumulativeLp'])if(f[key]!=='ANY')add(key,labels[key][f[key]]);
  if(f.comBand!=='ALL')add('comBand','COM '+({'UNDER5':'<5%','5_10':'5–10%','10_15':'10–15%','15_25':'15–25%','25PLUS':'25%+'})[f.comBand]);
  if(f.lifetimeNetBand!=='ALL')add('lifetimeNetBand','Lifetime net '+({'UNDER25K':'<$25K','25_100K':'$25–100K','100_250K':'$100–250K','250KPLUS':'$250K+'})[f.lifetimeNetBand]);
  if(f.currentCostBand!=='ALL')add('currentCostBand','Current verified booking cost '+({'UNDER500':'<$500','500_1000':'$500–1K','1000_2500':'$1K–2.5K','2500_5000':'$2.5K–5K','5000PLUS':'$5K+','MISSING':'No verified maximum'})[f.currentCostBand]);
  if(f.currentCostStatus!=='ALL')add('currentCostStatus','Current cost status · '+opportunityCostStatusLabel(f.currentCostStatus));
  if(f.currentCommitmentStatus!=='ALL')add('currentCommitmentStatus','Current commitment status · '+opportunityCommitmentStatusLabel(f.currentCommitmentStatus));
  if(f.currentPlacementStatus!=='ALL')add('currentPlacementStatus','Current placement status · '+opportunityPlacementStatusLabel(f.currentPlacementStatus));
  if(f.currentScheduleStatus!=='ALL')add('currentScheduleStatus','Current schedule status · '+opportunityScheduleStatusLabel(f.currentScheduleStatus));
  if(f.currentLogisticsStatus!=='ALL')add('currentLogisticsStatus','Current logistics status · '+opportunityLogisticsStatusLabel(f.currentLogisticsStatus));
  if(f.currentStatus!=='ALL')add('currentStatus','Status '+f.currentStatus);
  if(f.currentTreatment!=='ALL')add('currentTreatment',labels.currentTreatment[f.currentTreatment]||f.currentTreatment);
  if(f.confirmation!=='ALL')add('confirmation','Confirmation '+f.confirmation);
  if(f.currentEventYear!=='ALL')add('currentEventYear','Current '+f.currentEventYear);
  return out;
}
function currentFilterSummary(){
  const f=state.currentFilters,out=[],add=(key,label)=>out.push({key,label});
  if(f.status!=='ALL')add('status',f.status);
  if(f.treatment!=='ALL')add('treatment',f.treatment==='IN PLAY'?'In Play':'Skipped');
  if(f.eventYear!=='ALL')add('eventYear','Event '+f.eventYear);
  if(f.timing!=='ALL')add('timing',({OVERDUE:'Overdue actions',NEXT7:'Due ≤7 days',NO_DATE:'No action date',FUTURE:'Future actions'})[f.timing]||f.timing);
  if(f.confirmation!=='ALL')add('confirmation',f.confirmation);
  if(f.owner!=='ALL')add('owner','Owner '+f.owner);
  if(f.evidence!=='ALL')add('evidence','Evidence '+f.evidence);
  if(f.payment!=='ALL')add('payment',f.payment);
  if(f.costBand!=='ALL')add('costBand','Booking cost '+({'UNDER500':'<$500','500_1000':'$500–1K','1000_2500':'$1K–2.5K','2500_5000':'$2.5K–5K','5000PLUS':'$5K+','MISSING':'Missing'})[f.costBand]);
  if(f.followUp!=='ANY')add('followUp',f.followUp==='HAS'?'Has follow-up':'Missing follow-up');
  return out;
}
function removeActiveShowFilter(key){
  state.showQuickView='NONE';
  if(state.showMode==='ALL'){
    const defaults=defaultCatalogFilters();
    if(!(key in defaults))return;
    state.catalogFilters={...state.catalogFilters,[key]:defaults[key]};
  }else{
    const defaults=defaultCurrentFilters();
    if(!(key in defaults))return;
    state.currentFilters={...state.currentFilters,[key]:defaults[key]};
  }
  state.catalogLimit=60;
  render();
}
function showSortOptions(mode){
  return mode==='ALL'
    ?[
      ['RECOMMENDED','Recommended'],['BOOKING_DECISION','Booking decision / action date'],['CRITICAL_DEADLINE','Critical commitment date'],['CURRENT_FIRST','Current controls first'],['NEXT_OPPORTUNITY','Next verified opportunity'],['CURRENT_COST_LOW','Current booking cost low'],['CURRENT_COST_HIGH','Current booking cost high'],['NAME_ASC','Name A–Z'],['NAME_DESC','Name Z–A'],
      ['LATEST_HISTORY','Latest history year'],['HISTORY_DEPTH','Most history years'],['HISTORY_RECORDS','Most preserved records'],['OCCURRENCES','Most lifetime occurrences'],['WORKED_YEARS','Most verified worked years'],
      ['LOWEST_COM','Lowest preserved COM'],['HIGHEST_COM','Highest preserved COM'],
      ['LIFETIME_NET','Highest lifetime net'],['LIFETIME_SALES','Most lifetime net sales'],['CLOSE_VOLUME','Highest lifetime close volume'],['ISSUED','Most issued'],
      ['NET_2025','Highest 2025 net'],['NET_2024','Highest 2024 net'],['DATA_COMPLETE',state.catalogFilters.historyYear==='ALL'?'Most complete data':'Most complete fields · '+state.catalogFilters.historyYear],['MISSING_DATA',state.catalogFilters.historyYear==='ALL'?'Most missing data':'Most missing fields · '+state.catalogFilters.historyYear]
    ]
    :[
      ['PRIORITY','Priority'],['BOOKING','Booking recommendation'],['EVENT_ASC','Event date soonest'],['EVENT_DESC','Event date latest'],['ACTION_DUE','Action due soonest'],
      ['STATUS','Status priority'],['COST_LOW','Max booking cost low'],['COST_HIGH','Max booking cost high'],
      ['NAME_ASC','Name A–Z'],['NAME_DESC','Name Z–A'],['OWNER','Owner'],['CONFIRMATION','Confirmation'],
      ['EVIDENCE','Evidence needs attention'],['PAYMENT','Payment state']
    ];
}
function showTools(mode,resultCount){
  const summary=mode==='ALL'?catalogFilterSummary():currentFilterSummary();
  const active=summary.length;
  const sort=mode==='ALL'?state.catalogSort:state.currentSort;
  const options=showSortOptions(mode);
  const sortChanged=mode==='ALL'?state.catalogSort!=='RECOMMENDED':state.currentSort!=='BOOKING';
  const placeholder=mode==='ALL'?'Search name, venue, alias, contact, booth, city, MFC…':'Search current shows, owner, booking, decision…';
  const chips=summary.map(item=>`<button type="button" class="activeFilterChip" data-active-filter-key="${esc(item.key)}" aria-label="Remove ${esc(item.label)}"><span>${esc(item.label)}</span><b aria-hidden="true">×</b></button>`).join('');
  return `<div class="showTools"><div class="search"><input id="searchInput" placeholder="${placeholder}" value="${esc(state.search)}"></div><div class="toolRow"><button class="toolBtn ${active?'active':''}" id="showFilterBtn">Filter${active?` <span class="toolCount">${active}</span>`:''}</button><label class="sortBox"><span>Sort</span><select id="showSortSelect">${options.map(([value,label])=>`<option value="${value}" ${sort===value?'selected':''}>${label}</option>`).join('')}</select></label><button class="toolBtn resetBtn ${active||state.search||sortChanged?'':'hidden'}" id="showResetBtn">Reset</button></div>${chips?`<div class="activeFilters" aria-label="Active filters">${chips}</div>`:''}<div class="resultLine">${resultCount.toLocaleString()} matching show${resultCount===1?'':'s'}</div></div>`;
}
function catalogSearchText(p,current){
  const currentText=current.flatMap(s=>[
    s.event,s.mfc_id,s.owner,s.follow_up,s.booking_status,s.decision,s.confirmation,s.performance,
    s.source_detail?.needs_evidence,s.source_detail?.payment_status,s.source_detail?.follow_up_detail
  ]);
  const review=p?.current_rebook_review||{};
  const opportunity=p?.current_rebook_opportunity||{};
  return [p.canonical_event,p.profile_id,p.tier,...(p.aliases||[]),...(p.matched_mfc_ids||[]),...(p.search_terms||[]),opportunity.event_label,opportunity.venue_text,opportunity.current_placement_text,opportunity.current_placement_status,opportunity.current_schedule_text,opportunity.current_schedule_status,opportunity.current_schedule_source_label,opportunity.current_logistics_text,opportunity.current_logistics_status,opportunity.current_logistics_source_label,opportunity.price_text,opportunity.prior_cost_text,opportunity.booking_cost_min,opportunity.booking_cost_max,opportunity.booking_cost_unit,opportunity.booking_cost_basis,opportunity.current_cost_status,opportunity.current_commitment_status,opportunity.commitment_terms_text,opportunity.critical_deadline_date,opportunity.critical_deadline_type,opportunity.critical_deadline_label,opportunity.critical_deadline_basis,opportunity.action_label,opportunity.booking_window_text,opportunity.contact_text,opportunity.contact_name,opportunity.contact_email,opportunity.contact_phone,review.disposition,review.booking_readiness,review.resolution_lane,resolutionLaneLabel(review.resolution_lane),review.outreach_contact_name,review.outreach_contact_phone,review.outreach_contact_email,review.outreach_cycle_status,review.outreach_cycle_text,review.outreach_cycle_source_label,review.blockers_text,review.rationale,review.next_step,review.source_label,...currentText].join(' ').toLowerCase();
}
function catalogMatchesWith(p,f,quickView='NONE',search=state.search){
  const current=profileCurrentShows(p),years=Array.isArray(p.history_years)?p.history_years:[],lpYears=Array.isArray(p.lp_years)?p.lp_years:[],cumulativeLpYears=Array.isArray(p.cumulative_years)?p.cumulative_years:[];
  if(f.profileState==='CURRENT'&&!current.length)return false;
  if(f.profileState==='HISTORICAL'&&!Number(p.history_count||0))return false;
  if(f.profileState==='CURRENT_ONLY'&&p.source_type!=='CURRENT_ONLY')return false;
  if(f.profileState==='HISTORY_ONLY'&&p.source_type!=='HISTORY_ONLY')return false;
  if(f.profileState==='LP_SOURCE_ONLY'&&!isLpSourceOnly(p))return false;
  if(f.historyYear!=='ALL'&&!years.map(String).includes(String(f.historyYear)))return false;
  if(f.lpYear!=='ALL'&&!lpYears.map(String).includes(String(f.lpYear)))return false;
  if(f.cumulativeLpYear!=='ALL'&&!cumulativeLpYears.map(String).includes(String(f.cumulativeLpYear)))return false;
  if(f.tier!=='ALL'&&(f.tier==='OTHER'?Boolean(p.tier):String(p.tier||'').toUpperCase()!==f.tier))return false;
  if(f.historyDepth!=='ALL'&&Number(p.history_year_count||0)<Number(f.historyDepth))return false;
  if(!historyFieldMatch(p,'contact',f.contact,f.historyYear,'has_contact')||
     !historyFieldMatch(p,'booth',f.booth,f.historyYear,'has_booth')||
     !historyFieldMatch(p,'cost',f.cost,f.historyYear,'has_cost')||
     !historyFieldMatch(p,'com',f.com,f.historyYear,'has_com')||
     !historyFieldMatch(p,'performance',f.performance,f.historyYear,'has_performance')||
     !historyFieldMatch(p,'payment',f.historyPayment,f.historyYear,'has_payment')||
     !historyFieldMatch(p,'application',f.application,f.historyYear,'has_application')||
     !triMatch(p.has_lp_performance,f.lp)||!triMatch(p.has_cumulative_lp_performance,f.cumulativeLp)||
     !historyCoiMatch(p,f.coi,f.historyYear)||!historyWorkedMatch(p,f.worked,f.historyYear))return false;
  const scopedCom=scopedComValueForFilters(p,f.historyYear);
  if(!rangeMatch(scopedCom,f.comBand)||!rangeMatch(p.lifetime_net_volume,f.lifetimeNetBand))return false;
  if(f.currentCostBand!=='ALL'){
    const opportunity=p?.current_rebook_opportunity||null;
    if(!opportunity)return false;
    if(!rangeMatch(opportunity.booking_cost_max,f.currentCostBand))return false;
  }
  if(f.currentCostStatus!=='ALL'){
    const opportunity=p?.current_rebook_opportunity||null;
    if(!opportunity||String(opportunity.current_cost_status||'').toUpperCase()!==String(f.currentCostStatus).toUpperCase())return false;
  }
  if(f.currentCommitmentStatus!=='ALL'){
    const opportunity=p?.current_rebook_opportunity||null;
    if(!opportunity||String(opportunity.current_commitment_status||'').toUpperCase()!==String(f.currentCommitmentStatus).toUpperCase())return false;
  }
  if(f.currentPlacementStatus!=='ALL'){
    const opportunity=p?.current_rebook_opportunity||null;
    if(!opportunity||String(opportunity.current_placement_status||'').toUpperCase()!==String(f.currentPlacementStatus).toUpperCase())return false;
  }
  if(f.currentScheduleStatus!=='ALL'){
    const opportunity=p?.current_rebook_opportunity||null;
    if(!opportunity||String(opportunity.current_schedule_status||'').toUpperCase()!==String(f.currentScheduleStatus).toUpperCase())return false;
  }
  if(f.currentLogisticsStatus!=='ALL'){
    const opportunity=p?.current_rebook_opportunity||null;
    if(!opportunity||String(opportunity.current_logistics_status||'').toUpperCase()!==String(f.currentLogisticsStatus).toUpperCase())return false;
  }
  if(quickView==='ALL_LIVE_REBOOK'&&!p?.current_rebook_opportunity)return false;
  if(quickView==='ALL_RESOLUTION_PARADISE_ACTION'&&!liveOpportunityResolutionIs(p,'PARADISE_ACTION'))return false;
  if(quickView==='ALL_RESOLUTION_ORGANIZER_RESPONSE'&&!liveOpportunityResolutionIs(p,'ORGANIZER_RESPONSE'))return false;
  if(quickView==='ALL_RESOLUTION_WAIT_PUBLICATION'&&!liveOpportunityResolutionIs(p,'WAIT_FOR_PUBLICATION'))return false;
  if(quickView==='ALL_RESOLUTION_RECONCILE_EXISTING'&&!liveOpportunityResolutionIs(p,'RECONCILE_EXISTING'))return false;
  if(quickView==='ALL_READY_COMMIT'&&!liveOpportunityReadinessIs(p,'READY_TO_COMMIT'))return false;
  if(quickView==='ALL_PREBOOK_REQUIRED'&&!liveOpportunityReadinessIs(p,'PRE_BOOKING_ACTION_REQUIRED'))return false;
  if(quickView==='ALL_WATCH_GATED_LIVE'&&!liveOpportunityReadinessIs(p,'WATCH_GATED'))return false;
  if(quickView==='ALL_HOLD_RECONCILE_LIVE'&&!liveOpportunityReadinessIs(p,'HOLD_RECONCILE'))return false;
  if(quickView==='ALL_ACT_NOW'&&!liveOpportunityActsNow(p))return false;
  if(quickView==='ALL_ACT_LATER'&&!liveOpportunityActsLater(p))return false;
  if(quickView==='ALL_QUOTE_REQUIRED'&&!liveOpportunityNeedsQuote(p))return false;
  if(quickView==='ALL_NO_PRIOR_PLACEMENT'&&!liveOpportunityMissingPriorPlacement(p))return false;
  if(quickView==='ALL_REBOOK'&&!rebookCandidate(p))return false;
  if(quickView==='ALL_HISTORICAL_OUTREACH'&&!historicalOutreachCandidate(p))return false;
  if(quickView==='ALL_REBOOK_PURSUE'&&(!p?.current_rebook_opportunity||String(p?.current_rebook_review?.disposition||'').toUpperCase()!=='PURSUE'))return false;
  if(quickView==='ALL_REBOOK_WATCH'&&(!p?.current_rebook_opportunity||String(p?.current_rebook_review?.disposition||'').toUpperCase()!=='WATCH'))return false;
  if(quickView==='ALL_REBOOK_HOLD'&&!['HOLD','RETIRED'].includes(String(p?.current_rebook_review?.disposition||'').toUpperCase()))return false;
  if(quickView==='ALL_HISTORICAL_2013'&&!historicalReviewCandidate2013(p))return false;
  if(quickView==='ALL_TOP_NET'&&(p.lifetime_net_volume===null||p.lifetime_net_volume===undefined||p.lifetime_net_volume===''||!Number.isFinite(Number(p.lifetime_net_volume))))return false;
  if(quickView==='ALL_MISSING'&&(f.historyYear==='ALL'||isLpSourceOnly(p)||missingFieldCountForYear(p,f.historyYear)===0))return false;
  if(f.currentStatus!=='ALL'&&!current.some(s=>s.show_status===f.currentStatus))return false;
  if(f.currentTreatment==='IN PLAY'&&!current.some(s=>s.this_year!=='SKIP THIS YEAR'))return false;
  if(f.currentTreatment==='SKIPPED'&&!current.some(s=>s.this_year==='SKIP THIS YEAR'))return false;
  if(f.confirmation!=='ALL'&&!current.some(s=>String(s.confirmation||'UNVERIFIED').toUpperCase()===f.confirmation))return false;
  if(f.currentEventYear!=='ALL'&&!current.some(s=>String(showEventYear(s))===String(f.currentEventYear)))return false;
  const q=String(search||'').trim().toLowerCase();
  return !q||catalogSearchText(p,current).includes(q);
}
function scopedComValueForFilters(p,year,which='min'){
  if(year!=='ALL'){
    const y=p?.history_field_states?.[String(year)];
    const v=which==='max'?y?.com_max:y?.com_min;
    return v===null||v===undefined||v===''?null:Number(v);
  }
  const v=which==='max'?p.highest_preserved_com:p.lowest_preserved_com;
  return v===null||v===undefined||v===''?null:Number(v);
}
function catalogMatches(p){
  return catalogMatchesWith(p,state.catalogFilters,state.showQuickView,state.search);
}
function numberDesc(field){
  return (a,b)=>(Number(b[field]??-Infinity)-Number(a[field]??-Infinity))||String(a.canonical_event).localeCompare(String(b.canonical_event));
}
function catalogComparator(a,b){
  const sort=state.catalogSort;
  const name=(x,y)=>String(x.canonical_event).localeCompare(String(y.canonical_event),undefined,{sensitivity:'base'});
  if(sort==='NAME_ASC')return name(a,b);
  if(sort==='NAME_DESC')return name(b,a);
  if(sort==='CURRENT_FIRST')return profileCurrentShows(b).length-profileCurrentShows(a).length||name(a,b);
  if(sort==='NEXT_OPPORTUNITY'){
    const ad=String(a?.current_rebook_opportunity?.event_start||'9999-12-31');
    const bd=String(b?.current_rebook_opportunity?.event_start||'9999-12-31');
    return ad.localeCompare(bd)||name(a,b);
  }
  if(sort==='CRITICAL_DEADLINE'){
    const ad=String(a?.current_rebook_opportunity?.critical_deadline_date||'9999-12-31');
    const bd=String(b?.current_rebook_opportunity?.critical_deadline_date||'9999-12-31');
    return ad.localeCompare(bd)||String(a?.current_rebook_opportunity?.event_start||'9999-12-31').localeCompare(String(b?.current_rebook_opportunity?.event_start||'9999-12-31'))||name(a,b);
  }
  if(sort==='CURRENT_COST_LOW'){
    const av=opportunityCostNumber(a?.current_rebook_opportunity,'booking_cost_max');
    const bv=opportunityCostNumber(b?.current_rebook_opportunity,'booking_cost_max');
    const aa=av!==null,bb=bv!==null;
    if(aa!==bb)return aa?-1:1;
    return aa?av-bv||name(a,b):name(a,b);
  }
  if(sort==='CURRENT_COST_HIGH'){
    const av=opportunityCostNumber(a?.current_rebook_opportunity,'booking_cost_max');
    const bv=opportunityCostNumber(b?.current_rebook_opportunity,'booking_cost_max');
    const aa=av!==null,bb=bv!==null;
    if(aa!==bb)return aa?-1:1;
    return aa?bv-av||name(a,b):name(a,b);
  }
  if(sort==='BOOKING_DECISION'){
    const weight=p=>{
      const d=String(p?.current_rebook_review?.disposition||'').toUpperCase();
      return ({PURSUE:0,WATCH:1,HOLD:2,RETIRED:3})[d]??9;
    };
    const actionDate=p=>{
      const op=p?.current_rebook_opportunity||{};
      return String(op.critical_deadline_date||op.event_start||'9999-12-31');
    };
    const ad=actionDate(a),bd=actionDate(b);
    const aw=weight(a),bw=weight(b);
    return ad.localeCompare(bd)||aw-bw||Number(b.lifetime_net_volume||0)-Number(a.lifetime_net_volume||0)||name(a,b);
  }
  if(sort==='LATEST_HISTORY')return Number(b.latest_history_year||0)-Number(a.latest_history_year||0)||name(a,b);
  if(sort==='HISTORY_DEPTH')return Number(b.history_year_count||0)-Number(a.history_year_count||0)||Number(b.history_count||0)-Number(a.history_count||0)||name(a,b);
  if(sort==='HISTORY_RECORDS')return Number(b.history_count||0)-Number(a.history_count||0)||name(a,b);
  if(sort==='OCCURRENCES')return Number(b.occurrences||0)-Number(a.occurrences||0)||name(a,b);
  if(sort==='WORKED_YEARS')return Number(b.worked_year_count||0)-Number(a.worked_year_count||0)||name(a,b);
  if(sort==='LOWEST_COM'){
    const av=scopedComValue(a,'min'),bv=scopedComValue(b,'min'),aa=Number.isFinite(av),bb=Number.isFinite(bv);
    if(aa!==bb)return aa?-1:1;
    return aa?av-bv||name(a,b):name(a,b);
  }
  if(sort==='HIGHEST_COM'){
    const av=scopedComValue(a,'max'),bv=scopedComValue(b,'max'),aa=Number.isFinite(av),bb=Number.isFinite(bv);
    if(aa!==bb)return aa?-1:1;
    return aa?bv-av||name(a,b):name(a,b);
  }
  if(sort==='LIFETIME_NET')return numberDesc('lifetime_net_volume')(a,b);
  if(sort==='LIFETIME_SALES')return numberDesc('lifetime_net_sales')(a,b);
  if(sort==='CLOSE_VOLUME')return numberDesc('lifetime_close_volume')(a,b);
  if(sort==='ISSUED')return numberDesc('issued')(a,b);
  if(sort==='NET_2025')return numberDesc('net_volume_2025')(a,b);
  if(sort==='NET_2024')return numberDesc('net_volume_2024')(a,b);
  if(sort==='DATA_COMPLETE')return scopedCompletenessScore(b)-scopedCompletenessScore(a)||name(a,b);
  if(sort==='MISSING_DATA'){
    const year=state.catalogFilters.historyYear;
    if(year!=='ALL')return missingFieldCountForYear(b,year)-missingFieldCountForYear(a,year)||name(a,b);
    return scopedCompletenessScore(a)-scopedCompletenessScore(b)||name(a,b);
  }
  return profileCurrentShows(b).length-profileCurrentShows(a).length||Number(a.tier_rank??999)-Number(b.tier_rank??999)||Number(b.lifetime_net_volume||0)-Number(a.lifetime_net_volume||0)||name(a,b);
}
function currentSearchText(s){
  return [
    s.event,s.mfc_id,s.restart_wave,s.follow_up,s.owner,s.booking_status,s.decision,s.confirmation,s.performance,
    s.payment_due_text,s.source_text,s.source_detail?.needs_evidence,s.source_detail?.payment_status,s.source_detail?.follow_up_detail
  ].join(' ').toLowerCase();
}
function currentMatchesWith(s,f,quickView='NONE',search=state.search){
  if(f.status!=='ALL'&&s.show_status!==f.status)return false;
  if(f.treatment==='IN PLAY'&&s.this_year==='SKIP THIS YEAR')return false;
  if(f.treatment==='SKIPPED'&&s.this_year!=='SKIP THIS YEAR')return false;
  if(f.eventYear!=='ALL'&&String(showEventYear(s))!==String(f.eventYear))return false;
  const due=daysFromToday(s.action_due);
  if(f.timing==='OVERDUE'&&!(due!==null&&due<0))return false;
  if(f.timing==='NEXT7'&&!(due!==null&&due>=0&&due<=7))return false;
  if(f.timing==='NO_DATE'&&s.action_due)return false;
  if(f.timing==='FUTURE'&&!(due!==null&&due>7))return false;
  if(f.confirmation!=='ALL'&&String(s.confirmation||'UNVERIFIED').toUpperCase()!==f.confirmation)return false;
  if(f.owner!=='ALL'&&String(s.owner||'Unassigned')!==f.owner)return false;
  if(f.evidence!=='ALL'&&String(s.source_detail?.needs_evidence||'NONE')!==f.evidence)return false;
  if(f.payment!=='ALL'&&String(s.source_detail?.payment_status||'NO PAYMENT SCHEDULE')!==f.payment)return false;
  if(quickView==='CURRENT_BOOK_NOW'&&!['BOOK_NOW','PRIORITY_REVIEW','LATE_VERIFY'].includes(bookingSignal(s).key))return false;
  if(quickView==='CURRENT_COMMITTED'&&bookingSignal(s).key!=='COMMITTED')return false;
  if(quickView==='CURRENT_WATCH'&&!['WATCH_DATE','NEXT_CYCLE','IN_PROGRESS','GATED'].includes(bookingSignal(s).key))return false;
  if(quickView==='CURRENT_EVIDENCE'&&String(s.source_detail?.needs_evidence||'NONE')==='NONE')return false;
  if(quickView==='CURRENT_COST_HIGH'&&(s.max_booking_cost===null||s.max_booking_cost===undefined||s.max_booking_cost===''))return false;
  if(!rangeMatch(s.max_booking_cost,f.costBand))return false;
  const hasFollow=Boolean(String(s.follow_up||'').trim()&&String(s.follow_up||'').trim()!=='—');
  if(!triMatch(hasFollow,f.followUp))return false;
  const q=String(search||'').trim().toLowerCase();
  return !q||currentSearchText(s).includes(q);
}
function currentMatches(s){
  return currentMatchesWith(s,state.currentFilters,state.showQuickView,state.search);
}
function currentComparator(a,b){
  const sort=state.currentSort,name=(x,y)=>String(x.event).localeCompare(String(y.event),undefined,{sensitivity:'base'});
  const dateKey=x=>String(x||'9999-12-31');
  const statusWeight={RECONCILE:0,OPEN:1,'DATE ONLY':2,HOLD:3,READY:4};
  const confirmationWeight={UNVERIFIED:0,PARTIAL:1,VERIFIED:2};
  if(sort==='BOOKING')return bookingSignal(a).weight-bookingSignal(b).weight||dateKey(a.event_start).localeCompare(dateKey(b.event_start))||name(a,b);
  if(sort==='EVENT_ASC')return dateKey(a.event_start).localeCompare(dateKey(b.event_start))||name(a,b);
  if(sort==='EVENT_DESC')return dateKey(b.event_start||'0000').localeCompare(dateKey(a.event_start||'0000'))||name(a,b);
  if(sort==='ACTION_DUE')return dateKey(a.action_due).localeCompare(dateKey(b.action_due))||name(a,b);
  if(sort==='STATUS')return (statusWeight[a.show_status]??9)-(statusWeight[b.show_status]??9)||dateKey(a.action_due).localeCompare(dateKey(b.action_due))||name(a,b);
  if(sort==='COST_LOW')return Number(a.max_booking_cost??Infinity)-Number(b.max_booking_cost??Infinity)||name(a,b);
  if(sort==='COST_HIGH')return Number(b.max_booking_cost??-Infinity)-Number(a.max_booking_cost??-Infinity)||name(a,b);
  if(sort==='NAME_ASC')return name(a,b);
  if(sort==='NAME_DESC')return name(b,a);
  if(sort==='OWNER')return String(a.owner||'Unassigned').localeCompare(String(b.owner||'Unassigned'))||name(a,b);
  if(sort==='CONFIRMATION')return (confirmationWeight[String(b.confirmation||'UNVERIFIED').toUpperCase()]??0)-(confirmationWeight[String(a.confirmation||'UNVERIFIED').toUpperCase()]??0)||name(a,b);
  if(sort==='EVIDENCE'){
    const weight=v=>String(v||'NONE')==='NONE'?9:String(v||'').includes('MULTIPLE')?0:String(v||'').includes('BOOKING')?1:String(v||'').includes('PAYMENT')?2:3;
    return weight(a.source_detail?.needs_evidence)-weight(b.source_detail?.needs_evidence)||name(a,b);
  }
  if(sort==='PAYMENT')return String(a.source_detail?.payment_status||'NO PAYMENT SCHEDULE').localeCompare(String(b.source_detail?.payment_status||'NO PAYMENT SCHEDULE'))||name(a,b);
  const ad=daysFromToday(a.action_due),bd=daysFromToday(b.action_due);
  const aa=ad===null?99999:ad,bb=bd===null?99999:bd;
  return aa-bb||(statusWeight[a.show_status]??9)-(statusWeight[b.show_status]??9)||dateKey(a.event_start).localeCompare(dateKey(b.event_start))||name(a,b);
}
function draftCatalogFilters(){
  return {
    profileState:$('#fProfileState')?.value??state.catalogFilters.profileState,
    historyYear:$('#fHistoryYear')?.value??state.catalogFilters.historyYear,
    lpYear:$('#fLpYear')?.value??state.catalogFilters.lpYear,
    cumulativeLpYear:$('#fCumulativeLpYear')?.value??state.catalogFilters.cumulativeLpYear,
    tier:$('#fTier')?.value??state.catalogFilters.tier,
    historyDepth:$('#fHistoryDepth')?.value??state.catalogFilters.historyDepth,
    contact:$('#fContact')?.value??state.catalogFilters.contact,
    booth:$('#fBooth')?.value??state.catalogFilters.booth,
    cost:$('#fCost')?.value??state.catalogFilters.cost,
    com:$('#fCom')?.value??state.catalogFilters.com,
    performance:$('#fPerformance')?.value??state.catalogFilters.performance,
    historyPayment:$('#fHistoryPayment')?.value??state.catalogFilters.historyPayment,
    application:$('#fApplication')?.value??state.catalogFilters.application,
    lp:$('#fLp')?.value??state.catalogFilters.lp,
    cumulativeLp:$('#fCumulativeLp')?.value??state.catalogFilters.cumulativeLp,
    coi:$('#fCoi')?.value??state.catalogFilters.coi,
    worked:$('#fWorked')?.value??state.catalogFilters.worked,
    comBand:$('#fComBand')?.value??state.catalogFilters.comBand,
    lifetimeNetBand:$('#fLifetimeNetBand')?.value??state.catalogFilters.lifetimeNetBand,
    currentCostBand:$('#fOpportunityCostBand')?.value??state.catalogFilters.currentCostBand,
    currentCostStatus:$('#fOpportunityCostStatus')?.value??state.catalogFilters.currentCostStatus,
    currentCommitmentStatus:$('#fOpportunityCommitmentStatus')?.value??state.catalogFilters.currentCommitmentStatus,
    currentPlacementStatus:$('#fOpportunityPlacementStatus')?.value??state.catalogFilters.currentPlacementStatus,
    currentScheduleStatus:$('#fOpportunityScheduleStatus')?.value??state.catalogFilters.currentScheduleStatus,
    currentLogisticsStatus:$('#fOpportunityLogisticsStatus')?.value??state.catalogFilters.currentLogisticsStatus,
    currentStatus:$('#fCurrentStatus')?.value??state.catalogFilters.currentStatus,
    currentTreatment:$('#fCurrentTreatment')?.value??state.catalogFilters.currentTreatment,
    confirmation:$('#fConfirmation')?.value??state.catalogFilters.confirmation,
    currentEventYear:$('#fCurrentEventYear')?.value??state.catalogFilters.currentEventYear,
  };
}
function draftCurrentFilters(){
  return {
    status:$('#fCurrentStatus')?.value??state.currentFilters.status,
    treatment:$('#fTreatment')?.value??state.currentFilters.treatment,
    eventYear:$('#fEventYear')?.value??state.currentFilters.eventYear,
    timing:$('#fTiming')?.value??state.currentFilters.timing,
    confirmation:$('#fCurrentConfirmation')?.value??state.currentFilters.confirmation,
    owner:$('#fOwner')?.value??state.currentFilters.owner,
    evidence:$('#fEvidence')?.value??state.currentFilters.evidence,
    payment:$('#fPayment')?.value??state.currentFilters.payment,
    costBand:$('#fCostBand')?.value??state.currentFilters.costBand,
    followUp:$('#fFollowUp')?.value??state.currentFilters.followUp,
  };
}
function filterPreviewCount(){
  if(state.showMode==='ALL'){
    const f=draftCatalogFilters();
    return state.catalog.filter(p=>catalogMatchesWith(p,f,'NONE',state.search)).length;
  }
  const f=draftCurrentFilters();
  return state.shows.filter(s=>currentMatchesWith(s,f,'NONE',state.search)).length;
}
function updateFilterPreview(){
  refreshContextFacetCounts();
  const count=filterPreviewCount();
  const preview=$('#filterPreview'),apply=$('#filterApply');
  if(preview){
    preview.classList.toggle('zero',count===0);
    preview.innerHTML=count===0
      ?'<b>0 shows match</b><span>Adjust one or more filters before applying.</span>'
      :`<b>${count.toLocaleString()} show${count===1?'':'s'} match</b><span>Counts above reflect your other selected filters and current search.</span>`;
  }
  if(apply){
    apply.disabled=count===0;
    apply.textContent=count===0?'No matching shows':`Apply filters · ${count.toLocaleString()}`;
  }
}
function bindFilterPreview(){
  $$('#filterBody select').forEach(select=>select.onchange=updateFilterPreview);
  updateFilterPreview();
}
function contextualFacetCount(mode,fieldKey,candidateValue){
  if(mode==='ALL'){
    const filters=draftCatalogFilters();
    filters[fieldKey]=candidateValue;
    return state.catalog.filter(p=>catalogMatchesWith(p,filters,'NONE',state.search)).length;
  }
  const filters=draftCurrentFilters();
  filters[fieldKey]=candidateValue;
  return state.shows.filter(s=>currentMatchesWith(s,filters,'NONE',state.search)).length;
}
function refreshContextFacetCounts(){
  const mode=state.showMode;
  const mapping=mode==='ALL'
    ?{
      fProfileState:'profileState',fHistoryYear:'historyYear',fLpYear:'lpYear',fCumulativeLpYear:'cumulativeLpYear',fTier:'tier',fHistoryDepth:'historyDepth',
      fContact:'contact',fBooth:'booth',fCost:'cost',fCom:'com',fPerformance:'performance',fHistoryPayment:'historyPayment',fApplication:'application',fLp:'lp',fCumulativeLp:'cumulativeLp',fCoi:'coi',fWorked:'worked',
      fComBand:'comBand',fLifetimeNetBand:'lifetimeNetBand',fOpportunityCostBand:'currentCostBand',fOpportunityCostStatus:'currentCostStatus',fOpportunityCommitmentStatus:'currentCommitmentStatus',fOpportunityPlacementStatus:'currentPlacementStatus',fOpportunityScheduleStatus:'currentScheduleStatus',fOpportunityLogisticsStatus:'currentLogisticsStatus',fCurrentEventYear:'currentEventYear',fCurrentStatus:'currentStatus',
      fCurrentTreatment:'currentTreatment',fConfirmation:'confirmation',
    }
    :{
      fCurrentStatus:'status',fTreatment:'treatment',fEventYear:'eventYear',fTiming:'timing',fCurrentConfirmation:'confirmation',
      fOwner:'owner',fEvidence:'evidence',fPayment:'payment',fCostBand:'costBand',fFollowUp:'followUp',
    };
  for(const [selectId,key] of Object.entries(mapping)){
    const select=$('#'+selectId);
    if(!select)continue;
    for(const option of Array.from(select.options)){
      const count=contextualFacetCount(mode,key,option.value);
      const base=option.dataset.baseLabel||option.textContent.replace(/\s+\([\d,]+\)$/,'');
      option.dataset.baseLabel=base;
      option.textContent=`${base} (${count.toLocaleString()})`;
      option.disabled=count===0&&!option.selected;
    }
  }
}
function filterField(label,id,value,options){
  return `<div class="filterField"><label for="${id}">${esc(label)}</label><select id="${id}">${options.map(([v,l,count])=>{const hasCount=Number.isFinite(Number(count));const n=hasCount?Number(count):null;const selected=String(value)===String(v);const disabled=hasCount&&n===0&&!selected;return `<option value="${esc(v)}" data-base-label="${esc(l)}" ${selected?'selected':''} ${disabled?'disabled':''}>${esc(l)}${hasCount?' ('+n.toLocaleString()+')':''}</option>`}).join('')}</select></div>`;
}
function countBy(items,keyFn){
  const out={};
  for(const item of items){
    const key=String(keyFn(item)??'');
    out[key]=(out[key]||0)+1;
  }
  return out;
}
function catalogFacetCounts(){
  const profiles=state.catalog,currentByProfile=new Map();
  for(const p of profiles)currentByProfile.set(p.profile_id,profileCurrentShows(p));
  const years={},lpYears={},cumulativeLpYears={},currentYears={},status={},treatment={IN_PLAY:0,SKIPPED:0},confirmation={};
  const tier={PLATINUM:0,GOLD:0,SILVER:0,OTHER:0};
  const record={CURRENT:0,HISTORICAL:0,CURRENT_ONLY:0,HISTORY_ONLY:0,LP_SOURCE_ONLY:0};
  const depth={'1':0,'2':0,'3':0,'5':0};
  const flagKeys=['has_contact','has_booth','has_cost','has_com','has_performance','has_payment','has_application','has_lp_performance','has_cumulative_lp_performance'];
  const flags=Object.fromEntries(flagKeys.map(k=>[k,{HAS:0,MISSING:0}]));
  const coi={HAS:0,NO:0,UNKNOWN:0},worked={HAS:0,MISSING:0},comBand={UNDER5:0,'5_10':0,'10_15':0,'15_25':0,'25PLUS':0},lifeBand={UNDER25K:0,'25_100K':0,'100_250K':0,'250KPLUS':0},opportunityCostBand={ALL:0,UNDER500:0,'500_1000':0,'1000_2500':0,'2500_5000':0,'5000PLUS':0,MISSING:0},opportunityCostStatus={ALL:0,KNOWN_VERIFIED:0,QUOTE_REQUIRED:0,CONTRACT_REVIEW_REQUIRED:0,RECONCILE_EXISTING:0,NOT_PUBLISHED_YET:0,NEXT_CYCLE_CLOSED:0},opportunityCommitmentStatus={ALL:0,VERIFIED_CURRENT:0,PARTIAL_CURRENT:0,AGREEMENT_REQUIRED:0,RECONCILE_EXISTING:0,NOT_PUBLISHED_YET:0,NEXT_CYCLE_CLOSED:0},opportunityPlacementStatus={ALL:0,ASSIGNED_VERIFIED:0,LISTED_ASSIGNMENT_UNVERIFIED:0,FLOOR_PLAN_AVAILABLE_NOT_SELECTED:0,APPLICATION_OPEN_NOT_ASSIGNED:0,CONTRACT_REQUEST_NOT_ASSIGNED:0,SPONSORSHIP_PLACEMENT_UNVERIFIED:0,PLACEMENT_NOT_PUBLISHED:0,NEXT_CYCLE_CLOSED:0},opportunityScheduleStatus={ALL:0,VERIFIED_CURRENT:0,NOT_PUBLISHED_YET:0,CURRENT_SOURCE_HOURS_NOT_RECOVERED:0,SOURCE_CONFLICT_REQUIRES_CONFIRMATION:0},opportunityLogisticsStatus={ALL:0,VERIFIED_CURRENT:0,PARTIAL_CURRENT:0,EXHIBITOR_KIT_REQUIRED:0,PROPOSAL_REQUIRED:0,NOT_PUBLISHED_YET:0,NEXT_CYCLE_CLOSED:0};
  for(const p of profiles){
    const current=currentByProfile.get(p.profile_id)||[];
    const hist=Number(p.history_count||0);
    if(current.length)record.CURRENT++;
    if(hist)record.HISTORICAL++;
    if(p.source_type==='CURRENT_ONLY')record.CURRENT_ONLY++;
    if(p.source_type==='HISTORY_ONLY')record.HISTORY_ONLY++;
    if(isLpSourceOnly(p))record.LP_SOURCE_ONLY++;
    const t=String(p.tier||'').toUpperCase();
    tier[['PLATINUM','GOLD','SILVER'].includes(t)?t:'OTHER']++;
    for(const y of (Array.isArray(p.history_years)?p.history_years:[]))years[String(y)]=(years[String(y)]||0)+1;
    for(const y of (Array.isArray(p.lp_years)?p.lp_years:[]))lpYears[String(y)]=(lpYears[String(y)]||0)+1;
    for(const y of (Array.isArray(p.cumulative_years)?p.cumulative_years:[]))cumulativeLpYears[String(y)]=(cumulativeLpYears[String(y)]||0)+1;
    for(const d of [1,2,3,5])if(Number(p.history_year_count||0)>=d)depth[String(d)]++;
    for(const k of flagKeys)flags[k][p[k]?'HAS':'MISSING']++;
    coi[p.has_coi?'HAS':p.has_coi_status?'NO':'UNKNOWN']++;
    worked[Number(p.worked_year_count||0)>0?'HAS':'MISSING']++;
    const com=p.lowest_preserved_com;
    if(com!==null&&com!==undefined&&com!==''){
      const n=Number(com);
      if(Number.isFinite(n)){
        if(n<5)comBand.UNDER5++;
        else if(n<10)comBand['5_10']++;
        else if(n<15)comBand['10_15']++;
        else if(n<25)comBand['15_25']++;
        else comBand['25PLUS']++;
      }
    }
    const netRaw=p.lifetime_net_volume,net=Number(netRaw);
    if(netRaw!==null&&netRaw!==undefined&&netRaw!==''&&Number.isFinite(net)){
      if(net<25000)lifeBand.UNDER25K++;
      else if(net<100000)lifeBand['25_100K']++;
      else if(net<250000)lifeBand['100_250K']++;
      else lifeBand['250KPLUS']++;
    }
    const liveOpportunity=p?.current_rebook_opportunity||null;
    if(liveOpportunity){
      opportunityCostBand.ALL++;
      opportunityCostStatus.ALL++;
      const costStatus=String(liveOpportunity.current_cost_status||'').toUpperCase();
      if(costStatus in opportunityCostStatus)opportunityCostStatus[costStatus]++;
      opportunityCommitmentStatus.ALL++;
      const commitmentStatus=String(liveOpportunity.current_commitment_status||'').toUpperCase();
      if(commitmentStatus in opportunityCommitmentStatus)opportunityCommitmentStatus[commitmentStatus]++;
      opportunityPlacementStatus.ALL++;
      const placementStatus=String(liveOpportunity.current_placement_status||'').toUpperCase();
      if(placementStatus in opportunityPlacementStatus)opportunityPlacementStatus[placementStatus]++;
      opportunityScheduleStatus.ALL++;
      const scheduleStatus=String(liveOpportunity.current_schedule_status||'').toUpperCase();
      if(scheduleStatus in opportunityScheduleStatus)opportunityScheduleStatus[scheduleStatus]++;
      opportunityLogisticsStatus.ALL++;
      const logisticsStatus=String(liveOpportunity.current_logistics_status||'').toUpperCase();
      if(logisticsStatus in opportunityLogisticsStatus)opportunityLogisticsStatus[logisticsStatus]++;
      const entry=opportunityCostNumber(liveOpportunity,'booking_cost_max');
      if(entry===null)opportunityCostBand.MISSING++;
      else if(entry<500)opportunityCostBand.UNDER500++;
      else if(entry<1000)opportunityCostBand['500_1000']++;
      else if(entry<2500)opportunityCostBand['1000_2500']++;
      else if(entry<5000)opportunityCostBand['2500_5000']++;
      else opportunityCostBand['5000PLUS']++;
    }
    const seenYears=new Set(),seenStatus=new Set(),seenTreat=new Set(),seenConfirm=new Set();
    for(const s of current){
      const y=showEventYear(s);
      if(y&&!seenYears.has(y)){seenYears.add(y);currentYears[String(y)]=(currentYears[String(y)]||0)+1}
      const st=String(s.show_status||'');
      if(st&&!seenStatus.has(st)){seenStatus.add(st);status[st]=(status[st]||0)+1}
      const tr=s.this_year==='SKIP THIS YEAR'?'SKIPPED':'IN_PLAY';
      if(!seenTreat.has(tr)){seenTreat.add(tr);treatment[tr]++}
      const cf=String(s.confirmation||'UNVERIFIED').toUpperCase();
      if(!seenConfirm.has(cf)){seenConfirm.add(cf);confirmation[cf]=(confirmation[cf]||0)+1}
    }
  }
  return {total:profiles.length,record,years,lpYears,cumulativeLpYears,tier,depth,flags,coi,worked,comBand,lifeBand,opportunityCostBand,opportunityCostStatus,opportunityCommitmentStatus,opportunityPlacementStatus,opportunityScheduleStatus,opportunityLogisticsStatus,currentYears,status,treatment,confirmation};
}
function currentFacetCounts(){
  const shows=state.shows;
  const status=countBy(shows,s=>s.show_status||'');
  const eventYear=countBy(shows,s=>showEventYear(s)||'');
  const confirmation=countBy(shows,s=>String(s.confirmation||'UNVERIFIED').toUpperCase());
  const owner=countBy(shows,s=>String(s.owner||'Unassigned'));
  const evidence=countBy(shows,s=>String(s.source_detail?.needs_evidence||'NONE'));
  const payment=countBy(shows,s=>String(s.source_detail?.payment_status||'NO PAYMENT SCHEDULE'));
  const treatment={ALL:shows.length,IN_PLAY:0,SKIPPED:0},timing={ALL:shows.length,OVERDUE:0,NEXT7:0,NO_DATE:0,FUTURE:0},costBand={ALL:shows.length,UNDER500:0,'500_1000':0,'1000_2500':0,'2500_5000':0,'5000PLUS':0,MISSING:0},followUp={ANY:shows.length,HAS:0,MISSING:0};
  for(const s of shows){
    treatment[s.this_year==='SKIP THIS YEAR'?'SKIPPED':'IN_PLAY']++;
    const due=daysFromToday(s.action_due);
    if(due===null)timing.NO_DATE++;
    else if(due<0)timing.OVERDUE++;
    else if(due<=7)timing.NEXT7++;
    else timing.FUTURE++;
    const cost=s.max_booking_cost;
    if(cost===null||cost===undefined||cost==='')costBand.MISSING++;
    else{
      const n=Number(cost);
      if(n<500)costBand.UNDER500++;
      else if(n<1000)costBand['500_1000']++;
      else if(n<2500)costBand['1000_2500']++;
      else if(n<5000)costBand['2500_5000']++;
      else costBand['5000PLUS']++;
    }
    const hasFollow=Boolean(String(s.follow_up||'').trim()&&String(s.follow_up||'').trim()!=='—');
    followUp[hasFollow?'HAS':'MISSING']++;
  }
  return {total:shows.length,status,eventYear,confirmation,owner,evidence,payment,treatment,timing,costBand,followUp};
}
function countedOptions(options,counts){
  return options.map(([value,label])=>[value,label,Number(counts?.[value]||0)]);
}
function defaultCatalogFilters(){
  return {profileState:'ALL',historyYear:'ALL',lpYear:'ALL',cumulativeLpYear:'ALL',tier:'ALL',historyDepth:'ALL',contact:'ANY',booth:'ANY',cost:'ANY',com:'ANY',performance:'ANY',historyPayment:'ANY',application:'ANY',lp:'ANY',cumulativeLp:'ANY',coi:'ANY',worked:'ANY',comBand:'ALL',lifetimeNetBand:'ALL',currentCostBand:'ALL',currentCostStatus:'ALL',currentCommitmentStatus:'ALL',currentPlacementStatus:'ALL',currentScheduleStatus:'ALL',currentLogisticsStatus:'ALL',currentStatus:'ALL',currentTreatment:'ALL',confirmation:'ALL',currentEventYear:'ALL'};
}
function defaultCurrentFilters(){
  return {status:'ALL',treatment:'ALL',eventYear:'ALL',timing:'ALL',confirmation:'ALL',owner:'ALL',evidence:'ALL',payment:'ALL',costBand:'ALL',followUp:'ANY'};
}
function liveOpportunityNeedsQuote(p){
  const op=p?.current_rebook_opportunity||null;
  return Boolean(op)
    &&opportunityCostNumber(op,'booking_cost_min')===null
    &&opportunityCostNumber(op,'booking_cost_max')===null;
}
function liveOpportunityMissingPriorPlacement(p){
  if(!p?.current_rebook_opportunity)return false;
  return !historicalPlacementValue(p.best_observed_specific_booth)&&!historicalPlacementValue(p.latest_preserved_booth);
}
function liveOpportunityReadinessIs(p,value){
  return Boolean(p?.current_rebook_opportunity)&&String(p?.current_rebook_review?.booking_readiness||'').toUpperCase()===String(value||'').toUpperCase();
}
function liveOpportunityResolutionIs(p,value){
  return Boolean(p?.current_rebook_opportunity)&&String(p?.current_rebook_review?.resolution_lane||'').toUpperCase()===String(value||'').toUpperCase();
}
function liveOpportunityActsNow(p){
  if(!p?.current_rebook_opportunity)return false;
  return /^NOW\b/i.test(String(p?.current_rebook_review?.action_timing||'').trim());
}
function liveOpportunityActsLater(p){
  if(!p?.current_rebook_opportunity)return false;
  const timing=String(p?.current_rebook_review?.action_timing||'').trim();
  return Boolean(timing)&&!/^NOW\b/i.test(timing);
}
function historicalOutreachCandidate(p){
  if(p?.current_rebook_opportunity)return false;
  const review=p?.current_rebook_review||null;
  const disposition=String(review?.disposition||'').toUpperCase();
  if(!['PURSUE','WATCH'].includes(disposition))return false;
  return Boolean(String(review?.outreach_contact_phone||'').trim()||String(review?.outreach_contact_email||'').trim()||String(review?.outreach_contact_source_url||'').trim());
}
function quickViewOptions(mode){
  const cleanupYear=state.catalogFilters.historyYear;
  return mode==='ALL'
    ?[
      ['ALL_LIVE_REBOOK','Live booking board'],
      ['ALL_RESOLUTION_PARADISE_ACTION','Paradise action'],
      ['ALL_RESOLUTION_ORGANIZER_RESPONSE','Organizer response'],
      ['ALL_RESOLUTION_WAIT_PUBLICATION','Wait for publication'],
      ['ALL_RESOLUTION_RECONCILE_EXISTING','Reconcile existing'],
      ['ALL_READY_COMMIT','Ready to commit'],
      ['ALL_PREBOOK_REQUIRED','Pre-booking action'],
      ['ALL_WATCH_GATED_LIVE','Watch / gated live'],
      ['ALL_HOLD_RECONCILE_LIVE','Hold / reconcile live'],
      ['ALL_ACT_NOW','Act now'],
      ['ALL_ACT_LATER','Later / next cycle'],
      ['ALL_QUOTE_REQUIRED','Quote required'],
      ['ALL_NO_PRIOR_PLACEMENT','No prior booth history'],
      ['ALL_REBOOK','Rebook candidates 2013+'],
      ['ALL_HISTORICAL_OUTREACH','Historical outreach'],
      ['ALL_REBOOK_PURSUE','Pursue now'],
      ['ALL_REBOOK_WATCH','Watch / next cycle'],
      ['ALL_REBOOK_HOLD','Hold / do not book'],
      ['ALL_HISTORICAL_2013','Positive-net history 2013+'],
      ['ALL_TOP_NET','Top lifetime net'],
      ['ALL_LOW_COM','Low COM'],
      ['ALL_MISSING',cleanupYear==='ALL'?'Missing fields · choose year':'Missing fields · '+cleanupYear],
      ['ALL_HIST_ONLY','Historical only'],
      ['ALL_LP_SOURCE_ONLY','LP source only'],
      ['ALL_CURRENT_LINKED','Current linked'],
    ]
    :[
      ['CURRENT_BOOK_NOW','Book / priority'],
      ['CURRENT_COMMITTED','Committed'],
      ['CURRENT_WATCH','Watch / gated / next'],
      ['CURRENT_IN_PLAY','In Play'],
      ['CURRENT_DUE7','Due ≤7 days'],
      ['CURRENT_EVIDENCE','Evidence attention'],
      ['CURRENT_NO_DATE','No action date'],
      ['CURRENT_COST_HIGH','Highest booking cost'],
    ];
}
function quickViewCount(key){
  if(key==='ALL_LIVE_REBOOK')return state.catalog.filter(p=>Boolean(p?.current_rebook_opportunity)).length;
  if(key==='ALL_RESOLUTION_PARADISE_ACTION')return state.catalog.filter(p=>liveOpportunityResolutionIs(p,'PARADISE_ACTION')).length;
  if(key==='ALL_RESOLUTION_ORGANIZER_RESPONSE')return state.catalog.filter(p=>liveOpportunityResolutionIs(p,'ORGANIZER_RESPONSE')).length;
  if(key==='ALL_RESOLUTION_WAIT_PUBLICATION')return state.catalog.filter(p=>liveOpportunityResolutionIs(p,'WAIT_FOR_PUBLICATION')).length;
  if(key==='ALL_RESOLUTION_RECONCILE_EXISTING')return state.catalog.filter(p=>liveOpportunityResolutionIs(p,'RECONCILE_EXISTING')).length;
  if(key==='ALL_READY_COMMIT')return state.catalog.filter(p=>liveOpportunityReadinessIs(p,'READY_TO_COMMIT')).length;
  if(key==='ALL_PREBOOK_REQUIRED')return state.catalog.filter(p=>liveOpportunityReadinessIs(p,'PRE_BOOKING_ACTION_REQUIRED')).length;
  if(key==='ALL_WATCH_GATED_LIVE')return state.catalog.filter(p=>liveOpportunityReadinessIs(p,'WATCH_GATED')).length;
  if(key==='ALL_HOLD_RECONCILE_LIVE')return state.catalog.filter(p=>liveOpportunityReadinessIs(p,'HOLD_RECONCILE')).length;
  if(key==='ALL_ACT_NOW')return state.catalog.filter(liveOpportunityActsNow).length;
  if(key==='ALL_ACT_LATER')return state.catalog.filter(liveOpportunityActsLater).length;
  if(key==='ALL_QUOTE_REQUIRED')return state.catalog.filter(liveOpportunityNeedsQuote).length;
  if(key==='ALL_NO_PRIOR_PLACEMENT')return state.catalog.filter(liveOpportunityMissingPriorPlacement).length;
  if(key==='ALL_REBOOK')return state.catalog.filter(rebookCandidate).length;
  if(key==='ALL_HISTORICAL_OUTREACH')return state.catalog.filter(historicalOutreachCandidate).length;
  if(key==='ALL_REBOOK_PURSUE')return state.catalog.filter(p=>Boolean(p?.current_rebook_opportunity)&&String(p?.current_rebook_review?.disposition||'').toUpperCase()==='PURSUE').length;
  if(key==='ALL_REBOOK_WATCH')return state.catalog.filter(p=>Boolean(p?.current_rebook_opportunity)&&String(p?.current_rebook_review?.disposition||'').toUpperCase()==='WATCH').length;
  if(key==='ALL_REBOOK_HOLD')return state.catalog.filter(p=>['HOLD','RETIRED'].includes(String(p?.current_rebook_review?.disposition||'').toUpperCase())).length;
  if(key==='ALL_HISTORICAL_2013')return state.catalog.filter(historicalReviewCandidate2013).length;
  if(key==='ALL_TOP_NET')return state.catalog.filter(p=>p.lifetime_net_volume!==null&&p.lifetime_net_volume!==undefined&&p.lifetime_net_volume!==''&&Number.isFinite(Number(p.lifetime_net_volume))).length;
  if(key==='ALL_LOW_COM')return state.catalog.filter(p=>p.has_com&&p.lowest_preserved_com!==null&&Number(p.lowest_preserved_com)<5).length;
  if(key==='ALL_MISSING'){
    const year=state.catalogFilters.historyYear;
    if(year==='ALL')return 0;
    return state.catalog.filter(p=>!isLpSourceOnly(p)&&missingFieldCountForYear(p,year)>0).length;
  }
  if(key==='ALL_HIST_ONLY')return state.catalog.filter(p=>p.source_type==='HISTORY_ONLY').length;
  if(key==='ALL_LP_SOURCE_ONLY')return state.catalog.filter(isLpSourceOnly).length;
  if(key==='ALL_CURRENT_LINKED')return state.catalog.filter(p=>profileCurrentShows(p).length>0).length;
  if(key==='CURRENT_BOOK_NOW')return state.shows.filter(s=>s.this_year!=='SKIP THIS YEAR'&&['BOOK_NOW','PRIORITY_REVIEW','LATE_VERIFY'].includes(bookingSignal(s).key)).length;
  if(key==='CURRENT_COMMITTED')return state.shows.filter(s=>s.this_year!=='SKIP THIS YEAR'&&bookingSignal(s).key==='COMMITTED').length;
  if(key==='CURRENT_WATCH')return state.shows.filter(s=>s.this_year!=='SKIP THIS YEAR'&&['WATCH_DATE','NEXT_CYCLE','IN_PROGRESS','GATED'].includes(bookingSignal(s).key)).length;
  if(key==='CURRENT_IN_PLAY')return state.shows.filter(s=>s.this_year!=='SKIP THIS YEAR').length;
  if(key==='CURRENT_DUE7')return state.shows.filter(s=>{const d=daysFromToday(s.action_due);return s.this_year!=='SKIP THIS YEAR'&&d!==null&&d>=0&&d<=7}).length;
  if(key==='CURRENT_EVIDENCE')return state.shows.filter(s=>s.this_year!=='SKIP THIS YEAR'&&String(s.source_detail?.needs_evidence||'NONE')!=='NONE').length;
  if(key==='CURRENT_NO_DATE')return state.shows.filter(s=>s.this_year!=='SKIP THIS YEAR'&&!s.action_due).length;
  if(key==='CURRENT_COST_HIGH')return state.shows.filter(s=>s.max_booking_cost!==null&&s.max_booking_cost!==undefined&&s.max_booking_cost!=='').length;
  return 0;
}
function quickViewsBar(mode){
  const options=quickViewOptions(mode);
  return `<div class="quickViews"><div class="quickViewsLabel">Quick views</div><div class="quickViewRail">${options.map(([key,label])=>{const count=quickViewCount(key);const needsYear=key==='ALL_MISSING'&&state.catalogFilters.historyYear==='ALL';const disabled=count===0&&!needsYear;return `<button class="quickViewChip ${state.showQuickView===key?'active':''}" data-quick-view="${key}" ${disabled?'disabled':''} ${needsYear?'title="Choose a Historical Year to build the cleanup queue"':''}>${esc(label)} <span class="quickViewCount">${count.toLocaleString()}</span></button>`}).join('')}</div></div>`;
}
function applyQuickView(key){
  if(key==='ALL_MISSING'&&state.catalogFilters.historyYear==='ALL'){
    openShowFilters(true);
    const yearSelect=$('#fHistoryYear');
    if(yearSelect){yearSelect.focus();try{yearSelect.scrollIntoView({block:'center',behavior:'smooth'})}catch{}}
    return;
  }
  if(quickViewCount(key)===0)return;
  state.search='';state.catalogLimit=60;state.showQuickView=key;
  if(key.startsWith('ALL_')){
    const selectedHistoryYear=state.catalogFilters.historyYear;
    state.showMode='ALL';state.catalogFilters=defaultCatalogFilters();state.catalogSort='RECOMMENDED';
    if(key==='ALL_LIVE_REBOOK')state.catalogSort='BOOKING_DECISION';
    if(['ALL_RESOLUTION_PARADISE_ACTION','ALL_RESOLUTION_ORGANIZER_RESPONSE','ALL_RESOLUTION_WAIT_PUBLICATION','ALL_RESOLUTION_RECONCILE_EXISTING','ALL_READY_COMMIT','ALL_PREBOOK_REQUIRED','ALL_WATCH_GATED_LIVE','ALL_HOLD_RECONCILE_LIVE'].includes(key))state.catalogSort='BOOKING_DECISION';
    if(key==='ALL_ACT_NOW')state.catalogSort='BOOKING_DECISION';
    if(key==='ALL_ACT_LATER')state.catalogSort='BOOKING_DECISION';
    if(key==='ALL_QUOTE_REQUIRED')state.catalogSort='BOOKING_DECISION';
    if(key==='ALL_NO_PRIOR_PLACEMENT')state.catalogSort='BOOKING_DECISION';
    if(key==='ALL_REBOOK')state.catalogSort='LIFETIME_NET';
    if(key==='ALL_HISTORICAL_OUTREACH')state.catalogSort='LIFETIME_NET';
    if(key==='ALL_REBOOK_PURSUE')state.catalogSort='BOOKING_DECISION';
    if(key==='ALL_REBOOK_WATCH')state.catalogSort='BOOKING_DECISION';
    if(key==='ALL_REBOOK_HOLD')state.catalogSort='LIFETIME_NET';
    if(key==='ALL_HISTORICAL_2013')state.catalogSort='RECOMMENDED';
    if(key==='ALL_TOP_NET')state.catalogSort='LIFETIME_NET';
    if(key==='ALL_LOW_COM'){state.catalogFilters.com='HAS';state.catalogFilters.comBand='UNDER5';state.catalogSort='LOWEST_COM'}
    if(key==='ALL_MISSING'){state.catalogFilters.historyYear=selectedHistoryYear;state.catalogSort='MISSING_DATA'}
    if(key==='ALL_HIST_ONLY'){state.catalogFilters.profileState='HISTORY_ONLY';state.catalogSort='LATEST_HISTORY'}
    if(key==='ALL_LP_SOURCE_ONLY'){state.catalogFilters.profileState='LP_SOURCE_ONLY';state.catalogSort='NAME_ASC'}
    if(key==='ALL_CURRENT_LINKED'){state.catalogFilters.profileState='CURRENT';state.catalogSort='CURRENT_FIRST'}
  }else{
    state.showMode='CURRENT';state.currentFilters=defaultCurrentFilters();state.currentSort='BOOKING';
    if(key==='CURRENT_BOOK_NOW'){state.currentFilters.treatment='IN PLAY';state.currentSort='BOOKING'}
    if(key==='CURRENT_COMMITTED'){state.currentFilters.treatment='IN PLAY';state.currentSort='BOOKING'}
    if(key==='CURRENT_WATCH'){state.currentFilters.treatment='IN PLAY';state.currentSort='BOOKING'}
    if(key==='CURRENT_IN_PLAY')state.currentFilters.treatment='IN PLAY';
    if(key==='CURRENT_DUE7'){state.currentFilters.treatment='IN PLAY';state.currentFilters.timing='NEXT7';state.currentSort='ACTION_DUE'}
    if(key==='CURRENT_EVIDENCE'){state.currentFilters.treatment='IN PLAY';state.currentSort='EVIDENCE'}
    if(key==='CURRENT_NO_DATE'){state.currentFilters.treatment='IN PLAY';state.currentFilters.timing='NO_DATE';state.currentSort='NAME_ASC'}
    if(key==='CURRENT_COST_HIGH')state.currentSort='COST_HIGH';
  }
  if(state.showMode==='ALL'&&!state.catalogLoaded)loadCatalog();
  render();
}
function openShowFilters(cleanupRequest=false){
  pendingCleanupQueue=Boolean(cleanupRequest);
  const all=state.showMode==='ALL';
  const body=$('#filterBody');
  if(!body)return;
  if(all){
    const f=state.catalogFilters,fc=catalogFacetCounts();
    const years=Object.keys(fc.years).map(Number).filter(Number.isFinite).sort((a,b)=>b-a);
    const lpYears=Object.keys(fc.lpYears).map(Number).filter(Number.isFinite).sort((a,b)=>b-a);
    const cumulativeLpYears=Object.keys(fc.cumulativeLpYears).map(Number).filter(Number.isFinite).sort((a,b)=>b-a);
    const currentYears=Object.keys(fc.currentYears).map(Number).filter(Number.isFinite).sort((a,b)=>b-a);
    const opts=(options,counts)=>countedOptions(options,counts);
    const histOpts=(hasLabel,missingLabel)=>[
      ['ANY','Any'],['HAS',hasLabel],['UNKNOWN','Explicit unknown'],['NA','N/A'],['MISSING',missingLabel]
    ];
    const coiOpts=[['ANY','Any status'],['HAS','COI on file'],['NO','Explicit no COI'],['UNKNOWN','Explicit unknown'],['NA','N/A'],['MISSING','Missing in preserved source']];
    body.innerHTML=`<h2>Filter All Shows</h2><div class="subtitle">Counts update against your other selections. Historical field filters use the selected Historical Year when one is chosen; otherwise they evaluate the full preserved history. Missing, explicit unknown, and N/A remain separate.</div>
      <div class="filterSection"><div class="filterSectionTitle">Show record</div><div class="filterGrid">
        ${filterField('Record type','fProfileState',f.profileState,opts([['ALL','All profiles'],['CURRENT','Has current control'],['HISTORICAL','Has historical evidence'],['CURRENT_ONLY','Current only'],['HISTORY_ONLY','Historical only'],['LP_SOURCE_ONLY','LP source only']],{ALL:fc.total,...fc.record}))}
        ${filterField('Historical year','fHistoryYear',f.historyYear,opts([['ALL','All history years'],...years.map(y=>[String(y),String(y)])],{ALL:fc.total,...fc.years}))}
        ${filterField('Annual LP year','fLpYear',f.lpYear,opts([['ALL','All annual LP years'],...lpYears.map(y=>[String(y),String(y)])],{ALL:fc.total,...fc.lpYears}))}
        ${filterField('Cumulative LP year','fCumulativeLpYear',f.cumulativeLpYear,opts([['ALL','All cumulative LP years'],...cumulativeLpYears.map(y=>[String(y),String(y)])],{ALL:fc.total,...fc.cumulativeLpYears}))}
        ${filterField('Performance tier','fTier',f.tier,opts([['ALL','All tiers'],['PLATINUM','Platinum'],['GOLD','Gold'],['SILVER','Silver'],['OTHER','Untiered']],{ALL:fc.total,...fc.tier}))}
        ${filterField('Historical depth','fHistoryDepth',f.historyDepth,opts([['ALL','Any depth'],['1','1+ years'],['2','2+ years'],['3','3+ years'],['5','5+ years']],{ALL:fc.total,...fc.depth}))}
      </div></div>
      <div class="filterSection"><div class="filterSectionTitle">Historical field availability</div><div class="filterGrid">
        ${filterField('Contact','fContact',f.contact,histOpts('Has contact','Missing in preserved source'))}
        ${filterField('Booth / space','fBooth',f.booth,histOpts('Has booth / space','Missing in preserved source'))}
        ${filterField('Show cost','fCost',f.cost,histOpts('Has show cost','Missing in preserved source'))}
        ${filterField('Event COM','fCom',f.com,histOpts('Has event COM','Missing in preserved source'))}
        ${filterField('Show-history performance','fPerformance',f.performance,[['ANY','Any'],['HAS','Has show-history performance'],['MISSING','Missing show-history performance']])}
        ${filterField('Payment status','fHistoryPayment',f.historyPayment,histOpts('Has payment status','Missing in preserved source'))}
        ${filterField('Application status','fApplication',f.application,histOpts('Has application status','Missing in preserved source'))}
        ${filterField('COI','fCoi',f.coi,coiOpts)}
        ${filterField('Verified worked evidence','fWorked',f.worked,[['ANY','Any'],['HAS','Has verified worked evidence'],['MISSING','No verified worked evidence']])}
      </div><div class="filterScopeNote">Historical field availability follows the Historical Year filter above. Annual LP and cumulative LP remain independently scoped.</div></div>
      <div class="filterSection"><div class="filterSectionTitle">LeadPerfection availability</div><div class="filterGrid">
        ${filterField('Annual LeadPerfection','fLp',f.lp,opts([['ANY','Any'],['HAS','Has annual LP'],['MISSING','Missing annual LP']],{ANY:fc.total,...fc.flags.has_lp_performance}))}
        ${filterField('Cumulative LeadPerfection','fCumulativeLp',f.cumulativeLp,opts([['ANY','Any'],['HAS','Has cumulative LP'],['MISSING','Missing cumulative LP']],{ANY:fc.total,...fc.flags.has_cumulative_lp_performance}))}
      </div></div>
      <div class="filterSection"><div class="filterSectionTitle">Performance bands</div><div class="filterGrid">
        ${filterField('Lowest preserved COM','fComBand',f.comBand,opts([['ALL','Any COM'],['UNDER5','Under 5%'],['5_10','5% to <10%'],['10_15','10% to <15%'],['15_25','15% to <25%'],['25PLUS','25%+']],{ALL:fc.total,...fc.comBand}))}
        ${filterField('Lifetime net','fLifetimeNetBand',f.lifetimeNetBand,opts([['ALL','Any lifetime net'],['UNDER25K','Under $25K'],['25_100K','$25K to <$100K'],['100_250K','$100K to <$250K'],['250KPLUS','$250K+']],{ALL:fc.total,...fc.lifeBand}))}
      </div></div>
      <div class="filterSection"><div class="filterSectionTitle">Current opportunity / operating linkage</div><div class="filterGrid">
        ${filterField('Current verified booking cost (max)','fOpportunityCostBand',f.currentCostBand,opts([['ALL','Any current-opportunity cost'],['UNDER500','Under $500'],['500_1000','$500 to <$1K'],['1000_2500','$1K to <$2.5K'],['2500_5000','$2.5K to <$5K'],['5000PLUS','$5K+'],['MISSING','No verified maximum']],{ALL:fc.total,...fc.opportunityCostBand}))}
        ${filterField('Current cost status','fOpportunityCostStatus',f.currentCostStatus,opts([['ALL','Any live-opportunity status'],['KNOWN_VERIFIED','Known verified cost'],['QUOTE_REQUIRED','Quote required'],['CONTRACT_REVIEW_REQUIRED','Review current contract'],['RECONCILE_EXISTING','Reconcile existing booking'],['NOT_PUBLISHED_YET','Not published yet'],['NEXT_CYCLE_CLOSED','Next cycle / closed']],fc.opportunityCostStatus))}
        ${filterField('Current commitment status','fOpportunityCommitmentStatus',f.currentCommitmentStatus,opts([['ALL','Any current commitment state'],['VERIFIED_CURRENT','Verified current commitment terms'],['PARTIAL_CURRENT','Partial current commitment terms'],['AGREEMENT_REQUIRED','Agreement / quote terms required'],['RECONCILE_EXISTING','Reconcile existing commitment'],['NOT_PUBLISHED_YET','Commitment terms not published yet'],['NEXT_CYCLE_CLOSED','Next cycle / no current commitment']],fc.opportunityCommitmentStatus))}
        ${filterField('Current placement status','fOpportunityPlacementStatus',f.currentPlacementStatus,opts([['ALL','Any current placement state'],['ASSIGNED_VERIFIED','Assigned / verified'],['LISTED_ASSIGNMENT_UNVERIFIED','Listed / assignment unverified'],['FLOOR_PLAN_AVAILABLE_NOT_SELECTED','Floor plan available / not selected'],['APPLICATION_OPEN_NOT_ASSIGNED','Application open / not assigned'],['CONTRACT_REQUEST_NOT_ASSIGNED','Contract / availability open / not assigned'],['SPONSORSHIP_PLACEMENT_UNVERIFIED','Sponsorship / activation placement unverified'],['PLACEMENT_NOT_PUBLISHED','Placement not published'],['NEXT_CYCLE_CLOSED','Next cycle / no current placement']],fc.opportunityPlacementStatus))}
        ${filterField('Current schedule status','fOpportunityScheduleStatus',f.currentScheduleStatus,opts([['ALL','Any current schedule state'],['VERIFIED_CURRENT','Verified current schedule'],['NOT_PUBLISHED_YET','Hours not published yet'],['CURRENT_SOURCE_HOURS_NOT_RECOVERED','Hours not recovered from current source'],['SOURCE_CONFLICT_REQUIRES_CONFIRMATION','Official source conflict / confirm']],fc.opportunityScheduleStatus))}
        ${filterField('Current logistics status','fOpportunityLogisticsStatus',f.currentLogisticsStatus,opts([['ALL','Any current logistics state'],['VERIFIED_CURRENT','Verified current logistics'],['PARTIAL_CURRENT','Partial current logistics'],['EXHIBITOR_KIT_REQUIRED','Exhibitor kit required'],['PROPOSAL_REQUIRED','Proposal required'],['NOT_PUBLISHED_YET','Logistics not published yet'],['NEXT_CYCLE_CLOSED','Next cycle / logistics unavailable']],fc.opportunityLogisticsStatus))}
        ${filterField('Current event year','fCurrentEventYear',f.currentEventYear,opts([['ALL','Any year'],...currentYears.map(y=>[String(y),String(y)])],{ALL:fc.total,...fc.currentYears}))}
        ${filterField('Current status','fCurrentStatus',f.currentStatus,opts([['ALL','Any status'],['READY','Ready'],['RECONCILE','Reconcile'],['DATE ONLY','Date Only'],['HOLD','Hold'],['OPEN','Open']],{ALL:fc.total,...fc.status}))}
        ${filterField('Current treatment','fCurrentTreatment',f.currentTreatment,opts([['ALL','Any treatment'],['IN PLAY','In Play'],['SKIPPED','Skipped']],{ALL:fc.total,'IN PLAY':fc.treatment.IN_PLAY,SKIPPED:fc.treatment.SKIPPED}))}
        ${filterField('Confirmation','fConfirmation',f.confirmation,opts([['ALL','Any confirmation'],['VERIFIED','Verified'],['PARTIAL','Partial'],['UNVERIFIED','Unverified']],{ALL:fc.total,...fc.confirmation}))}
      </div></div>
      <div class="filterPreview" id="filterPreview" aria-live="polite"></div><div class="filterSheetActions"><button class="btn secondary" id="filterReset">Reset all</button><button class="btn primary" id="filterApply">Apply filters</button></div>`;
  }else{
    const f=state.currentFilters,fc=currentFacetCounts();
    const years=Object.keys(fc.eventYear).map(Number).filter(Number.isFinite).sort((a,b)=>b-a);
    const owners=Object.keys(fc.owner).sort();
    const evidence=Object.keys(fc.evidence).sort();
    const payments=Object.keys(fc.payment).sort();
    const opts=(options,counts)=>countedOptions(options,counts);
    body.innerHTML=`<h2>Filter Current Shows</h2><div class="subtitle">Counts update against your other selections. Apply combines filters and replaces any Quick View.</div>
      <div class="filterSection"><div class="filterSectionTitle">Operating state</div><div class="filterGrid">
        ${filterField('Status','fCurrentStatus',f.status,opts([['ALL','Any status'],['READY','Ready'],['RECONCILE','Reconcile'],['DATE ONLY','Date Only'],['HOLD','Hold'],['OPEN','Open']],{ALL:fc.total,...fc.status}))}
        ${filterField('Treatment','fTreatment',f.treatment,opts([['ALL','All'],['IN PLAY','In Play'],['SKIPPED','Skipped']],{ALL:fc.total,'IN PLAY':fc.treatment.IN_PLAY,SKIPPED:fc.treatment.SKIPPED}))}
        ${filterField('Event year','fEventYear',f.eventYear,opts([['ALL','Any year'],...years.map(y=>[String(y),String(y)])],{ALL:fc.total,...fc.eventYear}))}
        ${filterField('Action timing','fTiming',f.timing,opts([['ALL','Any timing'],['OVERDUE','Overdue'],['NEXT7','Due in next 7 days'],['NO_DATE','No action date'],['FUTURE','More than 7 days']],fc.timing))}
        ${filterField('Confirmation','fCurrentConfirmation',f.confirmation,opts([['ALL','Any confirmation'],['VERIFIED','Verified'],['PARTIAL','Partial'],['UNVERIFIED','Unverified']],{ALL:fc.total,...fc.confirmation}))}
        ${filterField('Owner','fOwner',f.owner,opts([['ALL','Any owner'],...owners.map(v=>[v,v])],{ALL:fc.total,...fc.owner}))}
        ${filterField('Evidence needed','fEvidence',f.evidence,opts([['ALL','Any evidence state'],...evidence.map(v=>[v,v])],{ALL:fc.total,...fc.evidence}))}
        ${filterField('Payment state','fPayment',f.payment,opts([['ALL','Any payment state'],...payments.map(v=>[v,v])],{ALL:fc.total,...fc.payment}))}
        ${filterField('Max booking cost','fCostBand',f.costBand,opts([['ALL','Any cost'],['UNDER500','Under $500'],['500_1000','$500 to <$1K'],['1000_2500','$1K to <$2.5K'],['2500_5000','$2.5K to <$5K'],['5000PLUS','$5K+'],['MISSING','Missing cost']],fc.costBand))}
        ${filterField('Follow-up','fFollowUp',f.followUp,opts([['ANY','Any'],['HAS','Has follow-up'],['MISSING','Missing follow-up']],fc.followUp))}
      </div></div>
      <div class="filterPreview" id="filterPreview" aria-live="polite"></div><div class="filterSheetActions"><button class="btn secondary" id="filterReset">Reset all</button><button class="btn primary" id="filterApply">Apply filters</button></div>`;
  }
  $('#filterModal').classList.add('show');
  $('#filterReset').onclick=resetShowFilters;
  $('#filterApply').onclick=applyShowFilters;
  bindFilterPreview();
}
function applyShowFilters(){
  const activateCleanup=pendingCleanupQueue&&state.showMode==='ALL';
  if(state.showMode==='ALL')state.catalogFilters=draftCatalogFilters();
  else state.currentFilters=draftCurrentFilters();
  state.showQuickView='NONE';
  if(activateCleanup&&state.catalogFilters.historyYear!=='ALL'&&quickViewCount('ALL_MISSING')>0){
    state.showQuickView='ALL_MISSING';
    state.catalogSort='MISSING_DATA';
  }
  pendingCleanupQueue=false;state.catalogLimit=60;closeModal('filterModal');render();
}
function resetShowFilters(){
  pendingCleanupQueue=false;
  if(state.showMode==='ALL')state.catalogFilters=defaultCatalogFilters();
  else state.currentFilters=defaultCurrentFilters();
  state.search='';state.showQuickView='NONE';state.catalogLimit=60;closeModal('filterModal');render();
}
function resetShowView(){
  state.search='';state.showQuickView='NONE';
  if(state.showMode==='ALL'){
    state.catalogFilters=defaultCatalogFilters();
    state.catalogSort='RECOMMENDED';
  }else{
    state.currentFilters=defaultCurrentFilters();
    state.currentSort='BOOKING';
  }
  state.catalogLimit=60;render();
}
function unlinkedLpGroups(){
  const annual=state.unlinkedLp.annual||[],cumulative=state.unlinkedLp.cumulative||[];
  const cumulativeByAnnual=new Map();
  for(const row of cumulative)if(row.annual_evidence_id)cumulativeByAnnual.set(row.annual_evidence_id,row);
  const groups=annual.map(row=>({annual:row,cumulative:cumulativeByAnnual.get(row.evidence_id)||null}));
  for(const row of cumulative)if(!row.annual_evidence_id)groups.push({annual:null,cumulative:row});
  return groups.sort((a,b)=>Number(b.annual?.source_year||b.cumulative?.source_year||0)-Number(a.annual?.source_year||a.cumulative?.source_year||0)||String(a.annual?.source_label||a.cumulative?.source_label||'').localeCompare(String(b.annual?.source_label||b.cumulative?.source_label||'')));
}
function unlinkedLpCategoryLabel(category){
  return ({
    ALL:'All reasons',
    ADMINISTRATIVE_AGGREGATE:'Administrative / aggregate',
    GENERIC_LOCATIONLESS:'Generic / locationless',
    COMPETING_IDENTITY:'Competing identity',
    INSUFFICIENT_IDENTITY:'Insufficient identity',
    CUMULATIVE_ONLY_UNMATCHED:'Cumulative only',
    UNRESOLVED_OTHER:'Other unresolved',
  })[category]||String(category||'Unresolved').replaceAll('_',' ');
}
function unlinkedLpGroupCategory(group){
  return group.annual?.resolution_category||group.cumulative?.resolution_category||'UNRESOLVED_OTHER';
}
function unlinkedLpGroupReason(group){
  return group.annual?.resolution_reason||group.cumulative?.resolution_reason||'Source identity remains unresolved without manufacturing a show profile.';
}
function unlinkedLpSearchText(group){
  const a=group.annual||{},c=group.cumulative||{};
  return [
    a.source_year,c.source_year,a.source_label,c.source_label,a.evidence_id,c.evidence_id,a.match_status,c.match_status,c.comparison_status,
    a.source_fields?.event_name,a.source_fields?.event_dates,a.source_fields?.mapping_note,c.source_fields?.controlled_reconciliation_note,
    a.resolution_category,c.resolution_category,a.resolution_reason,c.resolution_reason,unlinkedLpCategoryLabel(unlinkedLpGroupCategory(group))
  ].join(' ').toLowerCase();
}
function unlinkedAnnualHtml(a){
  if(!a)return '<div class="yearLpEmpty">No annual-period row exists for this cumulative-only source.</div>';
  const f=a.source_fields&&typeof a.source_fields==='object'?a.source_fields:{};
  const url=String(f.source_report_url||'').trim();
  return `<div class="yearLpCard"><div class="yearLpHead"><b>${esc(a.source_label||a.evidence_id)}</b><span>${esc(String(a.match_status||'UNLINKED').replaceAll('_',' '))}</span></div><div class="yearMetricGrid compact"><div><span>Raw</span><b>${esc(f.raw??'—')}</b></div><div><span>Set</span><b>${esc(a.issued??'—')}</b></div><div><span>Issue</span><b>${esc(a.opportunities??'—')}</b></div><div><span>Demo</span><b>${esc(a.demos??'—')}</b></div><div><span>Gross closes</span><b>${esc(a.close_sales_count??'—')}</b></div><div><span>Gross volume</span><b>${money(a.close_sales_volume)}</b></div><div><span>Net closes</span><b>${esc(f.net_close_count??'—')}</b></div><div><span>Net volume</span><b>${f.net_sale_volume==null?'—':money(f.net_sale_volume)}</b></div></div>${f.mapping_note?`<div class="yearVerification">${esc(f.mapping_note)}</div>`:''}<div class="yearVerification">Annual-period source attribution · no governed profile identity asserted · not attendance proof</div>${url?`<div class="actions"><a class="btn secondary sourceBtn" target="_blank" href="${esc(url)}">Open annual report</a></div>`:''}</div>`;
}
function unlinkedCumulativeHtml(c){
  if(!c)return '<div class="yearLpEmpty">No 2012–2026 cumulative row is linked to this annual source.</div>';
  const url=String(c.source_report_url||'').trim(),status=typeof cumulativeLpStatus==='function'?cumulativeLpStatus(c.comparison_status):String(c.comparison_status||'CUMULATIVE ATTRIBUTION').replaceAll('_',' ');
  const note=String(c.source_fields?.controlled_reconciliation_note||'').trim();
  return `<div class="yearLpCard cumulativeLpCard"><div class="yearLpHead"><b>${esc(c.source_label||c.evidence_id)}</b><span>${esc(status)}</span></div><div class="yearMetricGrid compact"><div><span>Raw</span><b>${esc(c.raw_count??'—')}</b></div><div><span>Set</span><b>${esc(c.set_count??'—')}</b></div><div><span>Issue</span><b>${esc(c.issue_count??'—')}</b></div><div><span>Demo</span><b>${esc(c.demo_count??'—')}</b></div><div><span>Gross closes</span><b>${esc(c.gross_close_count??'—')}</b></div><div><span>Gross volume</span><b>${money(c.gross_close_volume)}</b></div><div><span>Net closes</span><b>${esc(c.net_close_count??'—')}</b></div><div><span>Net volume</span><b>${money(c.net_close_volume)}</b></div></div>${note?`<div class="yearVerification">${esc(note)}</div>`:''}<div class="yearVerification">2012–2026 report-period attribution · no governed profile identity asserted · not attendance proof</div>${url?`<div class="actions"><a class="btn secondary sourceBtn" target="_blank" href="${esc(url)}">Open cumulative report</a></div>`:''}</div>`;
}
function unlinkedLpCard(group){
  const a=group.annual,c=group.cumulative,year=Number(a?.source_year||c?.source_year||0),label=a?.source_label||c?.source_label||'Unlinked LeadPerfection source';
  const status=c?.comparison_status?String(c.comparison_status).replaceAll('_',' '):(a?.match_status?String(a.match_status).replaceAll('_',' '):'UNLINKED');
  const category=unlinkedLpGroupCategory(group),categoryLabel=unlinkedLpCategoryLabel(category),reason=unlinkedLpGroupReason(group);
  return `<details class="historyItem unlinkedLpCard"><summary><span><b>${esc(year||'—')}</b> · ${esc(label)}</span><span>${esc(categoryLabel)} · ${esc(status)}</span></summary><div class="historyBody"><div class="historyFlag evidence">UNLINKED SOURCE · ${esc(categoryLabel)}</div><div class="yearVerification"><b>Why unresolved:</b> ${esc(reason)}</div><div class="yearLpSection"><div class="yearSubhead">LeadPerfection annual-period performance</div>${unlinkedAnnualHtml(a)}</div><div class="yearLpSection cumulativeLpSection" style="margin-top:8px"><div class="yearSubhead">LeadPerfection cumulative / lifetime attribution</div>${unlinkedCumulativeHtml(c)}</div><div class="yearVerification">Evidence IDs: ${esc(a?.evidence_id||'—')} · ${esc(c?.evidence_id||'—')}</div></div></details>`;
}
function renderUnlinkedLp(){
  const u=state.unlinkedLp;
  if(u.loading&&!u.loaded)return '<div class="loading">Loading unlinked LeadPerfection evidence…</div>';
  if(u.error&&!u.loaded)return `<div class="alert"><div class="event">Unlinked evidence unavailable</div><div class="action">${esc(u.error)}</div><div class="actions"><button class="btn primary" id="unlinkedRetry">Try again</button></div></div>`;
  if(!u.loaded)return '<div class="loading">Opening unlinked LeadPerfection evidence…</div>';
  const q=String(state.search||'').trim().toLowerCase(),category=String(u.category||'ALL');
  const allGroups=unlinkedLpGroups();
  const categoryGroups=allGroups.filter(g=>category==='ALL'||unlinkedLpGroupCategory(g)===category);
  const groups=categoryGroups.filter(g=>!q||unlinkedLpSearchText(g).includes(q));
  const annualCount=Number(u.summary?.annual_rows||u.annual.length||0),cumulativeCount=Number(u.summary?.cumulative_rows||u.cumulative.length||0),sourceGroups=Number(u.summary?.source_groups||allGroups.length||0);
  const counts=u.summary?.category_counts||{};
  const categories=['ALL','ADMINISTRATIVE_AGGREGATE','GENERIC_LOCATIONLESS','COMPETING_IDENTITY','INSUFFICIENT_IDENTITY','CUMULATIVE_ONLY_UNMATCHED','UNRESOLVED_OTHER'];
  const reasonFilters=`<div class="filterbar modebar">${categories.filter(key=>key==='ALL'||Number(counts[key]||0)>0).map(key=>{const count=key==='ALL'?sourceGroups:Number(counts[key]||0);return `<button class="chip ${category===key?'active':''}" data-unlinked-category="${esc(key)}">${esc(unlinkedLpCategoryLabel(key))} ${count}</button>`}).join('')}</div>`;
  return `<div class="sourceWarn historyIntro"><b>Unlinked LeadPerfection sources are not extra show profiles.</b> These rows are preserved because their source identity could not be linked safely to a governed show profile. Each source now shows its governed unresolved reason; no attendance or show identity is inferred.</div><div class="stats"><div class="stat"><div class="v">${annualCount}</div><div class="l">Annual rows</div></div><div class="stat"><div class="v">${cumulativeCount}</div><div class="l">Cumulative rows</div></div><div class="stat"><div class="v">${sourceGroups}</div><div class="l">Source groups</div></div></div>${reasonFilters}<div class="showTools"><div class="search"><input id="searchInput" placeholder="Search source, reason, year, evidence ID…" value="${esc(state.search)}"></div><div class="resultLine">${groups.length.toLocaleString()} matching source group${groups.length===1?'':'s'}</div></div><div class="historyList">${groups.map(unlinkedLpCard).join('')||'<div class="empty">No unlinked LeadPerfection sources match this reason/search.</div>'}</div>`;
}

function renderCurrentShows(){
  const list=state.shows.filter(currentMatches).slice().sort(currentComparator);
  const board=bookingBoardSummary();
  const intro=`<div class="bookingBoard"><div><span>Priority to book / review</span><b>${board.book}</b></div><div><span>Committed</span><b>${board.committed}</b></div><div><span>Test / negotiate</span><b>${board.test}</b></div><div><span>Watch / gated / next</span><b>${board.watch}</b></div></div><div class="sourceWarn bookingBoardNote"><b>Booking recommendation uses the governed Decision/Tier plus current booking status and dates.</b> Historical sales, COM, costs, and booth evidence remain visible separately; this layer does not overwrite source evidence.</div>`;
  return intro+`${quickViewsBar('CURRENT')}${showTools('CURRENT',list.length)}${list.map(showCard).join('')||'<div class="empty">No current shows match these filters.</div>'}`;
}
function renderShows(){
  const profileCount=Number(state.catalogSummary?.profile_count||state.catalog.length||0),occCount=Number(state.catalogSummary?.occurrence_count||0);
  const unlinkedCount=Number(state.unlinkedLp.summary?.cumulative_rows||0);
  const top=`<div class="hero"><h1>Show database</h1><p>${profileCount||'—'} show profiles · ${occCount||'—'} preserved evidence records · ${state.shows.length} current controls</p></div><div class="filterbar modebar"><button class="chip ${state.showMode==='ALL'?'active':''}" data-show-mode="ALL">All Shows</button><button class="chip ${state.showMode==='CURRENT'?'active':''}" data-show-mode="CURRENT">Current ${state.shows.length}</button><button class="chip ${state.showMode==='UNLINKED'?'active':''}" data-show-mode="UNLINKED">Unlinked LP${unlinkedCount?' '+unlinkedCount:''}</button></div>`;
  if(state.showMode==='CURRENT')return top+renderCurrentShows();
  if(state.showMode==='UNLINKED')return top+renderUnlinkedLp();
  if(state.catalogLoading&&!state.catalogLoaded)return top+'<div class="loading">Loading full show database…</div>';
  if(state.catalogError&&!state.catalogLoaded)return top+`<div class="alert"><div class="event">Full database unavailable</div><div class="action">${esc(state.catalogError)}</div><div class="actions"><button class="btn primary" id="catalogRetry">Try again</button></div></div>`;
  if(!state.catalogLoaded)return top+'<div class="loading">Opening full show database…</div>';
  const list=state.catalog.filter(catalogMatches).slice().sort(catalogComparator);
  const shown=list.slice(0,state.catalogLimit);
  const liveComparisonViews=new Set(['NONE','ALL_LIVE_REBOOK','ALL_RESOLUTION_PARADISE_ACTION','ALL_RESOLUTION_ORGANIZER_RESPONSE','ALL_RESOLUTION_WAIT_PUBLICATION','ALL_RESOLUTION_RECONCILE_EXISTING','ALL_READY_COMMIT','ALL_PREBOOK_REQUIRED','ALL_WATCH_GATED_LIVE','ALL_HOLD_RECONCILE_LIVE','ALL_ACT_NOW','ALL_ACT_LATER','ALL_QUOTE_REQUIRED','ALL_NO_PRIOR_PLACEMENT','ALL_REBOOK_PURSUE','ALL_REBOOK_WATCH']);
  const scopedLiveComparison=state.showQuickView!=='NONE'&&liveComparisonViews.has(state.showQuickView);
  const liveProfiles=scopedLiveComparison
    ?list.filter(p=>Boolean(p?.current_rebook_opportunity))
    :state.catalog.filter(p=>Boolean(p?.current_rebook_opportunity));
  const comparison=liveDecisionCompareBoard(liveProfiles,liveComparisonViews.has(state.showQuickView),String(state.showQuickView||'').startsWith('ALL_RESOLUTION_'));
  return top+quickViewsBar('ALL')+cleanupQueueIntro()+showTools('ALL',list.length)+comparison+`${shown.map(catalogCard).join('')||'<div class="empty">No shows match these filters.</div>'}${shown.length<list.length?`<div class="loadMore"><button class="btn secondary" id="catalogMore">Show ${Math.min(60,list.length-shown.length)} more</button></div>`:''}`;
}
