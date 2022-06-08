import { CustomEditor } from '../../custom/custom';
import { Node, Editor } from 'slate';
import { generateTable, generateTableRow, generateTableCell } from '../../element-model/table';
import getEventTransfer from '../../custom/get-event-transfer';
import { htmlDeserializer } from '../../../utils/deserialize-html';

class TableUtils {

  constructor(editor) {
    this.editor = editor;
  }

  isInTable = () => {
    const editor = this.editor;
    const selection = editor.selection;
    if (!selection) return false;
    const block = CustomEditor.match(editor, editor.selection.anchor, 'block');
    const parent = Node.parent(editor, block[1]);
    const focusPath = selection.focus.path;
    const anchorPath = selection.anchor.path;
    if (parent && parent.type && parent.type.includes('table')) {
      if (focusPath[0] === anchorPath[0]) return true;
    }
    return false;
  }

  focusNextTableCell = () => {
    const position = this.getTablePosition();
    const { rowIndex, cellIndex, row, table } = position;
    let nextCellIndex, nextRowIndex;
    if (cellIndex < row.children.length - 1) {
      nextCellIndex = cellIndex + 1;
      nextRowIndex = rowIndex;
    } else {
      if (rowIndex < table.children.length - 1) {
        nextCellIndex = 0;
        nextRowIndex = rowIndex + 1;
      } else {
        this.insertRow();
        nextCellIndex = 0;
        nextRowIndex = rowIndex + 1;
      }
    }
    this.selectCellByPosition(nextRowIndex, nextCellIndex);
  }

  focusPreviousTableCell = () => {
    const position = this.getTablePosition();
    const { rowIndex, cellIndex, row } = position;
    let nextCellIndex, nextRowIndex;
    if (cellIndex > 0) {
      nextCellIndex = cellIndex - 1;
      nextRowIndex = rowIndex;
    } else {
      if (rowIndex > 0) {
        nextRowIndex = rowIndex - 1;
        nextCellIndex = row.children.length - 1;
      } else {
        nextCellIndex = 0;
        nextRowIndex = 0;
      }
    }
    this.selectCellByPosition(nextRowIndex, nextCellIndex);
  }

  selectCellByPosition = (rowIndex, cellIndex) => {
    const { tablePath } = this.getTablePosition();
    const cellRange = Editor.range(this.editor, [...tablePath, rowIndex, cellIndex]);
    Editor.select(this.editor, cellRange.focus);
  }

  insertTable = (data) => {
    const tableElement = generateTable(data);
    CustomEditor.insertNodes(this.editor, tableElement);

    // get the first cell path of the table and move selection to it;
    const table = CustomEditor.match(this.editor, this.editor.selection, {type: 'table'});
    const tablePath = table[1];
    const targetPath = [...tablePath, 0, 0];
    CustomEditor.select(this.editor, targetPath);
  }

  getSelectedTableCells = () => {
    const node = CustomEditor.match(this.editor, this.editor.selection, {type: 'table'});
    const tableNode = node[0];
    const selectedCells = document.querySelectorAll('.selected-cell');
    if (selectedCells.length === 0) {
      return null;
    }
    const cellIndexs = [];
    const rowIndexs = [];

    selectedCells.forEach((cell, index) => {
      const cellIndex = cell.cellIndex;
      const rowDom = cell.parentNode;
      const rowIndex = rowDom.rowIndex;
      cellIndexs.push(cellIndex);
      rowIndexs.push(rowIndex);
    });

    const rowRange = {min: Math.min.apply(null, rowIndexs), max: Math.max.apply(null, rowIndexs)};
    const columnRange = {min: Math.min.apply(null, cellIndexs), max: Math.max.apply(null, cellIndexs)};

    const tableRows = tableNode.children;
    const rowNodes = [];
    tableRows.forEach((row, rowIndex) => {
      const cellNodes = [];
      if (rowIndex >= rowRange.min && rowIndex <= rowRange.max) {
        row.children.forEach((cell, cellIndex) => {
          if (cellIndex >= columnRange.min && cellIndex <= columnRange.max) {
            cellNodes.push(Object.assign({}, {}, cell));
          }
        });
        rowNodes.push(generateTableRow({children: cellNodes}));
      }
    });
    return [generateTable({children: rowNodes})];
  }

