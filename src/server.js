const express = require('express');
const port = process.env.PORT || 8080;
const aisListener = require('./services/listener_service');

const app = express();
app.use( express.json() );
app.get('/info', (req, resp) => {
  const info = aisListener.getInfo();
  resp.json(info);
});

app.get('/state', (req, resp)=>{
  const state = aisListener.getState();
  resp.json(state);
});

app.listen(port, ()=>{
  console.log(`Listening on port ${port}`);
});
