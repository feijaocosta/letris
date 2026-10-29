import data from './languages.json';

// Idiomas do jogo (regras em config/languages.json, que também é lido pelos
// scripts de validação). Para um idioma novo: entrada no JSON, código no tipo
// Lang, locales/<code>.json, data/words/<code>.json e a página de privacidade
// em public/.

export type Lang = 'pt' | 'en' | 'es' | 'fr';

export interface LanguageConfig {
  code: Lang;
  /** Nome no próprio idioma (seletor) */
  label: string;
  /** Locale para números (Intl), ordem alfabética e atributo lang do HTML */
  locale: string;
  /** Letras válidas no banco de palavras */
  alphabet: string;
  /** Vogais para o sorteio de letras */
  vowels: string;
  /**
   * Letras que contam como vogal só na regra de "no máximo N consoantes
   * seguidas" (ex.: Y em inglês: SKY, FLY, GYM), mas não são sorteadas
   * quando o jogo força uma vogal
   */
  extraVowels?: string;
  /** Política de privacidade do idioma, em public/ */
  privacyPage: string;
}

export const LANGUAGE_LIST = data.languages as LanguageConfig[];

export const LANGUAGE_CONFIGS = Object.fromEntries(LANGUAGE_LIST.map(l => [l.code, l])) as Record<Lang, LanguageConfig>;

export const DEFAULT_LANG: Lang = 'pt';
