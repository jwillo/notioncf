import { useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

function ExcalidrawComponent({ node, updateAttributes }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  const url = node.attrs.url || '';
  const hasUrl = url.length > 0;

  // Convert excalidraw.com URL to embed URL
  const getEmbedUrl = (inputUrl: string) => {
    // Handle various Excalidraw URL formats
    // https://excalidraw.com/#json=... -> embed
    // https://excalidraw.com/#room=... -> embed  
    if (inputUrl.includes('excalidraw.com')) {
      // Already has hash params, just add embed flag if needed
      if (inputUrl.includes('#')) {
        return inputUrl.replace('excalidraw.com/', 'excalidraw.com/') + '&embed=true';
      }
      return inputUrl;
    }
    return inputUrl;
  };

  const handleSaveUrl = () => {
    if (urlInput.trim()) {
      updateAttributes({ url: urlInput.trim() });
    }
    setIsEditing(false);
    setUrlInput('');
  };

  const handleCreateNew = () => {
    // Open Excalidraw in new tab, user can save and paste link back
    window.open('https://excalidraw.com/', '_blank');
  };

  // URL input mode
  if (isEditing || !hasUrl) {
    return (
      <NodeViewWrapper>
        <div className="border border-notion-border rounded-lg my-4 p-4 bg-notion-bg-secondary">
          <div className="text-sm font-medium text-notion-text mb-3">Embed Excalidraw Drawing</div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-notion-text-secondary mb-1">
                Paste Excalidraw share link
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://excalidraw.com/#json=..."
                className="w-full px-3 py-2 text-sm border border-notion-border rounded focus:outline-none focus:ring-2 focus:ring-notion-accent"
                autoFocus
              />
              <p className="text-xs text-notion-text-secondary mt-1">
                Open Excalidraw, create your drawing, then use Menu → Export → Link to get a shareable link
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveUrl}
                disabled={!urlInput.trim()}
                className="px-3 py-1.5 text-sm bg-notion-accent text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Embed
              </button>
              <button
                onClick={handleCreateNew}
                className="px-3 py-1.5 text-sm text-notion-accent hover:bg-notion-bg-hover rounded"
              >
                Create new drawing →
              </button>
              {hasUrl && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm text-notion-text-secondary hover:bg-notion-bg-hover rounded ml-auto"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Embedded view
  return (
    <NodeViewWrapper>
      <div className="border border-notion-border rounded-lg my-4 overflow-hidden">
        <iframe
          src={getEmbedUrl(url)}
          className="w-full h-96 border-0"
          title="Excalidraw drawing"
          allow="clipboard-read; clipboard-write"
        />
        <div className="px-3 py-2 bg-notion-bg-secondary border-t border-notion-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-notion-text-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Excalidraw
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-notion-accent hover:underline"
            >
              Open in Excalidraw →
            </a>
            <button
              onClick={() => {
                setUrlInput(url);
                setIsEditing(true);
              }}
              className="text-xs text-notion-text-secondary hover:text-notion-text"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// TipTap extension
export const ExcalidrawExtension = Node.create({
  name: 'excalidraw',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      url: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-excalidraw]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-excalidraw': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExcalidrawComponent);
  },
});
