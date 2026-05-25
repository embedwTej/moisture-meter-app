const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 8000;
const PUBLIC_DIR = path.join(__dirname, 'www');

// Simple static file handler for HTTP Server
function serveStaticFile(req, res) {
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  
  // Extension check
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code} ..\n`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

// Create HTTP Server
const server = http.createServer(serveStaticFile);

// Create WebSocket Server on top of the HTTP Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[WebSocket] New client connected from ${ip}`);

  ws.on('message', (message) => {
    // Convert Buffer to string if necessary
    const dataStr = message.toString();
    console.log(`[WebSocket] Received: "${dataStr.trim()}"`);

    // Broadcast message to all other connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(dataStr);
      }
    });
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected from ${ip}`);
  });

  ws.on('error', (err) => {
    console.error(`[WebSocket] Connection error: ${err.message}`);
  });
});

// Start listening
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` CDBL Moisture Capture - Combined Server Running!`);
  console.log(` HTTP Web Server: http://localhost:${PORT}`);
  console.log(` WebSocket URL  : ws://localhost:${PORT}`);
  console.log(`====================================================`);
  console.log(`* For direct cabled USB testing:`);
  console.log(`  1. Connect your phone via USB & turn on "USB Tethering"`);
  console.log(`  2. Note down your laptop's gateway IP on the tethered interface`);
  console.log(`  3. Connect the APK WebSocket client to ws://<laptop-ip>:${PORT}`);
});
