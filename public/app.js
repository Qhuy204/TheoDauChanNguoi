import { enhanceSelect, setSelectValue, isSelectOpen } from './custom-select.js';
import {publicJSON} from './client-cache.js';
import {startPublicHeader} from './header.js';
import {withResourceLinks} from './resource-links.js';
startPublicHeader();

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${escape(name)}"/></svg>`;
const safeUrl = value => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? escape(url.href) : '#'; }
  catch { return '#'; }
};
const asset = value => /^(?:\/)?assets\/[a-zA-Z0-9._/-]+$/.test(value || '') && !value.includes('..') || /^\/api\/cms\/assets\/[0-9a-f-]{36}$/i.test(value||'') ? escape(value) : 'assets/lotus.svg';
const external = (url, label) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(label)} (mở trong thẻ mới)">${escape(label)}</a>`;

let data;
let media = [];
let filter = 'all';
let stageFilter = 'all';
let visibleCount = 6;
let dialogOpener;
let scrollQueued = false;
const dialog = $('#media-dialog');
const typeNames = { image: 'Hình ảnh', story: 'Câu chuyện', video: 'Thước phim' };
const typeIcons = { image: 'image', story: 'book', video: 'film' };

function imageMarkup(image, extra = '') {
  return `<img src="${asset(image.src)}" alt="${escape(image.alt)}" loading="lazy" decoding="async" ${extra}>`;
}

function renderSite() {
  const resources=withResourceLinks(data).resourceLinks;
  $('#resource-links-section').hidden=resources.length===0;
  $('#resource-links').innerHTML=resources.map(link=>`<a class="resource-link" href="${safeUrl(link.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(link.title)} (mở trong thẻ mới)"><span class="resource-link-title">${escape(link.title)}<span aria-hidden="true">↗</span></span>${link.description?`<span class="resource-link-description">${escape(link.description)}</span>`:''}</a>`).join('');
  $$('[data-site-title]').forEach(el => { el.textContent = data.site.title; });
  $$('[data-site-subtitle]').forEach(el => { el.textContent = data.site.subtitle; });
  $$('[data-site-unit]').forEach(el => { el.textContent = data.site.unit; });
  $('#hero-intro').textContent = data.site.intro;
  $('#hero-image').src = data.site.heroImage;
  $('#activity-image').src = data.site.activityImage;
  for(const [selector,src]of [['#hero-image',data.site.heroImage],['#activity-image',data.site.activityImage]]){const image=Object.values(data.images).find(img=>img.src===src);if(image)$(selector).alt=image.alt||image.title;}
  document.title = `${data.site.title} · ${data.site.subtitle}`;
  $('#activity-school-name').textContent = data.site.schoolName;
  $('.hero h1').textContent=data.site.title;
  $('.hero-subtitle').textContent=data.site.subtitle;
  $('.sidebar-label').textContent=`${data.stages.length} chặng đường lịch sử`;
  $('.journey').setAttribute('aria-label',`${data.stages.length} chặng đường lịch sử`);
  const labelTargets={heroEyebrow:'.hero .eyebrow',heroImageCaption:'.hero-art figcaption',overviewTitle:'#journey-overview-title',overviewEyebrow:'.overview-heading .eyebrow',overviewPrompt:'.overview-heading>p',libraryTitle:'#library-title',libraryEyebrow:'.library-section .eyebrow',libraryIntro:'.section-heading p:last-child',activitiesTitle:'#activities-title',activitiesEyebrow:'.activities-heading .eyebrow',activitiesIntro:'.activities-heading>p:last-child',postsTitle:'#home-posts-title',postsEyebrow:'.home-posts-heading .eyebrow',postsIntro:'.home-posts-heading>div>p:last-child',activityAlbumCaption:'.activity-album figcaption',activityExampleText:'.activity-example>span:last-child>span'};
  for(const [key,selector]of Object.entries(labelTargets)){const el=$(selector);if(el&&data.site.labels?.[key]!==undefined)el.textContent=data.site.labels[key];}
  $('.hero-years strong').textContent=data.site.lifespan||'1890 – 1969';$('.hero-years span').textContent=data.site.personCaption||'Chủ tịch Hồ Chí Minh';
  $('.hero-dates').textContent=`${data.site.lifespan||'1890 – 1969'} · ${data.stages.length} chặng đường lịch sử`;
  if(data.site.logoImage)$$('img.brand-mark').forEach(img=>{img.src=asset(data.site.logoImage);});

  $('#overview-timeline').style.setProperty('--stage-count',data.stages.length);
  $('#overview-timeline').style.setProperty('--timeline-length',`${Math.max(0,data.stages.length-1)*112}px`);
  $('#overview-timeline').innerHTML = data.stages.map(stage => `<a class="overview-stop" href="#${escape(stage.id)}"><span>${escape(stage.years.replaceAll(' ', ''))}</span><small>${escape(stage.shortTitle)}</small></a>`).join('');
  $('#stage-navigation').innerHTML = data.stages.map((stage, i) => `<a href="#${escape(stage.id)}" class="stage-link${i === 0 ? ' is-active' : ''}"${i === 0 ? ' aria-current="location"' : ''}><strong>${escape(stage.years)}</strong><span>${escape(stage.title)}</span></a>`).join('');
  const options = data.stages.map(stage => `<option value="${escape(stage.id)}">${escape(stage.years)} · ${escape(stage.title)}</option>`).join('');
  $('#stage-select').innerHTML = options;
  $('#library-stage').insertAdjacentHTML('beforeend', options);
  $('#chapters').innerHTML = data.stages.map(renderChapter).join('');
  $('#chapters').setAttribute('aria-busy', 'false');
  $('#activity-actions').innerHTML = data.activities.map((activity, i) => `<details class="activity-action"${i === 0 ? ' open' : ''}><summary>${icon(activity.icon)}<h3>${escape(activity.title)}</h3><svg class="icon activity-plus" aria-hidden="true"><use href="#i-plus"/></svg></summary><div class="activity-detail"><p>${escape(activity.text)}</p><ul>${activity.actions.map(action => `<li>${escape(action)}</li>`).join('')}</ul></div></details>`).join('');
  $('#source-list').innerHTML = `<ul>${Object.values(data.sources).map(source => `<li>${external(source.url, source.name)}</li>`).join('')}</ul>`;
  $('#image-credits').innerHTML = Object.values(data.images).filter(image => image.url).map(image => `<div class="image-credit"><strong>${escape(image.title)}</strong><p>${escape(image.credit)}</p>${external(image.url, 'Nguồn ảnh')}${image.licenseUrl ? ` · ${external(image.licenseUrl, 'Giấy phép')}` : ''}</div>`).join('');
}

