import { useState, useEffect, useCallback, useRef } from 'react';
import type { PointerEvent } from 'react';
import { GameBoard, type Cell } from './GameBoard';
import { createRandomPiece, canPlacePiece, rotatePiece, type TetrisPiece } from './TetrisPieces';
import { findWords, removeWords, highlightWords } from './WordDetector';
import { ScoreSystem, type ScoredWord } from './ScoreSystem';
import { WordLibrary } from './WordLibrary';
import { GameOver, LevelComplete, PauseMenu } from './GameOverlays';
import {
  IconDown, IconDrop, IconLeft, IconPause, IconRight, IconRotate, IconSwipe, IconSwipeDown, IconTap,
  Label, Logo, Panel, Tile, TILE_COLORS, WordChip, type ControlMode,
} from './LetrisUI';
import { useBoardGestures } from '../hooks/useBoardGestures';
import { adBreakNext } from '../lib/ads';
import { KEYS, load, save } from '../lib/storage';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

const createEmptyCell = (): Cell => ({ letter: null, color: null, isActive: false, isHighlighted: false });

const createEmptyGrid = (): Cell[][] =>
  Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null).map(createEmptyCell));

function findCompleteLines(grid: Cell[][]): number[] {
  const lines: number[] = [];
  for (let row = 0; row < GRID_HEIGHT; row++) {
    if (grid[row].every(cell => cell.letter !== null)) lines.push(row);
  }
  return lines;
}

// Remove as linhas indicadas e desce o que está acima (como no Tetris)
function removeLines(grid: Cell[][], lines: number[]): Cell[][] {
  const toRemove = new Set(lines);
  const kept = grid.filter((_, row) => !toRemove.has(row));
  const emptyRows = Array(grid.length - kept.length).fill(null)
    .map(() => Array(GRID_WIDTH).fill(null).map(createEmptyCell));
  return [...emptyRows, ...kept];
}

// Gravidade por coluna: letras caem nos buracos deixados pelas palavras
function applyGravity(grid: Cell[][]): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  for (let col = 0; col < GRID_WIDTH; col++) {
    let writeIndex = GRID_HEIGHT - 1;
    for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
      if (newGrid[row][col].letter !== null) {
        if (writeIndex !== row) {
          newGrid[writeIndex][col] = { ...newGrid[row][col] };
          newGrid[row][col] = createEmptyCell();
        }
        writeIndex--;
      }
    }
  }
  return newGrid;
}

// Ao girar encostado na parede, tenta deslocar a peça um pouco
const ROTATION_KICKS = [0, -1, 1, -2, 2];

interface LetrisGameProps {
  controlMode: ControlMode;
  onControlModeChange: (mode: ControlMode) => void;
  onHome: () => void;
  onHelp: () => void;
}

