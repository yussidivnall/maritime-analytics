const WebSocket = require('ws');
const http = require('http');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const {BigQuery} = require('@google-cloud/bigquery');

const aisDatasetId = 'channel-rescue.AIS';
const positionReportTableId = 'position-reports';
const bigquery = new BigQuery();
const aisDataset = bigquery.dataset(aisDatasetId);
const apiKeySecretName =
  'projects/96495653362/secrets/AISStreamAPIKey/versions/latest';

const mesageTypes = ['PositionReport'];
const boats = [];


const client = new SecretManagerServiceClient();
const getApiKey = async () => {
  try {
    const [version] = await client.accessSecretVersion(
        {name: apiKeySecretName});
    const apiKey = version.payload.data.toString('utf8');
    return apiKey;
  } catch (err) {
    console.error('Error accessing secret:', err);
  }
};

const bufferSize = 10;
const positionReportsBuffer = [];

const insertRecords = async (records, table) => {
  try {
    console.log(`appending to ${table} records ${records}`);
    dataset.table(table).insert(records);
  } catch (error) {
    console.error(`Failed to insert records ${error}`);
  }
};


const handleRecord = (record) => {
  if (record['MessageType'] == 'PositionReport') {
    positionReportsBuffer.push(record);
    if (positionReportsBuffer.length >= bufferSize) {
      positionReports = positionReportsBuffer.splice(0, bufferSize);
      insertRecords(positionReports, positionReportTableId)
          .then( () => {})
          .catch( (error) => {});
    }
  }
};

getApiKey()
    .then((apiKey)=>{
      const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

      ws.on('open', ()=>{
        // subscribe
        const subscription = {
          Apikey: apiKey,
          BoundingBoxes: [[[51.399, 2.2666], [50.85, 0.639]]],
          FiltersShipMMSI: boats,
          FilterMessageTypes: mesageTypes,
        };
        // send
        ws.send(JSON.stringify(subscription));
        console.log('Socket open to AIS Stream');
      });
      ws.on('message', (message) =>{
        console.log( JSON.parse(message) );
        handleRecord(JSON.parse(message));
      });
      ws.on('error', (err)=>{
        console.log('Websocket error');
      });
      ws.on('close', ()=>{
        console.log('Websocket closed');
      });
    })
    .catch( (error) => {
      console.log('Error getting API Key I think');
    });

// Cloud Run Service requires an http port open
// Create a dummy HTTP server to listen on a port
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Cloud Run is running!');
});

// Define the port to listen on
const PORT = process.env.PORT || 8080;

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

