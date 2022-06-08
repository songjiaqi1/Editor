import { Node } from 'slate';

const TRANSFER_TYPES = {
  fragment: 'application/x-slate-fragment',
  html: 'text/html',
  text: 'text/plain',
};

// tranfrom slate fragment and write to clipboard
function setEventTransfer(event, type, content) {
  const mime = TRANSFER_TYPES[type];
  const transfer = event.dataTransfer || event.clipboardData;
  if (type === 'fragment') {
    // use the same encoding as slate
    const encodedContent = window.btoa(encodeURIComponent(JSON.stringify(content)));
    transfer.setData(mime, encodedContent);
    let texts = '';
    let textItem = '';
    content.forEach(element => {
      textItem = Node.text(element).replace(/\ufeff/, '');
      texts += textItem + '\r\n';
    });
    transfer.setData('text', texts);
  } else if (type === 'html') {
    transfer.setData(mime, content);
    transfer.setData('text', transfer.getData('text'));
  } else {
    transfer.setData('text', content);
  }
}

export default setEventTransfer;
