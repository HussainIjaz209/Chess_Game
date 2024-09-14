

const express = require('express');
const socket = require('socket.io');
const http = require('http');
const path = require('path');
const {Chess} = require("chess.js");

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer ='w';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

console.log(path.join(__dirname, 'public'));


app.get("/", (req, res) => {
    res.render("index", {title: "Suraj Chess Game"});
});



io.on('connection', function(uniquesocket) {

    uniquesocket.on("joined", (id) => {
        
        if (!players.white) {
            players.white = uniquesocket.id;
            uniquesocket.emit('playersRole', 'w');
        } else if (!players.black) {
            players.black = uniquesocket.id;
            uniquesocket.emit('playersRole', 'b');
        } else {
            uniquesocket.emit('spectatorRole');
        }
        io.emit('playersUpdate', players);
    });

    uniquesocket.on('disconnect', function() {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
        io.emit('playersUpdate', players);  // Notify all clients about the player update
    });

    uniquesocket.on('move', (move) => {
        chess.move(move);
    io.emit('boardState', chess.fen());
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit('boardState', chess.fen());
            } else {
                console.log("Invalid move:", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch (error) {
            console.log(`Error processing move: ${move} - ${error}`);
            uniquesocket.emit("Invalid move", move);
        }
    });
});



server.listen(3000);


