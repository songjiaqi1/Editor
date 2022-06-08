class Blockquote {
  constructor(options) {
    this.type = options.type || 'blockquote';
    this.children = options.children || [{text:''}];
  }
}

const generateBlockquote = (options) => {
  return Object.assign({}, new Blockquote(options));
};

export default generateBlockquote;