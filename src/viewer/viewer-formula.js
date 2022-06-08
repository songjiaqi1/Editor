import React from 'react';
import '../css/richeditor/formula.css';

class ViewerFormula extends React.Component {

  componentDidMount() {
    const { node } = this.props;
    if (!node.data.formula) return;
    this.renderFormula();
  }

  renderFormula = () => {
    const { node } = this.props;
    this.formulaContainer.innerHTML = '';
    const formula = node.data.formula;
    const dom = window.MathJax.tex2svg(formula);
    this.formulaContainer.appendChild(dom);
  }

  render() {
    const { attributes, children } = this.props;
    return (
      <span className={'block-formula'} {...attributes}>
        <span contentEditable={false} ref={(ref) => this.formulaContainer = ref}></span>
        <span contentEditable={false}>{children}</span>
      </span>
    );
  }
}

export default ViewerFormula;