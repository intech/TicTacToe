var express = require('express'), app = express.createServer(),
    io = require('socket.io').listen(app), TicTacToe = require('./models/tictactoe');

app.use(express.static(__dirname + '/public'));
app.listen(1337);
io.set('log level', 1);
io.set('resource', '/api');
var countGames = 0, countPlayers = [], Game = new TicTacToe();
// Размеры поля
Game.x = Game.y = 6; // Default: 6
// Необходимое кол-во занятых подряд клеток для победы
Game.stepsToWin = 4; // Default: 4

setInterval(function() {
    io.sockets.emit('stats', [
        'Всего игр: ' + countGames,
        'Уникальных игроков: ' + Object.keys(countPlayers).length,
        'Сейчас игр: ' + Object.keys(Game.games).length,
        'Сейчас игроков: ' + Object.keys(Game.users).length
    ]);
}, 5000);
io.sockets.emit('stats', [
    'Всего игр: ' + countGames,
    'Уникальных игроков: ' + Object.keys(countPlayers).length,
    'Сейчас игр: ' + Object.keys(Game.games).length,
    'Сейчас игроков: ' + Object.keys(Game.users).length
]);

io.sockets.on('connection', function (socket) {
    console.log('%s: %s - connected', socket.id.toString(), socket.handshake.address.address);
    if(countPlayers[socket.handshake.address.address] == undefined) countPlayers[socket.handshake.address.address] = true;

    function closeRoom(gameId, opponent) {
        socket.leave(gameId);
        io.sockets.socket(opponent).leave(gameId);
    }

    socket.on('start', function () {
        if(Game.users[socket.id] !== undefined) return;
        Game.start(socket.id.toString(), function(start, gameId, opponent, x, y){
            if(start) {
                Game.games[gameId].on('timeout', function(user) {
                    Game.end(user, function(gameId, opponent, turn) {
                        io.sockets.in(gameId).emit('timeout', turn);
                        closeRoom(gameId, opponent);
                    });
                });

                // Подключем к игре соперников в отдельную комнату
                socket.join(gameId);
                io.sockets.socket(opponent).join(gameId);
                socket.emit('ready', gameId, 'X', x, y);
                io.sockets.socket(opponent).emit('ready', gameId, 'O', x, y);
                countGames++;
            } else {
                // ожидает аппонента
                io.sockets.socket(socket.id).emit('wait');
            }
        });
    });

    socket.on('step', function (gameId, id) {
        if(Game.games[gameId] !== undefined) return;
        // Парсим из ID элемента координаты XxY
        var coordinates = id.split('x');
        Game.step(gameId, parseInt(coordinates[0]), parseInt(coordinates[1]), socket.id.toString(), function(win, turn) {
            io.sockets.in(gameId).emit('step', id, turn, win);
            if(win) {
                Game.end(socket.id.toString(), function(gameId, opponent){
                    closeRoom(gameId, opponent);
                });
            }
        });
    });

    socket.on('disconnect', function () {
        // Если один из игроков отключился, посылаем об этом сообщение второму
        // Отключаем обоих от игры и удаляем её, освобождаем память
        Game.end(socket.id.toString(), function(gameId, opponent) {
            io.sockets.socket(opponent).emit('exit');
            closeRoom(gameId, opponent);
        });
        console.log('%s: %s - disconnected', socket.id.toString(), socket.handshake.address.address);
    });

});