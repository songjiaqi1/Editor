import { CustomEditor } from '../../custom/custom';
import { Node } from 'slate';
import detectIndent from 'detect-indent';
import getEventTransfer from '../../custom/get-event-transfer';
import { normailizeSelection } from '../selection-utils';

class CodeUtils {
  
  constructor(editor) {
    this.editor = editor;
  }  

  isInCodeBlock = () => {
    const block = CustomEditor.match(this.editor, this.editor.selection.anchor, 'block');
    const blockParent = Node.parent(this.editor, block[1]);
    if (blockParent.type === 'code_block') return true;
    return false;
  }

  pasteContentInCodeBlock(command) {
    const data = command.data;
    let { text, fragment, type } = getEventTransfer(data);

    if (text.length === 0) return;

    if (type === 'text' || type === 'html') {
      const codeLineFragment = text.split(/\r\n|\n/).map((textLine) => {
        return {type: 'code_line', children: [{text: textLine}]};
      });
      CustomEditor.insertFragment(this.editor, codeLineFragment);
      return;
    }

    fragment.map((node, index) => {
      if (node.type === 'code_block') {
        node.children.forEach((codeLine, index1) => {
          if (index1 === 0) {
            CustomEditor.insertText(this.editor, Node.text(codeLine));
            return;
          }
          CustomEditor.insertNodes(this.editor, codeLine);
        });
        return true;
      }
      if (index === 0) {
        CustomEditor.insertText(this.editor, Node.text(node));
      } else {
        CustomEditor.insertNodes(this.editor, {type: 'code_line', children: [{text: Node.text(node)}]});
      }
      return true;
    });
  }

  getIndent = (text) => {
    return detectIndent(text).indent;
  }

  insertIndent = (indent) => {
    CustomEditor.insertText(this.editor, indent, {at: this.editor.selection});
  }

  wrapCodeBlock = () => {
    normailizeSelection(this.editor);
    CustomEditor.setNodes(this.editor, {type: 'code_line'}, {match: 'block', at: this.editor.selection});
    CustomEditor.wrapNodes(this.editor, {type: 'code_block', children: [], data: {}});
    CustomEditor.collapse(this.editor, {edge: 'end'});
  }

  splitCodeLine = () => {
    const block = CustomEditor.match(this.editor, this.editor.selection, 'block');
    const indent = this.getIndent(Node.text(block[0]));
    CustomEditor.splitNodes(this.editor, {split: true, always: true, at: this.editor.selection});
    this.insertIndent(indent);
  }

  /**
   * Todo: unwrap code block
   * split: Is split the code block at selection when unwrap node
   * split = true: Unwrap current code line from code block
   * split = false: Unwrap whole code block
   */
  unwrapCodeBlock = (split = false) => {
    const codeBlock = CustomEditor.match(this.editor, this.editor.selection, {type: 'code_block'});
    const codeBlockPath = codeBlock[1];
    
    // unwrap whole code block 
    if (!split) {
      codeBlock[0].children.forEach((codeLine, index) => {
        const path = [...codeBlockPath, index];
        CustomEditor.setNodes(this.editor, {type: 'paragraph'}, {at: path});
      });
    } else {
      // unwrap a code line
      CustomEditor.setNodes(this.editor, {type: 'paragraph'}, {at: this.editor.selection, match: 'block'});
    }
    CustomEditor.unwrapNodesByTypeAtRange(this.editor, { at: this.editor.selection, split, match: { type: 'code_block' } } );
  }
}

export default CodeUtils;