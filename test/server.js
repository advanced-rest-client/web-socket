const WebSocket = require('ws');
const wss = new WebSocket.Server({
  port: 8999
});

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    if (message === 'close') {
      wss.close();
      return;
    }
    ws.send(message);
  });
});
