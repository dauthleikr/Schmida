# Praxis fuer Psychotherapie

This is a static website that can be published directly with GitHub Pages or any static web host.

## Edit content

1. Open `editor.html` in a browser.
2. Add, remove, reorder, or edit page sections. The hero and footer remain fixed.
3. Choose one of the registered layouts for each section. The editor displays only the fields supported by that layout.
4. Choose a section background from the coordinated palette or enter a custom hex color.
5. Use **Vorschau** to preview the current draft.
6. In Chrome or Edge on an HTTPS deployment, use **content.js verbinden** and **In content.js speichern** to update the selected local file. Other browsers can download the generated `content.js`.

Drafts are stored locally in the browser. Existing content from the former fixed-section schema is migrated automatically when loaded.

## Included layouts

- Text and bullet list
- Text with highlighted note
- Card grid
- Text with image
- Price list
- Contact details and map

Repeatable content such as bullets, cards, and prices uses per-layout minimum and maximum ranges. These ranges protect the visual layout without prescribing an exact item count.

## Add another layout

The dynamic section system is split into two registries:

1. Add the layout metadata, defaults, field definitions, and collection ranges to `content-model.js`.
2. Add the corresponding page renderer to the `renderers` registry in `section-layout.js`.

The editor form, add/remove/reorder behavior, preview, export, backgrounds, navigation, and wave transitions work automatically from the shared section model. `editorRows` only controls the initial height of a text field in the editor; it does not constrain content.

## Images

- The hero image defaults to `therapist.png`.
- Image-layout sections accept a file path. When left empty, the existing styled practice-room placeholder is shown.

## Tests

Run `npx playwright test` to exercise the page and editor in Chromium, Firefox, and WebKit.
