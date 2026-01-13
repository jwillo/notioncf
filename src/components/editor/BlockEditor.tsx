import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback, useRef } from 'react';
import { Block } from '../../services/api';

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
    </div>
  );
}
