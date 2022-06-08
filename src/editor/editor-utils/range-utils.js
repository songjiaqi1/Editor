import { Range } from 'slate';

const isRangeCollapsed = (range) => {
  if (range) {
    return Range.isCollapsed(range);
  }
};

export { isRangeCollapsed };