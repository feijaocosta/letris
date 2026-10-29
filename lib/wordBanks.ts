import { LANGUAGE_CONFIGS, type Lang } from '../config/languages';
import { WordLibrary, type WordBankData } from '../components/WordLibrary';

// Carrega o banco de palavras do idioma sob demanda. Cada data/words/*.json
// vira um arquivo .js separado no build (import dinâmico), que entra no
// precache do Service Worker: todos os idiomas funcionam offline e quem joga
// em um idioma não baixa os outros na primeira visita.

const banks = import.meta.glob<{ default: WordBankData }>('../data/words/*.json');
const cache = new Map<Lang, Promise<WordLibrary>>();

export function loadWordLibrary(lang: Lang): Promise<WordLibrary> {
  let library = cache.get(lang);
  if (!library) {
    const load = banks[`../data/words/${lang}.json`];
    if (!load) return Promise.reject(new Error(`Sem banco de palavras para "${lang}"`));
    library = load().then(module => new WordLibrary(module.default, LANGUAGE_CONFIGS[lang]));
    library.catch(() => cache.delete(lang)); // falhou (ex.: offline sem cache): tenta de novo depois
    cache.set(lang, library);
  }
  return library;
}
