import { generateTable } from '../../editor/element-model/table';
import { Text } from 'slate';
import { isEmptyParagraph } from '../utils';
var {unified} = require('unified');
var markdown = require('remark-parse');
var math = require('remark-math/block');
var definitions = require('mdast-util-definitions');

// transform code value: a function used to tranform code value of markdown format to slate document
function mdCodeNodeToSlate(codeValue) {
  // statement an array : filled width code value splited by '\n'
  let codeValueArr = codeValue.split(/\n/g);
  let slateText, slateBlock;
  // map codeValueArr item to slate document 'code_line'
  let slate_code_arr = codeValueArr.map(function(text) {
    // transform string to slateText object
    slateText = {
      text: text,
    };
    // transform slateText to Block object
    slateBlock = {
      children: [slateText],
      type: 'code_line'
    };
    return slateBlock;
  });

  return slate_code_arr;
}

// deserialize mdTable to SlateNode
function mdTableToSlateTable(tableNode, opts) {
  // get align array
  let tableAlignArr = tableNode.align;
  // get all table_rows, return：array
  let tableRows = tableNode.children;
  // slate table_row Node into it
  let tableRowsArr = [];
  // traverse table_rows
  for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
    // slate table_cell Node into it
    let tableCellsArr = [];
    /*
     * traverse every table_cells of an table_rows,
     * the length of every table_rows is equal to tableAlign array
     * */
    for (
      let columnsIndex = 0;
      columnsIndex < tableAlignArr.length;
      columnsIndex++
    ) {
      // get table_cell and tranlate it to slate Node: table_cell
      let tableCell = tableRows[rowIndex].children[columnsIndex];
      if (!tableCell) {
        tableCell = {
          type: 'tableCell',
          children: [{ type: 'paragraph', children: [{ text: ''}] }],
          data: {
            align: 'left'
          }
        };
      }
      let children = parseChildren(tableCell, opts);
      if (children.length === 0) {
        children.push({text: ''});
      }
      tableCell = {
        type: 'table_cell',
        children: [{ type: 'paragraph', children }],
        data: {
          align: tableAlignArr[columnsIndex]
        }
      };
      tableCellsArr.push(tableCell);
    }
    // push add table_rows into tableRowsArr
    tableRowsArr.push({
      type: 'table_row',
      children: tableCellsArr
    });
  }

  return tableRowsArr;
}

function mdImageToSlate(node, opts) {
  const { body } = new DOMParser().parseFromString(node.value, 'text/html');
  let img = body.firstChild;
  let data = {};
  data['src'] = img.getAttribute('src');
  if (!isNaN(img.getAttribute('width')) && img.getAttribute('width') > 0) {
    data['width'] = img.getAttribute('width');
  }
  if (!isNaN(img.getAttribute('height')) && img.getAttribute('height') > 0) {
    data['height'] = img.getAttribute('height');
  }
  if (img.getAttribute('alt')) {
    data['alt'] = img.getAttribute('alt');
  }
  if (img.getAttribute('title')) {
    data['title'] = img.getAttribute('title');
  }
  if (data['src']) {
    return[{text: ''}, {
      type: 'image',
      data: data,
      children: [{ text: '' }]
    }, {text: ''}];
  }
}

function _applyMark(childNodeOrNodes, mark) {
  if (childNodeOrNodes instanceof Array) {
    return childNodeOrNodes.map(item => _applyMark(item, mark));
  } else if (childNodeOrNodes.text) {
    childNodeOrNodes[mark] = true;
    return childNodeOrNodes;
  } else {
    return childNodeOrNodes;
  }
}

function addChildNodeOrNodes(children, childNodeOrNodes) {
  if (childNodeOrNodes instanceof Array) {
    childNodeOrNodes.map(item => children.push(item));
  } else {
    if (childNodeOrNodes !== undefined) children.push(childNodeOrNodes);
  }
}


