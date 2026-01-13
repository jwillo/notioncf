import { useState, useRef, useEffect } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { DatabaseColumn } from '../../services/api';

interface ColumnHeaderProps {
  column: DatabaseColumn;
}

const COLUMN_TYPES = [
  { value: 'text', label: 'Text', icon: 'Aa' },
  { value: 'number', label: 'Number', icon: '#' },
  { value: 'select', label: 'Select', icon: '▼' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑' },
];

export function ColumnHeader({ column }: ColumnHeaderProps) {
  const { sortColumn, sortDirection, setSortColumn, toggleSortDirection, updateColumn, deleteColumn } = useDatabaseStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [localName, setLocalName] = useState(column.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSorted = sortColumn === column.id;

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleSort = () => {
    if (isSorted) {
      toggleSortDirection();
    } else {
      setSortColumn(column.id);
    }
    setShowMenu(false);
  };

  const handleRename = () => {
    setIsRenaming(false);
    if (localName !== column.name) {
      updateColumn(column.id, { name: localName || 'Untitled' });
    }
  };

  const handleTypeChange = (type: string) => {
    updateColumn(column.id, { type });
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this column? This cannot be undone.')) {
      deleteColumn(column.id);
    }
    setShowMenu(false);
  };

  const typeInfo = COLUMN_TYPES.find((t) => t.value === column.type) || COLUMN_TYPES[0];

  return (
    <th className="border-b border-notion-border p-0 text-left font-normal min-w-[150px] relative">
      <div className="flex items-center">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setLocalName(column.name);
                setIsRenaming(false);
              }
            }}
            className="flex-1 p-2 bg-transparent border-none outline-none text-sm font-medium"
          />
        ) : (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex-1 p-2 text-left text-sm font-medium text-notion-text hover:bg-notion-bg-hover flex items-center gap-2"
          >
            <span className="text-notion-text-secondary">{typeInfo.icon}</span>
            <span className="truncate">{column.name}</span>
            {isSorted && (
              <span className="text-notion-text-secondary">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        )}
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute left-0 top-full mt-1 bg-white border border-notion-border rounded-lg shadow-lg py-1 z-20 min-w-[200px]">
            <button
              onClick={() => {
                setIsRenaming(true);
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-notion-bg-hover flex items-center gap-2"
            >
              <span>✏️</span> Rename
            </button>

            <button
              onClick={handleSort}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-notion-bg-hover flex items-center gap-2"
            >
              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              Sort {isSorted ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}
            </button>

            <div className="border-t border-notion-border my-1" />

            <div className="px-3 py-1 text-xs text-notion-text-secondary uppercase">
              Property Type
            </div>
            {COLUMN_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-notion-bg-hover flex items-center gap-2 ${
                  column.type === type.value ? 'bg-notion-bg-hover' : ''
                }`}
              >
                <span>{type.icon}</span> {type.label}
              </button>
            ))}

            <div className="border-t border-notion-border my-1" />

            <button
              onClick={handleDelete}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <span>🗑️</span> Delete column
            </button>
          </div>
        </>
      )}
    </th>
  );
}
