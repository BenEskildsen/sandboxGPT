
const {gameReducer} = require('./gameReducer');
const {modalReducer} = require('./modalReducer');
const {config} = require('../config');
const {deepCopy} = require('bens_utils').helpers;

const rootReducer = (state, action) => {
  if (state === undefined) return initState();

  switch (action.type) {
    case 'ADD_MESSAGE': {
      state.messages.push(action.message);
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
    messages: [
    ],
  };
}


module.exports = {rootReducer, initState};
