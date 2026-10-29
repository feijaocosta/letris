// Textos e bancos de todos os idiomas, para os testes que valem para cada um.
// Idioma novo: acrescentar aqui (o teste "todo idioma está nos testes" avisa).
import pt from '../locales/pt.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import ptBank from '../data/words/pt.json';
import enBank from '../data/words/en.json';
import esBank from '../data/words/es.json';
import frBank from '../data/words/fr.json';

export const LOCALES = { pt, en, es, fr } as const;
export const BANKS = { pt: ptBank, en: enBank, es: esBank, fr: frBank } as const;
export type TestLang = keyof typeof LOCALES;
