import React from 'react';
import { renderNode, renderLeaf, EditorUtils, decorationNode } from './editor-utils/common-editor-utils';
import { createEditor, Node, Editor } from 'slate';
import { withHistory } from 'slate-history';
import { deserialize, serialize } from '../utils/slate2markdown/index';
import { Editable, withReact, Slate } from 'sjq1-slate-react';
import withBlock from './controller/block-element-controller';
import withInline from './controller/inline-element-controller';
import withVoid from './controller/void-element-controller';
import withMarkdownShortcut from './controller/shortcut-controller';
import normalizeNode from './controller/normalize-controller';
import Plugin from './editor-plugin';
import TableUtils from '../editor/editor-utils/block-element-utils/table-utils';

import './code-highlight-package';
import '../css/textlink-hovermenu.css';
import '../css/article.css'
import '../css/image.css';
import '../css/link.css';


const list = [createEditor, withReact, withHistory, withInline, withBlock, withVoid, withMarkdownShortcut, normalizeNode];

class SimpleEditor extends React.Component {
  constructor(props) {
    super(props);
    this.editor = list.reduce((current, next) => next(current), list[0]());
    this.props.refEditor({exec: this.editor.exec, getValue: this.getValue});

    this.editorUtils = new EditorUtils(this.editor);
    this.tableUtils = new TableUtils(this.editor);
    this.plugin = new Plugin(this.editor);
    this.editorRef = null;
    this.contextMenuPosition = {};
    this.state = {
      value: deserialize(props.value),
      isShowContextMenu: false,
    };
    this.editor.onSave = () => {
      const value = this.getMarkdown();
      props.onSave && props.onSave(value);
    };
  }

  onChange = (value) => {
    this.setState({
      value: value
    });

    // hide context menu when content change
    if (this.state.isShowContextMenu === true) {
      this.setState({
        isShowContextMenu: false
      });
      this.contextMenuPosition = {};
    }

    const operations = this.editor.operations;
    const hasChange = operations.some(o => o.type !== 'set_selection' && o.type !== 'set_value');
    if (hasChange) this.contentChanged = true;
  };

  foucsEditor = () => {
    this.editorRef.firstChild.focus();
  }

  componentDidMount() {
    this.focusText();
  }

  focusText = () => {
    // In dtable long text editor, press the key to open the editor.
    // Then the cursor should move to the end of this character.
    const { focusEnd, value } = this.props;
    if (focusEnd === true && value.length === 1) {
      setTimeout(() => {
        Editor.select(this.editor, { path: [0, 0], offset: 1 });
      }, 1);
    }
  }

  getMarkdown() {
    return serialize(this.state.value);
  }

  getValue() {
    return this.state.value;
  }

  onContextMenu = (event) => {
    if (this.tableUtils.isInTable()) {
      event.preventDefault();
      this.contextMenuPosition = {
        left: event.clientX,
        top: event.clientY
      };

      this.setState({
        isShowContextMenu: !this.state.isShowContextMenu
      });
    }
  }

  render() {
    const { value } = this.state;
    const { editor, foucsEditor } = this;
    const { readOnly } = this.props;
    return (
      <div>
        <Slate editor={this.editor} value={value}
          onChange={this.onChange}
        >
          <div className="editor-container">
            <div ref={(ref) => this.editorRef = ref} onClick={(value.length === 1 && value[0].type === 'paragraph' && Node.text(value[0].children[0]).length === 0) ?
              foucsEditor : null}
            className="editor article"
            >
              <Editable
                renderElement={(props) => renderNode(props, editor, readOnly)}
                className={'editor-component'}
                renderLeaf={renderLeaf}
                onContextMenu={this.onContextMenu}
                onCopy={(event) => {this.plugin.onCopy(event, editor);}}
                onCut={(event) => this.plugin.onCut(event)}
                autoFocus
                onKeyDown={this.plugin.onKeyDown}
                decorate={decorationNode}
              />
            </div>
          </div>
        </Slate>
      </div>
    );
  }

}

export default SimpleEditor;
