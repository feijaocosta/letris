import { createContext, Fragment, useContext, useMemo, type ReactNode } from 'react';
import pt from '../locales/pt.json';

// Textos da interface. Cada idioma é um JSON em locales/ com as MESMAS chaves
// (em inglês, agrupadas por tela: "home.play", "pause.resume"...). O
// português é o idioma de referência: chave que faltar em outro idioma cai
// no texto em português. O build confere as chaves (scripts/check-locales.mjs).
//
// Interpolação: "Nível {level}" + { level: 3 } → "Nível 3".

export type Lang = 'pt';

interface LangInfo {
  /** Locale para números e datas (Intl) e para o atributo lang do HTML */
  locale: string;
  messages: Messages;
}

type Messages = { [key: string]: string | Messages };

const LANGS: Record<Lang, LangInfo> = {
  pt: { locale: 'pt-BR', messages: pt },
};

const FALLBACK: Lang = 'pt';

// Todas as chaves do pt.json no formato "grupo.chave" (o editor completa e
// acusa chave errada)
type Paths<T> = { [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}` }[keyof T & string];
export type MessageKey = Paths<typeof pt>;

export type Vars = Record<string, string | number>;

function lookup(messages: Messages, key: string): string | undefined {
  let node: string | Messages | undefined = messages;
  for (const part of key.split('.')) {
    if (typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function translate(lang: Lang, key: MessageKey, vars?: Vars): string {
  const text = lookup(LANGS[lang].messages, key) ?? lookup(LANGS[FALLBACK].messages, key) ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? formatValue(lang, vars[name]) : match));
}

/** Como translate, mas aceita elementos React nas variáveis (texto com destaque). */
export function translateRich(lang: Lang, key: MessageKey, vars: Record<string, ReactNode>): ReactNode {
  const text = translate(lang, key);
  return text.split(/(\{\w+\})/).map((part, i) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    const value = name !== undefined && name in vars ? vars[name] : part;
    return <Fragment key={i}>{typeof value === 'number' ? formatValue(lang, value) : value}</Fragment>;
  });
}

function formatValue(lang: Lang, value: string | number): string {
  return typeof value === 'number' ? formatNumber(lang, value) : value;
}

export function formatNumber(lang: Lang, value: number): string {
  return value.toLocaleString(LANGS[lang].locale);
}

// ---------- React ----------

export interface I18n {
  lang: Lang;
  locale: string;
  t: (key: MessageKey, vars?: Vars) => string;
  rich: (key: MessageKey, vars: Record<string, ReactNode>) => ReactNode;
  /** Número no formato do idioma (8.634 em PT, 8,634 em EN) */
  n: (value: number) => string;
}

function makeI18n(lang: Lang): I18n {
  return {
    lang,
    locale: LANGS[lang].locale,
    t: (key, vars) => translate(lang, key, vars),
    rich: (key, vars) => translateRich(lang, key, vars),
    n: value => formatNumber(lang, value),
  };
}

const I18nContext = createContext<I18n>(makeI18n(FALLBACK));

export function I18nProvider({ lang = FALLBACK, children }: { lang?: Lang; children: ReactNode }) {
  const value = useMemo(() => makeI18n(lang), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
