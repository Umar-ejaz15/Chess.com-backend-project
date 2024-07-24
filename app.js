const express = require('express');
const ejs = require('ejs');
const { Chess } = require('chess.js');
const chess = new Chess();
const socket = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);

let players = {};
let currentPlayer = "W";

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    console.log('A user connected');

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "W");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "B");
    } else {
        socket.emit("spectators");
    }

    socket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;
            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move", move);
                socket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log(err);
            socket.emit("invalid move", move);
        }
    });

    socket.on("disconnect", () => {
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        } else {
            console.log("Spectator disconnected");
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
