import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { usePageStore } from '../../stores/pageStore';
import { BlockEditor } from '../editor/BlockEditor';
import { PageTitle } from '../editor/PageTitle';
import { PageHistory } from './PageHistory';
import { PageTagsEditor } from '../tags/PageTagsEditor';

export function PageView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const {
    currentPage,
    currentBlocks,
    isLoading,
    isSaving,
    error,
    fetchPage,
    updatePage,
    saveContent,
    clearCurrentPage,
  } = usePageStore();

  useEffect(() => {
    if (id) {
      fetchPage(id);
    }
    return () => clearCurrentPage();
  }, [id, fetchPage, clearCurrentPage]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-16 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-notion-bg-hover rounded w-1/3" />
          <div className="h-4 bg-notion-bg-hover rounded w-full" />
          <div className="h-4 bg-notion-bg-hover rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-16 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-medium">Error loading page</h2>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-3 text-sm text-red-700 hover:text-red-900 underline"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="max-w-3xl mx-auto px-16 py-12">
        <p className="text-notion-text-secondary">Page not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-16 py-12">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-notion-text-secondary">
          {isSaving ? 'Saving...' : 'Saved'}
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-1 text-xs text-notion-text-secondary hover:text-notion-text"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </button>
      </div>

      <PageTitle
        title={currentPage.title}
        icon={currentPage.icon}
        onTitleChange={(title) => updatePage(currentPage.id, { title })}
        onIconChange={(icon) => updatePage(currentPage.id, { icon })}
      />

      <div className="mb-4">
        <PageTagsEditor pageId={currentPage.id} />
      </div>

      <BlockEditor
        blocks={currentBlocks}
        onSave={saveContent}
        pageId={currentPage.id}
      />

      <PageHistory
        pageId={currentPage.id}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={() => fetchPage(currentPage.id)}
      />
    </div>
  );
}
