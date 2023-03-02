const React = require('react');
const {
  Button, Modal, Divider, TextArea, TextField,
  useHotKeyHandler, hotKeyReducer, useEnhancedReducer,
} = require('bens_ui_components');
const Message = require('./Message.react');
const {dispatchToServer} = require('../clientToServer');
const {useState, useMemo, useEffect} = React;

function Chat(props) {
  const {state, getState, dispatch} = props;

  const messages = [];
  for (let i = 0; i < state.messages.length; i++) {
    messages.push(<Message message={state.messages[i]} key={"message_" + i} />);
  }

  const [curPrompt, setCurPrompt] = useState('');

  const [hotKeys, hotKeyDispatch, getHotKeyState] = useEnhancedReducer(hotKeyReducer);
  useHotKeyHandler({dispatch: hotKeyDispatch, getState: getHotKeyState});
  useEffect(() => {
    hotKeyDispatch({type: 'SET_HOTKEY', key: 'enter', press: 'onKeyDown', fn: () => {
      submitPrompt(dispatch, curPrompt, setCurPrompt);
    }});
  }, [curPrompt]);

  return (
    <div
      style={{
        width: 800,
        margin: 'auto',
        marginTop: 15,
      }}
    >
      <div
        style={{
          border: '1px solid black',
          width: '100%',
          height: `calc(100% - 60px)`,
          overflowY: 'scroll',
          padding: 4,
          boxShadow: 'inset -0.3em -0.3em 0.5em rgba(0,0,0,0.3)',
        }}
      >
        {messages}
      </div>

      <div
        style={{
          marginTop: 10,
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <TextField
          value={curPrompt}
          style={{
            width: 700,
            marginRight: 20,
          }}
          placeholder={"ask the assistant anything"}
          onChange={setCurPrompt}
        />
        <Button
          label="Submit"
          onClick={() => {
            submitPrompt(dispatch, curPrompt, setCurPrompt);
          }}
        />
      </div>

    </div>
  );
}

const submitPrompt = (dispatch, curPrompt, setCurPrompt) => {
  const action = {type: 'ADD_MESSAGE', message: {role: 'user', content: curPrompt}};
  dispatch(action);
  dispatchToServer(action);
  setCurPrompt('');
};

module.exports = Chat;
