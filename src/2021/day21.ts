import * as fs from "fs";

var array = fs.readFileSync("src/2021/day21.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

// returns starting positions of the two players
function parseInput(a: Array<string>): Array<number> {
  const startingPositions: number[] = [];
  a.forEach((line) => {
    const matches = line.match(/-?\d+/g);
    startingPositions.push(parseInt(matches![1]));
  });
  return startingPositions;
}

interface Dice {
  roll(): number;
  get timesRolled(): number;
}

class GameState {
  playerPositions = new Array<number>(2).fill(1);
  playerScores = new Array<number>(2).fill(0);
  dice = new DeterministicDice();

  newPosition(oldPosition: number, diceRoll: number) {
    var newPosition = (oldPosition + diceRoll) % 10;
    return newPosition === 0 ? 10 : newPosition;
  }

  takeTurn(playerIndex: number) {
    var pos = this.playerPositions[playerIndex];
    for (var i = 0; i < 3; i++) {
      pos = this.newPosition(pos, this.dice.roll());
    }
    this.playerScores[playerIndex] += pos;
    this.playerPositions[playerIndex] = pos;
  }

  get gameComplete(): boolean {
    return this.playerScores.reduce((prev: boolean, cur) => {
      return prev || cur >= 1000;
    }, false);
  }
}

class DeterministicDice implements Dice {
  current: number = 1;
  rolls = 0;
  roll(): number {
    this.rolls++;
    const willReturn = this.current;
    this.current++;
    if (this.current > 100) {
      this.current = 1;
    }
    return willReturn;
  }
  get timesRolled(): number {
    return this.rolls;
  }
}

(() => {
  const startingPositions = parseInput(array);

  console.log(startingPositions);

  const gs = new GameState();
  gs.playerPositions = startingPositions;

  var currentTurn = 0;
  while (!gs.gameComplete) {
    gs.takeTurn(currentTurn);
    currentTurn++;
    currentTurn %= 2;
  }

  const losingScore = gs.playerScores.reduce((prev, cur) => {
    return prev < cur ? prev : cur;
  }, Infinity);

  console.log(gs.dice.timesRolled * losingScore);
})();
