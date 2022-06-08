import React from 'react';
import ReactDOM from 'react-dom';
import '../../css/table.css';

class TableContainer extends React.PureComponent {

  constructor(props) {
    super(props);
    this.table = null;
    this.selectedRowRange = { min: -1, max: -1 };
    this.selectedColRange = { min: -1, max: -1 };
    this.hasSelectedRangeRendered = false;
  }

  clearSelectedCells = () => {
    this.table.querySelectorAll('.selected-cell').forEach((selectedCell) => {
      selectedCell.classList.remove('selected-cell', 'selected-cell-left', 'selected-cell-bottom', 'selected-cell-top', 'selected-cell-right');
    });
  };

  componentDidMount() {
    this.table = ReactDOM.findDOMNode(this);
  }

  componentDidUpdate() {
    const { min: minRowIndex, max: maxRowIndex } = this.selectedRowRange;
    const { min: minColIndex, max: maxColIndex } = this.selectedColRange;

    if (minColIndex < 0 || minRowIndex < 0) {
      this.clearSelectedCells();
      return;
    }

    if (this.hasSelectedRangeRendered && this.selectedRowRange.min >= 0 && this.selectedColRange.min >= 0) {
      // if selected range is selected and has rendered reset selected range
      this.selectedColRange = { min: -1, max: -1 };
      this.selectedColRange = { min: -1, max: -1 };
      return;
    }

    // clear previous selected style before render
    this.clearSelectedCells();
    for (let rowIndex = minRowIndex; rowIndex <= maxRowIndex; rowIndex++) {
      let selectedRow = this.table.querySelectorAll('tr')[rowIndex];
      for (let colIndex = minColIndex; colIndex <= maxColIndex; colIndex++) {
        selectedRow.querySelectorAll('td')[colIndex].classList.add('selected-cell');
        if (rowIndex === minRowIndex) {
          selectedRow.querySelectorAll('td')[colIndex].classList.add('selected-cell-top');
        }
        if (colIndex === minColIndex) {
          selectedRow.querySelectorAll('td')[colIndex].classList.add('selected-cell-left');
        }
        if (colIndex === maxColIndex) {
          selectedRow.querySelectorAll('td')[colIndex].classList.add('selected-cell-right');
        }
        if (rowIndex === maxRowIndex) {
          selectedRow.querySelectorAll('td')[colIndex].classList.add('selected-cell-bottom');
        }
      }
    }
    this.hasSelectedRangeRendered = true;
  }
  
  selectTable = (event) => {
    this.startRowIndex = this.getTableElement(event.target, 'tr').rowIndex;
    this.startColIndex = this.getTableElement(event.target, 'td').cellIndex;
    window.document.addEventListener('mousemove', this.selectCellsInTable);
    window.document.addEventListener('mouseup', this.onMouseUp);
  };

  getTableElement = (node, type) => {
    if (node.nodeName.toLowerCase() === type) return node;
    let element = node;
    while (element.nodeName.toLowerCase() !== type) {
      element = element.parentNode;
    }
    return element;
  };

  selectCellsInTable = (event) => {
    if (event.target.nodeName === 'TBODY' || !this.table.contains(event.target)) {
      // if  event.target not in the table, clear the mouseMove event
      return;
    }

    this.endRowIndex = this.getTableElement(event.target, 'tr').rowIndex;
    this.endColIndex = this.getTableElement(event.target, 'td').cellIndex;
    
    let minRowIndex = Math.min(this.startRowIndex, this.endRowIndex), maxRowIndex = Math.max(this.startRowIndex, this.endRowIndex),
      minColIndex = Math.min(this.startColIndex, this.endColIndex), maxColIndex = Math.max(this.startColIndex, this.endColIndex);
      
    if (minRowIndex === maxRowIndex && minColIndex === maxColIndex) {
      return;
    }

    // collapse selection
    window.getSelection().collapseToEnd();
    this.selectedRowRange = {min: minRowIndex, max: maxRowIndex};
    this.selectedColRange = {min: minColIndex, max: maxColIndex};
    this.hasSelectedRangeRendered = false;
    this.forceUpdate();
  };

  onMouseUp = () => {
    window.document.removeEventListener('mousemove', this.selectCellsInTable);
    window.document.removeEventListener('mouseup', this.onMouseUp);
  };

  render() {
    const { attributes, children } = this.props;
    return (
      <table onMouseDown={this.selectTable}>
        <tbody {...attributes}>
          {children}
        </tbody>
      </table>
    );
  }
}

export default TableContainer;