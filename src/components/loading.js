import React from 'react';

class Loading extends React.Component {
  render() {
    return (
      <div className="empty-loading-page">
        <div className="lds-ripple page-centered"><div></div><div></div></div>
      </div>
    );
  }
}

export default Loading;