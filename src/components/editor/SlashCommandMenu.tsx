import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';

interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: (editor: Editor) => void;
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

  const filteredCommands = COMMANDS.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  const executeCommand = useCallback(
    (command: CommandItem) => {
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

  if (!isOpen || filteredCommands.length === 0) return null;

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
