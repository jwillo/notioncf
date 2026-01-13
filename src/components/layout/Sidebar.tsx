import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { usePageStore } from '../../stores/pageStore';
import { useDatabaseStore } from '../../stores/databaseStore';
import { PageTreeNode } from '../../services/api';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

function PageTreeItem({
  page,
  level = 0,
  onCreateChild,
  onDelete,
}: {
  page: PageTreeNode;
  level?: number;
  onCreateChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}) {
  const { id } = useParams();
  const isActive = id === page.id;
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 pr-2 py-1 text-sm rounded transition-colors ${
          isActive
            ? 'bg-notion-bg-hover text-notion-text'
            : 'text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text'
        }`}
        style={{ paddingLeft: `${4 + level * 12}px` }}
      >
        {page.children.length > 0 ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-notion-border rounded flex-shrink-0"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-4" />
        )}

        <Link to={`/page/${page.id}`} className="flex items-center gap-2 flex-1 min-w-0">
          <span className="flex-shrink-0">{page.icon || '📄'}</span>
          <span className="truncate">{page.title || 'Untitled'}</span>
        </Link>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-notion-border rounded"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-notion-border rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => {
                    onCreateChild(page.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-notion-bg-hover flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add subpage
                </button>
                <button
                  onClick={() => {
                    onDelete(page.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isExpanded && page.children.length > 0 && (
        <div>
          {page.children.map((child) => (
            <PageTreeItem
              key={child.id}
              page={child}
              level={level + 1}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { pages, isLoading, fetchPages, createPage, deletePage } = usePageStore();
  const { databases, fetchDatabases, createDatabase } = useDatabaseStore();

  useEffect(() => {
    fetchPages();
    fetchDatabases();
  }, [fetchPages, fetchDatabases]);

  const handleCreatePage = async (parentId?: string | null) => {
    const newPageId = await createPage(parentId);
    if (newPageId) {
      navigate(`/page/${newPageId}`);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (confirm('Move this page to trash?')) {
      await deletePage(id);
      navigate('/');
    }
  };

  const handleCreateDatabase = async () => {
    const newDbId = await createDatabase('Untitled Database');
    if (newDbId) {
      navigate(`/database/${newDbId}`);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-2 top-2 p-2 hover:bg-notion-bg-hover rounded z-10"
        aria-label="Open sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    );
  }

  return (
    <aside className="w-60 bg-notion-bg-secondary border-r border-notion-border flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between p-3 border-b border-notion-border">
        <Link to="/" className="font-semibold text-notion-text hover:text-notion-accent">
          NotionCF
        </Link>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-notion-bg-hover rounded"
          aria-label="Close sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          <span className="text-xs font-medium text-notion-text-secondary uppercase tracking-wider">
            Pages
          </span>
          <button
            onClick={() => handleCreatePage()}
            className="p-1 hover:bg-notion-bg-hover rounded text-notion-text-secondary hover:text-notion-text"
            title="New page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="px-2 py-4 space-y-2">
            <div className="h-6 bg-notion-bg-hover rounded animate-pulse" />
            <div className="h-6 bg-notion-bg-hover rounded animate-pulse w-3/4" />
          </div>
        ) : pages.length === 0 ? (
          <div className="text-sm text-notion-text-secondary px-2 py-4 text-center">
            No pages yet
          </div>
        ) : (
          <div className="space-y-0.5">
            {pages.map((page) => (
              <PageTreeItem
                key={page.id}
                page={page}
                onCreateChild={handleCreatePage}
                onDelete={handleDeletePage}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => handleCreatePage()}
          className="w-full flex items-center gap-2 px-2 py-1.5 mt-2 text-sm text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Page
        </button>

        {/* Databases Section */}
        <div className="flex items-center justify-between px-2 py-1 mb-1 mt-4">
          <span className="text-xs font-medium text-notion-text-secondary uppercase tracking-wider">
            Databases
          </span>
          <button
            onClick={handleCreateDatabase}
            className="p-1 hover:bg-notion-bg-hover rounded text-notion-text-secondary hover:text-notion-text"
            title="New database"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {databases.length === 0 ? (
          <div className="text-sm text-notion-text-secondary px-2 py-2 text-center">
            No databases yet
          </div>
        ) : (
          <div className="space-y-0.5">
            {databases.map((db) => (
              <Link
                key={db.id}
                to={`/database/${db.id}`}
                className="flex items-center gap-2 px-2 py-1 text-sm text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text rounded"
              >
                <span>🗃️</span>
                <span className="truncate">{db.title}</span>
              </Link>
            ))}
          </div>
        )}

        <button
          onClick={handleCreateDatabase}
          className="w-full flex items-center gap-2 px-2 py-1.5 mt-2 text-sm text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Database
        </button>
      </nav>

      <div className="p-2 border-t border-notion-border">
        <Link
          to="/settings"
          className="flex items-center gap-2 px-2 py-1.5 text-sm text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </Link>
      </div>
    </aside>
  );
}
