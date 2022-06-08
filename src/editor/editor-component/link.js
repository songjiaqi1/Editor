import React from 'react';
import { useSelected } from 'sjq1-slate-react';

function Link(props) {
  const className = useSelected() ? 'seafile-ed-hovermenu-mouseclick' : null;
  return <span {...props.attributes} className={'virtual-link ' + className}>{props.children}</span>;
}

export default Link;