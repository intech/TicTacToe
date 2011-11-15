var TicTacToe = {
    gameId: null,
    turn: null,
    i: false,
    interval: null,
    init: function() {
        $(function() {
            // Подключаемся к серверу nodejs с socket.io
            var socket = io.connect(window.location.hostname + ':1337', {resource: 'api'});
            $('#reload').hide().button({icons:{primary:'ui-icon-refresh'}}).click(function() {
                $('#reload').off('click').click(function(){window.location.reload();});
                socket.emit('start');
            });
            socket.on('connect', function () {
                $('#status').html('Успешно подключились к игровому серверу');
                $('#reload').show();
                _gaq.push(['_trackEvent', 'WebSocket', 'Success']);
            });
            socket.on('reconnect', function () {
                $('#reload').show();
                $('#connect-status').html('Переподключились, продолжайте игру');
                _gaq.push(['_trackEvent', 'WebSocket', 'Reconnect']);
            });
            socket.on('reconnecting', function () {
                $('#reload').hide();
                $('#status').html('Соединение с сервером потеряно, переподключаемся...');
                _gaq.push(['_trackEvent', 'WebSocket', 'Reconnecting']);
            });
            socket.on('error', function (e) {
                $('#status').html('Ошибка: ' + (e ? e : 'неизвестная ошибка'));
                _gaq.push(['_trackEvent', 'WebSocket', 'Error', (e ? e : 'неизвестная ошибка')]);
            });
            // Ожидаем соперника
            socket.on('wait', function(){
                $('#status').append('... Ожидаем соперника...');
                _gaq.push(['_trackEvent', 'Game', 'Wait']);
            });
            // Соперник отлючился
            socket.on('exit', function(){
                TicTacToe.endGame(TicTacToe.turn, 'exit');
                _gaq.push(['_trackEvent', 'Game', 'Exit']);
            });
            // Время на ход вышло
            socket.on('timeout', function(turn) {
                TicTacToe.endGame(turn, 'timeout');
                _gaq.push(['_trackEvent', 'Game', 'Timeout']);
            });
            // К нам подключился соперник, начинаем игру
            socket.on('ready', function(gameId, turn, x, y) {
                $('#status').html('К вам подключился соперник! Игра началась! ' + (turn == 'X' ? 'Сейчас Ваш первый ход' : 'Сейчас ходит соперник') + '!');
                TicTacToe.startGame(gameId, turn, x, y);
                $('#stats').append($('<div/>').attr('class', 'turn ui-state-hover ui-corner-all').html('Вы играете: <b>' + (turn=='X'?'Крестиком':'Ноликом') + '</b>'));
                $("#board-table td").click(function (e) {
                    if(TicTacToe.i) socket.emit('step', TicTacToe.gameId, e.target.id);
                }).hover(function(){
                    $(this).toggleClass('ui-state-hover');
                }, function(){
                    $(this).toggleClass('ui-state-hover');
                });
                _gaq.push(['_trackEvent', 'Game', 'Start', gameId]);
            });
            // Получаем ход
            socket.on('step', function(id, turn, win) {
                //console.info('step', id, turn, win);
                TicTacToe.move(id, turn, win);
                _gaq.push(['_trackEvent', 'Game', 'Step', id + ' / ' + turn + ' / ' + win]);
            });
            // Статистика
            socket.on('stats', function (arr) {
                var stats = $('#stats');
                stats.find('div').not('.turn').remove();
                for(val in arr) {
                    stats.prepend($('<div/>').attr('class', 'ui-state-hover ui-corner-all').html(arr[val]));
                }
            });
        });
    },

    startGame: function (gameId, turn, x, y) {
        this.gameId = gameId;
        this.turn = turn;
        this.i = (turn == 'X');
        var table = $('#board-table').empty();
        for(var i = 1; i <= y; i++) {
            var tr = $('<tr/>');
            for(var j = 0; j < x; j++) {
                tr.append($('<td/>').attr('id', (j+1) + 'x' + i).addClass('ui-state-default').html('&nbsp;'));
            }
            table.append(tr);
        }
        $("#board,#timerpanel").show();
        this.mask(!this.i);
    },

    mask: function(state) {
        var mask = $('#masked'), board = $('#board-table');
        clearInterval(this.interval);
        $('#timer').html(15);
        this.interval = setInterval(function(){
            var i = parseInt($('#timer').html()); i--;
            $('#timer').html(i);
        }, 1000);
        if(state) {
            mask.show();
            var p = board.position();
            mask.css({
                width: board.width(),
                height: board.height(),
                left: p.left,
                top: p.top
            });
        } else {
            mask.hide();
        }
    },

    move: function (id, turn, win) {
        this.i = (turn != this.turn);
        $("#" + id).attr('class', 'ui-state-hover').html(turn);
        if (!win) {
            this.mask(!this.i);
            $('#status').html('Сейчас ' + (this.i ? 'ваш ход' : 'ходит соперник'));
        } else {
            this.endGame(turn, win);
        }
    },

    endGame: function (turn, win) {
        clearInterval(this.interval);
        var text = '';
        switch(win) {
            case 'none': text = 'Ничья!'; break;
            case 'timeout': text = (turn == this.turn ? 'Слишком долго думали! Вы проиграли!' : 'Соперник так и не смог решить как ему ходить! Вы победили!'); break;
            case 'exit': text = 'Соперник сбежал с поля боя! Игра закончена'; break;
            default: text = 'Вы ' + (this.i ? 'проиграли! =(' : 'выиграли! =)');
        }
        $("<div/>").html(text).dialog({
            title: 'Конец игры',
            modal: true,
            closeOnEscape: false,
            resizable: false,
            buttons: { "Играть по новой": function() {
                $(this).dialog("close");
                window.location.reload();
            }},
            close: function() {
                window.location.reload();
            }
        });
    }
};

