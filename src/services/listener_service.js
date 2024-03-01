const WebSocket = require('ws');
const {BigQuery} = require('@google-cloud/bigquery');
const {formatPositionReport} = require('../helpers/formatters');

// const aisDatasetId = 'channel-rescue.AIS';
let bufferSize = 100;
let aisDatasetId = 'AIS';
let positionReportTableId = 'Position Reports';
const bigquery = new BigQuery();
const mesageTypes = ['PositionReport'];
const positionReportsBuffer = [];

// Stores the static info (mostly just some config values)
let staticInfo = {arena: [], tracked_boats: []};
// Store the latest known position of each bot
const state = [];

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
    console.log(`appending to ${table}`);
    const aisDataset = bigquery.dataset(aisDatasetId);
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
    // console.debug(positionReport);
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
 * @param {Object} config - A config object containing api_key, areana, boats...
 * @return {Object} The contents of a subscription request
 */
function getAPISubscriptionRequest(config) {
  const subscription = {
    Apikey: config.api_key,
    BoundingBoxes: config.arena,
    FiltersShipMMSI: config.boats,
    FilterMessageTypes: mesageTypes,
  };
  return subscription;
}

/** Run the AIS Listener service */
async function run(config) {
  aisDatasetId = config['dataset_id'];
  positionReportTableId = config['position_reports_table_id'];
  bufferSize = config['buffer_size'];
  console.log(`Buffer Size ${bufferSize}`);
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
    // console.debug( JSON.parse(message) );
    handleRecord(JSON.parse(message));
  });
  ws.on('error', (err)=>{
    console.error(`Websocket error ${err}`);
  });
  ws.on('close', ()=>{
    console.log('Websocket closed');
    process.exit();
  });
}

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
 * @param {Number[]} MMSIs - Get specific boats snapshot, default to all boats.
 * @return {Object[]} list of all boats latest known states (within snapshot)
 */
function getState(MMSIs=null) {
  if (MMSIs) {
    return state.filter( (element) => {
      MMSIs.includes(element.mmsi);
    });
  } else {
    return state;
  }
}

module.exports = {
  getInfo,
  getState,
  run,
};
