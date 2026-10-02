import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { MongoClient, ObjectId } from 'mongodb';

const root = path.resolve('output/imagegen/all-products');
const snapshot = JSON.parse(await fs.readFile(path.join(root, 'source-products.json'), 'utf8'));
const views = ['Front View', 'Back View', 'Right Sleeve View', 'Left Sleeve View'];
const heldReasons = {
  13: 'Conflicting garments; matching rear reference missing.',
  15: 'Front references change logos and construction; matching rear missing.',
  18: 'References disagree on hood, hem, and pocket trim.',
  20: 'Only cropped chest detail; full garment references missing.',
  21: 'Only cropped front; full garment references missing.',
  22: 'References disagree on stripe layout, sleeves, and closure.',
  23: 'References mix hooded and nonhooded garments; matching rear missing.',
  46: 'Only front references; matching rear missing.',
  48: 'Only front references; matching rear missing.',
  49: 'Only front references; matching rear missing.',
};
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const products = await client.db().collection('products').find({}, {
    projection: { name: 1, slug: 1, images: 1, stockCount: 1 },
  }).toArray();
  const completed = [];
  const pending = [];
  for (const product of products) {
    const complete = product.images?.length === 4 && views.every((view, order) =>
      product.images[order]?.alt === `${product.name} ${view}` &&
      product.images[order]?.order === order &&
      product.images[order]?.url?.includes('res.cloudinary.com'));
    const index = snapshot.products.findIndex(source => source.slug === product.slug);
    const entry = { id: String(product._id), name: product.name, slug: product.slug, stockCount: product.stockCount };
    if (complete) { completed.push(entry); continue; }
    const localDraftViews = [];
    for (const view of views) {
      try { await fs.access(path.join(root, product.slug, `${product.name} ${view}.png`)); localDraftViews.push(view); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    pending.push({ ...entry, sourceIndex: index, reason: heldReasons[index] || 'Image generation usage limit reached.', localDraftViews });
  }
  if (process.argv.includes('--set-completed-stock')) {
    for (const product of completed.filter(p => p.stockCount !== 7)) {
      const result = await client.db().collection('products').updateOne(
        { _id: new ObjectId(product.id), stockCount: product.stockCount },
        { $set: { stockCount: 7, updatedAt: new Date() } },
      );
      if (result.modifiedCount !== 1) throw new Error(`Stock changed concurrently: ${product.name}`);
      const saved = await client.db().collection('products').findOne({ _id: new ObjectId(product.id) });
      if (saved.stockCount !== 7) throw new Error(`Stock verification failed: ${product.name}`);
      product.stockCount = 7;
    }
  }
  const report = {
    verifiedAt: new Date().toISOString(), totalProducts: products.length,
    completedCount: completed.length, completedWithStockSeven: completed.filter(p => p.stockCount === 7).length,
    newlyCompletedFromSnapshot: completed.filter(p => snapshot.products.some(s => s.slug === p.slug)).length,
    pendingCount: pending.length, heldForReferences: pending.filter(p => heldReasons[p.sourceIndex]).length,
    usageLimit: { type: 'usage_limit_reached', resetAtUtc: '2026-10-02T19:58:58.000Z', nextSourceIndex: 59 },
    completed, pending,
  };
  await fs.writeFile(path.join(root, 'progress-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, completed: undefined, pending: pending.map(p => ({ name: p.name, reason: p.reason, localDraftViews: p.localDraftViews })) }));
} finally { await client.close(); }
