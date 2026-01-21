import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect, useCallback, useRef, useState } from 'react';
import { Block } from '../../services/api';
import { SlashCommandMenu } from './SlashCommandMenu';
import { FormattingToolbar } from './FormattingToolbar';
import { BlockActions } from './BlockActions';
import { BoardEmbedExtension } from './BoardEmbed';
import { ExcalidrawExtension } from './ExcalidrawEmbed';
import { PageLinkExtension, PageLinkMenu } from './PageLink';

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
  const [pageLinkMenuOpen, setPageLinkMenuOpen] = useState(false);
  const [pageLinkMenuPosition, setPageLinkMenuPosition] = useState({ top: 0, left: 0 });
  const [pageLinkFilter, setPageLinkFilter] = useState('');
  const [pageLinkStartPos, setPageLinkStartPos] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-notion-accent underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      BoardEmbedExtension,
      ExcalidrawExtension,
      PageLinkExtension,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-100 px-3 py-2 text-left font-medium',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-3 py-2',
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
      
      const { from } = editor.state.selection;
      const textBefore2 = editor.state.doc.textBetween(
        Math.max(0, from - 2),
        from,
        '\n'
      );
      
      // Check for [[ page link trigger
      if (textBefore2 === '[[') {
        const coords = editor.view.coordsAtPos(from);
        setPageLinkMenuPosition({
          top: coords.bottom + 5,
          left: coords.left,
        });
        setPageLinkMenuOpen(true);
        setPageLinkFilter('');
        setPageLinkStartPos(from - 2);
      } else if (pageLinkMenuOpen) {
        // Check if we're still in a page link context
        const fullTextBefore = editor.state.doc.textBetween(
          Math.max(0, from - 50),
          from,
          '\n'
        );
        const bracketIndex = fullTextBefore.lastIndexOf('[[');
        if (bracketIndex === -1 || fullTextBefore.includes(']]')) {
          setPageLinkMenuOpen(false);
          setPageLinkFilter('');
        } else {
          const filterText = fullTextBefore.slice(bracketIndex + 2);
          setPageLinkFilter(filterText);
        }
      }
      
      // Check for slash command trigger
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 1),
        from,
        '\n'
      );
      
      if (textBefore === '/' && !pageLinkMenuOpen) {
        const coords = editor.view.coordsAtPos(from);
        setSlashMenuPosition({
          top: coords.bottom + 5,
          left: coords.left,
        });
        setSlashMenuOpen(true);
        setSlashFilter('');
      } else if (slashMenuOpen) {
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
      <BlockActions editor={editor} currentPageId={pageId} />
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
      <PageLinkMenu
        isOpen={pageLinkMenuOpen}
        onClose={() => {
          setPageLinkMenuOpen(false);
          setPageLinkFilter('');
        }}
        onSelect={(selectedPageId, selectedPageTitle) => {
          // Delete the [[ and any filter text, then insert the page link
          const { from } = editor.state.selection;
          const deleteFrom = pageLinkStartPos;
          editor
            .chain()
            .focus()
            .deleteRange({ from: deleteFrom, to: from })
            .insertContent({
              type: 'pageLink',
              attrs: { pageId: selectedPageId, pageTitle: selectedPageTitle },
            })
            .run();
          setPageLinkMenuOpen(false);
          setPageLinkFilter('');
        }}
        position={pageLinkMenuPosition}
        filter={pageLinkFilter}
      />
    </div>
  );
}
