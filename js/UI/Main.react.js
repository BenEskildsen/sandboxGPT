const React = require('react');
const {
  Button, Modal, Divider, TextArea, TextField,
} = require('bens_ui_components');
const Chat = require('./Chat.react');
const {useEnhancedReducer} = require('bens_ui_components');
const {rootReducer, initState} = require('../reducers/rootReducer');
const {setupSocket} = require('../clientToServer');
const {useEffect} = React;


function Main(props) {
  const [state, dispatch, getState] = useEnhancedReducer(
    rootReducer, initState(),
  );
  window.getState = getState;
  window.dispatch = dispatch;

  useEffect(() => {
    setupSocket(dispatch);
  }, []);

  let content = <Chat
    dispatch={dispatch} state={state} getState={getState}
    showRole={true} showClear={true} showUsage={true}
  />

  return (
    <React.Fragment>
      {content}
      {state.modal}
    </React.Fragment>
  )
}



module.exports = Main;
