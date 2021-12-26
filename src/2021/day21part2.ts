import * as fs from "fs";

var array = fs
  .readFileSync("src/2021/day21test.txt")
  .toString()
  .trim()
  .split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

//const scoreForWin = 21;
const scoreForWin = 5;

// returns starting positions of the two players
function parseInput(a: Array<string>): Array<number> {
  const startingPositions: number[] = [];
  a.forEach((line) => {
    const matches = line.match(/-?\d+/g);
    startingPositions.push(parseInt(matches![1]));
  });
  return startingPositions;
}

class GameState {
  playerPositions = new Array<number>(2).fill(1);
  playerScores = new Array<number>(2).fill(0);
  dice = new DiracDice();

  clone(): GameState {
    const c = new GameState();
    c.playerPositions = [...this.playerPositions];
    c.playerScores = [...this.playerScores];
    c.dice = this.dice;
    return c;
  }

  newPosition(oldPosition: number, diceRoll: number) {
    var newPosition = (oldPosition + diceRoll) % 10;
    return newPosition === 0 ? 10 : newPosition;
  }

  // we need to go deep
  takeTurnTilScore(playerIndex: number) {
    var pos = this.playerPositions[playerIndex];

    // we know there are 27 possible combinations here
    for (var i = 0; i < this.dice.allDiceRolls.length; i++) {
      const universeRolls = this.dice.allDiceRolls[i];

      this.playerScores[playerIndex] += pos;
      this.playerPositions[playerIndex] = pos;
    }
  }

  get gameComplete(): boolean {
    return this.playerScores.reduce((prev: boolean, cur) => {
      return prev || cur >= 1000;
    }, false);
  }
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
          result.push(r1 + r2 + r3);
        });
      });
    });
    return result;
  }
}