  pasteContentInTable = (command) => {
    const data = command.data;
    let { fragment, text, type, html } = getEventTransfer(data);
    const newtext = text.replace(/\r\n|\n/g, ' ');
    if (!fragment && type === 'text') {
      CustomEditor.insertText(this.editor, newtext);
      return;
    }

    if (type === 'html') {
      fragment = htmlDeserializer(html);
    }

    if (fragment.length === 1) {
      if (fragment[0].type === 'table') {
        const tableNode = fragment[0];
        const [row, rowPath] = CustomEditor.match(this.editor, this.editor.selection, { type: 'table_row' });
        const [table, tablePath] = CustomEditor.match(this.editor, this.editor.selection, { type: 'table' });
        const cellPath = CustomEditor.match(this.editor, this.editor.selection, { type: 'table_cell' })[1];
        const currentRowIndex = rowPath[rowPath.length - 1];
        const currentCellIndex = cellPath[cellPath.length - 1];
        const tableWidth = row.children.length;
        const tableHeight = table.children.length;
        tableNode.children.some((row, rowIndex) => {
          const rowPath = [...tablePath, currentRowIndex + rowIndex];
          if (currentRowIndex + rowIndex > tableHeight - 1) {
            return true;
          }
          row.children.some((cell, cellIndex) => {
            if (currentCellIndex + cellIndex > tableWidth - 1) {
              return true;
            }
            const currentCellPath = [...rowPath, currentCellIndex + cellIndex];
            CustomEditor.removeNodes(this.editor, { at: [...currentCellPath, 0] });
            if (cell.children.type !== 'paragraph') {
              const text = Node.text(cell);
              CustomEditor.insertNodes(this.editor, {type: 'paragraph', children: [{text}]}, { at: [...currentCellPath, 0] });
            } else {
              CustomEditor.insertNodes(this.editor, cell.children, { at: [...currentCellPath, 0] });
            }
            return false;
          });
          return false;
        });
      } else if (fragment[0].type === 'paragraph') {
        CustomEditor.insertFragment(this.editor, fragment);
      } else {
        CustomEditor.insertText(this.editor, text.replace(/\r\n|\n/g, ' '));
      }
    } else {
      fragment.forEach((node) => {
        if (node.type === 'paragraph') {
          CustomEditor.insertFragment(this.editor, [node]);
          // if the element is node a paragraph, insert the text if the node is not 0
        } else {
          const nodeText = Node.text(node);
          if (nodeText.length > 0) {
            CustomEditor.insertText(this.editor, nodeText.replace(/\r\n|\n/g, ' '));
          }
        }
      });
    }
  }

  removeTable = () => {
    const tableNode = CustomEditor.match(this.editor, 
      this.editor.selection,
      {type: 'table'}
    );

    const tablePath = tableNode[1];
    const tableIndex = tablePath[tablePath.length - 1];
    let tableParentPath = tablePath.slice(0, tablePath.length - 1);
    let targetNodeIndex = tableIndex >= 1 ? tableIndex - 1 : 1;
    let targteNodePath = [...tableParentPath, targetNodeIndex];
    
    CustomEditor.removeNodes(this.editor, {
      match: {type: 'table'},
    });

    // move selection to previous sibling or next sibling and collapse the selection
    CustomEditor.select(this.editor, targteNodePath);
    CustomEditor.collapse(this.editor, { edge: 'end' });
  }

  getTablePosition = () => {
    const currentCell = CustomEditor.match(this.editor, this.editor.selection, {type: 'table_cell'});
    const currentCellPath = currentCell[1];
    const currentTable = CustomEditor.match(this.editor, this.editor.selection, {type: 'table'});
    const tablePath = currentTable[1];
    const rowPath = currentCellPath.slice(0, currentCellPath.length - 1);
    const row = Node.get(this.editor, rowPath);
    const cell = currentCell[0];
    const table = Node.get(this.editor, tablePath);
    return {
      rowIndex: currentCellPath[currentCellPath.length - 2],
      cellIndex: currentCellPath[currentCellPath.length - 1],
      cellPath: currentCellPath,
      rowPath,
      tablePath,
      row,
      cell,
      table
    };
    
  }

