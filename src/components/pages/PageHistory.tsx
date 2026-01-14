import { useState, useEffect } from 'react';
import { api, PageVersion, PageVersionWithBlocks } from '../../services/api';

interface PageHistoryProps {
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export function PageHistory({ pageId, isOpen, onClose, onRestore }: PageHistoryProps) {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PageVersionWithBlocks | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && pageId) {
      loadHistory();
    }
  }, [isOpen, pageId]);

  const loadHistory = async () => {
    setIsLoading(true);
    const result = await api.pages.getHistory(pageId);
    if (result.data) {
      setVersions(result.data.versions);
    }
    setIsLoading(false);
  };

  const loadVersion = async (versionId: string) => {
    setIsLoading(true);
    const result = await api.pages.getVersion(pageId, versionId);
    if (result.data) {
      setSelectedVersion(result.data);
    }
    setIsLoading(false);
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;
    
    setIsRestoring(true);
    const result = await api.pages.restoreVersion(pageId, selectedVersion.id);
    if (result.data?.success) {
      onRestore();
      onClose();
    }
    setIsRestoring(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-notion-border">
          <h2 className="text-lg font-semibold text-notion-text">Page History</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-notion-bg-hover rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Version List */}
          <div className="w-72 border-r border-notion-border overflow-y-auto">
            {isLoading && versions.length === 0 ? (
              <div className="p-4 text-center text-notion-text-secondary">Loading...</div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-center text-notion-text-secondary">
                No history yet. History is created when you save changes.
              </div>
            ) : (
              <div className="divide-y divide-notion-border">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => loadVersion(version.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-notion-bg-hover ${
                      selectedVersion?.id === version.id ? 'bg-notion-bg-hover' : ''
                    }`}
                  >
                    <div className="text-sm font-medium text-notion-text">
                      Version {version.versionNumber}
                    </div>
                    <div className="text-xs text-notion-text-secondary mt-1">
                      {formatDate(version.createdAt)}
                    </div>
                    <div className="text-xs text-notion-text-secondary">
                      by {version.createdBy.name || version.createdBy.email}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedVersion ? (
              <div>
                <div className="mb-4 pb-4 border-b border-notion-border">
                  <h3 className="text-xl font-semibold text-notion-text">
                    {selectedVersion.title}
                  </h3>
                  <p className="text-sm text-notion-text-secondary mt-1">
                    Version {selectedVersion.versionNumber} • {formatDate(selectedVersion.createdAt)}
                  </p>
                </div>
                <div className="prose prose-notion max-w-none">
                  {selectedVersion.blocks.map((block) => {
                    const content = block.content as { html?: string; text?: string };
                    if (content.html) {
                      return (
                        <div
                          key={block.id}
                          dangerouslySetInnerHTML={{ __html: content.html }}
                        />
                      );
                    }
                    if (content.text) {
                      return <p key={block.id}>{content.text}</p>;
                    }
                    return null;
                  })}
                  {selectedVersion.blocks.length === 0 && (
                    <p className="text-notion-text-secondary italic">Empty page</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-notion-text-secondary">
                Select a version to preview
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-notion-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-notion-text-secondary hover:bg-notion-bg-hover rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleRestore}
            disabled={!selectedVersion || isRestoring}
            className="px-4 py-2 text-sm bg-notion-accent text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? 'Restoring...' : 'Restore this version'}
          </button>
        </div>
      </div>
    </div>
  );
}
