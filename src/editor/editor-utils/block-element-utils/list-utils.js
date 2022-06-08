import { Node, Range, Path, Editor } from 'slate';
import { CustomEditor } from '../../custom/custom';
import getEventTransfer from '../../custom/get-event-transfer';
import { htmlDeserializer } from '../../../utils/deserialize-html';
import { normailizeSelection } from '../selection-utils';


class LitsUtils {
  
  constructor(editor) {
    this.editor = editor;
  }

  unwrapList = () => {
    // defer normalization util the unwrap operartions completed
    CustomEditor.withoutNormalizing(this.editor, () => {
      normailizeSelection(this.editor);
      // selected list item
      const selectedListItem = this.getCurrentListItem();
      // first selected item path and node
      const firstSelectedItem = selectedListItem[0];
      const firstSelectedItemPath = firstSelectedItem[1];
      // get selected list and the path of the list
      const selectedListPath = firstSelectedItemPath.slice(0, firstSelectedItemPath.length - 1);
      const selectedList = Node.get(this.editor, selectedListPath);
      // get the node and path of parent of selected list
      const listParent = Node.parent(this.editor, selectedListPath);
      const listParentPath = selectedListPath.slice(0, selectedListPath.length - 1);
  
      // unwrap list of selected list item
      // if the type of parent of selected list is a list and it should be a list item
      if (listParent.type && listParent.type.includes('list')) {
        // get the path of parent of listParent
        const ancesstorPath = listParentPath.slice(0, listParentPath.length - 1);
        const lastSelectedListItem = selectedListItem.slice(-1)[0];
        const lastSelectedListItemPath = lastSelectedListItem[1];
        const lastSelectedListItemIndex = lastSelectedListItemPath.slice(-1)[0];
        const unSelectedListItem = selectedList.children.slice(selectedListItem.slice(-1)[0][1].slice(-1)[0] + 1);
  
        // insert a new list to the last selected list item
        if (!(lastSelectedListItemIndex === selectedList.children.length - 1)) {
          CustomEditor.insertNodes(this.editor, {type: selectedList.type, children: []}, {at: [...lastSelectedListItemPath, lastSelectedListItem[0].children.length]});
        }
  
        // move the unselected list item to the new created list
        unSelectedListItem.forEach((item, index) => {
          CustomEditor.moveNodes(this.editor, {
            at: [...lastSelectedListItemPath.slice(0, -1), lastSelectedListItemIndex + 1],
            to: [...lastSelectedListItemPath, lastSelectedListItem[0].children.length, index]
          });
        });
        let currentItemPath = firstSelectedItemPath;
        const startIndexOfItemInNewList = listParentPath[listParentPath.length - 1] + 1;
  
        // move item to outer list by path
        selectedListItem.forEach((item, index) =>{
          const itemTargetPath = [...ancesstorPath, index + startIndexOfItemInNewList];
          CustomEditor.moveNodes(this.editor, {
            at: currentItemPath,
            to: itemTargetPath
          });
        });
  
        const currentList = Node.get(this.editor, selectedListPath);
        // delete empty list
        if (!currentList.children[0] || currentList.children[0].type !== 'list_item') {
          CustomEditor.removeNodes(this.editor, {at: selectedListPath});
        }
      } else {
        // unwrap list item if the selected list is the outest of the root
        const firstListItemIndex = firstSelectedItem[1].slice(-1)[0];
        let restCount = 0;
        selectedListItem.forEach((item) =>{
          CustomEditor.unwrapNodesByTypeAtRange(this.editor, {match:{type: 'list_item'}, mode: 'highest', at: [...selectedListPath, firstListItemIndex + restCount]});
          restCount += item[0].children.length;
        });
        const startItemRange = Editor.range(this.editor, [...selectedListPath, firstListItemIndex]);
        const endItemRange = Editor.range(this.editor, [...selectedListPath, firstListItemIndex + restCount - 1]);
        CustomEditor.unwrapNodesByTypeAtRange(this.editor, {match: [{type: selectedList.type}], split: true, mode: 'highest', at: {anchor: startItemRange.anchor, focus: endItemRange.focus}});
      }
    });
  }

