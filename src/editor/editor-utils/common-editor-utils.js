import React from 'react';
import Prism from 'prismjs';
import MarkUtils from './mark-utils';
import BlockElementUtils from './block-element-utils';
import InlineElementUtils from './inline-element-utils';
import ListUtils from '../editor-utils/block-element-utils/list-utils';
import TableUtils from '../editor-utils/block-element-utils/table-utils';
import CodeUtils from '../editor-utils/block-element-utils/code-utils';
import FormulaUtils from '../editor-utils/block-element-utils/formula-utils';
import BlockquoteUtils from '../editor-utils/block-element-utils/blockquote-utils';
import Link from '../editor-component/link';
import Image from '../editor-component/image';
import CheckListItem from '../editor-component/check-list-item';
import CodeBlock from '../editor-component/code-block';
import Formula from '../editor-component/formula';
import TableContainer from '../editor-component/table';
import { useSelected } from 'sjq1-slate-react';
import { Node, Path } from 'slate';

function WithSelectedState (props) {
  const isSelected = useSelected();
  const SlateNode = props.SlateNode;
  return <SlateNode editor={props.editor} attributes = {props.attributes} children={props.children} isSelected={isSelected} node={props.element} />;
}

function renderNode(props, editor) {
  const { attributes, children, element: node } =props;
  switch (node.type) {
  case 'paragraph':
    return <p {...attributes}>{children}</p>;
  case 'header_one':
    return <h1 {...attributes} id={'user-content-' + node.children[0].text}>{children}</h1>;
  case 'header_two':
    return <h2 {...attributes} id={'user-content-' + node.children[0].text}>{children}</h2>;
  case 'header_three':
    return <h3 {...attributes} id={'user-content-' + node.children[0].text}>{children}</h3>;
  case 'header_four':
    return <h4 {...attributes}>{children}</h4>;
  case 'header_five':
    return <h5 {...attributes}>{children}</h5>;
  case 'header_six':
    return <h6 {...attributes}>{children}</h6>;
  case 'link':
    return <Link attributes={attributes} children={children} node={node}/>;
  case 'image':
    return <WithSelectedState {...props} SlateNode={Image}/>;
  case 'blockquote':
    return <blockquote {...attributes}>{children}</blockquote>;
  case 'list_item':
    var checked = node.data.checked;
    if (checked === undefined)
      return <li {...attributes}>{children}</li>;
    return (
      <CheckListItem editor={editor} {...props} />
    );
  case 'code_block':
    return <WithSelectedState {...props} editor={editor} SlateNode={CodeBlock}/>;
  case 'code_line':
    return <p {...attributes}>{children}</p>;
  case 'unordered_list':
    return <ul {...attributes}>{children}</ul>;
  case 'ordered_list':
    return <ol {...attributes}>{children}</ol>; 
  case 'table':
    return (
      <TableContainer editor={editor} {...props} />
    );
  case 'table_row':
    return <tr {...attributes}>{children}</tr>;
  case 'table_cell':
    let align = node.data.align;
    align = ['left', 'right', 'center'].find((item) => item === align)
      ? align : 'left';
    return (
      <td style={{ textAlign: align }} {...attributes}>
        {children}
      </td>
    );  
  case 'formula':
    return (
      <WithSelectedState {...props} editor={editor} SlateNode={Formula} />
    );
  default : 
    return (
      <p  {...attributes}>{children}</p>
    );
  }
}

const renderLeaf = ({ attributes, children, leaf }) => {

  let markedChildren = React.cloneElement(children);

  if (leaf.BOLD) {
    markedChildren = <strong>{markedChildren}</strong>;
  }

  if (leaf.CODE) {
    markedChildren = <code>{markedChildren}</code>;
  }

  if (leaf.ITALIC) {
    markedChildren = <i>{markedChildren}</i>;
  }

  if (leaf.DELETE) {
    markedChildren = <del>{markedChildren}</del>;
  }

  if (leaf.ADD) {
    markedChildren = <ins>{markedChildren}</ins>;
  }

  if (leaf.decoration) {
    markedChildren = <span className={`token ${leaf.type}`}>{markedChildren}</span>;
  }

  return <span {...attributes}>{markedChildren}</span>;
};

