import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

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
}

io.on('connection', socket => {
    console.log('User connected');

    socket.on('joinRoom', roomId => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);

        if (!rooms.has(roomId)) {
            rooms.set(roomId, { players: [] });
        }
        rooms.get(roomId).players.push(socket.id);

        const playersCount = rooms.get(roomId).players.length;
        emitPlayersUpdated(roomId, playersCount)
    });

    socket.on('leaveRoom', roomId => {
        socket.leave(roomId);
        console.log(`User left room: ${roomId}`);

        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            room.players = room.players.filter(playerId => playerId !== socket.id);
            rooms.set(roomId, room);

            emitPlayersUpdated(roomId, room.players.length)
        }
    });

    socket.on('pokerAction', data => {
        const { roomId } = data;
        io.to(roomId).emit('pokerUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');

        if (rooms.size > 0) {
            rooms.forEach((room, roomId) => {
                if (room.players.includes(socket.id)) {
                    room.players = room.players.filter(
                        playerId => playerId !== socket.id
                    );
                    rooms.set(roomId, room);

                    emitPlayersUpdated(roomId, room.players.length)
                }
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}`);
});
