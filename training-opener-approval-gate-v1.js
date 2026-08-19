(()=>{
  const lesson=(window.PU_CONTENT?.lessons||[]).find(x=>x.id==='field-opening');
  if(lesson){
    lesson.summary='Learn the structure and delivery of the opening without publishing unapproved exact wording.';
    lesson.learn='Use only the current manager-approved Paradise opening for your route. Paradise University intentionally does not publish an exact canvass opener while current wording approval is pending. Keep the opening brief, identify yourself and Paradise Exteriors, move to the current manager-approved project question, and do not add price, promotions, financing, legal claims, or other unapproved claims. If no current manager-approved opening has been issued for the route, stop and ask your manager before canvassing.';
    lesson.practice='Practice delivery using the current manager-approved opening supplied by your manager. Do not substitute a remembered, historical, or trainer-source script.';
    lesson.pass='Demonstrate the current manager-approved route wording without adding price, promotions, financing, legal claims, or other unapproved claims.';
  }
  const drill=(window.PU_CONTENT?.drills||[]).find(x=>x.id==='opening');
  if(drill)drill.prompt='Deliver the current manager-approved opening at a calm conversational pace. Stop after the first project question and wait for the homeowner.';
  window.PU_OPENER_APPROVAL_GATE_VERSION='2026.08.19-pu-opener-approval-gate-v1';
})();