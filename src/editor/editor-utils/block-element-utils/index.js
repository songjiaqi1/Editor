import { Editor } from 'slate';

class BlockElementUtils {
  constructor(editor) {
    this.editor = editor;
  }

  getActiveHeader = (types) => {
    const { selection } = this.editor;
    if (!selection) return false;
    let match = Editor.match(this.editor, selection, types);
    if (!match) return [{type: 'paragraph'}];
    return match;
  }

  isBlockActive = (type) => {
    const { selection } = this.editor;
    if (!selection) return false;

    const [match] = Editor.nodes(this.editor, {
      match: { type: type }
    });

    return !!match;
  }
}

export default BlockElementUtils;