  wrapList = (type) => {
    normailizeSelection(this.editor);
    const { selection } = this.editor;
    const focusPath = selection.focus.path;
    const anchorPath = selection.anchor.path;
    if (Path.equals(focusPath, anchorPath)) {
      const [block, path] = CustomEditor.match(this.editor, this.editor.selection, 'block');
      Editor.withoutNormalizing(this.editor, (editor) => {
        CustomEditor.wrapNodes(this.editor, { type: 'list_item', children: [block], data: {} }, { at: path });
        CustomEditor.wrapNodes(this.editor, { type, children: [] }, { split: false, at: path });
      });
      return;
    }
    const commonPath = Path.common(focusPath, anchorPath);
    const commonAncestor = Node.get(this.editor, commonPath);
    const startIndex = anchorPath[commonPath.length];
    const endIndex = focusPath[commonPath.length];
    // get hightest selected commonAncestor block items
    const selectedBlock = commonAncestor.children.slice(startIndex, endIndex + 1);
    Editor.withoutNormalizing(this.editor, (editor) => {
      selectedBlock.forEach((blockItem, index) => {
        // wrap block into list
        if (!blockItem.type.includes('list')) {
          CustomEditor.wrapNodes(this.editor, { type: 'list_item', children: [blockItem], data: {} }, { at: [...commonPath, startIndex + index] });
          CustomEditor.wrapNodes(this.editor, { type, children: [] }, { split: false, at: [...commonPath, startIndex + index] });
        }
      });
    });
  }

  // unwrap list wrap list
  getCurrentListItem = () => {
    const selection = this.editor.selection;
    if (!selection) {
      return [];
    }

    if (Range.isCollapsed(selection)) {
      // get the nearest ancesstor of block, judge if the ancesstor is list item to compat the possibility that
      // a code block or blockquote in a list item
      const block = CustomEditor.match(this.editor, this.editor.selection, 'block');
      const blockPath = block[1];
      const blockParent = Node.parent(this.editor, blockPath);
      if (blockParent.type && blockParent.type.indexOf('list') < 0) {
        return [];
      }
      const listItemNodes = CustomEditor.nodes(this.editor, {match: {type: 'list_item'}});
      let listItemNode;
      for (const item of listItemNodes) {
        listItemNode = item;
      }
      if (listItemNode) {
        return [listItemNode];
      }
      return [];
    }

    const focusPath = selection.focus.path;
    const anchorPath = selection.anchor.path;
    const [startItem] = CustomEditor.nodes(this.editor, {match: 'block', at: anchorPath});
    const [endItem] =CustomEditor.nodes(this.editor, {match: 'block', at: focusPath});
    const [, startPath] = startItem;
    const [, endPath] = endItem;
    if (Path.equals(startPath, endPath)) {
      const blockParent = Node.parent(this.editor, startPath);
      if (!blockParent.type || blockParent.type.indexOf('list') < 0) {
        return [];
      }      
      return [[blockParent, startPath.slice(0, -1)]];
    }

    const commonPath = Path.common(focusPath, anchorPath);
    const commonAncestor = Node.get(this.editor, commonPath);
    const nodeType = commonAncestor.type;
    if (nodeType === 'ordered_list' || nodeType === 'unordered_list') {
      const startIndex = anchorPath.slice(commonPath.length)[0];
      const endIndex = focusPath.slice(commonPath.length)[0];
      const selectedListItem = [];
      for(let index = startIndex; index <= endIndex; index++) {
        selectedListItem.push([commonAncestor.children[index], [...commonPath, index]]);
      }
      return selectedListItem;
    } else if (nodeType === 'list_item') {
      return [[commonAncestor, commonPath]];
    }

    return [];
  }

  increaseListDepth = () => {
    const listNodes = CustomEditor.nodes(this.editor, { match: { type: 'list_item' } });

    let node;
    
    //get the nearest list_item of current selection
    for (let item of listNodes) {
      node = item;
    }

    // if current list item is the first child of the list return
    const listItemPath = [...node[1]];
    
    if (listItemPath[listItemPath.length - 1] === 0) return;
    
    const listNode = Node.parent(this.editor, listItemPath);
    const listItemIndex  = listItemPath.pop();
    const listNodePath = listItemPath;
    const previousListItem = listNode.children[listItemIndex - 1];
    const previousListItemPath = [...listNodePath, listItemIndex - 1];
    const lastIndex = previousListItem.children.length;
    const newListPath = [...previousListItemPath, lastIndex];
    // Deferring normalization list untils after operations completes.
    CustomEditor.withoutNormalizing(this.editor, () => {
      CustomEditor.insertNodes(this.editor, {type: listNode.type, children: []}, {at: newListPath, split: true});
      const newListItemPath = [...newListPath, 0];
      CustomEditor.moveNodes(this.editor, {
        at: node[1],
        to: newListItemPath
      });
    });
  }

