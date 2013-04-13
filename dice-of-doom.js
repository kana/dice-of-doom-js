(function () {
  // Constants {{{

  var numberOfPlayers = 2;
  var maximumDice = 3;
  var boardWidth = 4;
  var boardHeight = 4;
  var boardHexCount = boardWidth * boardHeight;
  var aiLevel = 4;

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

  // Lazy evaluation {{{

  function delay(expressionAsFunction) {
    var result;
    var isEvaluated = false;

    return function () {
      if (!isEvaluated)
        result = expressionAsFunction();
      return result;
    };
  }

  function force(promise) {
    return promise();
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
        gameTreePromise: delay(function () {
          return makeGameTree(
            addNewDice(board, player, spareDiceCount - 1),
            (player + 1) % numberOfPlayers,
            0,
            true
          );
        })
      };
      return [passingMove].concat(moves);
    }
  }

  function calculateAttackingMoves(board, currentPlayer, spareDiceCount) {
    var moves = [];

    board.forEach(function (s, si) {
      if (s.player != currentPlayer)
        return;
      var neighborIndices = calculateNeighborIndices(si);
      neighborIndices.forEach(function (di) {
        var d = board[di];
        if (d.player != currentPlayer && d.diceCount < s.diceCount) {
          moves.push({
            sourceIndex: si,
            destinationIndex: di,
            gameTreePromise: delay(function () {
              return makeGameTree(
                makeAttackedBoard(board, currentPlayer, si, di),
                currentPlayer,
                spareDiceCount + d.diceCount,
                false
              );
            })
          });
        }
      })
    });

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

  // AI {{{

  function limitGameTreeDepth(gameTree, depth) {
    return {
      player: gameTree.player,
      board: gameTree.board,
      moves:
        depth == 0
        ? []
        : gameTree.moves.map(function (m) {
          return {
            sourceIndex: m.sourceIndex,
            destinationIndex: m.destinationIndex,
            gameTreePromise: delay(function () {
              return limitGameTreeDepth(force(m.gameTreePromise), depth - 1);
            })
          };
        })
    };
  }

  function ratePotition(gameTree, player) {
    var moves = gameTree.moves;
    if (1 <= moves.length) {
      var judge = gameTree.player == player ? 'max' : 'min';
      return Math[judge].apply(null, calculateRatings(gameTree, player));
    } else {
      var winners = calculateWinners(gameTree.board);
      if (0 <= winners.indexOf(player))
        return 1 / winners.length;
      else
        return 0;
    }
  }

  function calculateRatings(gameTree, player) {
    return gameTree.moves.map(function (m) {
      return ratePotition(force(m.gameTreePromise), player);
    });
  }

  function chooseMoveByAI(gameTree) {
    var ratings = calculateRatings(gameTree, gameTree.player);
    var maxRating = Math.max.apply(null, ratings);
    return gameTree.moves[ratings.indexOf(maxRating)];
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

  function showGameStatus(player, move, gameTree) {
    $('#game-board').html(drawBoardAsPreformattedHtml(gameTree.board));
    $('#current-player-name').text(makePlayerName(gameTree.player));
    if (player == null) {
      $('#log').empty();
    } else {
      $('#log').prepend($('<div class="line">').text(
        makePlayerName(player) + ': ' + makeMoveLabel(move)
      ));
    }
  }

  function setUpControlsToChooseMoveByHuman(player, moves) {
    clearConsole();
    $('#message').text('Choose your move:');
    $('#control').append(
      moves.map(function (m, i0) {
        return $('<input type="button" class="btn">').
          val((i0 + 1) + ': ' + makeMoveLabel(m)).
          click(function () {
            updateScreenByMove(player, m, force(m.gameTreePromise));
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

  function updateScreenByMove(player, move, gameTree) {
    showGameStatus(player, move, gameTree);
    if (1 <= gameTree.moves.length) {
      if (gameTree.player == 0) {
        setUpControlsToChooseMoveByHuman(gameTree.player, gameTree.moves);
      } else {
        var move = chooseMoveByAI(gameTree);
        updateScreenByMove(gameTree.player, move, force(move.gameTreePromise));
      }
    } else {
      showWinners(gameTree.board);
    }
  }

  function startNewGame() {
    updateScreenByMove(null, null, makeGameTree(generateBoard(), 0, 0, true));
  }

  // }}}

  $(document).ready(startNewGame);
})();
// vim: expandtab softtabstop=2 shiftwidth=2 foldmethod=marker
