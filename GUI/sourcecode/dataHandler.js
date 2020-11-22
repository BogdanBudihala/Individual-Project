const bcrypt = require('../../Electron/node_modules/bcrypt');

function hashInput(textInput){
  const hashValue = bcrypt.hashSync(textInput, 10);
  if(hashValue === null){
    throw "Unable to obtain hashed value";
  }
  return hashValue;
}


async function isHashMatch(textInput, hash){
  const match = await bcrypt.compare(textInput, hash);
  return match;
}


module.exports = {
   hashInput,
   isHashMatch
}
