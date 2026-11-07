import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3001);
// apps/server/dist (or src) → apps/web/dist
const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');

createApp({ affiliateTag: process.env.AFFILIATE_TAG, webDist }).listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
