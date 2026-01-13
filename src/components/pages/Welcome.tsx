import { useNavigate } from 'react-router-dom';
import { usePageStore } from '../../stores/pageStore';

export function Welcome() {
  const navigate = useNavigate();
  const { createPage } = usePageStore();

  const handleCreatePage = async () => {
    const newPageId = await createPage();
    if (newPageId) {
      navigate(`/page/${newPageId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h1 className="text-4xl font-bold text-notion-text mb-4">
        Welcome to NotionCF
      </h1>
      <p className="text-lg text-notion-text-secondary mb-8 max-w-md">
        A Notion-like workspace powered by Cloudflare. Create pages, organize your thoughts, and build databases.
      </p>
      <button 
        onClick={handleCreatePage}
        className="flex items-center gap-2 px-4 py-2 bg-notion-accent text-white rounded hover:opacity-90 transition-opacity"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create your first page
      </button>
    </div>
  )
}