function renderChapter(stage, i) {
  const image = data.images[stage.image];
  const next = data.stages[i + 1];
  return `<article id="${escape(stage.id)}" class="chapter" aria-labelledby="heading-${escape(stage.id)}" tabindex="-1">
    <div class="chapter-topline"><span class="chapter-number">Chặng ${i + 1} / ${data.stages.length}</span><span class="chapter-place">${icon('pin')}${escape(stage.place)}</span></div>
    <h2 id="heading-${escape(stage.id)}">${escape(stage.title)}</h2><p class="chapter-years">${escape(stage.years)}</p>
    <p class="chapter-intro">${escape(stage.intro)}</p>
    <div class="chapter-body${stage.events.length ? '' : ' no-events'}"><div><figure class="chapter-figure"><button class="image-open${stage.image === 'portrait' ? ' contain' : ''}" data-open="image:${escape(stage.image)}" aria-label="Phóng lớn: ${escape(image.title)}">${imageMarkup(image)}<span class="image-zoom">${icon('plus')}</span></button><figcaption>${escape(image.caption)}</figcaption></figure>${stage.storyId ? `<button class="text-link chapter-story-link" data-open="story:${escape(stage.storyId)}">Đọc câu chuyện ${icon('arrow')}</button>` : ''}</div>
    <ol class="events">${stage.events.map(event => `<li class="event"><p class="event-date">${escape(event.date)}</p><h3>${escape(event.title)}</h3><p>${escape(event.text)}</p></li>`).join('')}</ol></div>
    ${stage.word.term || stage.word.meaning ? `<p class="vocabulary"><strong>Em hiểu thêm · ${escape(stage.word.term)}:</strong> ${escape(stage.word.meaning)}</p>` : ''}
    ${stage.lesson ? `<div class="lesson">${icon('book')}<div><h3>Cùng trao đổi</h3><p>${escape(stage.lesson)}</p></div></div>` : ''}
    <div class="chapter-bottom"><a class="next-chapter" href="${next ? `#${escape(next.id)}` : '#tu-lieu'}">${next ? `Chặng ${i + 2}: ${escape(next.years)}` : 'Cùng khám phá kho tư liệu'} →</a></div>
  </article>`;
}

function prepareMedia() {
  const images = Object.entries(data.images).map(([id, image]) => ({ ...image, id, type: 'image', stage:image.stage||data.stages.find(stage=>stage.image===id)?.id||'all', image: id }));
  const stories = data.stories.map(story => ({ ...story, type: 'story' }));
  const videos = data.videos.map(video => ({ ...video, type: 'video' }));
  const order=id=>{const index=data.stages.findIndex(s=>s.id===id);return index<0?data.stages.length:index;};
  media = [...images,...stories,...videos].sort((a,b)=>order(a.stage)-order(b.stage));
}

function renderLibrary() {
  const showFeature = filter === 'all' && stageFilter === 'all' && data.videos.length>0;
  const film = data.videos[0];
  const image = film?data.images[film.image]:null;
  $('#featured-film').innerHTML = showFeature ? `<div class="featured-film"><button class="featured-thumbnail portrait-bg" data-open="video:${escape(film.id)}" aria-label="Xem phim: ${escape(film.title)}">${imageMarkup(image)}<span class="play-button">${icon('play')}</span></button><div class="featured-copy"><p class="eyebrow">Thước phim nổi bật</p><h3>${escape(film.shortTitle)}</h3><p>${escape(film.description)}</p><button class="button button-primary" data-open="video:${escape(film.id)}">Xem thước phim ${icon('play')}</button></div></div>` : '';
  const matching = media.filter(item => (filter === 'all' || item.type === filter) && (stageFilter === 'all' || item.stage === stageFilter || item.stage === 'all') && !(showFeature && item.id === film?.id));
  $('#media-grid').innerHTML = matching.slice(0, visibleCount).map(renderMediaCard).join('');
  const visible = Math.min(visibleCount, matching.length);
  $('#result-count').textContent = matching.length ? `Đang xem ${visible} / ${matching.length} tư liệu${showFeature ? ' · cùng thước phim nổi bật' : ''}` : '';
  $('#empty-results').hidden = matching.length !== 0;
  $('#load-more').hidden = visible >= matching.length;
  $$('.filter-buttons button').forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function renderMediaCard(item) {
  const image = data.images[item.image];
  const caption = image.kind === 'illustration' ? 'Tranh minh họa' : item.type === 'image' ? image.caption : '';
  return `<article class="media-card"><button data-open="${escape(item.type)}:${escape(item.id)}" aria-label="${item.type === 'video' ? 'Xem phim' : item.type === 'story' ? 'Đọc câu chuyện' : 'Xem ảnh'}: ${escape(item.title)}"><span class="media-thumbnail${item.image === 'portrait' ? ' portrait-bg' : ''}">${imageMarkup(image)}${item.type === 'video' ? `<span class="play-button">${icon('play')}</span>` : ''}</span>${caption ? `<small>${escape(caption)}</small>` : ''}<h3>${escape(item.title)}</h3><span class="media-type">${icon(typeIcons[item.type])}${typeNames[item.type]}</span></button></article>`;
}

function openMedia(type, id, opener) {
  let html = '';
  if (type === 'image') {
    const image = data.images[id];
    if (!image) return;
    html = `<figure class="dialog-photo"><div class="dialog-image-stage">${imageMarkup(image, 'class="dialog-image"')}</div><figcaption class="dialog-photo-caption"><h2 id="dialog-title" tabindex="-1">${escape(image.title)}</h2><p class="dialog-caption">${escape(image.caption)}</p></figcaption></figure>`;
  } else if (type === 'story') {
    const story = data.stories.find(item => item.id === id);
    if (!story) return;
    const image = data.images[story.image];
    html = `<article class="dialog-reading"><h2 id="dialog-title" tabindex="-1">${escape(story.title)}</h2><figure class="story-figure">${imageMarkup(image, `class="story-image${story.image === 'portrait' ? ' portrait-bg' : ''}"`)}<figcaption class="dialog-caption">${escape(image.caption)}</figcaption></figure><div class="story-copy">${story.paragraphs.map(paragraph => `<p class="story-paragraph">${escape(paragraph)}</p>`).join('')}</div><aside class="story-question"><strong>Cùng trao đổi</strong><p>${escape(story.question)}</p></aside></article>`;
  } else if (type === 'video') {
    const video = data.videos.find(item => item.id === id);
    if (!video) return;
    html = `<article class="dialog-film"><h2 id="dialog-title" tabindex="-1">${escape(video.title)}</h2><video id="active-video" class="video-player" controls playsinline preload="none" poster="${asset(data.images[video.image].src)}" aria-label="${escape(video.title)}"><source src="${safeUrl(video.src)}" type="video/mp4">Trình duyệt chưa hỗ trợ phát phim. Em có thể mở phim tại nguồn bên dưới.</video><div class="video-error" id="video-error" role="status" hidden>Phim chưa phát được ở đây. Em hãy bấm “Xem phim tại nguồn” bên dưới để tiếp tục.</div><p class="video-summary">${escape(video.summary)}</p><div class="dialog-source-links">${external(video.url, 'Xem phim tại nguồn ↗')}</div></article>`;
  } else return;
  dialogOpener = opener;
  dialog.dataset.type = type;
  $('#dialog-content').innerHTML = html;
  dialog.showModal();
  document.body.classList.add('modal-open');
  dialog.scrollTop = 0;
  $('#dialog-title').focus({ preventScroll: true });
  const player = $('#active-video');
  if (player) {
    const failed = () => { const warning = $('#video-error'); if (warning) warning.hidden = false; };
    player.addEventListener('error', failed);
    $('source', player)?.addEventListener('error', failed);
  }
}

function closeMedia() { dialog.close(); }

function clearMedia() {
  const player = $('#active-video');
  if (player) { player.pause(); player.removeAttribute('src'); $$('source', player).forEach(source => source.remove()); player.load(); }
  $('#dialog-content').replaceChildren();
  document.body.classList.remove('modal-open');
  if (dialogOpener?.isConnected) dialogOpener.focus({ preventScroll: true });
}

function updateReadingPosition() {
  const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header')) + (window.innerWidth <= 940 ? 110 : 70);
  const sections = ['gioi-thieu', 'bai-viet-moi', 'hanh-trinh', 'tu-lieu', 'lam-theo-bac'];
  let current = sections[0];
  sections.forEach(id => { if (document.getElementById(id).getBoundingClientRect().top <= offset) current = id; });
  $$('.main-nav a').forEach(link => {
    const active = link.hash === `#${current}`;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  let stage = data.stages[0];
  data.stages.forEach(item => { if (document.getElementById(item.id).getBoundingClientRect().top <= offset + 40) stage = item; });
  $$('.stage-link').forEach(link => {
    const active = link.hash === `#${stage.id}`;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  // Do not change the current choice while the listbox is being explored.
  if (!isSelectOpen($('#stage-select'))) setSelectValue($('#stage-select'), stage.id);
  const stageIndex = data.stages.indexOf(stage);
  $('#previous-stage').disabled = stageIndex === 0;
  $('#next-stage').disabled = stageIndex === data.stages.length - 1;
  const max = document.documentElement.scrollHeight - innerHeight;
  $('.reading-progress span').style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 0}%`;
  scrollQueued = false;
}

function goToStage(id) {
  const target = document.getElementById(id);
  if (!target || !data.stages.some(stage => stage.id === id)) return;
  if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
  target.scrollIntoView({ behavior: 'instant', block: 'start' });
  target.focus({ preventScroll: true });
  setSelectValue($('#stage-select'), id);
  updateReadingPosition();
}

function attachEvents() {
  document.addEventListener('click', event => {
    const stageLink = event.target.closest('.stage-link, .overview-stop, .next-chapter');
    if (stageLink && data.stages.some(stage => `#${stage.id}` === stageLink.hash)) {
      event.preventDefault(); goToStage(stageLink.hash.slice(1));
    }
    const openButton = event.target.closest('[data-open]');
    if (openButton) { const [type, id] = openButton.dataset.open.split(':'); openMedia(type, id, openButton); }
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) { filter = filterButton.dataset.filter; visibleCount = 6; renderLibrary(); }
  });
  $('#stage-select').addEventListener('change', event => goToStage(event.target.value));
  const stepStage = direction => {
    const index = data.stages.findIndex(stage => stage.id === $('#stage-select').value);
    const target = data.stages[index + direction];
    if (target) goToStage(target.id);
  };
  $('#previous-stage').addEventListener('click', () => stepStage(-1));
  $('#next-stage').addEventListener('click', () => stepStage(1));
  addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (data.stages.some(stage => stage.id === id)) {
      document.getElementById(id).scrollIntoView({ behavior: 'instant' });
      updateReadingPosition();
    }
  });
  $('#library-stage').addEventListener('change', event => { stageFilter = event.target.value; visibleCount = 6; renderLibrary(); });
  $('#load-more').addEventListener('click', () => {
    const previousCount = visibleCount;
    visibleCount += 6;
    renderLibrary();
    const firstNew = $$('.media-card button')[previousCount];
    if (firstNew) firstNew.focus({ preventScroll: true });
  });
  $('#reset-filters').addEventListener('click', () => {
    filter = 'all'; stageFilter = 'all'; visibleCount = 6;
    setSelectValue($('#library-stage'), 'all'); renderLibrary();
    $('[data-filter="all"]').focus({ preventScroll: true });
  });
  $('#dialog-close').addEventListener('click', closeMedia);
  dialog.addEventListener('close', clearMedia);
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = $$('button:not(:disabled), a[href], video[controls], [tabindex="0"]', dialog)
      .filter(control => control.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    // The heading receives initial focus; its next Tab should reach a control.
    if (!controls.includes(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus({ preventScroll: true });
    }
  });
  // Close only if both pointer-down and pointer-up occurred on the backdrop.
  let downOnBackdrop = false;
  dialog.addEventListener('pointerdown', event => { downOnBackdrop = event.target === dialog && outsideDialog(event); });
  dialog.addEventListener('click', event => { if (downOnBackdrop && event.target === dialog && outsideDialog(event)) closeMedia(); downOnBackdrop = false; });
  $('#footer-source-link').addEventListener('click', () => { $('#source-details').open = true; });
  addEventListener('scroll', () => { if (!scrollQueued) { requestAnimationFrame(updateReadingPosition); scrollQueued = true; } }, { passive: true });
  addEventListener('resize', updateReadingPosition);
  // A broken remote/local image keeps its accessible description visible.
  document.addEventListener('error', event => { if (event.target instanceof HTMLImageElement) event.target.classList.add('image-failed'); }, true);
}

