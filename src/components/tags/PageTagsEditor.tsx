import { useState, useEffect } from 'react';
import { api, Tag } from '../../services/api';

interface PageTagsEditorProps {
  pageId: string;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

export function PageTagsEditor({ pageId }: PageTagsEditorProps) {
  const [pageTags, setPageTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  const handleCreateAndAddTag = async () => {
    if (!newTagName.trim()) return;
    setIsLoading(true);
    const result = await api.tags.create({ name: newTagName.trim(), color: newTagColor });
    if (result.data) {
      await api.tags.addToPage(pageId, result.data.id);
      await loadPageTags();
      await loadAllTags();
      setNewTagName('');
      setShowCreateForm(false);
    }
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
        <div className="absolute top-full left-0 mt-1 bg-white border border-notion-border rounded-lg shadow-lg z-10 min-w-[250px]">
          {/* Create New Tag Form */}
          {showCreateForm ? (
            <div className="p-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="w-full px-2 py-1 text-sm border border-notion-border rounded mb-2"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAddTag()}
                autoFocus
              />
              <div className="flex gap-1 mb-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-5 h-5 rounded-full ${newTagColor === color ? 'ring-2 ring-offset-1 ring-notion-accent' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAndAddTag}
                  disabled={isLoading || !newTagName.trim()}
                  className="px-2 py-1 text-xs bg-notion-accent text-white rounded disabled:opacity-50"
                >
                  Create & Add
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTagName('');
                  }}
                  className="px-2 py-1 text-xs text-notion-text-secondary hover:bg-notion-bg-hover rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Create New Tag Button */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-notion-accent hover:bg-notion-bg-hover border-b border-notion-border"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create new tag
              </button>

              {/* Existing Tags */}
              {availableTags.length === 0 ? (
                <div className="px-3 py-2 text-sm text-notion-text-secondary">
                  {allTags.length === 0 ? 'No tags yet' : 'All tags added'}
                </div>
              ) : (
                <div className="py-1 max-h-48 overflow-y-auto">
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
