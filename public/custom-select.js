// Select-only comboboxes keep the original select as their value/event source.
const widgets = new Map();
const fold = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const chevron = '<svg class="select-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const check = '<svg class="select-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';

export function setSelectValue(select, value) {
  if (select.value !== value) select.value = value;
  widgets.get(select)?.sync();
}

export function isSelectOpen(select) { return widgets.get(select)?.isOpen() ?? false; }

export function enhanceSelect(select) {
  if (widgets.has(select)) return;
  const options = [...select.options];
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';
  select.before(wrapper);
  wrapper.append(select);
  select.hidden = true;
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  const control = document.createElement('button');
  control.type = 'button';
  control.id = `${select.id}-control`;
  control.className = 'select-trigger';
  control.setAttribute('role', 'combobox');
  control.setAttribute('aria-haspopup', 'listbox');
  control.setAttribute('aria-controls', `${select.id}-listbox`);
  control.setAttribute('aria-expanded', 'false');
  control.innerHTML = `<span class="select-value" id="${select.id}-value"></span>${chevron}`;
  wrapper.append(control);

  let label = document.querySelector(`label[for="${select.id}"]`) || document.getElementById(`${select.id}-label`);
  if (!label) {
    label = document.createElement('span');
    label.className = 'visually-hidden';
    label.textContent = select.getAttribute('aria-label') || 'Chọn giai đoạn';
    wrapper.prepend(label);
  }
  label.id ||= `${select.id}-label`;
  if (label instanceof HTMLLabelElement) label.htmlFor = control.id;
  control.setAttribute('aria-labelledby', `${label.id} ${select.id}-value`);

  const menu = document.createElement('div');
  menu.className = 'select-popover';
  menu.id = `${select.id}-listbox`;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-labelledby', label.id);
  menu.hidden = true;
  document.body.append(menu);
  const items = options.map((option, index) => {
    const item = document.createElement('div');
    item.id = `${select.id}-option-${index}`;
    item.className = 'select-option';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.dataset.index = index;
    const copy = document.createElement('span');
    copy.className = 'select-option-copy';
    const [title, ...rest] = option.textContent.split(' · ');
    const titleNode = document.createElement('span');
    titleNode.className = 'select-option-title';
    titleNode.textContent = title;
    const subtitle = document.createElement('span');
    subtitle.className = 'select-option-subtitle';
    subtitle.textContent = rest.join(' · ');
    copy.append(titleNode, subtitle);
    item.append(copy);
    item.insertAdjacentHTML('beforeend', check);
    menu.append(item);
    return item;
  });
  let activeIndex = Math.max(0, select.selectedIndex);
  let search = '';
  let searchAt = 0;

  function sync() {
    const selected = options[select.selectedIndex];
    control.querySelector('.select-value').textContent = selected?.textContent || '';
    control.dataset.value = select.value;
    items.forEach((item, index) => item.setAttribute('aria-selected', String(index === select.selectedIndex)));
  }

  function setActive(index, keepVisible = true) {
    activeIndex = Math.max(0, Math.min(items.length - 1, index));
    items.forEach((item, i) => item.classList.toggle('is-active', i === activeIndex));
    control.setAttribute('aria-activedescendant', items[activeIndex].id);
    if (keepVisible) {
      const item = items[activeIndex];
      const top = item.offsetTop;
      const bottom = top + item.offsetHeight;
      if (top < menu.scrollTop + 6) menu.scrollTop = Math.max(0, top - 6);
      else if (bottom > menu.scrollTop + menu.clientHeight - 6) menu.scrollTop = bottom - menu.clientHeight + 6;
    }
  }

  function close(restoreFocus = false) {
    if (menu.hidden) return;
    menu.hidden = true;
    control.setAttribute('aria-expanded', 'false');
    control.removeAttribute('aria-activedescendant');
    search = '';
    if (restoreFocus) control.focus({ preventScroll: true });
  }

  function open() {
    widgets.forEach(widget => widget.close());
    sync();
    const rect = control.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 300), document.documentElement.clientWidth - 24);
    const below = innerHeight - rect.bottom - 14;
    const above = rect.top - 14;
    const placeAbove = below < 200 && above > below;
    const available = placeAbove ? above : below;
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.left, document.documentElement.clientWidth - width - 12))}px`;
    menu.style.maxHeight = `${Math.max(44, Math.min(360, available))}px`;
    menu.hidden = false;
    menu.style.top = `${placeAbove ? Math.max(8, rect.top - menu.getBoundingClientRect().height - 7) : rect.bottom + 7}px`;
    control.setAttribute('aria-expanded', 'true');
    setActive(Math.max(0, select.selectedIndex));
  }

  function choose(index) {
    const option = options[index];
    if (!option) return;
    const changed = select.value !== option.value;
    close();
    select.value = option.value;
    sync();
    if (changed) select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  control.addEventListener('click', () => menu.hidden ? open() : close());
  control.addEventListener('keydown', event => {
    const wasOpen = !menu.hidden;
    if (event.key === 'Escape' && wasOpen) {
      event.preventDefault(); event.stopPropagation(); close(true); return;
    }
    if (event.key === 'Tab') { if (wasOpen) choose(activeIndex); return; }
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Enter' || event.key === ' ') { if (wasOpen) choose(activeIndex); else open(); return; }
      if (event.altKey && event.key === 'ArrowUp') { if (wasOpen) choose(activeIndex); return; }
      if (!wasOpen) open();
      if (event.key === 'Home') setActive(0);
      else if (event.key === 'End') setActive(items.length - 1);
      else if (wasOpen && !event.altKey) {
        const amount = event.key === 'PageDown' ? 10 : event.key === 'PageUp' ? -10 : event.key === 'ArrowDown' ? 1 : -1;
        setActive(activeIndex + amount);
      }
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      search = now - searchAt < 700 ? search + fold(event.key) : fold(event.key);
      searchAt = now;
      if (!wasOpen) { const pendingSearch = search; open(); search = pendingSearch; }
      const repeated = [...search].every(char => char === search[0]);
      const prefix = repeated ? search[0] : search;
      const start = repeated ? activeIndex + 1 : 0;
      for (let offset = 0; offset < options.length; offset++) {
        const index = (start + offset) % options.length;
        if (options[index].textContent.split(' · ').some(part => fold(part).startsWith(prefix))) { setActive(index); break; }
      }
    }
  });
  menu.addEventListener('pointerdown', event => event.preventDefault());
  menu.addEventListener('pointermove', event => {
    const item = event.target.closest('.select-option');
    if (item) setActive(Number(item.dataset.index), false);
  });
  menu.addEventListener('click', event => {
    const item = event.target.closest('.select-option');
    if (item) choose(Number(item.dataset.index));
  });
  document.addEventListener('pointerdown', event => {
    if (!wrapper.contains(event.target) && !menu.contains(event.target)) close();
  });
  document.addEventListener('scroll', event => {
    if (event.target === document || event.target === document.documentElement || event.target === document.body) close();
  }, true);
  addEventListener('resize', () => close());
  select.addEventListener('change', sync);
  widgets.set(select, { sync, close, isOpen: () => !menu.hidden });
  sync();
}
