import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { EmbeddedBoard } from '../database/EmbeddedBoard';

// React component for the node view
function BoardEmbedComponent({ node }: NodeViewProps) {
  const databaseId = node.attrs.databaseId;

  if (!databaseId) {
    return (
      <NodeViewWrapper>
        <div className="border border-dashed border-notion-border rounded-lg p-4 my-4 text-center text-notion-text-secondary">
          No database selected
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <EmbeddedBoard databaseId={databaseId} />
    </NodeViewWrapper>
  );
}

// TipTap extension
export const BoardEmbedExtension = Node.create({
  name: 'boardEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      databaseId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-board-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-board-embed': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BoardEmbedComponent);
  },
});
