import { Editor, Range } from 'slate';

// modified on the basic of the slate function Editor.nodes
// todo: get the node which nearest to the selection
const getNodesByTypeAtRange = (editor, type) => {
  let match = {};
  if (Array.isArray(type)) {
    match.match = type;
  } else {
    match.match = {type};
  }
  const nodes = Editor.nodes(editor, match);
  const [blockNode] = Editor.nodes(editor, {match: 'block'});
  const listItemDepth = blockNode[1].length - 1;
  if (Range.isCollapsed(editor.selection)) {
    let node;
    for (const item of nodes) {
      node = item;
    }
    return node;
  } else {

    const itemsWithSameAncesstor = [];
    for (const node of nodes) {
      if (listItemDepth === node[1].length) {
        itemsWithSameAncesstor.push(node);
      }
    }
    return itemsWithSameAncesstor;
  }
 
};

export default getNodesByTypeAtRange;