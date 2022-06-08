import { Editor, Path, Node} from 'slate';

const removeEmptyParentNode = (editor, pathRef) => {
  let path = pathRef.current;
  let currentNode = Node.get(editor, path);
  let children = currentNode.children;
  while((children.length === 0 || (children.length === 1 && children[0].text === '')) && currentNode.type) {
    Editor.removeNodes(editor, {at: path});
    path = Path.parent(path);
    currentNode = Node.get(editor, path);
    children = currentNode.children;
  }
  pathRef.unref();
};

const clearBlockFormat = (editor) => {
  // get selected block node, like the paragraphs in the blockquote;
  const nodes = Editor.nodes(editor, { match: 'block', voids: false});
  const nodesList = [];
  const pathRefs = Array.from(nodes, (item) => {
    nodesList.push(item);
    return Editor.pathRef(editor, item[1]);
  });
  const firstNode = nodesList[0], firstNodeRef = pathRefs[0];
  nodesList.shift();
  pathRefs.shift();
  // move first block to outest and set the block to paragraph
  while(firstNodeRef.current.length > 1) {
    Editor.liftNodes(editor, {at: firstNodeRef.current});
  }
  if (firstNode[0].type !== 'paragraph') {
    Editor.setNodes(editor, {type: 'paragraph', at: firstNodeRef.current, split: true});
  }

  nodesList.forEach((item, index) => {
    const toPath = index === 0 ? Path.next(firstNodeRef.current) : Path.next(pathRefs[index - 1].current);
    const currentPath = pathRefs[index].current;
    if (currentPath.length > 1) {
      const parentPath = Path.parent(currentPath);
      const parentRef = Editor.pathRef(editor, parentPath);
      // move current node to outest
      Editor.moveNodes(editor, { at: currentPath, to: toPath});
      // remove empty parent node
      removeEmptyParentNode(editor, parentRef);
    }
    // set current block node to paragraph
    if (item[0].type !== 'paragraph') {
      Editor.setNodes(editor, {type: 'paragraph', at: currentPath, split: true});
    }
  });
  firstNodeRef.unref();
  pathRefs.forEach((ref) => ref.unref());
};

const clearMarkerFormat = (editor) => {
  // clear all markers of selected texts;
  const textProperties = { BOLD: false, ITALIC: false, CODE: false };
  editor.exec({type: 'format_text', properties: textProperties});
};

export { clearBlockFormat, clearMarkerFormat };
