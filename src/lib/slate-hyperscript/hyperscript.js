import isPlainObject from 'is-plain-object';
import {
  createAnchor,
  createCursor,
  createEditor,
  createElement,
  createFocus,
  createFragment,
  createSelection,
  createText,
} from './creators';

/**
 * The default creators for Slate objects.
 */

const DEFAULT_CREATORS = {
  anchor: createAnchor,
  cursor: createCursor,
  editor: createEditor,
  element: createElement,
  focus: createFocus,
  fragment: createFragment,
  selection: createSelection,
  text: createText,
};

const createHyperscript = (options = {}) => {
  const { elements = {} } = options;
  const elementCreators = normalizeElements(elements);
  const creators = {
    ...DEFAULT_CREATORS,
    ...elementCreators,
    ...options.creators,
  };

  const jsx = createFactory(creators);
  return jsx;
};

/**
 * Create a Slate hyperscript function with `options`.
 */

const createFactory = (creators) => {
  const jsx = (
    tagName,
    attributes,
    ...children
  ) => {
    const creator = creators[tagName];

    if (!creator) {
      throw new Error(`No hyperscript creator found for tag: <${tagName}>`);
    }

    if (attributes == null) {
      attributes = {};
    }

    if (!isPlainObject(attributes)) {
      children = [attributes].concat(children);
      attributes = {};
    }

    children = children.filter(child => Boolean(child)).flat();
    const ret = creator(tagName, attributes, children);
    return ret;
  };

  return jsx;
};

/**
 * Normalize a dictionary of element shorthands into creator functions.
 */

const normalizeElements = (elements) => {
  const creators = {};

  for (const tagName in elements) {
    const props = elements[tagName];

    if (typeof props !== 'object') {
      throw new Error(
        `Properties specified for a hyperscript shorthand should be an object, but for the custom element <${tagName}>  tag you passed: ${props}`
      );
    }

    creators[tagName] = (
      tagName,
      attributes,
      children
    ) => {
      return createElement('element', { ...props, ...attributes }, children);
    };
  }

  return creators;
};

export { createHyperscript };
