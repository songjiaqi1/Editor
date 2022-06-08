import { Editor, Node, Range, Path } from 'slate';
import ListUtils from '../editor-utils/block-element-utils/list-utils';
import { isRangeCollapsed } from '../editor-utils/range-utils';
import { CustomEditor } from '../custom/custom';
import CodeUtils from '../editor-utils/block-element-utils/code-utils';
import TextUtils from '../editor-utils/text-utils';
import TableUtils from '../editor-utils/block-element-utils/table-utils';
import BlockquoteUtils from '../editor-utils/block-element-utils/blockquote-utils';
import { clearBlockFormat, clearMarkerFormat } from '../editor-utils/clear-format-utils';

const SHORTCUTS = {
  '1.': 'ordered_list',
  '*': 'unordered_list',
  '-': 'unordered_list',
  '>': 'blockquote',
  '#': 'header_one',
  '##': 'header_two',
  '###': 'header_three',
  '####': 'header_four',
  '#####': 'header_five',
  '######': 'header_six',
  '   ': 'code_block'
};

const withMarkdownShortcut = (editor) => {
  const { exec } = editor;
  const listUtils = new ListUtils(editor);
  const codeUtils = new CodeUtils(editor);
  const tableUtils = new TableUtils(editor);
  const textUtils = new TextUtils(editor);
  const blockquoteUtils = new BlockquoteUtils(editor);
  editor.exec = (command) => {
    const selection = editor.selection;
    switch (command.type) {
    case 'split_list_item': 
      Editor.splitNodes(editor, {match: 'block', always: true});
      break;

    case 'insert_break':
      if (!Range.isCollapsed(editor.selection)) {
        const node = Editor.node(editor, [editor.selection.anchor.path[0]]);
        if (node && node[0].type.includes('header')) {
          exec(command);
          Editor.setNodes(editor, { type: 'paragraph' });
          return;
        }
        // if the expand selection is in table delete the selected and insert a new row when press enter
        if (tableUtils.isInTable()) {
          Editor.collapse(editor, {edge: 'end'});
          tableUtils.insertRow();
          return;
        }
        exec(command);
        return;
      }

      const [link] = Editor.nodes(editor, { match: { type: 'link' } });

      // when selection is at the end of link, select the text node after the link
      // to prevent split a empty link node
      if (link) {
        const linkPath = link[1];
        if (Editor.isEnd(editor, editor.selection.anchor, linkPath)) {
          const nextPath = Path.next(linkPath);
          const point = {path: nextPath, offset: 0};
          Editor.select(editor,  point);
        }
      }

      // When a picture is selected, a blank line is inserted when press Enter
      const [image] = Editor.nodes(editor, { match: { type: 'image' } });
      if (image) {
        const imagePath = image[1].slice();
        let imageIndex = imagePath.pop();
        // insert new table row when selection is in table
        Editor.insertNodes(editor, {text: ''}, {at: [...imagePath, imageIndex + 1]});
        if (tableUtils.isInTable()) {
          tableUtils.insertRow();
          return;
        }
        exec(command);
        return;
      }
      // unwrap blockquote when press enter at an empty blockquote line;
      if (blockquoteUtils.isInBlockquote()) {
        const [block] = Editor.nodes(editor, {match: 'block'});
        if (Node.text(block[0]).length === 0) {
          Editor.unwrapNodes(editor, {match: {type: 'blockquote'}, split: true});
          return;
        }
      }
      // if press enter in a list unwrap the list or insert a new list item
      if (listUtils.isInlist()) {
        const node = CustomEditor.getNodesByTypeAtRange(editor, 'list_item');
        // unwrap list if the list item text is none
        if (Node.text(node[0]).length === 0) {  
          listUtils.unwrapList();
          return;
        }
        // insert a new list item
        if (isRangeCollapsed(editor.selection)) {
          CustomEditor.splitNodesAtPoint(editor, {at: editor.selection.anchor, match:{type: 'list_item'}, always: true});
          return;
        }
      }
      
      if (codeUtils.isInCodeBlock()) {
        codeUtils.splitCodeLine();
        return;
      }

      if (tableUtils.isInTable()) {
        tableUtils.insertRow();
        return;
      }

      const node = Editor.node(editor, [editor.selection.anchor.path[0]]);
      if (node && node[0].type.includes('header')) {
        const header = node[0];
        // get the offset of the selection
        const offset = editor.selection.anchor.offset;
        // split the header
        exec(command);
        // if the selection is at the end of the header
        // set the splited header sibling to paragraph 
        if (offset === (Node.text(header).length)) {
          Editor.setNodes(editor, { type: 'paragraph' });
        }
        return;
      }
      
      exec(command);
      break;

    case 'insert_text': 
      // set element by markdown shortcut;
      if (command.text === ' ' && isRangeCollapsed(selection)) {
        // if current selection is in table or code block exec default command
        if (tableUtils.isInTable() || codeUtils.isInCodeBlock()) {
          exec(command);
          return;
        }
        const { beforeText, range, block } = textUtils.getTextInfoBeforeSelection();
        const path = block[1];
        const type = SHORTCUTS[beforeText];
        // set block element by shortcut
        if (type) {
          Editor.select(editor, range);
          Editor.delete(editor);
          if (type === 'blockquote') {
            if (!blockquoteUtils.isInBlockquote()) {
              editor.exec({type: 'set_blockquote'});
            }
          }
          if (type.includes('header')) {
            // set the outest  paragraph into header 
            if (block[0].type === 'paragraph' && path.length === 1) {
              editor.exec({ type: 'set_header', headerType: type });
            }
          }
          if (type === 'ordered_list') {
            editor.exec({ type: 'set_ordered_list' });
          }
  
          if (type === 'unordered_list') {
            editor.exec({ type: 'set_unordered_list' });
          }
  
          if (type === 'code_block') {
            if (!codeUtils.isInCodeBlock()) {
              editor.exec({ type: 'set_code_block' });
              return;
            }
          }
          return;
        } else {
          // set text mark by shortcut
          textUtils.setTextMarkByShortCut(exec, command);
          return;
        }
      }
      
      if (command.text === '`' && isRangeCollapsed(editor.selection)) {
        const { beforeText, range } = textUtils.getTextInfoBeforeSelection();
        if (beforeText === '``' && !codeUtils.isInCodeBlock()) {
          Editor.select(editor, range);
          Editor.delete(editor);
          editor.exec({ type: 'set_code_block' });
          return;
        }
      }
      exec(command);
      break;

    case 'increase_list_item_depth':
      listUtils.increaseListDepth();
      break;

    case 'delete_backward':
      const { anchor } = selection;
      if (anchor.offset === 0 && isRangeCollapsed(selection)) {
        const [match] = Editor.nodes(editor, {match: 'block'});
        const block = match[0];
        // set header to paragraph when delete at the start of header
        if (block.type.includes('header')) {
          editor.exec({type: 'set_header', headerType: 'paragraph'});
          return;
        }

        /**
         * If the anchor offset is 0 but not focus the head of the block node such as
         * an image is selected, the editor shoud delete the image first instead of
         * execute the delete operation of list or code_block or table
         */
        if (block.children.length > 1) {
          const blockDepth = match[1].length - 1;
          const inlineIndex = anchor.path[blockDepth + 1];
          // If the inline node is the first child of the block, execute default command
          if (inlineIndex !== 0) {
            exec(command);
            return;
          }
        }
        
        if (blockquoteUtils.isInBlockquote()) {
          editor.exec({type: 'unwrap_blockquote'});
          return;
        }
        if (listUtils.isInlist()) {
          const [node] = Editor.nodes(editor, {match: [{type: 'list_item'}]});
          const listItemPath = node[1];
          // Unwrap the list item when the selection is at the first list item
          if (listItemPath.at(-1) === 0 && anchor.path[listItemPath.length] === 0) {
            listUtils.unwrapList();
            return;
          }
          
          // List items with mutiple chidren
          const currentChildBlockIndex = anchor.path[anchor.path.length - 2];
          let currentListItem;
          for(let i = anchor.path.length - 1; i > 0; i--) {
            const node = Node.get(editor, anchor.path.slice(0, i));
            if (node.type ==='list_item') {
              currentListItem = node;
              break;
            }
          }
          if (currentChildBlockIndex === 0 && currentListItem.children.length > 1) {
            Editor.withoutNormalizing(editor, (editor) => {
              listUtils.unwrapList();
              exec(command);
            });
            return;
          }
        }
        if (codeUtils.isInCodeBlock()) {
          const node = Editor.match(editor, editor.selection, {type: 'code_block'});
          const codeBlock = node[0];
          const children = codeBlock.children;
          const text = Node.text(codeBlock);
          if (text.length === 0 && children.length === 1) {
            editor.exec({type: 'unwrap_code_block'});
            return;
          }
        }

        if (tableUtils.isInTable()) {
          const block = Editor.match(editor, editor.selection, 'block');
          const blockPath = block[1];
          const blockNode = block[0];
          const start = Editor.start(editor, blockPath);
          const offset = start.offset;
          
          if (offset === 0 && blockNode.children.length === 1) {
            return;
          }
        }
      } 
      exec(command);
      break;
    case 'delete_fragment':
      let [, end] = Range.edges(editor.selection);
      const voids = Editor.match(editor, end.path, 'void');
      const endVoid = voids ? voids : null;
      // do not unhange selection when end point is a void node when delete fragment,
      Editor.delete(editor, { hanging: endVoid ? true : false }); 
      return;
    case 'clear_format':
      clearBlockFormat(editor);
      clearMarkerFormat(editor);
      return;
    default:
      exec(command);  
    }
  };
  return editor;
};


export default withMarkdownShortcut;