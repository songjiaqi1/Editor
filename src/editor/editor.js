import React from 'react';
import SimpleEditor from './simple-editor';
import LoadScript from './load-script';

class SimpleEditorWithErrorBoundary extends React.Component {

  componentDidCatch(error) {
    this.forceUpdate();
  }

  render() {
    return (
      <SimpleEditor
        {...this.props}
      />
    );
  }
}

export { SimpleEditorWithErrorBoundary as SimpleEditor };
