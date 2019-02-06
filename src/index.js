const app = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');

// middlewares
app.use(cors());
app.use(bodyParser());

// servers
const http = require('http').Server(app);
const io = require('socket.io')(http);
const debug = require('debug')('briscoloker:index');
const briscolokerMongoClient = require('./modules/mongoDbHelpers')(`${process.env.MONGO_CONNECTION_STRING}`);

// SOCKET.IO Modules
const joinLobby = require('./modules/socketIo/joinLobby');
const tableReady = require('./modules/socketIo/tableReady');
const reconnectMe = require('./modules/socketIo/reconnectMe');
const betting = require('./modules/socketIo/betting');
const playACard = require('./modules/socketIo/playACard');
const fold = require('./modules/socketIo/fold');

// API Modules
const registerUser = require('./modules/API/registerUser');
const loginUser = require('./modules/API/loginUser');
const pastGames = require('./modules/API/pastGames');


app.post('/login', async (req, res) => {
  // awaiting the response from the registration module
  let response = {};
  let httpStatus = 200;
  let token = '';
  try {
    token = await loginUser(briscolokerMongoClient, req.body.username, req.body.password);
    response = {
      token,
    };
  } catch (error) {
    httpStatus = 401;
    response = {
      error,
    };
  }
  res
    .status(httpStatus)
    .json(response);
});

app.post('/register', async (req, res) => {
  // awaiting the response from the registration module
  let response = {};
  let httpStatus = 200;
  let token = [];
  try {
    token = await registerUser(briscolokerMongoClient, req.body.username, req.body.password);
    response = {
      token,
    };
  } catch (error) {
    httpStatus = 500;
    response = {
      error,
    };
  }
  res
    .status(httpStatus)
    .json(response);
});

app.get('/past_games', async (req, res) => {
  // awaiting the response from the registration module
  let response = {};
  let httpStatus = 200;
  let games = '';
  try {
    debug('headers', req.headers);
    games = await pastGames(briscolokerMongoClient, req.headers['x-btoken']);
    response = {
      games,
    };
  } catch (error) {
    httpStatus = 500;
    response = {
      error,
    };
  }
  res
    .status(httpStatus)
    .json(response);
});

const timers = [];

// this interval update all the timers for all existing games
// the timers are part of the game object
setInterval(async () => {
  const games = await briscolokerMongoClient.getLimitlessStuffFromMongo(
    'games',
    { timer: { $gt: -1 } },
    {},
    {},
    {
      projection: { timer: 1, name: 1 },
    },
  );
  games.forEach(async (T) => {
    debug(T.timer, T.name, T._id);
    T.timer--;
    if (T.timer < 0) {
      // call the timeout logic
      // 1. get the token of the timed out player
      const player = T.players.filter(P => P.initiative);
      // debug(player);
      const { isBettingPhase, bettingRound } = T.currentHand;
      if (isBettingPhase) {
        if (bettingRound === 1) {
          debug('Betting 0', bettingRound);
          // first round of betting, so check
          await betting(io, briscolokerMongoClient, player[0].id, 0);
        } else {
          // need to fold
          debug('Folding', bettingRound);
          await fold(io, briscolokerMongoClient, player[0].id);
        }
      } else {
        // playing round - Play the first card
        await playACard(io, briscolokerMongoClient, player[0].id, player[0].hand[0]);
      }
    } else {
      debug(`emit: 'timer' to ${T.name}, ${T.timer}`);
      io.sockets.in(T.name).emit('timer', T.timer);
      // @TODO: REFACTOR THIS IN A BETTER WAY
      await briscolokerMongoClient.updateOneByObjectId('games', T._id, T);
    }
  });
}, 1000);

io.on('connection', (socket) => {
  console.log('a user is connected', socket.id, timers);
  debug('Query string of the socket', socket.handshake.query);
  socket.token = socket.handshake.query.token;

  // triggered on reconnection
  socket.on('reconnect_me', async (payload) => {
    console.log('message for reconnect_me payload', payload);
    await reconnectMe(socket, briscolokerMongoClient, payload.token);
  });

  // triggered when the browser goes to /game
  socket.on('table_ready', async (payload) => {
    console.log('message for table_ready payload', payload);
    await tableReady(socket, briscolokerMongoClient, payload.token);
  });

  // triggerred when the player press play
  socket.on('join_lobby', async (payload) => {
    // @todo: validate the tokens
    console.log('message for join_lobby', payload);
    await joinLobby(socket, io, briscolokerMongoClient, payload.token);
  });

  // the client send a message when the player is betting
  socket.on('betting', async (payload) => {
    console.log('message for betting', payload);
    await betting(io, briscolokerMongoClient, payload.token, payload.bet);
  });

  // the client send a message when the player folds
  socket.on('fold', async (payload) => {
    console.log('message for fold', payload);
    await fold(io, briscolokerMongoClient, payload.token);
  });

  // the client send a message when the player plays a card
  socket.on('play_a_card', async (payload) => {
    console.log('message for play_a_card', payload);
    await playACard(io, briscolokerMongoClient, payload.token, payload.card);
  });
});

http.listen(process.env.PORT, () => {
  console.log(`listening on *:${process.env.PORT}`);
});
