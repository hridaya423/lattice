'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Globe } from 'lucide-react';
import { ReadingSuggestions as ReadingSuggestionsType } from '../../types';

interface ReadingSuggestionsProps {
  suggestions: ReadingSuggestionsType;
  onClose: () => void;
  onFetchReadings?: () => void;
  isFetchingReadings?: boolean;
}

export default function ReadingSuggestions({ 
  suggestions, 
  onClose, 
  onFetchReadings, 
  isFetchingReadings = false 
}: ReadingSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!suggestions.results?.length && !suggestions.isLoading) {
    return null;
  }

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="premium-card p-0 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b premium-divider bg-[var(--card-bg)] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="font-semibold text-[var(--foreground)] text-base">
              Related Articles & Resources
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onFetchReadings && (
              <button
                onClick={onFetchReadings}
                disabled={isFetchingReadings}
                className="bg-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isFetchingReadings ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3 h-3" />
                    Get Readings
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </div>
        {suggestions.results?.length > 0 && (
          <div className="mt-2">
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--input-bg)] px-2 py-1 rounded-full">
              {suggestions.results.length} results
            </span>
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 bg-[var(--card-bg)]">
            {suggestions.isLoading ? (
              <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--accent)] border-t-transparent"></div>
                <span>Searching for relevant articles and resources...</span>
              </div>
            ) : suggestions.error ? (
              <div className="text-red-500 text-sm">
                Failed to load reading suggestions. Please try again.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-[var(--text-secondary)] mb-4">
                  Curated articles, research papers, and resources found across the web to help you explore this topic further.
                </div>
                
                <div className="space-y-3">
                  {suggestions.results.map((result, index) => (
                    <a
                      key={index}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-[var(--input-bg)] hover:bg-[var(--accent-light)] rounded-lg border border-[var(--input-border)] transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[var(--accent-light)] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Globe className="w-3 h-3 text-[var(--accent)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-[var(--foreground)] text-sm leading-tight group-hover:text-[var(--accent)] transition-colors">
                              {result.title}
                            </h4>
                            <ExternalLink className="w-3 h-3 text-[var(--text-secondary)] flex-shrink-0 mt-1" />
                          </div>
                          {result.description && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-3">
                              {result.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-[var(--accent)] font-medium">
                              {getDomainFromUrl(result.url)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                  
                </div>
                
                <div className="mt-4 pt-4 border-t border-[var(--input-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <ExternalLink className="w-3 h-3" />
                    <span>
                      Click any article to open it in a new tab. Results are sourced from across the web in real-time.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 