import { Editor, BubbleMenu } from '@tiptap/react';

interface FormattingToolbarProps {
  editor: Editor;
}

export function FormattingToolbar({ editor }: FormattingToolbarProps) {
  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-1 bg-white border border-notion-border rounded-lg shadow-lg p-1"
    >
      {/* Text/Paragraph */}
      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover ${
          editor.isActive('paragraph') && !editor.isActive('heading') ? 'bg-notion-bg-hover font-semibold' : ''
        }`}
        title="Normal text"
      >
        Text
      </button>

      {/* Heading 1 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover ${
          editor.isActive('heading', { level: 1 }) ? 'bg-notion-bg-hover font-semibold' : ''
        }`}
        title="Heading 1"
      >
        H1
      </button>

      {/* Heading 2 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover ${
          editor.isActive('heading', { level: 2 }) ? 'bg-notion-bg-hover font-semibold' : ''
        }`}
        title="Heading 2"
      >
        H2
      </button>

      {/* Heading 3 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover ${
          editor.isActive('heading', { level: 3 }) ? 'bg-notion-bg-hover font-semibold' : ''
        }`}
        title="Heading 3"
      >
        H3
      </button>

      <div className="w-px h-5 bg-notion-border mx-1" />

      {/* Bold */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover font-bold ${
          editor.isActive('bold') ? 'bg-notion-bg-hover' : ''
        }`}
        title="Bold (Cmd+B)"
      >
        B
      </button>

      {/* Italic */}
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover italic ${
          editor.isActive('italic') ? 'bg-notion-bg-hover' : ''
        }`}
        title="Italic (Cmd+I)"
      >
        I
      </button>

      {/* Strikethrough */}
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover line-through ${
          editor.isActive('strike') ? 'bg-notion-bg-hover' : ''
        }`}
        title="Strikethrough"
      >
        S
      </button>

      {/* Code */}
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover font-mono ${
          editor.isActive('code') ? 'bg-notion-bg-hover' : ''
        }`}
        title="Inline code"
      >
        {'</>'}
      </button>

      <div className="w-px h-5 bg-notion-border mx-1" />

      {/* Bullet List */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover ${
          editor.isActive('bulletList') ? 'bg-notion-bg-hover' : ''
        }`}
        title="Bullet list"
      >
        •
      </button>

      {/* Numbered List */}
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover ${
          editor.isActive('orderedList') ? 'bg-notion-bg-hover' : ''
        }`}
        title="Numbered list"
      >
        1.
      </button>

      {/* Quote */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-notion-bg-hover ${
          editor.isActive('blockquote') ? 'bg-notion-bg-hover' : ''
        }`}
        title="Quote"
      >
        "
      </button>
    </BubbleMenu>
  );
}
