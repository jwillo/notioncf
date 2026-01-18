import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { api, Database } from '../../services/api';

interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: (editor: Editor, onShowBoardSelector?: () => void) => void;
  needsBoardSelector?: boolean;
}

const COMMANDS: CommandItem[] = [
  {
    title: 'Text',
    description: 'Just start writing with plain text',
    icon: 'Aa',
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: '•',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: '1.',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'To-do List',
    description: 'Track tasks with a to-do list',
    icon: '☑',
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    icon: '"',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Capture a code snippet',
    icon: '</>',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    description: 'Visually divide blocks',
    icon: '—',
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Board',
    description: 'Embed a kanban board',
    icon: '📋',
    needsBoardSelector: true,
    command: (_editor, onShowBoardSelector) => {
      if (onShowBoardSelector) {
        onShowBoardSelector();
      }
    },
  },
  {
    title: 'Drawing',
    description: 'Create an Excalidraw diagram',
    icon: '✏️',
    command: (editor) => {
      editor.chain().focus().insertContent({
        type: 'excalidraw',
        attrs: { drawingId: '' },
      }).run();
    },
  },
  {
    title: 'Image',
    description: 'Upload an image',
    icon: '🖼',
    command: (editor) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          // Store position before inserting placeholder
          const pos = editor.state.selection.from;
          
          // Show loading placeholder
          editor.chain().focus().insertContent('Uploading image...').run();
          
          try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            const result = await response.json();
            
            if (result.url) {
              // Select and delete the placeholder text, then insert image
              const placeholderLength = 'Uploading image...'.length;
              editor
                .chain()
                .focus()
                .setTextSelection({ from: pos, to: pos + placeholderLength })
                .deleteSelection()
                .setImage({ src: result.url })
                .run();
            }
          } catch (err) {
            console.error('Upload failed:', err);
          }
        }
      };
      input.click();
    },
  },
];

interface SlashCommandMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  filter: string;
}

export function SlashCommandMenu({ editor, isOpen, onClose, position, filter }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);

  const loadDatabases = async () => {
    setIsLoadingDatabases(true);
    const result = await api.databases.list();
    if (result.data) {
      setDatabases(result.data.databases);
    }
    setIsLoadingDatabases(false);
  };

  const handleSelectDatabase = (databaseId: string) => {
    editor.chain().focus().insertContent({
      type: 'boardEmbed',
      attrs: { databaseId },
    }).run();
    setShowBoardSelector(false);
    onClose();
  };

  const handleCreateNewBoard = async () => {
    const title = 'New Board';
    const result = await api.databases.create({ title });
    if (result.data) {
      // Create default Status column
      const colResult = await api.databases.addColumn(result.data.id, {
        name: 'Status',
        type: 'select',
      });
      if (colResult.data) {
        await api.databases.updateColumns(result.data.id, [{
          id: colResult.data.id,
          config: {
            options: [
              { id: crypto.randomUUID(), label: 'To Do', color: '#e5e7eb' },
              { id: crypto.randomUUID(), label: 'In Progress', color: '#fef08a' },
              { id: crypto.randomUUID(), label: 'Done', color: '#bbf7d0' },
            ]
          }
        }]);
      }
      // Add Title column
      await api.databases.addColumn(result.data.id, { name: 'Title', type: 'text' });
      // Embed the new board
      handleSelectDatabase(result.data.id);
    }
  };

  const filteredCommands = COMMANDS.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  const executeCommand = useCallback(
    (command: CommandItem) => {
      // Handle board selector specially
      if (command.needsBoardSelector) {
        loadDatabases();
        setShowBoardSelector(true);
        return;
      }
      
      // First close the menu
      onClose();
      
      // Get current selection position
      const { from } = editor.state.selection;
      
      // Calculate how much to delete (slash + filter text)
      const deleteLength = filter.length + 1; // +1 for the slash
      const deleteFrom = Math.max(0, from - deleteLength);
      
      // Delete the slash command text, then apply the formatting
      editor
        .chain()
        .focus()
        .deleteRange({ from: deleteFrom, to: from })
        .run();
      
      // Now execute the actual command
      command.command(editor);
    },
    [editor, filter, onClose]
  );

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
      // Let other keys (including Backspace) go through to the editor
      // The filter is updated via the editor's onUpdate
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, filteredCommands, selectedIndex, executeCommand, onClose]);

  useEffect(() => {
    if (menuRef.current && selectedIndex >= 0) {
      const selectedEl = menuRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen && !showBoardSelector) return null;

  // Board Selector Modal
  if (showBoardSelector) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBoardSelector(false)}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-3 border-b border-notion-border">
            <h3 className="font-medium text-notion-text">Embed a Board</h3>
            <p className="text-xs text-notion-text-secondary mt-1">
              Select an existing board or create a new one
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {/* Create New Board Option */}
            <button
              onClick={handleCreateNewBoard}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-notion-accent hover:bg-notion-bg-hover border-b border-notion-border"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create new board
            </button>

            {/* Existing Databases */}
            {isLoadingDatabases ? (
              <div className="p-4 text-center text-notion-text-secondary">Loading...</div>
            ) : databases.length === 0 ? (
              <div className="p-4 text-center text-notion-text-secondary">
                No boards yet
              </div>
            ) : (
              databases.map((db) => (
                <button
                  key={db.id}
                  onClick={() => handleSelectDatabase(db.id)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-notion-bg-hover text-left"
                >
                  <svg className="w-5 h-5 text-notion-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                  </svg>
                  <span className="truncate">{db.title}</span>
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-3 border-t border-notion-border">
            <button
              onClick={() => setShowBoardSelector(false)}
              className="w-full px-3 py-1.5 text-sm text-notion-text-secondary hover:bg-notion-bg-hover rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-notion-border rounded-lg shadow-lg py-2 w-72 max-h-80 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {filter && (
        <div className="px-3 py-1 text-xs text-notion-text-secondary border-b border-notion-border mb-1">
          Filtering: "{filter}"
        </div>
      )}
      {filteredCommands.map((cmd, index) => (
        <button
          key={cmd.title}
          onClick={() => executeCommand(cmd)}
          className={`w-full px-3 py-2 text-left flex items-center gap-3 ${
            index === selectedIndex ? 'bg-notion-bg-hover' : 'hover:bg-notion-bg-hover'
          }`}
        >
          <span className="w-10 h-10 flex items-center justify-center bg-notion-bg-secondary rounded text-lg font-mono">
            {cmd.icon}
          </span>
          <div>
            <div className="text-sm font-medium text-notion-text">{cmd.title}</div>
            <div className="text-xs text-notion-text-secondary">{cmd.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
