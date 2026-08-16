import {test,expect} from '@playwright/test';

async function mediaHome(page){await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Videos & Audio/}).first().click()}

test('rights-unverified Drive media cannot open playback or create media progress',async({page})=>{
  await mediaHome(page);
  const card=page.locator('[data-rights-hold="grosso-tonality-audio"]');
  await expect(card).toBeVisible();await expect(card.getByRole('button',{name:'RIGHTS REVIEW'})).toBeDisabled();
  const before=await page.evaluate(()=>window.puMediaProgressStatus('grosso-tonality-audio'));
  await page.evaluate(()=>window.puPlayerOpen('grosso-tonality-audio'));
  const root=page.locator('#puPlayerRoot');
  await expect(root.getByRole('dialog',{name:'Media rights hold'})).toBeVisible();
  await expect(root.locator('#puPlayerComplete,#puPlayerSave,#puDrivePlayer,#puNativeMedia')).toHaveCount(0);
  const after=await page.evaluate(()=>window.puMediaProgressStatus('grosso-tonality-audio'));
  expect(after.complete).toBe(before.complete);expect(after.saved).toBe(before.saved);
});

test('Next Item is available only after test media receives explicit hosting-right metadata',async({page})=>{
  await page.goto('/index.html');
  const expected=await page.evaluate(()=>{const all=window.PU_CONTENT.media.filter(x=>x.priority!=='SOURCE_LIBRARY').slice(0,2);for(const m of all){m.rightsStatus='APPROVED_INTERNAL_HOSTING';m.rightsBasis='Test-only permission';}window.PU_CURATED_MEDIA_IDS=all.map(x=>x.id);return{first:all[0].id,second:all[1].id,secondTitle:all[1].title}});
  await page.evaluate(id=>window.puPlayerOpen(id),expected.first);
  const player=page.locator('#puPlayerRoot');
  await expect(player.getByRole('dialog',{name:'Training player'})).toBeVisible();
  await player.getByRole('button',{name:'NEXT ITEM'}).click();
  await expect.poll(async()=>page.evaluate(()=>window.puPlayerCurrentId())).toBe(expected.second);
  await expect(player.locator('.puPlayerTitle b')).toHaveText(expected.secondTitle);
});

test('native-stream path exposes exact bookmark transcript chapter speed and resume only after explicit rights clearance',async({page})=>{
  await page.goto('/index.html');
  const id=await page.evaluate(()=>{const m=window.PU_CONTENT.media.find(x=>x.priority!=='SOURCE_LIBRARY');m.rightsStatus='APPROVED_INTERNAL_HOSTING';m.rightsBasis='Test-only permission';m.streamUrl='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';m.transcriptUrl='https://example.com/transcript';m.chapters=[{title:'Start',start:0},{title:'Second section',start:30}];window.puPlayerOpen(m.id);return m.id});
  const player=page.locator('#puPlayerRoot');
  await expect(player.locator('#puSpeed')).toBeVisible();
  await expect(player.locator('#puSeek')).toBeVisible();
  await expect(player.getByRole('link',{name:'TRANSCRIPT ↗'})).toHaveAttribute('href','https://example.com/transcript');
  await expect(player.getByRole('button',{name:/Second section/})).toBeVisible();
  await player.getByRole('button',{name:'BOOKMARK POSITION'}).click();
  const state=await page.evaluate(mediaId=>window.puMediaProgressStatus(mediaId),id);
  expect(state.bookmarks).toHaveLength(1);
  expect(state.bookmarks[0].time).toBeGreaterThanOrEqual(0);
});

test('player exports device-local progress APIs plus explicit media-rights gate',async({page})=>{
  await page.goto('/index.html');
  await expect.poll(async()=>page.evaluate(()=>window.PU_PLAYER_VERSION)).toBe('2026.08.16-pu-player-v2');
  const api=await page.evaluate(()=>({status:typeof window.puMediaProgressStatus,complete:typeof window.puMediaMarkComplete,save:typeof window.puMediaSaveForLater,bookmark:typeof window.puMediaBookmarkPosition,mediaUi:window.PU_MEDIA_UI_VERSION,rights:window.PU_MEDIA_RIGHTS_VERSION,playerGate:window.PU_MEDIA_PLAYER_RIGHTS_GATE_VERSION}));
  expect(api).toEqual({status:'function',complete:'function',save:'function',bookmark:'function',mediaUi:'2026.08.16-pu-media-ui-v4',rights:'2026.08.16-pu-media-rights-v1',playerGate:'2026.08.16-pu-media-player-rights-v1'});
});