
class Table {

  constructor(options = {}) {
    this.type = options.type || 'table';
    const { rowCount, columnCount } = options;
    let children = options.children;
    if (rowCount) {
      const list = new Array(rowCount).fill('');
      children = list.map(() => {
        return generateTableRow({columnCount});
      });
    }
    this.children = children;
  }
}

class TableRow {

  constructor(options = {}) {
    this.type = options.type || 'table_row';
    const { columnCount } = options;
    let children = options.children;
    if (columnCount) {
      const list = new Array(columnCount).fill('');
      children = list.map(() => {
        return generateTableCell();
      });
    }
    
    this.children = children;
  }
}

class TableCell {

  constructor(options = {}) {
    this.type = options.type || 'table_cell';
    this.children = options.children || [{type: 'paragraph', children: [{text: ''}]}];
    this.data = options.data || {align: 'left'};
  }
}

const generateTable = (options) => {
  return Object.assign({}, new Table(options));
};

const generateTableRow = (options) => {
  return Object.assign({}, new TableRow(options));
};

const generateTableCell = (options) => {
  return Object.assign({}, new TableCell(options));
};

export { generateTable, generateTableRow, generateTableCell };