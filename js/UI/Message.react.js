const React = require('react');
const {useEffect, useState, useMemo} = React;

const Message = (props) => {
  const {role, content} = props.message;

  return (
    <div
      style={{
        whiteSpace: 'pre-wrap',
      }}
    >
    <b>{role}</b>: {content}
    </div>
  );
};

module.exports = Message;

