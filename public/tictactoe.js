var TicTacToe = {
    gameId: null,
    turn: null,
    i:false,
    startGame: function (gameId, turn) {
        this.gameId = gameId;
        this.turn = turn;
        this.i = (turn == 'X');
        console.log(this);
        var table = $('<table/>').addClass('ui-widget ui-corner-all').attr('cellpadding', 0).attr('cellspacing', 0).attr('align', 'center');
        var c = 1;
        for(var i = 1; i <= 3; i++) {
            var tr = $('<tr/>');
            for(var j = 0; j < 3; j++) {
                tr.append($('<td/>').attr('id', 'c' + c).addClass('ui-state-default').html('&nbsp;'));
                c++;
            }
            table.append(tr);
        }
        $("#board").html(table).show();
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
        if (win == "none") {
            $("#menu").html("Ничья!");
        } else {
            $("#menu").html((this.i ? 'Противник выиграл! =(' : 'Вы выиграли! =)'));
        }
        $("#menu").dialog({
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

