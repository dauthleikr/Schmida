(() => {
  let content = window.practiceContent;
  try {
    if (new URLSearchParams(location.search).has('preview')) {
      content = JSON.parse(sessionStorage.getItem('practice-preview-content')) || content;
    }
  } catch {}

  const keys = ['intro', 'therapy', 'focusAreas', 'practice', 'costs', 'contact'];
  const defaults = {
    order: keys,
    enabled: { intro: true, therapy: false, focusAreas: true, practice: true, costs: true, contact: true }
  };
  const configured = content.sectionLayout || {};
  const orderedKeys = [...new Set([...(configured.order || []), ...keys])].filter((key) => keys.includes(key));
  const enabled = { ...defaults.enabled, ...(configured.enabled || {}) };
  const nodes = {
    intro: document.querySelector('#psychotherapy'),
    therapy: document.querySelector('.therapy'),
    focusAreas: document.querySelector('#focus-areas'),
    practice: document.querySelector('.practice'),
    costs: document.querySelector('#costs'),
    contact: document.querySelector('#contact')
  };
  const hero = document.querySelector('.hero');
  const main = document.querySelector('main');
  if (!hero || !main || Object.values(nodes).some((node) => !node)) return;

  const existingDividers = [...main.querySelectorAll(':scope > .ribbons')];
  const dividerTemplate = existingDividers[0]?.cloneNode(true);
  existingDividers.forEach((divider) => divider.remove());

  const footer = nodes.contact.querySelector('.site-footer');
  const footerBand = document.createElement('div');
  footerBand.className = 'footer-band';
  if (footer) footerBand.append(footer);

  const host = document.createElement('div');
  host.className = 'content-sections';
  hero.after(host);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveal = (divider) => {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      divider.classList.add('in-view');
      return;
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    }), { threshold: .22 });
    observer.observe(divider);
  };
  const primaryTherapy = enabled.intro ? 'intro' : (enabled.therapy ? 'therapy' : null);
  const idForKey = {
    intro: 'intro-content',
    therapy: 'therapy-content',
    focusAreas: 'focus-areas',
    practice: 'practice-content',
    costs: 'costs',
    contact: 'contact'
  };

  orderedKeys.filter((key) => enabled[key]).forEach((key, index, visibleKeys) => {
    const section = nodes[key];
    section.id = key === primaryTherapy ? 'psychotherapy' : idForKey[key];
    const block = document.createElement('div');
    block.className = 'content-section';
    block.dataset.sectionKey = key;
    block.append(section);
    if (dividerTemplate && index < visibleKeys.length - 1) {
      const divider = dividerTemplate.cloneNode(true);
      divider.classList.remove('in-view');
      block.append(divider);
      reveal(divider);
    }
    host.append(block);
  });
  host.after(footerBand);

  const nav = document.querySelector('.nav-list');
  if (!nav) return;
  const navigation = content.navigation || {};
  const items = [
    ['home', '#home', true],
    ['psychotherapy', '#psychotherapy', Boolean(primaryTherapy)],
    ['costs', '#costs', enabled.costs],
    ['focusAreas', '#focus-areas', enabled.focusAreas],
    ['contact', '#contact', enabled.contact]
  ];
  nav.replaceChildren();
  items.filter(([, , visible]) => visible).forEach(([name, href]) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = href;
    link.textContent = navigation[name] || name;
    item.append(link);
    nav.append(item);
  });
})();
