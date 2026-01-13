import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback, useRef, useState } from 'react';
import { Block } from '../../services/api';
import { SlashCommandMenu } from './SlashCommandMenu';
import { FormattingToolbar } from './FormattingToolbar';

interface BlockEditorProps {
  blocks: Block[];
  onSave: (blocks: Block[]) => void;
  pageId: string;
}

function blocksToHtml(blocks: Block[]): string {
  if (blocks.length === 0) return '';
  
  return blocks
    .sort((a, b) => a.position - b.position)
    .map((block) => {
      const content = block.content as { text?: string; html?: string };
      if (content.html) return content.html;
      if (content.text) return `<p>${content.text}</p>`;
      return '';
    })
    .join('');
}

function htmlToBlocks(html: string, pageId: string): Block[] {
  if (!html || html === '<p></p>') return [];
  
  const now = new Date().toISOString();
  return [{
    id: crypto.randomUUID(),
    pageId,
    type: 'rich_text',
    content: { html },
    position: 0,
    createdAt: now,
    updatedAt: now,
  }];
}

export function BlockEditor({ blocks, onSave, pageId }: BlockEditorProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHtmlRef = useRef<string>('');
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands, or just start writing...",
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: blocksToHtml(blocks),
    editorProps: {
      attributes: {
        class: 'prose prose-notion max-w-none focus:outline-none min-h-[200px]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      
      // Check for slash command trigger
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 1),
        from,
        '\n'
      );
      
      if (textBefore === '/') {
        // Get cursor position for menu
        const coords = editor.view.coordsAtPos(from);
        setSlashMenuPosition({
          top: coords.bottom + 5,
          left: coords.left,
        });
        setSlashMenuOpen(true);
        setSlashFilter('');
      } else if (slashMenuOpen) {
        // Check if we're still in a slash command context
        const fullTextBefore = editor.state.doc.textBetween(
          Math.max(0, from - 20),
          from,
          '\n'
        );
        const slashIndex = fullTextBefore.lastIndexOf('/');
        if (slashIndex === -1) {
          setSlashMenuOpen(false);
          setSlashFilter('');
        } else {
          // Extract filter text after the slash
          const filterText = fullTextBefore.slice(slashIndex + 1);
          setSlashFilter(filterText);
        }
      }
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (html !== lastSavedHtmlRef.current) {
          lastSavedHtmlRef.current = html;
          const newBlocks = htmlToBlocks(html, pageId);
          onSave(newBlocks);
        }
      }, 1000);
    },
  });

  useEffect(() => {
    if (editor && blocks.length > 0) {
      const html = blocksToHtml(blocks);
      if (html !== editor.getHTML()) {
        editor.commands.setContent(html);
        lastSavedHtmlRef.current = html;
      }
    }
  }, [blocks, editor]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editor) {
          const html = editor.getHTML();
          if (html !== lastSavedHtmlRef.current) {
            lastSavedHtmlRef.current = html;
            const newBlocks = htmlToBlocks(html, pageId);
            onSave(newBlocks);
          }
        }
      }
    },
    [editor, onSave, pageId]
  );

  if (!editor) {
    return <div className="animate-pulse h-32 bg-notion-bg-hover rounded" />;
  }

  return (
    <div onKeyDown={handleKeyDown} className="block-editor">
      <EditorContent editor={editor} />
      <FormattingToolbar editor={editor} />
      <SlashCommandMenu
        editor={editor}
        isOpen={slashMenuOpen}
        onClose={() => {
          setSlashMenuOpen(false);
          setSlashFilter('');
        }}
        position={slashMenuPosition}
        filter={slashFilter}
      />
    </div>
  );
}
