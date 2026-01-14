import { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { DatabaseColumn, DatabaseRow, api } from '../../services/api';

interface BoardViewProps {
  onEditRow: (row: DatabaseRow) => void;
}

const COLUMN_COLORS = [
  '#e5e7eb', '#fecaca', '#fed7aa', '#fef08a', '#bbf7d0',
  '#a5f3fc', '#bfdbfe', '#ddd6fe', '#fbcfe8',
];

export function BoardView({ onEditRow }: BoardViewProps) {
  const { currentDatabase, columns, rows, updateRow, addRow, deleteRow } = useDatabaseStore();
  const [draggedRow, setDraggedRow] = useState<DatabaseRow | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState(COLUMN_COLORS[0]);

  // Find select columns for grouping (Status column)
  const selectColumns = columns.filter((col) => col.type === 'select');
  const [groupByColumnId, setGroupByColumnId] = useState<string | null>(
    selectColumns[0]?.id || null
  );

  const groupByColumn = columns.find((col) => col.id === groupByColumnId);

  // Find specific columns for card display
  const titleColumn = columns.find((col) => col.name.toLowerCase() === 'title' || col.type === 'text');
  const customerColumn = columns.find((col) => col.name.toLowerCase() === 'customer');
  const dueDateColumn = columns.find((col) => col.name.toLowerCase().includes('due') || col.type === 'date');
  const priorityColumn = columns.find((col) => col.name.toLowerCase() === 'priority');
  const descriptionColumn = columns.find((col) => col.name.toLowerCase() === 'description' || col.name.toLowerCase() === 'notes');

  if (!currentDatabase) return null;

  // If no select column exists, prompt to create one
  if (!groupByColumn || groupByColumn.type !== 'select') {
    return (
      <div className="p-8 text-center">
        <p className="text-notion-text-secondary mb-4">
          Board view requires a Status column to group cards.
        </p>
        <button
          onClick={async () => {
            // Create a Status column with default options
            const { data } = await api.databases.addColumn(currentDatabase.id, {
              name: 'Status',
              type: 'select',
            });
            if (data) {
              // Add default options
              await api.databases.updateColumns(currentDatabase.id, [{
                id: data.id,
                config: {
                  options: [
                    { id: crypto.randomUUID(), label: 'To Do', color: '#e5e7eb' },
                    { id: crypto.randomUUID(), label: 'In Progress', color: '#fef08a' },
                    { id: crypto.randomUUID(), label: 'Done', color: '#bbf7d0' },
                  ]
                }
              }]);
              window.location.reload();
            }
          }}
          className="px-4 py-2 bg-notion-accent text-white rounded hover:bg-blue-600"
        >
          Create Status Column
        </button>
      </div>
    );
  }

  const options = groupByColumn.config?.options || [];
  
  // Group rows by the select column value
  const groupedRows: Record<string, DatabaseRow[]> = {};
  
  options.forEach((opt) => {
    groupedRows[opt.id] = [];
  });

  // Add uncategorized at the end
  groupedRows['_uncategorized'] = [];

  rows.forEach((row) => {
    const value = row.data[groupByColumn.id] as string | undefined;
    if (value && groupedRows[value]) {
      groupedRows[value].push(row);
    } else {
      groupedRows['_uncategorized'].push(row);
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
      const newValue = optionId === '_uncategorized' ? null : optionId;
      await updateRow(draggedRow.id, {
        ...draggedRow.data,
        [groupByColumn.id]: newValue,
      });
    }
    setDraggedRow(null);
  };

  const handleAddCard = async (optionId: string) => {
    if (groupByColumn) {
      const statusValue = optionId === '_uncategorized' ? null : optionId;
      await addRow({ [groupByColumn.id]: statusValue });
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim() || !groupByColumn) return;
    
    const newOption = {
      id: crypto.randomUUID(),
      label: newColumnName.trim(),
      color: newColumnColor,
    };
    
    const updatedOptions = [...options, newOption];
    
    await api.databases.updateColumns(currentDatabase.id, [{
      id: groupByColumn.id,
      config: { options: updatedOptions }
    }]);
    
    // Refresh
    window.location.reload();
  };

  const handleRenameColumn = async (optionId: string, newLabel: string) => {
    if (!groupByColumn) return;
    
    const updatedOptions = options.map(opt => 
      opt.id === optionId ? { ...opt, label: newLabel } : opt
    );
    
    await api.databases.updateColumns(currentDatabase.id, [{
      id: groupByColumn.id,
      config: { options: updatedOptions }
    }]);
  };

  const handleDeleteColumn = async (optionId: string) => {
    if (!groupByColumn) return;
    
    const updatedOptions = options.filter(opt => opt.id !== optionId);
    
    await api.databases.updateColumns(currentDatabase.id, [{
      id: groupByColumn.id,
      config: { options: updatedOptions }
    }]);
    
    window.location.reload();
  };

  const handleReorderColumns = async (draggedId: string, targetId: string) => {
    if (!groupByColumn || draggedId === targetId) return;
    
    const draggedIndex = options.findIndex(o => o.id === draggedId);
    const targetIndex = options.findIndex(o => o.id === targetId);
    
    const newOptions = [...options];
    const [removed] = newOptions.splice(draggedIndex, 1);
    newOptions.splice(targetIndex, 0, removed);
    
    await api.databases.updateColumns(currentDatabase.id, [{
      id: groupByColumn.id,
      config: { options: newOptions }
    }]);
    
    window.location.reload();
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-4">
        {selectColumns.length > 1 && (
          <div className="flex items-center gap-2">
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
      </div>

      {/* Board Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Status columns */}
        {options.map((option) => (
          <BoardColumn
            key={option.id}
            title={option.label}
            color={option.color}
            rows={groupedRows[option.id] || []}
            titleColumn={titleColumn}
            customerColumn={customerColumn}
            dueDateColumn={dueDateColumn}
            priorityColumn={priorityColumn}
            descriptionColumn={descriptionColumn}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(option.id)}
            onDragStart={handleDragStart}
            onAddCard={() => handleAddCard(option.id)}
            onEditRow={onEditRow}
            onDeleteRow={deleteRow}
            onRename={(newLabel) => handleRenameColumn(option.id, newLabel)}
            onDelete={() => handleDeleteColumn(option.id)}
            onColumnDragStart={() => setDraggedColumnId(option.id)}
            onColumnDrop={() => {
              if (draggedColumnId) {
                handleReorderColumns(draggedColumnId, option.id);
              }
              setDraggedColumnId(null);
            }}
            isDraggingColumn={draggedColumnId !== null}
          />
        ))}

        {/* Uncategorized column (if has items) */}
        {groupedRows['_uncategorized'].length > 0 && (
          <BoardColumn
            title="No Status"
            color="#9ca3af"
            rows={groupedRows['_uncategorized']}
            titleColumn={titleColumn}
            customerColumn={customerColumn}
            dueDateColumn={dueDateColumn}
            priorityColumn={priorityColumn}
            descriptionColumn={descriptionColumn}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('_uncategorized')}
            onDragStart={handleDragStart}
            onAddCard={() => handleAddCard('_uncategorized')}
            onEditRow={onEditRow}
            onDeleteRow={deleteRow}
            isUncategorized
          />
        )}

        {/* Add Column */}
        {showAddColumn ? (
          <div className="flex-shrink-0 w-72 bg-notion-bg-secondary rounded-lg p-3">
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Column name"
              className="w-full px-2 py-1 text-sm border border-notion-border rounded mb-2"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
            />
            <div className="flex gap-1 mb-3">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColumnColor(color)}
                  className={`w-6 h-6 rounded ${newColumnColor === color ? 'ring-2 ring-offset-1 ring-notion-accent' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddColumn}
                className="px-3 py-1 text-sm bg-notion-accent text-white rounded"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddColumn(false);
                  setNewColumnName('');
                }}
                className="px-3 py-1 text-sm text-notion-text-secondary hover:bg-notion-bg-hover rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddColumn(true)}
            className="flex-shrink-0 w-72 h-12 bg-notion-bg-secondary rounded-lg flex items-center justify-center gap-2 text-notion-text-secondary hover:bg-notion-bg-hover"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Column
          </button>
        )}
      </div>
    </div>
  );
}

interface BoardColumnProps {
  title: string;
  color: string;
  rows: DatabaseRow[];
  titleColumn?: DatabaseColumn;
  customerColumn?: DatabaseColumn;
  dueDateColumn?: DatabaseColumn;
  priorityColumn?: DatabaseColumn;
  descriptionColumn?: DatabaseColumn;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragStart: (row: DatabaseRow) => void;
  onAddCard: () => void;
  onEditRow: (row: DatabaseRow) => void;
  onDeleteRow: (rowId: string) => void;
  onRename?: (newLabel: string) => void;
  onDelete?: () => void;
  onColumnDragStart?: () => void;
  onColumnDrop?: () => void;
  isDraggingColumn?: boolean;
  isUncategorized?: boolean;
}

function BoardColumn({
  title,
  color,
  rows,
  titleColumn,
  customerColumn,
  dueDateColumn,
  priorityColumn,
  descriptionColumn,
  onDragOver,
  onDrop,
  onDragStart,
  onAddCard,
  onEditRow,
  onDeleteRow,
  onRename,
  onDelete,
  onColumnDragStart,
  onColumnDrop,
  isDraggingColumn,
  isUncategorized,
}: BoardColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showMenu, setShowMenu] = useState(false);

  const handleSaveTitle = () => {
    if (onRename && editTitle.trim() && editTitle !== title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`flex-shrink-0 w-72 bg-notion-bg-secondary rounded-lg ${isDraggingColumn ? 'border-2 border-dashed border-notion-accent' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (onColumnDrop) onColumnDrop();
        onDrop();
      }}
      draggable={!isUncategorized}
      onDragStart={(e) => {
        if (!isUncategorized && onColumnDragStart) {
          e.dataTransfer.effectAllowed = 'move';
          onColumnDragStart();
        }
      }}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-notion-border group">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            className="flex-1 px-1 py-0.5 text-sm font-medium border border-notion-border rounded"
            autoFocus
          />
        ) : (
          <span
            className="font-medium text-sm text-notion-text flex-1 cursor-pointer"
            onDoubleClick={() => !isUncategorized && setIsEditing(true)}
          >
            {title}
          </span>
        )}
        <span className="text-xs text-notion-text-secondary">
          {rows.length}
        </span>
        {!isUncategorized && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-notion-bg-hover rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-notion-border rounded shadow-lg py-1 z-20 min-w-[120px]">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left hover:bg-notion-bg-hover"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    if (onDelete) onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left text-red-600 hover:bg-notion-bg-hover"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
        {rows.map((row) => (
          <BoardCard
            key={row.id}
            row={row}
            titleColumn={titleColumn}
            customerColumn={customerColumn}
            dueDateColumn={dueDateColumn}
            priorityColumn={priorityColumn}
            descriptionColumn={descriptionColumn}
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
          Add Card
        </button>
      </div>
    </div>
  );
}

interface BoardCardProps {
  row: DatabaseRow;
  titleColumn?: DatabaseColumn;
  customerColumn?: DatabaseColumn;
  dueDateColumn?: DatabaseColumn;
  priorityColumn?: DatabaseColumn;
  descriptionColumn?: DatabaseColumn;
  onDragStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function BoardCard({
  row,
  titleColumn,
  customerColumn,
  dueDateColumn,
  priorityColumn,
  descriptionColumn,
  onDragStart,
  onEdit,
  onDelete,
}: BoardCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const title = titleColumn ? (row.data[titleColumn.id] as string) : null;
  const customer = customerColumn ? (row.data[customerColumn.id] as string) : null;
  const dueDate = dueDateColumn ? (row.data[dueDateColumn.id] as string) : null;
  const priority = priorityColumn ? (row.data[priorityColumn.id] as string) : null;
  const description = descriptionColumn ? (row.data[descriptionColumn.id] as string) : null;

  // Get priority color
  const getPriorityColor = (p: string | null) => {
    if (!p) return null;
    const lower = p.toLowerCase();
    if (lower.includes('high') || lower.includes('urgent')) return '#ef4444';
    if (lower.includes('medium')) return '#f59e0b';
    if (lower.includes('low')) return '#22c55e';
    return '#6b7280';
  };

  // Format due date
  const formatDueDate = (date: string | null) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      const today = new Date();
      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { text: 'Overdue', color: '#ef4444' };
      if (diffDays === 0) return { text: 'Today', color: '#f59e0b' };
      if (diffDays === 1) return { text: 'Tomorrow', color: '#f59e0b' };
      if (diffDays <= 7) return { text: d.toLocaleDateString('en-US', { weekday: 'short' }), color: '#6b7280' };
      return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: '#6b7280' };
    } catch {
      return null;
    }
  };

  const dueDateInfo = formatDueDate(dueDate);
  const priorityColor = getPriorityColor(priority);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onEdit}
      className="bg-white border border-notion-border rounded-lg p-3 cursor-pointer hover:border-notion-accent hover:shadow-sm group relative transition-all"
    >
      {/* Title */}
      <div className="text-sm font-medium text-notion-text mb-1">
        {title || <span className="text-notion-text-secondary italic">Untitled</span>}
      </div>

      {/* Description preview */}
      {description && (
        <div className="text-xs text-notion-text-secondary mb-2 line-clamp-2">
          {description}
        </div>
      )}

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {/* Customer */}
        {customer && (
          <div className="flex items-center gap-1 text-xs text-notion-text-secondary">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate max-w-[80px]">{customer}</span>
          </div>
        )}

        {/* Due Date */}
        {dueDateInfo && (
          <div
            className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${dueDateInfo.color}20`, color: dueDateInfo.color }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {dueDateInfo.text}
          </div>
        )}

        {/* Priority */}
        {priority && priorityColor && (
          <div
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}
          >
            {priority}
          </div>
        )}
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
