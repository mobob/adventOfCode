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

class DiracDice {
  allDiceRolls = this.buildThreeRolledCombos();

  rolls = 0;
  roll(): number[] {
    this.rolls++;
    // const willReturn = this.current;
    // this.current %= 3;
    // return this.current === 0 ? 3 : this.current;
    return [1, 2, 3];
  }
  get timesRolled(): number {
    return this.rolls;
  }

  buildThreeRolledCombos(): number[] {
    const result: number[] = [];
    [1, 2, 3].forEach((r1) => {
      [1, 2, 3].forEach((r2) => {
        [1, 2, 3].forEach((r3) => {
          console.log(`${r1} ${r2} ${r3}`);
          result.push(r1 + r2 + r3);
        });
      });
    });
    return result;
  }
}

class Pair {
  elements!: [number, number];
  constructor($p0: number, $p1: number) {
    this.elements = [$p0, $p1];
  }
  asString(): string {
    return `${this.elements[0]},${this.elements[1]}`;
  }
}

function pairFromString(pstr: string): Pair {
  const matches = pstr.match(/-?\d+/g);
  return new Pair(parseInt(matches![0]), parseInt(matches![1]));
}

(() => {
  const startingPositions = parseInput(array);

  console.log(startingPositions);

  var currentTurn = 0;

  // there are 10 starting positions, that will result in 10 * 27 different outputs
  // based on the different die rolls. lets see what they look like
  const dd = new DiracDice();
  const startingPosToNewPositionPossibilities = new Array<number[]>(11);
  for (var i = 1; i <= 10; i++) {
    const possible: number[] = [];
    const counts = new Array<number>(11).fill(0);
    dd.allDiceRolls.forEach((roll) => {
      var newPosition = (i + roll) % 10;
      newPosition = newPosition === 0 ? 10 : newPosition;
      possible.push(newPosition);
      counts[newPosition]++;
    });
    console.log(`for starting ${i}: ${possible}`);
    console.log(counts);

    //startingPosToNewPositionPossibilities.set(i, counts);
    startingPosToNewPositionPossibilities[i] = counts;
  }

  const positionCounts = new Array<number[]>(2);
  startingPositions.forEach((pos, playerIndex) => {
    positionCounts[playerIndex] = new Array<number>(11)
      .fill(0)
      .map((_, ind) => {
        return ind === pos ? 1 : 0;
      });
  });

  // map of
  // score pair ->
  //   position pair ->
  //     count of games ongoing in that exact position
  var scoresMap = new Map<string, Map<string, number>>();
  const startingPositionMap = new Map<string, number>();
  startingPositionMap.set(
    new Pair(startingPositions[0], startingPositions[1]).asString(),
    1
  );
  scoresMap.set(new Pair(0, 0).asString(), startingPositionMap);

  var winningCounts = [0, 0];
  var currentTurn = 0;
  var turnCount = 0;

  while (
    // ensure there is something in the score array by counting it all up, and continue
    // only if both of them have a score
    scoresMap.size > 0
  ) {
    // take our turn

    // init a new score map we'll populate as we go, and will swap at the end
    const newScoresMap = new Map<string, Map<string, number>>();

    scoresMap.forEach((positionMap, scoresPairString) => {
      const scoresPair = pairFromString(scoresPairString);
      positionMap.forEach(
        (countInCurrentScoresAndPositions, positionPairString) => {
          const positionsPair = pairFromString(positionPairString);

          const currentPositionForCurrentPlayer =
            positionsPair.elements[currentTurn];

          // go through all the possible new positions for this given position
          startingPosToNewPositionPossibilities[
            currentPositionForCurrentPlayer
          ].forEach((newPositionCount, newPosition) => {
            if (newPosition === 0) return;

            const newPositionCountIncrement =
              newPositionCount * countInCurrentScoresAndPositions;

            const newScore = scoresPair.elements[currentTurn] + newPosition;
            if (newScore >= 21) {
              // we have a winner! in this many universes this player just won
              winningCounts[currentTurn] += newPositionCountIncrement;

              // this isn't going to get inserted into the new map, so effectively will get deleted
            } else {
              // otherwise we should add all the resultant new scores in this given new position for next round

              // get from our map if it exists - first build the new score key
              var newScoresPair = pairFromString(scoresPairString);
              newScoresPair.elements[currentTurn] = newScore;

              if (!newScoresMap.has(newScoresPair.asString())) {
                newScoresMap.set(
                  newScoresPair.asString(),
                  new Map<string, number>()
                );
              }
              const newPositionMap: Map<string, number> = newScoresMap.get(
                newScoresPair.asString()
              )!;

              // build the position key
              var newPositionPair = pairFromString(positionPairString);
              newPositionPair.elements[currentTurn] = newPosition;

              var countToIncrement =
                newPositionMap.get(newPositionPair.asString()) ?? 0;
              newPositionMap.set(
                newPositionPair.asString(),
                countToIncrement + newPositionCountIncrement
              );
            }
          });
        }
      );
    });

    scoresMap = newScoresMap;

    turnCount++;

    var totalGames = 0;
    scoresMap.forEach((positionMap) => {
      positionMap.forEach((count) => {
        totalGames += count;
      });
    });
    console.log(
      `t:${turnCount} player ${currentTurn}, totalGamesOngoing: ${totalGames} winningTotals: ${winningCounts}`
    );

    currentTurn++;
    currentTurn %= 2;
  }

  // we done
  console.log(winningCounts);
})();
