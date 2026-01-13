import { create } from 'zustand';
import { api, PageTreeNode, Page, Block } from '../services/api';

interface PageState {
  pages: PageTreeNode[];
  currentPage: Page | null;
  currentBlocks: Block[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchPages: () => Promise<void>;
  fetchPage: (id: string) => Promise<void>;
  createPage: (parentId?: string | null) => Promise<string | null>;
  updatePage: (id: string, data: { title?: string; icon?: string | null }) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  saveContent: (blocks: Block[]) => Promise<void>;
  setCurrentBlocks: (blocks: Block[]) => void;
  clearCurrentPage: () => void;
}

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  currentPage: null,
  currentBlocks: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchPages: async () => {
    set({ isLoading: true, error: null });
    const { data, error } = await api.pages.list();
    if (error) {
      set({ isLoading: false, error: error.message });
    } else {
      set({ isLoading: false, pages: data?.pages || [] });
    }
  },

  fetchPage: async (id: string) => {
    set({ isLoading: true, error: null });
    const { data, error } = await api.pages.get(id);
    if (error) {
      set({ isLoading: false, error: error.message });
    } else if (data) {
      set({
        isLoading: false,
        currentPage: data.page,
        currentBlocks: data.blocks,
      });
    }
  },

  createPage: async (parentId?: string | null) => {
    set({ isLoading: true, error: null });
    const { data, error } = await api.pages.create({ title: 'Untitled', parentId });
    if (error) {
      set({ isLoading: false, error: error.message });
      return null;
    }
    await get().fetchPages();
    set({ isLoading: false });
    return data?.id || null;
  },

  updatePage: async (id: string, updateData: { title?: string; icon?: string | null }) => {
    const { error } = await api.pages.update(id, updateData);
    if (error) {
      set({ error: error.message });
      return;
    }
    const { currentPage } = get();
    if (currentPage?.id === id) {
      set({ currentPage: { ...currentPage, ...updateData } });
    }
    await get().fetchPages();
  },

  deletePage: async (id: string) => {
    const { error } = await api.pages.delete(id);
    if (error) {
      set({ error: error.message });
      return;
    }
    const { currentPage } = get();
    if (currentPage?.id === id) {
      set({ currentPage: null, currentBlocks: [] });
    }
    await get().fetchPages();
  },

  saveContent: async (blocks: Block[]) => {
    const { currentPage } = get();
    if (!currentPage) return;

    set({ isSaving: true });
    const { error } = await api.pages.saveContent(
      currentPage.id,
      blocks.map((b, i) => ({
        id: b.id,
        type: b.type,
        content: b.content,
        position: i,
      }))
    );
    if (error) {
      set({ isSaving: false, error: error.message });
    } else {
      set({ isSaving: false, currentBlocks: blocks });
    }
  },

  setCurrentBlocks: (blocks: Block[]) => {
    set({ currentBlocks: blocks });
  },

  clearCurrentPage: () => {
    set({ currentPage: null, currentBlocks: [] });
  },
}));
