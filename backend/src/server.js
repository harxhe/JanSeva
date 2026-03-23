const http = require("http");

const { port } = require("./config/env");
const app = require("./app");
const { initializeSocketServer } = require("./realtime/socketServer");

const server = http.createServer(app);

initializeSocketServer(server);

server.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
