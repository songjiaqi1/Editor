import { Editor, Path } from 'slate';

const BOLDITALICREG = /\*\*\*(\S+)\*\*\*|\_\_\_(\S+)\_\_\_|\*\_\_(\S+)\_\_\*|\_\*\*(\S+)\*\*\_|\_\_\*(\S+)\*\_\_|\*\*\_(\S+)_\*\*/;
const BOLDREG = /\*\*(\S+)\*\*|\_\_(\S+)\_\_/;
const ITALICREG = /\*(\S+)\*|_(\S+)_/;
const CODEREG = /\`(\S+)\`/;

class TextUtils {

  constructor(editor) {
    this.editor = editor;
  }

  // Get text related variables before current selection
  // block: Parent of current text node
  // range: From start of block to current selection
  // beforeText: The text of block from start to selection
  getTextInfoBeforeSelection = () => {
    const editor = this.editor;
    const selection = this.editor.selection;
    const { anchor } = selection;
    const [block] = Editor.nodes(editor, { match: 'block' });
    const path = block ? block[1] : [];
    const start = Editor.start(editor, path);
    const range = { anchor, focus: start };
    const beforeText = Editor.text(editor, range);
    
    return { range, beforeText,  block};
  }

  setTextMarkByShortCut = (exec, command) => {
    const editor = this.editor;
    const selection = editor.selection;
    const [textNode, textPath] = Editor.node(editor, selection);
    let text = textNode.text;
    const offset = selection.anchor.offset;
    const lastChart = text[offset - 1];
    let marks, markText, startOffset;
    let matched;
    if (lastChart === '_' || lastChart === '`' || lastChart === '*') {
      if (matched = text.match(BOLDITALICREG)) {
        startOffset = matched.index;
        marks = {BOLD: true, ITALIC: true};
      } else if (matched = text.match(BOLDREG)) {
        startOffset = matched.index;
        marks = {BOLD: true};
      } else if (matched = text.match(ITALICREG)) {
        startOffset = matched.index;
        marks = {ITALIC: true};
      } else if (matched = text.match(CODEREG)) {
        startOffset = matched.index;
        marks = {CODE: true};
      }

      if (matched) {
        for (let index = 1; index < matched.length; index ++) {
          if (matched[index]) {
            markText = matched[index];
            break;
          }
        }
        marks = Object.assign({BOLD: false, ITALIC: false, CODE: false}, marks);
        Editor.select(editor, {anchor: { path: textPath, offset: startOffset }, focus: { path: textPath, offset: offset }});
        Editor.delete(editor, editor.selection);
        // insert a space before mark
        Editor.insertText(editor, ' ');
        Editor.insertNodes(editor, [{text: markText, ...marks}, {text: ' '}]);
        const selectedPath = Path.next(Path.next(textPath));
        // select the next empty text node to escape the mark
        Editor.select(editor, selectedPath);
        Editor.collapse(editor, {edge: 'end'});
        return;
      }
    }
    exec(command);
  }
}

export default TextUtils;