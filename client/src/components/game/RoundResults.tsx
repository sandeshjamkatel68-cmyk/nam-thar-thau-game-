import React from 'react';
import { PlayerRoundResult, CATEGORIES, CATEGORY_ICONS } from 'shared/types';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

interface RoundResultsProps {
  results: PlayerRoundResult[];
}

export const RoundResults: React.FC<RoundResultsProps> = ({ results }) => {
  
  const sortedResults = [...results].sort((a, b) => b.roundScore - a.roundScore);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'unique': return 'bg-success/20 text-success border-success/30';
      case 'duplicate': return 'bg-danger/20 text-danger border-danger/30';
      case 'invalid': return 'bg-surface-light text-text-secondary border-white/10';
      case 'empty': return 'bg-surface-light text-text-secondary opacity-50 border-white/5';
      default: return '';
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="p-4 bg-surface-light rounded-tl-xl border-b border-white/5 font-semibold text-text-secondary whitespace-nowrap">Player</th>
            {CATEGORIES.map(cat => (
              <th key={cat} className="p-4 bg-surface-light border-b border-white/5 font-semibold text-text-secondary text-center">
                <span className="text-xl" title={cat}>{CATEGORY_ICONS[cat]}</span>
              </th>
            ))}
            <th className="p-4 bg-surface-light rounded-tr-xl border-b border-white/5 font-bold text-white text-right">Score</th>
          </tr>
        </thead>
        <tbody className="bg-surface">
          {sortedResults.map((result, idx) => (
            <tr key={result.playerId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
              <td className="p-4 flex items-center gap-3 whitespace-nowrap">
                <Avatar name={result.playerName} color={result.avatarColor} size="sm" />
                <span className="font-medium text-white">{result.playerName}</span>
              </td>
              
              {CATEGORIES.map(cat => (
                <td key={cat} className="p-2 text-center">
                  <div className={cn(
                    "px-3 py-2 rounded-lg text-sm border font-medium mx-auto max-w-[120px] truncate",
                    getStatusColor(result.answerStatuses[cat])
                  )} title={result.answers[cat] || '-'}>
                    {result.answers[cat] || '-'}
                  </div>
                </td>
              ))}
              
              <td className="p-4 text-right">
                <span className="font-heading font-bold text-xl text-accent">
                  +{result.roundScore}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
