const debug = require('debug')('briscoloker:updateRating');

module.exports = async (winner, loser, mongoClient) => {
  try {
    debug(winner);
    debug(loser);
    // 1 check if the token can bet
    let winnerRating = winner.rating;
    let loserRating = loser.rating;

  } catch (e) {
    console.error(e);
  }
};
