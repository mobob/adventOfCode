import { assertOrDie, importInputAsLines } from "./dayBoilerplate";

function pieceScore(xyz: string) {
  return xyz === "X" ? 1 : xyz === "Y" ? 2 : xyz === "Z" ? 3 : 0;
}
function winScore(opponentMove: string, myMove: string): number {
  // Opponent: A for Rock, B for Paper, and C for Scissors
  // Mine: X for Rock, Y for Paper, and Z for Scissors
  /** Rock defeats Scissors, Scissors defeats Paper, and Paper defeats Rock.
   * If both players choose the same shape, the round instead ends in a draw. */
  //if(myMove === opponentMove) return 3;
  if (opponentMove === "A") {
    switch (myMove) {
      case "X":
        return 3;
      case "Y":
        return 6;
      default:
        return 0;
    }
  }
  if (opponentMove === "B") {
    switch (myMove) {
      case "X":
        return 0;
      case "Y":
        return 3;
      default:
        return 6;
    }
  }
  if (opponentMove === "C") {
    switch (myMove) {
      case "X":
        return 6;
      case "Y":
        return 0;
      default:
        return 3;
    }
  }
  console.log(`parse error, shouldn't get here!`);
  return 0;
}
assertOrDie(winScore("A", "X") === 3);
assertOrDie(winScore("B", "X") === 0);
assertOrDie(winScore("C", "X") === 6);
assertOrDie(winScore("A", "Y") === 6);
assertOrDie(winScore("B", "Y") === 3);
assertOrDie(winScore("C", "Y") === 0);
assertOrDie(winScore("A", "Z") === 0);
assertOrDie(winScore("B", "Z") === 6);
assertOrDie(winScore("C", "Z") === 3);

function scoreRound2(opponentMove: string, myOutcome: string): number {
  // Opponent: A for Rock, B for Paper, and C for Scissors
  // X means you need to lose, Y means you need to end the round in a draw, and Z means you need to win. Good luck!"
  /** Rock defeats Scissors, Scissors defeats Paper, and Paper defeats Rock.
   * If both players choose the same shape, the round instead ends in a draw. */
  //if(myMove === opponentMove) return 3;
  let myMove = "";
  if (myOutcome === "Y") {
    // convert ABC -> XYZ
    myMove = String.fromCharCode(
      opponentMove[0].charCodeAt(0) + ("X".charCodeAt(0) - "A".charCodeAt(0))
    );
  }
  if (opponentMove === "A") {
    switch (myOutcome) {
      case "X":
        myMove = "Z";
        break;
      case "Z":
        myMove = "Y";
        break;
    }
  }
  if (opponentMove === "B") {
    switch (myOutcome) {
      case "X":
        myMove = "X";
        break;
      case "Z":
        myMove = "Z";
        break;
    }
  }
  if (opponentMove === "C") {
    switch (myOutcome) {
      case "X":
        myMove = "Y";
        break;
      case "Z":
        myMove = "X";
        break;
    }
  }
  console.log(
    `opponentMove: ${opponentMove}, myOutcome: ${myOutcome} -> myMove: ${myMove}`
  );
  return pieceScore(myMove) + winScore(opponentMove, myMove);
}

function daySolve(inputFileName: string): [string, string | undefined] {
  const lines = importInputAsLines(inputFileName);

  // part 1
  const score1 = lines
    .map((val) => {
      return val.split(" ") as [string, string];
    })
    .map(([opponentMove, myMove]) => {
      return pieceScore(myMove) + winScore(opponentMove, myMove);
    })
    .reduce((cur, prev: number) => {
      return cur + prev;
    }, 0);

  const score2 = lines
    .map((val) => {
      return val.split(" ") as [string, string];
    })
    .map(([opponentMove, myOutcome]) => {
      return scoreRound2(opponentMove, myOutcome);
    })
    .reduce((cur, prev: number) => {
      return cur + prev;
    }, 0);

  return [score1.toString(), score2.toString()];
}

const resultTest = daySolve("day2test.txt");
console.log(`test result: ${resultTest}`);
const result = daySolve("day2.txt");
console.log(`real result: ${result}`);
