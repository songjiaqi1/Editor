import { jsx } from '../lib/slate-hyperscript/';
import { generateTableRow, generateTableCell } from '../editor/element-model/table';

const ELEMENT_TAGS = {
  A: el => ({ type: 'link', data: {href: el.getAttribute('href')} }),
  BLOCKQUOTE: () => ({ type: 'blockquote' }),
  H1: () => ({ type: 'header_one' }),
  H2: () => ({ type: 'header_two' }),
  H3: () => ({ type: 'header_three' }),
  H4: () => ({ type: 'header_four' }),
  H5: () => ({ type: 'header_five' }),
  H6: () => ({ type: 'header_six' }),
  IMG: el => ({ type: 'image', children: [{text: ''}], data: {src: el.getAttribute('src')} }),
  LI: () => ({ type: 'list_item', data: {} }),
  OL: () => ({ type: 'ordered_list' }),
  P: () => ({ type: 'paragraph' }),
  UL: () => ({ type: 'unordered_list' }),
  TABLE: () => ({ type: 'table' }),
  BR: () => ({ text: '' })
};

const HEADER_LIST = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

const TEXT_TAGS = {
  CODE: () => ({ CODE: true }),
  DEL: () => ({ DELETE: true }),
  EM: () => ({ ITALIC: true }),
  I: () => ({ ITALIC: true }),
  STRONG: () => ({ BOLD: true }),
  INS: () => ({ INS: true })
};

const parseTable = (el) => {

  if (el.parentNode.nodeName !== 'BODY') {
    return null;
  }

  let tableWidth = 0;
  Array.from(el.rows[0].childNodes).forEach((cell, index) => {
    if (cell.nodeName === 'TD' || cell.nodeName === 'TH') {
      tableWidth += (Number(cell.getAttribute('colspan')) || 1);
    }
  });

  let rowList = [];
  for(let rowIndex = 0; rowIndex < el.rows.length; rowIndex++) {
    let cells = el.rows[rowIndex].cells;
    const cellsList = [];
    for(let columnIndex = 0; columnIndex < cells.length; columnIndex++) {
      const cell = cells[columnIndex];
      cellsList.push(generateTableCell({children: [{type: 'paragraph', children: [{text: cell.textContent}]}]}));
    }
    if (cellsList.length < tableWidth) {
      let count = tableWidth - cellsList.length;
      for(let i = 0; i < count; i++) {
        cellsList.push(generateTableCell({children: [{type: 'paragraph', children: [{text: ''}]}]}));
      }
    }
    rowList.push(generateTableRow({children: cellsList}));
  }
  
  return rowList;
};

const deserializeHtml = el => {
  if (el.nodeType === 3) {
    // remove \n character
    if (el.textContent === '\n' || el.textContent === '\r') {
      return null;
    }
    if (el.parentElement.nodeName === 'BODY') {
      let text = el.textContent.replace(/(\n|\r\n)/g, '');
      if (text.length === 0) return null;
      return {type: 'paragraph', children: [{text}]};
    }
    return el.textContent;
  } else if (el.nodeType !== 1) {
    return null;
  }

  const { nodeName } = el;
  let parent = el;

  let children = Array.from(parent.childNodes)
    .map(deserializeHtml)
    .flat();

  // deserialize task list
  if (nodeName === 'LI') {
    if (el.className && el.className.indexOf('task-list-item') >= 0) {
      return jsx('element', {data: {checked: false}, type: 'list_item'}, children);
    }
  }

  if (
    nodeName === 'PRE' &&
    el.childNodes[0] &&
    el.childNodes[0].nodeName === 'CODE'
  ) {
    // deserialize code block
    const code = el.childNodes[0];
    const codeChildren = [];
    code.childNodes.forEach((codeLine, index) => {
      if (codeLine.innerText) {
        codeChildren.push({
          type: 'code_line',
          children: [{ text: codeLine.innerText }]
        });
      }
    });

    return {
      data: {syntax: null},
      children: codeChildren,
      type: 'code_block'
    };
  }

  if (el.nodeName === 'BODY') {
    return jsx('fragment', {}, children);
  }

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](el);
    if (nodeName === 'IMG') {
      return jsx('element', attrs, [{text: ''}]);
    }

    // modify BR into an empty text node
    if (nodeName === 'BR') {
      return '';
    }

    if (nodeName === 'TABLE') {
      return jsx('element', attrs, parseTable(el));
    }
    
    if (nodeName === 'A' || HEADER_LIST.includes(nodeName)) {
      return jsx('element', attrs, [{text: el.textContent}]);
    }

    return jsx('element', attrs, children);
  }

  if (TEXT_TAGS[nodeName]) {
    const attrs = TEXT_TAGS[nodeName](el);
    return children.map(child => jsx('text', attrs, child));
  }
  return children;
};


export const htmlDeserializer = (html) => {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  return deserializeHtml(parsed.body);
};
