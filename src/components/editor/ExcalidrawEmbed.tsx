import { useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

const EXCALIDRAW_HOST = 'https://excalidraw.jdcf.cc';

function ExcalidrawComponent({ node, updateAttributes }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  const url = node.attrs.url || '';
  const hasUrl = url.length > 0;

  const handleSaveUrl = () => {
    if (urlInput.trim()) {
      updateAttributes({ url: urlInput.trim() });
    }
    setIsEditing(false);
    setUrlInput('');
  };

  const handleCreateNew = () => {
    // Open Excalidraw in new tab - user will create drawing there
    window.open(EXCALIDRAW_HOST, '_blank');
  };

  const handleOpenDrawing = () => {
    window.open(url, '_blank');
  };

  // URL input mode
  if (isEditing || !hasUrl) {
    return (
      <NodeViewWrapper>
        <div className="border border-gray-200 rounded-lg my-4 p-4 bg-gray-50">
          <div className="text-sm font-medium text-gray-900 mb-3">Embed Excalidraw Drawing</div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Paste Excalidraw URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={`${EXCALIDRAW_HOST}/#room=...`}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Create a drawing at excalidraw.jdcf.cc, then copy the URL from your browser
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveUrl}
                disabled={!urlInput.trim()}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Embed
              </button>
              <button
                onClick={handleCreateNew}
                className="px-3 py-1.5 text-sm text-blue-500 hover:bg-blue-50 rounded"
              >
                Open Excalidraw →
              </button>
              {hasUrl && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded ml-auto"
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

  // Embedded view - show link card since iframe won't work with Cloudflare Access
  return (
    <NodeViewWrapper>
      <div className="border border-gray-200 rounded-lg my-4 overflow-hidden hover:border-blue-400 transition-colors">
        <div 
          className="bg-white p-6 cursor-pointer"
          onClick={handleOpenDrawing}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">Excalidraw Drawing</div>
              <div className="text-xs text-gray-500 truncate">{url}</div>
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Excalidraw
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUrlInput(url);
              setIsEditing(true);
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Change
          </button>
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