function outsideDialog(event) {
  const rect = dialog.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}

async function init() {
  try {
    const result = await publicJSON('/api/cms/site-content');
    data = result.content;
    renderSite(); prepareMedia();
    enhanceSelect($('#stage-select')); enhanceSelect($('#library-stage'));
    renderLibrary(); attachEvents();
    updateReadingPosition();
    if (location.hash) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) requestAnimationFrame(() => { target.scrollIntoView({ behavior: 'instant' }); updateReadingPosition(); });
    }
  } catch (error) {
    $('#load-error').hidden = false;
    $('#chapters').setAttribute('aria-busy', 'false');
    $('#overview-timeline').textContent = 'Hành trình đang chờ em khám phá.';
    $('#retry-load').addEventListener('click', () => location.reload(), { once: true });
    console.error('Không tải được dữ liệu website:', error);
  }
}

async function loadHomePosts() {
  const grid = $('#home-posts'), status = $('#home-posts-status'), retry = $('#home-posts-retry');
  if (!grid) return;
  retry.hidden = true; grid.setAttribute('aria-busy', 'true'); status.hidden = false;
  status.textContent = 'Đang tải bài viết…';
  try {
    const result = await publicJSON('/api/cms/posts');
    if (!Array.isArray(result.posts)) throw new Error('Invalid posts');
    const posts = result.posts.slice(0, 3);
    grid.innerHTML = posts.map(post => {
      const href = `/bai-viet/${encodeURIComponent(post.slug)}`;
      const date = new Date(post.published_at);
      const dateText = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      return `<article class="home-post">${post.cover_path ? `<a class="home-post-image" href="${href}" tabindex="-1" aria-hidden="true"><img src="/api/cms/media/${encodeURIComponent(post.id)}" alt="" loading="lazy" decoding="async"></a>` : ''}<p class="home-post-meta">${escape(post.author_name)}${dateText ? ` · <time datetime="${escape(date.toISOString())}">${dateText}</time>` : ''}</p><h3><a href="${href}">${escape(post.title)}</a></h3>${post.summary ? `<p class="home-post-summary">${escape(post.summary)}</p>` : ''}<a class="home-post-read" href="${href}" aria-label="Đọc bài: ${escape(post.title)}">Đọc bài <span aria-hidden="true">→</span></a></article>`;
    }).join('');
    status.textContent = posts.length ? '' : 'Chưa có bài viết mới. Các bài được đăng sẽ xuất hiện tại đây.';
    status.hidden = posts.length > 0;
  } catch {
    status.textContent = 'Chưa tải được bài viết. Bạn có thể thử lại hoặc xem tất cả bài viết.';
    retry.hidden = false;
  } finally { grid.setAttribute('aria-busy', 'false'); }
}
$('#home-posts-retry')?.addEventListener('click', loadHomePosts);
addEventListener('cms:public-updated',event=>{if(event.detail.path==='/api/cms/posts')loadHomePosts();else{$('#refresh-site-content').hidden=false;}});
addEventListener('storage',event=>{if(event.key==='cms:invalidate'){$('#refresh-site-content').hidden=false;loadHomePosts();}});
$('#refresh-site-content')?.addEventListener('click',()=>location.reload());
init();
loadHomePosts();
