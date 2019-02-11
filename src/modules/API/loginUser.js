const debug = require('debug')('briscoloker:loginUser');
const pbkdf2 = require('pbkdf2');
const uuidv4 = require('uuid/v4');

module.exports = (mongoClient, username, password) => {
  debug('Login user');
  return new Promise(async (resolve, reject) => {
    try {
      const userData = await mongoClient.getLimitlessStuffFromMongo('users', { username }, {});
      debug('userData', userData);
      if (userData.length !== 1) {
        throw Error('Invalid login');
      } else {
        // found 1 user, need to check the password
        const hashedPassword = pbkdf2.pbkdf2Sync(password, userData[0].salt, 1500, 32, 'sha256').toString('base64');
        if (hashedPassword === userData[0].password) {
          // the user is logged in, generate a token
          // 1. generate the token
          const token = uuidv4();
          // 2. remove other tokens for this user
          await mongoClient.deleteManyThingsBySearchObject('tokens', {
            userId: userData[0]._id.toString(),
          });
          // 3. save the token in mongo
          const tokenObject = {
            token,
            userId: userData[0]._id.toString(),
            creationDate: new Date().getTime(),
          };
          await mongoClient.insertOneThingInMongo('tokens', tokenObject);
          resolve(token);
        } else {
          throw Error('Invalid login');
        }
      }
    } catch (e) {
      reject(e);
    }
  });
};
