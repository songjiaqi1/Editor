import React from 'react';
import InlineElementUtils from '../editor-utils/inline-element-utils';

class Image extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      width: null,
      isResizing: false,
    };
    this.inlineElementUtils = new InlineElementUtils();
  }

  startMove = (e) => {
    e.stopPropagation();
    this.setState({
      isResizing: true
    });
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mouseup', this.stopMove);
  }
  
  componentDidMount() {
    this.editor = document.querySelector('.editor-component');
  }

  stopMove = (e) => {
    e.stopPropagation();
    e.preventDefault();
    window.removeEventListener('mousemove', this.handleMove);
    let node = this.props.node;
    this.inlineElementUtils.adjustImageSize({ width: this.state.width, src: node.data.src});
    this.setState({
      isResizing: false,
    });
    window.removeEventListener('mouseup', this.stopMove);
  }

  handleMove = (e) => {
    e.stopPropagation();
    e.preventDefault();
    let changeX ;
    changeX = e.clientX - this.refs.resizer.getBoundingClientRect().left - 5;
    let imageWidth = this.refs.image.width + changeX;
    if (imageWidth >= this.editor.offsetWidth) {
      return;
    }
    if (imageWidth < 20) {
      return;
    }
    this.setState({
      width: imageWidth,
    });
  }

  componentWillUnmount() {
    this.refs.resizer = null;
    this.refs.image = null;
  }

  render() {
    const { attributes, node, isSelected, children } = this.props;
    const { isResizing } = this.state;
    const { data } = node;
    let src = data.src;
    let dom = (
      <span className="seafile-ed-image" { ...attributes }>  
        { isSelected || isResizing ?
          <React.Fragment>
            <img className="seafile-ed-image-inResizing" draggable={false}
              src={src} width={this.state.width || data.width}
              alt={' '}
              ref="image"/>
            {
              this.state.isResizing?
                <span contentEditable={false} className='image-size'>
                  <span>{this.props.t('width')}{':'}{parseInt(this.state.width || this.refs.image.clientWidth)}</span>
                  <span>&nbsp;&nbsp;</span>
                  <span>{this.props.t('height')}{':'}{this.refs.image.clientHeight}</span>
                </span>: null
            }
            {
              <span ref='resizer' onMouseDown={this.startMove} className={'image-resizer'}></span>
            }
          </React.Fragment>
          :
          <img width={data.width || ''} draggable={false} src={src}
            alt={' '}
            ref="image"/>
        }
        {children}
      </span>
    );
    return src ? dom : <span { ...attributes }>Loading...</span>;
  }
}

export default Image;

