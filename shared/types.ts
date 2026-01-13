// Shared types between frontend and backend

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface Page {
  id: string;
  title: string;
  parentId: string | null;
  icon: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  children?: Page[];
}

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'bulletList'
  | 'numberedList'
  | 'codeBlock'
  | 'databaseEmbed';

export interface Block {
  id: string;
  pageId: string;
  type: BlockType;
  content: Record<string, unknown>;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ColumnType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export interface SelectOption {
  id: string;
  label: string;
  color: string;
}

export interface DatabaseColumn {
  id: string;
  databaseId: string;
  name: string;
  type: ColumnType;
  position: number;
  config: {
    options?: SelectOption[];
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

// API Response types
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PagesListResponse {
  pages: Page[];
}

export interface PageDetailResponse {
  page: Page;
  blocks: Block[];
}

export interface DatabaseDetailResponse {
  database: Database;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
}
