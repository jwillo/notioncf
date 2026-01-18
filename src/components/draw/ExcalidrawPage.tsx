import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Excalidraw } from '@excalidraw/excalidraw';

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE = '/api/drawings';

export function ExcalidrawPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(null);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<number | null>(null);

  // Load drawing from API
  const loadDrawing = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.elements && data.elements.length > 0) {
          setInitialData(data);
        }
      }
    } catch (e) {
      console.error('Failed to load drawing:', e);
    }
    setIsLoading(false);
  };

  // Save drawing to API (debounced)
  const saveDrawing = useCallback(async (id: string, data: any) => {
    try {
      await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error('Failed to save drawing:', e);
    }
  }, []);

  useEffect(() => {
    if (paramId) {
      setDrawingId(paramId);
      loadDrawing(paramId);
    } else {
      // Generate new ID for new drawings
      const newId = crypto.randomUUID();
      setDrawingId(newId);
      // Redirect to the new drawing URL
      window.history.replaceState(null, '', `/draw/${newId}`);
      setIsLoading(false);
    }
  }, [paramId]);

  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (!drawingId) return;
      
      const data = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
        },
        files,
      };
      
      // Debounce saves to avoid too many API calls
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        saveDrawing(drawingId, data);
      }, 1000);
    },
    [drawingId, saveDrawing]
  );

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Excalidraw
        initialData={initialData}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            loadScene: true,
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  );
}
