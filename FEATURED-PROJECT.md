# Homepage settings

In `/manage/`, select **Site → Featured project**. The same project is featured in English and German and excluded from the normal homepage list. **None** restores every project to the list. Missing projects or projects without a cover are not featured. Renaming a project preserves the selection; deleting it clears the selection.

Settings are local drafts, not server-side publication. Use **Preview homepage** to view the draft, then **Download site-settings.js** and commit it to `assets/site-settings.js`. Export edited project data too, if applicable. Run `node scripts/seo-build.cjs` and commit the generated pages before publishing through GitHub Pages.

Portrait uploads require a PNG with actual transparency. JPEGs and opaque PNGs are rejected. Upload the exported portrait to `assets/images/` with its original filename and export the settings. Existing published portraits use `daniel-stofner-transparent.png`.

Run `node scripts/test-home.cjs` to check the featured-project behaviour and static homepage output.
