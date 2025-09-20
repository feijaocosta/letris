import React from 'react';
import { Card } from './ui/card';
import { getValidWordsForLevel, getAvailableLettersForLevel, getRequiredWordsForLevel } from './WordDetector';

interface WordListProps {
  level: number;
  foundWords: string[];
}

export function WordList({ level, foundWords }: WordListProps) {
  const validWords = getValidWordsForLevel(level);
  const availableLetters = getAvailableLettersForLevel(level);
  const requiredWords = getRequiredWordsForLevel(level);
  
  // Determina qual pool de letras está sendo usado
  const getPoolInfo = (level: number) => {
    if (level <= 3) return { pool: 1, letters: 10, description: 'Básicas' };
    if (level <= 6) return { pool: 2, letters: 15, description: 'Intermediárias' };
    if (level <= 9) return { pool: 3, letters: 20, description: 'Avançadas' };
    return { pool: 4, letters: 25, description: 'Complexas' };
  };
  
  const poolInfo = getPoolInfo(level);
  
  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Palavras Válidas - primeira para ficar mais visível */}
      <Card className="p-3 lg:p-4">
        <h3 className="mb-2 text-sm lg:text-base">Palavras Válidas ({foundWords.length}/{requiredWords} necessárias)</h3>
        <p className="text-xs text-gray-500 mb-3">15 palavras disponíveis • Progresso: {foundWords.length}/15</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 text-xs">
          {validWords.map(word => {
            const isFound = foundWords.includes(word);
            return (
              <div 
                key={word}
                className={`
                  px-1 lg:px-2 py-1 rounded transition-colors text-center
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

      {/* Pool de Letras */}

    </div>
  );
}