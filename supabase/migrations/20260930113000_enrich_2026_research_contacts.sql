-- Repair missing 2026 research-show contact routes from current official/organizer sources.
-- Guarded: expected visible research universe remains 117 and exactly 49 rows still have NOT VERIFIED contacts.

do $$
declare
  visible_count integer;
  missing_count integer;
begin
  select count(*) into visible_count
  from public.shows_app_research_calendar_controls
  where active=true and calendar_visibility=true and plan_year=2026;

  select count(*) into missing_count
  from public.shows_app_research_calendar_controls
  where active=true and calendar_visibility=true and plan_year=2026
    and upper(coalesce(detail_data->>'contact_status',''))='NOT VERIFIED';

  if visible_count <> 117 then
    raise exception 'Expected 117 visible 2026 research controls; found %', visible_count;
  end if;
  if missing_count <> 49 then
    raise exception 'Expected 49 NOT VERIFIED contacts before repair; found %', missing_count;
  end if;
end $$;

with contact_updates(control_id,contact_status,contact_text,source_url,source_title) as (
  values
    ('R2026-004-FLORIDA-CREATIVES-PSL','CURRENT APPLICATION VERIFIED','Battle Bros Events · Vendors@BattleBrosEvents.com','https://www.eventeny.com/events/vendor/?id=50951','Florida Creatives Market 2026 PSL — Sponsor Vendor application'),
    ('R2026-003-PSL-OKTOBERFEST','CURRENT OFFICIAL VERIFIED','Special Events Department · specialevents@cityofpsl.com · 772-344-4139','https://www.cityofpsl.com/Events/Special-Events/Oktoberfest','Port St. Lucie Oktoberfest — official event'),
    ('R2026-006-GACTC-OKTOBERFEST','CURRENT OFFICIAL VERIFIED','Uta McFadden, President · GACTreasureCoast@gmail.com · 772-877-3306','https://www.gactc.org/blank-2','German American Club of the Treasure Coast — official contact'),
    ('R2026-007-MARTIN-FALL-FEST','CURRENT OFFICIAL VERIFIED','Martin County Parks & Recreation · events@martin.fl.us · 772-221-1430','https://www.martin.fl.us/PRDEvents','Martin County Parks & Recreation Special Events'),
    ('R2026-025-BOYNTON-FALL','CURRENT OFFICIAL VERIFIED','City of Boynton Beach Events · events@bbfl.us · 561-742-6024','https://boynton-beach.org/m/newsflash/home/detail/274','City of Boynton Beach Events Department — current official contact'),
    ('R2026-024-POMPANO-CARIBBEAN','CURRENT OFFICIAL','Pompano Beach Parks & Recreation · Parks@copbfl.com · 954-786-4111','https://www.pompanobeachfl.gov/events/pompano-caribbean-fest','Pompano Caribbean Fest — official City event'),
    ('R2026-027-SPOOKYVILLE','CURRENT OFFICIAL VERIFIED','Lorie Stinson · lorie@southfloridafair.com · 561-790-5245','https://www.southfloridafair.com/p/yesteryear/events/spookyville-in-yesteryear-village','Spookyville — South Florida Fair official'),
    ('R2026-029-RPB-ROCK-N-FALL','CURRENT ORGANIZER CONTACT','Kathy Gilbert · info@pottcevents.com · 561-792-9260','https://www.pottcevents.com/contact-us.html','POTTC Events — current organizer contact'),
    ('R2026-030-DELRAY-KIDSFEST','CURRENT OFFICIAL VERIFIED','Delray Beach Special Events · espinosan@mydelraybeach.com · 561-243-7250 option 3','https://www.delraybeachfl.gov/government/city-departments/parks-and-recreation/special-events-sponsorship-opportunities','Delray Beach Special Events sponsorship contact'),
    ('R2026-034-IRL-SCIENCE','CURRENT OFFICIAL VERIFIED','Jennifer Sneed · info@irlsciencefest.org · 772-462-0988','https://irlsciencefest.org/press/','Indian River Lagoon Science Festival — official contact'),
    ('R2026-033-MOOSE-MELBOURNE','CURRENT APPLICATION VERIFIED','Moose Lodge 1406 Events · mooselodge1406events@gmail.com','https://www.eventeny.com/events/vendor/?id=53128','Moose Lodge 1406 Fall Art & Craft Fair — current vendor application'),
    ('R2026-036-PALM-BAY-SENIOR','CURRENT ORGANIZER CONTACT','Chris Grier · vendor@gpbsc.net · 321-724-1338','https://gpbsac.org/wp-content/uploads/2025/12/January-2026-newsletter-Final.pdf','Greater Palm Bay Senior Activity Center — January 2026 newsletter'),
    ('R2026-041-PSL-FALL-FUN','CURRENT OFFICIAL VERIFIED','Special Events Department · specialevents@cityofpsl.com · 772-344-4139','https://www.cityofpsl.com/Events/Special-Events/Fall-Fun-Fest','Port St. Lucie Fall Fun Fest — official event'),
    ('R2026-047-COCOA-FALL','CURRENT OFFICIAL VERIFIED','Cocoa Leisure Services · nharris@cocoafl.gov · 321-635-7702','https://www.choosecocoa.org/Calendar.aspx?EID=6347&calType=0&day=6&month=9&year=2026','Cocoa Fall Festival — official City calendar'),
    ('R2026-045-HALLANDALE-HALLOWEEN','CURRENT OFFICIAL','Hallandale Beach Parks, Recreation & Open Spaces · HBParksRec@coHB.org · 954-457-1452','https://hallandalebeachfl.gov/m/directory','Hallandale Beach — official department directory'),
    ('R2026-042-LAGOONFEST','CURRENT OFFICIAL VERIFIED','Leanne Griffith · leanne@festivalmanagementgroup.com · 561-441-4245','https://www.thepalmbeaches.com/wp-content/uploads/2026-LagoonFest-Sponsorship-Deck.pdf','LagoonFest 2026 — official sponsor deck'),
    ('R2026-048-VERO-HALLOWEEN','CURRENT OFFICIAL VERIFIED','Laurie Lee · 772-978-4500; Jeff Matthews · 772-978-4520','https://www.covb.org/DocumentCenter/View/9057/2026-COVB-Recreation-Program-Guide-PDF','Vero Beach 2026 Recreation Program Guide'),
    ('R2026-044-WICKED-MANORS','CURRENT OFFICIAL','Rebecca D’Amico, Director of Development · RDAmico@PrideCenterFlorida.org · 954-463-9005 ext. 105','https://glccsf.pridecenterflorida.org/get-involved/membership/','Pride Center — current business partnership contact'),
    ('R2026-050-BEN-WINTER','CURRENT OFFICIAL VERIFIED','Michael Dutton, Director of Sales & Marketing · michael.dutton@TheBenWestPalm.com · 561-655-4001','https://www.thebenwestpalm.com/partner-with-the-bens-winter-wonderland-ice-rink/','The Ben Winter Wonderland — partnership page'),
    ('R2026-053-DREAM-ASIA','CURRENT OFFICIAL','Dream Asia business development · bizdev@festiveplanet.us; general · customersupport@dreamasiafest.com','https://www.dreamasiafest.com/about','Dream Asia Festival — official site'),
    ('R2026-056-BARK-TITUSVILLE','CURRENT OFFICIAL','SPCA of Brevard · spcamedia@spcabrevard.com · 321-567-3615','https://www.spcabrevard.com/contact','SPCA of Brevard — current contact'),
    ('R2026-054-CARIFEST','CURRENT ORGANIZER CONTACT','Caribbean American Cultural Group · cacginc1984@yahoo.com · 772-834-2522','https://www.cacgpsl.org/members','Caribbean American Cultural Group — current contact'),
    ('R2026-058-MIAMI-FOOD-WINE','CURRENT OFFICIAL VERIFIED','Festival team · info@miamidadefoodwine.com · 561-955-0913','https://miamidadefoodwine.com/contact','Miami-Dade Food Wine Beer Culture Festival — contact'),
    ('R2026-060-TEQUILA-FEST','CURRENT APPLICATION VERIFIED','Joe / True Hospitality Creative · Joe@TrueHospitalityCreative.com','https://www.eventeny.com/events/vendor/?id=43890','The Tequila Fest — current vendor application'),
    ('R2026-059-TC-BREW-FEST','CURRENT OFFICIAL VERIFIED','Treasure Coast Brewmasters · tcbrewmasters@gmail.com','https://www.tcbrewmasters.org/events/tc-brew-fest','Treasure Coast Brewfest — official 2026 page'),
    ('R2026-063-SENIOR-HARDROCK','CURRENT APPLICATION VERIFIED','Drew / Expo Media · drew@retirement-times.com · 754-246-2874','https://retirement-times.com/wp-content/uploads/2026/01/SEContracts-2026-HealthFairs-FILLABLE.pdf','Expo Media — 2026 Senior Expo vendor application'),
    ('R2026-064-PSL-RIVER-NIGHTS-NOV','CURRENT OFFICIAL VERIFIED','Special Events Department · specialevents@cityofpsl.com · 772-344-4139','https://www.cityofpsl.com/Events/Special-Events/River-Nights','Port St. Lucie River Nights — official event'),
    ('R2026-067-FESTIVAL-GIVING','CURRENT OFFICIAL VERIFIED','Festival of Giving · festivalofgiving@childrensmuseumtc.org · 772-225-7575 ext. 205','https://www.childrensmuseumtc.org/festival-of-giving-2026','Festival of Giving 2026 — official page'),
    ('R2026-068-FREEDOM-5K','CURRENT OFFICIAL','Official RunSignup Race Director contact form · Freedom Isn''t Free Run 5K','https://runsignup.com/Race/Info/FL/PortSaintLucie/FreedomIsnTFreeRun5K','Freedom Isn''t Free Run 5K — official 2026 RunSignup page'),
    ('R2026-071-HOLIDAY-SHOPPING-WPB','CURRENT ORGANIZER CONTACT','Kathy Gilbert · info@pottcevents.com · 561-792-9260','https://www.pottcevents.com/contact-us.html','POTTC Events — current organizer contact'),
    ('R2026-075-LIGHT-UP-DANIA','CURRENT APPLICATION VERIFIED','Dania Beach Special Events · dbspecialevents@daniabeachfl.gov · 954-924-6800 ext. 3780','https://www.eventeny.com/events/vendor/?id=52519','Light Up Dania Beach — current vendor application'),
    ('R2026-073-PALM-BAY-FARMERS-NOV','CURRENT OFFICIAL','Palm Bay Farmers Market · palmbayfarmersmarket@gmail.com','https://www.eventeny.com/events/pumpkins-palms-market-32182/','Palm Bay Farmers Market organizer — current event route'),
    ('R2026-069-PICK-PADDLE-PLAY','CURRENT OFFICIAL VERIFIED','Roger · roger@stabilizerevitalizefortpierce.org · 248-640-9711','https://www.stabilizerevitalizefortpierce.org/pick-paddle-and-play-beach-jam','Pick, Paddle & Play Beach Jam — official page'),
    ('R2026-078-HOLLYWOOD-TREE','CURRENT OFFICIAL VERIFIED','City of Hollywood Cultural Arts · Events@HollywoodFL.org · 954-921-3404','https://www.hollywoodfl.org/1360/Events-Cultural-Arts','City of Hollywood Events & Cultural Arts — official contact'),
    ('R2026-079-TURKEY-BASH','CURRENT OFFICIAL VERIFIED','Turkey Bash · jake@turkey-bash.com','https://turkey-bash.com/sponsors/','Turkey Bash — sponsor contact'),
    ('R2026-082-RUM-FUZION','CURRENT OFFICIAL VERIFIED','Rum Fuzion · info@rumfuzion.com','https://rumfuzion.com/','Rum Fuzion — official vendor/contact page'),
    ('R2026-083-WORLD-AIDS','CURRENT APPLICATION VERIFIED','CAN Community Health sponsorships · sponsorships@cancommunityhealth.org','https://www.eventeny.com/events/sponsor/application/?a=xmrxlqlf-25291','World AIDS Day Concert 2026 — sponsor application'),
    ('R2026-085-DELRAY-TREE','CURRENT OFFICIAL VERIFIED','Delray Beach Special Events sponsorship · espinosan@mydelraybeach.com · 561-243-7250 option 3; Tree information · BeardsleyD@MyDelrayBeach.com','https://www.delraybeachfl.gov/government/city-departments/parks-and-recreation/special-events-sponsorship-opportunities','Delray Beach Special Events sponsorship contact'),
    ('R2026-086-WPB-HOLIDAY-PARADISE','CURRENT OFFICIAL VERIFIED','Cinde Martin, City sponsorship · cindemartin@comcast.net · 561-676-1842; Community Events · events@wpb.org · 561-822-1515','https://www.wpb.org/Residents/Community-Events/Events','West Palm Beach Community Events — sponsorship contact'),
    ('R2026-088-HALLANDALE-HOLIDAY','CURRENT OFFICIAL','Hallandale Beach Parks, Recreation & Open Spaces · HBParksRec@coHB.org · 954-457-1452','https://hallandalebeachfl.gov/m/directory','Hallandale Beach — official department directory'),
    ('R2026-095-HOWARD-ALAN-DELRAY','CURRENT OFFICIAL','Howard Alan Events · info@artfestival.com · 561-746-6615','https://www.zapplication.org/event-info.php?ID=14527','Howard Alan Downtown Delray Art Festival — current event listing'),
    ('R2026-098-MELBOURNE-HOLIDAY-ART','CURRENT ORGANIZER CONTACT','Moose Lodge 1406 Events · mooselodge1406events@gmail.com','https://www.eventeny.com/events/vendor/?id=53128','Moose Lodge 1406 — current organizer contact'),
    ('R2026-093-PB-HOLIDAY-BOAT','CURRENT OFFICIAL VERIFIED','Marine Industries Association of Palm Beach County · info@marinepbc.org · 561-863-0012','https://members.marinepbc.org/contact-us','MIAPBC — current official contact'),
    ('R2026-092-WPB-BEER-WINE','CURRENT ORGANIZER CONTACT','Evan Berman · evan@evanbermanproductions.com · 631-807-8494','https://www.fortlauderdale.gov/home/showpublisheddocument/88140/638769468495800000','2026 public special-event applicant record — Evan Berman Productions'),
    ('R2026-101-MUSIC-MANSION','CURRENT OFFICIAL VERIFIED','Martin County Parks & Recreation · events@martin.fl.us · 772-221-1430','https://www.martin.fl.us/PRDEvents','Martin County Parks & Recreation Special Events'),
    ('R2026-102-PSL-RIVER-NIGHTS-DEC','CURRENT OFFICIAL VERIFIED','Special Events Department · specialevents@cityofpsl.com · 772-344-4139','https://www.cityofpsl.com/Events/Special-Events/River-Nights','Port St. Lucie River Nights — official event'),
    ('R2026-109-DELRAY-HOLIDAY-PARADE','CURRENT OFFICIAL VERIFIED','Delray Beach Special Events · espinosan@mydelraybeach.com · 561-243-7250 option 3','https://www.delraybeachfl.gov/government/city-departments/parks-and-recreation/special-events-sponsorship-opportunities','Delray Beach Special Events sponsorship contact'),
    ('R2026-115-SNOW-PLACE-JUPITER','CURRENT OFFICIAL VERIFIED','Kate Pokorny · katep@jupiter.fl.us · 561-741-2365','https://www.jupiter.fl.us/FormCenter/Town-Manager-7/Town-of-Jupiter-Sponsorship-Agreement-20-570','Town of Jupiter 2026 sponsorship agreement'),
    ('R2026-114-WELLINGTON-HOLIDAY-PARADE','CURRENT OFFICIAL VERIFIED','Jenifer Brito · jbrito@wellingtonfl.gov · 561-753-2476; Ian Williams · iwilliams@wellingtonfl.gov · 561-868-8624','https://www.wellingtonfl.gov/723/Holiday-Parade','Wellington Holiday Parade — official 2026 page')
),
updated as (
  update public.shows_app_research_calendar_controls r
  set
    detail_data = jsonb_set(
      jsonb_set(coalesce(r.detail_data,'{}'::jsonb), '{contact_status}', to_jsonb(c.contact_status), true),
      '{contact_text}', to_jsonb(c.contact_text), true
    ),
    source_refs = case
      when exists (
        select 1
        from jsonb_array_elements(coalesce(r.source_refs,'[]'::jsonb)) e
        where e->>'url'=c.source_url
      ) then coalesce(r.source_refs,'[]'::jsonb)
      else coalesce(r.source_refs,'[]'::jsonb) ||
        jsonb_build_array(jsonb_build_object(
          'url',c.source_url,
          'title',c.source_title,
          'checked_at','2026-09-30'
        ))
    end,
    updated_at = now()
  from contact_updates c
  where r.control_id=c.control_id
    and r.active=true
    and r.calendar_visibility=true
    and r.plan_year=2026
    and upper(coalesce(r.detail_data->>'contact_status',''))='NOT VERIFIED'
  returning r.control_id
)
select case when count(*)=49 then 1 else (1/0) end as updated_exactly_49
from updated;

do $$
declare
  visible_count integer;
  missing_count integer;
  blank_count integer;
begin
  select count(*) into visible_count
  from public.shows_app_research_calendar_controls
  where active=true and calendar_visibility=true and plan_year=2026;

  select count(*) into missing_count
  from public.shows_app_research_calendar_controls
  where active=true and calendar_visibility=true and plan_year=2026
    and upper(coalesce(detail_data->>'contact_status',''))='NOT VERIFIED';

  select count(*) into blank_count
  from public.shows_app_research_calendar_controls
  where active=true and calendar_visibility=true and plan_year=2026
    and nullif(trim(coalesce(detail_data->>'contact_text','')),'') is null;

  if visible_count <> 117 then
    raise exception 'Visible research universe changed unexpectedly: %', visible_count;
  end if;
  if missing_count <> 0 then
    raise exception 'Contact repair incomplete; % rows remain NOT VERIFIED', missing_count;
  end if;
  if blank_count <> 0 then
    raise exception 'Contact repair left % blank contact_text rows', blank_count;
  end if;
end $$;
