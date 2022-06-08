import React from 'react';
import Loading from '../components/loading';

// load mathjax.js first before show editor
class LoadScript extends React.Component {

  constructor(props) {
    super(props);
    if (!props.scriptSource || window.MathJax) { 
      this.state = { isScriptLoaded: true };
      return;
    }

    window.canInsertFormula = true;
    if (!window.MathJax) {
      // config mathjax
      window.MathJax = {
        options: {
          enableMenu: false
        },
        tex: {
          inlineMath: [['$', '$']],
          displayMath: [['$$', '$$']]
        },
        svg: {
          fontCache: 'global'
        }
      };
      this.state = { isScriptLoaded: false };
      this.loadScript();
    }
  }

  // load mathjax 
  loadScript = () => {
    if (!this.props.scriptSource) return;
    if (!document.querySelector('#mathjax')) {
      const script = document.createElement('script');
      script.src = this.props.scriptSource;
      script.id = 'mathjax';
      document.body.appendChild(script);
      script.onload = () => {
        this.setState({isScriptLoaded: true});
      };
    }
  };

  render() {
    const { isScriptLoaded } = this.state;
    return isScriptLoaded ? this.props.children : <Loading/>;
  }
}

export default LoadScript;