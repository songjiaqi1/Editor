import { Editor, Range } from 'slate';

/** Triple-click can set the selection focus point to
 *  the start of the following block node.
 *  Use this function to reset the selection focus point to the end of the previous block node
 *  */
export const normailizeSelection = (editor) => {
  const { selection } = editor;
  if (!selection) return false;
  const { anchor, focus } = selection;
  if (Range.isCollapsed(selection)) return;
  if (focus.offset !== 0) return;
  const [node] = Editor.nodes(editor, { match: 'block', at: focus });
  if (!node) return;
  if (Editor.isStart(editor, focus, node[1])) {
    const newFocusNode = Editor.before(editor, focus);
    const newSelection = { anchor, focus: newFocusNode };
    Editor.select(editor, newSelection);
  }
};