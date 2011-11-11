var express = require('express'), app = express.createServer(),
    io = require('socket.io').listen(app), TicTacToe = require('./models/tictactoe');

app.use(express.static('/public'));
app.listen(80);
io.set('log level', 1);
io.set('resource', '/api');
var Game = new TicTacToe(), countUsers = 0;

io.sockets.on('connection', function (socket) {

    console.log('%s: %s - connected', socket.id.toString(), socket.handshake.address.address);

    Game.start(socket.id.toString(), function(start, gameId, opponent){
        if(start) {
            // Подключем к игре соперников
            socket.join(gameId);
            io.sockets.socket(opponent).join(gameId);
            socket.emit('ready', gameId, 'X');
            io.sockets.socket(opponent).emit('ready', gameId, 'O');
        } else {
            // ожидает аппонента
            io.sockets.socket(socket.id).emit('wait');
        }
    });

    socket.on('step', function (gameId, id) {
        Game.step(gameId, id, socket.id.toString(), function(win, turn) {
            io.sockets.in(gameId).emit('step', id, turn, win);
            if(win) {
                Game.end(socket.id.toString(), function(gameId, opponent){
                    socket.leave(gameId);
                    io.sockets.socket(opponent).leave(gameId);
                });
            }
        });
    });

    socket.on('disconnect', function () {
        countUsers--;
        // Если один из игроков отключился, посылаем об этом сообщение второму
        // Отключаем обоих от игры и удаляем её, освобождаем память
        Game.end(socket.id.toString(), function(gameId, opponent) {
            io.sockets.socket(opponent).emit('exit');
            socket.leave(gameId);
            io.sockets.socket(opponent).leave(gameId);
        });
        console.log('%s: %s - disconnected', socket.id.toString(), socket.handshake.address.address);
    });

});