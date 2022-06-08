
const withVoid = (editor) => {

  const { isVoid } = editor;
  const VOID_ELEMENTS = ['image', 'formula'];
  editor.isVoid = element => {
    return VOID_ELEMENTS.includes(element.type) ? true : isVoid(element);
  };

  return editor;
};

export default withVoid;