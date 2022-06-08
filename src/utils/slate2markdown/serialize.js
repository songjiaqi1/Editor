import { Text, Node } from 'slate';
import { isEmptyParagraph } from '../utils';
var {unified} = require('unified');
var stringify = require('remark-stringify');
var math = require('remark-math/block');


var processor = unified().use(stringify, {
  rule: '-',
  ruleSpaces: false,
  listItemIndent: 1,
  bullet: '*',
  commonmark: true,
  fences: true
}).use(math);


function _applyMark(node, markString) {
  switch (markString) {
  case 'BOLD':
    return {
      type: 'strong',
      children: [
        node
      ]
    };
  case 'ITALIC':
    return {
      type: 'emphasis',
      children: [
        node
      ]
    };
  case 'CODE':
    return {
      type: 'inlineCode',
      value: node.value
    };
  default:
    console.log('unknown mark string: ' + markString);
    return node;
  }
}

function _text2MdNodes(node) {
  var mdNode = {};
  const textKeys = Object.keys(node);
  const marks = [];
  textKeys.forEach(key => {
    if (node[key] && key !== 'text') marks.push(key);
  });
  if (marks.length === 0) {
    mdNode = { type: 'text', value: node.text };
  } else {
    mdNode = {type: 'text', value: node.text};
    for (let mark of marks) {
      mdNode = _applyMark(mdNode, mark);
    }
  }
  return mdNode;
}

function _image2MdNode(node) {
  if (node.data.height || node.data.width) {
    let text = '<img ';
    for(let key in node.data) {
      text = text + key + '="' + node.data[key] + '" ';
    }
    text += '/>';
    return [{type: 'html', value: text}];
  }
  else {
    return {
      type: 'image',
      url: node.data.src,
      alt: node.data.alt ? node.data.alt : null,
      title: node.data.title ? node.data.title : null,
    };
  }
}

function getTableAlignments(node) {
  const alignments = [];
  node.children[0].children.forEach(cell => {
    const alignment = cell.data ? cell.data.align : 'left';
    alignments.push(alignment);
  });

  return alignments;
}

function addChildNodeOrNodes(children, childNodeOrNodes) {
  if (childNodeOrNodes instanceof Array) {
    childNodeOrNodes.map(item => children.push(item));
  } else {
    if (childNodeOrNodes !== undefined)
      children.push(childNodeOrNodes);
  }
}

function parseChildren(node) {
  var children = [];
  for (let child of node.children) {
    let ret = _slateNodeToMD(child);
    addChildNodeOrNodes(children, ret);
  }
  return children;
}


function _slateNodeToMD(node) {
  if (!Text.isText(node)) {
    var mdNodes;
    switch (node.type) {
    case 'paragraph':
      mdNodes = parseChildren(node);
      return {
        type: 'paragraph',
        children: mdNodes
      };
    case 'header_one':
      mdNodes = parseChildren(node);
      return {
        type: 'heading',
        depth: 1,
        children: mdNodes
      };
    case 'header_two':
      mdNodes = parseChildren(node);
      return {
        type: 'heading',
        depth: 2,
        children: mdNodes
      };
    case 'header_three':
      mdNodes = parseChildren(node);
      return {
        type: 'heading',
        depth: 3,
        children: mdNodes
      };
    case 'header_four':
      mdNodes = parseChildren(node);
      return {
        type: 'heading',
        depth: 4,
        children: mdNodes
      };
    case 'header_five':
      mdNodes = parseChildren(node);
      return {
        type: 'heading',
        depth: 5,
        children: mdNodes
      };
    case 'header_six':
      mdNodes = parseChildren(node);
      return {
        type: 'heading',
        depth: 6,
        children: mdNodes
      };
    case 'hr':
      return {
        type: 'thematicBreak'
      };
    case 'ordered_list':
      mdNodes = parseChildren(node);
      var loose = false;
      for (let node of mdNodes) {
        if (node.loose === true) {
          loose = true;
          break;
        }
      }
      return {
        type: 'list',
        ordered: true,
        start: 1,
        loose: loose,
        children: mdNodes
      };
    case 'unordered_list':
      mdNodes = parseChildren(node);
      var loose = false;
      for (let node of mdNodes) {
        if (node.loose === true) {
          loose = true;
          break;
        }
      }
      return {
        type: 'list',
        ordered: false,
        start: 1,
        loose: loose,
        children: mdNodes
      };
    case 'list_item':
      mdNodes = parseChildren(node);
      var loose = false;
      if (mdNodes) {
        if (mdNodes.length === 1) {
          loose = false;
        } else if (mdNodes.length === 2 && mdNodes[1].type === 'list') {
          loose = false;
        } else {
          loose = true;
        }
      }
      return {
        type: 'listItem',
        loose: loose,
        checked: node.data.checked !== undefined ? node.data.checked : null,
        children: mdNodes
      };
    case 'code_block':
      mdNodes = parseChildren(node);
      return {
        type: 'code',
        lang: node.data.syntax ? node.data.syntax : null,
        value: mdNodes.join('')
      };
    case 'code_line':
      return  Node.text(node) + '\n';
    case 'table':
      mdNodes = parseChildren(node);
      return {
        type: 'table',
        align: getTableAlignments(node),
        children: mdNodes
      };
    case 'table_row':
      mdNodes = parseChildren(node);
      return {
        type: 'tableRow',
        children: mdNodes
      };
    case 'table_cell':
      mdNodes = parseChildren(node);
      return {
        type: 'tableCell',
        children: mdNodes
      };
    case 'blockquote':
      mdNodes = parseChildren(node);
      return {
        type: 'blockquote',
        children: mdNodes
      };
    case 'html_block':
      return {
        type: 'html',
        value: node.data.html
      };
    case 'image':
      return _image2MdNode(node);
    case 'link':
      mdNodes = parseChildren(node);
      return {
        type: 'link',
        url: node.data.href,
        title: node.data.title ? node.data.title : null,
        children: mdNodes
      };
    case 'formula':
      const data = node.data;
      return {
        type: 'math',
        value: data.formula,
      };
    default:
      // turn the block to paragraph default when it`s type is unknown
      mdNodes = parseChildren(node);
      return {
        type: 'paragraph',
        children: mdNodes
      };
    }      
  } else if (Text.isText(node)) {
    return _text2MdNodes(node);
  }
}

/**
 * @param value : a JSON object of editor value
 * @returns markdownContent
 */

function serialize(value) {

  // Return an empty string when the article only has an empty paragraph
  if (value.length === 1 && isEmptyParagraph(value[0])) {
    return '';
  }

  var children = [];

  for (let child of value) {
    addChildNodeOrNodes(children, _slateNodeToMD(child));
  }

  var root = {
    type: 'root',
    children: children
  };

  let content = processor.stringify(root); 
  return content;
}


export { serialize };
