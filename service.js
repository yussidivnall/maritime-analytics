const WebSocket = require('ws');
const http = require('http');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const socket = new WebSocket('wss://stream.aisstream.io/v0/stream');
const apiKeySecretName =
  'projects/96495653362/secrets/AISStreamAPIKey/versions/latest';
  // 'projects/96495653362/secrets/AISStreamAPIKey/versions/latest';

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


getApiKey()
    .then((apiKey)=>{
      const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
      ws.on('open', ()=>{
        // subscribe
        const subscription = {
          Apikey: apiKey,
          BoundingBoxes: [[[51.399, 2.2666], [50.85, 0.639]]],
          // Harbor
          // BoundingBoxes: [[[51.126411, 1.306962], [51.110679, 1.328434]]]
          // FiltersShipMMSI: ['368207620', '367719770'], // Optional!
          // FilterMessageTypes: ['PositionReport'], // Optional!
        };
        // send
        ws.send(JSON.stringify(subscription));
        console.log('Socket open to AIS Stream');
      });
      ws.on('message', (message) =>{
        console.log(`msg: ${message}`);
        console.log( JSON.parse(message) );
        // const aisMessage = JSON.parse(message.data);
        // console.log(aisMessage);
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

