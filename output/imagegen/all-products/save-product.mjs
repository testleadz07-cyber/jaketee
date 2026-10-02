import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { MongoClient, ObjectId } from 'mongodb';
import { uploadImage } from '../../../src/lib/cloudinary.ts';

const root = path.resolve('output/imagegen/all-products');
const snapshot = JSON.parse(await fs.readFile(path.join(root, 'source-products.json'), 'utf8'));
const source = snapshot.products[Number(process.argv[2])];
if (!source) throw new Error('Unknown product index');
const directory = path.join(root, source.slug);
const views = ['Front View', 'Back View', 'Right Sleeve View', 'Left Sleeve View'];
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const collection = client.db().collection('products');
  const product = await collection.findOne({ _id: new ObjectId(source._id), slug: source.slug });
  if (!product || product.name !== source.name) throw new Error('Product changed');
  await fs.mkdir(directory, { recursive: true });
  try { await fs.writeFile(path.join(directory, 'database-backup.json'), JSON.stringify(product, null, 2), { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  const reportPath = path.join(directory, 'upload-results.json');
  let report;
  try { report = JSON.parse(await fs.readFile(reportPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; report = { uploaded: [], updated: false }; }
  for (let order = 0; order < views.length; order++) {
    if (report.uploaded[order]) continue;
    const buffer = await fs.readFile(path.join(directory, `${source.name} ${views[order]}.png`));
    if (buffer.length > 5 * 1024 * 1024) throw new Error('Image exceeds upload limit');
    const result = await uploadImage(buffer, `jacketee/products/${source.slug}`);
    if (!result) throw new Error(`Upload failed: ${views[order]}`);
    report.uploaded[order] = { ...result, alt: `${source.name} ${views[order]}`, order };
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  }
  const images = report.uploaded.map(({ url, alt, order }) => ({ url, alt, order }));
  if (!report.updated) {
    const result = await collection.updateOne(
      { _id: product._id, images: product.images, stockCount: product.stockCount },
      { $set: { images, stockCount: 7, updatedAt: new Date() } }
    );
    if (result.modifiedCount !== 1) throw new Error('Concurrent product change; update skipped');
  }
  const saved = await collection.findOne({ _id: product._id });
  if (saved.stockCount !== 7 || JSON.stringify(saved.images) !== JSON.stringify(images)) throw new Error('Verification failed');
  report.updated = true;
  report.stockCount = 7;
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ name: source.name, images: 4, stockCount: 7, verified: true }));
} finally { await client.close(); }
