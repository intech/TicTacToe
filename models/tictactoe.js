var TicTacToe = module.exports = function() {
    // Массив id игры = объект игры
    this.games = [];
    // Массив подключённых пользователей = id игры
    this.users = [];
    // Массив пользователей ожидающих оппонентов для начало игры
    this.free = [];
}

var GameItem = function(user, opponent, x, y, stepsToWin) {
    // Ячейки игрового поля
    this.board = [];
    // Игроки
    this.user = user; // X
    this.opponent = opponent; // O
    // Размеры поля
    this.x = x;
    this.y = y;
    // Шагов до победы
    this.stepsToWin = stepsToWin;
}

/**
 * Сделан ход
 */
GameItem.prototype.step = function(now, user, cb) {
    //console.info('Step GameItem');
    this.board[now] = this.getTurn(user);
    cb(this.checkWinner(now, this.getTurn(user)), this.getTurn(user));
}

TicTacToe.prototype.step = function(gameId, now, user, cb) {
    //console.info('Step');
    //console.dir(this.games[gameId]);
    this.games[gameId].step(now, user, cb);
}

/**
 * Запускаем игру
 */
TicTacToe.prototype.start = function(user, cb) {
    var x = y = 3, stepsToWin = 3;
    // Ищем свободные игры
    if(this.free.length > 0) {
        var opponent = this.free.shift();
        // Если есть ожидающие игру, создаём им игру
        var game = new GameItem(user, opponent, x, y, stepsToWin);
        var id = user + opponent;
        // Добавляем игру в список действующих
        this.games[id] = game;
        this.users[user] = id;
        //console.dir(this.games[id]);
        cb(true, id, opponent);
    } else {
        // Пока нет, значит будем ждать
        this.free.push(user);
        cb(false);
    }
}

/**
 * Получаем чем ходит игрок
 */
GameItem.prototype.getTurn = function(user) {
    return (user == this.user ? 'X' : 'O');
}

/**
 * Выходим из игры
 */
TicTacToe.prototype.end = function(user, cb) {
    //console.log('end - %s', user);
    if(this.users[user] === undefined) return;
    var gameId = this.users[user];
    //console.log(gameId);
    var game = this.games[gameId];
    //console.dir(game);
    var opponent = (user == game.user ? game.opponent : game.user);
    game.board = game.user = game.opponent = game.win = game.tictactoe = null;
    delete this.games[gameId];
    delete this.users[user];
    game = null;
    cb(gameId, opponent);
}

/**
 * Проверяем нет ли победителя
 */
GameItem.prototype.checkWinner = function(now, turn) {
    //console.log('checkWinner now: %s, turn: %s', now, turn);
    // Проверка на ничью, если нет больше свободных полей
    //console.log('%s == %s', Object.keys(this.board).length, (this.x * this.y));
    //turn = (turn == 'X' ? 'O' : 'X');
    //console.log('turn check %s', turn);
    if(Object.keys(this.board).length == (this.x * this.y)) {
        // Ничья
        //console.log('Ничья');
        return 'none';
        // Проверка на победителя
    } else if(
        this.checkWinnerDynamic('-', now, turn)
            || this.checkWinnerDynamic('|', now, turn)
            || this.checkWinnerDynamic('\\', now, turn)
            || this.checkWinnerDynamic('/', now, turn)
        ) {
        //console.log('Есть победитель');
        // есть победитель
        return true;
    } else {
        //console.log('Нет победителя');
        // нет победителя
        return false;
    }
}

/**
 * Алгоритм для поля XxY с выиграшем в N полей
 * a - каким алгоритмом ищем
 * now - номер поля куда был сделан ход
 * turn - крестик или нолик ходили
 */
