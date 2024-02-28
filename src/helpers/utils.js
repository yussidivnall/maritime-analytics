const {Storage} = require('@google-cloud/storage');

const downloadAsJson = async (bucket, path) => {
  const file = await new Storage()
      .bucket(bucket)
      .file(path)
      .download();
  return JSON.parse(file[0].toString('utf8'));
};

/** loads a file as a JSON
  *
  * @param{string} path
  * @return {Object}
  * */
async function loadFileAsJson(path) {
  const fs = require('fs');
  const ret = fs.readFileSync(path, {'encoding': 'utf8', 'flag': 'r'});
  return JSON.parse(ret);
};

module.exports = {
  downloadAsJson,
  loadFileAsJson,
};
