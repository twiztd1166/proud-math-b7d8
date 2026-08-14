import fs from 'node:fs';

const db=JSON.parse(fs.readFileSync('controlled-register-source.json','utf8'));
if(!db?.meta||!Array.isArray(db.records))throw new Error('Controlled register structure invalid');

const requiredFields=[
  'name','county','jurisdiction','release','hours',
  'hangerRelease','hangerMode','hangerPlacement','hangerMailbox',
  'courtesyRelease','courtesyMode','courtesyPlacement','courtesyHOA','courtesyContent','courtesyBehavior','courtesyFieldAction'
];

const expectedHoursBlockers=[
  'Belle Glade','Boynton Beach','Coral Springs','Indian Rocks Beach','Lakeland','Melbourne',
  'Oldsmar','Pahokee','Port Richey','Rockledge','Safety Harbor','Vero Beach'
].sort();
const expectedCourtesyBlocks=['Deerfield Beach','Port Saint Lucie','Punta Gorda','Vero Beach'].sort();
const expectedNoGo=['Punta Gorda','Tarpon Springs'].sort();

const blank=[];
for(const r of db.records){
  for(const field of requiredFields){
    const value=r?.[field];
    if(value===undefined||value===null||String(value).trim()==='')blank.push(`${r?.name||'(unnamed)'}:${field}`);
  }
}
if(blank.length)throw new Error(`Missing controlled field values (${blank.length}): ${blank.slice(0,20).join(', ')}`);

const hoursBlockers=db.records.filter(r=>String(r.hours).startsWith('HOURS TEXT BLOCKER')).map(r=>r.name).sort();
const courtesyBlocks=db.records.filter(r=>String(r.courtesyFieldAction).includes('COURTESY TEXT BLOCKER')||String(r.courtesyRelease).startsWith('BLOCKED')).map(r=>r.name).sort();
const outsideUniversal=db.records.filter(r=>String(r.courtesyFieldAction).startsWith('OUTSIDE UNIVERSAL STOCK')).map(r=>r.name).sort();
const noGo=db.records.filter(r=>r.release==='NO-GO').map(r=>r.name).sort();

if(db.records.length!==78)throw new Error(`Expected 78 jurisdictions; found ${db.records.length}`);
if(JSON.stringify(hoursBlockers)!==JSON.stringify(expectedHoursBlockers))throw new Error(`Hours blocker set changed. Expected: ${expectedHoursBlockers.join(', ')}. Found: ${hoursBlockers.join(', ')}`);
if(JSON.stringify(courtesyBlocks)!==JSON.stringify(expectedCourtesyBlocks))throw new Error(`Courtesy blocker set changed. Expected: ${expectedCourtesyBlocks.join(', ')}. Found: ${courtesyBlocks.join(', ')}`);
if(outsideUniversal.length!==1||outsideUniversal[0]!=='North Miami Beach')throw new Error(`Expected only North Miami Beach outside universal stock; found ${outsideUniversal.join(', ')}`);
if(JSON.stringify(noGo)!==JSON.stringify(expectedNoGo))throw new Error(`NO-GO set changed. Expected: ${expectedNoGo.join(', ')}. Found: ${noGo.join(', ')}`);

const stableUrl='https://raw.githack.com/twiztd1166/proud-math-b7d8/paradise-canvass-manager-validated/index.html';
if(db.meta.currentAppUrl!==stableUrl)throw new Error(`currentAppUrl drift: ${db.meta.currentAppUrl}`);
if(!String(db.meta.currentCourtesyNoticeUrl||db.meta.courtesyNoticeUrl||'').includes('1vGHFL0aXX0EmV65kPZRrUqs1ONupqRWi'))throw new Error('Current courtesy notice link drift');
if(!String(db.meta.currentMasterPdfUrl||'').includes('1GrHvdIupQiANktfoeC_9aEwnSGlzDOgl'))throw new Error('Current municipality master PDF link drift');
if(!String(db.meta.currentSheetUrl||'').includes('1IuiNXffS7cUOmZbW91IJ5L8J3jz_WX-czfueveIp4t8'))throw new Error('Current controlled Sheet link drift');

const counts={
  records:db.records.length,
  go:db.records.filter(r=>r.release==='GO').length,
  noGo:noGo.length,
  hoursBlockers:hoursBlockers.length,
  courtesyBlocks:courtesyBlocks.length,
  courtesyUsableExcludingNmb:db.records.length-courtesyBlocks.length-outsideUniversal.length,
  outsideUniversalStock:outsideUniversal.length,
  requiredFields:requiredFields.length,
  missingFields:blank.length
};
if(counts.courtesyUsableExcludingNmb!==73)throw new Error(`Expected 73 courtesy-usable service areas excluding NMB; found ${counts.courtesyUsableExcludingNmb}`);

console.log(JSON.stringify({counts,hoursBlockers,courtesyBlocks,outsideUniversal,noGo,currentAppUrl:db.meta.currentAppUrl},null,2));
