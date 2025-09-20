import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameBoard } from './GameBoard';
import { GameStats } from './GameStats';
import { createRandomPiece, canPlacePiece, rotatePiece, TetrisPiece } from './TetrisPieces';
import { findWords, removeWords, highlightWords, FoundWord } from './WordDetector';
import { ScoreSystem } from './ScoreSystem';
import { WordLibrary } from './WordLibrary';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Cell {
  letter: string | null;
  isActive: boolean;
  isHighlighted: boolean;
}

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const INITIAL_FALL_SPEED = 1000; // milliseconds

export function LetrisGame() {
  const [grid, setGrid] = useState<Cell[][]>(() => 
    Array(GRID_HEIGHT).fill(null).map(() => 
      Array(GRID_WIDTH).fill(null).map(() => ({ 
        letter: null, 
        isActive: false, 
        isHighlighted: false 
      }))
    )
  );
  
  const [currentPiece, setCurrentPiece] = useState<TetrisPiece | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrisPiece | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [wordsFound, setWordsFound] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [foundWordsList, setFoundWordsList] = useState<string[]>([]);
  const [linesClearedNotification, setLinesClearedNotification] = useState<number>(0);
  const [linesToClear, setLinesToClear] = useState<number[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const wordHighlightRef = useRef<NodeJS.Timeout>();
  const lineHighlightRef = useRef<NodeJS.Timeout>();

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const newGrid = Array(GRID_HEIGHT).fill(null).map(() => 
      Array(GRID_WIDTH).fill(null).map(() => ({ 
        letter: null, 
        isActive: false, 
        isHighlighted: false 
      }))
    );
    
    setGrid(newGrid);
    setCurrentPiece(createRandomPiece(1));
    setNextPiece(createRandomPiece(1));
    setScore(0);
    setLevel(1);
    setWordsFound(0);
    setLinesCleared(0);
    setIsGameOver(false);
    setIsPaused(false);
    setFoundWords([]);
    setFoundWordsList([]);
    setLinesClearedNotification(0);
    setLinesToClear([]);
    setShowLevelUp(false);
    setNewLevel(1);
    setShowHelp(false);
    setGameStartTime(Date.now());
  };

  const checkAndRemoveWords = useCallback((currentGrid: Cell[][]) => {
    const words = findWords(currentGrid, level);
    if (words.length > 0) {
      // Highlight words first
      const highlightedGrid = highlightWords(currentGrid, words);
      setGrid(highlightedGrid);
      setFoundWords(words);
      
      // Add words to found list
      const newFoundWords = words.map(w => w.word);
      setFoundWordsList(prev => {
        const updated = [...prev];
        newFoundWords.forEach(word => {
          if (!updated.includes(word)) {
            updated.push(word);
          }
        });
        return updated;
      });
      
      // Remove words after a short delay
      wordHighlightRef.current = setTimeout(() => {
        const clearedGrid = removeWords(currentGrid, words);
        
        // Usar o sistema de pontuação
        const scoreCalc = ScoreSystem.calculateWordPoints(words.length, level);
        setScore(prev => prev + scoreCalc.points);
        setWordsFound(prev => prev + words.length);
        setFoundWords([]);
        
        // Apply gravity after removing words
        applyGravityAndCheckLines(clearedGrid);
      }, 1000);
    }
  }, [level]);

  const executeLineClear = useCallback((currentGrid: Cell[][], linesToRemove: number[]) => {
    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    
    // Remove lines from bottom to top to maintain indices
    linesToRemove.sort((a, b) => b - a).forEach(row => {
      newGrid.splice(row, 1);
      // Add new empty line at top
      newGrid.unshift(
        Array(GRID_WIDTH).fill(null).map(() => ({ 
          letter: null, 
          isActive: false, 
          isHighlighted: false 
        }))
      );
    });
    
    const linesCount = linesToRemove.length;
    
    // Usar o sistema de pontuação
    const scoreCalc = ScoreSystem.calculateLinePoints(linesCount, level);
    setScore(prev => prev + scoreCalc.points);
    setLinesCleared(prev => prev + linesCount);
    setLinesToClear([]);
    
    // Show notification
    setLinesClearedNotification(linesCount);
    setTimeout(() => setLinesClearedNotification(0), 2000);
    
    setGrid(newGrid);
    
    // Check for words after line clear
    setTimeout(() => {
      checkAndRemoveWords(newGrid);
    }, 500);
  }, [level, checkAndRemoveWords]);

  const highlightCompleteLines = useCallback((currentGrid: Cell[][]) => {
    const linesToHighlight: number[] = [];
    
    // Find all complete lines
    for (let row = 0; row < GRID_HEIGHT; row++) {
      const isComplete = currentGrid[row].every(cell => cell.letter !== null);
      if (isComplete) {
        linesToHighlight.push(row);
      }
    }
    
    if (linesToHighlight.length > 0) {
      setLinesToClear(linesToHighlight);
      
      // Clear lines after highlighting
      lineHighlightRef.current = setTimeout(() => {
        executeLineClear(currentGrid, linesToHighlight);
      }, 1000);
    }
    
    return linesToHighlight.length > 0;
  }, [executeLineClear]);

  const placePiece = useCallback((piece: TetrisPiece) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      
      for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
          if (piece.shape[row][col]) {
            const gridRow = piece.y + row;
            const gridCol = piece.x + col;
            
            if (gridRow >= 0 && gridRow < GRID_HEIGHT && gridCol >= 0 && gridCol < GRID_WIDTH) {
              newGrid[gridRow][gridCol] = {
                letter: piece.letters[row][col],
                isActive: false,
                isHighlighted: false
              };
            }
          }
        }
      }
      
      // Process the grid immediately after placing piece
      setTimeout(() => {
        if (!highlightCompleteLines(newGrid)) {
          // No lines to clear, check for words immediately
          setTimeout(() => {
            checkAndRemoveWords(newGrid);
          }, 100);
        }
      }, 50);
      
      return newGrid;
    });
  }, [highlightCompleteLines, checkAndRemoveWords]);

  const applyGravityAndCheckLines = useCallback((currentGrid: Cell[][]) => {
    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    
    // Apply gravity column by column
    for (let col = 0; col < GRID_WIDTH; col++) {
      let writeIndex = GRID_HEIGHT - 1;
      
      // Start from bottom and move up
      for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
        if (newGrid[row][col].letter !== null) {
          if (writeIndex !== row) {
            newGrid[writeIndex][col] = { ...newGrid[row][col] };
            newGrid[row][col] = { letter: null, isActive: false, isHighlighted: false };
          }
          writeIndex--;
        }
      }
    }
    
    setGrid(newGrid);
    
    // Check for complete lines after applying gravity (with delay to avoid immediate re-execution)
    setTimeout(() => {
      highlightCompleteLines(newGrid);
    }, 100);
  }, [highlightCompleteLines]);

  const spawnNewPiece = useCallback(() => {
    if (nextPiece) {
      const newPiece = { ...nextPiece };
      if (canPlacePiece(newPiece, grid)) {
        setCurrentPiece(newPiece);
        setNextPiece(createRandomPiece(level));
      } else {
        setIsGameOver(true);
      }
    }
  }, [nextPiece, grid]);

  const movePiece = useCallback((deltaX: number, deltaY: number) => {
    if (!currentPiece || isPaused || isGameOver) return;
    
    const newX = currentPiece.x + deltaX;
    const newY = currentPiece.y + deltaY;
    
    if (canPlacePiece(currentPiece, grid, newX, newY)) {
      setCurrentPiece(prev => prev ? { ...prev, x: newX, y: newY } : null);
    } else if (deltaY > 0) {
      // Piece hit something below, place it
      placePiece(currentPiece);
      setCurrentPiece(null);
      setTimeout(() => {
        spawnNewPiece();
      }, 100);
    }
  }, [currentPiece, grid, isPaused, isGameOver, placePiece, checkAndRemoveWords, spawnNewPiece]);

  const rotatePieceHandler = useCallback(() => {
    if (!currentPiece || isPaused || isGameOver) return;
    
    const rotated = rotatePiece(currentPiece);
    if (canPlacePiece(rotated, grid)) {
      setCurrentPiece(rotated);
    }
  }, [currentPiece, grid, isPaused, isGameOver]);

  const dropPiece = useCallback(() => {
    if (!currentPiece || isPaused || isGameOver) return;
    
    let newY = currentPiece.y;
    while (canPlacePiece(currentPiece, grid, currentPiece.x, newY + 1)) {
      newY++;
    }
    
    const droppedPiece = { ...currentPiece, y: newY };
    placePiece(droppedPiece);
    setCurrentPiece(null);
    setTimeout(() => {
      spawnNewPiece();
    }, 100);
  }, [currentPiece, grid, isPaused, isGameOver, placePiece, checkAndRemoveWords, spawnNewPiece]);

  // Game loop
  useEffect(() => {
    if (!isPaused && !isGameOver && currentPiece) {
      const currentTime = Date.now();
      const gameTime = currentTime - gameStartTime;
      const fallSpeed = ScoreSystem.calculateFallSpeed(level, gameTime);
      
      gameLoopRef.current = setTimeout(() => {
        movePiece(0, 1);
      }, fallSpeed);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [currentPiece, isPaused, isGameOver, level, movePiece, gameStartTime]);

  // Spawn first piece
  useEffect(() => {
    if (!currentPiece && !isGameOver && nextPiece) {
      spawnNewPiece();
    }
  }, [currentPiece, isGameOver, spawnNewPiece, nextPiece]);

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
          setIsPaused(prev => !prev);
          break;
        case 'h':
          setShowHelp(true);
          setIsPaused(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, rotatePieceHandler, dropPiece, isGameOver]);

  // Level up based on words found using the new system
  useEffect(() => {
    const requiredWords = WordLibrary.getRequiredWordsForLevel(level);
    
    // Check if player has found enough words to advance to next level
    if (foundWordsList.length >= requiredWords) {
      const nextLevel = level + 1;
      
      // Pause the game and show level up screen
      setIsPaused(true);
      setShowLevelUp(true);
      setNewLevel(nextLevel);
    }
  }, [foundWordsList.length, level]);
  
  // Function to continue to next level
  const continueToNextLevel = () => {
    setLevel(newLevel);
    
    // Clear the board and reset found words for the new level
    const clearedGrid = Array(GRID_HEIGHT).fill(null).map(() => 
      Array(GRID_WIDTH).fill(null).map(() => ({ 
        letter: null, 
        isActive: false, 
        isHighlighted: false 
      }))
    );
    setGrid(clearedGrid);
    setFoundWordsList([]);
    setWordsFound(0);
    
    // Reset any current piece and spawn new one
    setCurrentPiece(null);
    setTimeout(() => {
      setCurrentPiece(createRandomPiece(newLevel));
      setNextPiece(createRandomPiece(newLevel));
    }, 100);
    
    // Hide level up screen and resume game
    setShowLevelUp(false);
    setIsPaused(false);
  };

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (wordHighlightRef.current) {
        clearTimeout(wordHighlightRef.current);
      }
      if (lineHighlightRef.current) {
        clearTimeout(lineHighlightRef.current);
      }
    };
  }, []);

  //Install app
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne que o mini-infobar padrão apareça
      e.preventDefault();
      // Armazena o evento para que possa ser acionado mais tarde
      setDeferredPrompt(e);
      // Mostra sua própria UI para convidar o usuário a instalar
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Esconde o botão de instalação
      setShowInstallPrompt(false);
      // Mostra o prompt de instalação nativo
      deferredPrompt.prompt();
      // Espera pela resposta do usuário ao prompt
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuário aceitou o prompt de instalação do PWA');
        } else {
          console.log('Usuário recusou o prompt de instalação do PWA');
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
      {/* Container Principal 9:16 */}
      <div className="w-full max-w-sm aspect-[9/16] bg-gradient-to-b from-slate-900 via-blue-900 to-purple-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 text-center relative">
          <h1 className="text-white font-bold text-lg mb-2">LETRIS</h1>
          
          {/* Compact Stats Row */}
          <div className="flex justify-center gap-3 text-xs text-cyan-100">
            <div>Nível <span className="text-white font-bold">{level}</span></div>
            <div>•</div>
            <div>Score <span className="text-white font-bold">{score.toLocaleString()}</span></div>
            <div>•</div>
            <div>Linhas <span className="text-white font-bold">{linesCleared}</span></div>
            <div>•</div>
            <div>Palavras <span className="text-white font-bold">{foundWordsList.length}</span></div>
          </div>
          
          {/* Help Button */}
          <button
            onClick={() => {
              setShowHelp(true);
              setIsPaused(true);
            }}
            className="absolute right-2 top-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
          >
            ?
          </button>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex p-3 gap-3 min-h-0">
          
          {/* Game Board */}
          <div className="flex-1 flex flex-col items-center">
            <GameBoard grid={grid} activePiece={currentPiece} linesToClear={linesToClear} />
            
            {/* Game Status Messages */}
            {foundWords.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-400 bg-opacity-90 rounded text-xs text-center">
                <div className="flex flex-wrap gap-1 justify-center">
                  {foundWords.map((word, index) => (
                    <span key={index} className="bg-yellow-600 text-white px-1 py-0.5 rounded font-bold text-xs">
                      {word.word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {linesClearedNotification > 0 && (
              <div className="mt-2 p-2 bg-green-400 bg-opacity-90 rounded text-xs text-center text-green-900 font-bold">
                {linesClearedNotification === 1 && "Linha!"}
                {linesClearedNotification === 2 && "Duplo!"}
                {linesClearedNotification === 3 && "Triplo!"}
                {linesClearedNotification === 4 && "TETRIS!"}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-20 flex flex-col gap-2">
            
            {/* Level Progress */}
            <div className="bg-slate-800 bg-opacity-70 rounded p-2 text-xs text-cyan-300">
              <div className="text-center mb-1">META</div>
              <div className="text-center mb-1">
                <span className="text-white font-bold">{foundWordsList.length}</span>
                <span className="text-xs mx-1">/</span>
                <span className="text-cyan-300">{WordLibrary.getRequiredWordsForLevel(level)}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="bg-slate-600 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (foundWordsList.length / WordLibrary.getRequiredWordsForLevel(level)) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            {/* Next Piece */}
            {nextPiece && (
              <div className="bg-slate-800 bg-opacity-70 rounded p-2">
                <div className="text-xs text-cyan-300 text-center mb-1">NEXT</div>
                <div className="flex justify-center">
                  <div className="grid gap-0 w-fit">
                    {nextPiece.shape.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex">
                        {row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`
                              w-3 h-3 border border-gray-600 flex items-center justify-center text-xs font-bold
                              ${cell ? 'bg-blue-400 border-blue-300' : 'bg-transparent border-transparent'}
                            `}
                          >
                            {cell && nextPiece.letters[rowIndex][colIndex] && (
                              <span className="text-white text-xs">
                                {nextPiece.letters[rowIndex][colIndex]}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pool Info */}

            {/* Words List */}
            <div className="bg-slate-800 bg-opacity-70 rounded p-2 text-xs text-cyan-300 flex-1 overflow-hidden">
              <div className="text-center mb-1">PALAVRAS</div>
              <div className="text-center mb-1 text-xs">
                {foundWordsList.length}/{WordLibrary.getRequiredWordsForLevel(level)}
              </div>
              <div className="grid grid-cols-1 gap-px text-xs">
                {WordLibrary.getValidWordsForLevel(level).slice(0, 12).map(word => {
                  const isFound = foundWordsList.includes(word);
                  return (
                    <div 
                      key={word}
                      className={`
                        px-1 py-0.5 rounded text-center transition-colors text-xs
                        ${isFound 
                          ? 'bg-green-600 text-white line-through font-bold' 
                          : 'bg-slate-700 text-gray-300'
                        }
                      `}
                    >
                      {word}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-3 bg-slate-900 bg-opacity-70 flex-shrink-0">
          
          {/* Single Row Controls */}
          <div className="grid grid-cols-6 gap-1 mb-2">
            <button
              onPointerDown={() => movePiece(-1, 0)}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded text-xs font-bold active:bg-slate-500"
            >
              ←
            </button>
            <button
              onPointerDown={rotatePieceHandler}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded text-xs font-bold active:bg-slate-500"
            >
              ↻
            </button>
            <button
              onPointerDown={() => movePiece(1, 0)}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded text-xs font-bold active:bg-slate-500"
            >
              →
            </button>
            <button
              onPointerDown={() => movePiece(0, 1)}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded text-xs font-bold active:bg-slate-500"
            >
              ↓
            </button>
            <button
              onPointerDown={dropPiece}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded text-xs font-bold active:bg-blue-700"
            >
              ⬇
            </button>
            <button
              onPointerDown={() => setIsPaused(prev => !prev)}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded text-xs font-bold active:bg-slate-500"
            >
              {isPaused ? "▶" : "⏸"}
            </button>
          </div>
          
          {/* Controls hint */}
          <div className="text-center text-xs text-slate-400">
            Toque no ? para ver todos os controles
          </div>
        </div>

        {/* Game Over / Pause Overlay */}
        {(isPaused || isGameOver) && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="bg-slate-800 p-6 rounded-lg text-center text-white max-w-xs mx-4">
              {isGameOver ? (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-red-400">Game Over!</h2>
                  <p className="mb-2">Score Final: {score.toLocaleString()}</p>
                  <p className="mb-4">Palavras: {foundWordsList.length}</p>
                  <Button 
                    onClick={startNewGame}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Novo Jogo
                  </Button>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold mb-2 text-yellow-400">Pausado</h2>
                  <p className="mb-4">Pressione P ou toque no botão para continuar</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Level Up Modal */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 max-w-md mx-4 text-center border-2 border-blue-200 shadow-2xl">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-blue-800 mb-2">Parabéns!</h2>
              <h3 className="text-xl font-semibold text-purple-700 mb-4">
                Nível {newLevel} Desbloqueado!
              </h3>
            </div>
            
            <div className="bg-white bg-opacity-70 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Novo Pool de Letras:</h4>
              <p className="text-sm text-gray-700 mb-3">
                {newLevel <= 3 && "Pool 1: Letras Básicas (10 letras disponíveis)"}
                {newLevel > 3 && newLevel <= 6 && "Pool 2: Letras Intermediárias (15 letras disponíveis)"}
                {newLevel > 6 && newLevel <= 9 && "Pool 3: Letras Avançadas (20 letras disponíveis)"}
                {newLevel > 9 && "Pool 4: Letras Complexas (25 letras disponíveis)"}
              </p>
              
              <div className="flex flex-wrap gap-1 justify-center">
                {WordLibrary.getAvailableLettersForLevel(newLevel).slice(0, 10).map(letter => (
                  <span 
                    key={letter} 
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold text-sm"
                  >
                    {letter}
                  </span>
                ))}
                {WordLibrary.getAvailableLettersForLevel(newLevel).length > 10 && (
                  <span className="text-gray-500 text-sm">+{WordLibrary.getAvailableLettersForLevel(newLevel).length - 10} mais</span>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">
                Palavras necessárias para o próximo nível: <span className="font-bold">{WordLibrary.getRequiredWordsForLevel(newLevel)}</span>
              </div>
              <div className="text-sm text-gray-600">
                Score atual: <span className="font-bold text-blue-600">{score.toLocaleString()}</span>
              </div>
            </div>
            
            <Button 
              onClick={continueToNextLevel}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transform transition-all duration-200 hover:scale-105"
            >
              Continuar para o Nível {newLevel}! 🚀
            </Button>
          </Card>
        </div>
      )}
      
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 max-w-md mx-4 text-center border-2 border-blue-200 shadow-2xl">
            <div className="mb-6">
              <div className="text-6xl mb-4">❓</div>
              <h2 className="text-3xl font-bold text-blue-800 mb-2">Como Jogar</h2>
              <h3 className="text-xl font-semibold text-purple-700 mb-4">
                LETRIS
              </h3>
            </div>
            
            <div className="bg-white bg-opacity-70 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold text-gray-800 mb-2">Objetivo:</h4>
              <p className="text-sm text-gray-700 mb-3">
                Forme palavras em português (horizontal e vertical) com as letras que caem. 
                Palavras válidas são eliminadas automaticamente. Complete linhas para ganhar pontos bônus!
              </p>
              
              <h4 className="font-semibold text-gray-800 mb-2">Controles:</h4>
              <div className="text-sm text-gray-700 mb-3 grid grid-cols-2 gap-1">
                <div><span className="font-bold">A/←</span> Esquerda</div>
                <div><span className="font-bold">D/→</span> Direita</div>
                <div><span className="font-bold">S/↓</span> Acelera</div>
                <div><span className="font-bold">W/↑</span> Rotaciona</div>
                <div><span className="font-bold">Espaço</span> Drop</div>
                <div><span className="font-bold">P</span> Pause</div>
              </div>
              
              <h4 className="font-semibold text-gray-800 mb-2">Progressão:</h4>
              <p className="text-sm text-gray-700">
                Encontre <span className="font-bold text-blue-600">{WordLibrary.getRequiredWordsForLevel(level)} palavras</span> 
                {" "}para avançar ao próximo nível. Cada nível tem um pool de letras diferente.
              </p>
            </div>
            
            <Button 
              onClick={() => setShowHelp(false)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transform transition-all duration-200 hover:scale-105"
            >
              Continuar Jogando! 🎮
            </Button>
          </Card>
        </div>
      )}
      {showInstallPrompt && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#333',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          zIndex: 1000,
          textAlign: 'center'
        }}>
          <p>Instale o Letris para uma experiência de jogo completa!</p>
          <button
            onClick={handleInstallClick}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Instalar Jogo
          </button>
        </div>
      )}  
    </div>
  );

}