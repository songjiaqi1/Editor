import isHotKey from 'is-hotkey';
import { Range, Editor, Path, Node } from 'slate';
import ListUtils from './editor-utils/block-element-utils/list-utils';
import CodeUtils from './editor-utils/block-element-utils/code-utils';
import TableUtils from './editor-utils/block-element-utils/table-utils';
import setEventTransfer from './custom/set-event-transfer';
import { CustomEditor } from '../editor/custom/custom';

class Plugin {

  constructor(editor) {
    this.editor = editor;
    console.log(this.editor.onSave);
    this.listUtils = new ListUtils(editor);
    this.codeUtils = new CodeUtils(editor);
    this.tableUtils = new TableUtils(editor);
    this.onSave = editor.onSave;
  }

  onKeyDown = (event) => {
    if (event.nativeEvent.keyCode === 13) {
      event.preventDefault();
      if (isHotKey('shift+enter', event)) {
        if (this.listUtils.isInlist()) {
          this.editor.exec({type: 'split_list_item'});
        }
      } else if (isHotKey('mod+enter', event)) {
        if (this.codeUtils.isInCodeBlock()) {
          this.editor.exec({type: 'exit_code_block'});
        }
  
        if (this.tableUtils.isInTable()) {
          this.editor.exec({type: 'exit_table'});
        }
      } else {
        this.editor.exec({type: 'insert_break'});
      }
    }

    if (isHotKey('shift+tab', event)) {
      event.preventDefault();
      if (this.listUtils.isInlist()) {
        const [listNode] = Editor.nodes(this.editor, {match: [{type: 'unordered_list'}, {type: 'ordered_list'}], at: this.editor.selection, mode:'highest'});
        if (!listNode) return;
        const type = listNode[0].type;
        this.editor.exec({type: `unwrap_${type}`});
      }

      if (this.tableUtils.isInTable()) {
        this.editor.exec({type: 'focus_previous_table_cell'});
      }
    }

    if (isHotKey('mod+s', event)) {
      event.preventDefault();
      this.editor.onSave && this.editor.onSave();
    }

    if (isHotKey('tab', event) && Range.isCollapsed(this.editor.selection)) {
      event.preventDefault();
      if (this.codeUtils.isInCodeBlock()) {
        this.editor.exec({type: 'increase_code_block_indent'});
      }

      if (this.listUtils.isInlist()) {
        this.editor.exec({type: 'increase_list_item_depth'});
      }

      if (this.tableUtils.isInTable()) {
        this.editor.exec({type: 'focus_next_table_cell'});
      }
    }

    if (isHotKey('mod+b', event)) {
      event.preventDefault();
      if (!this.codeUtils.isInCodeBlock()) {
        this.editor.exec(  {type: 'format_text', properties: {BOLD: true}});
      }
    }

    if (isHotKey('mod+i', event)) {
      event.preventDefault();
      if (!this.codeUtils.isInCodeBlock()) {
        this.editor.exec(  {type: 'format_text', properties: {ITALIC: true}});
      }
    }

    if (isHotKey('mod+/', event)) {
      event.preventDefault();
      if (!this.codeUtils.isInCodeBlock()) {
        this.editor.exec(  {type: 'format_text', properties: {CODE: true}});
      }
    }

    if (isHotKey('mod+4', { byKey: true })(event)) {
      event.preventDefault();
      window.richMarkdownEditor.onToggleFormulaDialog();
      return;
    }

    // compate chrome: in chrome press backspace would not exec delete_backward command
    if (isHotKey('backspace', event)) {
      const voidNode = CustomEditor.match(this.editor, this.editor.selection, 'void');
      if (voidNode && (voidNode[0].type === 'image' || voidNode[0].type === 'formula')) {
        event.preventDefault();
        this.editor.exec({ type: 'delete_backward', unit: 'character' });
        return;
      }
    }

    if (isHotKey('mod+a', event)) {
      if (this.codeUtils.isInCodeBlock()) {
        const anchorPoint = this.editor.selection.anchor;
        const focusPoint = this.editor.selection.focus;
        const anchorCodeBlock = Editor.match(this.editor, anchorPoint, { type: 'code_block' });
        const focusCodeBlock = Editor.match(this.editor, focusPoint, { type: 'code_block' });
        if (anchorCodeBlock && focusCodeBlock && Path.equals(focusCodeBlock[1], anchorCodeBlock[1])) {
          event.preventDefault();
          Editor.select(this.editor, focusCodeBlock[1]);
          return;
        }
      }
    }
  };

  onCut = (event, editor) => {
    const image = CustomEditor.match(this.editor, this.editor.selection, { type: 'image' });
    if (image) {
      // write the image element to clipboard
      setEventTransfer(event, 'fragment', [{type: 'paragraph', children: [image[0]]}]);
      // remove the image element when cut an image due to slate did not has the action when cut a image
      this.editor.exec({type: 'delete_backward', unit: 'character'});
      return;
    }
  }

  onCopy = (event, editor) => {
    if (this.tableUtils.isInTable()) {
      event.preventDefault();
      const table = this.tableUtils.getSelectedTableCells();
      if (table) {
        setEventTransfer(event, 'fragment', table);
        return;
      }
    }

    if (editor.selection && !Range.isCollapsed(editor.selection)) {
      // get block deepest block node. 
      // for example: code line in a code block, paragraph in a list
      const blockList = Editor.nodes(editor, {at: editor.selection, match: 'block'});
      if (blockList) {
        const nodeList = Array.from(blockList);
        /**
         * if only one block element selected, write the selected content as paragraph or text to clipboard
         * instead of use slate default behavior which write the outest element to clipboard
        */
        if (nodeList.length === 1) {
          event.preventDefault();
          let [node, path] = nodeList[0];
          path = path.slice(1);
          if (node && node.type === 'paragraph') {
            // get selected paragraph node in selection and write to clipboard
            const fragment = Node.fragment(editor, editor.selection);
            const selectedNode = Node.get(fragment[0], Array(path.length).fill(0));
            setEventTransfer(event, 'fragment', [selectedNode]);
          } else {
            setEventTransfer(event, 'text', CustomEditor.text(editor, editor.selection));
          }
          return;
        }
      }
    }
  }
}

export default Plugin;