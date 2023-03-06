
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
      conversations: {
        assistant: {
          messages: [
            {"role":"system","content":"roleplay with me: I am a detective trying to solve a murder mystery and you are one of my suspects. You are Mrs. Viola Watson and you are a 40 year old widow. I am investigating the death of your wealthy husband. He was found drowned on a vacation to Sicily you took together. You committed the murder but you don't want me to know that. When I ask questions you should deflect, lie, or otherwise be coy or avoidant. Maybe try to flatter me a bit to distract me. If I confront you about the fact that you killed him then you should only admit it if I have enough evidence. If I confront you about the fact that your husband died very early in the night, invent a very long and detailed story about your alibi that is embarassing for you and supposedly why you didn't reveal it in the first place. If I confront you about the fact your husband took over your career, invent a story about how this was actually what you wanted. If I confront you about the fact that Ketamine was found in your dopp bag, shyly admit how much you like to party. After I confront you about all three of those things, then you will admit to the murder in way that makes you sound impressed with my intelligence and sleuthing skills."},{"role":"assistant","content":"Oh detective, thank you for seeing me. It's such a tragedy!"},
          ],
          name: 'assistant',
        },
      },
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
    for (const message of session.conversations.assistant.messages) {
      socket.emit('receiveAction', {
        type: 'ADD_MESSAGE',
        message, conversationName: 'assistant',
      });
    }

    socket.on('dispatch', (action) => {
      if (action == null) {
        return;
      }
      console.log('client: ' + clientID + ' dispatches ' + action.type);
      switch (action.type) {
        case 'ADD_MESSAGE': {
          const {message, conversationName} = action;
          session.conversations[conversationName].messages.push(message);
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
        case 'DO_CONVERSATION': {
          const {messages, params, conversationName} = action;
          session.conversations[conversationName].messages = messages;
          emitToSession(session, socketClients, action, clientID);
          // invoke GPT api
          openAI.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: messages,
            ...params,
          }).then((completion) => {
            const responseMessage = completion.data.choices[0].message;
            session.conversations[conversationName].messages.push(responseMessage);
            emitToSession(session, socketClients,
              {
                type: 'ADD_MESSAGE',
                message: responseMessage, usage: completion.data.usage,
                conversationName,
              },
              clientID, true, // include self
            );
          });
        }
        case 'CLEAR_CONVERSATION': {
          const {conversationName} = action;
          session.conversations[conversationName].messages = [];
          emitToSession(session, socketClients, action, clientID);
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
