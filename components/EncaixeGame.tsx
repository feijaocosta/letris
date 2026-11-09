import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { GameBoard, type Cell } from './GameBoard';
import { ScoreSystem, type ScoreLabel, type ScoredWord } from './ScoreSystem';
import type { WordLibrary } from './WordLibrary';
import { GameOver, LevelComplete, LevelIntro, LevelSplash, PauseMenu } from './GameOverlays';
import { IconPause, IconRotate, Label, Logo, Tile, WordChip } from './LetrisUI';
import { ENCAIXE } from '../config/encaixe';
import {
  blockCount, canPlace, clearCells, emptyGrid, findClear, fitsAnywhere, highlightCells, pieceFromRows,
  placePiece, randomTrayPiece, rotatePiece, rotations, type TrayPiece,
} from '../lib/encaixe';
import { adBreakNext } from '../lib/ads';
import { track } from '../lib/analytics';
import { load, recordKey, save } from '../lib/storage';
import { clearSavedEncaixe, saveEncaixe, type SavedEncaixe } from '../lib/savedGame';
import { useI18n, type MessageKey } from '../lib/i18n';

// Modo Encaixe: arrastar peças da bandeja e soltar onde quiser no tabuleiro
// (sem gravidade). Linha ou coluna completa some; palavras da lista do nível
// também. Fases, meta, comemoração, resumo e anúncios iguais ao Clássico.

const LEVEL_END_GLOW_MS = 900;
const LEVEL_SPLASH_MS = 1600;

type Phase = 'intro' | 'playing' | 'ending' | 'splash' | 'summary';

interface Drag {
  slot: number;
  x: number;
  y: number;
}

interface EncaixeGameProps {
  library: WordLibrary;
  /** Celular deitado (aviso "Gire o celular" por cima): o jogo pausa */
  blocked?: boolean;
  resume?: SavedEncaixe | null;
  onHome: () => void;
  onHelp: () => void;
}

