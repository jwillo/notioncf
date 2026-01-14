import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { api, PageTreeNode } from '../../services/api';
import { usePageStore } from '../../stores/pageStore';

interface BlockActionsProps {
  editor: Editor;
  currentPageId: string;
}

type ActionType = 'copy' | 'move' | null;

export function BlockActions({ editor, currentPageId }: BlockActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [pages, setPages] = useState<PageTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState('');
  const { createPage } = usePageStore();

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    const result = await api.pages.list();
    if (result.data) {
      setPages(flattenPages(result.data.pages));
    }
  };

  const flattenPages = (pages: PageTreeNode[], result: PageTreeNode[] = []): PageTreeNode[] => {
    for (const page of pages) {
      result.push(page);
      if (page.children.length > 0) {
        flattenPages(page.children, result);
      }
    }
    return result;
  };

  const handleOpenMenu = (type: ActionType) => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Please select some content first');
      return;
    }
    
    // Get selected text and wrap in paragraph tags
    const selectedText = editor.state.doc.textBetween(from, to, '\n\n');
    const html = selectedText
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p}</p>`)
      .join('');
    
    setSelectedContent(html || `<p>${selectedText}</p>`);
    setActionType(type);
    setIsOpen(true);
  };

  const handleCopyToPage = async (targetPageId: string) => {
    if (!selectedContent) return;
    setIsLoading(true);

    // Get target page content
    const result = await api.pages.get(targetPageId);
    if (result.data) {
      const existingHtml = result.data.blocks
        .sort((a, b) => a.position - b.position)
        .map((b) => (b.content as { html?: string }).html || '')
        .join('');
      
      // Append selected content
      const newHtml = existingHtml + selectedContent;
      const newBlocks = [{
        id: crypto.randomUUID(),
        type: 'rich_text',
        content: { html: newHtml },
        position: 0,
      }];
      
      await api.pages.saveContent(targetPageId, newBlocks);
    }

    setIsLoading(false);
    setIsOpen(false);
    setActionType(null);
  };

  const handleMoveToPage = async (targetPageId: string) => {
    if (!selectedContent) return;
    setIsLoading(true);

    // Copy to target page first
    await handleCopyToPage(targetPageId);

    // Delete from current page (delete selection)
    editor.chain().focus().deleteSelection().run();

    setIsLoading(false);
    setIsOpen(false);
    setActionType(null);
  };

  const handleCopyToNewPage = async () => {
    setIsLoading(true);
    const newPageId = await createPage();
    if (newPageId) {
      const newBlocks = [{
        id: crypto.randomUUID(),
        type: 'rich_text',
        content: { html: selectedContent },
        position: 0,
      }];
      await api.pages.saveContent(newPageId, newBlocks);
    }
    setIsLoading(false);
    setIsOpen(false);
    setActionType(null);
  };

  const handleMoveToNewPage = async () => {
    setIsLoading(true);
    const newPageId = await createPage();
    if (newPageId) {
      const newBlocks = [{
        id: crypto.randomUUID(),
        type: 'rich_text',
        content: { html: selectedContent },
        position: 0,
      }];
      await api.pages.saveContent(newPageId, newBlocks);
      // Delete from current page
      editor.chain().focus().deleteSelection().run();
    }
    setIsLoading(false);
    setIsOpen(false);
    setActionType(null);
  };

  const otherPages = pages.filter((p) => p.id !== currentPageId);

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-1 mt-2 mb-4">
        <button
          onClick={() => handleOpenMenu('copy')}
          className="flex items-center gap-1 px-2 py-1 text-xs text-notion-text-secondary hover:bg-notion-bg-hover rounded"
          title="Copy selection to another page"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy to...
        </button>
        <button
          onClick={() => handleOpenMenu('move')}
          className="flex items-center gap-1 px-2 py-1 text-xs text-notion-text-secondary hover:bg-notion-bg-hover rounded"
          title="Move selection to another page"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Move to...
        </button>
      </div>

      {/* Page Selection Modal */}
      {isOpen && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-notion-border">
              <h3 className="font-medium text-notion-text">
                {actionType === 'copy' ? 'Copy to page' : 'Move to page'}
              </h3>
              <p className="text-xs text-notion-text-secondary mt-1">
                Select a destination page for the selected content
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {/* New Page Option */}
              <button
                onClick={actionType === 'copy' ? handleCopyToNewPage : handleMoveToNewPage}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-notion-accent hover:bg-notion-bg-hover border-b border-notion-border"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {actionType === 'copy' ? 'Copy to new page' : 'Move to new page'}
              </button>

              {/* Existing Pages */}
              {otherPages.length === 0 ? (
                <div className="px-4 py-3 text-sm text-notion-text-secondary">
                  No other pages available
                </div>
              ) : (
                otherPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => actionType === 'copy' ? handleCopyToPage(page.id) : handleMoveToPage(page.id)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-notion-bg-hover text-left"
                  >
                    <span>{page.icon || '📄'}</span>
                    <span className="truncate">{page.title || 'Untitled'}</span>
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t border-notion-border">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-1.5 text-sm text-notion-text-secondary hover:bg-notion-bg-hover rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
