import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { usePageStore } from '../../stores/pageStore';
import { BlockEditor } from '../editor/BlockEditor';
import { PageTitle } from '../editor/PageTitle';

export function PageView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      </div>

      <PageTitle
        title={currentPage.title}
        icon={currentPage.icon}
        onTitleChange={(title) => updatePage(currentPage.id, { title })}
        onIconChange={(icon) => updatePage(currentPage.id, { icon })}
      />

      <BlockEditor
        blocks={currentBlocks}
        onSave={saveContent}
        pageId={currentPage.id}
      />
    </div>
  );
}