(() => {
  const startingPositions = parseInput(array);

  console.log(startingPositions);

  const gs = new GameState();
  gs.playerPositions = startingPositions;

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

  // we also need to build up the unique dice rolls (the incremental scores) that can be used
  // to get to a given spot. for instance, if we end up at spot 5, there is 1 roll of 3 (from 2),
  // 3 rolls of 4 (from 1), 6 rolls of 5 (from 10), 7 rolls of 6 (from 9), ...
  // so = drctltrp[5] = [0, 0, 0, 1, 3, 6, 7, 6, 3, 1] (array size of 10, max ind is 9 as the max die roll)
  const diceRollCountsThatLedToResultantPosition = [
    0, 0, 0, 1, 3, 6, 7, 6, 3, 1,
  ];
  // new Array<number[]>(11);
  // for (
  //   var resultantPosition = 0;
  //   resultantPosition <= 10;
  //   resultantPosition++
  // ) {
  //   diceRollCountThatLedToResultantPosition[resultantPosition] =
  //     new Array<number>(10).fill(0);
  //   if (resultantPosition < 3) {
  //     continue;
  //   }
  //   startingPosToNewPositionPossibilities[i].forEach(
  //     (newPositionPossibliites, newPosition) => {}
  //   );
  // }

  // the above shows it just cascades around, if pos starts at 1, adding starting at 4 1,3,6,7,6,3,1 up to 10.

  // hence after every turn there are 27 individual new scores, but actually only 7 unique values

  // so we can represent the game state as the number of times a given player will be in the various positions

  // for scoring, the minimal we can move is 3 per turn, this doesn't necessarily result in the slowest victory.
  // but again, we can just count the number of scores we will have at that point in time

  // so we have to go until there are no scores below 21
  // as a player takes a turn and their score goes above 21, we sub from their score counts, and add them as victors
  // and we go until the array is empty

  const positionCounts = new Array<number[]>(2);
  startingPositions.forEach((pos, playerIndex) => {
    positionCounts[playerIndex] = new Array<number>(11)
      .fill(0)
      .map((_, ind) => {
        return ind === pos ? 1 : 0;
      });
  });

  // scores are all zero, but we init our two players both at score of 0
  const scoreCounts = [
    new Array<number>(21).fill(0),
    new Array<number>(21).fill(0),
  ];
  scoreCounts[0][0] = 1;
  scoreCounts[1][0] = 1;

  var noWinnersThisTurn = true;
  var winningCounts = [0, 0];
  var currentTurn = 0;
  var turnCount = 0;
  while (
    // don't test if no winners this turn
    noWinnersThisTurn ||
    // ensure there is something in the score array by counting it all up, and continue
    // only if both of them have a score
    (scoreCounts[0].reduce((prev, cur) => {
      return prev + cur;
    }, 0) > 0 &&
      scoreCounts[1].reduce((prev, cur) => {
        return prev + cur;
      }, 0) > 0)
  ) {
    // take our turn

    // determine what the next turn looks like and how many we have in each position
    // we want a map of currentPosition -> (newPosition -> resultantCountFromOldToNewPosition)
    // var positionCountIncrements = new Array<Array<number>>(11).fill([]);
    var newPositionCounts = new Array<number>(11).fill(0);
    const newScoreCounts = new Array<number>(21).fill(0);

    positionCounts[currentTurn].forEach((numInPosition, position) => {
      if (position === 0) return;
      // positionCountIncrements[position] = new Array<number>(11).fill(0);
      startingPosToNewPositionPossibilities[position].forEach(
        (newPositionCount, newPosition) => {
          if (newPosition === 0) return;
          // positionCountIncrements[position][newPosition] =
          //   newPositionCount * numInPosition;

          const newPositionCountIncrement = newPositionCount * numInPosition;
          newPositionCounts[newPosition] += newPositionCountIncrement;

          if (newPositionCountIncrement === 0) return;

          // now we do scores
          for (var curScore = 20; curScore >= 0; curScore--) {
            // if we didn't have any at the original score, we can skip this
            if (scoreCounts[currentTurn][curScore] === 0) continue;

            const newScore = curScore + newPosition;
            if (newScore >= 21) {
              // we have a winner! - not sure this is right?
              winningCounts[currentTurn] += newPositionCountIncrement;
              noWinnersThisTurn = false;
            } else {
              newScoreCounts[newScore] += newPositionCountIncrement;
            }

            // // in both cases, subtract from the position as we've consumed it
            // newScoreCounts[curScore] -= numInPosition;

            // // SANITY
            // if (newScoreCounts[curScore] < 0) {
            //   throw `took off too much score counts`;
            // }
          }
        }
      );
    });

    // we can re-assign the position counts, just gotta map it together
    positionCounts[currentTurn] = newPositionCounts;
    scoreCounts[currentTurn] = newScoreCounts;

    turnCount++;
    console.log(
      `t:${turnCount} player ${currentTurn}: score counts: ${scoreCounts[currentTurn]}, pos: ${positionCounts[currentTurn]}`
    );

    console.log(
      `num positions: ${positionCounts[currentTurn].reduce((prev, cur) => {
        return prev + cur;
      })}`
    );
    console.log(
      `num scores: ${scoreCounts[currentTurn].reduce((prev, cur) => {
        return prev + cur;
      })}`
    );

    // positionCounts[currentTurn].forEach((numInPosition, position) => {
    //   if (position === 0) return;
    //   startingPosToNewPositionPossibilities[position].forEach(
    //     (newPositionCount, newPosition) => {
    //       if (newPosition === 0) return;
    //       positionCountIncrements[newPosition] +=
    //         newPositionCount * numInPosition;
    //     }
    //   );
    // });

    // increment our current positions
    // TODO - NO - we just replace the array, as all those positions will advance
    //positionCounts[currentTurn] = positionCountIncrements;
    // positionCountIncrements.forEach((inc, position) => {
    //   positionCounts[currentTurn][position] += inc;
    // });

    // do up our scores - we can start at the max and work our way down to avoid clobbering values
    // for (var curScore = 20; curScore >= 0; curScore--) {
    //   positionCountIncrements.forEach((inc, afterMovePosition) => {
    //     //positionCounts[currentTurn].forEach((currentPositionCount, currentPosition) => {
    //     if (afterMovePosition === 0) return;

    //     // the after move position is the incremental score we need to add

    //     // and inc is the number from the multiplier from the original position???

    //     // do the scores - go through each die count increment

    //     // if the ROLL (ie score increment) + current scores will move us to >=21, then we need
    //     // to flag as won the number
    //     if (afterMovePosition + curScore >= 21) {
    //       // a winner! the dice roll count, * the number that were in this position are now winners
    //       winningCounts[currentTurn] += inc;
    //       noWinnersThisTurn = false;
    //     } else {
    //       scoreCounts[currentTurn][afterMovePosition + curScore] += inc; //scoreCounts[currentTurn][afterMovePosition] * inc;
    //     }

    //     // in both cases, subtract from the position as we've consumed it
    //     scoreCounts[currentTurn][afterMovePosition] -= inc;

    //     ///// leaving off here...  need a clear head :)
    //   });
    // }

    currentTurn++;
    currentTurn %= 2;
  }

  // we done
  console.log(winningCounts);
})();