export function LetrisGame({ controlMode, onControlModeChange, onHome, onHelp }: LetrisGameProps) {
  const [grid, setGrid] = useState<Cell[][]>(createEmptyGrid);
  const [currentPiece, setCurrentPiece] = useState<TetrisPiece | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrisPiece | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [foundWordsList, setFoundWordsList] = useState<string[]>([]);
  const [gameWords, setGameWords] = useState<string[]>([]);
  // Lista sorteada do nível (as que contam para a meta)
  const [levelWords, setLevelWords] = useState<string[]>([]);
  // Aviso de pontos na tela ("+150", "Combo ×1,5"...)
  const [popup, setPopup] = useState<{ id: number; points: number; labels: string[] } | null>(null);
  const [levelBonus, setLevelBonus] = useState(0);
  const [linesToClear, setLinesToClear] = useState<number[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  // Pontos e linhas no início do nível, para o resumo de "nível concluído"
  const [levelStart, setLevelStart] = useState({ score: 0, lines: 0 });

  const resolveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Estado "real" do tabuleiro, da peça e do nível para uso em timeouts e
  // em vários movimentos no mesmo evento (gestos rápidos).
  const gridRef = useRef<Cell[][]>(grid);
  const pieceRef = useRef<TetrisPiece | null>(null);
  const levelRef = useRef(level);
  levelRef.current = level;
  const totalsRef = useRef({ score, lines: linesCleared });
  totalsRef.current = { score, lines: linesCleared };
  const isResolvingRef = useRef(false);

  // Palavras do nível: lista sorteada, banco válido (lista + bônus), as já
  // formadas no nível e as já sorteadas na partida (para não repetir).
  const levelWordsRef = useRef<string[]>([]);
  const bankRef = useRef<Set<string>>(new Set());
  const foundTargetsRef = useRef<Set<string>>(new Set());
  const formedInLevelRef = useRef<Set<string>>(new Set());
  const usedWordsRef = useRef<Set<string>>(new Set());
  const letterGenRef = useRef<() => string>(() => 'A');
  // Enquanto palavras/linhas estão sendo destacadas e removidas, a próxima
  // peça não nasce (evita que ela seja apagada ou deslocada pela limpeza).
  const [isResolving, setIsResolving] = useState(false);

  // Tempo efetivamente jogado no nível (sem pausas, telas de fim de nível
  // nem anúncios). É ele que acelera a queda com o passar do tempo; zera a
  // cada nível.
  const playedMsRef = useRef(0);
  const runningSinceRef = useRef<number | null>(null);
  const getPlayedMs = () =>
    playedMsRef.current + (runningSinceRef.current !== null ? Date.now() - runningSinceRef.current : 0);

  const updateGrid = useCallback((newGrid: Cell[][]) => {
    gridRef.current = newGrid;
    setGrid(newGrid);
  }, []);

  const updatePiece = useCallback((piece: TetrisPiece | null) => {
    pieceRef.current = piece;
    setCurrentPiece(piece);
  }, []);

  // Sorteia a lista do nível e prepara o gerador de letras com peso
  const setupLevel = (lvl: number) => {
    const words = WordLibrary.drawWordsForLevel(lvl, usedWordsRef.current);
    words.forEach(w => usedWordsRef.current.add(w));
    levelWordsRef.current = words;
    setLevelWords(words);
    bankRef.current = WordLibrary.getBankForLevel(lvl);
    foundTargetsRef.current = new Set();
    formedInLevelRef.current = new Set();
    letterGenRef.current = WordLibrary.createLetterGenerator(
      lvl,
      () => levelWordsRef.current.filter(w => !foundTargetsRef.current.has(w)),
    );
  };

  const newPiece = () => createRandomPiece(() => letterGenRef.current());

  const showPopup = useCallback((points: number, labels: string[]) => {
    setPopup({ id: Date.now(), points, labels });
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    popupTimeoutRef.current = setTimeout(() => setPopup(null), 1400);
  }, []);

  const cancelResolution = () => {
    if (resolveTimeoutRef.current) clearTimeout(resolveTimeoutRef.current);
    isResolvingRef.current = false;
    setIsResolving(false);
    setLinesToClear([]);
  };

  const startNewGame = () => {
    cancelResolution();
    usedWordsRef.current = new Set();
    setupLevel(1);
    updateGrid(createEmptyGrid());
    updatePiece(newPiece());
    setNextPiece(newPiece());
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setIsGameOver(false);
    setIsNewRecord(false);
    setIsPaused(false);
    setFoundWordsList([]);
    setGameWords([]);
    setPopup(null);
    setShowLevelUp(false);
    setLevelStart({ score: 0, lines: 0 });
    playedMsRef.current = 0;
    runningSinceRef.current = Date.now();
  };

  useEffect(() => {
    startNewGame();
  }, []);

  /**
   * Procura palavras e linhas completas no MESMO tabuleiro, destaca tudo,
   * registra as palavras e, após a animação, remove palavras e linhas juntas.
   * Depois repete (cascata) até não sobrar nada a eliminar.
   * Retorna true se iniciou uma rodada de eliminação.
   */
  const resolveBoard = useCallback((currentGrid: Cell[][], cascade = false): boolean => {
    if (isResolvingRef.current) return true;

    const currentLevel = levelRef.current;
    const words = findWords(currentGrid, bankRef.current);
    const lines = findCompleteLines(currentGrid);
    if (words.length === 0 && lines.length === 0) return false;

    isResolvingRef.current = true;
    setIsResolving(true);

    // Classifica: palavra da lista (conta para a meta) ou bônus; nova ou repetida
    const scored: ScoredWord[] = words.map(({ word }) => {
      const result = {
        word,
        bonus: !levelWordsRef.current.includes(word),
        repeated: formedInLevelRef.current.has(word),
      };
      formedInLevelRef.current.add(word);
      return result;
    });

    if (words.length > 0) {
      updateGrid(highlightWords(currentGrid, words));
      const newTargets = scored.filter(w => !w.bonus && !foundTargetsRef.current.has(w.word)).map(w => w.word);
      newTargets.forEach(w => foundTargetsRef.current.add(w));
      if (newTargets.length > 0) setFoundWordsList([...foundTargetsRef.current]);
      setGameWords(prev => [...prev, ...scored.map(w => w.word).filter((w, i, all) => !prev.includes(w) && all.indexOf(w) === i)]);
    }
    if (lines.length > 0) {
      setLinesToClear(lines);
      setLinesCleared(prev => prev + lines.length);
    }

    // Pontua já na detecção (o resumo do nível fica certo mesmo que o
    // jogador avance antes de a animação terminar)
    const result = ScoreSystem.scoreClear(scored, lines.length, currentLevel, cascade);
    setScore(prev => prev + result.points);
    showPopup(result.points, result.labels);

    resolveTimeoutRef.current = setTimeout(() => {
      let newGrid = removeWords(gridRef.current, words);
      if (lines.length > 0) newGrid = removeLines(newGrid, lines);
      if (words.length > 0) newGrid = applyGravity(newGrid);

      setLinesToClear([]);
      updateGrid(newGrid);

      // Cascata: a remoção pode ter formado novas palavras ou linhas
      isResolvingRef.current = false;
      if (!resolveBoard(newGrid, true)) {
        setIsResolving(false);
      }
    }, 1000);

    return true;
  }, [updateGrid, showPopup]);

  const placePiece = useCallback((piece: TetrisPiece) => {
    const newGrid = gridRef.current.map(row => row.map(cell => ({ ...cell })));

    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const gridRow = piece.y + row;
          const gridCol = piece.x + col;
          if (gridRow >= 0 && gridRow < GRID_HEIGHT && gridCol >= 0 && gridCol < GRID_WIDTH) {
            newGrid[gridRow][gridCol] = {
              letter: piece.letters[row][col],
              color: piece.color,
              isActive: false,
              isHighlighted: false,
            };
          }
        }
      }
    }

    updateGrid(newGrid);
    resolveBoard(newGrid);
  }, [updateGrid, resolveBoard]);

  const spawnNewPiece = useCallback(() => {
    if (!nextPiece) return;
    const spawned = { ...nextPiece };
    if (canPlacePiece(spawned, gridRef.current)) {
      updatePiece(spawned);
      setNextPiece(createRandomPiece(() => letterGenRef.current()));
    } else {
      setIsGameOver(true);
    }
  }, [nextPiece, updatePiece]);

  const canAct = !isPaused && !isGameOver;

  /** Move a peça; retorna true se ela encaixou no tabuleiro. */
  const movePiece = useCallback((deltaX: number, deltaY: number): boolean => {
    const piece = pieceRef.current;
    if (!piece || !canAct) return false;

    const newX = piece.x + deltaX;
    const newY = piece.y + deltaY;
    if (canPlacePiece(piece, gridRef.current, newX, newY)) {
      updatePiece({ ...piece, x: newX, y: newY });
      return false;
    }
    if (deltaY > 0) {
      // Bateu embaixo: encaixa (a próxima nasce pelo efeito abaixo)
      placePiece(piece);
      updatePiece(null);
      return true;
    }
    return false;
  }, [canAct, placePiece, updatePiece]);

  const rotatePieceHandler = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece || !canAct) return;

    const rotated = rotatePiece(piece);
    for (const kick of ROTATION_KICKS) {
      if (canPlacePiece(rotated, gridRef.current, rotated.x + kick, rotated.y)) {
        updatePiece({ ...rotated, x: rotated.x + kick });
        return;
      }
    }
  }, [canAct, updatePiece]);

  const dropPiece = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece || !canAct) return;

    let newY = piece.y;
    while (canPlacePiece(piece, gridRef.current, piece.x, newY + 1)) newY++;
    const dropPoints = ScoreSystem.hardDropPoints(newY - piece.y);
    if (dropPoints > 0) setScore(prev => prev + dropPoints);
    placePiece({ ...piece, y: newY });
    updatePiece(null);
  }, [canAct, placePiece, updatePiece]);

  const togglePause = useCallback(() => setIsPaused(prev => !prev), []);

  // Linha onde a peça vai parar (contorno tracejado)
  let ghostY: number | null = null;
  if (currentPiece) {
    ghostY = currentPiece.y;
    while (canPlacePiece(currentPiece, grid, currentPiece.x, ghostY + 1)) ghostY++;
  }

  const running = !isPaused && !isGameOver;
  const hasPiece = currentPiece !== null;
  const moveRef = useRef(movePiece);
  moveRef.current = movePiece;

  // Liga/desliga o cronômetro de tempo jogado junto com a pausa
  useEffect(() => {
    if (running) {
      runningSinceRef.current = Date.now();
    } else if (runningSinceRef.current !== null) {
      playedMsRef.current += Date.now() - runningSinceRef.current;
      runningSinceRef.current = null;
    }
  }, [running]);

  // Gravidade: um relógio por peça, que NÃO recomeça quando a peça gira ou
  // anda para os lados (senão girar sem parar segurava a peça no ar).
  useEffect(() => {
    if (!running || !hasPiece) return;
    const fallSpeed = () => ScoreSystem.calculateFallSpeed(levelRef.current, getPlayedMs());
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      moveRef.current(0, 1);
      timer = setTimeout(tick, fallSpeed());
    };
    timer = setTimeout(tick, fallSpeed());
    return () => clearTimeout(timer);
  }, [running, hasPiece, level]);

  // Nasce a próxima peça quando não há peça ativa nem limpeza em andamento
  useEffect(() => {
    if (!currentPiece && !isGameOver && nextPiece && !isResolving && !showLevelUp) {
      spawnNewPiece();
    }
  }, [currentPiece, isGameOver, spawnNewPiece, nextPiece, isResolving, showLevelUp]);

  // Pausa sozinho quando o app vai para o segundo plano
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') setIsPaused(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isGameOver) return;
      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          movePiece(-1, 0);
          break;
        case 'd':
        case 'arrowright':
          movePiece(1, 0);
          break;
        case 's':
        case 'arrowdown':
          movePiece(0, 1);
          break;
        case 'w':
        case 'arrowup':
          rotatePieceHandler();
          break;
        case ' ':
          e.preventDefault();
          dropPiece();
          break;
        case 'p':
          togglePause();
          break;
        case 'h':
          setIsPaused(true);
          onHelp();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, rotatePieceHandler, dropPiece, togglePause, isGameOver, onHelp]);

  // Meta do nível atingida: pausa e mostra o resumo
  const requiredWords = WordLibrary.getRequiredWordsForLevel(level);
  useEffect(() => {
    if (foundWordsList.length >= requiredWords && !showLevelUp) {
      const bonus = ScoreSystem.levelCompletePoints(level);
      setScore(prev => prev + bonus);
      setLevelBonus(bonus);
      setIsPaused(true);
      setShowLevelUp(true);
      save(KEYS.bestLevel, Math.max(load(KEYS.bestLevel, 1), level + 1));
    }
  }, [foundWordsList.length, requiredWords, level, showLevelUp]);

  // Fim de jogo: atualiza o recorde
  useEffect(() => {
    if (!isGameOver) return;
    if (score > load(KEYS.bestScore, 0)) {
      save(KEYS.bestScore, score);
      setIsNewRecord(true);
    }
    save(KEYS.bestLevel, Math.max(load(KEYS.bestLevel, 1), level));
  }, [isGameOver]);

  const continueToNextLevel = async () => {
    setAdBusy(true);
    await adBreakNext('proximo-nivel');
    setAdBusy(false);

    const nextLevel = level + 1;
    cancelResolution();
    setupLevel(nextLevel);
    setLevel(nextLevel);
    updateGrid(createEmptyGrid());
    setFoundWordsList([]);
    setLevelStart({ ...totalsRef.current });
    playedMsRef.current = 0;
    runningSinceRef.current = Date.now();
    updatePiece(newPiece());
    setNextPiece(newPiece());
    setShowLevelUp(false);
    setIsPaused(false);
  };

  const restartAfterGameOver = async () => {
    setAdBusy(true);
    await adBreakNext('jogar-de-novo');
    setAdBusy(false);
    startNewGame();
  };

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (resolveTimeoutRef.current) clearTimeout(resolveTimeoutRef.current);
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, []);

  // ---------- Controles ----------

  const gestures = useBoardGestures({ move: movePiece, rotate: rotatePieceHandler });

  // Botões agem SÓ no pointerdown. Não usar onClick nem onTouchStart junto:
  // no celular o click chega ao soltar o dedo e a peça andava duas vezes.
  const controlButton = (action: () => void) => ({
    type: 'button' as const,
    tabIndex: -1,
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!e.isPrimary || e.button !== 0) return;
      action();
    },
  });

  // "↓" segurado continua descendo (depois de 250 ms, para um toque não virar dois)
  const holdRef = useRef<{ timeout?: ReturnType<typeof setTimeout>; interval?: ReturnType<typeof setInterval> }>({});
  const stopHold = () => {
    clearTimeout(holdRef.current.timeout);
    clearInterval(holdRef.current.interval);
    holdRef.current = {};
  };
  const softDropButton = {
    type: 'button' as const,
    tabIndex: -1,
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!e.isPrimary || e.button !== 0) return;
      stopHold();
      if (moveRef.current(0, 1)) return;
      holdRef.current.timeout = setTimeout(() => {
        holdRef.current.interval = setInterval(() => {
          if (moveRef.current(0, 1)) stopHold();
        }, 60);
      }, 250);
    },
    onPointerUp: stopHold,
    onPointerLeave: stopHold,
    onPointerCancel: stopHold,
  };
  useEffect(() => stopHold, []);

  // ---------- Tela ----------

  const progress = Math.min(100, (foundWordsList.length / requiredWords) * 100);
  const nextLevel = level + 1;
  const currentLetters = WordLibrary.getAvailableLettersForLevel(level);
  const newLetters = WordLibrary.getAvailableLettersForLevel(nextLevel).filter(l => !currentLetters.includes(l));

  return (
    <div className="h-full w-full bg-ink text-white flex justify-center game-area safe-area">
      <div className="h-full w-full max-w-md flex flex-col gap-2 px-4 pt-2 pb-2">

        {/* Topo: logo, placar e pausa */}
        <div className="flex items-center gap-2 h-11 shrink-0">
          <Logo size={20} />
          <div className="flex-1 flex justify-end gap-2.5 text-sm font-extrabold text-soft whitespace-nowrap">
            <span>Nv <span className="text-white font-black">{level}</span></span>
            <span><span className="text-white font-black">{score.toLocaleString('pt-BR')}</span> pts</span>
            <span><span className="text-white font-black">{linesCleared}</span> lin</span>
          </div>
          <button
            type="button"
            aria-label="Pausar"
            onClick={() => setIsPaused(true)}
            className="w-11 h-11 rounded-full bg-panel flex items-center justify-center shrink-0"
          >
            <IconPause size={20} strokeWidth={2.8} />
          </button>
        </div>

        {/* Meta do nível */}
        <div className="flex items-center gap-2.5 h-5 shrink-0">
          <Label className="text-xs">META</Label>
          <div className="flex-1 h-2.5 rounded-full bg-panel overflow-hidden">
            <div className="h-full rounded-full bg-tile-green transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm font-black">{foundWordsList.length}/{requiredWords}</span>
        </div>

        {/* Tabuleiro + lateral */}
        <div className="flex-1 min-h-0 flex gap-3">
          <div className="relative flex-1 min-w-0 min-h-0 touch-none" {...gestures}>
            <GameBoard grid={grid} activePiece={currentPiece} ghostY={ghostY} linesToClear={linesToClear} />
            {popup && (
              <div key={popup.id} className="pointer-events-none absolute inset-x-0 top-1/3 flex flex-col items-center gap-1">
                <span className="px-4 py-1.5 rounded-full bg-tile-yellow text-ink text-xl font-black shadow-lg">
                  +{popup.points.toLocaleString('pt-BR')}
                </span>
                {popup.labels.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-ink/90 text-white text-xs font-extrabold">
                    {popup.labels.join(' · ')}
                  </span>
                )}
              </div>
            )}
          </div>

          <aside className={`${controlMode === 'gestures' ? 'w-[68px]' : 'w-[84px]'} shrink-0 flex flex-col gap-2.5`}>
            <Panel className="py-2.5 px-1.5 flex flex-col items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-wide text-soft">PRÓXIMA</span>
              {nextPiece && (
                <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 16px)` }}>
                  {nextPiece.shape.flatMap((row, r) => row.map((filled, c) => filled
                    ? <Tile key={`${r}-${c}`} letter={nextPiece.letters[r][c]} color={nextPiece.color} size={16} />
                    : <div key={`${r}-${c}`} className="w-4 h-4" />))}
                </div>
              )}
            </Panel>
            <Panel className="py-2.5 px-1.5 flex flex-col items-center gap-2 min-h-0 overflow-hidden">
              <span className="text-[10px] font-extrabold tracking-wide text-soft">LETRAS</span>
              <div className="grid grid-cols-3 gap-0.5">
                {currentLetters.map((letter, i) => (
                  <Tile key={letter} letter={letter} color={TILE_COLORS[i % TILE_COLORS.length]} size={controlMode === 'gestures' ? 16 : 18} />
                ))}
              </div>
            </Panel>
          </aside>
        </div>

        {/* Palavras do nível */}
        <div className="flex flex-wrap justify-center content-center gap-1.5 shrink-0 max-h-[88px] overflow-y-auto">
          {levelWords.map(word => <WordChip key={word} word={word} found={foundWordsList.includes(word)} />)}
        </div>

        {/* Controles */}
        {controlMode === 'buttons' ? (
          <div className="flex items-center justify-between h-[72px] shrink-0 select-none game-controls">
            <div className="flex gap-[3px]">
              <button aria-label="Mover para a esquerda" {...controlButton(() => movePiece(-1, 0))}
                className="btn-3d w-16 h-16 rounded-l-[20px] rounded-r-md bg-panel text-white flex items-center justify-center">
                <IconLeft size={28} />
              </button>
              <button aria-label="Descer" {...softDropButton}
                className="btn-3d w-16 h-16 rounded-md bg-panel text-white flex items-center justify-center">
                <IconDown size={28} />
              </button>
              <button aria-label="Mover para a direita" {...controlButton(() => movePiece(1, 0))}
                className="btn-3d w-16 h-16 rounded-r-[20px] rounded-l-md bg-panel text-white flex items-center justify-center">
                <IconRight size={28} />
              </button>
            </div>
            <div className="flex gap-3">
              <button aria-label="Girar" {...controlButton(rotatePieceHandler)}
                className="btn-3d w-[66px] h-[66px] rounded-full bg-tile-yellow text-ink flex items-center justify-center">
                <IconRotate size={30} />
              </button>
              <button aria-label="Soltar peça" {...controlButton(dropPiece)}
                className="btn-3d w-[66px] h-[66px] rounded-full bg-tile-red text-white flex items-center justify-center">
                <IconDrop size={30} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-3.5 h-6 items-center shrink-0 text-xs font-extrabold text-soft">
            <span className="flex items-center gap-1"><span className="text-tile-yellow"><IconSwipe size={16} /></span>deslize: mover</span>
            <span className="flex items-center gap-1"><span className="text-tile-yellow"><IconTap size={16} /></span>toque: girar</span>
            <span className="flex items-center gap-1"><span className="text-tile-yellow"><IconSwipeDown size={16} /></span>arraste ↓: acelerar</span>
          </div>
        )}
      </div>

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
        />
      ) : showLevelUp ? (
        <LevelComplete
          level={level}
          requiredWords={requiredWords}
          words={foundWordsList.length}
          points={score - levelStart.score}
          lines={linesCleared - levelStart.lines}
          levelBonus={levelBonus}
          nextLevel={nextLevel}
          nextPoolName={WordLibrary.getPoolNameForLevel(nextLevel)}
          nextRequiredWords={WordLibrary.getRequiredWordsForLevel(nextLevel)}
          newLetters={newLetters}
          busy={adBusy}
          onContinue={continueToNextLevel}
        />
      ) : isPaused ? (
        <PauseMenu
          controlMode={controlMode}
          onControlModeChange={onControlModeChange}
          onResume={() => setIsPaused(false)}
          onHelp={onHelp}
          onRestart={startNewGame}
          onHome={onHome}
        />
      ) : null}
    </div>
  );
}
