(function () {
  // Constants {{{

  var numberOfPlayers = 2;
  var maximumDice = 3;
  var boardWidth = 2;
  var boardHeight = 2;
  var boardHexCount = boardWidth * boardHeight;

  // }}}

  // Misc. utilities {{{

  function random(n) {
    return Math.floor(Math.random() * n);
  }

  function repeat(s, n) {
    var ss = [];
    for (var i = 0; i < n; i++)
      ss.push(s);
    return ss.join('');
  }

  // }}}

  // Game basics {{{

  function makePlayerName(playerId) {
    return String.fromCharCode('A'.charCodeAt(0) + playerId);
  }

  function generateBoard() {
    // A board consists of many hex cells which are formed as a parallelogram
    // and each hex is indexed as follows:
    //       _   _   _
    //      / \ / \ / \
    //     | 0 | 1 | 2 |
    //    / \ / \ / \ /
    //   | 3 | 4 | 5 |
    //  / \ / \ / \ /
    // | 6 | 7 | 8 |
    //  \_/ \_/ \_/
    var board = new Array(boardHexCount);
    for (var i = 0; i < board.length; i++) {
      board[i] = {
        player: random(numberOfPlayers),
        diceCount: random(maximumDice) + 1
      };
    }
    return board;
  }

  function drawBoardAsPreformattedHtml(board) {
    var cs = [];
    for (var y = 0; y < boardHeight; y++) {
      cs.push(repeat('  ', boardHeight - (y + 1)));
      for (var x = 0; x < boardWidth; x++) {
        var hex = board[y * boardWidth + x];
        cs.push('<span class="hex player-');
        cs.push(hex.player);
        cs.push('">');
        cs.push('<span class="border">');
        cs.push('[');
        cs.push('</span>');
        cs.push('<span class="player">');
        cs.push(makePlayerName(hex.player));
        cs.push('</span>');
        cs.push('<span class="dice">');
        cs.push(hex.diceCount);
        cs.push('</span>');
        cs.push('<span class="border">');
        cs.push(']');
        cs.push('</span>');
        cs.push('</span>');
      }
      cs.push('\n');
    }
    return cs.join('');
  }

  function makeGameTree(board, player, spareDiceCount, isFirstMove) {
    return {
      player: player,
      board: board,
      moves: addPassingMove(
        board,
        player,
        spareDiceCount,
        isFirstMove,
        calculateAttackingMoves(board, player, spareDiceCount)
      )
    };
  }

  function addPassingMove(board, player, spareDiceCount, isFirstMove, moves) {
    if (isFirstMove) {
      return moves;
    } else {
      var passingMove = {
        sourceIndex: null,
        destinationIndex: null,
        gameTree: makeGameTree(
          addNewDice(board, player, spareDiceCount - 1),
          (player + 1) % numberOfPlayers,
          0,
          true
        )
      };
      return [passingMove].concat(moves);
    }
  }

  function calculateAttackingMoves(board, currentPlayer, spareDiceCount) {
    var moves = [];

    for (var si = 0; si < board.length; si++) {
      var s = board[si];
      if (s.player != currentPlayer)
        continue;
      var neighborIndices = calculateNeighborIndices(si);
      for (var ni = 0; ni < neighborIndices.length; ni++) {
        var di = neighborIndices[ni];
        var d = board[di];
        if (d.player != currentPlayer && d.diceCount < s.diceCount) {
          moves.push({
            sourceIndex: si,
            destinationIndex: di,
            gameTree: makeGameTree(
              makeAttackedBoard(board, currentPlayer, si, di),
              currentPlayer,
              spareDiceCount + d.diceCount,
              false
            )
          });
        }
      }
    }

    return moves;
  }

  function addNewDice(board, player, spareDiceCount) {
    var c = spareDiceCount;
    var newBoard = [];
    for (var i = 0; i < board.length; i++) {
      var h = board[i];
      newBoard[i] = h;
      if (0 < c && h.player == player && h.diceCount < maximumDice) {
        newBoard[i] = {
          player: h.player,
          diceCount: h.diceCount + 1
        };
        c--;
      }
    }
    return newBoard;
  }

  function calculateNeighborIndices(position) {
    var candidates = [];

    var up = position - boardWidth;
    candidates.push(up);

    var down = position + boardWidth;
    candidates.push(down);

    if (position % boardWidth != 0) {
      candidates.push(up - 1);
      candidates.push(position - 1);
    }

    if ((position + 1) % boardWidth != 0) {
      candidates.push(position + 1);
      candidates.push(down + 1);
    }

    return candidates.filter(function (p) {
      return 0 <= p && p < boardHexCount;
    });
  }

  function makeAttackedBoard(board, player, sourceIndex, destinationIndex) {
    var newBoard = [].concat(board);

    newBoard[sourceIndex] = {
      player: player,
      diceCount: 1
    };
    newBoard[destinationIndex] = {
      player: player,
      diceCount: board[sourceIndex].diceCount - 1
    };

    return newBoard;
  }

  // }}}

  // UI {{{

  function makeMoveLabel(move) {
    if (move.sourceIndex !== null && move.destinationIndex !== null)
      return move.sourceIndex + ' \u2192 ' + move.destinationIndex;
    else
      return 'Pass';
  }

  function calculateWinners(board) {
    var players = [];
    for (var p = 0; p < numberOfPlayers; p++)
      players.push(p);

    var tally = board.map(function (hex) {return hex.player;});
    var totals =
      players.map(function (p) {
        return [
          p,
          tally.filter(function (t) {return t == p;}).length
        ];
      });
    var best = Math.max.apply(null, totals.map(function (pc) {return pc[1];}));

    var winners =
      totals
      .filter(function (pc) {return pc[1] == best;})
      .map(function (pc) {return pc[0];});
    winners.sort();
    return winners;
  }

  function clearConsole() {
    $('#message').text('');
    $('#control').empty();
  }

  function showGameStatus(gameTree) {
    $('#game-board').html(drawBoardAsPreformattedHtml(gameTree.board));
    $('#current-player-name').text(makePlayerName(gameTree.player));
  }

  function setUpControlsToChooseMove(moves) {
    clearConsole();
    $('#message').text('Choose your move:');
    $('#control').append(
      moves.map(function (m, i0) {
        return $('<input type="button" class="btn">').
          val((i0 + 1) + ': ' + makeMoveLabel(m)).
          click(function () {
            chooseMove(m.gameTree);
          });
      })
    );
  }

  function showWinners(board) {
    clearConsole();
    var winnerNames = calculateWinners(board).map(makePlayerName);
    $('#message').text(
      winnerNames.length == 1
      ? 'The winner is ' + winnerNames[0]
      : 'The game is a tie between ' + winnerNames.join(' and ')
    );
    $('#control').append(
      $('<input type="button" class="btn" value="Start a new game">').
      click(startNewGame)
    );
  }

  function chooseMove(gameTree) {
    showGameStatus(gameTree);
    if (1 <= gameTree.moves.length) {
      setUpControlsToChooseMove(gameTree.moves);
    } else {
      showWinners(gameTree.board);
    }
  }

  function startNewGame() {
    chooseMove(makeGameTree(generateBoard(), 0, 0, true));
  }

  // }}}

  $(document).ready(startNewGame);
})();
// vim: expandtab softtabstop=2 shiftwidth=2 foldmethod=marker
