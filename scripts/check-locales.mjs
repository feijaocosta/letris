// Valida os textos da interface (locales/*.json) antes do build.
// Falha se:
//  - um idioma não tiver exatamente as mesmas chaves do pt.json (referência)
//  - um texto estiver vazio ou usar variáveis ({level}...) diferentes do PT
//  - o código usar uma chave que não existe (ex.: t('home.plya'))
//  - um grupo de níveis de data/words/*.json não tiver nome em "pools"
// Avisa sobre chaves que ninguém usa.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const errors = [];
const warnings = [];

const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]);
const vars = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

const localesDir = join(root, 'locales');
const locales = Object.fromEntries(readdirSync(localesDir).filter(f => f.endsWith('.json')).map(f =>
  [f.replace('.json', ''), new Map(flatten(JSON.parse(readFileSync(join(localesDir, f), 'utf8'))))]));
const pt = locales.pt;
if (!pt) throw new Error('locales/pt.json não encontrado');

for (const [lang, messages] of Object.entries(locales)) {
  for (const [key, text] of messages) {
    if (typeof text !== 'string' || text.trim() === '') errors.push(`${lang}: "${key}" vazio ou não é texto`);
    if (lang === 'pt') continue;
    if (!pt.has(key)) errors.push(`${lang}: "${key}" não existe no pt.json`);
    else if (vars(text) !== vars(pt.get(key))) errors.push(`${lang}: "${key}" usa {${vars(text)}}, o PT usa {${vars(pt.get(key))}}`);
  }
  if (lang !== 'pt') for (const key of pt.keys()) if (!messages.has(key)) errors.push(`${lang}: falta "${key}"`);
}

// Chaves usadas no código do app: textos entre aspas no formato "grupo.chave"
const groups = [...new Set([...pt.keys()].map(k => k.split('.')[0]))].join('|');
const keyPattern = new RegExp(`['"\`]((?:${groups})\\.[A-Za-z0-9]+)['"\`]`, 'g');
const skip = new Set(['ui']); // components/ui: shadcn gerado, sem textos do jogo
const sources = [join(root, 'App.tsx')];
const walk = dir => readdirSync(dir).forEach(name => {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) { if (!skip.has(name)) walk(path); }
  else if (/\.tsx?$/.test(name)) sources.push(path);
});
['components', 'hooks', 'lib', 'config', 'src'].forEach(dir => walk(join(root, dir)));

const used = new Set();
for (const file of sources) {
  for (const [, key] of readFileSync(file, 'utf8').matchAll(keyPattern)) {
    used.add(key);
    if (!pt.has(key)) errors.push(`${relative(root, file)}: chave "${key}" não existe no pt.json`);
  }
}

// Nomes dos grupos de níveis vêm dos bancos de palavras e são traduzidos em "pools.*"
const banksDir = join(root, 'data/words');
for (const file of readdirSync(banksDir).filter(f => f.endsWith('.json'))) {
  const bank = JSON.parse(readFileSync(join(banksDir, file), 'utf8'));
  for (const name of new Set(bank.levels.map(l => l.name))) {
    used.add(`pools.${name}`);
    if (!pt.has(`pools.${name}`)) errors.push(`data/words/${file}: grupo "${name}" sem texto em "pools.${name}"`);
  }
}

for (const key of pt.keys()) if (!used.has(key)) warnings.push(`"${key}" não é usada no código`);

warnings.forEach(w => console.warn(`aviso (textos): ${w}`));
if (errors.length) {
  errors.forEach(e => console.error(`erro (textos): ${e}`));
  process.exit(1);
}
console.log(`textos ok: ${Object.keys(locales).join(', ')} · ${pt.size} chaves`);
