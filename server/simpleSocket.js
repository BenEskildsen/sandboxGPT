
const http = require('http');
const {Server} = require("socket.io");
const {Configuration, OpenAIApi} = require("openai");

const configuration = new Configuration({
  apiKey: require('../.secrets').gptAPIKey,
});
openAI = new OpenAIApi(configuration);

// ------------------------------------------------------------------------------
// Socket initialization
// ------------------------------------------------------------------------------

// Use like:
// const server = initSocketServer(app);
// server.listen(PORT);
const SESSION_ID = 0; // placeholder until we start handling multiple sessions
const initSocketServer = (expressApp) => {
  // SessionID -> {id: SessionID, clients: Array<ClientID>, }
  const sessions = {
    [SESSION_ID]: {
      id: SESSION_ID,
      clients: [],
      messages: [{role: 'assistant', content: 'How may I help you today?'}],
    }
  };
  const socketClients = {};
  const clientToSession = {};

  const server = http.createServer(expressApp);
  const io = new Server(server);
  initIO(io, sessions, socketClients, clientToSession);
  return server;
}

// ------------------------------------------------------------------------------
// Socket functions
// ------------------------------------------------------------------------------
const initIO = (io, sessions, socketClients, clientToSession) => {
  let nextClientID = 1;
  io.on('connection', (socket) => {
    const clientID = nextClientID;
    console.log("client connect", clientID);

    // on client connect
    socketClients[clientID] = socket;
    clientToSession[clientID] = SESSION_ID;

    // tell the client what its id is NOTE: must be using enhancedReducer
    socket.emit('receiveAction', {clientID});

    // create the session if it doesn't exist
    const sessionID = clientToSession[clientID];
    if (!sessions[sessionID]) {
      sessions[sessionID] = {id: sessionID, clients: []};
    }
    const session = sessions[sessionID];
    session.clients.push(clientID);
    // update the just-connected client with session data that may exist
    for (const message of session.messages) {
      socket.emit('receiveAction', {
        type: 'ADD_MESSAGE',
        message,
      });
    }

    socket.on('dispatch', (action) => {
      if (action == null) {
        return;
      }
      console.log('client: ' + clientID + ' dispatches ' + action.type);
      switch (action.type) {
        case 'ADD_MESSAGE': {
          const {message} = action;
          session.messages.push(message);
          emitToSession(session, socketClients, action, clientID);
          // invoke GPT api
          openAI.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: session.messages,
          }).then((completion) => {
            const responseMessage = completion.data.choices[0].message;
            session.messages.push(responseMessage);
            emitToSession(session, socketClients,
              {type: 'ADD_MESSAGE', message: responseMessage},
              clientID, true, // include self
            );
          });
          break;
        }
        default:
          emitToSession(session, socketClients, action, clientID);
      }
    });

    socket.on('disconnect', () => {
      console.log("user disconnected");
    });

    nextClientID++;
  });
}

const emitToSession = (
  session, socketClients,
  action, clientID, includeSelf,
) => {
  for (const id of session.clients) {
    if (id == clientID && !includeSelf) continue;
    const socket = socketClients[id];
    socket.emit('receiveAction', action);
  }
}


module.exports = {initSocketServer};
