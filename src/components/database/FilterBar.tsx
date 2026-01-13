import { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { DatabaseColumn } from '../../services/api';

interface FilterBarProps {
  columns: DatabaseColumn[];
}

const OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
];

export function FilterBar({ columns }: FilterBarProps) {
  const { filters, addFilter, removeFilter, clearFilters, sortColumn, sortDirection, setSortColumn } = useDatabaseStore();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [newFilter, setNewFilter] = useState({
    columnId: columns[0]?.id || '',
    operator: 'contains',
    value: '',
  });

  const handleAddFilter = () => {
    if (newFilter.columnId) {
      addFilter(newFilter);
      setNewFilter({ columnId: columns[0]?.id || '', operator: 'contains', value: '' });
      setShowFilterMenu(false);
    }
  };

  const sortedColumn = columns.find((c) => c.id === sortColumn);

  return (
    <div className="px-8 pb-4 flex items-center gap-2 flex-wrap">
      {/* Filter Button */}
      <div className="relative">
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className={`px-3 py-1.5 text-sm rounded border ${
            filters.length > 0
              ? 'border-notion-accent text-notion-accent bg-blue-50'
              : 'border-notion-border text-notion-text-secondary hover:bg-notion-bg-hover'
          } flex items-center gap-2`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
          {filters.length > 0 && (
            <span className="bg-notion-accent text-white text-xs px-1.5 rounded-full">
              {filters.length}
            </span>
          )}
        </button>

        {showFilterMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
            <div className="absolute left-0 top-full mt-1 bg-white border border-notion-border rounded-lg shadow-lg p-3 z-20 min-w-[320px]">
              <div className="text-sm font-medium mb-2">Add Filter</div>

              <div className="flex gap-2 mb-3">
                <select
                  value={newFilter.columnId}
                  onChange={(e) => setNewFilter({ ...newFilter, columnId: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-sm border border-notion-border rounded"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>

                <select
                  value={newFilter.operator}
                  onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value })}
                  className="px-2 py-1.5 text-sm border border-notion-border rounded"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {!['is_empty', 'is_not_empty'].includes(newFilter.operator) && (
                <input
                  type="text"
                  value={newFilter.value}
                  onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                  placeholder="Value..."
                  className="w-full px-2 py-1.5 text-sm border border-notion-border rounded mb-3"
                />
              )}

              <button
                onClick={handleAddFilter}
                className="w-full px-3 py-1.5 text-sm bg-notion-accent text-white rounded hover:opacity-90"
              >
                Add Filter
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sort Button */}
      <div className="relative">
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className={`px-3 py-1.5 text-sm rounded border ${
            sortColumn
              ? 'border-notion-accent text-notion-accent bg-blue-50'
              : 'border-notion-border text-notion-text-secondary hover:bg-notion-bg-hover'
          } flex items-center gap-2`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Sort
          {sortColumn && sortedColumn && (
            <span className="text-xs">
              {sortedColumn.name} {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>

        {showSortMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
            <div className="absolute left-0 top-full mt-1 bg-white border border-notion-border rounded-lg shadow-lg py-1 z-20 min-w-[180px]">
              <button
                onClick={() => {
                  setSortColumn(null);
                  setShowSortMenu(false);
                }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-notion-bg-hover ${
                  !sortColumn ? 'bg-notion-bg-hover' : ''
                }`}
              >
                No sort
              </button>
              {columns.map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    setSortColumn(col.id);
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-notion-bg-hover ${
                    sortColumn === col.id ? 'bg-notion-bg-hover' : ''
                  }`}
                >
                  {col.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Active Filters */}
      {filters.map((filter, index) => {
        const column = columns.find((c) => c.id === filter.columnId);
        const operator = OPERATORS.find((o) => o.value === filter.operator);
        return (
          <div
            key={index}
            className="px-2 py-1 text-sm bg-notion-bg-secondary rounded border border-notion-border flex items-center gap-2"
          >
            <span className="font-medium">{column?.name}</span>
            <span className="text-notion-text-secondary">{operator?.label}</span>
            {filter.value && <span>"{filter.value}"</span>}
            <button
              onClick={() => removeFilter(index)}
              className="text-notion-text-secondary hover:text-red-500"
            >
              ×
            </button>
          </div>
        );
      })}

      {filters.length > 0 && (
        <button
          onClick={clearFilters}
          className="px-2 py-1 text-sm text-notion-text-secondary hover:text-notion-text"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
