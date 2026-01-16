import { useState, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ExcalidrawData {
  elements: readonly any[];
  appState?: any;
  files?: any;
}

function ExcalidrawComponent({ node, updateAttributes }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const data: ExcalidrawData = node.attrs.data ? JSON.parse(node.attrs.data) : { elements: [] };
  const hasContent = data.elements && data.elements.length > 0;

  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      const newData: ExcalidrawData = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          zoom: appState.zoom,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
        },
        files,
      };
      updateAttributes({ data: JSON.stringify(newData) });
    },
    [updateAttributes]
  );

  const handleClose = useCallback(async () => {
    // Generate preview image
    if (data.elements && data.elements.length > 0) {
      try {
        const blob = await exportToBlob({
          elements: data.elements,
          files: data.files || null,
          mimeType: 'image/png',
          appState: {
            exportWithDarkMode: false,
            exportBackground: true,
            viewBackgroundColor: '#ffffff',
          },
        });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (err) {
        console.error('Failed to generate preview:', err);
      }
    }
    setIsEditing(false);
  }, [data.elements, data.files]);

  // Full-screen editing mode
  if (isEditing) {
    return (
      <NodeViewWrapper>
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-notion-border bg-white">
            <span className="font-medium text-notion-text">Excalidraw</span>
            <button
              onClick={handleClose}
              className="px-4 py-1.5 bg-notion-accent text-white rounded hover:bg-blue-600 text-sm"
            >
              Done
            </button>
          </div>
          <div className="flex-1">
            <Excalidraw
              initialData={{
                elements: data.elements,
                appState: data.appState,
                files: data.files,
              }}
              onChange={handleChange}
            />
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Preview/collapsed mode
  return (
    <NodeViewWrapper>
      <div
        className="border border-notion-border rounded-lg my-4 overflow-hidden cursor-pointer hover:border-notion-accent transition-colors"
        onClick={() => setIsEditing(true)}
      >
        {hasContent && previewUrl ? (
          <img
            src={previewUrl}
            alt="Excalidraw drawing"
            className="w-full max-h-96 object-contain bg-white"
          />
        ) : hasContent ? (
          <div className="h-48 bg-white flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-notion-text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm text-notion-text-secondary">Click to edit drawing</span>
            </div>
          </div>
        ) : (
          <div className="h-32 bg-notion-bg-secondary flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-notion-text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm text-notion-text-secondary">Click to start drawing</span>
            </div>
          </div>
        )}
        <div className="px-3 py-2 bg-notion-bg-secondary border-t border-notion-border flex items-center gap-2 text-xs text-notion-text-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Excalidraw
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
      data: {
        default: JSON.stringify({ elements: [] }),
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