  isInlist = () => {
    const node = this.getCurrentListItem();
    if (node.length > 0) return true;
    return false;
  }

  /**
   * When copying a sublist, the list item in the list returned by slate contains only one sublis,
   * pasting the list item directly into the list will produce an incorrect list structure,
   * the list item that contains only one list need to flatten
   * Input: {type: 'list', children: [{type: 'list_item', children: [{type: 'list', children[{type: 'list_item'}, ...]}]}]}
   * Output: [{type: 'list_item'},....]
  */

  getNormalizedListItems = (list) => {
    const listItems = [];
    list.children.forEach((listItem) => {
      const children = listItem.children || [];
      const child = children[0];
      if (child && child.type.includes('_list') && children.length === 1) {
        listItems.push(...this.getNormalizedListItems(child));
      } else {
        listItems.push(listItem);
      }
    });
    return listItems;
  }

  pasteContentInList = (command) => {
    const data = command.data;
    let { fragment, text, type, html } = getEventTransfer(data);
    if (type === 'text' && !fragment) {
      const newText = text.replace(/\r\n|\n/g, ' ');
      CustomEditor.insertText(this.editor, newText);
      return;
    }
    
    if (type === 'html') {
      fragment = htmlDeserializer(html);
    }

    // insert fragment
    if (text.length > 0) {
      const newtext = text.replace(/\r\n|\n/g, ' ');
      const firstBlock = fragment[0];
      const firstBlockType = firstBlock.type;
      const currentItem = this.getCurrentListItem();
      const currentItemPath = currentItem[0][1];
      const currentItemIndex = currentItemPath[currentItemPath.length - 1];
      const listPath = currentItemPath.slice(0, currentItemPath.length - 1);
      if (firstBlockType === 'ordered_list' || firstBlockType === 'unordered_list') {
        const listItems = this.getNormalizedListItems(firstBlock);
        listItems.forEach((listItem, index) => {
          const itemChildren = listItem.children;
          if (itemChildren[0].type.includes('list')) {
            CustomEditor.insertNodes(this.editor, [itemChildren[0]]);
          } else {
            CustomEditor.insertFragment(this.editor, [itemChildren[0]]);
          }
          if (itemChildren.length > 1) {
            const currentListItem = Node.get(this.editor, [...listPath, currentItemIndex + index]);
            CustomEditor.insertNodes(this.editor, itemChildren.slice(1), {at: [...listPath, currentItemIndex + index, currentListItem.children.length]});
          }
          if (index < listItems.length - 1) {
            CustomEditor.insertNodes(this.editor, {type: 'list_item', data: {}, children: [{type: 'paragraph', children: [{text: ''}]}]}, {at: [...listPath, currentItemIndex + index + 1]});
            CustomEditor.select(this.editor, [...listPath, currentItemIndex + index + 1]);
          }
        });

        if (fragment.length > 1) {
          const outestListItem = CustomEditor.match(this.editor, this.editor.selection, {type: 'list_item'});
          const outestListItemPath = outestListItem[1];
          const outestListPath = outestListItemPath.slice(0, outestListItemPath.length - 1);
          const outestListIndex = outestListPath[outestListPath.length - 1];
          const nextBlockPath = [...outestListPath.slice(0, outestListPath.length - 1), outestListIndex + 1];
          CustomEditor.insertNodes(this.editor, fragment.slice(1), {at: nextBlockPath});
        }
      } else {
        if (fragment.length === 1 && fragment[0].type === 'paragraph') {
          CustomEditor.insertFragment(this.editor, fragment);
          return;
        }
        // insert text directly when the first block is not a list
        CustomEditor.insertText(this.editor, newtext);
      }
    } else {
      CustomEditor.insertFragment(this.editor, fragment);
    }
  }
}

export default LitsUtils;