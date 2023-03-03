const React = require('react');
const {
  Button, Modal, Divider, TextArea, TextField,
  useHotKeyHandler, hotKeyReducer, useEnhancedReducer,
  Dropdown,
} = require('bens_ui_components');
const Message = require('./Message.react');
const {dispatchToServer} = require('../clientToServer');
const {useState, useMemo, useEffect, useRef} = React;

function Chat(props) {
  const {
    state, getState, dispatch,
    showRole, showClear, showUsage,
    placeholder, style,
  } = props;

  const messages = [];
  for (let i = 0; i < state.messages.length; i++) {
    messages.push(<Message message={state.messages[i]} key={"message_" + i} />);
  }

  const [curPrompt, setCurPrompt] = useState('');
  const [role, setRole] = useState('user');

  // auto scroll on messages received
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  // text input of different sizes
  const [showBigTextBox, setShowBigTextBox] = useState(false);
  const [showTextExpander, setShowTextExpander] = useState(false);
  let textInput = (
    <div
      style={{
        width: 800,
        position: 'relative',
      }}
    >
      {
        showBigTextBox ? (
          <TextArea
            value={curPrompt}
            style={{
              resize: 'none',
              width: '100%',
              marginBottom: -8,
            }}
            rows={10}
            placeholder={placeholder ?? "ask the assistant anything"}
            onChange={setCurPrompt}
            onFocus={() => setShowTextExpander(true)}
            onBlur={() => {
              setTimeout(() => setShowTextExpander(false), 100);
            }}
          />
        ) : (
          <TextField
            value={curPrompt}
            style={{
              width: '100%',
              height: 25,
            }}
            placeholder={placeholder ?? "ask the assistant anything"}
            onChange={setCurPrompt}
            onFocus={() => setShowTextExpander(true)}
            onBlur={() => {
              setTimeout(() => setShowTextExpander(false), 100);
            }}
          />
        )
      }
      {showTextExpander ? (
        <Button
          label={showBigTextBox ? 'V' : '^'}
          onClick={() => setShowBigTextBox(!showBigTextBox)}
          style={{
            position: 'absolute',
            height: 25, width: 30,
            top: -25, left: 0,
          }}
        />
      ) : null}
    </div>
  );

  // press enter to submit
  const [hotKeys, hotKeyDispatch, getHotKeyState] = useEnhancedReducer(hotKeyReducer);
  useHotKeyHandler({dispatch: hotKeyDispatch, getState: getHotKeyState});
  useEffect(() => {
    hotKeyDispatch({type: 'SET_HOTKEY', key: 'enter', press: 'onKeyDown', fn: () => {
      if (!showBigTextBox) {
        submitPrompt(dispatch, role, curPrompt, setCurPrompt);
      }
    }});
  }, [curPrompt, role, showBigTextBox]);

  return (
    <div
      style={{
        width: 800,
        margin: 'auto',
        marginTop: 15,
        ...style,
      }}
    >
      <div
        style={{
          border: '1px solid black',
          width: '100%',
          height: `calc(100% - ${showBigTextBox ? '195px' : '60px'})`,
          overflowY: 'scroll',
          padding: 4,
          paddingBottom: 64,
          boxShadow: 'inset -0.3em -0.3em 0.5em rgba(0,0,0,0.3)',
        }}
      >
        {messages}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          marginTop: 10,
          display: 'flex',
          flexDirection: 'row',
          gap: 10,
          alignItems: 'baseline',
        }}
      >
        {showRole ? (
          <Dropdown
            style={{
              width: 70,
              height: 25,
            }}
            options={['user', 'system', 'assistant']}
            selected={role}
            onChange={setRole}
          />
        ) : null}
        {textInput}
        <Button
          label="Submit"
          onClick={() => {
            submitPrompt(dispatch, role, curPrompt, setCurPrompt);
          }}
        />
        {showClear ? (
          <Button
            label="Clear"
            onClick={() => {
              const action = {type: "CLEAR_CONVERSATION"};
              dispatch(action);
              dispatchToServer(action);
            }}
          />
        ) : null}
      </div>

    </div>
  );
}

const submitPrompt = (dispatch, role, curPrompt, setCurPrompt) => {
  const action = {type: 'ADD_MESSAGE', message: {role, content: curPrompt}};
  dispatch(action);
  dispatchToServer(action);
  setCurPrompt('');
};

module.exports = Chat;
