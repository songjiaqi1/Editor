import { CustomEditor } from '../../custom/custom';
import { Node } from 'slate';
import generateBlockquote from '../../element-model/blockquote';
import getEventTransfer from '../../custom/get-event-transfer';
import { htmlDeserializer } from '../../../utils/deserialize-html';
import { normailizeSelection } from '../selection-utils';

class BlockquoteUtils {
  
  constructor(editor) {
    this.editor = editor;
  }

  getCurrentBlockquote = () => {
    const block = CustomEditor.match(this.editor, this.editor.selection.anchor, 'block');
    const blockPath = block[1];
    const parent = Node.parent(this.editor, blockPath);
    if (parent && parent.type === 'blockquote') {
      return parent;
    }
    return null;
  }

  isInBlockquote = () => {
    return Boolean(this.getCurrentBlockquote());
  }

  wrapBlockquote = () => {
    normailizeSelection(this.editor);
    const selection = this.editor.selection;
    const currentPath = CustomEditor.path(this.editor, selection);
    const outestElementAtPath = this.editor.children[currentPath[0]];
    const blockquote = generateBlockquote({children: [outestElementAtPath]});
    CustomEditor.wrapNodes(this.editor, blockquote);
  }

  unwrapBlockquote = () => {
    normailizeSelection(this.editor);
    CustomEditor.unwrapNodes(this.editor, {split: true, match: {type: 'blockquote'}});
  }

  pasteContentInBlockquote = (command) => {
    const data = command.data;
    let { fragment, text, type, html } = getEventTransfer(data);
    if (type === 'text') {
      const textArray = text.split(/\r\n|\n/g);
      textArray.forEach((text, index) => {
        if (index === 0) {
          CustomEditor.insertText(this.editor, text);
        } else {
          CustomEditor.insertNodes(this.editor, {type: 'paragraph', children: [{text}]});
        }
      });
      return;
    }

    if (type === 'html') {
      fragment = htmlDeserializer(html);
    }

    const block = CustomEditor.match(this.editor, this.editor.selection, 'block');
    if (Node.text(block[0]).length === 0) {
      CustomEditor.removeNodes(this.editor, {match: 'block'});
    }

    CustomEditor.insertNodes(this.editor, fragment);
    return;
  }
}

export default BlockquoteUtils;