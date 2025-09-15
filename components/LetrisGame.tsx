import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameBoard } from './GameBoard';
import { GameStats } from './GameStats';
import { createRandomPiece, canPlacePiece, rotatePiece, TetrisPiece } from './TetrisPieces';
import { findWords, removeWords, highlightWords, FoundWord, getRequiredWordsForLevel, getAvailableLettersForLevel, getValidWordsForLevel } from './WordDetector';
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
        setScore(prev => prev + words.length * 100 * level);
        setWordsFound(prev => prev + words.length);
        setFoundWords([]);
        
        // Apply gravity after removing words
        applyGravity(clearedGrid);
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
    
    const linesCleared = linesToRemove.length;
    
    // Award points for line clears (traditional Tetris scoring)
    const lineBonus = [0, 40, 100, 300, 1200][Math.min(linesCleared, 4)] * level;
    setScore(prev => prev + lineBonus);
    setLinesCleared(prev => prev + linesCleared);
    setLinesToClear([]);
    
    // Show notification
    setLinesClearedNotification(linesCleared);
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

  const applyGravity = useCallback((currentGrid: Cell[][]) => {
    setGrid(prevGrid => {
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
      
      return newGrid;
    });
  }, []);

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
      gameLoopRef.current = setTimeout(() => {
        movePiece(0, 1);
      }, Math.max(100, INITIAL_FALL_SPEED - (level - 1) * 100));
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [currentPiece, isPaused, isGameOver, level, movePiece]);

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
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, rotatePieceHandler, dropPiece, isGameOver]);

  // Level up based on words found using the new system
  useEffect(() => {
    const requiredWords = getRequiredWordsForLevel(level);
    
    // Check if player has found enough words to advance to next level
    if (foundWordsList.length >= requiredWords) {
      const newLevel = level + 1;
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
    }
  }, [foundWordsList.length, level]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Layout Desktop */}
      <div className="hidden lg:flex h-screen">
        {/* Área do tabuleiro - sempre fixa */}
        <div className="flex flex-col items-center flex-1 p-4 overflow-auto">
          <h1 className="mb-4 text-center">LETRIS - Nível {level}</h1>
          <div className="text-center text-sm text-gray-600 mb-3">
            {level <= 3 && "Pool 1: Letras Básicas (10 letras)"}
            {level > 3 && level <= 6 && "Pool 2: Letras Intermediárias (15 letras)"}
            {level > 6 && level <= 9 && "Pool 3: Letras Avançadas (20 letras)"}
            {level > 9 && "Pool 4: Letras Complexas (25 letras)"}
          </div>
          <GameBoard grid={grid} activePiece={currentPiece} linesToClear={linesToClear} />
          
          {foundWords.length > 0 && (
            <Card className="mt-3 p-3 max-w-md">
              <h3 className="mb-2 text-sm">Palavras Encontradas:</h3>
              <div className="flex flex-wrap gap-2">
                {foundWords.map((word, index) => (
                  <span key={index} className="bg-yellow-200 px-2 py-1 rounded text-xs font-bold">
                    {word.word}
                  </span>
                ))}
              </div>
            </Card>
          )}
          
          {linesClearedNotification > 0 && (
            <Card className="mt-3 p-3 max-w-md bg-green-100 border-green-300">
              <h3 className="mb-2 text-sm text-green-800">Linha Completa!</h3>
              <div className="text-green-700 text-sm">
                {linesClearedNotification === 1 && "1 linha eliminada!"}
                {linesClearedNotification === 2 && "2 linhas eliminadas! Duplo!"}
                {linesClearedNotification === 3 && "3 linhas eliminadas! Triplo!"}
                {linesClearedNotification === 4 && "4 linhas eliminadas! TETRIS!"}
              </div>
            </Card>
          )}
          
          {(isPaused || isGameOver) && (
            <Card className="mt-3 p-4 text-center">
              {isGameOver ? (
                <div>
                  <h2 className="mb-4">Game Over!</h2>
                  <p className="mb-2">Score Final: {score.toLocaleString()}</p>
                  <p className="mb-4">Palavras encontradas: {foundWordsList.length}</p>
                  <Button onClick={startNewGame}>Novo Jogo</Button>
                </div>
              ) : (
                <div>
                  <h2 className="mb-2">Pausado</h2>
                  <p>Pressione P para continuar</p>
                </div>
              )}
            </Card>
          )}
        </div>
        
        {/* Área da sidebar - com scroll próprio */}
        <div className="flex-shrink-0 w-80 p-6 bg-white border-l border-gray-200">
          <GameStats 
            score={score}
            level={level}
            wordsFound={wordsFound}
            linesCleared={linesCleared}
            nextPiece={nextPiece}
            foundWordsList={foundWordsList}
          />
        </div>
      </div>

      {/* Layout Mobile */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Header compacto */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold">LETRIS - Nível {level}</h1>
              <p className="text-xs text-gray-600">Score: {score.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Palavras: {foundWordsList.length}</p>
              <p className="text-xs text-gray-600">
                {level <= 3 && "Pool 1: Básicas"}
                {level > 3 && level <= 6 && "Pool 2: Intermediárias"}
                {level > 6 && level <= 9 && "Pool 3: Avançadas"}
                {level > 9 && "Pool 4: Complexas"}
              </p>
            </div>
          </div>
        </div>

        {/* Área principal do jogo */}
        <div className="flex-1 flex flex-col p-4">
          <div className="flex justify-center mb-4">
            <GameBoard grid={grid} activePiece={currentPiece} linesToClear={linesToClear} />
          </div>

          {/* Controles Touch para Mobile */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onTouchStart={() => movePiece(-1, 0)}
                className="h-12 text-xs"
              >
                ← Esq
              </Button>
              <Button
                variant="outline"
                size="sm"
                onTouchStart={rotatePieceHandler}
                className="h-12 text-xs"
              >
                ↻ Gira
              </Button>
              <Button
                variant="outline"
                size="sm"
                onTouchStart={() => movePiece(1, 0)}
                className="h-12 text-xs"
              >
                Dir →
              </Button>
              <Button
                variant="outline"
                size="sm"
                onTouchStart={() => setIsPaused(prev => !prev)}
                className="h-12 text-xs"
              >
                ⏸ Pausa
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onTouchStart={() => movePiece(0, 1)}
                className="h-12 text-xs"
              >
                ↓ Acelera
              </Button>
              <Button
                variant="default"
                size="sm"
                onTouchStart={dropPiece}
                className="h-12 text-xs"
              >
                ⬇ Solta
              </Button>
            </div>
          </div>

          {/* Stats compactas para mobile */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Próxima peça */}
            {nextPiece && (
              <Card className="p-3">
                <h4 className="mb-2 text-sm">Próxima</h4>
                <div className="grid gap-0 w-fit">
                  {nextPiece.shape.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex">
                      {row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            w-6 h-6 border border-gray-300 flex items-center justify-center text-xs font-bold
                            ${cell ? 'bg-blue-200 border-blue-400' : 'bg-transparent border-transparent'}
                          `}
                        >
                          {cell && nextPiece.letters[rowIndex][colIndex] && (
                            <span className="font-bold text-gray-800">
                              {nextPiece.letters[rowIndex][colIndex]}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Pool de letras */}
            <Card className="p-3">
              <h4 className="mb-2 text-sm">Pool de Letras</h4>
              <div className="flex flex-wrap gap-1">
                {getAvailableLettersForLevel(level).slice(0, 8).map(letter => (
                  <span 
                    key={letter} 
                    className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs font-bold"
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Palavras em formato compacto */}
          <Card className="p-3">
            <h4 className="mb-2 text-sm">
              Palavras ({foundWordsList.length}/{getRequiredWordsForLevel(level)} necessárias)
            </h4>
            <div className="grid grid-cols-5 gap-1 text-xs">
              {getValidWordsForLevel(level).map(word => {
                const isFound = foundWordsList.includes(word);
                return (
                  <div 
                    key={word}
                    className={`
                      px-1 py-0.5 rounded transition-colors text-center
                      ${isFound 
                        ? 'bg-green-100 text-green-800 line-through font-bold' 
                        : 'bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {word}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Notificações */}
          {foundWords.length > 0 && (
            <Card className="mt-4 p-3 bg-yellow-50 border-yellow-200">
              <h4 className="mb-2 text-sm text-yellow-800">Palavras Encontradas:</h4>
              <div className="flex flex-wrap gap-1">
                {foundWords.map((word, index) => (
                  <span key={index} className="bg-yellow-200 px-2 py-1 rounded text-xs font-bold">
                    {word.word}
                  </span>
                ))}
              </div>
            </Card>
          )}
          
          {linesClearedNotification > 0 && (
            <Card className="mt-4 p-3 bg-green-100 border-green-300">
              <h4 className="mb-2 text-sm text-green-800">Linha Completa!</h4>
              <div className="text-green-700 text-sm">
                {linesClearedNotification === 1 && "1 linha eliminada!"}
                {linesClearedNotification === 2 && "2 linhas eliminadas! Duplo!"}
                {linesClearedNotification === 3 && "3 linhas eliminadas! Triplo!"}
                {linesClearedNotification === 4 && "4 linhas eliminadas! TETRIS!"}
              </div>
            </Card>
          )}
          
          {(isPaused || isGameOver) && (
            <Card className="mt-4 p-4 text-center bg-white">
              {isGameOver ? (
                <div>
                  <h3 className="mb-3">Game Over!</h3>
                  <p className="mb-2 text-sm">Score Final: {score.toLocaleString()}</p>
                  <p className="mb-4 text-sm">Palavras encontradas: {foundWordsList.length}</p>
                  <Button onClick={startNewGame} className="w-full">Novo Jogo</Button>
                </div>
              ) : (
                <div>
                  <h3 className="mb-2">Pausado</h3>
                  <p className="text-sm">Toque em "Pausa" para continuar</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}