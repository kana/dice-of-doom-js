(function () {
  var numberOfPlayers = 2;
  var maximumDice = 3;
  var boardWidth = 2;
  var boardHeight = 2;
  var boardHexCount = boardWidth * boardHeight;

  function random(n) {
    return Math.floor(Math.random() * n);
  }

  function repeat(s, n) {
    var ss = [];
    for (var i = 0; i < n; i++)
      ss.push(s);
    return ss.join('');
  }

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

  function drawBoardAsText(board) {
    var cs = [];
    for (var y = 0; y < boardHeight; y++) {
      cs.push(repeat('  ', boardHeight - (y + 1)));
      for (var x = 0; x < boardWidth; x++) {
        var hex = board[y * boardWidth + x];
        cs.push('[');
        cs.push(makePlayerName(hex.player));
        cs.push(hex.diceCount);
        cs.push(']');
      }
      cs.push('\n');
    }
    return cs.join('');
  }

  function makeGameTree(board, player, spareDiceCount, isFirstMove) {
    return {
      player: player,
      board: board,
      moves: []  // TODO: Implement.
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
    return [];  // TODO: Implement.
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
})();
// vim: expandtab softtabstop=2 shiftwidth=2
