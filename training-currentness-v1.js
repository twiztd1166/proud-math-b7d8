(()=>{
  const pu=window.PU_CONTENT;
  if(!pu)return;

  const currentPolicy=pu.sources?.paradiseSalesPolicy2026;
  if(!currentPolicy)throw new Error('Paradise 2026 sales policy source missing before currentness hardening');

  const opening=(pu.lessons||[]).find(x=>x.id==='field-opening');
  if(opening){
    opening.approvalStatus='PENDING_CURRENT_APPROVAL';
    opening.learn='Candidate opener for current Paradise review: “I’m not here to sell you anything. I’m [Name] with Paradise Exteriors. We’re doing some work here in the neighborhood. Quick question—have you ever gotten an estimate to replace your [windows / doors / roof]?” Paradise used the core wording in its May 23, 2025 internal canvass training, but this audit did not recover a newer 2026 canvass source approving the exact words. Do not treat this candidate wording as current field authority until a named Paradise manager/compliance reviewer approves it or supplies the replacement. In the field, use only the current manager-approved opening. If the current route specifically allows an installation-day courtesy notice, use only the current approved courtesy-notice wording and never claim you are distributing notices where the live municipality screen says not to use them.';
    opening.practice='Practice pace, distance, tonality, and the transition to the first project question using the current manager-approved canvass opening. For curriculum review, compare the 2025-derived candidate wording above and record APPROVE or REVISE.';
    opening.pass='Use only the current manager-approved route-appropriate opening in the field. The 2025-derived candidate wording does not become approved merely by completing this lesson.';
  }

  const appointmentQa=(pu.managerLessons||[]).find(x=>x.id==='manager-appointment-qa');
  if(appointmentQa){
    appointmentQa.learn='Review homeowner/property identity, project type and scope, reason for interest, time, contact information, required household details, expectations, and notes. Current Paradise 2026 Sales Representative policy defines “Missing Parties” as one or more homeowners or decision makers not being present for the appointment and gives the sales/Dispatch response for that condition. For canvass appointment QA, identify whether required homeowners/decision makers are expected to be available and record the facts accurately. Do not turn this rule into a blanket “spouse must be present” requirement when that is not the actual decision-maker situation. Also look for vague project reasons, bad phone data, or appointments where the resident never understood the visit. Coach the upstream behavior that created the defect.';
    appointmentQa.practice='Audit three sample appointments. Identify any Missing Parties issue using the current 2026 definition—one or more homeowners or decision makers not present—then classify each appointment as strong, coachable, or invalid based on the facts provided.';
    appointmentQa.pass='Manager can identify missing appointment information, correctly recognize a Missing Parties condition without inventing a universal spouse rule, and identify the field behavior that needs correction.';
    appointmentQa.sources=[...new Set([...(appointmentQa.sources||[]),'paradiseSalesPolicy2026'])];
    appointmentQa.currentPolicyStatus='SUPPORTED_2026_MISSING_PARTIES';
  }

  const baseLesson=puLesson;
  puLesson=function(id){
    baseLesson(id);
    if(id!=='field-opening'||view!=='training')return;
    const authority=M.querySelector('.puAuthority');
    if(authority)authority.innerHTML='<span class="puBadge reference">CURRENT APPROVAL PENDING</span><small>2025 Paradise precedent · exact 2026 operating wording requires named manager/compliance approval before field use.</small>';
    if(authority&&!M.querySelector('.puOpeningApprovalNotice')){
      const notice=document.createElement('div');
      notice.className='puNotice puOpeningApprovalNotice';
      notice.innerHTML='<b>Do not deploy this candidate script yet:</b> Practice the delivery mechanics, but use only the current manager-approved canvass opening in the field until this exact wording is approved or replaced.';
      authority.insertAdjacentElement('afterend',notice);
    }
  };

  window.PU_CURRENTNESS_VERSION='2026.08.16-pu-currentness-v1';
  window.PU_MISSING_PARTIES_POLICY_STATUS='SUPPORTED_BY_2026_PARADISE_POLICY';
  window.PU_OPENING_APPROVAL_STATUS='PENDING_CURRENT_HUMAN_APPROVAL';
})();