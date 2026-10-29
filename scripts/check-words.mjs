// Valida os bancos de palavras (data/words/<idioma>.json) antes do build
// (npm run build roda este script). Falha se alguma regra quebrar; avisa
// quando um nível tem pouca variedade.
//
// Regras de cada idioma (letras válidas, ordem alfabética) em
// config/languages.json. Também confere que todo idioma tem banco e
// textos (locales/<idioma>.json) e que não sobra arquivo de idioma sem uso.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { normalizeWord } from '../lib/normalize.mjs';

const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const { languages } = read('config/languages.json');
const errors = [];
const warnings = [];
const summary = [];

// Idiomas, bancos e textos andam juntos
const codes = languages.map(l => l.code);
for (const dir of ['data/words', 'locales']) {
  const files = readdirSync(new URL(`../${dir}`, import.meta.url)).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  for (const code of codes) if (!files.includes(code)) errors.push(`${code}: falta ${dir}/${code}.json`);
  for (const file of files) if (!codes.includes(file)) errors.push(`${dir}/${file}.json não está em config/languages.json`);
}

for (const lang of languages) {
  const path = `data/words/${lang.code}.json`;
  if (!existsSync(new URL(`../${path}`, import.meta.url))) continue;
  const data = read(path);
  const alphabet = new Set(Array.from(lang.alphabet));
  const err = msg => errors.push(`${lang.code}: ${msg}`);

  // Palavras: só letras do idioma, já normalizadas, tamanho certo, ordem
  // alfabética do idioma, sem repetição
  const seen = new Set();
  for (const [len, list] of Object.entries(data.words)) {
    list.forEach((word, i) => {
      const chars = Array.from(word);
      if (!chars.every(c => alphabet.has(c))) err(`"${word}": use só as letras ${lang.alphabet}`);
      if (word !== normalizeWord(word, lang.code)) err(`"${word}" deveria ser "${normalizeWord(word, lang.code)}" (maiúsculas, sem acento)`);
      if (chars.length !== Number(len)) err(`"${word}" está na lista de ${len} letras`);
      if (seen.has(word)) err(`"${word}" repetida`);
      seen.add(word);
      if (i > 0 && list[i - 1].localeCompare(word, lang.locale) >= 0) err(`lista de ${len} letras fora de ordem em "${list[i - 1]}" / "${word}"`);
    });
  }

  // Níveis: letras do idioma; cada tamanho pedido precisa de palavras
  // suficientes com as letras do nível
  const letters = new Set();
  data.levels.forEach((level, i) => {
    for (const l of Array.from(level.addLetters)) {
      if (!alphabet.has(l)) err(`nível ${i + 1}: letra "${l}" fora do alfabeto`);
      letters.add(l);
    }
    if (![...letters].some(l => lang.vowels.includes(l))) err(`nível ${i + 1}: nenhuma vogal`);
    const total = Object.values(level.mix).reduce((a, b) => a + b, 0);
    if (level.goal > total) err(`nível ${i + 1}: meta ${level.goal} maior que a lista (${total})`);
    for (const [len, count] of Object.entries(level.mix)) {
      const eligible = (data.words[len] ?? []).filter(w => Array.from(w).every(c => letters.has(c))).length;
      if (eligible < count) err(`nível ${i + 1}: pede ${count} palavras de ${len} letras, só há ${eligible}`);
      else if (eligible < count * 2) warnings.push(`${lang.code}: nível ${i + 1}: só ${eligible} palavras de ${len} letras para sortear ${count}`);
    }
  });

  // Toda palavra precisa caber em algum nível
  for (const word of seen) {
    if (!Array.from(word).every(c => letters.has(c))) err(`"${word}" usa letra que nenhum nível tem`);
  }
  summary.push(`${lang.code} ${seen.size} palavras/${data.levels.length} níveis`);
}

warnings.forEach(w => console.warn(`aviso: ${w}`));
if (errors.length) {
  errors.forEach(e => console.error(`erro: ${e}`));
  process.exit(1);
}
console.log(`palavras ok: ${summary.join(', ')}`);
