// Normalização das palavras dos bancos (data/words/*.json). JavaScript puro
// para ser usado tanto pelos scripts de validação (Node) quanto pelos testes.
//
// - maiúsculas, sem acento: "maçã" → "MACA", "ÁRBOL" → "ARBOL"
// - espanhol: Ñ é letra própria e é preservada ("año" → "AÑO", nunca "ANO")
// - francês: Œ → OE, Æ → AE ("cœur" → "COEUR")
// - resultado em NFC (cada letra é um único caractere, inclusive o Ñ)

const LIGATURES = { Œ: 'OE', Æ: 'AE' };
const KEEP = { es: ['Ñ'] };

/**
 * @param {string} word
 * @param {string} lang código do idioma (pt, en, es, fr)
 * @returns {string}
 */
export function normalizeWord(word, lang) {
  const keep = KEEP[lang] ?? [];
  let text = word.normalize('NFC').toUpperCase();
  text = text.replace(/[ŒÆ]/g, c => LIGATURES[c]);
  // Protege as letras próprias do idioma antes de tirar os acentos
  keep.forEach((letter, i) => { text = text.split(letter).join(`\u0000${i}\u0000`); });
  text = text.normalize('NFD').replace(/\p{M}/gu, '');
  keep.forEach((letter, i) => { text = text.split(`\u0000${i}\u0000`).join(letter); });
  return text.normalize('NFC');
}
