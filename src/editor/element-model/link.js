
class Link {
  constructor(options) {
    this.type = options.type || 'link';
    this.children = options.children || [{text: ''}];
    this.data = options.data || {href: ''};
  }
}

const generateLinkElement = (options) => {
  return Object.assign({}, new Link(options));
};

export default generateLinkElement;