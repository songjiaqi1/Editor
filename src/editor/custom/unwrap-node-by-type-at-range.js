import { Editor, Range } from 'slate';

// modified on the basic of slate function Editor.unwrapNodes
// todo: split the unwrap by type the node which nearest to the selection

const unwrapNodesByTypeAtRange = (editor, options = {}) => {
  Editor.withoutNormalizing(editor, () => {
    const {
      split = false,
      voids = false,
      mode = 'all',
      at = editor.selection
    } = options;

    let { match } = options;

    if (!at) {
      return;
    }

    const matches = Editor.nodes(editor, { at, match, mode, voids });
    let node;

    for (match of matches) {
      node = match;
    }

    const pathRefs = Array.from([node], ([, p]) => Editor.pathRef(editor, p));
    for (const pathRef of pathRefs) {
      const path = pathRef.unref();
      const [node] = Editor.node(editor, path);
      let range = Editor.range(editor, path);
      if (split && Range.isRange(range)) {
        range = Range.intersection(at, range);
      }

      Editor.liftNodes(editor, {
        at: range,
        match: n => node.children.includes(n),
        voids,
      });
    }
  });
};

export default unwrapNodesByTypeAtRange;
