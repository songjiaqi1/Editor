import React from 'react';
import '../../css/formula.css';

class Formula extends React.Component {

  toggleFormulaEditor = () => {
    window.richMarkdownEditor.onToggleFormulaDialog();
  }

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

  componentDidUpdate(preProps) {
    if (preProps.node.data.formula === this.props.node.data.formula) return;
    this.renderFormula();
  }

  render() {
    const { attributes, children, isSelected } = this.props;
    return (
      <span onDoubleClick={this.toggleFormulaEditor} className={'block-formula ' + (isSelected ? ' selected-formula' : '')} {...attributes}>
        <span contentEditable={false} ref={(ref) => this.formulaContainer = ref}></span>
        <span contentEditable={false}>{children}</span>
      </span>
    );
  }
}

export default Formula;
