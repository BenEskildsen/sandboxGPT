const React = require('react');
const {
  Button, InfoCard, Divider,
  Plot, plotReducer,
  Modal, Indicator,
} = require('bens_ui_components');
const {config} = require('../config');
const {useState, useMemo, useEffect, useReducer} = React;


function Game(props) {
  const {state, dispatch, getState} = props;
  const game = state.game;

  // initializations
  useEffect(() => {
  }, []);


  return (
    <div
      style={{

      }}
    >
      In Game
    </div>
  );
}

module.exports = Game;
