import React from 'react';
import Modal from '../components/modal-portal';

class ViewerImage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowBigImage: false
    };
  }

  toggleBigImage = (event) => {
    event.preventDefault();
    this.setState({ isShowBigImage: !this.state.isShowBigImage });
  }

  renderBigImage = (src) => {
    return <BigImage src={src} toggleBigImage={this.toggleBigImage} />;
  }

  render() {
    const { attributes, node } = this.props;
    const { data } = node;
    const { isShowBigImage } = this.state;
    let src = data.src;

    let dom = (
      <span className="seafile-ed-image seafile-ed-image-viwer">
        <img draggable={false} src={src} alt="" { ...attributes }
          width={data.width} height={data.height}
        />
        <span onClick={this.toggleBigImage} className='image-full-button'>
          <i className={'iconfont icon-fullscreen'}></i>
        </span>
        {isShowBigImage && this.renderBigImage(src)}
      </span>
    );
    return src ? dom : <span { ...attributes }>Loading...</span>;
  }

}

const BigImage = (props) => {
  return (
    <Modal>
      <div className={'big-image-cover'} onClick={(event) => props.toggleBigImage(event)}>
        <div className={'big-image-container'}>
          <img src={props.src} alt="" />
        </div>
        <div onClick={(event) => props.toggleBigImage(event)} className={'image-container-close'}>
          <i className={'iconfont icon-close'}></i>
        </div>
      </div>
    </Modal>
  );
};

export { ViewerImage };
