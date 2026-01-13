import { useState, useRef, useEffect } from 'react';
import { DatabaseColumn } from '../../services/api';

interface CellEditorProps {
  column: DatabaseColumn;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function CellEditor({ column, value, onChange }: CellEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setLocalValue(String(value ?? ''));
    setIsEditing(true);
  };

  const handleEndEdit = () => {
    setIsEditing(false);
    let newValue: unknown = localValue;

    if (column.type === 'number') {
      newValue = localValue === '' ? null : Number(localValue);
    } else if (column.type === 'checkbox') {
      newValue = localValue === 'true';
    }

    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEndEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // Checkbox type
  if (column.type === 'checkbox') {
    return (
      <div className="p-2 flex items-center justify-center">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-notion-border text-notion-accent focus:ring-notion-accent"
        />
      </div>
    );
  }

  // Select type
  if (column.type === 'select') {
    const options = column.config.options || [];
    const selectedOption = options.find((opt) => opt.id === value);

    return (
      <div className="p-2">
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full bg-transparent border-none outline-none text-sm cursor-pointer"
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {selectedOption && (
          <span
            className="inline-block px-2 py-0.5 rounded text-xs mt-1"
            style={{ backgroundColor: selectedOption.color + '20', color: selectedOption.color }}
          >
            {selectedOption.label}
          </span>
        )}
      </div>
    );
  }

  // Date type
  if (column.type === 'date') {
    return (
      <div className="p-2">
        <input
          type="date"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full bg-transparent border-none outline-none text-sm"
        />
      </div>
    );
  }

  // Text and Number types
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={column.type === 'number' ? 'number' : 'text'}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleEndEdit}
        onKeyDown={handleKeyDown}
        className="w-full p-2 bg-transparent border-none outline-none text-sm"
      />
    );
  }

  return (
    <div
      onClick={handleStartEdit}
      className="p-2 min-h-[36px] cursor-text text-sm"
    >
      {value !== null && value !== undefined && value !== '' ? (
        String(value)
      ) : (
        <span className="text-notion-text-secondary">Empty</span>
      )}
    </div>
  );
}
