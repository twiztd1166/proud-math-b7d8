# Paradise University v1 — Implementation Specification

Status: BUILD CONTRACT — WORKING BRANCH ONLY  
Branch: `agent/paradise-university-v1`  
Base: validated app commit `5e7efc40de524bef0e63c76595c3c518925888b9`  
Validated app baseline: `2026.08.14-v3.12`  
Jurisdiction dataset baseline SHA-256: `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`  
Records: 78  
GO: 76  
NO-GO: 2 — Punta Gorda, Tarpon Springs  

## 1. Non-negotiable build boundary

Paradise University is an additive training layer. It must not change, reinterpret, reorder, weaken, or bypass the current municipality lookup, jurisdiction data, GO/NO-GO logic, hours, literature placement rules, courtesy-notice rules, permit/permission scripts, refusal rules, release controls, provenance controls, or existing safety guards.

The live municipality result always overrides generic training examples.

Training content and source/reference content are separate authority classes:

- `PARADISE_APPROVED` — current Paradise training language.
- `REFERENCE` — useful source training that does not itself control Paradise operations.
- `HISTORICAL` — legacy or superseded material preserved for study only.

Tony Hoty, Dave Yoho, Rick Grosso/Grosso University, historical Paradise material, masterclasses, source audio/video, and transcripts must never visually appear as current Paradise policy unless rewritten and explicitly classified `PARADISE_APPROVED`.

## 2. Employee-facing architecture — keep it simple

The Training home screen has only five primary actions:

1. **Continue Training**
2. **Practice**
3. **Career Path**
4. **Videos & Audio**
5. **My Progress**

A secondary **More** area contains:

- Search Training
- Manager Training
- Source Library
- Reference Documents

Do not expose internal content IDs, manifests, source-authority metadata, version numbers, schema fields, or governance controls to ordinary users unless they open an advanced source/details view.

## 3. Career progression

Primary path:

`Foundation → Field Ready → Certified Canvasser → Senior Canvasser → Sales Apprentice → Sales Rep Trainee → Certified Sales Rep`

Leadership branch:

`Senior Canvasser → Canvass Manager Academy → Certified Canvass Manager`

All sections are viewable by everyone. Progression is guidance and certification, not permissions.

Each stage may display one of:

- REQUIRED NOW
- NEXT
- ADVANCED
- REFERENCE

Do not hard-lock advanced content in v1.

## 4. Lesson experience

Every normal lesson follows one consistent sequence:

1. **Learn** — short Paradise-approved explanation.
2. **Watch / Listen** — best relevant media item or clip.
3. **Practice** — one exercise or scenario.
4. **Pass** — short quiz or manager demonstration requirement.
5. **Next Lesson** — single obvious next action.

Optional advanced controls:

- Go Deeper
- Transcript
- Source
- Bookmark

A user should not need to understand a curriculum tree to continue training.

## 5. Canvasser curriculum

### Foundation

- Welcome to Paradise
- Career path
- Professional conduct
- Compliance foundation
- Products 101 — windows, doors, roofing
- How canvassing fits the lead → appointment → demo → sale → install journey
- Core terminology

### Field Ready

- Your job at the door
- Municipality lookup
- GO / conditional / NO-GO
- Hours and special conditions
- Door hanger / courtesy notice / handoff / non-affixed / consent-only / no-literature distinctions
- Preparation before the route
- Door approach and first impression
- Paradise opening
- Tonality and body language
- Clear refusal / hard-stop rules
- HOA / security / permit / police / code-enforcement scenarios
- Field Ready test

### Certified Canvasser

- The Paradise conversation
- Listening and questions
- Project discovery — canvasser depth only
- Objection School
- Value of the Visit
- Five Commitments — Project / Value / Time / Household / Lock It
- Appointment setting
- Appointment quality
- Courtesy notice and literature
- Field situations
- Practice lab
- Canvasser certification

### Senior Canvasser

- Advanced listening
- Advanced objection diagnosis
- Appointment quality 201
- Products 201
- Understanding the sales appointment
- Funnel fundamentals
- Peer leadership
- Sales readiness assessment

## 6. Sales-development bridge

### Sales Apprentice

- Sales mindset and preparation
- Advanced needs analysis
- Advanced listening
- Sales objection fundamentals
- Paradise company story
- Product 301
- Inspection and measurement fundamentals
- Price and financing concepts
- Introduction to the Paradise sales process
- Sales shadowing
- Apprentice certification

Any Sales Apprentice lesson that discusses in-home pricing, financing, closing, measurements, promotions, contracts, or advanced sales tactics must display:

> **SALES TRAINING — NOT AUTHORIZATION TO PRICE OR SELL AT THE DOOR.**

### Sales Rep Trainee / Sales Rep Academy

Paradise-controlled version of the full in-home process:

1. Preparation
2. Introduction
3. Survey / Needs Analysis
4. Measure / Inspection
5. Company Story
6. Evolution / Category Education
7. Product Presentation
8. Retail Close / Price Presentation
9. Qualification
10. Major Close
11. Approved Secondary / Sub-Step Closing
12. Button-Up

