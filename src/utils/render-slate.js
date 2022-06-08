import React from 'react';
import CheckListItem from '../editor/editor-component/check-list-item';
import Formula from '../viewer/viewer-formula';
import { ViewerImage } from '../viewer/viewer-image';

function renderNode({ attributes, children, element }) {
  let node = element;
  let data = node.data ? node.data : {};
  let checked = data.checked;
  let align = data.align;
  let href = data.href;
  const diffClass= data.diff_state;
  const diffIndex = data.new_index;
  align = ['left', 'right', 'center'].indexOf(align) === -1 ? 'left' : align;
  switch (node.type) {
  case 'paragraph':
    return <p className={diffClass ? (diffClass + ' ' + (data['paragraph_state'] ? data['paragraph_state'] : '')) : ''} {...attributes}>{children}</p>;
  case 'blockquote':
    return <blockquote {...attributes}>{children}</blockquote>;
  case 'header_one':
    return <h1 {...attributes} id={'user-content-' + node.children[0].text}>{children}</h1>;
  case 'header_two':
    return <h2 {...attributes} id={'user-content-' + node.children[0].text}>{children}</h2>;
  case 'header_three':
    return <h3 {...attributes} id={'user-content-' + node.children[0].text}>{children}</h3>;
  case 'header_four':
    return <h4 {...attributes}>{children}</h4>;
  case 'header_five':
    return <h5 {...attributes}>{children}</h5>;
  case 'header_six':
    return <h6 {...attributes}>{children}</h6>;
  case 'list_item':
    if (checked === undefined)
      return <li value={diffIndex? (diffIndex >=0 ? diffIndex + 1 : data['old_index'] + 1): ''} className={diffClass? diffClass: ''} {...attributes}>{children}</li>;
    return (
      <CheckListItem className={diffClass? diffClass: ''} {...{ attributes, children, element }} />
    );
  case 'unordered_list':
    return <ul className={diffClass? diffClass: ''} {...attributes}>{children}</ul>;
  case 'ordered_list':
    return <ol className={diffClass? diffClass: ''} {...attributes}>{children}</ol>;
  case 'image':
    return <ViewerImage {...{attributes, children, node }}/>;
  case 'code_block':
    return (
      <pre className={'code-container'}>
        <code className={'code'} {...attributes}>{children}</code>
        <LanguageSet disabled lang={node.data.syntax}/>
      </pre>
    );
  case 'code_line':
    return <p {...attributes}>{children}</p>;
  case 'table':
    return (
      <table>
        <tbody {...attributes}>{children}</tbody>
      </table>
    );
  case 'table_row':
    return <tr className={diffClass? diffClass: ''} {...attributes}>{children}</tr>;
  case 'table_cell':
    return (
      <td className={diffClass? diffClass: ''} style={{ textAlign: align }} {...attributes}>
        {children}
      </td>
    );
  case 'link':
    return (
      <a className={diffClass? diffClass: ''} {...attributes} href={ href }>{children}</a>
    );
  case 'hr':
    return (
      <hr {...attributes}/>
    );
  case 'formula':
    return (
      <Formula className={diffClass ? diffClass: ''} node={node} children={children} {...attributes}/>
    );
  default : 
    return (
      <p  {...attributes}>{children}</p>
    );
  }
}

const renderLeaf = ({ attributes, children, leaf }) => {

  if (leaf.BOLD) {
    children = <strong>{children}</strong>;
  }

  if (leaf.CODE) {
    children = <code>{children}</code>;
  }

  if (leaf.ITALIC) {
    children = <i>{children}</i>;
  }

  if (leaf.DELETE) {
    children = <del>{children}</del>;
  }

  if (leaf.ADD) {
    children = <ins>{children}</ins>;
  }

  if (leaf.decoration) {
    return  <span className={`token ${leaf.type}`}>{children}</span>;
  }

  return <span {...attributes}>{children}</span>;
};

class LanguageSet extends React.PureComponent {

  render () {
    return (
      <div className="language-type">
        <select value={this.props.lang} disabled name="language">
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
        </select>
      </div>
    );
  }
}

export  { renderNode, renderLeaf };
