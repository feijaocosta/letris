// Valida data/words.json antes do build (npm run build roda este script).
// Falha se alguma regra quebrar; avisa quando um nível tem pouca variedade.
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/words.json', import.meta.url), 'utf8'));
const errors = [];
const warnings = [];

// Palavras: só A-Z, tamanho certo, ordem alfabética, sem repetição
const seen = new Set();
for (const [len, list] of Object.entries(data.words)) {
  list.forEach((word, i) => {
    if (!/^[A-Z]+$/.test(word)) errors.push(`"${word}": use só letras A-Z, sem acento`);
    if (word.length !== Number(len)) errors.push(`"${word}" está na lista de ${len} letras`);
    if (seen.has(word)) errors.push(`"${word}" repetida`);
    seen.add(word);
    if (i > 0 && list[i - 1] >= word) errors.push(`lista de ${len} letras fora de ordem em "${list[i - 1]}" / "${word}"`);
  });
}

// Níveis: cada tamanho pedido precisa de palavras suficientes com as letras do nível
const letters = new Set();
data.levels.forEach((level, i) => {
  for (const l of level.addLetters) letters.add(l);
  const total = Object.values(level.mix).reduce((a, b) => a + b, 0);
  if (level.goal > total) errors.push(`nível ${i + 1}: meta ${level.goal} maior que a lista (${total})`);
  for (const [len, count] of Object.entries(level.mix)) {
    const eligible = (data.words[len] ?? []).filter(w => [...w].every(c => letters.has(c))).length;
    if (eligible < count) errors.push(`nível ${i + 1}: pede ${count} palavras de ${len} letras, só há ${eligible}`);
    else if (eligible < count * 2) warnings.push(`nível ${i + 1}: só ${eligible} palavras de ${len} letras para sortear ${count}`);
  }
});

// Toda palavra precisa caber em algum nível
for (const word of seen) {
  if (![...word].every(c => letters.has(c))) errors.push(`"${word}" usa letra que nenhum nível tem`);
}

warnings.forEach(w => console.warn(`aviso: ${w}`));
if (errors.length) {
  errors.forEach(e => console.error(`erro: ${e}`));
  process.exit(1);
}
console.log(`palavras ok: ${seen.size} palavras, ${data.levels.length} níveis`);
