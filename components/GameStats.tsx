import React from 'react';
import { Card } from './ui/card';
import { WordList } from './WordList';

interface GameStatsProps {
  score: number;
  level: number;
  wordsFound: number;
  linesCleared: number;
  nextPiece: {
    shape: boolean[][];
    letters: string[][];
  } | null;
  foundWordsList: string[];
}

export function GameStats({ score, level, wordsFound, linesCleared, nextPiece, foundWordsList }: GameStatsProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Pontuação - sempre visível */}
      <Card className="p-3 lg:p-4 flex-shrink-0">
        <h3 className="mb-2 text-base lg:text-lg">Pontuação</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-sm lg:text-base">
            <span>Score:</span>
            <span className="font-bold">{score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm lg:text-base">
            <span>Nível:</span>
            <span className="font-bold">{level}</span>
          </div>
          <div className="flex justify-between text-sm lg:text-base">
            <span>Palavras:</span>
            <span className="font-bold">{wordsFound}</span>
          </div>
          <div className="flex justify-between text-sm lg:text-base">
            <span>Linhas:</span>
            <span className="font-bold">{linesCleared}</span>
          </div>
        </div>
      </Card>

      {/* Área com scroll para o resto do conteúdo */}
      <div className="flex-1 overflow-y-auto space-y-3 lg:space-y-4 mt-3 lg:mt-4">
        {/* Palavras Válidas */}
        <WordList level={level} foundWords={foundWordsList} />

        {/* Próxima Peça */}
        {nextPiece && (
          <Card className="p-3 lg:p-4">
            <h3 className="mb-2 text-sm lg:text-base">Próxima Peça</h3>
            <div className="grid gap-0 w-fit">
              {nextPiece.shape.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        w-6 h-6 lg:w-8 lg:h-8 border border-gray-300 flex items-center justify-center text-xs lg:text-sm font-bold
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

        {/* Controles */}
        <Card className="p-3 lg:p-4">
          <h3 className="mb-2 text-sm lg:text-base">Controles</h3>
          <div className="space-y-1 text-xs lg:text-sm">
            <div><strong>A/D:</strong> Mover esquerda/direita</div>
            <div><strong>S:</strong> Acelerar queda</div>
            <div><strong>W:</strong> Rotacionar</div>
            <div><strong>Espaço:</strong> Soltar peça</div>
            <div><strong>P:</strong> Pausar</div>
          </div>
        </Card>

        {/* Como Jogar */}
        <Card className="p-3 lg:p-4">
          <h3 className="mb-2 text-sm lg:text-base">Como Jogar</h3>
          <div className="space-y-1 text-xs lg:text-sm">
            <p>• Forme palavras para eliminar peças!</p>
            <p>• Complete linhas inteiras para bônus!</p>
            <p>• Palavras: todas as direções, mín. 3 letras</p>
            <p>• Acentos são ignorados na detecção</p>
          </div>
        </Card>
      </div>
    </div>
  );
}