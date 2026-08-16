(() => {
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const relativeAssetPath = (value) => {
    const path = String(value || '').trim();
    return path.startsWith('/') && !path.startsWith('//') ? path.replace(/^\/+/,'') : path;
  };

  const themes = {
    wine: { label: 'Weinrot', '--wine-950': '#291117', '--wine-850': '#471a25', '--wine-750': '#6b2736', '--wine-650': '#863547', '--header-bg': '#291117', '--ribbon-hot': '#9d1c30', '--rose-300': '#dfa8ad', '--rose-100': '#f4e4e4', '--practice-bg': '#f2edeb', '--paper': '#fcfaf8', '--body-text': '#51474a', '--intro-text': '#471a25', '--line': '#dfd5d2' },
    garnet: { label: 'Granatrot', '--wine-950': '#260810', '--wine-850': '#54111e', '--wine-750': '#7e1b2a', '--wine-650': '#a92b3b', '--header-bg': '#260810', '--ribbon-hot': '#9d172c', '--rose-300': '#e7a6ab', '--rose-100': '#f9ecec', '--practice-bg': '#f3eded', '--paper': '#fffafa', '--body-text': '#51474a', '--intro-text': '#54111e', '--line': '#e6d1d2' },
    ruby: { label: 'Rubinrot', '--wine-950': '#32040f', '--wine-850': '#631028', '--wine-750': '#a90e38', '--wine-650': '#c8174a', '--header-bg': '#32040f', '--ribbon-hot': '#c61032', '--rose-300': '#ff9bb5', '--rose-100': '#fff0f3', '--practice-bg': '#f5eeee', '--paper': '#fffafa', '--body-text': '#51474a', '--intro-text': '#631028', '--line': '#efd3da' },
    crimson: { label: 'Karminrot', '--wine-950': '#31030a', '--wine-850': '#690817', '--wine-750': '#a70b24', '--wine-650': '#d11137', '--header-bg': '#31030a', '--ribbon-hot': '#d10b30', '--rose-300': '#ff9aa9', '--rose-100': '#fff0f2', '--practice-bg': '#f6eeee', '--paper': '#fffafb', '--body-text': '#51474a', '--intro-text': '#690817', '--line': '#f0d1d7' },
    scarlet: { label: 'Scharlachrot', '--wine-950': '#31080d', '--wine-850': '#69151f', '--wine-750': '#ad1826', '--wine-650': '#d33a3f', '--header-bg': '#31080d', '--ribbon-hot': '#c72224', '--rose-300': '#ffae9f', '--rose-100': '#fff1ed', '--practice-bg': '#f6efec', '--paper': '#fffaf8', '--body-text': '#51474a', '--intro-text': '#69151f', '--line': '#efd8d2' },
    vermilion: { label: 'Zinnoberrot', '--wine-950': '#32100c', '--wine-850': '#6b251b', '--wine-750': '#a43b28', '--wine-650': '#d45639', '--header-bg': '#32100c', '--ribbon-hot': '#c9402c', '--rose-300': '#ffad98', '--rose-100': '#fff1ed', '--practice-bg': '#f2edeb', '--paper': '#fffaf8', '--body-text': '#51474a', '--intro-text': '#6b251b', '--line': '#efd8cf' }
  };

  const sectionColors = [
    { key: 'paper', label: 'Papier', value: 'var(--paper)' },
    { key: 'rose', label: 'Zartrosa', value: 'var(--rose-100)' },
    { key: 'soft', label: 'Warmgrau', value: 'var(--practice-bg)' },
    { key: 'dark', label: 'Dunkel', value: 'var(--wine-950)' },
    { key: 'custom', label: 'Eigene Farbe', value: null }
  ];

  const titleSizeOptions = [
    ['tiny', 'Sehr klein'],
    ['small', 'Klein'],
    ['compact', 'Kompakt'],
    ['standard', 'Standard'],
    ['large', 'Groß']
  ];
  const heroTitleSizeLegacyValues = { tiny: 56, small: 68, compact: 80, standard: 90, large: 108 };
  const imagePositionOptions = [
    ['center top', 'Mitte oben'],
    ['center 30%', 'Oberes Drittel'],
    ['center center', 'Mitte'],
    ['center bottom', 'Mitte unten'],
    ['left center', 'Links'],
    ['right center', 'Rechts']
  ];
  const headingModeOptions = [
    ['eyebrow', 'Nur Bereichsbezeichnung'],
    ['title', 'Nur Titel'],
    ['both', 'Beides']
  ];
  const contactDetailItemFields = [
    { key: 'title', label: 'Titel', type: 'text' },
    { key: 'content', label: 'Inhalt', type: 'rich', editorRows: 2 },
    { key: 'type', label: 'Typ', type: 'select', options: [
      ['text','Text'],
      ['phone','Telefon'],
      ['email','E-Mail'],
      ['website','Website'],
      ['address','Adresse']
    ] }
  ];
  const titleAppearance = (extraFields = [],extraDefaults = {}) => ({
    appearanceFields: [
      { key: 'headingModeDesktop', label: 'Überschriftenaufbau Desktop', type: 'select', options: headingModeOptions },
      { key: 'headingModeMobile', label: 'Überschriftenaufbau Mobil', type: 'select', options: headingModeOptions },
      { key: 'titleSize', label: 'Überschriftengröße', type: 'select', options: titleSizeOptions },
      ...extraFields
    ],
    appearanceDefaults: { headingModeDesktop: 'eyebrow',headingModeMobile: 'eyebrow',titleSize: 'standard',...extraDefaults }
  });

  const layouts = {
    intro: {
      ...titleAppearance(),
      label: 'Zweispaltiger Text mit Liste',
      description: 'Große Überschrift links, Fließtext und optionale Punkte rechts.',
      defaultNavigation: 'Psychotherapie',
      defaultBackground: 'paper',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'intro', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'text', label: 'Text', type: 'rich', editorRows: 6 },
        { key: 'items', label: 'Aufzählungspunkte', type: 'collection', min: 0, max: 8, addLabel: 'Punkt hinzufügen', itemFields: [{ key: 'text', label: 'Text', type: 'rich', editorRows: 2 }] }
      ],
      defaults: { eyebrow: 'Psychotherapie', title: 'Eine große Überschrift.', intro: '', text: 'Beschreiben Sie diesen Bereich.', items: [{ text: 'Ein wichtiger Punkt' }] }
    },
    note: {
      ...titleAppearance(),
      label: 'Zweispaltiger Text mit Hervorhebung',
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
    titleCards: {
      ...titleAppearance([
        { key: 'itemTitleFont', label: 'Schriftart der Einzeltitel', type: 'select', options: [
          ['serif','Serifenschrift (wie Überschriften)'],
          ['sans','Sans-Serif (wie Einleitung)']
        ] },
        { key: 'itemTitleSize', label: 'Schriftgröße der Einzeltitel', type: 'range', min: 16, max: 36, step: 1, unit: 'px', help: 'Gilt für alle Titel in diesem Raster.' },
        { key: 'itemTitleLineGap', label: 'Abstand zwischen Titelzeilen', type: 'range', min: 0, max: 24, step: 1, unit: 'px', help: 'Gilt für manuelle Zeilenumbrüche. Automatische Umbrüche bleiben kompakt.' }
      ],{ itemTitleFont: 'serif',itemTitleSize: 25,itemTitleLineGap: 0 }),
      label: 'Titelraster',
      description: 'Einleitung mit einem kompakten Raster aus zwei bis acht Titeln.',
      defaultNavigation: 'Schwerpunkte',
      defaultBackground: 'paper',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'intro', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'items', label: 'Titel', type: 'collection', min: 2, max: 8, addLabel: 'Titel hinzufügen', itemFields: [{ key: 'title', label: 'Titel', type: 'rich', editorRows: 3 }] },
        { key: 'footer', label: 'Text unter den Titeln', type: 'rich', editorRows: 3 }
      ],
      defaults: { eyebrow: 'Schwerpunkte', title: 'Womit Sie zu mir kommen können.', intro: 'Eine kurze Einleitung zu den folgenden Themen.', items: [{ title: 'Erstes Thema' }, { title: 'Zweites Thema' }], footer: '' }
    },
    image: {
      ...titleAppearance(),
      label: 'Zweispaltiger Text mit Bild',
      description: 'Text links und ein großes Bild oder der bestehende Praxis-Platzhalter rechts.',
      defaultNavigation: '',
      defaultBackground: 'soft',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'text', label: 'Text', type: 'rich', editorRows: 5 },
        { key: 'imageSrc', label: 'Bilddatei (optional)', type: 'text' },
        { key: 'imageAlt', label: 'Alternativtext', type: 'text' },
        { key: 'imagePosition', label: 'Bildausschnitt', type: 'select', options: imagePositionOptions },
        { key: 'caption', label: 'Bildbeschriftung', type: 'text' }
      ],
      defaults: { eyebrow: 'Die Praxis', title: 'Ein ruhiger Raum für Ihr Gespräch.', text: 'Beschreiben Sie diesen Ort oder Ihr Angebot.', imageSrc: '', imageAlt: 'Foto des Praxisraums', imagePosition: 'center center', caption: 'Foto des Praxisraums folgt' }
    },
    wideImage: {
      ...titleAppearance([
        { key: 'imageStyle', label: 'Bilddarstellung', type: 'select', options: [
          ['wide-clean','Breit und randlos'],
          ['offset-shadow','Schwebend mit Schatten'],
          ['square-stage','Quadrat mit Akzentfläche'],
          ['gallery-frame','Ruhiger Galerierahmen']
        ] }
      ],{ imageStyle: 'offset-shadow' }),
      label: 'Text über breitem Bild',
      description: 'Überschrift und Text über einem Bild mit wählbarer Inszenierung.',
      defaultNavigation: 'Praxis',
      defaultBackground: 'soft',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'text', label: 'Text', type: 'rich', editorRows: 5 },
        { key: 'images', label: 'Bilder im Karussell', type: 'collection', min: 1, max: 10, addLabel: 'Bild hinzufügen', itemFields: [
          { key: 'imageSrc', label: 'Bilddatei', type: 'text' },
          { key: 'imageAlt', label: 'Alternativtext', type: 'text' },
          { key: 'imagePosition', label: 'Bildausschnitt', type: 'select', options: imagePositionOptions },
          { key: 'caption', label: 'Bildbeschriftung', type: 'text' }
        ] }
      ],
      defaults: { eyebrow: 'Die Praxis', title: 'Ein ruhiger Ort für Ihr Gespräch.', text: 'Beschreiben Sie diesen Ort oder Ihr Angebot.', images: [{ imageSrc: '', imageAlt: 'Foto des Praxisraums', imagePosition: 'center center', caption: '' }] }
    },
    topics: {
      ...titleAppearance([
        { key: 'listStyle', label: 'Darstellung der Auflistung', type: 'select', options: [
          ['numbered-grid','Nummeriert, zweispaltig'],
          ['accent-grid','Akzentpunkte, zweispaltig'],
          ['editorial-list','Ruhige Zeilen, einspaltig'],
          ['gradient-pills','Geordnete Verlaufspills'],
          ['gradient-bands','Sanfte Verlaufsbänder'],
          ['clean-tiles','Ruhige Kacheln'],
          ['playful-pills','Versetzte Akzent-Pills'],
          ['scattered-cards','Lockeres Kartenmosaik']
        ] },
        { key: 'gradientStart', label: 'Verlaufsfarbe Start', type: 'color', visibleWhen: { key: 'listStyle',values: ['gradient-pills','gradient-bands'] } },
        { key: 'gradientEnd', label: 'Verlaufsfarbe Ende', type: 'color', visibleWhen: { key: 'listStyle',values: ['gradient-pills','gradient-bands'] } }
      ],{ listStyle: 'numbered-grid',gradientStart: '#fff0f2',gradientEnd: '#d11137' }),
      label: 'Auflistung',
      description: 'Eine flexible Auflistung mit wählbarer ein- oder zweispaltiger Darstellung.',
      defaultNavigation: 'Schwerpunkte',
      defaultBackground: 'rose',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'intro', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'items', label: 'Einträge', type: 'collection', min: 2, max: 10, addLabel: 'Eintrag hinzufügen', itemFields: [{ key: 'text', label: 'Eintrag', type: 'text' }] }
      ],
      defaults: { eyebrow: 'Schwerpunkte', title: 'Wobei ich Sie begleiten kann.', intro: 'Eine kurze Einleitung zu den folgenden Themen.', items: [{ text: 'Erstes Thema' }, { text: 'Zweites Thema' }] }
    },
    timeline: {
      ...titleAppearance([
        { key: 'timelineStyle', label: 'Darstellung der Zeitleiste', type: 'select', options: [
          ['classic-lines','Klassische Linien'],
          ['milestone-cards','Meilenstein-Karten'],
          ['year-focus','Große Jahreszahlen'],
          ['alternating-path','Wechselnder Pfad'],
          ['soft-steps','Sanfte Etappen']
        ] },
        { key: 'timelineTransitionDuration', label: 'Dauer des Zeitleistenwechsels', type: 'range', min: 0, max: 2000, step: 50, unit: 'ms', help: 'Gesamtdauer des Aus- und Einblendens. 0 ms deaktiviert den Übergang.', visibleWhen: { scope: 'appearance',key: 'timelineStyle',values: ['alternating-path'] } }
      ],{ timelineStyle: 'classic-lines',timelineTransitionDuration: 600 }),
      label: 'Zeitleiste',
      description: 'Eine flexible chronologische Liste mit verschiedenen Darstellungen für Ausbildung oder Berufserfahrung.',
      defaultNavigation: 'Über mich',
      defaultBackground: 'paper',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'intro', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'items', label: 'Stationen', type: 'collection', min: 2, max: 12, addLabel: 'Station hinzufügen', itemFields: [{ key: 'period', label: 'Zeitraum', type: 'text' }, { key: 'title', label: 'Station', type: 'text' }, { key: 'detail', label: 'Zusatz', type: 'text' }] },
        { key: 'primaryViewLabel', label: 'Umschalter: erste Ansicht', type: 'text', visibleWhen: { scope: 'appearance',key: 'timelineStyle',values: ['alternating-path'] } },
        { key: 'secondaryViewLabel', label: 'Umschalter: zweite Ansicht', type: 'text', visibleWhen: { scope: 'appearance',key: 'timelineStyle',values: ['alternating-path'] } },
        { key: 'secondaryItems', label: 'Stationen der zweiten Ansicht', type: 'collection', min: 0, max: 12, addLabel: 'Station hinzufügen', visibleWhen: { scope: 'appearance',key: 'timelineStyle',values: ['alternating-path'] }, itemFields: [{ key: 'period', label: 'Zeitraum', type: 'text' }, { key: 'title', label: 'Station', type: 'text' }, { key: 'detail', label: 'Zusatz', type: 'text' }] }
      ],
      defaults: { eyebrow: 'Über mich', title: 'Ausbildung und Erfahrung.', intro: 'Eine kurze Einleitung zum Werdegang.', items: [{ period: 'Seit 2024', title: 'Erste Station', detail: 'Ort oder Institution' }, { period: '2023', title: 'Zweite Station', detail: 'Ort oder Institution' }], primaryViewLabel: 'Berufserfahrung',secondaryViewLabel: 'Ausbildung',secondaryItems: [] }
    },
    pricing: {
      ...titleAppearance(),
      label: 'Zweispaltige Preisliste',
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
    conditions: {
      ...titleAppearance([
        { key: 'highlightTextSize', label: 'Schriftgröße des hervorgehobenen Texts', type: 'range', min: 22, max: 80, step: 1, unit: 'px' },
        { key: 'highlightPaddingTop', label: 'Abstand oben in der Hervorhebungsbox', type: 'range', min: 0, max: 80, step: 1, unit: 'px' },
        { key: 'highlightPaddingBottom', label: 'Abstand unten in der Hervorhebungsbox', type: 'range', min: 0, max: 80, step: 1, unit: 'px' },
        { key: 'highlightCenterContent', label: 'Inhalt horizontal zentrieren', type: 'checkbox', help: 'Zentriert Hinweiszeile, hervorgehobenen Text und Detailtext gemeinsam.' },
        { key: 'highlightGradientStart', label: 'Verlaufsfarbe Start', type: 'color' },
        { key: 'highlightGradientEnd', label: 'Verlaufsfarbe Ende', type: 'color' }
      ],{ highlightTextSize: 50,highlightPaddingTop: 32,highlightPaddingBottom: 32,highlightCenterContent: false,highlightGradientStart: '#f4e4e4',highlightGradientEnd: '#fcfaf8' }),
      label: 'Rahmenbedingungen mit Hervorhebung',
      description: 'Ein quadratischer Hinweis mit einstellbarem Verlauf und kompakte Informationen zu Dauer, Absage und Versicherung.',
      defaultNavigation: 'Rahmenbedingungen',
      defaultBackground: 'paper',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'intro', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'highlightLabel', label: 'Kleine Hinweiszeile', type: 'text' },
        { key: 'highlightText', label: 'Hervorgehobener Text', type: 'rich', editorRows: 3 },
        { key: 'highlightDetail', label: 'Detailtext', type: 'rich', editorRows: 4 },
        { key: 'items', label: 'Rahmenbedingungen', type: 'collection', min: 2, max: 6, addLabel: 'Information hinzufügen', itemFields: [{ key: 'title', label: 'Titel', type: 'text' }, { key: 'text', label: 'Beschreibung', type: 'rich', editorRows: 3 }] },
        { key: 'note', label: 'Abschließender Hinweis (optional)', type: 'rich', editorRows: 3 }
      ],
      defaults: {
        eyebrow: 'Rahmenbedingungen',
        title: 'Klarheit von Anfang an.',
        intro: 'Damit Sie gut planen können, finden Sie hier die wichtigsten organisatorischen Informationen.',
        highlightLabel: 'Gut zu wissen',
        highlightText: 'Klarheit schafft Vertrauen.',
        highlightDetail: 'Offene Fragen und individuelle Vereinbarungen besprechen wir in Ruhe im Erstgespräch.',
        items: [
          { title: 'Absageregelung', text: 'Termine können bis 24 Stunden vorher kostenfrei abgesagt werden.' },
          { title: 'Versicherung', text: 'Bitte klären Sie eine mögliche Kostenübernahme direkt mit Ihrer Versicherung.' }
        ],
        note: ''
      }
    },
    contact: {
      ...titleAppearance([
        { key: 'contactTextBelowTitleDesktop', label: 'Einleitung unter dem Titel (Desktop)', type: 'checkbox', help: 'Setzt den Kontakttext auf Desktop unter den Titel und über die volle Breite.' }
      ],{ contactTextBelowTitleDesktop: false }),
      label: 'Kontaktblock mit Karte',
      description: 'Kontakttext, Adresse, Telefon, E-Mail und eine Kartenfläche.',
      defaultNavigation: 'Kontakt',
      defaultBackground: 'dark',
      fields: [
        { key: 'eyebrow', label: 'Bereichsbezeichnung', type: 'text' },
        { key: 'title', label: 'Titel', type: 'rich', editorRows: 3 },
        { key: 'text', label: 'Einleitung', type: 'rich', editorRows: 4 },
        { key: 'personalDetailsTitle', label: 'Spaltentitel: Persönlicher Kontakt', type: 'text' },
        { key: 'personalDetails', label: 'Persönliche Kontaktdaten', type: 'collection', min: 0, max: 10, addLabel: 'Zeile hinzufügen', itemFields: contactDetailItemFields },
        { key: 'officeDetailsTitle', label: 'Spaltentitel: Praxis', type: 'text' },
        { key: 'officeDetails', label: 'Kontaktdaten der Praxis', type: 'collection', min: 0, max: 10, addLabel: 'Zeile hinzufügen', itemFields: contactDetailItemFields },
        { key: 'mapEmbed', label: 'Google-Maps-Einbettungs-URL (optional)', type: 'text' },
        { key: 'mapLink', label: 'Externer Kartenlink (optional)', type: 'text' },
        { key: 'mapLabel', label: 'Beschriftung des Kartenlinks', type: 'text' }
      ],
      defaults: { eyebrow: 'Kontakt', title: 'Nehmen Sie Kontakt auf.', text: 'Beschreiben Sie, wie Sie erreichbar sind.', personalDetailsTitle: 'Persönlicher Kontakt',personalDetails: [{ title: 'Telefon',content: '+43 660 123 45 67',type: 'phone' },{ title: 'E-Mail',content: 'praxis@beispiel.at',type: 'email' }],officeDetailsTitle: 'Praxis',officeDetails: [{ title: 'Adresse',content: 'Musterstraße 12\n1010 Wien',type: 'address' }],mapEmbed: '',mapLink: 'https://www.openstreetmap.org/',mapLabel: 'Karte in OpenStreetMap öffnen' }
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
    const sourceContent = section?.content ? clone(section.content) : {};
    if (layout === 'wideImage' && !Array.isArray(sourceContent.images)) {
      sourceContent.images = [{
        imageSrc: sourceContent.imageSrc || '',
        imageAlt: sourceContent.imageAlt || 'Foto des Praxisraums',
        imagePosition: sourceContent.imagePosition || 'center center',
        caption: sourceContent.caption || ''
      }];
    }
    if (layout === 'wideImage') {
      delete sourceContent.imageSrc;
      delete sourceContent.imageAlt;
      delete sourceContent.imagePosition;
      delete sourceContent.caption;
    }
    if (layout === 'conditions') {
      delete sourceContent.feeLabel;
      delete sourceContent.feeAmount;
      delete sourceContent.feeMeta;
    }
    const content = mergeDefaults(definition.defaults, sourceContent);
    const sourceAppearance = { ...(section?.appearance || {}) };
    if (headingModeOptions.some(([value]) => value === sourceAppearance.headingMode)) {
      if (!sourceAppearance.headingModeDesktop) sourceAppearance.headingModeDesktop = sourceAppearance.headingMode;
      if (!sourceAppearance.headingModeMobile) sourceAppearance.headingModeMobile = sourceAppearance.headingMode;
    }
    delete sourceAppearance.headingMode;
    const appearance = mergeDefaults(definition.appearanceDefaults || {}, sourceAppearance);
    (definition.appearanceFields || []).forEach((field) => {
      if (field.type === 'select' && !field.options.some(([value]) => value === appearance[field.key])) {
        appearance[field.key] = definition.appearanceDefaults?.[field.key] || field.options[0]?.[0] || '';
      }
      if (field.type === 'color' && !/^#[0-9a-f]{6}$/i.test(appearance[field.key] || '')) {
        appearance[field.key] = definition.appearanceDefaults?.[field.key] || '#000000';
      }
      if (field.type === 'checkbox') appearance[field.key] = appearance[field.key] === true;
      if (field.type === 'range') {
        const fallback = Number(definition.appearanceDefaults?.[field.key]) || field.min || 0;
        const value = Number(appearance[field.key]);
        appearance[field.key] = Math.min(field.max,Math.max(field.min,Number.isFinite(value) ? value : fallback));
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
    if (layout === 'image') content.imageSrc = relativeAssetPath(content.imageSrc);
    if (layout === 'wideImage') content.images.forEach((image) => { image.imageSrc = relativeAssetPath(image.imageSrc); });
    return {
      id: String(section?.id || `section-${index + 1}`),
      layout,
      internalName: String(section?.internalName || definition.label),
      navigationLabel: String(section?.navigationLabel ?? definition.defaultNavigation),
      background,
      customBackground: /^#[0-9a-f]{6}$/i.test(section?.customBackground || '') ? section.customBackground : '#f7f2ef',
      appearance,
      content
    };
  };

  const normalize = (input) => {
    const source = input && typeof input === 'object' ? clone(input) : {};
    const sections = Array.isArray(source.sections) ? source.sections : [];
    const heroSource = source.hero && typeof source.hero === 'object' ? source.hero : {};
    const hero = mergeDefaults({ eyebrow: '', title: '', sentence: '', contactButton: 'Kontakt aufnehmen', titleSize: 90, titleLineGap: 0, titleWidthDesktop: 42, eyebrowTitleSpacingDesktop: 15, eyebrowTitleSpacingMobile: 15 }, heroSource);
    const heroImage = mergeDefaults({ src: 'assets/carina_close2.JPG', alt: '', layout: 'portrait', blend: 'duotone', position: 'center top', mobileLayout: 'portrait', mobilePosition: 'center center', overlay: 'soft', blendWidthDesktop: 32, blendWidthMobile: 28 }, source.heroImage);
    const sectionSpacing = mergeDefaults({ desktop: 104,mobile: 64 },source.sectionSpacing);
    const legacyHeroTitleSize = heroTitleSizeLegacyValues[hero.titleSize];
    const numericHeroTitleSize = Number(hero.titleSize);
    hero.titleSize = Math.min(120,Math.max(40,Number.isFinite(numericHeroTitleSize) ? numericHeroTitleSize : legacyHeroTitleSize || heroTitleSizeLegacyValues.standard));
    const numericHeroTitleLineGap = Number(hero.titleLineGap);
    hero.titleLineGap = Math.min(40,Math.max(0,Number.isFinite(numericHeroTitleLineGap) ? numericHeroTitleLineGap : 0));
    hero.titleWidthDesktop = Math.min(55,Math.max(30,Number(hero.titleWidthDesktop) || 42));
    const legacyEyebrowTitleSpacing = Number(heroSource.eyebrowTitleSpacing);
    if (Number.isFinite(legacyEyebrowTitleSpacing)) {
      if (!Object.prototype.hasOwnProperty.call(heroSource,'eyebrowTitleSpacingDesktop')) hero.eyebrowTitleSpacingDesktop = legacyEyebrowTitleSpacing;
      if (!Object.prototype.hasOwnProperty.call(heroSource,'eyebrowTitleSpacingMobile')) hero.eyebrowTitleSpacingMobile = legacyEyebrowTitleSpacing;
    }
    const normalizeHeroSpacing = (value) => {
      const numeric = Number(value);
      return Math.min(80,Math.max(0,Number.isFinite(numeric) ? numeric : 15));
    };
    hero.eyebrowTitleSpacingDesktop = normalizeHeroSpacing(hero.eyebrowTitleSpacingDesktop);
    hero.eyebrowTitleSpacingMobile = normalizeHeroSpacing(hero.eyebrowTitleSpacingMobile);
    delete hero.eyebrowTitleSpacing;
    if (!['portrait','landscape','background'].includes(heroImage.layout)) heroImage.layout = 'portrait';
    if (!['portrait','landscape','hidden'].includes(heroImage.mobileLayout)) heroImage.mobileLayout = 'portrait';
    if (!['duotone','natural','mono','warm'].includes(heroImage.blend)) heroImage.blend = 'duotone';
    if (!['soft','strong','none'].includes(heroImage.overlay)) heroImage.overlay = 'soft';
    heroImage.src = relativeAssetPath(heroImage.src);
    heroImage.blendWidthDesktop = Math.min(80,Math.max(5,Number(heroImage.blendWidthDesktop) || 32));
    heroImage.blendWidthMobile = Math.min(80,Math.max(5,Number(heroImage.blendWidthMobile) || 28));
    sectionSpacing.desktop = Math.min(180,Math.max(48,Number(sectionSpacing.desktop) || 104));
    sectionSpacing.mobile = Math.min(120,Math.max(36,Number(sectionSpacing.mobile) || 64));
    return {
      schemaVersion: 3,
      colorTheme: themes[source.colorTheme] ? source.colorTheme : 'wine',
      customColors: source.customColors && typeof source.customColors === 'object' ? source.customColors : {},
      practiceName: String(source.practiceName || 'Praxis für Psychotherapie'),
      practitionerName: String(source.practitionerName || ''),
      siteIcon: relativeAssetPath(source.siteIcon || 'assets/icon4_tiny.png'),
      showHeaderIcon: source.showHeaderIcon !== false,
      navigation: { home: String(source.navigation?.home || 'Startseite') },
      hero,
      heroImage,
      sectionSpacing,
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
    titleSizeOptions,
    normalize,
    normalizeSection,
    createSection,
    sectionColorValue,
    sectionIsDark,
    clone
  };
})();
