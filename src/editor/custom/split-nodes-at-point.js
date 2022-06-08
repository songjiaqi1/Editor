import { Element, Editor, Range, Path } from 'slate';

// modified on the basic of slate function Editor.SplitNodes
// todo: split the node which nearest to the selection
const splitNodesAtPoint = (editor, options = {}) => {
    Editor.withoutNormalizing(editor, () => {
      let {
        match,
        at = editor.selection,
        height = 0,
        always = false,
        voids = false,
      } = options;

      if (match == null) {
        match = 'block';
      }

      if (Range.isRange(at)) {
        at = deleteRange(editor, at);
      }

      if (!at) {
        return;
      }

      const beforeRef = Editor.pointRef(editor, at, {
        affinity: 'backward',
      });

      const nodes = Editor.nodes(editor, { at, match, voids });
      let highest = [...nodes].pop();

      if (!highest) {
        return;
      }

      const voidMatch = Editor.match(editor, at, 'void');
      const nudge = 0;

      if (!voids && voidMatch) {
        const [voidNode, voidPath] = voidMatch;

        if (Element.isElement(voidNode) && editor.isInline(voidNode)) {
          let after = Editor.after(editor, voidPath);
          if (!after) {
            const text = { text: '' };
            const afterPath = Path.next(voidPath);
            Editor.insertNodes(editor, text, { at: afterPath, voids });
            after = Editor.point(editor, afterPath);
          }

          at = after;
          always = true;
        }

        const siblingHeight = at.path.length - voidPath.length;
        height = siblingHeight + 1;
        always = true;
      }

      const afterRef = Editor.pointRef(editor, at);
      const depth = at.path.length - height;
      const [, highestPath] = highest;
      const lowestPath = at.path.slice(0, depth);
      let position = height === 0 ? at.offset : at.path[depth] + nudge;
      let target = null;

      for (const [node, path] of Editor.levels(editor, {
        at: lowestPath,
        reverse: true,
        voids,
      })) {
        let split = false;

        if (
          path.length < highestPath.length ||
          path.length === 0 ||
          (!voids && Element.isElement(node) && editor.isVoid(node))
        ) {
          break;
        }
        const point = beforeRef.current;
        const isEnd = Editor.isEnd(editor, point, path);

        if (always || !beforeRef || !Editor.isEdge(editor, point, path)) {
          split = true;
          const { text, children, ...properties } = node;
          editor.apply({
            type: 'split_node',
            path,
            position,
            target,
            properties,
          });
        }

        target = position;
        position = path[path.length - 1] + (split || isEnd ? 1 : 0);
      }

      if (options.at == null) {
        const point = afterRef.current || Editor.end(editor, []);
        Editor.select(editor, point);
      }

      beforeRef.unref();
      afterRef.unref();
    });
  },


  deleteRange = (editor, range) => {
    if (Range.isCollapsed(range)) {
      return range.anchor;
    } else {
      const [, end] = Range.edges(range);
      const pointRef = Editor.pointRef(editor, end);
      Editor.delete(editor, { at: range });
      return pointRef.unref();
    }
  };

export default splitNodesAtPoint;

