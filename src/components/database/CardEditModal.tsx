import { useState, useEffect } from 'react';
import { DatabaseColumn, DatabaseRow } from '../../services/api';
import { useDatabaseStore } from '../../stores/databaseStore';

interface CardEditModalProps {
  row: DatabaseRow | null;
  columns: DatabaseColumn[];
  isOpen: boolean;
  onClose: () => void;
}

export function CardEditModal({ row, columns, isOpen, onClose }: CardEditModalProps) {
  const { updateRow } = useDatabaseStore();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (row) {
      setFormData({ ...row.data });
    }
  }, [row]);

  if (!isOpen || !row) return null;

  const handleChange = (columnId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [columnId]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateRow(row.id, formData);
    setIsSaving(false);
    onClose();
  };

  const renderField = (column: DatabaseColumn) => {
    const value = formData[column.id];

    switch (column.type) {
      case 'text':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleChange(column.id, e.target.value)}
            className="w-full px-3 py-2 border border-notion-border rounded focus:outline-none focus:ring-2 focus:ring-notion-accent"
            placeholder={`Enter ${column.name.toLowerCase()}...`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => handleChange(column.id, e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-notion-border rounded focus:outline-none focus:ring-2 focus:ring-notion-accent"
            placeholder="0"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleChange(column.id, e.target.value)}
            className="w-full px-3 py-2 border border-notion-border rounded focus:outline-none focus:ring-2 focus:ring-notion-accent"
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(column.id, e.target.checked)}
              className="w-4 h-4 rounded border-notion-border text-notion-accent focus:ring-notion-accent"
            />
            <span className="text-sm text-notion-text-secondary">
              {value ? 'Yes' : 'No'}
            </span>
          </label>
        );

      case 'select': {
        const options = column.config?.options || [];
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => handleChange(column.id, e.target.value || null)}
            className="w-full px-3 py-2 border border-notion-border rounded focus:outline-none focus:ring-2 focus:ring-notion-accent"
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }

      default:
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleChange(column.id, e.target.value)}
            className="w-full px-3 py-2 border border-notion-border rounded focus:outline-none focus:ring-2 focus:ring-notion-accent"
          />
        );
    }
  };

  // Get title for display
  const titleColumn = columns.find((c) => c.name.toLowerCase() === 'title' || c.type === 'text');
  const title = titleColumn ? (formData[titleColumn.id] as string) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-notion-border">
          <h2 className="text-lg font-semibold text-notion-text">
            {title || 'Edit Card'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-notion-bg-hover rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {columns.map((column) => (
            <div key={column.id}>
              <label className="block text-sm font-medium text-notion-text mb-1">
                {column.name}
              </label>
              {renderField(column)}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-notion-border bg-notion-bg-secondary">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-notion-text-secondary hover:bg-notion-bg-hover rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-notion-accent text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
