// Copia o motor para web/js/engine (o cliente e o Worker usam o mesmo codigo).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'mat1-engine'), dst = path.join(root, 'web', 'js', 'engine');
fs.mkdirSync(dst, { recursive: true });
for (const f of fs.readdirSync(src)) if (f.endsWith('.js')) fs.copyFileSync(path.join(src, f), path.join(dst, f));
console.log('motor copiado para', dst);