const decorationNode = ([node, path]) => {  

  if (node.type !== 'code_block') return [];
  let languageType = node.data.syntax;
  if (languageType === 'none') return [];

  const grammer = Prism.languages[languageType];
  const codeLines = node.children;
  if (!grammer) {
    return [];
  }
  const blockText = codeLines.map(codeLine => codeLine.children[0].text).join('\n');
  const tokens = Prism.tokenize(blockText, grammer);
  const decorations = [];
  let textLine = 0;
  let offset = 0;
  for (let token of tokens) {
    if (typeof token === 'string' && token.indexOf('\n') >= 0) {
      //the varialble enterNum is the num of \n in the token
      // get the number of \n buy split the token by '\n'
      let newlineTokens = token.split('\n');
      let enterNum = newlineTokens.length - 1;
      // get the next code_line which the content of is is not ' ' or null;
      textLine += enterNum;
      // get the initial offset of the code_line
      offset = newlineTokens.pop().length;
      continue;
    }
    if (typeof token === 'string') {
      const textPath = path.slice(); 
      textPath.push(textLine, 0);
      const decoration ={
        anchor: {
          path: textPath,
          offset: offset
        },
        focus: {
          path: textPath,
          offset: offset + token.length
        },
        type: 'text',
      };
      decorations.push(decoration);
      offset += token.length;
    } else if (typeof token.content === 'string') {
      const textPath = path.slice(); 
      textPath.push(textLine, 0);
      const decoration = {
        anchor: {
          path: textPath,
          offset: offset
        },
        focus: {
          path: textPath,
          offset: offset + token.content.length
        },
        decoration: true,
        type: token.type
      };
      decorations.push(decoration);
      offset += token.content.length;
    }
  }

  return decorations;
};

class EditorUtils {

  constructor(editor) {
    this.editor = editor;
    this.markUtils = new MarkUtils(editor);
    this.blockElementUtils = new BlockElementUtils(editor);
    this.inlineElementUtils = new InlineElementUtils(editor);
    this.listUtils = new ListUtils(editor);
    this.tableUtils = new TableUtils(editor);
    this.codeUtils = new CodeUtils(editor);
    this.blockquoteUtils = new BlockquoteUtils(editor);
    this.formulaUtils = new FormulaUtils(editor);
  }

  onClickMark = (event, type) => {
    event.preventDefault();
    this.markUtils.setMark(type);
  }
  
  onClickHeader = (event, type) => {
    event.preventDefault();
    this.editor.exec({type: 'set_header', headerType: type});
  }

  onClickBlock = (event, type) => {
    event.preventDefault();
    if(!this.blockElementUtils.isBlockActive(type)) {
      this.editor.exec({type: `set_${type}`});
    } else {
      this.editor.exec({type: `unwrap_${type}`});
    }
  }

  onClickBlock = (event, type) => {
    event.preventDefault();
    if (type === 'blockquote') {
      if (this.blockquoteUtils.isInBlockquote()) {
        this.editor.exec({type: 'unwrap_blockquote'});
      } else {
        this.editor.exec({type: 'set_blockquote'});
      }
    }

    if (type === 'code_block') {
      if (this.codeUtils.isInCodeBlock()) {
        this.editor.exec({type: 'unwrap_code_block'});
      } else {
        this.editor.exec({type: 'set_code_block'});
      }
    }

    if (type === 'ordered_list' || type === 'unordered_list') {
      if (this.listUtils.isInlist()) {
        const items = this.listUtils.getCurrentListItem();
        const item = items[0];
        const currentList = Node.parent(this.editor, item[1]);
        if (currentList.type === type) {
          if (typeof item[0].data.checked === 'boolean') {
            this.editor.exec({type: 'unwrap_check_list_item'});
            return;
          }
          this.editor.exec({type: `unwrap_${currentList.type}`});
        } else {
          const currentListPath = Path.parent(item[1]);
          const listAncesstor = Node.get(this.editor, Path.parent(currentListPath));
          // modify the sublist to different types
          if (listAncesstor.type && listAncesstor.type.includes('list')) {
            this.editor.exec({type: `modify_sublist_type`, target_list_type: type});
            return;
          }
          this.editor.exec({type: `unwrap_${currentList.type}`});
          this.editor.exec({type: `set_${type}`});
        }
      } else {
        this.editor.exec({type: `set_${type}`});
      }
    }
  }

  clearFormat = (event) => {
    event.preventDefault();
    this.editor.exec({type: 'clear_format'});
  }

  unwrapLink = () => {
    this.inlineElementUtils.unwrapLink();
  }

  isLinkActive = () => {
    return this.inlineElementUtils.isLinkActive();
  }

