
const {gameReducer} = require('./gameReducer');
const {modalReducer} = require('./modalReducer');
const {config} = require('../config');
const {deepCopy} = require('bens_utils').helpers;

const rootReducer = (state, action) => {
  if (state === undefined) return initState();

  switch (action.type) {
    case 'ADD_MESSAGE': {
      const {message, conversationName, usage} = action;
      console.log(usage);
      state.conversations[conversationName].messages.push(action.message);
      return {...state};
    }
    case 'CLEAR_CONVERSATION': {
      const {conversationName} = action;
      state.conversations[conversationName].messages = [];
      return {...state};
    }
    case 'UNDO': {
      const {conversationName} = action;
      state.conversations[conversationName].messages.pop();
      return {...state};
    }
    case 'SET_MODAL':
    case 'DISMISS_MODAL':
      return modalReducer(state, action);
  }
  return state;
};


//////////////////////////////////////
// Initializations
const initState = () => {
  return {
    conversations: {
      assistant: {
        messages: [...config.prompts.assistant],
        name: 'assistant', params: {},
        placeholder: 'Interview this suspect',
        roleNames: {system: 'Background', assistant: 'Mrs. Viola Watson', user: 'Detective'},
      },
    },
  };
}


module.exports = {rootReducer, initState};
