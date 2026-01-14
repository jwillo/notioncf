import { useState, useEffect } from 'react';
import { api, Tag } from '../../services/api';

interface PageTagsEditorProps {
  pageId: string;
}

export function PageTagsEditor({ pageId }: PageTagsEditorProps) {
  const [pageTags, setPageTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPageTags();
    loadAllTags();
  }, [pageId]);

  const loadPageTags = async () => {
    const result = await api.tags.getPageTags(pageId);
    if (result.data) {
      setPageTags(result.data.tags);
    }
  };

  const loadAllTags = async () => {
    const result = await api.tags.list();
    if (result.data) {
      setAllTags(result.data.tags);
    }
  };

  const handleAddTag = async (tagId: string) => {
    setIsLoading(true);
    await api.tags.addToPage(pageId, tagId);
    await loadPageTags();
    setIsLoading(false);
  };

  const handleRemoveTag = async (tagId: string) => {
    setIsLoading(true);
    await api.tags.removeFromPage(pageId, tagId);
    await loadPageTags();
    setIsLoading(false);
  };

  const availableTags = allTags.filter(
    (tag) => !pageTags.some((pt) => pt.id === tag.id)
  );

  return (
    <div className="relative">
      {/* Current Tags */}
      <div className="flex flex-wrap items-center gap-1">
        {pageTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:bg-white/20 rounded-full p-0.5"
              disabled={isLoading}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-notion-text-secondary hover:bg-notion-bg-hover rounded"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add tag
        </button>
      </div>

      {/* Tag Picker Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-notion-border rounded-lg shadow-lg z-10 min-w-[200px]">
          {availableTags.length === 0 ? (
            <div className="px-3 py-2 text-sm text-notion-text-secondary">
              {allTags.length === 0 ? 'No tags created yet' : 'All tags added'}
            </div>
          ) : (
            <div className="py-1">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    handleAddTag(tag.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-notion-bg-hover"
                  disabled={isLoading}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
