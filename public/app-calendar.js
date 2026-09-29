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

  function render2026Calendar(){
    const rows=(state.shows||[])
      .filter(row=>String(row.event_start||'').startsWith('2026-'))
      .slice()
      .sort((a,b)=>String(a.event_start||'9999-12-31').localeCompare(String(b.event_start||'9999-12-31'))||String(a.event||'').localeCompare(String(b.event||'')));
    const active=rows.filter(row=>row.this_year!=='SKIP THIS YEAR'&&!String(row.decision||'').toUpperCase().startsWith('SKIP'));
    const skipped=rows.filter(row=>!active.includes(row));
    const today=new Date().toISOString().slice(0,10);
    const upcoming=active.filter(row=>String(row.event_end||row.event_start||'')>=today);
    const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthHtml=months.map((name,index)=>{
      const month=index+1;
      const monthRows=rows.filter(row=>calendarMonthNumber(row)===month);
      if(!monthRows.length)return '';
      const activeCount=monthRows.filter(row=>row.this_year!=='SKIP THIS YEAR'&&!String(row.decision||'').toUpperCase().startsWith('SKIP')).length;
      const skipCount=monthRows.length-activeCount;
      return `<section class="calendarMonth">
        <div class="calendarMonthHead"><div><h2>${name}</h2><p>${activeCount} in play${skipCount?' \u00b7 '+skipCount+' skip':''}</p></div></div>
        ${monthRows.map(calendar2026Item).join('')}
      </section>`;
    }).join('');
    return `${calendarYearBar(2026)}
      <div class="hero calendarHero"><div><h1>2026 Calendar</h1><p>The governed 2026 operating calendar from the current show controls, including completed, upcoming, and explicitly skipped events.</p></div><button type="button" class="btn secondary" id="calendarOpenCurrent">Open current shows</button></div>
      <div class="calendarStats"><div><b>${rows.length}</b><span>Dated events</span></div><div><b>${active.length}</b><span>In play</span></div><div><b>${upcoming.length}</b><span>Upcoming</span></div></div>
      ${monthHtml||'<div class="empty">No governed 2026 dated show records are available.</div>'}`;
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
