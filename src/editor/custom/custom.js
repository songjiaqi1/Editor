
import { Editor } from 'slate';
import splitNodesAtPoint from './split-nodes-at-point';
import unwrapNodesByTypeAtRange from './unwrap-node-by-type-at-range';
import getNodesByTypeAtRange from './getNodesByTypeAtRange';
import { insertNodes } from './insertNodes';
import isEmptyParagraph from './is-empty-paragraph';

//due to some of the function of slate is not perfect now, add some custom fucntion to Editor and exported as CustomEditor

const CustomEditor = {
  ...Editor,
  splitNodesAtPoint,
  getNodesByTypeAtRange,
  unwrapNodesByTypeAtRange,
  insertNodes,
  isEmptyParagraph
};

export { CustomEditor };