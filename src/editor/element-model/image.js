class Image {
  constructor(options) {
    this.type = options.type || 'image';
    this.data = options.data || {src: ''};
    this.children = options.children || [{text:''}];
  }
}

const generateImage = (options) => {
  return Object.assign({}, new Image(options));
};

export default generateImage;