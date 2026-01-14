import { useEffect, useState } from 'react';
import { api, Database } from '../../services/api';
import { DatabaseView } from './DatabaseView';

interface EmbeddedBoardProps {
  databaseId: string;
}

export function EmbeddedBoard({ databaseId }: EmbeddedBoardProps) {
  const [database, setDatabase] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabase();
  }, [databaseId]);

  const loadDatabase = async () => {
    setIsLoading(true);
    const result = await api.databases.get(databaseId);
    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      setDatabase(result.data.database);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="border border-notion-border rounded-lg p-4 my-4">
        <div className="animate-pulse h-48 bg-notion-bg-hover rounded" />
      </div>
    );
  }

  if (error || !database) {
    return (
      <div className="border border-notion-border rounded-lg p-4 my-4 text-center text-notion-text-secondary">
        {error || 'Database not found'}
      </div>
    );
  }

  return (
    <div className="border border-notion-border rounded-lg my-4 overflow-hidden">
      <div className="bg-notion-bg-secondary px-4 py-2 border-b border-notion-border flex items-center justify-between">
        <span className="font-medium text-sm text-notion-text">{database.title}</span>
        <a
          href={`/database/${databaseId}`}
          className="text-xs text-notion-accent hover:underline"
        >
          Open full view →
        </a>
      </div>
      <DatabaseView
        embedded
        databaseId={databaseId}
        defaultView="board"
        hideViewToggle
      />
    </div>
  );
}

// Component to select a database for embedding
interface DatabaseSelectorProps {
  onSelect: (databaseId: string) => void;
  onCancel: () => void;
}

export function DatabaseSelector({ onSelect, onCancel }: DatabaseSelectorProps) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    const result = await api.databases.list();
    if (result.data) {
      setDatabases(result.data.databases);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-notion-border">
          <h3 className="font-medium text-notion-text">Embed a Board</h3>
          <p className="text-xs text-notion-text-secondary mt-1">
            Select a database to embed as a board
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-notion-text-secondary">Loading...</div>
          ) : databases.length === 0 ? (
            <div className="p-4 text-center text-notion-text-secondary">
              No databases yet. Create one first.
            </div>
          ) : (
            databases.map((db) => (
              <button
                key={db.id}
                onClick={() => onSelect(db.id)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-notion-bg-hover text-left"
              >
                <svg className="w-4 h-4 text-notion-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
                <span className="truncate">{db.title}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-3 border-t border-notion-border">
          <button
            onClick={onCancel}
            className="w-full px-3 py-1.5 text-sm text-notion-text-secondary hover:bg-notion-bg-hover rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
