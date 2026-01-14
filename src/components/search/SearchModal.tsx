import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, SearchResult } from '../../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const result = await api.search(q);
    if (result.data) {
      setResults(result.data.results);
      setSelectedIndex(0);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    onClose();
    if (result.type === 'page') {
      navigate(`/page/${result.id}`);
    } else {
      navigate(`/database/${result.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-notion-border">
          <svg className="w-5 h-5 text-notion-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and databases..."
            className="flex-1 text-lg outline-none placeholder-notion-text-secondary"
          />
          {isLoading && (
            <div className="w-5 h-5 border-2 border-notion-accent border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.length < 2 ? (
            <div className="px-4 py-8 text-center text-notion-text-secondary">
              Type to search...
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="px-4 py-8 text-center text-notion-text-secondary">
              No results found
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                    index === selectedIndex ? 'bg-notion-bg-hover' : 'hover:bg-notion-bg-hover'
                  }`}
                >
                  <span className="text-lg">
                    {result.type === 'page' ? (result.icon || '📄') : '🗃️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-notion-text truncate">
                      {result.title || 'Untitled'}
                    </div>
                    {result.snippet && (
                      <div className="text-xs text-notion-text-secondary truncate">
                        {result.snippet}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-notion-text-secondary">
                    {result.type === 'page' ? 'Page' : 'Database'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-notion-border text-xs text-notion-text-secondary flex items-center gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
