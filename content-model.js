(() => {
  const clone = (value) => JSON.parse(JSON.stringify(value));

  const themes = {
    wine: { label: 'Weinrot', '--wine-950': '#291117', '--wine-850': '#471a25', '--wine-750': '#6b2736', '--wine-650': '#863547', '--header-bg': '#291117', '--ribbon-hot': '#9d1c30', '--rose-300': '#dfa8ad', '--rose-100': '#f4e4e4', '--practice-bg': '#f2edeb', '--paper': '#fcfaf8', '--line': '#dfd5d2' },
    garnet: { label: 'Granatrot', '--wine-950': '#260810', '--wine-850': '#54111e', '--wine-750': '#7e1b2a', '--wine-650': '#a92b3b', '--header-bg': '#260810', '--ribbon-hot': '#9d172c', '--rose-300': '#e7a6ab', '--rose-100': '#f9ecec', '--practice-bg': '#f3eded', '--paper': '#fffafa', '--line': '#e6d1d2' },
    ruby: { label: 'Rubinrot', '--wine-950': '#32040f', '--wine-850': '#631028', '--wine-750': '#a90e38', '--wine-650': '#c8174a', '--header-bg': '#32040f', '--ribbon-hot': '#c61032', '--rose-300': '#ff9bb5', '--rose-100': '#fff0f3', '--practice-bg': '#f5eeee', '--paper': '#fffafa', '--line': '#efd3da' },
    crimson: { label: 'Karminrot', '--wine-950': '#31030a', '--wine-850': '#690817', '--wine-750': '#a70b24', '--wine-650': '#d11137', '--header-bg': '#31030a', '--ribbon-hot': '#d10b30', '--rose-300': '#ff9aa9', '--rose-100': '#fff0f2', '--practice-bg': '#f6eeee', '--paper': '#fffafb', '--line': '#f0d1d7' },
    scarlet: { label: 'Scharlachrot', '--wine-950': '#31080d', '--wine-850': '#69151f', '--wine-750': '#ad1826', '--wine-650': '#d33a3f', '--header-bg': '#31080d', '--ribbon-hot': '#c72224', '--rose-300': '#ffae9f', '--rose-100': '#fff1ed', '--practice-bg': '#f6efec', '--paper': '#fffaf8', '--line': '#efd8d2' },
    vermilion: { label: 'Zinnoberrot', '--wine-950': '#32100c', '--wine-850': '#6b251b', '--wine-750': '#a43b28', '--wine-650': '#d45639', '--header-bg': '#32100c', '--ribbon-hot': '#c9402c', '--rose-300': '#ffad98', '--rose-100': '#fff1ed', '--practice-bg': '#f2edeb', '--paper': '#fffaf8', '--line': '#efd8cf' }
  };

  const sectionColors = [
    { key: 'paper', label: 'Papier', value: 'var(--paper)' },
    { key: 'rose', label: 'Zartrosa', value: 'var(--rose-100)' },
    { key: 'soft', label: 'Warmgrau', value: 'var(--practice-bg)' },
    { key: 'dark', label: 'Dunkel', value: 'var(--wine-950)' },
    { key: 'custom', label: 'Eigene Farbe', value: null }
  ];

  const titleSizeOptions = [
    ['compact', 'Kompakt'],
    ['standard', 'Standard'],
    ['large', 'Groß']
  ];
  const titleAppearance = () => ({
    appearanceFields: [
      { key: 'titleSize', label: 'Überschriftengröße', type: 'select', options: titleSizeOptions }
    ],
    appearanceDefaults: { titleSize: 'standard' }
  });

  const layouts = {
    intro: {
      ...titleAppearance(),
      label: 'Text und Aufzählung',
      description: 'Große Überschrift links, Fließtext und optionale Punkte rechts.',
      defaultNavigation: 'Psychotherapie',
      defaultBackground: 'paper',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'text', label: 'Text', type: 'rich', editorRows: 6 },
        { key: 'items', label: 'Aufzählungspunkte', type: 'collection', min: 0, max: 8, addLabel: 'Punkt hinzufügen', itemFields: [{ key: 'text', label: 'Text', type: 'rich', editorRows: 2 }] }
      ],
      defaults: { eyebrow: 'Psychotherapie', title: 'Eine große Überschrift.', text: 'Beschreiben Sie diesen Bereich.', items: [{ text: 'Ein wichtiger Punkt' }] }
    },
    note: {
      ...titleAppearance(),
      label: 'Text mit hervorgehobenem Hinweis',
      description: 'Textspalte mit einer großen, seitlich abgesetzten Notiz.',
      defaultNavigation: '',
      defaultBackground: 'rose',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'text', label: 'Text', type: 'rich', editorRows: 5 },
        { key: 'note', label: 'Hervorgehobener Text', type: 'rich', editorRows: 4 }
      ],
      defaults: { eyebrow: 'Psychotherapie', title: 'Eine große Überschrift.', text: 'Beschreiben Sie diesen Bereich.', note: 'Dieser Text wird besonders hervorgehoben.' }
    },
    cards: {
      ...titleAppearance(),
      label: 'Kartenraster',
      description: 'Einleitung mit einem Raster aus zwei bis sechs Karten.',
      defaultNavigation: 'Schwerpunkte',
      defaultBackground: 'paper',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'intro', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'items', label: 'Karten', type: 'collection', min: 2, max: 6, addLabel: 'Karte hinzufügen', itemFields: [{ key: 'title', label: 'Titel', type: 'text' }, { key: 'text', label: 'Beschreibung', type: 'rich', editorRows: 2 }] }
      ],
      defaults: { eyebrow: 'Schwerpunkte', title: 'Womit Sie zu mir kommen können.', intro: 'Eine kurze Einleitung zu den folgenden Themen.', items: [{ title: 'Erstes Thema', text: 'Kurze Beschreibung.' }, { title: 'Zweites Thema', text: 'Kurze Beschreibung.' }] }
    },
    image: {
      ...titleAppearance(),
      label: 'Text mit Bild',
      description: 'Text links und ein großes Bild oder der bestehende Praxis-Platzhalter rechts.',
      defaultNavigation: '',
      defaultBackground: 'soft',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'text', label: 'Text', type: 'rich', editorRows: 5 },
        { key: 'imageSrc', label: 'Bilddatei (optional)', type: 'text' },
        { key: 'imageAlt', label: 'Alternativtext', type: 'text' },
        { key: 'caption', label: 'Bildbeschriftung', type: 'text' }
      ],
      defaults: { eyebrow: 'Die Praxis', title: 'Ein ruhiger Raum für Ihr Gespräch.', text: 'Beschreiben Sie diesen Ort oder Ihr Angebot.', imageSrc: '', imageAlt: 'Foto des Praxisraums', caption: 'Foto des Praxisraums folgt' }
    },
    wideImage: {
      ...titleAppearance(),
      label: 'Text mit breitem Bild',
      description: 'Einleitung über einer großzügigen, querformatigen Fotofläche.',
      defaultNavigation: 'Praxis',
      defaultBackground: 'soft',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'text', label: 'Text', type: 'rich', editorRows: 5 },
        { key: 'imageSrc', label: 'Bilddatei', type: 'text' },
        { key: 'imageAlt', label: 'Alternativtext', type: 'text' },
        { key: 'caption', label: 'Bildbeschriftung', type: 'text' }
      ],
      defaults: { eyebrow: 'Die Praxis', title: 'Ein ruhiger Ort für Ihr Gespräch.', text: 'Beschreiben Sie diesen Ort oder Ihr Angebot.', imageSrc: '', imageAlt: 'Foto des Praxisraums', caption: '' }
    },
    topics: {
      ...titleAppearance(),
      label: 'Kompakte Themenliste',
      description: 'Eine ruhige, flexible Liste für mehrere Schwerpunkte ohne erzwungene Beschreibungen.',
      defaultNavigation: 'Schwerpunkte',
      defaultBackground: 'rose',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'intro', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'items', label: 'Themen', type: 'collection', min: 2, max: 10, addLabel: 'Thema hinzufügen', itemFields: [{ key: 'text', label: 'Thema', type: 'text' }] }
      ],
      defaults: { eyebrow: 'Schwerpunkte', title: 'Wobei ich Sie begleiten kann.', intro: 'Eine kurze Einleitung zu den folgenden Themen.', items: [{ text: 'Erstes Thema' }, { text: 'Zweites Thema' }] }
    },
    timeline: {
      ...titleAppearance(),
      label: 'Werdegang',
      description: 'Eine flexible chronologische Liste für Ausbildung oder Berufserfahrung.',
      defaultNavigation: 'Über mich',
      defaultBackground: 'paper',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'intro', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'items', label: 'Stationen', type: 'collection', min: 2, max: 12, addLabel: 'Station hinzufügen', itemFields: [{ key: 'period', label: 'Zeitraum', type: 'text' }, { key: 'title', label: 'Station', type: 'text' }, { key: 'detail', label: 'Zusatz', type: 'text' }] }
      ],
      defaults: { eyebrow: 'Über mich', title: 'Ausbildung und Erfahrung.', intro: 'Eine kurze Einleitung zum Werdegang.', items: [{ period: 'Seit 2024', title: 'Erste Station', detail: 'Ort oder Institution' }, { period: '2023', title: 'Zweite Station', detail: 'Ort oder Institution' }] }
    },
    pricing: {
      ...titleAppearance(),
      label: 'Preisliste',
      description: 'Einleitung links und eine strukturierte Liste aus Leistungen und Preisen rechts.',
      defaultNavigation: 'Kosten',
      defaultBackground: 'paper',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'intro', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'items', label: 'Leistungen', type: 'collection', min: 1, max: 8, addLabel: 'Leistung hinzufügen', itemFields: [{ key: 'name', label: 'Leistung', type: 'text' }, { key: 'duration', label: 'Dauer', type: 'text' }, { key: 'price', label: 'Preis', type: 'text' }] },
        { key: 'note', label: 'Hinweis', type: 'rich', editorRows: 3 }
      ],
      defaults: { eyebrow: 'Kosten', title: 'Transparent von Anfang an.', intro: 'Beschreiben Sie hier die Rahmenbedingungen.', items: [{ name: 'Einzeltherapie', duration: '50 Minuten', price: 'EUR 110' }], note: 'Ergänzender Hinweis zu Kosten oder Erstattung.' }
    },
    contact: {
      ...titleAppearance(),
      label: 'Kontakt',
      description: 'Kontakttext, Adresse, Telefon, E-Mail und eine Kartenfläche.',
      defaultNavigation: 'Kontakt',
      defaultBackground: 'dark',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'text', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'addressLine1', label: 'Straße', type: 'text' },
        { key: 'addressLine2', label: 'Postleitzahl und Ort', type: 'text' },
        { key: 'phoneLabel', label: 'Telefonnummer', type: 'text' },
        { key: 'phoneHref', label: 'Telefon-Link', type: 'text' },
        { key: 'email', label: 'E-Mail', type: 'text' },
        { key: 'mapLink', label: 'OpenStreetMap-Link', type: 'text' },
        { key: 'mapLabel', label: 'Beschriftung des Kartenlinks', type: 'text' }
      ],
      defaults: { eyebrow: 'Kontakt', title: 'Nehmen Sie Kontakt auf.', text: 'Beschreiben Sie, wie Sie erreichbar sind.', addressLine1: 'Musterstraße 12', addressLine2: '1010 Wien', phoneLabel: '+43 660 123 45 67', phoneHref: '+436601234567', email: 'praxis@beispiel.at', mapLink: 'https://www.openstreetmap.org/', mapLabel: 'Karte in OpenStreetMap öffnen' }
    }
  };

  const mergeDefaults = (defaults, value) => {
    const source = value && typeof value === 'object' ? value : {};
    const result = clone(defaults);
    Object.keys(source).forEach((key) => {
      if (Array.isArray(source[key])) result[key] = clone(source[key]);
      else if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) result[key] = mergeDefaults(result[key] || {}, source[key]);
      else result[key] = source[key];
    });
    return result;
  };

  const normalizeSection = (section, index) => {
    const layout = layouts[section?.layout] ? section.layout : 'intro';
    const definition = layouts[layout];
    const background = sectionColors.some((color) => color.key === section?.background) ? section.background : definition.defaultBackground;
    const content = mergeDefaults(definition.defaults, section?.content);
    const appearance = mergeDefaults(definition.appearanceDefaults || {}, section?.appearance);
    (definition.appearanceFields || []).forEach((field) => {
      if (field.type === 'select' && !field.options.some(([value]) => value === appearance[field.key])) {
        appearance[field.key] = definition.appearanceDefaults?.[field.key] || field.options[0]?.[0] || '';
      }
    });
    definition.fields.filter((field) => field.type === 'collection').forEach((field) => {
      const sourceItems = Array.isArray(content[field.key]) ? content[field.key] : [];
      const maximum = Number.isFinite(field.max) ? field.max : sourceItems.length;
      const items = sourceItems.slice(0,maximum);
      const template = definition.defaults[field.key]?.[0] || Object.fromEntries(field.itemFields.map((itemField) => [itemField.key,'']));
      while (items.length < (field.min || 0)) items.push(clone(template));
      content[field.key] = items.map((item) => mergeDefaults(template,item));
    });
    return {
      id: String(section?.id || `section-${index + 1}`),
      layout,
      navigationLabel: String(section?.navigationLabel ?? definition.defaultNavigation),
      background,
      customBackground: /^#[0-9a-f]{6}$/i.test(section?.customBackground || '') ? section.customBackground : '#f7f2ef',
      appearance,
      content
    };
  };

  const migrateLegacySections = (source) => {
    const legacy = [
      {
        key: 'intro',
        section: {
          id: 'psychotherapy',
          layout: 'intro',
          navigationLabel: source.navigation?.psychotherapy || 'Psychotherapie',
          background: 'paper',
          content: {
            eyebrow: source.therapy?.label || 'Psychotherapie',
            title: source.introduction?.title || '',
            text: source.introduction?.text || '',
            items: (source.introduction?.items || []).filter(Boolean).map((text) => ({ text }))
          }
        }
      },
      {
        key: 'therapy',
        section: {
          id: 'therapy-details',
          layout: 'note',
          navigationLabel: '',
          background: 'rose',
          content: {
            eyebrow: source.therapy?.label || '',
            title: source.therapy?.title || '',
            text: source.therapy?.text || '',
            note: source.therapy?.note || ''
          }
        }
      },
      {
        key: 'focusAreas',
        section: {
          id: 'focus-areas',
          layout: 'cards',
          navigationLabel: source.navigation?.focusAreas || 'Schwerpunkte',
          background: 'paper',
          content: {
            eyebrow: source.focusAreas?.label || '',
            title: source.focusAreas?.title || '',
            intro: source.focusAreas?.intro || '',
            items: (source.focusAreas?.areas || []).map(([title, text]) => ({ title, text }))
          }
        }
      },
      {
        key: 'practice',
        section: {
          id: 'practice',
          layout: 'image',
          navigationLabel: '',
          background: 'soft',
          content: {
            eyebrow: source.practice?.label || '',
            title: source.practice?.title || '',
            text: source.practice?.text || '',
            imageSrc: source.practice?.imageSrc || '',
            imageAlt: source.practice?.imageAlt || '',
            caption: source.practice?.caption || 'Foto des Praxisraums folgt'
          }
        }
      },
      {
        key: 'costs',
        section: {
          id: 'costs',
          layout: 'pricing',
          navigationLabel: source.navigation?.costs || 'Kosten',
          background: 'paper',
          content: {
            eyebrow: source.costs?.label || '',
            title: source.costs?.title || '',
            intro: source.costs?.intro || '',
            items: (source.costs?.entries || []).map(([name, duration, price]) => ({ name, duration, price })),
            note: source.costs?.reimbursement || ''
          }
        }
      },
      {
        key: 'contact',
        section: {
          id: 'contact',
          layout: 'contact',
          navigationLabel: source.navigation?.contact || 'Kontakt',
          background: 'dark',
          content: {
            eyebrow: source.contact?.label || '',
            title: source.contact?.title || '',
            text: source.contact?.text || '',
            addressLine1: source.contact?.address?.[0] || '',
            addressLine2: source.contact?.address?.[1] || '',
            phoneLabel: source.contact?.phoneLabel || '',
            phoneHref: source.contact?.phoneHref || '',
            email: source.contact?.email || '',
            mapLink: source.contact?.mapLink || '',
            mapLabel: source.contact?.mapLabel || ''
          }
        }
      }
    ];
    const layout = source.sectionLayout || {};
    const order = [...new Set([...(layout.order || []), ...legacy.map(({ key }) => key)])];
    const enabled = { intro: true, therapy: true, focusAreas: true, practice: true, costs: true, contact: true, ...(layout.enabled || {}) };
    return order.map((key) => legacy.find((entry) => entry.key === key)).filter(Boolean).filter(({ key }) => enabled[key]).map(({ section }) => section);
  };

  const normalize = (input) => {
    const source = input && typeof input === 'object' ? clone(input) : {};
    const sections = Array.isArray(source.sections) ? source.sections : migrateLegacySections(source);
    const hero = mergeDefaults({ eyebrow: '', title: '', sentence: '', contactButton: 'Kontakt aufnehmen', titleSize: 'standard' }, source.hero);
    if (!titleSizeOptions.some(([value]) => value === hero.titleSize)) hero.titleSize = 'standard';
    return {
      schemaVersion: 3,
      colorTheme: themes[source.colorTheme] ? source.colorTheme : 'wine',
      customColors: source.customColors && typeof source.customColors === 'object' ? source.customColors : {},
      practiceName: String(source.practiceName || 'Praxis für Psychotherapie'),
      practitionerName: String(source.practitionerName || ''),
      navigation: { home: String(source.navigation?.home || 'Startseite') },
      hero,
      heroImage: mergeDefaults({ src: 'therapist.png', alt: '', layout: 'portrait', blend: 'duotone', position: 'center top', overlay: 'soft' }, source.heroImage),
      sections: sections.map(normalizeSection),
      footer: mergeDefaults({ copyright: '' }, source.footer)
    };
  };

  const createSection = (layout, id) => normalizeSection({ id, layout }, 0);
  const sectionColorValue = (section) => section.background === 'custom'
    ? (/^#[0-9a-f]{6}$/i.test(section.customBackground) ? section.customBackground : '#f7f2ef')
    : sectionColors.find((color) => color.key === section.background)?.value || 'var(--paper)';
  const sectionIsDark = (section) => {
    if (section.background === 'dark') return true;
    if (section.background !== 'custom' || !/^#[0-9a-f]{6}$/i.test(section.customBackground)) return false;
    const value = section.customBackground.slice(1);
    const [red, green, blue] = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
    return (red * 299 + green * 587 + blue * 114) / 1000 < 138;
  };

  window.practiceContentModel = {
    themes,
    layouts,
    sectionColors,
    normalize,
    normalizeSection,
    createSection,
    sectionColorValue,
    sectionIsDark,
    clone
  };
})();
