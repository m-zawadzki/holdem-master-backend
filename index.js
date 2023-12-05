import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { PokerGame } from './pokerGame.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 3000,
  },
});

const PORT = process.env.PORT || 4000;

const rooms = new Map();

const emitPlayersUpdated = (roomId, players) => {
  io.to(roomId).emit('playersUpdated', { players });
};

const emitStartGame = (socket, roomId, players) => {
  io.to(roomId).emit('gameStarted');

  const pokerGame = new PokerGame(players, socket, io, roomId);
  pokerGame.playGame();
};

const joinRoom = socket => {
  socket.on('joinRoom', roomId => {
    socket.join(roomId);

    console.log(`User joined room: ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [] });
    }

    rooms.get(roomId).players.push(socket.id);

    const playersCount = rooms.get(roomId).players.length;

    emitPlayersUpdated(roomId, playersCount);

    if (playersCount >= 2) {
      emitStartGame(socket, roomId, rooms.get(roomId).players);
    }
  });
};

const leaveRoom = socket => {
  socket.on('leaveRoom', roomId => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);

    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.players = room.players.filter(playerId => playerId !== socket.id);
      rooms.set(roomId, room);

      emitPlayersUpdated(roomId, room.players.length);
    }
  });
};

const disconnect = socket => {
  socket.on('disconnect', () => {
    console.log('User disconnected');

    if (rooms.size > 0) {
      rooms.forEach((room, roomId) => {
        if (room.players.includes(socket.id)) {
          room.players = room.players.filter(
            playerId => playerId !== socket.id
          );
          rooms.set(roomId, room);

          emitPlayersUpdated(roomId, room.players.length);
        }
      });
    }
  });
};

io.on('connection', socket => {
  console.log('User connected');

  joinRoom(socket);

  leaveRoom(socket);

  disconnect(socket);
});

server.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
});
