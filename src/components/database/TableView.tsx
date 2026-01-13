import { useState, useRef, useEffect } from 'react';
import { useDatabaseStore, useSortedFilteredRows } from '../../stores/databaseStore';
import { CellEditor } from './CellEditor';
import { ColumnHeader } from './ColumnHeader';
import { FilterBar } from './FilterBar';

export function TableView() {
  const {
    currentDatabase,
    columns,
    isLoading,
    isSaving,
    addColumn,
    addRow,
    updateRow,
    deleteRow,
    updateDatabase,
  } = useDatabaseStore();

  const rows = useSortedFilteredRows();
  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentDatabase) {
      setLocalTitle(currentDatabase.title);
    }
  }, [currentDatabase]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-notion-bg-hover rounded w-1/4" />
          <div className="h-64 bg-notion-bg-hover rounded" />
        </div>
      </div>
    );
  }

  if (!currentDatabase) {
    return (
      <div className="p-8 text-center text-notion-text-secondary">
        Database not found
      </div>
    );
  }

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (localTitle !== currentDatabase.title) {
      updateDatabase(currentDatabase.id, localTitle || 'Untitled');
    }
  };

  const handleCellChange = (rowId: string, columnId: string, value: unknown) => {
    const row = rows.find((r) => r.id === rowId);
    if (row) {
      updateRow(rowId, { ...row.data, [columnId]: value });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Database Title */}
      <div className="px-8 pt-8 pb-4">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleBlur();
              if (e.key === 'Escape') {
                setLocalTitle(currentDatabase.title);
                setEditingTitle(false);
              }
            }}
            className="text-3xl font-bold text-notion-text bg-transparent border-none outline-none w-full"
          />
        ) : (
          <h1
            onClick={() => setEditingTitle(true)}
            className="text-3xl font-bold text-notion-text cursor-text hover:bg-notion-bg-hover rounded px-1 -mx-1 inline-block"
          >
            {currentDatabase.title}
          </h1>
        )}
        <div className="text-xs text-notion-text-secondary mt-1">
          {isSaving ? 'Saving...' : `${rows.length} rows`}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar columns={columns} />

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="border border-notion-border rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-notion-bg-secondary">
                {columns.map((column) => (
                  <ColumnHeader key={column.id} column={column} />
                ))}
                <th className="border-b border-notion-border p-2 text-left">
                  <button
                    onClick={() => addColumn({ name: 'New Column', type: 'text' })}
                    className="text-notion-text-secondary hover:text-notion-text text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="group hover:bg-notion-bg-hover">
                  {columns.map((column) => (
                    <td
                      key={`${row.id}-${column.id}`}
                      className="border-b border-notion-border p-0"
                    >
                      <CellEditor
                        column={column}
                        value={row.data[column.id]}
                        onChange={(value) => handleCellChange(row.id, column.id, value)}
                      />
                    </td>
                  ))}
                  <td className="border-b border-notion-border p-2 w-10">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-red-500 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Row Button */}
          <button
            onClick={() => addRow()}
            className="w-full p-2 text-left text-sm text-notion-text-secondary hover:bg-notion-bg-hover flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New row
          </button>
        </div>
      </div>
    </div>
  );
}
