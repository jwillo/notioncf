import { useState, useEffect } from 'react';
import { api, Tag, TaggedPage } from '../../services/api';

interface TagsSectionProps {
  onSelectTag: (tag: Tag | null) => void;
  selectedTagId: string | null;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

export function TagsSection({ onSelectTag, selectedTagId }: TagsSectionProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    const result = await api.tags.list();
    if (result.data) {
      setTags(result.data.tags);
    }
    setIsLoading(false);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const result = await api.tags.create({ name: newTagName.trim(), color: newTagColor });
    if (result.data) {
      setTags([...tags, result.data]);
      setNewTagName('');
      setShowCreateForm(false);
    }
  };

  const handleDeleteTag = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this tag? It will be removed from all pages.')) {
      await api.tags.delete(tagId);
      setTags(tags.filter((t) => t.id !== tagId));
      if (selectedTagId === tagId) {
        onSelectTag(null);
      }
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <span className="text-xs font-medium text-notion-text-secondary uppercase tracking-wider">
          Tags
        </span>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="p-1 hover:bg-notion-bg-hover rounded text-notion-text-secondary hover:text-notion-text"
          title="New tag"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Create Tag Form */}
      {showCreateForm && (
        <div className="px-2 py-2 mb-2 bg-notion-bg-hover rounded">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="w-full px-2 py-1 text-sm border border-notion-border rounded mb-2"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
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
              onClick={handleCreateTag}
              className="px-2 py-1 text-xs bg-notion-accent text-white rounded"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-2 py-1 text-xs text-notion-text-secondary hover:bg-notion-bg-secondary rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tags List */}
      {isLoading ? (
        <div className="px-2 py-2 text-sm text-notion-text-secondary">Loading...</div>
      ) : tags.length === 0 ? (
        <div className="px-2 py-2 text-sm text-notion-text-secondary text-center">
          No tags yet
        </div>
      ) : (
        <div className="space-y-0.5">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onSelectTag(selectedTagId === tag.id ? null : tag)}
              className={`w-full flex items-center gap-2 px-2 py-1 text-sm rounded group ${
                selectedTagId === tag.id
                  ? 'bg-notion-bg-hover text-notion-text'
                  : 'text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="truncate flex-1 text-left">{tag.name}</span>
              <span className="text-xs text-notion-text-secondary">{tag.pageCount}</span>
              <button
                onClick={(e) => handleDeleteTag(tag.id, e)}
                className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-notion-border rounded"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Component to show pages filtered by tag
export function TaggedPagesList({ tag, onClose }: { tag: Tag; onClose: () => void }) {
  const [pages, setPages] = useState<TaggedPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, [tag.id]);

  const loadPages = async () => {
    setIsLoading(true);
    const result = await api.tags.getPages(tag.id);
    if (result.data) {
      setPages(result.data.pages);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-notion-border">
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <h2 className="font-medium text-notion-text">{tag.name}</h2>
          <span className="text-sm text-notion-text-secondary">({pages.length} pages)</span>
          <button onClick={onClose} className="ml-auto p-1 hover:bg-notion-bg-hover rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-notion-text-secondary">Loading...</div>
          ) : pages.length === 0 ? (
            <div className="p-4 text-center text-notion-text-secondary">No pages with this tag</div>
          ) : (
            <div className="py-2">
              {pages.map((page) => (
                <a
                  key={page.id}
                  href={`/page/${page.id}`}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-notion-bg-hover"
                >
                  <span>{page.icon || '📄'}</span>
                  <span className="text-sm text-notion-text">{page.title || 'Untitled'}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
