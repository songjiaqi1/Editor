import { Editor } from 'slate';

class MarkUtils {
  constructor(editor) {
    this.editor = editor;
  }  

  getActiveMarks = () => {
    const marks = Editor.marks(this.editor);
    return marks;
  }

  setMark = (type) => {
    this.editor.exec({type: 'format_text', properties: {[type]: true}});
  }
}

export default MarkUtils;