  insertRow = (type = 'after') => {
    const position = this.getTablePosition();
    const tablePath = position.tablePath;
    const rowIndex = position.rowIndex;
    let targetPath;

    if (type === 'after') {
      targetPath = [...tablePath, rowIndex + 1];
    }
    
    if (type === 'before') {
      targetPath = [...tablePath,  rowIndex];
    }

    const rowChildren = position.row.children.map((cell) => {
      return generateTableCell({data: {align: cell.data.align}});
    });

    CustomEditor.insertNodes(this.editor, generateTableRow({children: rowChildren}), {at: targetPath});
    let focusPath = [...targetPath, 0];
    CustomEditor.select(this.editor, focusPath);
    CustomEditor.collapse(this.editor, { edge: 'end' });
  }

  removeRow = () => {
    const position = this.getTablePosition();
    const { rowPath, table, rowIndex, tablePath } = position;
    let targetPath;
    if (table.children.length > 1) {
      if (rowIndex === table.children.length - 1) {
        targetPath = [...tablePath, rowIndex - 1, 0, 0];
      } else {
        targetPath = [...tablePath, rowIndex, 0, 0];
      }
      CustomEditor.removeNodes(this.editor, {
        at: rowPath
      });
      
      CustomEditor.select(this.editor, targetPath);
      CustomEditor.collapse({at: 'end'});
    } else {
      this.removeTable();
    }
  }

  insertColumn = (type = 'after') => {
    const position = this.getTablePosition();
    let focusPath;
    const { table, tablePath, cellIndex } = position;
    if (type === 'after') {
      for (let index = 0; index < table.children.length; index++) {
        const newCellPath = [...tablePath, index, cellIndex + 1];
        CustomEditor.insertNodes(this.editor, generateTableCell({data: {align: 'left'}}), {at: newCellPath});
      }
      focusPath = [...tablePath, 0, cellIndex + 1];
    } else {
      for (let index = 0; index < table.children.length; index++) {
        const newCellPath = [...tablePath, index, cellIndex];
        CustomEditor.insertNodes(this.editor, generateTableCell({data: {align: 'left'}}), {at: newCellPath});
      }
      focusPath = [...tablePath, 0, cellIndex];
    }
    CustomEditor.select(this.editor, focusPath);
    CustomEditor.collapse(this.editor, { edge: 'end' });
  }

  removeColumn = () => {
    const position = this.getTablePosition();
    const { table, tablePath, cellIndex, row } = position;
    if (row.children.length === 1) {
      this.removeTable();
      return;
    }
    for (let index = 0; index < table.children.length; index++) {
      const cellPath = [...tablePath, index, cellIndex];
      CustomEditor.removeNodes(this.editor, {
        at: cellPath
      });
    }
    return;
  }

  setAlign = (align) => {
    const position = this.getTablePosition();
    const { table, tablePath, cellIndex } = position;
    for (let index = 0; index < table.children.length; index++) {
      const cellPath = [...tablePath, index, cellIndex];
      CustomEditor.setNodes(this.editor, {
        data: {align}
      }, {
        at: cellPath
      });
    }
  }

  exitTable = () => {
    const tableNode = CustomEditor.match(this.editor, this.editor.selection, {type: 'table'});
    const tablePath = tableNode[1];
    const tableIndex = tablePath[tablePath.length - 1];
    const tableParentPath = tablePath.slice(0, tablePath.length - 1);
    const newPath = [...tableParentPath, tableIndex + 1];
    CustomEditor.insertNodes(this.editor, {type: 'paragraph', children: [{text: ''}]}, {at: newPath});
    CustomEditor.select(this.editor, newPath);
    CustomEditor.collapse({at: 'end'});
  }
}

export default TableUtils;