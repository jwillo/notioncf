import { create } from 'zustand';
import { api, Database, DatabaseColumn, DatabaseRow } from '../services/api';

interface DatabaseState {
  databases: Database[];
  currentDatabase: Database | null;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Filtering and sorting
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  filters: Array<{ columnId: string; operator: string; value: string }>;

  fetchDatabases: () => Promise<void>;
  fetchDatabase: (id: string) => Promise<void>;
  createDatabase: (title?: string) => Promise<string | null>;
  updateDatabase: (id: string, title: string) => Promise<void>;
  deleteDatabase: (id: string) => Promise<void>;

  addColumn: (data: { name?: string; type?: string }) => Promise<void>;
  updateColumn: (columnId: string, data: { name?: string; type?: string }) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;

  addRow: () => Promise<void>;
  updateRow: (rowId: string, data: Record<string, unknown>) => Promise<void>;
  deleteRow: (rowId: string) => Promise<void>;

  setSortColumn: (columnId: string | null) => void;
  toggleSortDirection: () => void;
  addFilter: (filter: { columnId: string; operator: string; value: string }) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;

  clearCurrentDatabase: () => void;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  databases: [],
  currentDatabase: null,
  columns: [],
  rows: [],
  isLoading: false,
  isSaving: false,
  error: null,
  sortColumn: null,
  sortDirection: 'asc',
  filters: [],

  fetchDatabases: async () => {
    set({ isLoading: true, error: null });
    const { data, error } = await api.databases.list();
    if (error) {
      set({ isLoading: false, error: error.message });
    } else {
      set({ isLoading: false, databases: data?.databases || [] });
    }
  },

  fetchDatabase: async (id: string) => {
    set({ isLoading: true, error: null });
    const { data, error } = await api.databases.get(id);
    if (error) {
      set({ isLoading: false, error: error.message });
    } else if (data) {
      set({
        isLoading: false,
        currentDatabase: data.database,
        columns: data.columns,
        rows: data.rows,
      });
    }
  },

  createDatabase: async (title?: string) => {
    set({ isLoading: true, error: null });
    const { data, error } = await api.databases.create({ title });
    if (error) {
      set({ isLoading: false, error: error.message });
      return null;
    }
    await get().fetchDatabases();
    set({ isLoading: false });
    return data?.id || null;
  },

  updateDatabase: async (id: string, title: string) => {
    const { error } = await api.databases.update(id, { title });
    if (error) {
      set({ error: error.message });
      return;
    }
    const { currentDatabase } = get();
    if (currentDatabase?.id === id) {
      set({ currentDatabase: { ...currentDatabase, title } });
    }
    await get().fetchDatabases();
  },

