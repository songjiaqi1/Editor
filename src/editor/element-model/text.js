class Text {
  constructor(options) {
    this.text = options.text || '';
  }
}

const generateTextElement = (options) => {
  return Object.assign({}, new Text(options));
} 

export default generateTextElement;