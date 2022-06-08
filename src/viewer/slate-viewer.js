import React from 'react';
import PropTypes from 'prop-types';
import { decorationNode } from '../editor/editor-utils/common-editor-utils';
import { Editable, withReact, Slate } from 'sjq1-slate-react';
import '../editor/code-highlight-package';

import { createEditor } from 'slate';
import { renderNode, renderLeaf } from '../utils/render-slate';

const propTypes = {
  value: PropTypes.array.isRequired,
};

const withVoid = (editor) => {
  const { isVoid } = editor;
  editor.isVoid = (element) => {
    return element.type === 'image' || element.type === 'formula' ? true : isVoid(element);
  };
  return editor;
};

const withInline = (editor) => {
  const { isInline } = editor;
  editor.isInline = element => {
    return element.type === 'link' || element.type === 'image' ? true : isInline(element);
  };
  return editor;
};

class SlateViewer extends React.Component {
  constructor(props) {
    super(props);
    this.editor = withInline(withVoid(withReact(createEditor())));
    window.viewer = this.editor;
  }

  render() {
    const { value, renderDiffElement, renderDiffLeaf } = this.props;
    return (
      <div className='article'>
        <Slate editor={this.editor} value={value}>
          <Editable
            readOnly
            className={'viewer-component'}
            decorate={decorationNode}
            renderElement={renderDiffElement ? renderDiffElement : renderNode}
            renderLeaf={renderDiffLeaf ? renderDiffLeaf : renderLeaf}
          />
        </Slate>
      </div>
    );
  }
}

SlateViewer.propTypes = propTypes;

export default SlateViewer;
