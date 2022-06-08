import React from 'react';
import { Editor } from 'slate';

class CodeBlock extends React.PureComponent {

  onChange = (event) => {
    const { editor } = this.props;
    const language = event.target.value;
    Editor.setNodes(editor, { data: {syntax: language} }, {match: { type: 'code_block' }});
  }

  render() {
    const { attributes, children, node, isSelected, readOnly } = this.props;
    let language = node.data.syntax;
    return (
      <div className={'code-container'}>
        <pre className={'code'} {...attributes}>
          <code>
            {children}
          </code>
        </pre>
        {isSelected? <LanguageSet disabled={readOnly} language={language} onChange={this.onChange}/>: null}
      </div>
    );
  }
}


class LanguageSet extends React.PureComponent {

  componentDidMount() {
    // Compat chrome browser in windows, stop propagation to prevent emit the click event added to document
    this.selector.addEventListener('click', this.stopPropagation);
  }

  stopPropagation = (event) => {
    event.stopPropagation();
  }

  componentWillUnmount() {
    this.selector.removeEventListener('click', this.stopPropagation);
  }

  render() {
    return (
      <div contentEditable={false} className="language-type">
        <select ref={(ref) => this.selector = ref} value={this.props.language} disabled={this.props.disabled} name="language" onInput={(event) => event.stopPropagation()}  onChange={this.props.onChange}>
          <option value="none">Text</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="javascript">Javascript</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="sql">Sql</option>
          <option value="swift">Swift</option>
          <option value="json">JSON</option>
        </select>
      </div>
    );
  }
}

export default CodeBlock;