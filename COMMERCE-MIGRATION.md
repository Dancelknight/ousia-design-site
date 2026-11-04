# Fire & Sea: catalogue now, independent commerce later

## Current boundary
Ousia is the interior design studio; Fire & Sea is its product collection, labelled "by Ousia design". Navigation says Collection/Kollektion. Existing /shop/ URLs remain valid to avoid breaking bookmarks. No prices, purchase buttons, cart, checkout, payment provider, inventory commitment, Shopify SDK or credentials are deployed.
The Dolomites chair is a design visualisation, not a manufactured or available product. Materials are design intentions, dimensions are unconfirmed. No promises about fulfilment are made.

## Portable content contract
assets/shop-data.js is independent of studio project data. Product IDs are stable; optional handle is the future URL identifier. DE/EN texts and category IDs are explicit. Images are separate files. Optional sku and shopifyProductId are kept in manager backups and private migrations, omitted from public publish exports. Do not store access tokens or confidential commercial data in this public repository.
Manager: Migrationspaket exports catalogue.json (fire-sea-portable-v1) plus images/ and imageMap. It includes local drafts, so keep it private. JSON backup remains the lossless restore format for the existing manager. Newly published sample products can be added to an existing local draft via "Neue öffentliche Produkte ergänzen" without overwriting edits.

## Route A: independent Fire & Sea Shopify store
1. Set up the actual Shopify store, legal operator, market/currency and domain later. No account or subscription has been created.
2. Export ONE language's Shopify CSV for an initial import to an empty store. Every product row has Status=draft and Published on online store=false. Images must already be public on the source domain or be uploaded manually from the migration archive. Keep the source domain/images reachable until import completes.
3. DE and EN CSVs are alternatives for the primary language, not sequential translation imports. Use the portable JSON for translations via Shopify's supported translation workflow. Record Shopify IDs back in the manager if needed.
4. Price is deliberately omitted; Shopify may initialise it to zero. Enter and validate prices, tax treatment, variants, SKU, inventory, dimensions/weight and shipping. No price or SKU is invented. The exporter models a single default variant per product, not a configurable furniture product.
5. Review draft products, images, payment provider, fulfilment and consumer/legal obligations before enabling any sales channel.
6. Once the new store is verified, change Ousia's collection navigation to its URL or retain the editorial collection with product links; arrange redirects for existing /shop/ and product links, canonical URLs, language alternatives and analytics consent as applicable.

## Route B: Shopify embedded in the existing website
Use Shopify's official Buy Button sales channel for verified products, or a separately scoped Storefront API integration. Implement an isolated commerce adapter only after the store and product/variant IDs exist. Keep product presentation independent from checkout. Enable only after explicit sales-launch approval. Use hosted checkout; never collect card data in this static content manager or commit Admin API secrets.

## Operational ownership
After migration, Shopify should become the source of truth for sellable product data, prices, inventory and orders; avoid competing updates from this local manager. Migrations of existing Shopify products need a reviewed mapping/import plan. The draft CSV is not a general inventory or variant updater.

## Official references reviewed 2026-11-04
https://help.shopify.com/en/manual/products/import-export/using-csv
https://help.shopify.com/en/manual/online-sales-channels/buy-button/add-embed-code

This preparation provides data portability and export tooling, not a connected or tested Shopify checkout.
