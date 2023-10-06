const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();
const server = http.createServer(app);
const wsServer = new WebSocket.Server({ server });

const sessions = {};

wsServer.on("connection", (ws) => {
  let sessionID;

  // When a user connects, they send their session ID and initial video queue
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    const { action, queue } = data;

    if (action === "join") {
      // Join a session
      sessionID = data.sessionID;

      // Create a new session if it doesn't exist
      if (!sessions[sessionID]) {
        sessions[sessionID] = {
          participants: [],
          videoQueue: [],
          currentVideoIndex: 0,
        };
      }

      // Store the WebSocket connection in the session
      sessions[sessionID].participants.push(ws);

      // Send the current video ID to the user
      const currentVideoID = sessions[sessionID].videoQueue[sessions[sessionID].currentVideoIndex];
      ws.send(JSON.stringify({ action: "play", videoID: currentVideoID }));
    } else if (action === "replaceQueue") {
      // Replace the video queue
      if (sessionID) {
        sessions[sessionID].videoQueue = queue;
        sessions[sessionID].currentVideoIndex = 0;

        // Notify all participants that a new queue has been set
        sessions[sessionID].participants.forEach((participant) => {
          const currentVideoID = sessions[sessionID].videoQueue[sessions[sessionID].currentVideoIndex];
          participant.send(JSON.stringify({ action: "play", videoID: currentVideoID }));
        });
      }
    }
  });

  // When a user disconnects, remove their WebSocket from the session
  ws.on("close", () => {
    if (sessionID && sessions[sessionID]) {
      sessions[sessionID].participants = sessions[sessionID].participants.filter((participant) => participant !== ws);
    }
  });
});

server.listen(3000, () => {
  console.log("WebSocket server is listening on port 3000");
});
