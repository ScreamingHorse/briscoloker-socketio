const debug = require('debug')('briscoloker:pastGames');

module.exports = (mongoClient, token) => {
  debug('getting past games', token);
  return new Promise(async (resolve, reject) => {
    try {
      // 1 check if the token and get the userId
      const userId = await mongoClient.getStuffFromMongo('tokens', {
        token,
      }, {}, 1);
      if (userId.length === 1) {
        const dataFromMongo = await mongoClient.getLimitlessStuffFromMongo(
          'gamesPlayed',
          { 'players.id': { $in: [userId[0].userId.toString()] } },
          {},
        );
        // map the data for the frontend
        const games = dataFromMongo.map(G => ({
          winner: G.winnerOfTheWholeThing,
          id: G._id,
          played: G.created,
        }));
        resolve(games);
      }
      resolve([]);
    } catch (e) {
      reject(e);
    }
  });
};