  deleteDatabase: async (id: string) => {
    const { error } = await api.databases.delete(id);
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ currentDatabase: null, columns: [], rows: [] });
    await get().fetchDatabases();
  },

  addColumn: async (data) => {
    const { currentDatabase } = get();
    if (!currentDatabase) return;

    set({ isSaving: true });
    const { data: newColumn, error } = await api.databases.addColumn(currentDatabase.id, data);
    if (error) {
      set({ isSaving: false, error: error.message });
      return;
    }
    if (newColumn) {
      set((state) => ({
        isSaving: false,
        columns: [...state.columns, newColumn],
      }));
    }
  },

  updateColumn: async (columnId, data) => {
    const { currentDatabase } = get();
    if (!currentDatabase) return;

    set({ isSaving: true });
    const { error } = await api.databases.updateColumns(currentDatabase.id, [{ id: columnId, ...data }]);
    if (error) {
      set({ isSaving: false, error: error.message });
      return;
    }
    set((state) => ({
      isSaving: false,
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, ...data } as DatabaseColumn : col
      ),
    }));
  },

  deleteColumn: async (columnId) => {
    const { currentDatabase } = get();
    if (!currentDatabase) return;

    set({ isSaving: true });
    const { error } = await api.databases.deleteColumn(currentDatabase.id, columnId);
    if (error) {
      set({ isSaving: false, error: error.message });
      return;
    }
    set((state) => ({
      isSaving: false,
      columns: state.columns.filter((col) => col.id !== columnId),
    }));
  },

  addRow: async () => {
    const { currentDatabase } = get();
    if (!currentDatabase) return;

    set({ isSaving: true });
    const { data: newRow, error } = await api.databases.addRow(currentDatabase.id);
    if (error) {
      set({ isSaving: false, error: error.message });
      return;
    }
    if (newRow) {
      set((state) => ({
        isSaving: false,
        rows: [...state.rows, newRow],
      }));
    }
  },

  updateRow: async (rowId, data) => {
    const { currentDatabase } = get();
    if (!currentDatabase) return;

    set({ isSaving: true });
    const { error } = await api.databases.updateRow(currentDatabase.id, rowId, data);
    if (error) {
      set({ isSaving: false, error: error.message });
      return;
    }
    set((state) => ({
      isSaving: false,
      rows: state.rows.map((row) =>
        row.id === rowId ? { ...row, data } : row
      ),
    }));
  },

  deleteRow: async (rowId) => {
    const { currentDatabase } = get();
    if (!currentDatabase) return;

    set({ isSaving: true });
    const { error } = await api.databases.deleteRow(currentDatabase.id, rowId);
    if (error) {
      set({ isSaving: false, error: error.message });
      return;
    }
    set((state) => ({
      isSaving: false,
      rows: state.rows.filter((row) => row.id !== rowId),
    }));
  },

  setSortColumn: (columnId) => {
    set({ sortColumn: columnId });
  },

  toggleSortDirection: () => {
    set((state) => ({
      sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  },

  addFilter: (filter) => {
    set((state) => ({
      filters: [...state.filters, filter],
    }));
  },

  removeFilter: (index) => {
    set((state) => ({
      filters: state.filters.filter((_, i) => i !== index),
    }));
  },

  clearFilters: () => {
    set({ filters: [] });
  },

  clearCurrentDatabase: () => {
    set({
      currentDatabase: null,
      columns: [],
      rows: [],
      sortColumn: null,
      sortDirection: 'asc',
      filters: [],
    });
  },
}));

// Selector for sorted and filtered rows
export function useSortedFilteredRows() {
  const { rows, columns, sortColumn, sortDirection, filters } = useDatabaseStore();

  let result = [...rows];

  // Apply filters
  for (const filter of filters) {
    const column = columns.find((c) => c.id === filter.columnId);
    if (!column) continue;

    result = result.filter((row) => {
      const value = row.data[column.id];
      const filterValue = filter.value.toLowerCase();

      switch (filter.operator) {
        case 'contains':
          return String(value || '').toLowerCase().includes(filterValue);
        case 'equals':
          return String(value || '').toLowerCase() === filterValue;
        case 'not_equals':
          return String(value || '').toLowerCase() !== filterValue;
        case 'is_empty':
          return !value || value === '';
        case 'is_not_empty':
          return value && value !== '';
        case 'greater_than':
          return Number(value) > Number(filter.value);
        case 'less_than':
          return Number(value) < Number(filter.value);
        default:
          return true;
      }
    });
  }

  // Apply sorting
  if (sortColumn) {
    const column = columns.find((c) => c.id === sortColumn);
    if (column) {
      result.sort((a, b) => {
        const aVal = a.data[sortColumn];
        const bVal = b.data[sortColumn];

        let comparison = 0;
        if (column.type === 'number') {
          comparison = (Number(aVal) || 0) - (Number(bVal) || 0);
        } else if (column.type === 'date') {
          comparison = new Date(String(aVal) || 0).getTime() - new Date(String(bVal) || 0).getTime();
        } else {
          comparison = String(aVal || '').localeCompare(String(bVal || ''));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
  }

  return result;
}
