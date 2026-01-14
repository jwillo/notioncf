import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { TableView } from './TableView';
import { BoardView } from './BoardView';

type ViewType = 'table' | 'board';

export function DatabaseView() {
  const { id } = useParams<{ id: string }>();
  const { fetchDatabase, clearCurrentDatabase } = useDatabaseStore();
  const [viewType, setViewType] = useState<ViewType>('table');

  useEffect(() => {
    if (id) {
      fetchDatabase(id);
    }
    return () => clearCurrentDatabase();
  }, [id, fetchDatabase, clearCurrentDatabase]);

  return (
    <div>
      {/* View Toggle */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-notion-border">
        <button
          onClick={() => setViewType('table')}
          className={`px-3 py-1 text-sm rounded ${
            viewType === 'table'
              ? 'bg-notion-bg-hover text-notion-text'
              : 'text-notion-text-secondary hover:bg-notion-bg-hover'
          }`}
        >
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Table
          </span>
        </button>
        <button
          onClick={() => setViewType('board')}
          className={`px-3 py-1 text-sm rounded ${
            viewType === 'board'
              ? 'bg-notion-bg-hover text-notion-text'
              : 'text-notion-text-secondary hover:bg-notion-bg-hover'
          }`}
        >
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Board
          </span>
        </button>
      </div>

      {/* View Content */}
      {viewType === 'table' ? (
        <TableView />
      ) : (
        <BoardView onEditRow={() => {}} />
      )}
    </div>
  );
}
