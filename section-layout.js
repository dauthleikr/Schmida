(() => {
  const content = window.currentPracticeContent || window.practiceContentModel.normalize(window.practiceContent);
  const model = window.practiceContentModel;
  const host = document.querySelector('#content-sections');
  const heroRibbon = document.querySelector('.hero-ribbon');
  if (!host || !heroRibbon) return;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[character]));
  const escapeAttribute = escapeHtml;
  const formatMarkup = (value) => escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/_([^_]+)_/g,'<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\n/g,'<br>');
  const eyebrow = (value) => value ? `<p class="eyebrow">${formatMarkup(value)}</p>` : '';
  const headingMarkup = (body,mode) => {
    if (mode === 'both') return `${eyebrow(body.eyebrow)}<h2>${formatMarkup(body.title)}</h2>`;
    const value = mode === 'title' ? body.title : body.eyebrow;
    return `<h2 class="section-heading-accent">${formatMarkup(value)}</h2>`;
  };
  const sectionHeading = (section) => {
    const body = section.content;
    const desktop = section.appearance?.headingModeDesktop || 'eyebrow';
    const mobile = section.appearance?.headingModeMobile || 'eyebrow';
    return `<div class="section-heading-variant section-heading-desktop">${headingMarkup(body,desktop)}</div><div class="section-heading-variant section-heading-mobile">${headingMarkup(body,mobile)}</div>`;
  };
  const imageMarkup = (body, className = 'office-placeholder', attributes = '', imageAttributes = '') => body.imageSrc
    ? `<div class="${className}" ${attributes} role="img" aria-label="${escapeAttribute(body.imageAlt)}" style="--section-image-position:${escapeAttribute(body.imagePosition || 'center center')}"><img class="section-image" src="${escapeAttribute(body.imageSrc)}" alt="${escapeAttribute(body.imageAlt)}" ${imageAttributes}>${body.caption ? `<p class="image-caption">${formatMarkup(body.caption)}</p>` : ''}</div>`
    : `<div class="${className}" ${attributes} role="img" aria-label="${escapeAttribute(body.imageAlt)}"><div class="office-art" aria-hidden="true"></div>${body.caption ? `<p class="image-caption">${formatMarkup(body.caption)}</p>` : ''}</div>`;
  const sectionId = (value, index) => {
    const normalized = String(value || `section-${index + 1}`).trim().toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');
    return normalized || `section-${index + 1}`;
  };
  const colorChannels = (value) => {
    const hex = /^#[0-9a-f]{6}$/i.test(value || '') ? value.slice(1) : '000000';
    return [0,2,4].map((offset) => parseInt(hex.slice(offset,offset + 2),16));
  };
  const interpolateColor = (start,end,position) => {
    const from = colorChannels(start);
    const to = colorChannels(end);
    const channel = (index) => Math.round(from[index] + (to[index] - from[index]) * position).toString(16).padStart(2,'0');
    return `#${channel(0)}${channel(1)}${channel(2)}`;
  };
  const readableInk = (color) => {
    const [red,green,blue] = colorChannels(color);
    return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? '#291117' : '#ffffff';
  };
  const safeMapEmbedUrl = (value) => {
    try {
      const url = new URL(String(value || '').trim());
      const hostname = url.hostname.toLowerCase();
      const isGoogleHost = hostname === 'google.com' || hostname.endsWith('.google.com');
      return url.protocol === 'https:' && isGoogleHost && url.pathname.startsWith('/maps/embed') ? url.href : '';
    } catch {
      return '';
    }
  };

  const renderCardGrid = (section,{ titleOnly = false } = {}) => {
    const body = section.content;
    const columns = titleOnly && body.items.length > 6
      ? 4
      : body.items.length > 4 ? 3 : Math.max(1,body.items.length);
    const cards = body.items.map((item,index) => {
      const classes = ['focus-card',
        titleOnly ? 'title-card' : '',
        index % columns === 0 ? 'is-row-start' : '',
        index % columns === columns - 1 || index === body.items.length - 1 ? 'is-row-end' : ''
      ].filter(Boolean).join(' ');
      const description = titleOnly ? '' : `<p>${formatMarkup(item.text)}</p>`;
      return `<article class="${classes}"><h3>${formatMarkup(item.title)}</h3>${description}</article>`;
    }).join('');
    const layoutClass = titleOnly ? 'layout-title-cards' : 'layout-cards';
    const titleFont = section.appearance?.itemTitleFont === 'sans' ? 'var(--sans)' : 'var(--serif)';
    const titleSize = Math.min(36,Math.max(16,Number(section.appearance?.itemTitleSize) || 25));
    const titleStyles = titleOnly ? ` style="--title-card-font:${titleFont};--title-card-size:${titleSize / 16}rem"` : '';
    return `<section class="section dynamic-section ${layoutClass}"${titleStyles}><div class="page"><div class="focus-header"><div>${sectionHeading(section)}</div><p class="section-intro-text">${formatMarkup(body.intro)}</p></div><div class="focus-grid" data-count="${body.items.length}" style="--card-columns:${columns}">${cards}</div></div></section>`;
  };

  const timelineItemsMarkup = (items) => items.map((item) => `<li><span class="timeline-period">${formatMarkup(item.period)}</span><div class="timeline-entry"><h3>${formatMarkup(item.title)}</h3>${item.detail ? `<p>${formatMarkup(item.detail)}</p>` : ''}</div></li>`).join('');
  let timelineToggleId = 0;

  const renderers = {
    intro: (section) => {
      const body = section.content;
      const items = body.items.filter((item) => item.text).map((item) => `<li>${formatMarkup(item.text)}</li>`).join('');
      const intro = body.intro ? `<p class="intro-lead section-intro-text">${formatMarkup(body.intro)}</p>` : '';
      return `<section class="section dynamic-section layout-intro"><div class="page intro-grid"><div class="intro-heading">${sectionHeading(section)}${intro}</div><div><p>${formatMarkup(body.text)}</p>${items ? `<ul class="bullet-list">${items}</ul>` : ''}</div></div></section>`;
    },
    note: (section) => {
      const body = section.content;
      return `<section class="section dynamic-section layout-note"><div class="page therapy-grid"><div class="therapy-copy">${sectionHeading(section)}<p>${formatMarkup(body.text)}</p></div><div class="therapy-note">${formatMarkup(body.note)}</div></div></section>`;
    },
    cards: (section) => renderCardGrid(section),
    titleCards: (section) => renderCardGrid(section,{ titleOnly:true }),
    image: (section) => {
      const body = section.content;
      return `<section class="section dynamic-section layout-image"><div class="page practice-grid"><div class="practice-copy">${sectionHeading(section)}<p>${formatMarkup(body.text)}</p></div>${imageMarkup(body)}</div></section>`;
    },
    wideImage: (section) => {
      const body = section.content;
      const imageStyle = section.appearance?.imageStyle || 'offset-shadow';
      const images = body.images?.length ? body.images : [{ imageSrc: '',imageAlt: 'Foto des Praxisraums',imagePosition: 'center center',caption: '' }];
      const slides = images.map((image,index) => imageMarkup(
        image,
        'wide-image-frame carousel-slide',
        `data-carousel-slide="${index}" data-active="${index === 0}" aria-hidden="${index !== 0}"`,
        'loading="lazy" decoding="async" fetchpriority="low"'
      )).join('');
      const controls = images.length > 1 ? `<div class="carousel-controls">
        <button class="carousel-arrow" type="button" data-carousel-previous aria-label="Vorheriges Bild">←</button>
        <div class="carousel-dots" role="group" aria-label="Bild auswählen">${images.map((_,index) => `<button type="button" data-carousel-dot="${index}" data-active="${index === 0}" aria-label="Bild ${index + 1} anzeigen" aria-pressed="${index === 0}"></button>`).join('')}</div>
        <button class="carousel-arrow" type="button" data-carousel-next aria-label="Nächstes Bild">→</button>
      </div>` : '';
      return `<section class="section dynamic-section layout-wide-image" data-image-style="${escapeAttribute(imageStyle)}"><div class="page"><div class="wide-image-copy">${sectionHeading(section)}<p>${formatMarkup(body.text)}</p></div><div class="wide-image-carousel" data-carousel data-autoplay-delay="5000"><div class="carousel-stage">${slides}</div>${controls}</div></div></section>`;
    },
    topics: (section) => {
      const body = section.content;
      const visibleItems = body.items.filter((item) => item.text);
      const start = section.appearance?.gradientStart || '#fff0f2';
      const end = section.appearance?.gradientEnd || '#d11137';
      const items = visibleItems.map((item,index) => {
        const position = visibleItems.length > 1 ? index / (visibleItems.length - 1) : 0;
        const color = interpolateColor(start,end,position);
        return `<li style="--item-color:${color};--item-ink:${readableInk(color)}"><span>${String(index + 1).padStart(2,'0')}</span>${formatMarkup(item.text)}</li>`;
      }).join('');
      const listStyle = section.appearance?.listStyle || 'numbered-grid';
      return `<section class="section dynamic-section layout-topics"><div class="page topics-grid"><div class="topics-copy">${sectionHeading(section)}<p class="section-intro-text">${formatMarkup(body.intro)}</p></div><ol class="topics-list" data-list-style="${escapeAttribute(listStyle)}">${items}</ol></div></section>`;
    },
    timeline: (section) => {
      const body = section.content;
      const timelineStyle = section.appearance?.timelineStyle || 'classic-lines';
      const secondaryItems = Array.isArray(body.secondaryItems) ? body.secondaryItems : [];
      const hasToggle = timelineStyle === 'alternating-path' && secondaryItems.length > 0;
      if (!hasToggle) {
        return `<section class="section dynamic-section layout-timeline"><div class="page timeline-grid"><div class="timeline-copy">${sectionHeading(section)}<p class="section-intro-text">${formatMarkup(body.intro)}</p></div><ol class="timeline-list" data-timeline-style="${escapeAttribute(timelineStyle)}">${timelineItemsMarkup(body.items)}</ol></div></section>`;
      }

      const toggleId = `timeline-toggle-${++timelineToggleId}`;
      const viewMarkup = (key,items,active) => `<div class="timeline-view${active ? ' is-active' : ''}" data-timeline-view="${key}" id="${toggleId}-panel-${key}" role="tabpanel" aria-labelledby="${toggleId}-tab-${key}" ${active ? '' : 'hidden'}><ol class="timeline-list" data-timeline-style="${escapeAttribute(timelineStyle)}">${timelineItemsMarkup(items)}</ol></div>`;
      return `<section class="section dynamic-section layout-timeline layout-timeline-toggle"><div class="page timeline-grid"><div class="timeline-copy">${sectionHeading(section)}<p class="section-intro-text">${formatMarkup(body.intro)}</p></div><div class="timeline-switchable"><div class="timeline-toggle-wrap"><div class="timeline-toggle" data-timeline-toggle role="tablist" aria-label="Werdegang auswählen"><button type="button" id="${toggleId}-tab-primary" role="tab" aria-selected="true" aria-controls="${toggleId}-panel-primary" data-timeline-toggle-target="primary">${formatMarkup(body.primaryViewLabel || 'Berufserfahrung')}</button><button type="button" id="${toggleId}-tab-secondary" role="tab" aria-selected="false" aria-controls="${toggleId}-panel-secondary" data-timeline-toggle-target="secondary" tabindex="-1">${formatMarkup(body.secondaryViewLabel || 'Ausbildung')}</button></div></div>${viewMarkup('primary',body.items,true)}${viewMarkup('secondary',secondaryItems,false)}</div></div></section>`;
    },
    pricing: (section) => {
      const body = section.content;
      const rows = body.items.map((item) => `<div class="price-row"><div class="price-name"><span>${formatMarkup(item.name)}</span><span class="price-duration">${formatMarkup(item.duration)}</span></div><div class="price-value">${formatMarkup(item.price)}</div></div>`).join('');
      return `<section class="section dynamic-section layout-pricing"><div class="page costs-grid"><div class="costs-copy">${sectionHeading(section)}<p class="section-intro-text">${formatMarkup(body.intro)}</p></div><div><div class="price-list">${rows}</div>${body.note ? `<p class="reimbursement">${formatMarkup(body.note)}</p>` : ''}</div></div></section>`;
    },
    contact: (section) => {
      const body = section.content;
      const phoneHref = String(body.phoneHref || '').replace(/[^\d+]/g,'');
      const address = [body.addressLine1,body.addressLine2].filter(Boolean);
      const details = [
        address.length ? `<div><div class="detail-label">Praxis</div><p class="detail-value">${address.map(formatMarkup).join('<br>')}</p></div>` : '',
        body.phoneLabel ? `<div><div class="detail-label">Telefon</div>${phoneHref ? `<a class="detail-value" href="tel:${escapeAttribute(phoneHref)}">${formatMarkup(body.phoneLabel)}</a>` : `<span class="detail-value">${formatMarkup(body.phoneLabel)}</span>`}</div>` : '',
        body.email ? `<div><div class="detail-label">E-Mail</div>${String(body.email).includes('@') ? `<a class="detail-value" href="mailto:${escapeAttribute(body.email)}">${formatMarkup(body.email)}</a>` : `<span class="detail-value">${formatMarkup(body.email)}</span>`}</div>` : ''
      ].join('');
      const embedUrl = safeMapEmbedUrl(body.mapEmbed);
      const mapLink = body.mapLink && body.mapLabel ? `<a class="map-link" href="${escapeAttribute(body.mapLink)}" target="_blank" rel="noreferrer">${formatMarkup(body.mapLabel)}</a>` : '';
      const map = embedUrl
        ? `<div class="map map-embed">${mapLink}<iframe src="${escapeAttribute(embedUrl)}" title="Standort auf Google Maps" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`
        : mapLink ? `<div class="map">${mapLink}</div>` : '';
      return `<section class="section dynamic-section contact-section layout-contact"><div class="page contact-grid"><div class="contact-copy">${sectionHeading(section)}<p class="section-intro-text">${formatMarkup(body.text)}</p></div><div class="contact-details">${details}</div></div>${map}</section>`;
    }
  };

  const wave = '<svg viewBox="0 0 1200 180" preserveAspectRatio="none" aria-hidden="true"><g class="ribbon-lines"><g class="ribbon-glow"><path d="M-65 128C122 27 242 183 413 92s279-59 408 19 238 47 449-75" fill="none" stroke="currentColor" stroke-width="42" opacity=".18"/><path d="M-44 113c189 73 288-106 457-20s269 111 408 10 236-28 405-1" fill="none" stroke="currentColor" stroke-width="18" opacity=".16"/></g><g class="ribbon-primary"><path d="M-54 126C138 36 248 169 410 95s266-56 405 17 231 43 439-71" fill="none" stroke="currentColor" stroke-width="4.2"/><path d="M-35 114c178 60 276-99 439-27s267 105 403 17 236-41 415 2" fill="none" stroke="currentColor" stroke-width="2.65"/><path d="M-25 136c188-44 284 79 435 4s263-89 395-10 264 22 440-70" fill="none" stroke="currentColor" stroke-width="2.1"/></g><g class="ribbon-fine"><path d="M-22 119C144 62 250 155 399 84s276-48 406 23 238 41 423-54" fill="none" stroke="currentColor" stroke-width="1.25"/><path d="M-7 143C166 75 265 181 419 115s249-85 390-4 251 18 412-73" fill="none" stroke="currentColor" stroke-width=".95"/><path d="M8 98c162 90 285-86 419-10s272 88 395-11 258-53 397-12" fill="none" stroke="currentColor" stroke-width=".8" opacity=".82"/></g></g></svg>';

  const transition = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','ribbon-transition');
    svg.setAttribute('viewBox','0 0 1200 210');
    svg.setAttribute('preserveAspectRatio','none');
    svg.setAttribute('aria-hidden','true');
    const curve = 'M0 111C154 54 266 165 416 108s260-72 396 9 235 33 388-43V210H0Z';
    svg.innerHTML = `<path class="ribbon-transition-bottom" d="${curve}"/><path class="ribbon-transition-soft" d="M0 111C154 54 266 165 416 108s260-72 396 9 235 33 388-43"/>`;
    return svg;
  };

  const decorateDivider = (element, fromColor, toColor) => {
    element.style.setProperty('--divider-top',fromColor);
    element.style.setProperty('--divider-bottom',toColor);
    element.innerHTML = wave;
    element.prepend(transition());
  };

  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;
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
    }),{ threshold:.22 });
    observer.observe(divider);
  };

  const renderedIds = new Set();
  content.sections.forEach((section,index) => {
    const renderer = renderers[section.layout];
    if (!renderer) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'content-section';
    wrapper.dataset.sectionId = section.id;
    wrapper.dataset.layout = section.layout;
    wrapper.innerHTML = renderer(section);
    const sectionElement = wrapper.firstElementChild;
    let id = sectionId(section.id,index);
    while (renderedIds.has(id)) id = `${id}-${index + 1}`;
    renderedIds.add(id);
    sectionElement.id = id;
    sectionElement.style.setProperty('--section-bg',model.sectionColorValue(section));
    sectionElement.classList.toggle('is-dark',model.sectionIsDark(section));
    sectionElement.dataset.titleSize = section.appearance?.titleSize || 'standard';
    sectionElement.dataset.headingDesktop = section.appearance?.headingModeDesktop || 'eyebrow';
    sectionElement.dataset.headingMobile = section.appearance?.headingModeMobile || 'eyebrow';
    wrapper.dataset.renderedId = id;
    host.append(wrapper);
  });

  const wrappers = [...host.querySelectorAll('.content-section')];
  const initializeTimelineToggle = (toggle) => {
    const tabs = [...toggle.querySelectorAll('[data-timeline-toggle-target]')];
    const section = toggle.closest('.layout-timeline-toggle');
    const panels = [...section.querySelectorAll('[data-timeline-view]')];
    const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;
    let transitionId = 0;
    const animatePanel = async (panel,className) => {
      panel.classList.add(className);
      await Promise.all(panel.getAnimations().map((animation) => animation.finished.catch(() => {})));
      panel.classList.remove(className);
    };
    const switchPanel = async (key) => {
      const target = panels.find((panel) => panel.dataset.timelineView === key);
      const current = panels.find((panel) => !panel.hidden);
      const currentTransition = ++transitionId;
      panels.forEach((panel) => {
        panel.getAnimations().forEach((animation) => animation.cancel());
        panel.classList.remove('is-entering','is-leaving','is-active');
      });
      if (!target || target === current) {
        current?.classList.add('is-active');
        return;
      }

      if (!reducedMotion) await animatePanel(current,'is-leaving');
      if (currentTransition !== transitionId) return;

      current.hidden = true;
      target.hidden = false;
      target.classList.add('is-active');
      if (!reducedMotion) await animatePanel(target,'is-entering');
    };
    const activate = (key,{ focus = false } = {}) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.timelineToggleTarget === key;
        tab.setAttribute('aria-selected',String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) tab.focus();
      });
      void switchPanel(key);
    };
    tabs.forEach((tab,index) => {
      tab.addEventListener('click',() => activate(tab.dataset.timelineToggleTarget));
      tab.addEventListener('keydown',(event) => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0
          : event.key === 'End' ? tabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        activate(tabs[nextIndex].dataset.timelineToggleTarget,{ focus:true });
      });
    });
  };
  wrappers.forEach((wrapper) => wrapper.querySelectorAll('[data-timeline-toggle]').forEach(initializeTimelineToggle));

  const initializeCarousel = (carousel) => {
    const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
    const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
    if (slides.length < 2) return;

    const delay = Math.max(3000,Number(carousel.dataset.autoplayDelay) || 5000);
    const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;
    let current = 0;
    let timer;
    let userInteracted = reducedMotion;
    let temporarilyPaused = false;

    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const show = (next) => {
      current = (next + slides.length) % slides.length;
      slides.forEach((slide,index) => {
        const active = index === current;
        slide.dataset.active = String(active);
        slide.setAttribute('aria-hidden',String(!active));
      });
      dots.forEach((dot,index) => {
        const active = index === current;
        dot.dataset.active = String(active);
        dot.setAttribute('aria-pressed',String(active));
      });
    };
    const start = () => {
      stop();
      if (!userInteracted && !temporarilyPaused) timer = setInterval(() => show(current + 1),delay);
    };
    const browse = (next) => {
      userInteracted = true;
      carousel.dataset.autoplayStopped = 'true';
      stop();
      show(next);
    };
    const stage = carousel.querySelector('.carousel-stage');
    let swipeStart;
    const finishSwipe = (event) => {
      if (!swipeStart || event.pointerId !== swipeStart.pointerId) return;
      const horizontal = event.clientX - swipeStart.x;
      const vertical = event.clientY - swipeStart.y;
      swipeStart = undefined;
      if (Math.abs(horizontal) < 48 || Math.abs(horizontal) <= Math.abs(vertical) * 1.2) return;
      browse(current + (horizontal < 0 ? 1 : -1));
    };

    carousel.querySelector('[data-carousel-previous]')?.addEventListener('click',() => browse(current - 1));
    carousel.querySelector('[data-carousel-next]')?.addEventListener('click',() => browse(current + 1));
    dots.forEach((dot,index) => dot.addEventListener('click',() => browse(index)));
    stage?.addEventListener('pointerdown',(event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      swipeStart = { pointerId:event.pointerId,x:event.clientX,y:event.clientY };
      try { stage.setPointerCapture(event.pointerId); } catch {}
    });
    stage?.addEventListener('pointerup',finishSwipe);
    stage?.addEventListener('pointercancel',() => { swipeStart = undefined; });
    stage?.addEventListener('dragstart',(event) => event.preventDefault());
    carousel.addEventListener('mouseenter',() => {
      temporarilyPaused = true;
      stop();
    });
    carousel.addEventListener('mouseleave',() => {
      temporarilyPaused = false;
      start();
    });
    carousel.addEventListener('focusin',() => {
      temporarilyPaused = true;
      stop();
    });
    carousel.addEventListener('focusout',(event) => {
      if (carousel.contains(event.relatedTarget)) return;
      temporarilyPaused = false;
      start();
    });

    start();
  };
  wrappers.forEach((wrapper) => wrapper.querySelectorAll('[data-carousel]').forEach(initializeCarousel));

  wrappers.forEach((wrapper,index) => {
    const section = content.sections.find((candidate) => candidate.id === wrapper.dataset.sectionId);
    const nextWrapper = wrappers[index + 1];
    const nextSection = nextWrapper && content.sections.find((candidate) => candidate.id === nextWrapper.dataset.sectionId);
    if (!nextSection && model.sectionColorValue(section) === 'var(--wine-950)') return;
    const divider = document.createElement('div');
    divider.className = 'ribbons';
    decorateDivider(divider,model.sectionColorValue(section),nextSection ? model.sectionColorValue(nextSection) : 'var(--wine-950)');
    wrapper.append(divider);
    reveal(divider);
  });

  if (content.sections.length) {
    decorateDivider(heroRibbon,'var(--wine-950)',model.sectionColorValue(content.sections[0]));
  } else {
    heroRibbon.hidden = true;
  }

  const navigation = document.querySelector('.nav-list');
  const items = [{ label:content.navigation.home, href:'#home' }];
  wrappers.forEach((wrapper) => {
    const section = content.sections.find((candidate) => candidate.id === wrapper.dataset.sectionId);
    if (section?.navigationLabel.trim()) items.push({ label:section.navigationLabel, href:`#${wrapper.dataset.renderedId}` });
  });
  navigation.innerHTML = items.map((item) => `<li><a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a></li>`).join('');

  const contactWrapper = wrappers.find((wrapper) => wrapper.dataset.layout === 'contact');
  const heroContact = document.querySelector('.hero-contact');
  heroContact.hidden = !contactWrapper;
  if (contactWrapper) heroContact.href = `#${contactWrapper.dataset.renderedId}`;

  const menu = document.querySelector('.menu-toggle');
  menu.addEventListener('click',() => {
    const open = navigation.classList.toggle('is-open');
    menu.setAttribute('aria-expanded',String(open));
  });
  navigation.addEventListener('click',() => {
    navigation.classList.remove('is-open');
    menu.setAttribute('aria-expanded','false');
  });
})();