Supporting courses:

- Product certification
- Financing
- Contracts
- Sales compliance
- Cancellation / rescission procedures
- CRM / LeadPerfection
- Install handoff
- Customer experience
- Advanced objections
- Ride-alongs
- Sales certification

## 7. Canvass Manager curriculum

Manager home should stay simple:

- Train a Rep
- Coach in the Field
- Run Today’s Huddle
- Review Appointments
- Review Numbers
- Compliance Help
- Develop Future Sales Reps

Underlying modules:

- Manager role and accountability
- Compliance leadership
- Paradise canvass-process mastery
- Why the script works
- First-20-seconds coaching
- Objection coaching
- Appointment quality management
- Ride-along coaching
- Daily huddle system
- Weekly training system
- Territory management
- Funnel and KPI management
- Performance coaching
- Motivation and retention
- Incident / escalation handling
- Developing future sales reps
- Manager certification

## 8. Practice engine

The Practice home screen has four primary buttons:

1. **Practice Opening**
2. **Practice Objections**
3. **Practice Appointments**
4. **Practice Field Rules**

Scenario objects should be reusable across career levels.

Each scenario may contain:

- scenario ID
- level
- skill tags
- homeowner statement / field context
- accepted response concepts
- prohibited response concepts
- hard-stop flag
- score dimensions
- coaching note
- source lineage
- training-content version

Primary score dimensions:

- Opening
- Tonality
- Listening
- Question quality
- Project identification
- Objection handling
- Value of visit
- Appointment transition
- Appointment quality
- Compliance
- Exit

## 9. Media experience

The Videos & Audio area must feel like a simple training media library, not Google Drive folders.

Primary rows / playlists:

- Continue Listening
- Required for You
- Canvasser Essentials
- Future Sales Rep
- Manager Training
- Tony Hoty
- Dave Yoho
- Rick Grosso / Grosso University
- Paradise Training

### Player controls

Required v1 controls:

- play / pause
- 15-second back
- 30-second forward
- playback speed at minimum 1x / 1.25x / 1.5x / 2x
- scrub / seek
- resume from last position
- duration / elapsed time
- title / trainer / lesson context
- transcript button when available
- chapter list when available
- bookmark position
- mark complete
- next item

Preferred when technically supported without destabilizing the existing PWA:

- persistent mini-player
- audio-only mode for long videos
- lock-screen / headset controls
- picture-in-picture
- optional offline save

Do not precache the full media library.

Large raw media files must not be added to the public GitHub repository.

Original third-party commercial training media remains controlled source/reference material unless Paradise has a verified right to host/reproduce it in the chosen media layer.

## 10. Media catalog model

Each media item should support:

- media ID
- title
- trainer / source
- type: audio / video / clip
- duration
- career stage
- skill tags
- required / optional / reference
- authority: PARADISE_APPROVED / REFERENCE / HISTORICAL
- source URL
- playback URL
- optional audio-only URL
- poster / thumbnail
- transcript reference
- chapters
- completion threshold
- source notes

One media item may appear in multiple lessons and playlists without duplication.

## 11. Progress model — v1 simplicity

Local-device progress is acceptable for the first build.

Track:

- lesson not started / in progress / complete
- media position
- media complete
- quiz result
- bookmark positions
- current career stage
- certification status

Do not represent local browser storage as the permanent HR certification system.

Structure the code so a future centralized progress service can replace local storage without rewriting lesson content.

## 12. My Progress

The employee should see only:

- current stage
- overall progress
- current certification
- next recommended lesson
- recent completed training
- next career stage

Optional skills summary:

- Compliance
- Opening
- Tonality
- Listening
- Discovery
- Objections
- Appointment Setting
- Appointment Quality
- Product Knowledge
- Leadership / Coaching when applicable

Avoid dense dashboards in v1.

## 13. Career Path

Show a simple visual path:

`Canvasser → Senior Canvasser → Sales Apprentice → Sales Rep`

Parallel:

`Senior Canvasser → Canvass Manager`

Each stage opens a short explanation:

- what the role does
- what skills are learned
- what certification requires
- what comes next

## 14. Source Library

Keep original source material discoverable but secondary.

Top-level source groups:

- Tony Hoty
- Dave Yoho
- Rick Grosso / Grosso University
- Paradise Historical Training
- Paradise Current Reference

Every third-party or historical source page must show:

> **SOURCE / REFERENCE MATERIAL — Paradise-approved curriculum, current company policy, and live municipality instructions control.**

## 15. Search

Search priority order:

1. current Paradise-approved answer / lesson
2. current practice scenario
3. approved Paradise media
4. source/reference media
5. historical source material

Example queries:

- not interested
- permit
- permission
- no soliciting
- spouse
- price
- appointment
- roof
- tonality

Never rank a legacy trainer answer above the current Paradise-approved answer for an operational question.

## 16. Recommended training logic

The home screen primary action is **Continue Training**.

The app chooses the next lesson using a simple ordered curriculum sequence in v1.

The secondary recommendation may say **What should I train today?** and prioritize:

