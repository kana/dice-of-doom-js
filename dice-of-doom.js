(function () {
  var numberOfPlayers = 2;
  var maximumDice = 3;
  var boardWidth = 2;
  var boardHeight = 2;
  var boardHexCount = boardWidth * boardHeight;

  function random(n) {
    return Math.floor(Math.random() * n);
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
})();
// vim: expandtab softtabstop=2 shiftwidth=2
