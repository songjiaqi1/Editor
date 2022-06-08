import { Editor } from 'slate';

class InlineElementUtils {
  constructor(editor) {
    this.editor = editor;
  }

  isLinkActive = () => {
    const [link] = Editor.nodes(this.editor, { match: { type: 'link' } });
    return !!link;
  }

  getLinkText = (linkNode) => {
    let linkText = '';
    linkNode.children.forEach((textNode) =>{
      linkText += textNode.text;
    });
    return linkText;
  }

  getCurrentLinkNode = () => {
    const [link] = Editor.nodes(this.editor, { match: { type: 'link' } });
    if (link) {
      return link[0];
    }
    return null;
  }

  unwrapLink = () => {
    this.editor.exec({type: 'unwrap_link'});
  }

  insertLink = (elementData) => {
    this.editor.exec({ type: 'insert_link_at_selection', elementData });
  }

  setLink = (elementData) => {
    this.editor.exec({type: 'set_link', elementData});
  }

  insertImage = (data) => {
    this.editor.exec({type: 'insert_image_at_selection', data: {src: data.url}, at: data.selection});
  }

  adjustImageSize(options) {
    let data = Object.assign({}, {}, options);
    this.editor.exec({type: 'set_image', data});
  }
}

export default InlineElementUtils;