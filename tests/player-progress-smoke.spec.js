import {test,expect} from '@playwright/test';

async function mediaHome(page){await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Videos & Audio/}).first().click()}

test('Drive player progress controls are truthful and persist on the device',async({page})=>{
  await mediaHome(page);
  await page.locator('.puMediaCard').filter({hasText:'Tonality and Body Language'}).first().getByRole('button',{name:'PLAY'}).click();
  const player=page.locator('#puPlayerRoot');
  await expect(player.getByRole('dialog',{name:'Training player'})).toBeVisible();
  await expect(player.getByText(/cannot read exact playback position or speed from the Drive iframe/i)).toBeVisible();
  await expect(player.locator('#puPlayerBookmark')).toHaveCount(0);
  await player.getByRole('button',{name:'MARK COMPLETE'}).click();
  await player.getByRole('button',{name:'SAVE FOR LATER'}).click();
  let state=await page.evaluate(()=>window.puMediaProgressStatus(window.puPlayerCurrentId()));
  expect(state.complete).toBeTruthy();expect(state.saved).toBeTruthy();
  await player.getByRole('button',{name:'Close player'}).click();
  await page.locator('.puMediaCard').filter({hasText:'Tonality and Body Language'}).first().getByRole('button',{name:'PLAY'}).click();
  await expect(player.getByRole('button',{name:'COMPLETED ✓'})).toBeVisible();
  await expect(player.getByRole('button',{name:'SAVED ✓'})).toBeVisible();
});

test('Next Item follows the curated library rather than jumping into source archive',async({page})=>{
  await mediaHome(page);
  const expected=await page.evaluate(()=>{const ids=window.PU_CURATED_MEDIA_IDS;const all=window.PU_CONTENT.media;return{first:ids[0],second:ids[1],secondTitle:all.find(x=>x.id===ids[1]).title}});
  await page.evaluate(id=>window.puPlayerOpen(id),expected.first);
  const player=page.locator('#puPlayerRoot');
  await player.getByRole('button',{name:'NEXT ITEM'}).click();
  await expect.poll(async()=>page.evaluate(()=>window.puPlayerCurrentId())).toBe(expected.second);
  await expect(player.locator('.puPlayerTitle b')).toHaveText(expected.secondTitle);
  expect(await page.evaluate(()=>window.PU_CONTENT.media.find(x=>x.id===window.puPlayerCurrentId()).priority)).not.toBe('SOURCE_LIBRARY');
});

test('native-stream path exposes exact bookmark, transcript, chapter, speed and resume hooks',async({page})=>{
  await page.goto('/index.html');
  const id=await page.evaluate(()=>{const m=window.PU_CONTENT.media.find(x=>x.priority!=='SOURCE_LIBRARY');m.streamUrl='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';m.transcriptUrl='https://example.com/transcript';m.chapters=[{title:'Start',start:0},{title:'Second section',start:30}];window.puPlayerOpen(m.id);return m.id});
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

test('player v2 exports explicit device-local media progress APIs',async({page})=>{
  await page.goto('/index.html');
  await expect.poll(async()=>page.evaluate(()=>window.PU_PLAYER_VERSION)).toBe('2026.08.16-pu-player-v2');
  const api=await page.evaluate(()=>({status:typeof window.puMediaProgressStatus,complete:typeof window.puMediaMarkComplete,save:typeof window.puMediaSaveForLater,bookmark:typeof window.puMediaBookmarkPosition,mediaUi:window.PU_MEDIA_UI_VERSION}));
  expect(api).toEqual({status:'function',complete:'function',save:'function',bookmark:'function',mediaUi:'2026.08.16-pu-media-ui-v3'});
});
