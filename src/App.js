import React from 'react';
import { SimpleEditor } from './editor/editor';

class Editor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      value: props.value || '',
    }
  }

  refEditor = (editor) => {
    console.log(editor);
  }

  onSave = (value) => {
    console.log(value);
  }

  render() {
    return (
      <SimpleEditor
        readOnly={false}
        refEditor={this.refEditor}
        onSave={this.onSave}
        value={'wwwww'}
      />
    );
  }
}

export default Editor;
