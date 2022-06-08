import { CustomEditor } from '../custom/custom';
import { Node, Text, Path } from 'slate'; 

const normalizeNode = (editor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = ([node, path]) => {
    // if current node is a list node
    const type = node.type;
    // wrap the outest list item into unoreded list
    if (path.length === 1 && (type === 'list_item')) {
      CustomEditor.wrapNodes(editor, {type: 'unordered_list', children: [node]}, { at: path});
    }

    if (type === 'ordered_list' || type === 'unordered_list') {
      const currentNodeIndex = path.slice(-1)[0];
      let previousSibling;
      if (currentNodeIndex !== 0) {
        previousSibling = Node.get(editor, Path.previous(path));
      }
      if (previousSibling && previousSibling.type === type) {
        // merge previous same type list node
        CustomEditor.mergeNodes(editor, {at: path});
      }
      const parentNode = Node.parent(editor, path);
      const nextIndex = currentNodeIndex + 1;
      let nextSiblings = parentNode.children[nextIndex];
      if (nextSiblings && nextSiblings.type === type) {
        // merge next same type list node
        CustomEditor.mergeNodes(editor, {at: Path.next(path)});
      }
    }

    // trailing a paragrph at the end of the document
    if (path.length === 1 && path[0] === editor.children.length - 1) {
      if (node.type !== 'paragraph' || !CustomEditor.isEmptyParagraph(node)) {
        CustomEditor.insertNodes(editor, {type: 'paragraph', children: [{text: ''}]}, {at: [path[0] + 1]});
      }
    }

    if (type === 'blockquote') {
      node.children.forEach((child, index) => {
        const childPath = [...path, index];
        if (child.type === 'blockquote') {
          CustomEditor.unwrapNodes(editor, { at: childPath });
        }
      });
    }

    // remove empty link
    if (type === 'link') {
      if (Node.text(node) === '' && node.children.length > 0)  {
        CustomEditor.removeNodes(editor, { at: path });
      }
    }

    // remove mark when the text node is empty
    if (Text.isText(node) && node.text.length === 0) {
      if (Object.keys(node).length > 1) {
        CustomEditor.setNodes(editor, {CODE: false, BOLD: false, ITALIC: false}, {at: path});
      }
    }
    
    return normalizeNode([node, path]);
  };

  return editor;
};

export default normalizeNode;