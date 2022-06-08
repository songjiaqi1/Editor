# Editor
This is a WYSIWYG markdown editor based on commands.

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
`#` `SPACE` header one
`##` `SPACE` header two
....
`######``SPACE` header six

### List shortcuts

`*`/ `-` `SPACE` unorder list
`1.` `SPACE` order list

`TAB` increase list item depth
`SHIFT + ENTER` insert a new paragraph in list item
`ENTER` insert new list item
`SHIFT + TAB` decrease list item depth

### Mark shortcuts
**content**/__content__ `SPACE` bold
`content` `SPACE` code
***content***/___content___ `SPACE` italic

### Code block shortcuts
``` + `SPACE`/SPACE*4  generate code block
`TAB`  increase indent
`ENTER` insert a new code line
`COMMAND/CTRL` `ENTER` exit code block

### Quote shortcuts
`>` `SPACE` generate a quote
`ENTER` exit qupte

### Table shortcuts

`ENTER` insert table line
`COMMAND/CTRL` `ENTER` exit table
`TAB` focus next table cell
`SHIFT` `TAB` focus previous table cell

### Save file
`COMMAND/CTRL` `S` Save markdown content

## Command

