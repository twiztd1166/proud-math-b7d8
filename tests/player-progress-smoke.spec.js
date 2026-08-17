import {test,expect} from '@playwright/test';

async function mediaHome(page){await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Videos & Audio/}).first().click()}

test('internal Drive media uses top-level authorized launch and can create device-local media progress',async({page})=>{
  await mediaHome(page);
  const card=page.locator('[data-media="grosso-tonality-audio"]').first();await expect(card).toBeVisible();
  const before=await page.evaluate(()=>window.puMediaProgressStatus('grosso-tonality-audio'));
  await page.evaluate(()=>window.puPlayerOpen('grosso-tonality-audio'));
  const root=page.locator('#puPlayerRoot');await expect(root.getByRole('dialog',{name:'Training player'})).toBeVisible();
  await expect(root.locator('iframe')).toHaveCount(0);
  await expect(root.locator('[data-provider="drive-top-level"]')).toBeVisible();
  const launch=root.getByRole('link',{name:/Play Tonality and Body Language in Google Drive/i});
  await expect(launch).toBeVisible();await expect(launch).toHaveAttribute('href',/drive\.google\.com\/file\/d\/1WNQ6ItT6Ar_HXGKNutWEvEFeHm14RjKn/);await expect(launch).toHaveAttribute('target','_blank');await expect(launch).toHaveAttribute('rel',/noopener/);
  await expect(root.getByText(/does not use an embedded Google frame or depend on third-party-cookie access/i)).toBeVisible();
  await root.getByRole('button',{name:'MARK COMPLETE'}).click();await root.getByRole('button',{name:'SAVE FOR LATER'}).click();
  const after=await page.evaluate(()=>window.puMediaProgressStatus('grosso-tonality-audio'));
  expect(before.complete).toBeFalsy();expect(after.complete).toBeTruthy();expect(after.saved).toBeTruthy();
});

test('Next Item is available across internal curated media sequence',async({page})=>{
  await page.goto('/index.html');const expected=await page.evaluate(()=>{const all=window.PU_CONTENT.media.filter(x=>x.priority!=='SOURCE_LIBRARY').slice(0,2);window.PU_CURATED_MEDIA_IDS=all.map(x=>x.id);return{first:all[0].id,second:all[1].id,secondTitle:all[1].title}});
  await page.evaluate(id=>window.puPlayerOpen(id),expected.first);const player=page.locator('#puPlayerRoot');await expect(player.getByRole('dialog',{name:'Training player'})).toBeVisible();await player.getByRole('button',{name:'NEXT ITEM'}).click();await expect.poll(async()=>page.evaluate(()=>window.puPlayerCurrentId())).toBe(expected.second);await expect(player.locator('.puPlayerTitle b')).toHaveText(expected.secondTitle);
});

test('native-stream path exposes bookmark transcript chapter speed and resume when a controlled stream exists',async({page})=>{
  await page.goto('/index.html');const id=await page.evaluate(()=>{const m=window.PU_CONTENT.media.find(x=>x.priority!=='SOURCE_LIBRARY');m.streamUrl='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';m.transcriptUrl='https://example.com/transcript';m.chapters=[{title:'Start',start:0},{title:'Second section',start:30}];window.puPlayerOpen(m.id);return m.id});
  const player=page.locator('#puPlayerRoot');await expect(player.locator('#puNativeMedia')).toHaveCount(1);await expect(player.locator('iframe')).toHaveCount(0);await expect(player.locator('#puSpeed')).toBeVisible();await expect(player.locator('#puSeek')).toBeVisible();await expect(player.getByRole('link',{name:'TRANSCRIPT ↗'})).toHaveAttribute('href','https://example.com/transcript');await expect(player.getByRole('button',{name:/Second section/})).toBeVisible();await player.getByRole('button',{name:'BOOKMARK POSITION'}).click();const state=await page.evaluate(mediaId=>window.puMediaProgressStatus(mediaId),id);expect(state.bookmarks).toHaveLength(1);expect(state.bookmarks[0].time).toBeGreaterThanOrEqual(0);
});

test('player exports device-local progress APIs plus internal-media control',async({page})=>{
  await page.goto('/index.html');await expect.poll(async()=>page.evaluate(()=>window.PU_PLAYER_VERSION)).toBe('2026.08.17-pu-player-v3-drive-top-level');
  const api=await page.evaluate(()=>({status:typeof window.puMediaProgressStatus,complete:typeof window.puMediaMarkComplete,save:typeof window.puMediaSaveForLater,bookmark:typeof window.puMediaBookmarkPosition,mediaUi:window.PU_MEDIA_UI_VERSION,rights:window.PU_MEDIA_RIGHTS_VERSION,playerGate:window.PU_MEDIA_PLAYER_RIGHTS_GATE_VERSION,control:window.PU_MEDIA_RIGHTS_CONTROL.status}));
  expect(api).toEqual({status:'function',complete:'function',save:'function',bookmark:'function',mediaUi:'2026.08.16-pu-media-ui-v5',rights:'2026.08.16-pu-media-internal-v2',playerGate:'2026.08.16-pu-media-player-rights-v1',control:'INTERNAL_USE_NON_BLOCKING'});
});