function parseMark(node, markString, opts) {
  var mark = markString;
  var children = [];
  for (let child of node.children) {
    let childNodeOrNodes = _nodeToSlate(child, opts);
    // ignore unrecognized node type
    if (!childNodeOrNodes) continue;
    childNodeOrNodes = _applyMark(childNodeOrNodes, mark);
    addChildNodeOrNodes(children, childNodeOrNodes);
  }

  return children;
}

function parseChildren(node, opts) {
  var children = [];
  for (let child of node.children) {
    let ret = _nodeToSlate(child, opts);
    addChildNodeOrNodes(children, ret);
  }
  return children;
}

function _nodeToSlate(node, opts) {
  var children = [];
  var { definition } = opts;
  switch (node.type) {
  case 'heading':
    var header_string;
    children = parseChildren(node, opts);
    if (children && children.length === 0) {
      children.push({text: ''});
    }
    switch (node.depth) {
    case 1:
      header_string = 'header_one';
      break;
    case 2:
      header_string = 'header_two';
      break;
    case 3:
      header_string = 'header_three';
      break;
    case 4:
      header_string = 'header_four';
      break;
    case 5:
      header_string = 'header_five';
      break;
    case 6:
      header_string = 'header_six';
      break;
    default:
      console.log('Invalid depth: ' + node.depth);
      header_string = 'header_one';
      break;
    }
    return {
      type: header_string,
      children
    };
  case 'paragraph':
    children = parseChildren(node, opts);
    if (children.length === 0) {
      children.push({text: ''});
    }
    return {
      type: 'paragraph',
      children
    };
  case 'blockquote':
    children = parseChildren(node, opts);
    if (children.length === 0) {
      children.push({type: 'paragraph', children: [{text: ''}]});
    }
    return {
      type: 'blockquote',
      children
    };
  case 'list':
    opts.loose = node.loose;
    children = parseChildren(node, opts);
    if (children.length === 0) {
      children.push({type: 'list_item', children: [{type: 'paragraph', children: [{text: ''}]}]});
    }
    if (node.ordered) {
      return {
        type: 'ordered_list',
        children
      };
    } else {
      return {
        type: 'unordered_list',
        children
      };
    }
  case 'listItem':
    children = parseChildren(node, opts);
    if (children.length === 0) {
    /**
    * if children is an empty array push an empy paragaph to it
    */
      children.push({
        type: 'paragraph',
        children: [
          {
            text: '',
          }
        ]
      });
    }
    var data = {};
    if (node.checked !== null) {
      data.checked = node.checked;
    }
    return {
      type: 'list_item',
      data: data,
      children
    };
  case 'code':
    var data = {};
    if (node.lang) {
      data.syntax = node.lang;
    }
    let slate_code_arr = mdCodeNodeToSlate(node.value);
    if (slate_code_arr.length === 0) {
      slate_code_arr.push({
        type: 'code_line',
        children: [{text: ''}]
      });
    }
    return {
      type: 'code_block',
      data: data,
      children: slate_code_arr
    };
  case 'strong':
    return parseMark(node, 'BOLD', opts);
  case 'emphasis':
    return parseMark(node, 'ITALIC', opts);
  case 'inlineCode':
    // Inline code need to be handled differently
    return {
      text: node.value,
      'CODE': true
    };
  case 'text':
    // A plain text in markdown
    // text is the botton node in Markdown AST
    return {
      text: node.value,
    };
  case 'thematicBreak':
    return {
      type: 'hr',
      children: [{ text: ''}]
    };
  case 'table':
    // get all children of table by mdTableToSlateTable
    children = mdTableToSlateTable(node, opts);
    if (children.length === 0) {
      return generateTable();
    }
    return {
      type: 'table',
      children,
      data: {
        align: node.align
      }
    };
  case 'html':
    if (node.value.slice(0, 4).toLowerCase() === '<img') {
      return mdImageToSlate(node, opts);
    } else {
      return {text: node.value};
    }
  case 'link':
    children = parseChildren(node, opts);
    
    if (children.length === 0) return {text: ''};
    var data = {
      href: node.url
    };
    if (node.title) {
      data.title = node.title;
    }
    return [{ text: '' }, {
      type: 'link',
      data: data,
      children
    }, {text: ''}];
  case 'image':
    var data = {
      src: node.url
    };
    if (node.title) {
      data.title = node.title;
    }
    if (node.alt) {
      data.alt = node.alt;
    }
    if (node.width) {
      data.width = node.width;
    }
    if (node.height) {
      data.height = node.height;
    }
    return [{ text: '' }, {
      type: 'image',
      data: data,
      children: [{ text: '' }]
    }, { text: '' }];
  case 'linkReference':
    children = parseChildren(node, opts);
    var def = definition(node.identifier);
    var data = {};
    if (def) {
      data.href = def.url;
      if (def.title) {
        data.title = def.title;
      }
      return {
        type: 'link',
        data: data,
        children
      };
    } else {
      return {
        text: '[' + node.identifier + ']',
      };
    }
  case 'imageReference':
    var def = definition(node.identifier);
    var data = {};
    if (def) {
      data.src = def.url;
      if (def.title) {
        data.title = def.title;
      }
      if (node.alt) {
        data.alt = node.alt;
      }
      return {
        type: 'image',
        data: data,
        children: [{ text: '' }]
      };
    } else {
      return {
        text: '![' + node.alt + ']',
      };
    }
  case 'math': {
    return {
      type: 'formula',
      children: [{text: ''}],
      data: {
        formula: node.value,
      }
    };
  }
  case 'definition':
    return;
  default:
    console.log('unrecognized type: ' + node.type);
    return;
  }
}

