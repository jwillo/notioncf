import { useState, useEffect, useCallback, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useNavigate } from 'react-router-dom';
import { api, PageTreeNode } from '../../services/api';

function PageLinkComponent({ node }: NodeViewProps) {
  const navigate = useNavigate();
  const pageId = node.attrs.pageId;
  const pageTitle = node.attrs.pageTitle || 'Untitled';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/page/${pageId}`);
  };

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        onClick={handleClick}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer text-sm transition-colors"
        contentEditable={false}
      >
        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-gray-700">{pageTitle}</span>
      </span>
    </NodeViewWrapper>
  );
}

export const PageLinkExtension = Node.create({
  name: 'pageLink',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      pageId: {
        default: '',
      },
      pageTitle: {
        default: 'Untitled',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-page-link]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-page-link': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageLinkComponent);
  },
});

interface PageLinkMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pageId: string, pageTitle: string) => void;
  position: { top: number; left: number };
  filter: string;
}

function flattenPages(pages: PageTreeNode[]): { id: string; title: string }[] {
  const result: { id: string; title: string }[] = [];
  const traverse = (nodes: PageTreeNode[]) => {
    for (const node of nodes) {
      result.push({ id: node.id, title: node.title });
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  };
  traverse(pages);
  return result;
}

export function PageLinkMenu({ isOpen, onClose, onSelect, position, filter }: PageLinkMenuProps) {
  const [pages, setPages] = useState<{ id: string; title: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.pages.list().then(({ data }) => {
        if (data?.pages) {
          setPages(flattenPages(data.pages));
        }
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const filteredPages = pages.filter(
    (p) => p.title.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i + 1) % filteredPages.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i - 1 + filteredPages.length) % filteredPages.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (filteredPages[selectedIndex]) {
          onSelect(filteredPages[selectedIndex].id, filteredPages[selectedIndex].title);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [isOpen, filteredPages, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (menuRef.current && selectedIndex >= 0) {
      const selectedEl = menuRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-64 max-h-64 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-200 mb-1">
        Link to page {filter && `· "${filter}"`}
      </div>
      {isLoading ? (
        <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
      ) : filteredPages.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-500">No pages found</div>
      ) : (
        filteredPages.map((page, index) => (
          <button
            key={page.id}
            onClick={() => onSelect(page.id, page.title)}
            className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm ${
              index === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate">{page.title}</span>
          </button>
        ))
      )}
    </div>
  );
}
