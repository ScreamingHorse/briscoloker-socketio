const debug = require('debug')('briscoloker:updateRating');
const ObjectId = require('mongodb').ObjectID;

module.exports = async (winnerId, loserId, mongoClient) => {
  try {
    let winner = await mongoClient.getStuffFromMongo(
      'users',
      { _id: ObjectId(winnerId) },
      {},
      1,
    );
    winner = winner[0];

    let loser = await mongoClient.getStuffFromMongo(
      'users',
      { _id: ObjectId(loserId) },
      {},
      1,
    );
    loser = loser[0];

    debug(winner);
    debug(loser);
    // 1 calculate the change in rating
    if (winner.rating > loser.rating) {
      // the winner was already higher rating
      winner.rating += 20;
      loser.rating -= 20;
    } else {
      // the winner was lower rating
      winner.rating += 30;
      loser.rating -= 30;
    }
    // 2 update wins and losses
    winner.wins++;
    loser.losses++;
    debug(winner);
    debug(loser);
    // 3 update the mongoDB
    await mongoClient.updateOneByObjectId('users', winner._id, winner);
    await mongoClient.updateOneByObjectId('users', loser._id, loser);
  } catch (e) {
    console.error(e);
  }
};
