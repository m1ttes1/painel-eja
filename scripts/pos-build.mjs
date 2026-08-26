import { renameSync, statSync, existsSync } from 'node:fs';

const origem = 'dist/index.html';
const destino = 'dist/painel-eja.html';

if (!existsSync(origem)) {
  console.error(`Build nao gerou ${origem}`);
  process.exit(1);
}

renameSync(origem, destino);
const kb = (statSync(destino).size / 1024).toFixed(0);
console.log(`OK ${destino} — ${kb} KB, arquivo unico`);
