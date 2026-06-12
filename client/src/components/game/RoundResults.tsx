import React from 'react';
import { PlayerRoundResult, Category, CATEGORIES, CATEGORY_ICONS, CATEGORY_LABELS } from 'shared/types';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';
import { CheckCircle2, XCircle, ShieldAlert, AlertTriangle } from 'lucide-react';

interface RoundResultsProps {
  results: PlayerRoundResult[];
  interactive?: boolean;
  overrides?: string[];
  onToggle?: (playerId: string, category: Category) => void;
}

export const RoundResults: React.FC<RoundResultsProps> = ({ results, interactive, overrides = [], onToggle }) => {
  const sortedResults = [...results].sort((a, b) => b.roundScore - a.roundScore);
  const overrideCount = overrides.length;

  const getStatusColor = (status: string, isOverridden: boolean) => {
    if (isOverridden) return 'bg-danger/15 text-danger border-danger/40';
    switch (status) {
      case 'unique': return 'bg-success/15 text-success border-success/30';
      case 'duplicate': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'repeated': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'invalid': return 'bg-surface-light text-text-secondary border-white/10';
      case 'empty': return 'bg-surface-light/50 text-text-secondary/50 border-white/5';
      default: return '';
    }
  };

  const getStatusLabel = (status: string, isOverridden: boolean): string => {
    if (isOverridden) return '✗ Rejected';
    switch (status) {
      case 'unique': return '✓ Valid';
      case 'duplicate': return 'Duplicate';
      case 'repeated': return 'Repeated';
      case 'invalid': return 'Invalid';
      case 'empty': return '—';
      default: return '';
    }
  };

  return (
    <div className="w-full">
      {/* Admin review banner */}
      {interactive && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">Admin Verification Mode</p>
            <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
              Review each answer for accuracy. Use{' '}
              <span className="inline-flex items-center gap-0.5 text-success font-semibold"><CheckCircle2 className="w-3 h-3" /> Approve</span>{' '}
              for real answers and{' '}
              <span className="inline-flex items-center gap-0.5 text-danger font-semibold"><XCircle className="w-3 h-3" /> Reject</span>{' '}
              for made-up or fake entries. Scores update in real-time.
            </p>
            {overrideCount > 0 && (
              <p className="text-xs font-semibold text-danger mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {overrideCount} answer{overrideCount > 1 ? 's' : ''} rejected — scores adjusted
              </p>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="p-4 bg-surface-light border-b border-white/5 font-semibold text-text-secondary whitespace-nowrap">
                Player
              </th>
              {CATEGORIES.map(cat => (
                <th key={cat} className="p-3 bg-surface-light border-b border-white/5 font-semibold text-text-secondary text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                    <span className="text-[10px] uppercase tracking-wider">{CATEGORY_LABELS[cat]}</span>
                  </div>
                </th>
              ))}
              <th className="p-4 bg-surface-light border-b border-white/5 font-bold text-white text-right whitespace-nowrap">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface">
            {sortedResults.map((result) => {
              return (
                <tr
                  key={result.playerId}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Player name */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={result.playerName} color={result.avatarColor} size="sm" />
                      <span className="font-medium text-white">{result.playerName}</span>
                    </div>
                  </td>

                  {/* Category answers */}
                  {CATEGORIES.map(cat => {
                    const isOverridden = overrides.includes(`${result.playerId}|${cat}`);
                    const status = result.answerStatuses[cat];
                    const isEmpty = status === 'empty';
                    // Auto-invalid = wrong starting letter, already caught by system, no admin action needed
                    const isAutoInvalid = status === 'invalid' && !isOverridden;
                    // Show admin buttons only for non-empty, non-auto-invalid answers
                    const canInteract = interactive && !isEmpty && !isAutoInvalid;

                    return (
                      <td key={cat} className="p-2 text-center align-top">
                        <div className="flex flex-col items-center gap-1.5 min-w-[110px]">
                          {/* Answer text */}
                          <div
                            className={cn(
                              "w-full px-3 py-2 rounded-lg text-sm border font-medium truncate transition-all",
                              getStatusColor(status, isOverridden),
                              isOverridden && "line-through decoration-2",
                            )}
                            title={
                              isEmpty ? 'No answer submitted' :
                              isOverridden ? `"${result.answers[cat]}" — Rejected by admin` :
                              isAutoInvalid ? `"${result.answers[cat]}" — Doesn't start with the correct letter` :
                              `${result.answers[cat]} (${status})`
                            }
                          >
                            {result.answers[cat] || '—'}
                          </div>

                          {/* ===== Admin action buttons (review mode) ===== */}
                          {canInteract && (
                            <div className="flex items-center gap-1">
                              {/* Approve button */}
                              <button
                                type="button"
                                onClick={() => { if (isOverridden) onToggle?.(result.playerId, cat); }}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all",
                                  !isOverridden
                                    ? "text-success bg-success/20 ring-1 ring-success/40 shadow-sm shadow-success/10"
                                    : "text-text-secondary/50 hover:text-success hover:bg-success/10 cursor-pointer active:scale-95"
                                )}
                                title={isOverridden ? "Click to approve this answer" : "Answer is approved"}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">OK</span>
                              </button>

                              {/* Reject button */}
                              <button
                                type="button"
                                onClick={() => { if (!isOverridden) onToggle?.(result.playerId, cat); }}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all",
                                  isOverridden
                                    ? "text-danger bg-danger/20 ring-1 ring-danger/40 shadow-sm shadow-danger/10"
                                    : "text-text-secondary/50 hover:text-danger hover:bg-danger/10 cursor-pointer active:scale-95"
                                )}
                                title={!isOverridden ? "Click to reject — answer is fake or wrong" : "Answer is rejected"}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Fake</span>
                              </button>
                            </div>
                          )}

                          {/* Auto-invalid indicator in review mode */}
                          {interactive && isAutoInvalid && (
                            <span className="text-[10px] text-text-secondary/60 flex items-center gap-1 whitespace-nowrap">
                              <AlertTriangle className="w-3 h-3" /> Wrong letter
                            </span>
                          )}

                          {/* Status label in results mode (post-review) */}
                          {!interactive && !isEmpty && (
                            <span className={cn(
                              "text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap",
                              isOverridden ? "text-danger" :
                              status === 'unique' ? "text-success" :
                              status === 'duplicate' ? "text-amber-400" :
                              status === 'repeated' ? "text-orange-400" :
                              "text-text-secondary/60"
                            )}>
                              {getStatusLabel(status, isOverridden)}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Round score */}
                  <td className="p-4 text-right align-middle">
                    <span className={cn(
                      "font-heading font-bold text-xl transition-all",
                      result.roundScore > 0 ? "text-accent" : "text-text-secondary"
                    )}>
                      {result.roundScore > 0 ? `+${result.roundScore}` : '0'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