1. incomplete required lesson
2. assigned practice item if later supported
3. weak certification area if available
4. next career-stage preparation

Avoid complex AI recommendation logic in v1.

## 17. Certification model

Canvasser certification should support four gates:

- Knowledge
- Verbal / script
- Role-play
- Field verification

Manager certification should support:

- compliance knowledge
- script demonstration
- coaching demonstration
- route / jurisdiction scenario
- appointment-quality review
- KPI diagnosis
- incident scenario
- huddle / training demonstration

Sales certification is separate and must not be implied by completing Sales Apprentice material.

## 18. Content governance

Training content status:

- Draft
- Approved
- Published
- Retired

v1 may implement this as static metadata rather than an admin UI.

Each approved lesson should carry an internal training version.

Changes should be classifiable as:

- Editorial
- Training Update
- Critical

Critical changes may later trigger acknowledgement or recertification.

## 19. Technical isolation from legal dataset

Do not edit `plain-data.js` or any jurisdiction records for training-only releases unless a separately authorized legal-data change is required.

The validated jurisdiction dataset SHA must remain:

`a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`

for a training-only release.

The existing 78-record / 76-GO / 2-NO-GO load guard must remain intact.

Training navigation must not replace or bury the fast field lookup.

## 20. Navigation integration

Keep field access primary.

Recommended app-level navigation after training is added:

- Lookup
- Training
- Daily Check
- More

Under More:

- History
- Source / app details as appropriate

If changing bottom navigation creates instability or clutter, v1 may instead add a prominent **Training** entry from the existing lookup/home surface and preserve the current bottom navigation unchanged.

Ease of use is more important than exposing every feature at once.

## 21. PWA / update rules

Training assets must not make the service-worker cache unnecessarily large.

Core text / scripts / essential practice content may be cached.

Large audio/video remains streaming unless explicitly saved for offline use.

Training-only releases must preserve current field-app failure behavior: if the jurisdiction rules do not load correctly, the app must still display the existing do-not-use error state rather than falling back to training content or stale legal data.

## 22. v1 build order

1. Training shell and navigation
2. Continue Training
3. Foundation + Field Ready + Certified Canvasser lesson structure
4. Practice home + starter scenarios
5. Career Path
6. My Progress using local storage
7. Videos & Audio library shell
8. Media player with resume / speed / seeking
9. Manager Academy shell
10. Senior Canvasser + Sales Apprentice bridge
11. Source Library
12. Search
13. Full content expansion

Do not block the first usable training build on full transcription or conversion of every legacy media asset.

## 23. v1 acceptance tests

### Existing field regression

- 78 jurisdiction records load.
- GO count remains 76.
- NO-GO count remains 2.
- Punta Gorda remains NO-GO.
- Tarpon Springs remains NO-GO.
- Existing lookup works.
- Daily Check works.
- History works.
- Current permit / permission / courtesy objection panel remains present.
- Current courtesy-notice link remains present.
- No existing field-control text is silently replaced by training content.

### Training navigation

- Training can be opened from the normal app in no more than one obvious tap from the selected v1 entry point.
- Continue Training is the most prominent training action.
- Practice, Career Path, Videos & Audio, and My Progress are visible without hunting through nested menus.
- Returning to Lookup is obvious and immediate.

### Lesson flow

- User can open a lesson.
- Complete Learn.
- Play media if present.
- Complete Practice.
- Complete Pass.
- Advance to Next Lesson.
- Progress survives app close / reopen on the same device.

### Media

- audio plays on iPhone Safari / installed PWA test device
- video plays on iPhone Safari / installed PWA test device
- pause / resume works
- seeking works
- playback speed works
- resume position works
- no giant media precache occurs

### Authority / safety

- PARADISE_APPROVED and SOURCE / REFERENCE content are visibly distinguishable.
- generic training never overrides a live municipality result.
- NO-GO context never presents a conversion script as permission to canvass.
- courtesy-only context never becomes a generic sales pivot.
- clear-refusal training ends the interaction.

### Usability

A new employee can complete the basic flow without instruction:

`Open app → Training → Continue Training → lesson → Watch/Listen → Practice → Pass → Next`

A field rep can immediately return to Lookup without navigating through the curriculum tree.

## 24. Release rule

This branch is working source only.

Do not update the validated branch or call training live until:

1. implementation is complete on the working branch;
2. existing all-jurisdiction regression checks pass;
3. training acceptance tests pass;
4. iPhone / PWA playback and navigation are tested;
5. dataset SHA is confirmed unchanged for a training-only release;
6. build commit is identified;
7. promotion is explicitly authorized;
8. validated branch readback confirms the promoted commit.

## 25. v1 success definition

Paradise University v1 succeeds if a new employee can:

- understand their job;
- learn the approved canvass process;
- practice it;
- pass basic knowledge checks;
- see how they can progress into sales or management;
- easily play relevant training audio/video;
- resume where they stopped;
- see their progress;
- access deeper Tony / Dave / Grosso source material when desired;
- and return instantly to the current field lookup.

The app should feel simple even though the underlying curriculum and source library are deep.
