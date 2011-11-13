var TicTacToe = {
    gameId: null,
    turn: null,
    i:false,
    startGame: function (gameId, turn, x, y) {
        this.gameId = gameId;
        this.turn = turn;
        this.i = (turn == 'X');
        console.log(this);
        var table = $('#board-table').empty();
        for(var i = 1; i <= y; i++) {
            var tr = $('<tr/>');
            for(var j = 0; j < x; j++) {
                tr.append($('<td/>').attr('id', (j+1) + 'x' + i).addClass('ui-state-default').html('&nbsp;'));
            }
            table.append(tr);
        }
        $("#board").show();
        $("#menu").hide();
    },

    move: function (id, turn, win) {
        this.i = (turn != this.turn);
        $("#" + id).attr('class', 'ui-state-hover').html(turn);
        if (!win) {
            $('#status').html('Сейчас ' + (this.i ? 'ваш ход' : 'ходит противник'));
        } else {
            this.endGame(turn, win);
        }
    },

    endGame: function (turn, win) {
        var text = '';
        switch(win) {
            case 'none': text = 'Ничья!'; break;
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

