# Fire & Sea catalogue

The public shop is a coming-soon catalogue with category filters and a product-gallery dialog. It has no cart, checkout, payments or live inventory.

## Edit
Open `/manage/` and select **Fire & Sea · Shop**. Add a product, fill in DE/EN names, choose a category, and upload JPEG/PNG/WebP images (15 MB per file). First image is the cover; controls allow ordering, removing or choosing a new cover. Edit descriptions, materials and dimensions in both languages. Products start as drafts. A public-preview product requires names in both languages and at least one image.

Categories can be added, renamed, reordered and deleted (only when unused). Product order is editable. Both languages share images and category IDs.

## Save, preview, publish
Edits auto-save in this browser's localStorage (`ousia-shop-draft`); image blobs use the existing `ousia-content-assets` IndexedDB. Browser settings or private browsing may prevent persistence. Saving is not publication. Product deletion only changes the local draft; publishing the updated package removes it from the live catalogue.

`/de/shop/?preview=1` and `/shop/?preview=1` display the local draft, including draft products. Normal visitors read only `assets/shop-data.js`. Preview mode is marked noindex in the DOM.

Download a JSON backup to preserve all products, categories and images. Restore through **Backup importieren**. Keep draft backups private, not in the public repository.

**Veröffentlichungspaket (ZIP)** exports public-preview products only and includes their complete images (browser-local or already published). Unzip, merge `assets/` into the repository without deleting unrelated files, commit and wait for GitHub Pages deployment. No passwords or GitHub tokens are stored in this manager. Missing images fail the export instead of silently publishing broken links. The ZIP is standard, uncompressed and needs no third-party library.

## Checks
`node scripts/test-shop.cjs` tests data validation, local/public separation, draft exclusion and ZIP generation. Its temporary ZIP fixture may be inspected with a standard ZIP reader. `node scripts/test-home.cjs` guards the homepage project behavior.

Before enabling real sales, complete the legal and commercial launch checklist in `LEGAL-LAUNCH.md`.
