import { useState, useRef, useEffect } from 'react';

interface PageTitleProps {
  title: string;
  icon: string | null;
  onTitleChange: (title: string) => void;
  onIconChange: (icon: string | null) => void;
}

const DEFAULT_ICONS = ['📄', '📝', '📋', '📌', '📎', '🗂️', '📁', '💡', '⭐', '🎯', '✅', '🔖'];

export function PageTitle({ title, icon, onTitleChange, onIconChange }: PageTitleProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (localTitle !== title) {
      onTitleChange(localTitle || 'Untitled');
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    }
    if (e.key === 'Escape') {
      setLocalTitle(title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-start gap-2">
        <button
          onClick={() => setShowIconPicker(!showIconPicker)}
          className="text-4xl hover:bg-notion-bg-hover rounded p-1 transition-colors"
          title="Change icon"
        >
          {icon || '📄'}
        </button>

        {isEditingTitle ? (
          <input
            ref={inputRef}
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="text-4xl font-bold text-notion-text bg-transparent border-none outline-none w-full"
            placeholder="Untitled"
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            className="text-4xl font-bold text-notion-text cursor-text hover:bg-notion-bg-hover rounded px-1 -mx-1"
          >
            {title || 'Untitled'}
          </h1>
        )}
      </div>

      {showIconPicker && (
        <div className="mt-2 p-2 bg-white border border-notion-border rounded-lg shadow-lg inline-block">
          <div className="grid grid-cols-6 gap-1">
            {DEFAULT_ICONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onIconChange(emoji);
                  setShowIconPicker(false);
                }}
                className="text-2xl p-2 hover:bg-notion-bg-hover rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              onIconChange(null);
              setShowIconPicker(false);
            }}
            className="mt-2 text-sm text-notion-text-secondary hover:text-notion-text w-full text-left px-2"
          >
            Remove icon
          </button>
        </div>
      )}
    </div>
  );
}
