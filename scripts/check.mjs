import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const data = JSON.parse(await readFile(path.join(dist, 'data/content.json'), 'utf8'));
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const expected = ['1890 – 1911', '1911 – 1920', '1920 – 1930', '1930 – 1941', '1941 – 1945', '1945 – 1954', '1954 – 1969'];
assert.deepEqual(data.stages.map(stage => stage.years), expected);
assert.equal(new Set(data.stages.map(stage => stage.id)).size, 7);
assert.equal(data.stories.length, 7);
assert(data.videos.length >= 3);
const ids = new Set(data.stages.map(stage => stage.id));
for (const stage of data.stages) {
  assert(stage.events.length >= 2 && stage.events.length <= 4, stage.id);
  assert(data.images[stage.image], `Missing image for ${stage.id}`);
  assert(data.stories.some(story => story.id === stage.storyId && story.stage === stage.id));
  assert(stage.sourceIds.length > 0);
  stage.sourceIds.forEach(id => assert(data.sources[id], `Missing source ${id}`));
}
for (const story of data.stories) {
  assert(ids.has(story.stage));
  assert(story.paragraphs.length > 0 && story.question);
  story.sourceIds.forEach(id => assert(data.sources[id]));
}
for (const video of data.videos) {
  assert(video.stage === 'all' || ids.has(video.stage));
  assert(new URL(video.src).protocol === 'https:');
  assert(new URL(video.url).hostname === 'hochiminh.vn');
}
const assets = new Set([data.site.heroImage, data.site.activityImage, ...Object.values(data.images).map(image => image.src)]);
for (const image of Object.values(data.images)) {
  assert(image.alt && image.caption && image.credit);
  assert(image.kind === 'illustration' || image.url, `Source missing for ${image.title}`);
  if (image.credit.includes('CC BY-SA')) assert(image.licenseUrl);
}
for (const name of assets) {
  const file = path.join(dist, name);
  assert((await stat(file)).size > 1000, `Empty asset: ${name}`);
}
for (const name of ['styles.css', 'app.js', 'assets/lotus-red.png', 'assets/lotus-gold.png']) await stat(path.join(dist, name));
for (const anchor of ['gioi-thieu', 'hanh-trinh', 'tu-lieu', 'lam-theo-bac', 'media-dialog', 'load-error']) assert(html.includes(`id="${anchor}"`));
execFileSync(process.execPath, ['--check', path.join(dist, 'app.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'scripts/serve.mjs')]);
assert(!/TODO|lorem ipsum|codex-preview/i.test(html));
console.log(`PASS: 7 stages, 7 stories, ${data.videos.length} videos, ${assets.size} image assets, sources and JavaScript syntax.`);
