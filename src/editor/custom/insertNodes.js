import { Editor, Range, Path, Node, Point, Text } from 'slate';

// modifyed function from slate
// The goal of the modification: focus the selection to the end of the last inserted node

export const insertNodes = (
  editor,
  nodes,
  options = {}
) => {
  Editor.withoutNormalizing(editor, () => {
    // eslint-disable-next-line no-unused-vars
    const { selection } = editor;
    const { hanging = false, voids = false } = options;
    let { at, match, select } = options;
    if (Node.isNode(nodes)) {
      nodes = [nodes];
    }

    if (nodes.length === 0) {
      return;
    }

    const [node] = nodes;
    // By default, use the selection as the target location. But if there is
    // no selection, insert at the end of the document since that is such a
    // common use case when inserting from a non-selected state.
    if (!at) {
      if (editor.selection) {
        at = editor.selection;
      } else if (editor.children.length > 0) {
        at = Editor.end(editor, []);
      } else {
        at = [0];
      }

      select = true;
    }

    if (select == null) {
      select = false;
    }

    if (Range.isRange(at)) {
      if (!hanging) {
        at = Editor.unhangRange(editor, at);
      }

      if (Range.isCollapsed(at)) {
        at = at.anchor;
      } else {
        const [, end] = Range.edges(at);
        const pointRef = Editor.pointRef(editor, end);
        Editor.delete(editor, { at });
        at = pointRef.unref();
      }
    }

    if (Point.isPoint(at)) {
      if (match == null) {
        if (Text.isText(node)) {
          match = 'text';
        } else if (editor.isInline(node)) {
          match = ['inline', 'text'];
        } else {
          match = 'block';
        }
      }

      const atMatch = Editor.match(editor, at.path, match);

      if (atMatch) {
        const [, matchPath] = atMatch;
        const pathRef = Editor.pathRef(editor, matchPath);
        const isAtEnd = Editor.isEnd(editor, at, matchPath);
        Editor.splitNodes(editor, { at, match });
        const path = pathRef.unref();
        at = isAtEnd ? Path.next(path) : path;
      } else {
        return;
      }
    }

    const parentPath = Path.parent(at);
    let index = at[at.length - 1];

    if (!voids && Editor.match(editor, parentPath, 'void')) {
      return;
    }

    let path = [];
    for (const node of nodes) {
      path = parentPath.concat(index);
      index++;
      at = path;
      editor.apply({ type: 'insert_node', path, node });
    }

    if (select) {
      const point = Editor.end(editor, at);
      if (point) {
        Editor.select(editor, point);
      }
    }
  });
};