function fixValue(nodes) {
  let c = [];
  for (let node of nodes) {
    // if node is image node, wrap it into paragraph node
    if (node.type === 'image') {
      let data = {};
      data['src'] = node.data.src;
      data['width'] = node.data.width || null;
      data['height'] = node.data.height || null;
      if (node.data.alt) {
        data['alt'] = node.data.alt;
      }
      if (node.data.title) {
        data['title'] = node.data.title;
      }
      let nodeNew = {
        type: 'paragraph',
        children: [
          { text: '' },
          { type: 'image', data: data, children: [{ text: '', marks: [] }] },
          { text: '' }
        ],
      };
      c.push(nodeNew);
    } else if (node.type === 'html_block') {
      // convert from inline to block
      node = {
        type: 'html_block',
        data: {
          html: node.get('data').get('html')
        },
        children: node.nodes
      };
      c.push(node);
    } else if (!Text.isText(node)) {
      c.push(node);
    }
  }
  return c;
}

function deserialize(content) {
  let processor = unified().use(markdown, {
    commonmark: true
  });
  // Parse formula md string to slate node when editor can insert formula
  if (window.canInsertFormula) {
    processor.use(math);
  }
  let root = processor.parse(content);
  let definition = definitions(root);
  let nodes = [];
  for (let child of root.children) {
    addChildNodeOrNodes(nodes, _nodeToSlate(child, { definition: definition }));
  }
  if (nodes.length === 0) {
    // add default paragraph
    var node ={
      type: 'paragraph',
      children: [{ text: '' }]
    };
    nodes.push(node);
  }

  // handle image and html_block
  let c;
  c = fixValue(nodes);
  let firstBlockType = c[0].type;
  if (firstBlockType === 'table'
    || firstBlockType === 'code_block'
    || firstBlockType === 'blockquote'
  ) {
    c.unshift({
      type: 'paragraph',
      children:[{text: ''}]
    });
  }

  // Do not add an empty paragraph in if the article has only an empty paragraph
  if (c.length === 1 && isEmptyParagraph(c[0])) {
    return c;
  }

  c.push({
    type: 'paragraph',
    children: [{ text: '' }]
  });

  return c;
}

export { deserialize };
