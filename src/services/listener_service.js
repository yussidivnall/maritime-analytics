const WebSocket = require('ws');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const {BigQuery} = require('@google-cloud/bigquery');
const dotenv = require('dotenv');
const {formatPositionReport} = require('../helpers/formatters');
const {downloadAsJson, loadFileAsJson} = require('../helpers/utils');

dotenv.config();

const DEFAULT_CONFIG_PATH = './config/ais_listener.conf.json';
// const aisDatasetId = 'channel-rescue.AIS';
const aisDatasetId = process.env.BIGQUERY_DATASET_ID || 'AIS';
const positionReportTableId = process.env.BIGQUERY_POSITION_REPORTS_TABLE_ID ||
  'Position Reports';
const bigquery = new BigQuery();
const aisDataset = bigquery.dataset(aisDatasetId);
const apiKeySecretName = process.env.AISSTREAM_APIKEY_SECRET_NAME;
const mesageTypes = ['PositionReport'];
const positionReportsBuffer = [];
const bufferSize = process.env.BIGQUERY_BUFFER_SIZE || 100;

const client = new SecretManagerServiceClient();

let staticInfo = {arena: [], tracked_boats: []};
let state = []; // eslint-disable-line

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

/**
 * Update the snapshot (state)
 * Checks if boat is already in state, insert if not, update if so
 *
 * @param {Object} positionReport - A formatted possition report
 */
function updateState(positionReport) {
  const mmsi = positionReport.mmsi;
  const idx = state.findIndex((boat) => boat.mmsi === mmsi);
  if (idx === -1) {
    state.push(positionReport);
  } else {
    state[idx]=positionReport;
  }
}


/**
 * Insert records to table
 *
 * @param {Object[]} records
 * @param {Object} table
 */
async function insertRecords(records, table) {
  try {
    console.log(`appending to ${table} records ${records}`);
    aisDataset.table(table).insert(records);
  } catch (error) {
    console.error(`Failed to insert records ${error}`);
  }
};

/**
 * Handles a new message from AISStream
 *
 * currently only handles 'PositionReport' message types
 * @param {Object} record - An AIS Message
 */
function handleRecord(record) {
  if (record['MessageType'] == 'PositionReport') {
    positionReport = formatPositionReport(record);
    console.debug(positionReport);
    updateState(positionReport);
    // TODO check granularity first
    positionReportsBuffer.push(positionReport);
    // Buffer size reached, insert to DB
    if (positionReportsBuffer.length >= bufferSize) {
      positionReports = positionReportsBuffer.splice(0, bufferSize);
      insertRecords(positionReports, positionReportTableId)
          // .then( () => {})
          .catch( (error) => {
            console.error(error);
          });
    }
  }
};

/**
 * Gets the APIStream subscription request
 *
 * @param {Object} config - A config object containing apiKey, areana and boats
 * @return {Object} The contents of a subscription request
 */
function getAPISubscriptionRequest(config) {
  const subscription = {
    Apikey: config.apiKey,
    BoundingBoxes: config.arena,
    FiltersShipMMSI: config.boats,
    FilterMessageTypes: mesageTypes,
  };
  return subscription;
}


getConfig()
    .then((config) => {
      staticInfo = {
        arena: config.arena,
        tracked_boats: config.boats,
      };
      const ws = new WebSocket('wss://stream.aisstream.io/v0/stream', {rejectUnauthorized: false});
      ws.on('open', ()=>{
        // subscribe
        const subscription = getAPISubscriptionRequest(config);
        // send
        ws.send(JSON.stringify(subscription));
        console.log('Socket open to AIS Stream');
      });
      ws.on('message', (message) =>{
        console.debug( JSON.parse(message) );
        handleRecord(JSON.parse(message));
      });
      ws.on('error', (err)=>{
        console.error(`Websocket error ${err}`);
      });
      ws.on('close', ()=>{
        console.log('Websocket closed');
        process.exit();
      });
    })
    .catch( (error) => {
      console.log(`Error loading config: ${error}`);
    });

/**
 * Returns basic static info: arena, tracked boats
 * @return {Object}
 */
function getInfo() {
  return staticInfo;
}

/**
 * Gets the current state of boats (last snapshot)
 *
 *
 * @return {Object[]} list of all boats latest known states (within snapshot)
 */
function getState() {
  return state;
}

module.exports = {
  getInfo,
  getState,
};
