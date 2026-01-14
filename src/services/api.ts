const API_BASE = '/api';

interface ApiError {
  code: string;
  message: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || { code: 'UNKNOWN', message: 'Request failed' } };
    }

    return { data };
  } catch (err) {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error',
      },
    };
  }
}

export interface PageTreeNode {
  id: string;
  title: string;
  parentId: string | null;
  icon: string | null;
  children: PageTreeNode[];
}

export interface Page {
  id: string;
  title: string;
  parentId: string | null;
  icon: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Block {
  id: string;
  pageId: string;
  type: string;
  content: Record<string, unknown>;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageWithBlocks {
  page: Page;
  blocks: Block[];
}

export interface PageVersion {
  id: string;
  pageId: string;
  title: string;
  versionNumber: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PageVersionWithBlocks extends PageVersion {
  blocks: Block[];
}

export interface Database {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseColumn {
  id: string;
  databaseId: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox';
  position: number;
  config: {
    options?: Array<{ id: string; label: string; color: string }>;
  };
}

export interface DatabaseRow {
  id: string;
  databaseId: string;
  data: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseWithData {
  database: Database;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
}

export interface SearchResult {
  id: string;
  type: 'page' | 'database';
  title: string;
  snippet: string;
  icon: string | null;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  pageCount: number;
}

export interface TaggedPage {
  id: string;
  title: string;
  icon: string | null;
  updatedAt: string;
}

export const api = {
  search: (query: string) =>
    request<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`),

  pages: {
    list: () => request<{ pages: PageTreeNode[] }>('/pages'),

    get: (id: string) => request<PageWithBlocks>(`/pages/${id}`),

    create: (data: { title?: string; parentId?: string | null; icon?: string | null }) =>
      request<Page>('/pages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: { title?: string; parentId?: string | null; icon?: string | null }) =>
      request<{ success: boolean }>(`/pages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/pages/${id}`, {
        method: 'DELETE',
      }),

    saveContent: (id: string, blocks: { id: string; type: string; content: Record<string, unknown>; position: number }[]) =>
      request<{ success: boolean; updatedAt: string }>(`/pages/${id}/content`, {
        method: 'PUT',
        body: JSON.stringify({ blocks }),
      }),

    getHistory: (id: string) =>
      request<{ versions: PageVersion[] }>(`/pages/${id}/history`),

    getVersion: (pageId: string, versionId: string) =>
      request<PageVersionWithBlocks>(`/pages/${pageId}/history/${versionId}`),

    restoreVersion: (pageId: string, versionId: string) =>
      request<{ success: boolean; restoredVersion: number; newVersion: number; updatedAt: string }>(
        `/pages/${pageId}/history/${versionId}`,
        { method: 'POST' }
      ),
  },

  databases: {
    list: () => request<{ databases: Database[] }>('/databases'),

    get: (id: string) => request<DatabaseWithData>(`/databases/${id}`),

    create: (data: { title?: string }) =>
      request<Database>('/databases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: { title?: string }) =>
      request<{ success: boolean; updatedAt: string }>(`/databases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/databases/${id}`, {
        method: 'DELETE',
      }),

    addColumn: (databaseId: string, data: { name?: string; type?: string; config?: Record<string, unknown> }) =>
      request<DatabaseColumn>(`/databases/${databaseId}/columns`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateColumns: (databaseId: string, columns: Array<{ id: string; name?: string; type?: string; position?: number; config?: Record<string, unknown> }>) =>
      request<{ success: boolean; updatedAt: string }>(`/databases/${databaseId}/columns`, {
        method: 'PUT',
        body: JSON.stringify({ columns }),
      }),

    deleteColumn: (databaseId: string, columnId: string) =>
      request<{ success: boolean }>(`/databases/${databaseId}/columns`, {
        method: 'DELETE',
        body: JSON.stringify({ columnId }),
      }),

    addRow: (databaseId: string, data?: Record<string, unknown>) =>
      request<DatabaseRow>(`/databases/${databaseId}/rows`, {
        method: 'POST',
        body: JSON.stringify({ data: data || {} }),
      }),

    updateRow: (databaseId: string, rowId: string, data: Record<string, unknown>) =>
      request<{ success: boolean; updatedAt: string }>(`/databases/${databaseId}/rows`, {
        method: 'PUT',
        body: JSON.stringify({ rowId, data }),
      }),

    deleteRow: (databaseId: string, rowId: string) =>
      request<{ success: boolean }>(`/databases/${databaseId}/rows`, {
        method: 'DELETE',
        body: JSON.stringify({ rowId }),
      }),
  },

  tags: {
    list: () => request<{ tags: Tag[] }>('/tags'),

    create: (data: { name: string; color?: string }) =>
      request<Tag>('/tags', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/tags/${id}`, {
        method: 'DELETE',
      }),

    update: (id: string, data: { name?: string; color?: string }) =>
      request<{ success: boolean }>(`/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getPages: (tagId: string) =>
      request<{ pages: TaggedPage[] }>(`/tags/${tagId}`),

    addToPage: (pageId: string, tagId: string) =>
      request<{ success: boolean }>(`/pages/${pageId}/tags`, {
        method: 'POST',
        body: JSON.stringify({ tagId }),
      }),

    removeFromPage: (pageId: string, tagId: string) =>
      request<{ success: boolean }>(`/pages/${pageId}/tags`, {
        method: 'DELETE',
        body: JSON.stringify({ tagId }),
      }),

    getPageTags: (pageId: string) =>
      request<{ tags: Array<{ id: string; name: string; color: string }> }>(`/pages/${pageId}/tags`),
  },
};
