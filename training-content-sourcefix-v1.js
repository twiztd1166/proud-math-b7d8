(()=>{
  const base=window.PU_CONTENT;
  if(!base)return;
  const sources={...(base.sources||{}),
    daveFive:{title:'Dave Yoho — The Five Commitments',authority:'REFERENCE',url:'https://drive.google.com/file/d/1Au1PhatdFIG84Azy8LiNXh0QLnjLSuIs/view?usp=drivesdk'},
    tonyAudioRoot:{title:'Tony Hoty — Canvassing Audio Library',authority:'REFERENCE',url:'https://drive.google.com/drive/folders/1QJbK__x4P-8Ze_8j1dZo2rknW_LH5kjZ'}
  };
  const keep=(base.media||[]).filter(x=>!['tony-audio-training','tony-multiproduct-set'].includes(x.id));
  const verifiedTony=[
    {id:'tony-welcome-onboarding',trainer:'Tony Hoty',title:'Canvassing Welcome Onboarding',type:'audio',authority:'REFERENCE',priority:'GO_DEEPER',topics:['onboarding','mindset','canvassing'],url:'https://drive.google.com/file/d/1UoiQtvSx-85qJ4sbC2AegpEFF8ZRqGfC/view?usp=drivesdk',note:'Verified Tony source. Use for orientation and field mindset; current Paradise training and field rules control.'},
    {id:'tony-canvassing-101',trainer:'Tony Hoty',title:'Canvassing 101',type:'audio',authority:'REFERENCE',priority:'ESSENTIAL',topics:['canvassing','opening','field-rhythm'],url:'https://drive.google.com/file/d/1Z8wIrTrULa1g3In7_ucINtNZTV0eWczk/view?usp=drivesdk',note:'Verified Tony source. Learn conversation architecture and field rhythm; do not copy legacy claims, hours, promotions, or legal statements.'},
    {id:'tony-new-canvasser-process',trainer:'Tony Hoty',title:'New Canvasser Training — Process',type:'audio',authority:'REFERENCE',priority:'ESSENTIAL',topics:['onboarding','process','canvassing'],url:'https://drive.google.com/file/d/12hnKxDUE0nOO5kv_FuBb9fahiFGX4wty/view?usp=drivesdk',note:'Verified Tony source. Use the process concepts only; current Paradise route and compliance instructions control.'},
    {id:'tony-10-step-canvassing',trainer:'Tony Hoty',title:'10 Step Canvassing Approach',type:'audio',authority:'HISTORICAL',priority:'GO_DEEPER',topics:['opening','conversation','appointment'],url:'https://drive.google.com/file/d/1TKWzlPeTf7gxJ-M5gn9_PsEAUxg7QpPD/view?usp=drivesdk',note:'Verified historical Tony source. Use the conversation architecture; do not treat the exact legacy script or claims as Paradise policy.'},
    {id:'tony-canvass-set',trainer:'Tony Hoty',title:'Canvass Set',type:'audio',authority:'HISTORICAL',priority:'GO_DEEPER',topics:['appointment','conversation','close'],url:'https://drive.google.com/file/d/1fb4c-L2vJQF9isWRyoUDtPd76rvVr9fh/view?usp=drivesdk',note:'Verified historical Tony sound bite. Use as a coaching example only; Paradise-approved wording controls.'}
  ];
  const media=[...keep,...verifiedTony];
  const lessons=(base.lessons||[]).map(x=>{
    let y={...x,media:[...(x.media||[])],sources:[...(x.sources||[])]};
    if(y.id==='foundation-welcome')y.media=['tony-welcome-onboarding'];
    if(y.id==='field-prepare')y.media=['tony-new-canvasser-process','tony-canvassing-101'];
    if(y.id==='field-opening')y.media=['tony-10-step-canvassing','tony-canvass-set','grosso-tonality-audio'];
    if(y.id==='canvass-core-objections')y.media=['grosso-objections-audio','tony-canvassing-101'];
    if(y.id==='canvass-five-commitments'&&!y.sources.includes('daveFive'))y.sources=[...y.sources,'daveFive'];
    return y;
  });
  window.PU_CONTENT=Object.freeze({...base,version:'2026.08.16-pu-v1-content-2',sources,media,lessons});
})();
