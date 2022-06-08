# Editor
This is a WYSIWYG markdown editor based on commands.
The editor is based on slate.

## Start
### Install package
```
npm i wysiwyg-md-editor
```
### Use editor
The package export an react component `MdEditor`, 

```javascript
MdEditor.propTypes = {
  value: String, // the initial markdown string
  onSave: Function(value: Markdown string), // callback function when press 'mod + s' to save content 
  refEditor: Function(editor: Editor), // ref the editor
  readOnly: Boolean, // is editor read only
};

Editor: {
  exec: Function, // execute command to edit
  getValue: Function, // get current markdown value
};
```

```javascript
import MdEditor from 'wysiwyg-md-editor';

class Editor extends React.Component {

  refEditor = (editor) => {
    // cache the editor
    this.editor = editor;
  }

  onSave = (value) => {
    uploadMarkdwon(value);
  }

  render() {
    return (
      <MdEditor
        readOnly={false}
        refEditor={this.refEditor}
        onSave={this.onSave}
        value={'## initial content'}
      />
    );
  }
}
```

you can also use the component in a function component

## Shortcut

### Header shortcuts
The editor supprot the most part of markdown shortcut

`#` + `SPACE` header one

`##` + `SPACE` header two

....

`######` + `SPACE` header six

### List shortcuts

`*`/`-` + `SPACE` unorder list

`1.` + `SPACE` order list

`TAB` increase list item depth

`SHIFT + ENTER` insert a new paragraph in list item

`ENTER` insert new list item

`SHIFT + TAB` decrease list item depth

### Mark shortcuts

**content**/__content__ + `SPACE` bold

`content` `SPACE` code

***content***/___content___ + `SPACE` italic

### Code block shortcuts
``` + `SPACE`/SPACE*4  generate code block

`TAB`  increase indent

`ENTER` insert a new code line

`COMMAND/CTRL` + `ENTER` exit code block

### Quote shortcuts
`>` + `SPACE` generate a quote

`ENTER` exit qupte

### Table shortcuts

`ENTER` insert table line

`COMMAND/CTRL` + `ENTER` exit table

`TAB` focus next table cell

`SHIFT` + `TAB` focus previous table cell

### Save file
`COMMAND/CTRL` + `S` Save markdown content

## Command

### Set Header
set paragraph to header or header to paragraph
```js
editor.exec({type: 'set_header', headerType: 'header_one/two.../paragraph'});
```

### Set mark
set text to mark
```js
  editor.exec({type: 'format_text', properties: {[ITALIC/CODE/BOLD]: true}});
```

### Set block element

#### Set blockquote

```js
// set current selection content to blockquote
this.editor.exec({type: 'set_blockquote'});
```

```js
// set current blockquote to paragraph
editor.exec({type: 'unwrap_blockquote'});
```

#### Set code block

```js
// unwrap current code block
editor.exec({type: 'unwrap_code_block'});
```

```js
// wrap current selected content to code block
editor.exec({type: 'set_code_block'});
```

#### Set list

```js
//  wrap current selected content to list
editor.exec({type: 'set_ordered_list/unordered_list'});
```

```js
// unwrap list
editor.exec({type: `unwrap_ordered_list/unordered_list`});
```

#### Set table
```js
// insert a new table
editor.exec({type: 'insert_table', data: {rowCount: Number, columnCount: Number});
```

```js
// inset a new table column when selection is in table
editor.exec({type: 'insert_column'});

// remove a column
editor.exec({type: 'remove_column'});

// insert a new row
editor.exec({type: 'insert_row'});

// remove a table row
editor.exec({type: 'remove_row'});

// set current column align
editor.exec({type: 'set_table_cell_align', align: 'right'/'left'});
```

### Set inline elements

#### Set link

```js
// inset a link
editor.exec({ type: 'insert_link', {url, text}});

// set current selected link to text
editor.exec({type: 'unwrap_link'})
```

#### Set image

```js
// insert image at selection
editor.exec({type: 'insert_image', data: {src: data.url}});
```

### Clear format

clear all format

```javascript
editor.exec({type: 'clear_format'});
```


## Next
Supprot math formula and image upload