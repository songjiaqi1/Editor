
const getEventTransfer = (data) => {
  const fragmentString = data.getData('application/x-slate-fragment');
  const textContent = data.getData('text') || data.getData('text/plain') || '';
  let fragmentContent = fragmentString ? JSON.parse(decodeURIComponent(window.atob(fragmentString))) : null;
  const htmlContent = data.getData('text/html') || '';
  const hasRtfContent = data.types.includes('text/rtf');

  /**
   *  compat old version slate: if clipboard content is old version slate fragment
   *  return  html content
   */ 
  
  const files = data.files;
  let type = 'text';
  // Paste rtf format content which copied from PPT or Word or Excel as text to document
  if (hasRtfContent) {
    type = 'text';
  } else if (files.length > 0) {
    type = 'file';
  } else if (fragmentContent && Array.isArray(fragmentContent)) {
    type = 'fragment';
  } else if (htmlContent) {
    type = 'html';
  }

  return { text: textContent, html: htmlContent, fragment: fragmentContent, type, files: files };
};

export default getEventTransfer;