  getLinkText = (linkNode) => {
    return this.inlineElementUtils.getLinkText(linkNode);
  }

  insertLink = (elementData) => {
    return this.inlineElementUtils.insertLink(elementData);
  }

  setLink = (elementData) => {
    return this.inlineElementUtils.setLink(elementData);
  }

  getSelectedText = () => {

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    return range.toString();
  }

  insertImage = (data) => {
    this.inlineElementUtils.insertImage(data);
  }

  getCurrentLinkNode = () => {
    return this.inlineElementUtils.getCurrentLinkNode();
  }

  onToggleCheckItem = (event) => {
    event.preventDefault();
    if (this.listUtils.isInlist()) {
      const items = this.listUtils.getCurrentListItem();
      const item = items[0];
      if (typeof item[0].data.checked === 'boolean') {
        this.editor.exec({type: 'unwrap_check_list_item'});
        return;
      }
    }
    
    this.editor.exec({type: 'wrap_check_list_item'});
  }

  onAddTable = (event, rowCount, columnCount) => {
    event.preventDefault();
    this.editor.exec({type: 'insert_table', data: {rowCount, columnCount}});
  }

  onAddFormula = (data) => {
    this.editor.exec({type: 'insert_formula', data});
  }

  setFormula = (data) => {
    this.editor.exec({type: 'set_formula', data});
  }

  onRemoveTable = (event) => {
    event.preventDefault();
    this.editor.exec({type: 'remove_table'});
  }

  onInsertColumn = (event) => {
    event.preventDefault();
    this.editor.exec({type: 'insert_column'});
  }

  onRemoveColumn = (event) => {
    event.preventDefault();
    this.editor.exec({type: 'remove_column'});
  }

  onInsertRow = (event) => {
    event.preventDefault();
    this.editor.exec({type: 'insert_row'});
  }

  onRemoveRow = (event) => {
    event.preventDefault();
    this.editor.exec({type: 'remove_row'});
  }

  onSetAlign = (event, align) => {
    event.preventDefault();
    this.editor.exec({type: 'set_table_cell_align', align});
  }

  adjustImageSize = (options) => {
    return this.inineElementUtils.adjustImageSize(options);
  }

  // set is Active of each button
  getToolbarStatus() {
    const { selection } = this.editor;
    let toolbarStatus = {
      headerType: 'paragraph'
    };
    if (!selection) return toolbarStatus;

    const activeHeader = this.blockElementUtils.getActiveHeader([{type: 'paragraph'}, {type: 'header_one'}, {type: 'header_two'}, {type: 'header_three'}, {type: 'header_four'}, {type: 'header_five'}, {type: 'header_six'}]);
    const isLinkActive = this.isLinkActive();
    const isBlockquoteActive = this.blockquoteUtils.isInBlockquote();
    const isCodeActive = this.codeUtils.isInCodeBlock();
    const isTableActive = this.tableUtils.isInTable();
    const block = activeHeader[0];
    const activeMarks = this.markUtils.getActiveMarks();
    let isCheckListActive = false;
    let isOrderedListActive = false;
    let isUnorderedListActive = false;
    const isSelectedInList = this.listUtils.isInlist();
    if (isSelectedInList) {
      const items = this.listUtils.getCurrentListItem();
      const item = items[0];
      if (item[0].data && typeof item[0].data.checked === 'boolean') {
        isCheckListActive = true;
        isUnorderedListActive = false;
      } else {
        const currentList = Node.parent(this.editor, item[1]);
        const listType = currentList.type;
        if (listType === 'unordered_list') {
          isUnorderedListActive = true;
        } else {
          isOrderedListActive = true;
        }
      }
    }
    
    toolbarStatus = {
      headerType: block.type,
      isBoldActive: activeMarks.BOLD,
      isItalicActive: activeMarks.ITALIC,
      isInlineCodeActive: activeMarks.CODE,
      isLinkActive: isLinkActive,
      isBlockquoteActive: isBlockquoteActive,
      isOrderedListActive: isOrderedListActive,
      isUnorderedListActive: isUnorderedListActive,
      isCheckListActive,
      isCodeActive,
      isTableActive
    };

    let isFormulaActive = false;
    if (window.canInsertFormula) {
      isFormulaActive = this.formulaUtils.isFormulaActive();
      toolbarStatus.isFormulaActive = isFormulaActive;
    }
  
    return toolbarStatus;
  }
}

export { renderNode, renderLeaf, EditorUtils, decorationNode };