GameItem.prototype.checkWinnerDynamic = function(a, now, turn) {
    // будем проверять динамически 4 комбинации: горизонталь, вертикаль и 2 диагонали
    // при этом мы не знаем на какой позиции текущий ход,, проверять будем во всех 4 направлениях
    //console.log('checkWinnerDynamic a: %s, now: %s, turn: %s', a, now, turn);
    var win = 1, num = parseInt(now.replace("c", "")),
        Y = Math.floor(num / this.y) // текущая строка
        X = Math.floor(num / this.x) // текущая колонка
        minLeft = (this.x * (X-1) + 1);
    X = (X == 0 ? 1 : X);
    Y = (Y == 0 ? 1 : Y);
    minLeft = (minLeft <= 0 ? 0 : minLeft);
    //console.log('X: %s, Y: %s', X, Y);
    switch(a) {
        // поиск по вертикали
        case '|':
            //console.log('поиск по вертикали');
            var toUp = toDown = true;
            for(var i = 1; i <= this.stepsToWin; i++) {
               //console.log('%s >= %s', win, this.stepsToWin);
               if(win >= this.stepsToWin) return true;
                //console.log('%s && %s', toUp, toDown);
               if(!toUp && !toDown) return false;
                //console.log('%s == %s', this.board['c' + (num + this.x * i)], turn);
               if(toUp && (0 <= (num + this.x * i)) && this.board['c' + (num + this.x * i)] == turn) { win++; } else { toUp = false; }
                //console.log('%s == %s', this.board['c' + (num - this.x * i)], turn);
               if(toDown && ((this.x * this.y) >= (num - this.x * i)) && this.board['c' + (num - this.x * i)] == turn) { win++; } else { toDown = false; }
            }
        break;

        // поиск по горизонтали
        case '-':
            //console.log('поиск по горизонтали');
            var toLeft = toRight = true;
            for(var i = 1; i <= this.stepsToWin; i++) {
               //console.log('%s >= %s', win, this.stepsToWin);
               if(win >= this.stepsToWin) return true;
               //console.log('%s && %s', toLeft, toRight);
               if(!toLeft && !toRight) return false;
               //console.log('toLeft %s <= %s', minLeft, (num - i));
               //console.log('toLeft: %s is %s', 'c' + (num - i), this.board['c' + (num - i)]);
               //console.log('toRight: %s is %s', 'c' + (num + i), this.board['c' + (num + i)]);
               if(toLeft && (minLeft <= (num - i)) && this.board['c' + (num - i)] == turn) { win++; } else { toLeft = false; }
               //console.log('toRight %s >= %s', (this.x * X), (num + i));
               if(toRight && ((this.x * X) >= (num + i)) && this.board['c' + (num + i)] == turn) { win++; } else { toRight = false; }
            }
        break;

        // поиск по диагонали сверху вниз
        case '\\':
            //console.log('поиск по диагонали сверху вниз');
            var toUpLeft = toDownRight = true;
            for(var i = 1; i <= this.stepsToWin; i++) {
               //console.log('win: %s', win);
               if(win >= this.stepsToWin) return true;
               if(!toUpLeft && !toDownRight) return false;
               if(toUpLeft && (0 <= ((num - this.x * i) - i)) && this.board['c' + ((num - this.x * i) - i)] == turn) { win++; } else { toUpLeft = false; }
               if(toDownRight && ((this.x * this.y) >= ((num + this.x * i) + i)) && this.board['c' + ((num + this.x * i) + i)] == turn) { win++; } else { toDownRight = false; }
            }
        break;

        // поиск по диагонали снизу вверх
        case '/':
            //console.log('поиск по диагонали снизу вверх');
            var toDownLeft = toUpRight = true;
            for(var i = 1; i <= this.stepsToWin; i++) {
               //console.log('win: %s', win);
               if(win >= this.stepsToWin) return true;
               if(!toDownLeft && !toUpRight) return false;
               if(toDownLeft && (0 <= ((num - this.x * i) + i)) && this.board['c' + ((num - this.x * i) + i)] == turn) { win++; } else { toDownLeft = false; }
               if(toUpRight && ((this.x * this.y) >= ((num + this.x * i) + i)) && this.board['c' + ((num + this.x * i) + i)] == turn) { win++; } else { toUpRight = false; }
            }
        break;

        default: return false; break;
    }
    return(win >= this.stepsToWin);
}