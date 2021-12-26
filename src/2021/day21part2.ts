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
          console.log(`${r1} ${r2} ${r3}`);
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

  // we acutally need a count, starting with each score, to a count of each position
  // of that score!
  const scoreMapPerPlayer = new Array<number[][]>(2);
  for (
    var playerIndex = 0;
    playerIndex < scoreMapPerPlayer.length;
    playerIndex++
  ) {
    const scoreMap = new Array<number[]>(21); // we need 0 -> 20
    for (var score = 0; score < scoreMap.length; score++) {
      scoreMap[score] = new Array<number>(11).fill(0);
    }
    scoreMapPerPlayer[playerIndex] = scoreMap;
  }

  // set our inital positions, score 0, and one game each
  startingPositions.forEach((pos, playerIndex) => {
    scoreMapPerPlayer[playerIndex][0][pos] = 1;
  });

  var winningCounts = [0, 0];
  var currentTurn = 0;
  var turnCount = 0;
  while (
    // ensure there is something in the score array by counting it all up, and continue
    // only if both of them have a score
    scoreMapPerPlayer.reduce((prev: number, scores) => {
      return (
        prev +
        scores.reduce((prev: number, positions) => {
          return (
            prev +
            positions.reduce((prev: number, positionCount) => {
              return prev + positionCount;
            }, 0)
          );
        }, 0)
      );
    }, 0) > 0
  ) {
    // take our turn

    // BUG - it seems we're advancing too fast
    // we should occupy every slot until the end...  yet it seems like we're advancing by 2
    // every turn...

    // init a new score map we'll populate as we go, and will swap at the end
    const newScoreMap = new Array<number[]>(21); // we need 0 -> 20
    for (var score = 0; score < newScoreMap.length; score++) {
      newScoreMap[score] = new Array<number>(11).fill(0);
    }

    scoreMapPerPlayer[currentTurn].forEach((positionList, score) => {
      positionList.forEach((countInCurrentPosition, currentPosition) => {
        if (currentPosition === 0) return;
        if (countInCurrentPosition === 0) return;

        // go through all the possible new positions for this given position
        startingPosToNewPositionPossibilities[currentPosition].forEach(
          (newPositionCount, newPosition) => {
            if (newPosition === 0) return;

            const newPositionCountIncrement =
              newPositionCount * countInCurrentPosition;

            if (newPositionCountIncrement === 0) return;

            const newScore = score + newPosition;
            if (newScore >= 21) {
              // we have a winner! in this many universes this player just won
              winningCounts[currentTurn] += newPositionCountIncrement;
            } else {
              // if (newScoreMap[newScore][newPosition] !== 0) {
              //   console.log(
              //     `not 0 ${newScoreMap[newScore][newPosition]} + ${newPositionCountIncrement}`
              //   );
              // }
              // otherwise we should add all the resultant new scores in this given new position for next round
              newScoreMap[newScore][newPosition] += newPositionCountIncrement;
            }
          }
        );
      });
    });

    scoreMapPerPlayer[currentTurn] = newScoreMap;

    // NOW - assuming this isn't the first turn, we need to multiple our score map by 27
    // to account for the other players 27
    //if (turnCount !== 0) {
    scoreMapPerPlayer[currentTurn].forEach((positionCounts, score) => {
      positionCounts.forEach((count, index) => {
        positionCounts[index] *= 9;
      });
    });
    //}

    turnCount++;
    // console.log(
    //   `t:${turnCount} player ${currentTurn}: score counts: ${scoreMapPerPlayer[currentTurn]}`
    // );
    scoreMapPerPlayer[currentTurn].forEach((positionCounts, score) => {
      console.log(
        `t:${turnCount} player ${currentTurn}: score ${score} counts at position: ${positionCounts}`
      );
    });

    const total = scoreMapPerPlayer[currentTurn].reduce(
      (prev: number, positions) => {
        return (
          prev +
          positions.reduce((prev: number, positionCount) => {
            return prev + positionCount;
          }, 0)
        );
      },
      0
    );
    console.log(`total: ${total}, winningTotals: ${winningCounts}`);

    currentTurn++;
    currentTurn %= 2;
  }

  // we done
  console.log(winningCounts);
})();
