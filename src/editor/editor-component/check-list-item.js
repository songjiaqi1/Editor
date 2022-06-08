
import React from 'react';
import { Editor } from 'slate';
import { ReactEditor } from 'sjq1-slate-react';

class CheckListItem extends React.PureComponent {

  onChange = event => {
    const editor = this.props.editor;
    const checked = event.target.checked;
    const path = ReactEditor.findPath(editor, this.props.element);
    Editor.setNodes(editor, {data: {checked}}, {at: path});
  }

  render() {
    const { attributes, children, element } = this.props;
    const checked = element.data.checked;
    return (
      <li {...attributes} className={'task-list-item ' + this.props.className} >
        <div contentEditable={false}><input type="checkbox" checked={checked} onChange={this.onChange} /></div>
        {children}
      </li>
    );
  }

}

export default CheckListItem;
