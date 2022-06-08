import { CustomEditor } from '../../custom/custom';

class FormulaUtils {

  constructor(editor) {
    this.editor = editor;
  }

  isFormulaActive() {
    const nodes = CustomEditor.match(this.editor, this.editor.selection, {type: 'formula'});
    if (nodes) {
      return true;
    }
    return false;
  }

  insertFormula(data) {
    CustomEditor.insertNodes(this.editor, {type: 'formula', children: [{text: ''}], data}, {at: data.at, void: true});
  }

  setFormula(data) {
    const { formula, at } = data;
    CustomEditor.setNodes(this.editor, {data: { formula }}, {at, void: true});
  }
}

export default FormulaUtils;