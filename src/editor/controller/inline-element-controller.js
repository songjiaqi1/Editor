import { Editor, Range } from 'slate';
import generateLinkElement from '../element-model/link';
import generateImageElement from '../element-model/image';

const withInline = (editor) => {

  const { exec, isInline } = editor;

  editor.isInline = element => {
    return element.type === 'link' ||  element.type === 'image' ? true : isInline(element);
  };

  editor.exec = (command) => {
    const data = command.data;
    let { selection } = editor;
    switch (command.type) {
    case 'insert_link_at_selection':
      selection = command.elementData.selection;
      const isCollapsed = selection && Range.isCollapsed(selection);
      const link = generateLinkElement({
        type: 'link',
        children: [{text: command.elementData.text}],
        data: {href: command.elementData.url}
      });

      if (isCollapsed) {
        Editor.insertNodes(editor, link, {at: selection});
      } else {
        Editor.wrapNodes(editor, link, {split: true, at: selection});
        Editor.select(editor, selection);
        Editor.collapse(editor, { edge: 'end' });
      }
      break;
    case 'unwrap_link':
      Editor.unwrapNodes(editor, { match: { type: 'link' } });
      break;
    case 'set_link':
      selection = command.elementData.selection;
      Editor.removeNodes(editor, {match: {type: 'link'}, at: selection});
      const newNodeLink = generateLinkElement({
        type: 'link',
        data: {href: command.elementData.url},
        children: [{text: command.elementData.text}]
      });
      // Insert a new link at previous link path
      let linkPath = [...selection.anchor.path];
      linkPath.pop();
      Editor.insertNodes(editor, newNodeLink, {at: linkPath});
      break;
    case 'insert_image_at_selection':
      const img = generateImageElement({data: command.data});
      Editor.insertNodes(editor, img, {at: command.at});
      break;
    case 'set_image':
      Editor.setNodes(editor, {
        data: data,
      }, {match: {type: 'image'}, at: editor.selection, voids: true});
      break;
    case 'insert_data':
      exec(command);
      break;   
    default:
      exec(command);
      break;
    }
  };
  return editor;
};

export default withInline;