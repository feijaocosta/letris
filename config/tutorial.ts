import type { Lang } from './languages';

// Tutorial da primeira partida: um roteiro com tabuleiro e peças fixos. Cada
// passo espera o jogador fazer a ação certa. Textos em locales (tutorial.*);
// a lógica dos passos fica em LetrisGame (fase de tutorial).

export type TutorialStep = 'move' | 'rotate' | 'drop' | 'word' | 'line' | 'goal' | 'done';

/** Ordem dos passos ('done' é o "Agora é com você!") */
export const TUTORIAL_STEPS: TutorialStep[] = ['move', 'rotate', 'drop', 'word', 'line', 'goal', 'done'];

/** Passos em que a peça cai sozinha (nos primeiros ela espera a ação) */
export const TUTORIAL_GRAVITY = new Set<TutorialStep>(['word', 'line', 'goal']);

/** Quantas vezes mover para os lados para passar do primeiro passo */
export const TUTORIAL_MOVES = 2;

/**
 * As duas palavras do tutorial em cada idioma (3 letras): a primeira é
 * formada no passo "word", a segunda no "goal". Só elas valem no tutorial.
 */
export const TUTORIAL_WORDS: Record<Lang, [string, string]> = {
  pt: ['SOL', 'MAR'],
  en: ['SUN', 'CAT'],
  es: ['SOL', 'MAR'],
  fr: ['MER', 'SEL'],
};

/** Letras da linha quase cheia do passo "line" (não formam palavra da lista) */
export const TUTORIAL_LINE_FILLER = 'XWZKXWZKX';
