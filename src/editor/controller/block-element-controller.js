import { Editor, Path, Node } from 'slate';
import ListUtils from '../editor-utils/block-element-utils/list-utils';
import CodeUtils from '../editor-utils/block-element-utils/code-utils';
import { isRangeCollapsed } from '../editor-utils/range-utils';
import TableUtils from '../editor-utils/block-element-utils/table-utils';
import getEventTransfer from '../custom/get-event-transfer';
import BlockquoteUtils from '../editor-utils/block-element-utils/blockquote-utils';
import FormulaUtils from '../editor-utils/block-element-utils/formula-utils';
import { htmlDeserializer } from '../../utils/deserialize-html';
import generateLinkElement from '../element-model/link';
import generateImageElement from '../element-model/image';
import isUrl from 'is-url';
import { CustomEditor } from '../custom/custom';

const withBlock = (editor) => {
  const { exec } = editor;
  const listUtils = new ListUtils(editor);
  const codeUtils = new CodeUtils(editor);
  const tableUtils = new TableUtils(editor);
  const blockquoteUtils = new BlockquoteUtils(editor);
  const formulaUtils = new FormulaUtils(editor);

  editor.exec = (command) => {
    const data = command.data;
    const selection = editor.selection;
    switch (command.type) {
    case 'set_header':
      Editor.setNodes(editor, {type: command.headerType});
      break;
    
    case 'insert_data':
      const { fragment, type, html, text } = getEventTransfer(data);

      if (type === 'file') {
        exec(command);
        return;
      } 

      // insert a link if text content is a url
      if (isUrl(text) && !codeUtils.isInCodeBlock()) {
        if (text.endsWith('png') || text.endsWith('PNG') || text.endsWith('jpg') || text.endsWith('JPG') || text.endsWith('gif') || text.endsWith('GIF')) {
          const img = generateImageElement({data: {src: text}});
          Editor.insertNodes(editor, img);
          return;
        }
        CustomEditor.insertNodes(editor, [generateLinkElement({ data: { href: text }, children: [{ text }] }), {text: ' '}]);
        return;
      }

      try{
        if (tableUtils.isInTable()) {
          tableUtils.pasteContentInTable(command);
          return;
        }
  
        if (listUtils.isInlist()) {
          listUtils.pasteContentInList(command);
          return;
        }
  
        if (codeUtils.isInCodeBlock()) {
          codeUtils.pasteContentInCodeBlock(command);
          return;
        }
        
        if (blockquoteUtils.isInBlockquote()) {
          blockquoteUtils.pasteContentInBlockquote(command);
          return;
        }
      } catch(error) {
        Editor.insertText(editor, text);
      }
      
      if (type === 'fragment') {
        const [currentBlock, path] = Editor.match(editor, editor.selection, 'block');
        const firstFragmentNode = fragment[0];
        // if first fragment node is paragraph insert the content of it into previous sibling
        // and insert other node
        if (firstFragmentNode.type === 'paragraph') {
          Editor.insertFragment(editor, fragment);
          return;
        }

        /** 
         * if the first fragment element is a list, get normalized list items with function getNormalizedListItems and insert
         */ 
        if (firstFragmentNode.type.includes('_list')) {
          const listItems = listUtils.getNormalizedListItems(firstFragmentNode);
          const newFragment = fragment.slice(1);
          Editor.insertNodes(editor, [{type: firstFragmentNode.type, children: listItems}, ...newFragment]);
          if (CustomEditor.isEmptyParagraph(currentBlock)) {
            Editor.delete(editor, { at: path });
          }
          return;
        }

        // if current node is an empty paragraph, insert the fragment and
        // delete the empty paragraph
        if (CustomEditor.isEmptyParagraph(currentBlock)) {
          Editor.insertNodes(editor, fragment);
          Editor.delete(editor, { at: path });
          return;
        }
        // insert the fragment below the current selection node
        Editor.insertNodes(editor, fragment);
        return;
      }

      if (type === 'html') {
        try {
          const fragment = htmlDeserializer(html);
          Editor.insertFragment(editor, fragment);
        } catch (error) {
          let newText = text.replace(/\n|\r\n/g, ' ');
          Editor.insertText(editor, newText);
        }
        return;
      }

      // remove text line break and insert text
      if (type === 'text') {
        const textArray = text.split(/\r\n|\n/g);
        textArray.forEach((text, index) => {
          if (index === 0) {
            Editor.insertText(editor, text);
          } else {
            Editor.insertNodes(editor, {type: 'paragraph', children: [{text}]});
          }
        });
        return;
      }
      exec(command);
      break; 

    case 'set_blockquote':
      if (!selection) {
        return;
      }
      blockquoteUtils.wrapBlockquote();
      break;

    case 'unwrap_blockquote':
      blockquoteUtils.unwrapBlockquote();
      break;
    
    case 'set_ordered_list': 
      if (!selection) {
        return;
      }
      listUtils.wrapList('ordered_list');
      break;

    case 'set_unordered_list':
      if (!selection) {
        return;
      }
      listUtils.wrapList('unordered_list');
      break;
    
    case 'unwrap_unordered_list':
    case 'unwrap_ordered_list': 
      listUtils.unwrapList();
      break;

    case 'wrap_check_list_item':
      const listItem = listUtils.getCurrentListItem();
      
      if (listItem.length === 0) {
        // not in list, add list
        listUtils.wrapList('unordered_list');
        Editor.setNodes(editor, { data: { checked: false } }, { match: { type: 'list_item' } });
      } else {
        const listItems = Editor.nodes(editor, { at: editor.selection, match: { type: 'list_item' } });
        let nearestItem;
        for (let listItem of listItems) {
          nearestItem = listItem;
        }
        Editor.setNodes(editor, { data: { checked: false } }, { at: nearestItem[1] });
      }  
      break;

    case 'unwrap_check_list_item':
      const item = listUtils.getCurrentListItem();
      Editor.setNodes(editor, {data: {}}, {at: item[0][1]});
      break;
    case 'modify_sublist_type':
      const { target_list_type } = command;
      const items = listUtils.getCurrentListItem();
      const firstListItem = items.at(0);
      const currentListPath = Path.parent(firstListItem[1]);
      const parentPath = Path.parent(currentListPath);
      Editor.withoutNormalizing(editor, () => {
        for(let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          const path = item[1];
          Editor.liftNodes(editor, {at: path, split: true});
          const currentListIndex = currentListPath.at(-1);
          const currentListItemIndex = path.at(-1);
          Editor.wrapNodes(editor, {type: target_list_type, children: [] }, { at: [...parentPath, currentListItemIndex === 0 ? currentListIndex : currentListIndex + 1], split: true });
        }
      });
      break;
    case 'set_code_block':
      codeUtils.wrapCodeBlock();
      break;

    case 'unwrap_code_block':
      codeUtils.unwrapCodeBlock();
      break;  

    case 'exit_code_block':
      Editor.splitNodes(editor, { match: 'block', always: true });
      codeUtils.unwrapCodeBlock(true);
      break;
    
    case 'increase_code_block_indent':
      if (isRangeCollapsed(editor.selection)) {
        const block = Editor.match(editor, editor.selection, 'block');
        Editor.insertText(editor, '\t', {
          at: {
            anchor: {
              path: [...block[1], 0],
              offset: 0
            },
            focus: {
              path: [...block[1], 0],
              offset: 0
            }
          }
        });
      }
      break;
    case 'insert_table':
      tableUtils.insertTable(data);
      break;
    case 'remove_table':
      tableUtils.removeTable();
      break;    
    case 'insert_row':
      tableUtils.insertRow();
      break;  
    case 'insert_column':
      tableUtils.insertColumn();
      break;
    case 'remove_row':
      tableUtils.removeRow();
      break;
    case 'remove_column':
      tableUtils.removeColumn();
      break;  
    case 'set_table_cell_align':
      tableUtils.setAlign(command.align);
      break;
    case 'exit_table':
      tableUtils.exitTable();
      break;
    case 'focus_next_table_cell':
      tableUtils.focusNextTableCell();
      break;
    case 'focus_previous_table_cell':
      tableUtils.focusPreviousTableCell();
      break;
    case 'insert_formula':
      formulaUtils.insertFormula(command.data);
      break;
    case 'set_formula':
      formulaUtils.setFormula(command.data);
      break;
    default:
      exec(command);
      break;
    }
  };
  return editor;
};

export default withBlock;