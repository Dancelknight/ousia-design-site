const fs=require('fs'),vm=require('vm'),assert=require('assert');
const storage=new Map(),ctx={window:{},URL,Blob,TextEncoder,Uint8Array,DataView,Set,Map,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
vm.runInNewContext(fs.readFileSync('assets/shop-data.js','utf8'),ctx);vm.runInNewContext(fs.readFileSync('assets/shop-core.js','utf8'),ctx);
const C=ctx.window.OusiaShop,d=C.read();assert.equal(d.categories.length,9);assert.equal(d.products.length,2);assert.equal(d.products[1].id,'schlern-sofa');assert.equal(d.products[0].id,'dolomites-lounge');d.products=[];
const product={id:'test-product',category:'chairs',status:'draft',name:{de:'Teststuhl',en:'Test chair'},description:{de:'',en:''},material:{de:'',en:''},dimensions:{de:'',en:''},images:[]};
d.products.push(product);C.save(d);assert.equal(C.read().products[0].name.de,'Teststuhl');assert.equal(ctx.window.OUSIA_SHOP.products.length,2,'draft must not mutate public catalogue');assert.equal(C.publishData(d).products.length,0,'draft must not export');
product.status='preview';assert.throws(()=>C.validate(d),/mindestens ein Bild/);product.images=['shop-test.png'];assert.equal(C.publishData(d).products.length,1);product.images=['../../x.png'];assert.throws(()=>C.validate(d),/Bilddatei/);product.images=['shop-test.png'];product.category='missing';assert.throws(()=>C.validate(d),/Kategorie/);product.category='chairs';d.categories.push({...d.categories[0]});assert.throws(()=>C.validate(d),/Kategorien/);d.categories.pop();
const enc=new TextEncoder();C.zip([{name:'assets/shop-data.js',bytes:enc.encode('test-data')},{name:'assets/images/shop-test.png',bytes:Uint8Array.from([0,1,2,255])}]).arrayBuffer().then(b=>{fs.writeFileSync('/tmp/ousia-shop-test.zip',Buffer.from(b));console.log('PASS: schema, local/public isolation, draft exclusion, required images, invalid paths, category references, ZIP fixture');});

product.sku='TEST-SKU';product.shopifyProductId='123';product.handle='test-chair';
const pub=C.publishData(d);assert(!('sku' in pub.products[0]));assert(!('shopifyProductId' in pub.products[0]));
const csv=C.shopifyCSV(d,'de');assert(csv.includes('"false","draft"'));assert(csv.includes('"Product image URL"'));assert(csv.includes('https://ousiadesign.ch/assets/images/shop-test.png'));assert(!csv.includes('"Price"'));assert.equal(C.migrationData(d).commerce.checkoutEnabled,false);
fs.writeFileSync('/tmp/ousia-shopify-test.csv',csv);console.log('PASS: migration manifest, private ID exclusion, Shopify draft flags and public image URLs');
