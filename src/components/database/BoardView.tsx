import { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { DatabaseColumn, DatabaseRow } from '../../services/api';

interface BoardViewProps {
  onEditRow: (row: DatabaseRow) => void;
}

export function BoardView({ onEditRow }: BoardViewProps) {
  const { currentDatabase, columns, rows, updateRow, addRow, deleteRow } = useDatabaseStore();
  const [draggedRow, setDraggedRow] = useState<DatabaseRow | null>(null);

  // Find select columns for grouping
  const selectColumns = columns.filter((col) => col.type === 'select');
  const [groupByColumnId, setGroupByColumnId] = useState<string | null>(
    selectColumns[0]?.id || null
  );

  const groupByColumn = columns.find((col) => col.id === groupByColumnId);

  if (!currentDatabase) return null;

  if (!groupByColumn || groupByColumn.type !== 'select') {
    return (
      <div className="p-8 text-center">
        <p className="text-notion-text-secondary mb-4">
          Board view requires a Select column to group by.
        </p>
        {selectColumns.length === 0 ? (
          <p className="text-sm text-notion-text-secondary">
            Add a Select column to your database to use Board view.
          </p>
        ) : (
          <select
            value={groupByColumnId || ''}
            onChange={(e) => setGroupByColumnId(e.target.value)}
            className="px-3 py-2 border border-notion-border rounded"
          >
            <option value="">Select a column...</option>
            {selectColumns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  const options = groupByColumn.config.options || [];
  
  // Group rows by the select column value
  const groupedRows: Record<string, DatabaseRow[]> = {
    '': [], // No status / uncategorized
  };
  
  options.forEach((opt) => {
    groupedRows[opt.id] = [];
  });

  rows.forEach((row) => {
    const value = row.data[groupByColumn.id] as string | undefined;
    if (value && groupedRows[value]) {
      groupedRows[value].push(row);
    } else {
      groupedRows[''].push(row);
    }
  });

  const handleDragStart = (row: DatabaseRow) => {
    setDraggedRow(row);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (optionId: string) => {
    if (draggedRow && groupByColumn) {
      await updateRow(draggedRow.id, {
        ...draggedRow.data,
        [groupByColumn.id]: optionId || null,
      });
    }
    setDraggedRow(null);
  };

  const handleAddCard = async (optionId: string) => {
    if (groupByColumn) {
      await addRow({ [groupByColumn.id]: optionId || null });
    }
  };


  // Get the first text column for display
  const titleColumn = columns.find((col) => col.type === 'text');

  return (
    <div className="p-4">
      {/* Group By Selector */}
      {selectColumns.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-notion-text-secondary">Group by:</span>
          <select
            value={groupByColumnId || ''}
            onChange={(e) => setGroupByColumnId(e.target.value)}
            className="px-2 py-1 text-sm border border-notion-border rounded"
          >
            {selectColumns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Board Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Uncategorized column */}
        <BoardColumn
          title="No Status"
          color="#e5e7eb"
          rows={groupedRows['']}
          titleColumn={titleColumn}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('')}
          onDragStart={handleDragStart}
          onAddCard={() => handleAddCard('')}
          onEditRow={onEditRow}
          onDeleteRow={deleteRow}
        />

        {/* Option columns */}
        {options.map((option) => (
          <BoardColumn
            key={option.id}
            title={option.label}
            color={option.color}
            rows={groupedRows[option.id] || []}
            titleColumn={titleColumn}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(option.id)}
            onDragStart={handleDragStart}
            onAddCard={() => handleAddCard(option.id)}
            onEditRow={onEditRow}
            onDeleteRow={deleteRow}
          />
        ))}
      </div>
    </div>
  );
}

interface BoardColumnProps {
  title: string;
  color: string;
  rows: DatabaseRow[];
  titleColumn?: DatabaseColumn;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragStart: (row: DatabaseRow) => void;
  onAddCard: () => void;
  onEditRow: (row: DatabaseRow) => void;
  onDeleteRow: (rowId: string) => void;
}

function BoardColumn({
  title,
  color,
  rows,
  titleColumn,
  onDragOver,
  onDrop,
  onDragStart,
  onAddCard,
  onEditRow,
  onDeleteRow,
}: BoardColumnProps) {
  return (
    <div
      className="flex-shrink-0 w-72 bg-notion-bg-secondary rounded-lg"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-notion-border">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium text-sm text-notion-text">{title}</span>
        <span className="text-xs text-notion-text-secondary ml-auto">
          {rows.length}
        </span>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 min-h-[200px]">
        {rows.map((row) => (
          <BoardCard
            key={row.id}
            row={row}
            titleColumn={titleColumn}
            onDragStart={() => onDragStart(row)}
            onEdit={() => onEditRow(row)}
            onDelete={() => onDeleteRow(row.id)}
          />
        ))}

        {/* Add Card Button */}
        <button
          onClick={onAddCard}
          className="w-full px-3 py-2 text-sm text-notion-text-secondary hover:bg-notion-bg-hover rounded flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>
      </div>
    </div>
  );
}

interface BoardCardProps {
  row: DatabaseRow;
  titleColumn?: DatabaseColumn;
  onDragStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function BoardCard({ row, titleColumn, onDragStart, onEdit, onDelete }: BoardCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const title = titleColumn ? (row.data[titleColumn.id] as string) : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onEdit}
      className="bg-white border border-notion-border rounded-lg p-3 cursor-pointer hover:border-notion-accent group relative"
    >
      <div className="text-sm text-notion-text">
        {title || <span className="text-notion-text-secondary italic">Untitled</span>}
      </div>

      {/* Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-notion-bg-hover rounded"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute top-8 right-2 bg-white border border-notion-border rounded shadow-lg py-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setShowMenu(false);
            }}
            className="w-full px-3 py-1 text-sm text-left text-red-600 hover:bg-notion-bg-hover"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
