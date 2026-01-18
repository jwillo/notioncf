import { useState, useEffect, useCallback, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Excalidraw, exportToSvg } from '@excalidraw/excalidraw';

/* eslint-disable @typescript-eslint/no-explicit-any */

function ExcalidrawComponent({ node, updateAttributes }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [drawingData, setDrawingData] = useState<any>(null);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);
  
  const drawingId = node.attrs.drawingId || '';
  const hasDrawing = drawingId.length > 0;

  // Load drawing data from API
  const loadDrawing = useCallback(async (id: string) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/drawings/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDrawingData(data);
        // Generate preview
        if (data.elements && data.elements.length > 0) {
          const svg = await exportToSvg({
            elements: data.elements,
            appState: { exportWithDarkMode: false },
            files: data.files || null,
          });
          setPreviewSvg(svg.outerHTML);
        }
      }
    } catch (e) {
      console.error('Failed to load drawing:', e);
    }
    setIsLoading(false);
  }, []);

  // Save drawing to API
  const saveDrawing = useCallback(async (id: string, data: any) => {
    try {
      await fetch(`/api/drawings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // Update preview
      if (data.elements && data.elements.length > 0) {
        const svg = await exportToSvg({
          elements: data.elements,
          appState: { exportWithDarkMode: false },
          files: data.files || null,
        });
        setPreviewSvg(svg.outerHTML);
      }
    } catch (e) {
      console.error('Failed to save drawing:', e);
    }
  }, []);

  useEffect(() => {
    if (hasDrawing) {
      loadDrawing(drawingId);
    }
  }, [drawingId, hasDrawing, loadDrawing]);

  const handleCreateNew = () => {
    const newId = crypto.randomUUID();
    updateAttributes({ drawingId: newId });
    setDrawingData({ elements: [], appState: {}, files: {} });
    setIsEditing(true);
  };

  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (!drawingId) return;
      
      const data = {
        elements: [...elements],
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
        },
        files,
      };
      setDrawingData(data);
      
      // Debounce saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        saveDrawing(drawingId, data);
      }, 1000);
    },
    [drawingId, saveDrawing]
  );

  const handleClose = () => {
    // Force save on close
    if (drawingId && drawingData) {
      saveDrawing(drawingId, drawingData);
    }
    setIsEditing(false);
  };

  // Full-screen editing mode
  if (isEditing) {
    return (
      <NodeViewWrapper>
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
            <span className="font-medium text-gray-900">Excalidraw</span>
            <button
              onClick={handleClose}
              className="px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Done
            </button>
          </div>
          <div className="flex-1">
            <Excalidraw
              initialData={drawingData}
              onChange={handleChange}
            />
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Empty state - no drawing yet
  if (!hasDrawing) {
    return (
      <NodeViewWrapper>
        <div
          className="border border-dashed border-gray-300 rounded-lg my-4 p-8 bg-gray-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onClick={handleCreateNew}
        >
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <div className="text-sm font-medium text-gray-700">Click to create a drawing</div>
            <div className="text-xs text-gray-500 mt-1">Opens Excalidraw editor</div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <NodeViewWrapper>
        <div className="border border-gray-200 rounded-lg my-4 p-8 bg-white">
          <div className="text-center text-gray-500">Loading drawing...</div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Preview mode with SVG
  return (
    <NodeViewWrapper>
      <div
        className="border border-gray-200 rounded-lg my-4 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => setIsEditing(true)}
      >
        {previewSvg ? (
          <div 
            className="bg-white p-4 flex items-center justify-center min-h-[200px]"
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
        ) : (
          <div className="bg-white p-8 flex items-center justify-center min-h-[200px]">
            <div className="text-center text-gray-500">
              <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm">Click to edit drawing</span>
            </div>
          </div>
        )}
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Excalidraw · Click to edit
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
      drawingId: {
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
