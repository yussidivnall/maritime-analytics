const {Storage} = require('@google-cloud/storage');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

const DEFAULT_CONFIG_PATH = './config/ais_listener.conf.json';
const apiKeySecretName = process.env.AISSTREAM_APIKEY_SECRET_NAME;
const client = new SecretManagerServiceClient();

/**
 * Download a file from bucket as a JSON
 *
 * @param {String} bucket
 * @param {String} path
 * @return {Object}
 */
async function downloadAsJson(bucket, path) {
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


/** Gets the API key from the Secrets Manager
  * if AISSTREAM_APIKEY is defined use this otherwise use
  * secret AISSTREAM_APIKEY_SECRET_NAME
  * */
async function getApiKey() {
  try {
    if (process.env.AISSTREAM_APIKEY) return process.env.AISSTREAM_APIKEY;
    const [version] = await client.accessSecretVersion(
        {name: apiKeySecretName});
    const apiKey = version.payload.data.toString('utf8');
    return apiKey;
  } catch (err) {
    console.error('Error accessing secret:', err);
  }
};


/** Loads a JSON config file */
async function loadConfig() {
  if (process.env.CONFIG_BUCKET && process.env.CONFIG_PATH) {
    const bucket = process.env.CONFIG_BUCKET;
    const path = process.env.CONFIG_PATH;
    console.debug(`getting config from bucket: ${bucket} : ${path}`);
    return await downloadAsJson(bucket, path);
  } else if (process.env.CONFIG_PATH) {
    const path = process.env.CONFIG_PATH;
    console.debug(`getting cofig in file ${path}`);
    return await loadFileAsJson(path);
  } else {
    console.debug(`getting cofig in file ${DEFAULT_CONFIG_PATH}`);
    return await loadFileAsJson(DEFAULT_CONFIG_PATH);
  }
  console.error('Failed to load config file');
  exit(1);
};
/** Gets a config
  * if CONFIG_BUCKET and CONFIG_PATH are defined
  *   load config from google cloud bucket
  * if onlut CONFIG_PATH is defined
  *   load config from local path
  * otherwise
  *   try to load config from DEFAULT_CONFIG_PATH
  * Then, adds 'apiKey' to config
  * */
async function getConfig() {
  const config = await loadConfig();
  const apiKey = await getApiKey();
  config.apiKey = apiKey;
  return config;
};

module.exports = {
  downloadAsJson,
  loadFileAsJson,
  getConfig,
};
