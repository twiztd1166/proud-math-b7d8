(()=> {
  function calendarMonthNumber(row){
    if(row?.event_start){
      const month=Number(String(row.event_start).slice(5,7));
      if(month>=1&&month<=12)return month;
    }
    const expected=Number(row?.expected_month);
    return expected>=1&&expected<=12?expected:null;
  }

  function calendarYearBar(year){
    return `<div class="filterbar modebar" aria-label="Calendar year">
      <button type="button" class="chip ${year===2026?'active':''}" data-calendar-year="2026">2026 Calendar</button>
      <button type="button" class="chip ${year===2027?'active':''}" data-calendar-year="2027">2027 Calendar</button>
    </div>`;
  }

  function calendar2026Item(row){
    const skipped=row.this_year==='SKIP THIS YEAR'||String(row.decision||'').toUpperCase().startsWith('SKIP');
    const next=String(row.follow_up||'').trim();
    const range=typeof bookingEventRange==='function'
      ?bookingEventRange(row)
      :[date(row.event_start),row.event_end&&row.event_end!==row.event_start?date(row.event_end):''].filter(Boolean).join(' \u2013 ');
    return `<article class="calendarItem">
      <div class="calendarDate"><b>${esc(range)}</b><span>${esc(row.mfc_id||'')}</span></div>
      <div class="calendarMain">
        <div><h3>${esc(row.event||row.mfc_id)}</h3><p>${esc(row.decision||'Decision not stated')}</p></div>
        <span class="badge ${skipped?'hold':badgeClass(row.show_status)}">${esc(skipped?'SKIP':row.show_status||'IN PLAY')}</span>
      </div>
      ${next&&next!=='\u2014'?`<div class="calendarNext"><span>Next</span><b>${esc(next)}</b></div>`:''}
      <button type="button" class="calendarOpen" data-calendar-show="${esc(row.mfc_id)}">Open show</button>
    </article>`;
  }

  function calendar2026OpportunityItem(row){
    const review=row.review||{};
    const disposition=String(review.disposition||'WATCH').toUpperCase();
    const badge=disposition==='PURSUE'?'ready':disposition==='HOLD'?'hold':'dateonly';
    const start=date(row.event_start);
    const end=row.event_end&&row.event_end!==row.event_start?date(row.event_end):'';
    const range=end?start+' \u2013 '+end:start;
    const cost=Number.isFinite(Number(row.booking_cost_min))
      ?(Number(row.booking_cost_min)===Number(row.booking_cost_max)?money(row.booking_cost_min):money(row.booking_cost_min)+' \u2013 '+money(row.booking_cost_max))
      :String(row.current_cost_status||row.opportunity_status||'Live opportunity');
    const next=String(review.next_step||row.action_label||'').trim();
    return `<article class="calendarItem">
      <div class="calendarDate"><b>${esc(range)}</b><span>${esc(row.profile_id||'')}</span></div>
      <div class="calendarMain"><div><h3>${esc(row.event_label||row.profile_id)}</h3><p>${esc(cost)}</p></div><span class="badge ${badge}">${esc(disposition)}</span></div>
      ${next?`<div class="calendarNext"><span>Next</span><b>${esc(next)}</b></div>`:''}
      <button type="button" class="calendarOpen" data-annual-profile="${esc(row.profile_id)}">Open profile</button>
    </article>`;
  }
  function calendar2026ScopeBar(){
    const scope=String(state.calendarScope||'ALL');
    return '<div class="filterbar modebar" aria-label="2026 calendar scope">'+
      '<button type="button" class="chip '+(scope==='ALL'?'active':'')+'" data-calendar-scope="ALL">All</button>'+
      '<button type="button" class="chip '+(scope==='OPERATING'?'active':'')+'" data-calendar-scope="OPERATING">Operating</button>'+
      '<button type="button" class="chip '+(scope==='RESEARCH'?'active':'')+'" data-calendar-scope="RESEARCH">Research</button>'+
      '</div>';
  }

  function calendarResearchItem(row){
    const treatment=String(row.treatment||'WATCH').toUpperCase();
    const badge=treatment==='PURSUE'?'ready':treatment==='VERIFY'?'reconcile':treatment==='WAITLIST'||treatment==='BRANDING'?'hold':'dateonly';
    const start=date(row.event_start);
    const end=row.event_end&&row.event_end!==row.event_start?date(row.event_end):'';
    const range=end?start+' \u2013 '+end:start;
    const note=String(row.notes||'').trim();
    const profile=String(row.profile_id||'').trim();
    return '<article class="calendarItem researchCalendarItem">'+
      '<div class="calendarDate"><b>'+esc(range)+'</b><span>RESEARCH · '+esc(row.priority||'MEDIUM')+'</span></div>'+
      '<div class="calendarMain"><div><h3>'+esc(row.event_label||row.control_id)+'</h3><p>'+esc(row.identity_treatment||'RESEARCH OVERLAY')+'</p></div><span class="badge '+badge+'">'+esc(treatment)+'</span></div>'+
      (note?'<div class="calendarNext"><span>Research</span><b>'+esc(note)+'</b></div>':'')+
      (profile?'<button type="button" class="calendarOpen" data-annual-profile="'+esc(profile)+'">Open profile</button>':'')+
    '</article>';
  }

  function researchCalendarDuplicate(row,showRows,opportunityRows){
    const profile=String(row.profile_id||'').trim();
    if(profile&&opportunityRows.some(item=>String(item.profile_id||'').trim()===profile&&String(item.event_start||'')===String(row.event_start||'')))return true;
    const label=String(row.event_label||'').trim().toLowerCase();
    if(showRows.some(item=>String(item.event_start||'')===String(row.event_start||'')&&String(item.event||'').trim().toLowerCase()===label))return true;
    if(opportunityRows.some(item=>String(item.event_start||'')===String(row.event_start||'')&&String(item.event_label||'').trim().toLowerCase()===label))return true;
    return false;
  }

  function render2026Calendar(){
    const scope=String(state.calendarScope||'ALL');
    const showRows=(state.shows||[])
      .filter(row=>String(row.event_start||'').startsWith('2026-'))
      .slice()
      .sort((a,b)=>String(a.event_start||'9999-12-31').localeCompare(String(b.event_start||'9999-12-31'))||String(a.event||'').localeCompare(String(b.event||'')));
    const opportunityRows=(state.calendarOpportunities||[])
      .filter(row=>String(row.event_start||'').startsWith('2026-'))
      .filter(row=>!showRows.some(show=>String(show.event_start||'')===String(row.event_start||'')&&String(show.event||'').trim().toLowerCase()===String(row.event_label||'').trim().toLowerCase()))
      .slice()
      .sort((a,b)=>String(a.event_start||'9999-12-31').localeCompare(String(b.event_start||'9999-12-31'))||String(a.event_label||'').localeCompare(String(b.event_label||'')));
    const researchRows=(state.researchCalendar||[])
      .filter(row=>Number(row.calendar_year)===2026&&String(row.event_start||'').startsWith('2026-'))
      .filter(row=>!researchCalendarDuplicate(row,showRows,opportunityRows))
      .slice()
      .sort((a,b)=>String(a.event_start||'9999-12-31').localeCompare(String(b.event_start||'9999-12-31'))||String(a.event_label||'').localeCompare(String(b.event_label||'')));
    const visibleShows=scope==='RESEARCH'?[]:showRows;
    const visibleOpportunities=scope==='RESEARCH'?[]:opportunityRows;
    const visibleResearch=scope==='OPERATING'?[]:researchRows;
    const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthHtml=months.map((name,index)=>{
      const month=index+1;
      const monthShows=visibleShows.filter(row=>calendarMonthNumber(row)===month);
      const monthOpportunities=visibleOpportunities.filter(row=>calendarMonthNumber(row)===month);
      const monthResearch=visibleResearch.filter(row=>calendarMonthNumber(row)===month);
      if(!monthShows.length&&!monthOpportunities.length&&!monthResearch.length)return '';
      const activeCount=monthShows.filter(row=>row.this_year!=='SKIP THIS YEAR'&&!String(row.decision||'').toUpperCase().startsWith('SKIP')).length;
      const skipCount=monthShows.length-activeCount;
      const parts=[];
      if(monthShows.length)parts.push(activeCount+' operating'+(skipCount?' · '+skipCount+' skip':''));
      if(monthOpportunities.length)parts.push(monthOpportunities.length+' governed opportunit'+(monthOpportunities.length===1?'y':'ies'));
      if(monthResearch.length)parts.push(monthResearch.length+' research');
      return '<section class="calendarMonth">'+
        '<div class="calendarMonthHead"><div><h2>'+name+'</h2><p>'+parts.join(' · ')+'</p></div></div>'+
        monthShows.map(calendar2026Item).join('')+
        monthOpportunities.map(calendar2026OpportunityItem).join('')+
        monthResearch.map(calendarResearchItem).join('')+
      '</section>';
    }).join('');
    const visibleTotal=visibleShows.length+visibleOpportunities.length+visibleResearch.length;
    return calendarYearBar(2026)+calendar2026ScopeBar()+
      '<div class="hero calendarHero"><div><h1>2026 Calendar</h1><p>Operating controls, verified governed opportunities, and the recovered Q4 research overlay. Research rows preserve the September audit but are not commitments; re-verify current availability and terms before spending.</p></div><button type="button" class="btn secondary" id="calendarOpenCurrent">Open current shows</button></div>'+
      '<div class="calendarStats"><div><b>'+visibleTotal+'</b><span>Visible entries</span></div><div><b>'+(showRows.length+opportunityRows.length)+'</b><span>Operating + governed</span></div><div><b>'+researchRows.length+'</b><span>Research survivors</span></div></div>'+
      (monthHtml||'<div class="empty">No 2026 calendar rows match this view.</div>');
  }

  function calendar2027PursueItem(row){
    const conflict=String(row.conflict_notes||'').trim();
    const next=String(row.next_action||'').trim();
    return `<article class="calendarItem ${conflict?'hasConflict':''}">
      <div class="calendarDate"><b>${esc(annualPlanDateText(row))}</b><span>${esc(row.priority||'MEDIUM')} priority</span></div>
      <div class="calendarMain"><div><h3>${esc(row.occurrence_label||row.canonical_event)}</h3><p>${esc(annualPlanBudgetText(row))}</p></div><span class="calendarDecision pursue">PURSUE</span></div>
      ${conflict?`<div class="calendarConflict"><b>Conflict:</b> ${esc(conflict)}</div>`:''}
      ${next?`<div class="calendarNext"><span>Next</span><b>${esc(next)}</b></div>`:''}
      <button type="button" class="calendarOpen" data-annual-profile="${esc(row.profile_id)}">Open show</button>
    </article>`;
  }

  function render2027Calendar(){
    const p=state.annualPlan;
    if(p.loading&&!p.loaded)return `${calendarYearBar(2027)}<div class="hero"><h1>2027 Calendar</h1><p>Loading the published 2027 plan\u2026</p></div><div class="loading">Loading calendar\u2026</div>`;
    if(p.error&&!p.loaded)return `${calendarYearBar(2027)}<div class="hero"><h1>2027 Calendar</h1><p>Published annual-plan schedule and conflicts.</p></div><div class="alert"><div class="event">Calendar unavailable</div><div class="action">${esc(p.error)}</div><div class="actions"><button class="btn primary" id="annualPlanRetry">Try again</button></div></div>`;
    if(!p.loaded)return `${calendarYearBar(2027)}<div class="loading">Opening 2027 calendar\u2026</div>`;
    const rows=p.rows||[];
    const pursue=rows.filter(row=>row.plan_decision==='PURSUE');
    const watch=rows.filter(row=>row.plan_decision==='WATCH');
    const conflicts=pursue.filter(row=>String(row.conflict_notes||'').trim());
    const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthHtml=months.map((name,index)=>{
      const month=index+1;
      const pursueRows=pursue.filter(row=>calendarMonthNumber(row)===month).slice().sort((a,b)=>annualPlanMonthKey(a).localeCompare(annualPlanMonthKey(b))||String(a.canonical_event||'').localeCompare(String(b.canonical_event||'')));
      const watchCount=watch.filter(row=>calendarMonthNumber(row)===month).length;
      if(!pursueRows.length&&!watchCount)return '';
      const visible=pursueRows.slice(0,10);
      return `<section class="calendarMonth">
        <div class="calendarMonthHead"><div><h2>${name}</h2><p>${pursueRows.length} pursue \u00b7 ${watchCount} watch</p></div></div>
        ${visible.map(calendar2027PursueItem).join('')}
        ${pursueRows.length>visible.length?`<div class="nextStepMore">+${pursueRows.length-visible.length} more PURSUE rows in the full annual plan</div>`:''}
        ${!pursueRows.length&&watchCount?`<div class="calendarWatchOnly">${watchCount} WATCH opportunit${watchCount===1?'y':'ies'} \u00b7 no PURSUE rows scheduled for this month.</div>`:''}
      </section>`;
    }).join('');
    return `${calendarYearBar(2027)}
      <div class="hero calendarHero"><div><h1>2027 Calendar</h1><p>The published annual plan, simplified to the events the team intends to pursue. WATCH opportunities remain counted for awareness.</p></div><button type="button" class="btn secondary" id="calendarOpenPlan">Open full plan</button></div>
      <div class="calendarStats"><div><b>${pursue.length}</b><span>PURSUE</span></div><div><b>${watch.length}</b><span>WATCH</span></div><div><b>${conflicts.length}</b><span>PURSUE conflicts</span></div></div>
      ${monthHtml||'<div class="empty">No dated or estimated 2027 plan rows available.</div>'}`;
  }

  if(typeof window==='undefined')return;
  window.renderCalendarV2=function renderCalendarV2(){
    return Number(state.calendarYear)===2027?render2027Calendar():render2026Calendar();
  };
})();