export function EncaixeGame({ library, blocked = false, resume = null, onHome, onHelp }: EncaixeGameProps) {
  const { t, n, lang } = useI18n();
  const bestScoreKey = recordKey('bestScore', lang, 'encaixe');
  const bestLevelKey = recordKey('bestLevel', lang, 'encaixe');

  const [grid, setGrid] = useState<Cell[][]>(() => emptyGrid());
  const [tray, setTray] = useState<Array<TrayPiece | null>>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [foundWordsList, setFoundWordsList] = useState<string[]>([]);
  const [gameWords, setGameWords] = useState<string[]>([]);
  const [levelWords, setLevelWords] = useState<string[]>([]);
  const [popup, setPopup] = useState<{ id: number; points: number; labels: ScoreLabel[] } | null>(null);
  const [levelBonus, setLevelBonus] = useState(0);
  const [noLinesBonus, setNoLinesBonus] = useState(0);
  const [levelPhase, setLevelPhase] = useState<Phase>('intro');
  const [levelStart, setLevelStart] = useState({ score: 0, lines: 0 });
  const [isResolving, setIsResolving] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);

  const gridRef = useRef(grid);
  const trayRef = useRef(tray);
  const phaseRef = useRef(levelPhase);
  phaseRef.current = levelPhase;
  const levelRef = useRef(level);
  levelRef.current = level;
  const totalsRef = useRef({ score, lines: linesCleared });
  totalsRef.current = { score, lines: linesCleared };
  const boardGridRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const levelWordsRef = useRef<string[]>([]);
  const validWordsRef = useRef<Set<string>>(new Set());
  const foundTargetsRef = useRef<Set<string>>(new Set());
  const formedInLevelRef = useRef<Set<string>>(new Set());
  const usedWordsRef = useRef<Set<string>>(new Set());
  const letterGenRef = useRef<() => string>(() => 'A');

  // Tempo jogado (só para as métricas: aqui não há velocidade)
  const playedMsRef = useRef(0);
  const gamePlayedMsRef = useRef(0);
  const runningSinceRef = useRef<number | null>(null);
  const getPlayedMs = () =>
    playedMsRef.current + (runningSinceRef.current !== null ? Date.now() - runningSinceRef.current : 0);

  const updateGrid = useCallback((next: Cell[][]) => {
    gridRef.current = next;
    setGrid(next);
  }, []);

  const updateTray = useCallback((next: Array<TrayPiece | null>) => {
    trayRef.current = next;
    setTray(next);
  }, []);

  const newPiece = () => randomTrayPiece(() => letterGenRef.current());
  const freshTray = () => Array.from({ length: ENCAIXE.traySize }, newPiece);

  const setupLevel = (lvl: number) => {
    const words = library.drawWordsForLevel(lvl, usedWordsRef.current);
    words.forEach(w => usedWordsRef.current.add(w));
    levelWordsRef.current = words;
    setLevelWords(words);
    validWordsRef.current = new Set(words);
    foundTargetsRef.current = new Set();
    formedInLevelRef.current = new Set();
    letterGenRef.current = library.createLetterGenerator(
      lvl,
      () => levelWordsRef.current.filter(w => !foundTargetsRef.current.has(w)),
    );
  };

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const showPopup = (points: number, labels: ScoreLabel[]) => {
    setPopup({ id: Date.now(), points, labels });
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    popupTimeoutRef.current = setTimeout(() => setPopup(null), 1400);
  };

  const startNewGame = () => {
    clearSavedEncaixe(lang);
    clearTimers();
    usedWordsRef.current = new Set();
    setupLevel(1);
    updateGrid(emptyGrid());
    updateTray(freshTray());
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setIsGameOver(false);
    setIsNewRecord(false);
    setIsPaused(false);
    setIsResolving(false);
    setFoundWordsList([]);
    setGameWords([]);
    setPopup(null);
    setDrag(null);
    setLevelPhase('intro');
    setLevelStart({ score: 0, lines: 0 });
    playedMsRef.current = 0;
    gamePlayedMsRef.current = 0;
    runningSinceRef.current = null;
  };

  const restoreGame = (g: SavedEncaixe) => {
    clearTimers();
    usedWordsRef.current = new Set(g.used);
    levelWordsRef.current = g.levelWords;
    setLevelWords(g.levelWords);
    validWordsRef.current = new Set(g.levelWords);
    foundTargetsRef.current = new Set(g.found);
    formedInLevelRef.current = new Set(g.formed);
    letterGenRef.current = library.createLetterGenerator(
      g.level,
      () => levelWordsRef.current.filter(w => !foundTargetsRef.current.has(w)),
    );
    updateGrid(g.grid);
    updateTray(g.tray.map(p => p ?? newPiece()));
    setScore(g.score);
    setLevel(g.level);
    setLinesCleared(g.lines);
    setFoundWordsList(g.found);
    setGameWords(g.gameWords);
    setLevelStart(g.levelStart);
    setLevelBonus(g.levelBonus);
    setNoLinesBonus(g.noLinesBonus);
    playedMsRef.current = g.playedMs;
    gamePlayedMsRef.current = g.gamePlayedMs;
    runningSinceRef.current = null;
    setLevelPhase(g.phase);
    setIsPaused(g.phase === 'playing');
  };

  useEffect(() => {
    if (resume) restoreGame(resume);
    else startNewGame();
    return () => {
      clearTimers();
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, []);

  // Sem lugar para nenhuma peça da bandeja: fim de jogo (só jogando; no fim
  // de nível o tabuleiro vai ser limpo)
  const checkGameOver = (board: Cell[][], pieces: Array<TrayPiece | null>) => {
    if (phaseRef.current !== 'playing') return;
    const remaining = pieces.filter((p): p is TrayPiece => p !== null);
    // A peça que gira só trava o jogo se não couber em nenhuma posição
    const fits = (p: TrayPiece, slot: number) =>
      slot === ENCAIXE.rotateSlot ? rotations(p).some(r => fitsAnywhere(board, r)) : fitsAnywhere(board, p);
    if (remaining.length > 0 && !pieces.some((p, slot) => p !== null && fits(p, slot))) setIsGameOver(true);
  };

  /** Palavras da lista, linhas e colunas completas: brilham e somem juntas */
  const resolve = (board: Cell[][]) => {
    const clear = findClear(board, validWordsRef.current);
    if (clear.cells.size === 0) {
      checkGameOver(board, trayRef.current);
      return;
    }
    setIsResolving(true);

    const scored: ScoredWord[] = clear.words.map(({ word }) => {
      const result = { word, repeated: formedInLevelRef.current.has(word) };
      formedInLevelRef.current.add(word);
      track('word_formed', { length: word.length, repeated: result.repeated, level: levelRef.current, mode: 'encaixe' });
      return result;
    });
    if (clear.words.length > 0) {
      const newTargets = scored.filter(w => !foundTargetsRef.current.has(w.word)).map(w => w.word);
      newTargets.forEach(w => foundTargetsRef.current.add(w));
      if (newTargets.length > 0) setFoundWordsList([...foundTargetsRef.current]);
      setGameWords(prev => [...prev, ...scored.map(w => w.word).filter((w, i, all) => !prev.includes(w) && all.indexOf(w) === i)]);
    }
    const lines = clear.rows.length + clear.cols.length;
    if (lines > 0) setLinesCleared(prev => prev + lines);

    const result = ScoreSystem.scoreClear(scored, lines, levelRef.current, false);
    setScore(prev => prev + result.points);
    showPopup(result.points, result.labels);
    updateGrid(highlightCells(board, clear.cells));

    timersRef.current.push(setTimeout(() => {
      const next = clearCells(gridRef.current, clear.cells);
      updateGrid(next);
      setIsResolving(false);
      checkGameOver(next, trayRef.current);
    }, ENCAIXE.clearMs));
  };

  const canAct = !isPaused && !isGameOver && levelPhase === 'playing' && !isResolving;

  /** Encaixa a peça da bandeja com o canto superior esquerdo em (row, col) */
  const place = (slot: number, row: number, col: number): boolean => {
    const piece = trayRef.current[slot];
    if (!piece || !canAct || !canPlace(gridRef.current, piece, row, col)) return false;
    const board = placePiece(gridRef.current, piece, row, col);
    setScore(prev => prev + blockCount(piece) * ENCAIXE.pointsPerBlock);
    // A bandeja é reposta peça a peça
    const nextTray = [...trayRef.current];
    nextTray[slot] = newPiece();
    updateTray(nextTray);
    updateGrid(board);
    resolve(board);
    return true;
  };

  /** Botão de girar (só na casa `ENCAIXE.rotateSlot` da bandeja) */
  const rotate = (slot: number) => {
    const piece = trayRef.current[slot];
    if (slot !== ENCAIXE.rotateSlot || !piece || !canAct || drag) return;
    const nextTray = [...trayRef.current];
    nextTray[slot] = rotatePiece(piece);
    updateTray(nextTray);
  };

  // ---------- Arrastar ----------

  /** Casa onde a peça arrastada entraria (canto superior esquerdo) */
  const dropTarget = (d: Drag): { row: number; col: number; valid: boolean } | null => {
    const piece = trayRef.current[d.slot];
    const gridEl = boardGridRef.current;
    if (!piece || !gridEl) return null;
    const rect = gridEl.getBoundingClientRect();
    const pitch = rect.width / ENCAIXE.cols;
    const w = piece.shape[0].length * pitch;
    const h = piece.shape.length * pitch;
    const left = d.x - w / 2;
    const top = d.y - ENCAIXE.dragLift - h;
    const col = Math.round((left - rect.left) / pitch);
    const row = Math.round((top - rect.top) / pitch);
    return { row, col, valid: canPlace(gridRef.current, piece, row, col) };
  };

  const startDrag = (slot: number, e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || !canAct || !trayRef.current[slot]) return;
    e.preventDefault();
    setDrag({ slot, x: e.clientX, y: e.clientY });
  };

  const dragRef = useRef(drag);
  dragRef.current = drag;
  const placeRef = useRef(place);
  placeRef.current = place;
  const targetRef = useRef(dropTarget);
  targetRef.current = dropTarget;

  useEffect(() => {
    if (drag === null) return;
    const move = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      setDrag(d => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    };
    const end = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      const current = dragRef.current;
      if (current) {
        const target = targetRef.current({ ...current, x: e.clientX, y: e.clientY });
        // Fora do tabuleiro ou sem espaço: a peça volta para a bandeja
        if (target?.valid) placeRef.current(current.slot, target.row, target.col);
      }
      setDrag(null);
    };
    const cancel = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [drag !== null]);

  // Pausou no meio do arrasto: a peça volta
  useEffect(() => {
    if (!canAct) setDrag(null);
  }, [canAct]);

  // Prévia: a peça no lugar (meio transparente) e o que vai sumir brilhando
  const target = drag ? dropTarget(drag) : null;
  const displayGrid = useMemo(() => {
    if (!drag || !target?.valid) return grid;
    const piece = trayRef.current[drag.slot];
    if (!piece) return grid;
    const placed = placePiece(grid, piece, target.row, target.col, true);
    return highlightCells(placed, findClear(placed, validWordsRef.current).cells);
  }, [grid, drag?.slot, target?.row, target?.col, target?.valid]);

  // ---------- Fases, recordes e tempo ----------

  const running = !isPaused && !isGameOver && levelPhase === 'playing';
  useEffect(() => {
    if (running) {
      runningSinceRef.current = Date.now();
    } else if (runningSinceRef.current !== null) {
      playedMsRef.current += Date.now() - runningSinceRef.current;
      runningSinceRef.current = null;
    }
  }, [running]);

  useEffect(() => {
    if (blocked) setIsPaused(true);
  }, [blocked]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setIsPaused(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const requiredWords = library.getRequiredWordsForLevel(level);
  useEffect(() => {
    if (levelPhase === 'playing' && foundWordsList.length >= requiredWords) {
      const noLines = linesCleared - levelStart.lines === 0 ? ScoreSystem.noLinesBonusPoints(level) : 0;
      const bonus = ScoreSystem.levelCompletePoints(level);
      setScore(prev => prev + bonus + noLines);
      setLevelBonus(bonus);
      setNoLinesBonus(noLines);
      setLevelPhase('ending');
      timersRef.current.push(
        setTimeout(() => setLevelPhase('splash'), LEVEL_END_GLOW_MS),
        setTimeout(async () => {
          await adBreakNext('fim-de-nivel');
          setLevelPhase(phase => (phase === 'splash' ? 'summary' : phase));
        }, LEVEL_END_GLOW_MS + LEVEL_SPLASH_MS),
      );
      track('level_complete', {
        level,
        mode: 'encaixe',
        duration_s: Math.round(getPlayedMs() / 1000),
        words: foundWordsList.length,
        points: score + bonus + noLines - levelStart.score,
        no_lines: noLines > 0,
      });
      save(bestLevelKey, Math.max(load(bestLevelKey, 1), level + 1));
    }
  }, [foundWordsList.length, requiredWords, level, levelPhase]);

  useEffect(() => {
    if (!isGameOver) return;
    clearSavedEncaixe(lang);
    const newRecord = score > load(bestScoreKey, 0);
    if (newRecord) {
      save(bestScoreKey, score);
      setIsNewRecord(true);
    }
    track('game_over', {
      level,
      mode: 'encaixe',
      score,
      words: gameWords.length,
      duration_s: Math.round((gamePlayedMsRef.current + getPlayedMs()) / 1000),
      new_record: newRecord,
    });
    save(bestLevelKey, Math.max(load(bestLevelKey, 1), level));
  }, [isGameOver]);

  const continueToNextLevel = () => {
    const nextLevel = level + 1;
    clearTimers();
    setupLevel(nextLevel);
    setLevel(nextLevel);
    updateGrid(emptyGrid());
    updateTray(freshTray());
    setFoundWordsList([]);
    setLevelStart({ ...totalsRef.current });
    gamePlayedMsRef.current += getPlayedMs();
    playedMsRef.current = 0;
    runningSinceRef.current = null;
    setIsResolving(false);
    setLevelPhase('intro');
    setIsPaused(false);
  };

  const restartAfterGameOver = async () => {
    setAdBusy(true);
    await adBreakNext('jogar-de-novo');
    setAdBusy(false);
    startNewGame();
  };

  // ---------- Partida guardada ----------
  const snapshot = (): Omit<SavedEncaixe, 'v' | 'savedAt'> | null => {
    if (isGameOver || levelWordsRef.current.length === 0) return null;
    const phase = levelPhase === 'intro' || levelPhase === 'summary' ? levelPhase
      : levelPhase === 'playing' && !isResolving ? 'playing' : null;
    if (!phase) return null;
    return {
      phase,
      level,
      score,
      lines: linesCleared,
      grid: gridRef.current,
      tray: trayRef.current,
      levelWords: levelWordsRef.current,
      found: [...foundTargetsRef.current],
      formed: [...formedInLevelRef.current],
      used: [...usedWordsRef.current],
      gameWords,
      levelStart,
      levelBonus,
      noLinesBonus,
      playedMs: getPlayedMs(),
      gamePlayedMs: gamePlayedMsRef.current,
    };
  };
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const persist = useCallback(() => {
    const game = snapshotRef.current();
    if (game) saveEncaixe(lang, game);
  }, [lang]);

  useEffect(() => {
    persist();
  }, [tray, isPaused, levelPhase, isResolving, persist]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', persist);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', persist);
    };
  }, [persist]);

  // Ganchos dos testes automáticos (só no build LETRIS_E2E=1)
  if (__E2E__) {
    (window as unknown as { __letris: unknown }).__letris = {
      state: () => ({
        mode: 'encaixe', level, score, lines: linesCleared, phase: levelPhase, paused: isPaused, gameOver: isGameOver,
        levelWords, found: foundWordsList, piece: null,
        board: gridRef.current.map(row => row.map(cell => cell.letter ?? '.').join('')),
        tray: trayRef.current.map(p => p && p.shape.map((row, r) => row.map((f, c) => (f ? p.letters[r][c] : '.')).join(''))),
      }),
      // Cada string é uma linha do tabuleiro, alinhadas ao fundo; "." = vazio
      setBoard: (rows: string[]) => {
        const board = emptyGrid();
        rows.forEach((text, i) => {
          const row = ENCAIXE.rows - rows.length + i;
          Array.from(text).forEach((letter, col) => {
            if (letter !== '.') board[row][col] = { letter, color: 'blue', isActive: false, isHighlighted: false };
          });
        });
        updateGrid(board);
      },
      // Peças da bandeja como linhas de letras ("." = vazio); null = espaço vazio
      setTray: (pieces: Array<string[] | null>) => updateTray(pieces.map(p => (p ? pieceFromRows(p) : null))),
      setLevelWords: (words: string[]) => {
        levelWordsRef.current = words;
        validWordsRef.current = new Set(words);
        setLevelWords(words);
      },
      skipIntro: () => setLevelPhase(phase => (phase === 'intro' ? 'playing' : phase)),
      place: (slot: number, row: number, col: number) => placeRef.current(slot, row, col),
      // Checa o fim de jogo com o tabuleiro e a bandeja atuais
      checkGameOver: () => checkGameOver(gridRef.current, trayRef.current),
    };
  }

  // ---------- Tela ----------
  const progress = Math.min(100, (foundWordsList.length / requiredWords) * 100);
  const nextLevel = level + 1;
  const currentLetters = library.getAvailableLettersForLevel(level);
  const newLetters = library.getAvailableLettersForLevel(nextLevel).filter(l => !currentLetters.includes(l));
  const draggedPiece = drag ? tray[drag.slot] : null;
  const pitch = boardGridRef.current ? boardGridRef.current.getBoundingClientRect().width / ENCAIXE.cols : 32;

  return (
    <div className="h-full w-full bg-ink text-white flex justify-center game-area safe-area">
      <div className="h-full w-full max-w-md flex flex-col gap-2 px-4 pt-2 pb-2">

        {/* Topo: logo, placar e pausa */}
        <div className="flex items-center gap-2 h-11 shrink-0">
          <Logo size={20} />
          <div className="flex-1 flex justify-end gap-2.5 text-sm font-extrabold text-soft whitespace-nowrap">
            <span>{t('game.levelShort')} <span className="text-white font-black">{level}</span></span>
            <span><span className="text-white font-black">{n(score)}</span> {t('game.pointsShort')}</span>
            <span><span className="text-white font-black">{linesCleared}</span> {t('game.linesShort')}</span>
          </div>
          <button
            type="button"
            aria-label={t('game.pause')}
            onClick={() => { if (levelPhase === 'playing') setIsPaused(true); }}
            className="w-11 h-11 rounded-full bg-panel flex items-center justify-center shrink-0"
          >
            <IconPause size={20} strokeWidth={2.8} />
          </button>
        </div>

        {/* Meta do nível */}
        <div className="flex items-center gap-2.5 h-5 shrink-0">
          <Label className="text-xs">{t('game.goal')}</Label>
          <div className="flex-1 h-2.5 rounded-full bg-panel overflow-hidden">
            <div className="h-full rounded-full bg-tile-green transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm font-black">{foundWordsList.length}/{requiredWords}</span>
        </div>

        {/* Tabuleiro */}
        <div className="relative flex-1 min-h-0 touch-none">
          <GameBoard grid={displayGrid} activePiece={null} gridRef={boardGridRef} centered />
          {popup && (
            <div key={popup.id} className="pointer-events-none absolute inset-x-0 top-1/3 flex flex-col items-center gap-1">
              <span className="px-4 py-1.5 rounded-full bg-tile-yellow text-ink text-xl font-black shadow-lg">
                +{n(popup.points)}
              </span>
              {popup.labels.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-ink/90 text-white text-xs font-extrabold">
                  {popup.labels.map(label => t(label.key, label.vars)).join(' · ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Palavras do nível */}
        <div className="flex flex-wrap justify-center content-center gap-1.5 shrink-0 max-h-[88px] overflow-y-auto">
          {levelWords.map(word => <WordChip key={word} word={word} found={foundWordsList.includes(word)} />)}
        </div>

        {/* Bandeja: arraste uma peça até o tabuleiro */}
        <div className="grid grid-cols-3 grid-rows-1 gap-2 h-[128px] shrink-0 select-none" aria-label={t('encaixe.tray')} data-testid="encaixe-tray">
          {tray.map((piece, slot) => (
            <div
              key={piece?.id ?? `vazio-${slot}`}
              data-testid={`encaixe-slot-${slot}`}
              onPointerDown={e => startDrag(slot, e)}
              className={`min-h-0 overflow-hidden rounded-2xl bg-panel/60 flex flex-col items-center justify-center gap-1.5 py-2 touch-none ${piece && canAct ? 'cursor-grab' : ''}`}
            >
              {piece && (
                <div className="flex-1 min-h-0 flex items-center justify-center">
                  <div
                    className={`grid gap-0.5 transition-opacity ${drag?.slot === slot ? 'opacity-20' : ''} ${canAct && !fitsAnywhere(grid, piece) ? 'opacity-40' : ''}`}
                    style={{ gridTemplateColumns: `repeat(${piece.shape[0].length}, 24px)` }}
                  >
                    {piece.shape.flatMap((row, r) => row.map((filled, c) => filled
                      ? <Tile key={`${r}-${c}`} letter={piece.letters[r][c]} color={piece.color} size={24} />
                      : <div key={`${r}-${c}`} className="w-6 h-6" />))}
                  </div>
                </div>
              )}
              {slot === ENCAIXE.rotateSlot && piece && (
                <button
                  type="button"
                  aria-label={t('encaixe.rotate')}
                  data-testid="encaixe-rotate"
                  disabled={!canAct}
                  onPointerDown={e => {
                    // Só no pointerdown (como os botões do Clássico) e sem começar a arrastar
                    e.stopPropagation();
                    e.preventDefault();
                    rotate(slot);
                  }}
                  className="shrink-0 h-7 px-4 rounded-full bg-white/90 text-ink shadow flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
                >
                  <IconRotate size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Peça sendo arrastada: acima do dedo, no tamanho das casas do tabuleiro */}
      {drag && draggedPiece && (
        <div
          className="fixed z-40 pointer-events-none grid"
          style={{
            left: drag.x - (draggedPiece.shape[0].length * pitch) / 2,
            top: drag.y - ENCAIXE.dragLift - draggedPiece.shape.length * pitch,
            gridTemplateColumns: `repeat(${draggedPiece.shape[0].length}, ${pitch}px)`,
            gridAutoRows: `${pitch}px`,
          }}
        >
          {draggedPiece.shape.flatMap((row, r) => row.map((filled, c) => filled
            ? <Tile key={`${r}-${c}`} letter={draggedPiece.letters[r][c]} color={draggedPiece.color} size={Math.round(pitch * 0.9)} className="shadow-xl" />
            : <div key={`${r}-${c}`} />))}
        </div>
      )}

      {/* Telas por cima do jogo */}
      {isGameOver ? (
        <GameOver
          score={score}
          level={level}
          words={gameWords}
          isNewRecord={isNewRecord}
          busy={adBusy}
          onRestart={restartAfterGameOver}
          onHome={onHome}
          subtitle={t('encaixe.gameOverSubtitle', { level })}
        />
      ) : levelPhase === 'intro' ? (
        <LevelIntro
          key={level}
          level={level}
          words={levelWords}
          requiredWords={requiredWords}
          onStart={() => setLevelPhase(phase => (phase === 'intro' ? 'playing' : phase))}
        />
      ) : levelPhase === 'splash' ? (
        <LevelSplash level={level} words={foundWordsList} noLines={noLinesBonus > 0} />
      ) : levelPhase === 'summary' ? (
        <LevelComplete
          level={level}
          requiredWords={requiredWords}
          words={foundWordsList.length}
          points={score - levelStart.score}
          lines={linesCleared - levelStart.lines}
          levelBonus={levelBonus}
          noLinesBonus={noLinesBonus}
          nextLevel={nextLevel}
          nextPoolName={t(`pools.${library.getPoolNameForLevel(nextLevel)}` as MessageKey)}
          nextRequiredWords={library.getRequiredWordsForLevel(nextLevel)}
          newLetters={newLetters}
          onContinue={continueToNextLevel}
        />
      ) : isPaused ? (
        <PauseMenu
          onResume={() => setIsPaused(false)}
          onHelp={onHelp}
          onRestart={startNewGame}
          onHome={onHome}
        />
      ) : null}
    </div>
  );
}
