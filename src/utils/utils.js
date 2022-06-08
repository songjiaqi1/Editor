import { Node, Text } from 'slate';

export const isEmptyParagraph = (node) => {

  if (node.type !== 'paragraph') return false;

  if (node.children.length === 1 && Text.isText(node.children[0]) && Node.text(node).length === 0) {
    return true;
  }

  return false;
};