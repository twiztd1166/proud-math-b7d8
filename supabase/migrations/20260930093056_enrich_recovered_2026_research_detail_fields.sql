with payload(control_id,recovered_cost_text,recovered_attendance_text,recovered_deadline_text) as (
  values
  ('R2026-002-CORAL-SPRINGS-OKTOBERFEST','$100','',''),
('R2026-004-FLORIDA-CREATIVES-PSL','$500','','deadline Sep'),
('R2026-005-GIPA-OKTOBERFEST','$150','',''),
('R2026-006-GACTC-OKTOBERFEST','$275','',''),
('R2026-007-MARTIN-FALL-FEST','$250','',''),
('R2026-008-HOLLYWOOD-HISPANIC','$150','',''),
('R2026-012-PALM-BAY-FARMERS-OCT','$60 · $25','',''),
('R2026-009-SABOR-FEST','$100','',''),
('R2026-014-WAG-O-WEEN','$45','',''),
('R2026-018-JUPITER-HARBOURFEST','$850 · $450 · $750','',''),
('R2026-022-JUPITER-SPOOKTACULAR','$250 · $500 · $750','',''),
('R2026-019-SFL-PICKLE','$500','10,000+ attendance','deadline Oct'),
('R2026-030-DELRAY-KIDSFEST','$500 · $750 · $1,000','',''),
('R2026-033-MOOSE-MELBOURNE','$60','',''),
('R2026-037-WEST-BOYNTON-SENIOR','$395 · $350','',''),
('R2026-040-VERO-DOWNTOWN-FRIDAY','$100 · $65','',''),
('R2026-050-BEN-WINTER','$15,000 · $1,000–$10,000','',''),
('R2026-056-BARK-TITUSVILLE','$40','',''),
('R2026-055-DAY-DEAD','$150–$400','',''),
('R2026-057-NORTH-MIAMI-HEALTH','$300','',''),
('R2026-060-TEQUILA-FEST','$3,000','2,000+ attendees',''),
('R2026-059-TC-BREW-FEST','$275 · $600','2,000+ attendees',''),
('R2026-068-FREEDOM-5K','$250–$2,500 · $250 · $1,000','',''),
('R2026-075-LIGHT-UP-DANIA','$750–$2,250','','deadline'),
('R2026-073-PALM-BAY-FARMERS-NOV','$60 · $25','',''),
('R2026-072-RIVERWALK-FOOD','$1,000 · $2,500 · $5,000','',''),
('R2026-077-SENIOR-POMPANO','$350','',''),
('R2026-079-TURKEY-BASH','$250','',''),
('R2026-081-VERO-HOLIDAY-EXPO','$175','',''),
('R2026-082-RUM-FUZION','$400','',''),
('R2026-083-WORLD-AIDS','$100','',''),
('R2026-093-PB-HOLIDAY-BOAT','$500','',''),
('R2026-090-SPACE-COAST-HOLIDAY-FOOD','$500','',''),
('R2026-101-MUSIC-MANSION','$250','1,200+ attendees',''),
('R2026-100-WESTON-RUN','$500','2,500+ runners/walkers',''),
('R2026-103-MARTIN-WINTER-FEST','$250','',''),
('R2026-109-DELRAY-HOLIDAY-PARADE','$500 · $1,000','',''),
('R2026-113-PALM-BAY-FARMERS-DEC','$60 · $25','',''),
('R2026-107-PALM-BAY-HOLIDAY-MARKET','$60','',''),
('R2026-115-SNOW-PLACE-JUPITER','$750–$3,500','',''),
('R2026-105-TC-HOLIDAY-FOOD','$500','10,000+ attendance','')
)
update public.shows_app_research_calendar_controls r
set details = coalesce(r.details,'{}'::jsonb) ||
  jsonb_strip_nulls(jsonb_build_object(
    'recovered_cost_text', nullif(p.recovered_cost_text,''),
    'recovered_attendance_text', nullif(p.recovered_attendance_text,''),
    'recovered_deadline_text', nullif(p.recovered_deadline_text,'')
  )),
  updated_at=now()
from payload p
where r.control_id=p.control_id;