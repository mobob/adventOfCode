import * as fs from "fs";

var array = fs.readFileSync("src/2021/day4.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

// first line, is different, its the numbers
const bingoNumbersCalled: Array<number> = array[0]
  .split(",")
  .map((val) => parseInt(val));

// now split n build the boards
const allLines = array.slice(2);

interface Board {
  rows: number[][];
}
function parseBoards(lines: string[]): Board[] {
  var boards = new Array<Board>();
  var start = 0;
  while (start < lines.length) {
    var board: Board = {
      rows: [],
    };
    for (var i = start; i < 5 + start; i++) {
      const parsedLine = lines[i].split(" ");
      var row = Array<number>();
      parsedLine.forEach((val) => {
        if (val.trim().length > 0) {
          row.push(parseInt(val));
        }
      });
      if (row.length != 5) {
        throw `bad parse: ${parsedLine}`;
      }
      board.rows.push(row);
    }
    boards.push(board);
    start += 6;

    //console.log(board);
  }
  return boards;
}

function unmarkedNumbers(
  board: Board,
  calledNumbers: Array<number>
): Array<number> {
  const set = new Set<number>(calledNumbers);
  const uncalled = new Array<number>();
  for (var i = 0; i < 5; i++) {
    for (var j = 0; j < 5; j++) {
      if (!set.has(board.rows[i][j])) {
        uncalled.push(board.rows[i][j]);
      }
    }
  }
  return uncalled;
}

function hasBingo(board: Board, calledNumbers: Array<number>): boolean {
  // check vertical lines
  const set = new Set<number>(calledNumbers);
  const uncalled = new Array<number>();
  for (var i = 0; i < 5; i++) {
    var allGood = true;
    for (var j = 0; j < 5; j++) {
      if (!set.has(board.rows[i][j])) {
        allGood = false;
      }
    }
    if (allGood) {
      return true;
    }
  }

  // check horizantal lines
  for (var i = 0; i < 5; i++) {
    var allGood = true;
    for (var j = 0; j < 5; j++) {
      if (!set.has(board.rows[j][i])) {
        allGood = false;
      }
    }
    if (allGood) {
      return true;
    }
  }

  return false;
}

const boards = parseBoards(allLines);

//console.dir(boards);

// now we go until we find a board that has a bingo
function findFirstBingo(boards: Array<Board>, calledNumbers: Array<number>) {
  // go until we get a bingo
  for (var i = 0; i < calledNumbers.length; i++) {
    for (var b = 0; b < boards.length; b++) {
      const curCalledNumbers = calledNumbers.slice(0, i + 1);
      if (hasBingo(boards[b], curCalledNumbers)) {
        console.log(`bingo on ${b} at number ${i}`);

        const unmarked = unmarkedNumbers(boards[b], curCalledNumbers);
        const sum = unmarked.reduce((prev, cur) => {
          return prev + cur;
        });

        const lastNumber = curCalledNumbers[curCalledNumbers.length - 1];

        console.log(lastNumber * sum);

        return;
      }
    }
  }
}

findFirstBingo(boards, bingoNumbersCalled);

// part 2

function findLastBingo(boards: Array<Board>, calledNumbers: Array<number>) {
  // create a new array of the indices, and remove from them as they bingo
  var notFoundYet = [...Array(boards.length).keys()];

  for (var i = 0; i < calledNumbers.length; i++) {
    for (var b = 0; b < boards.length; b++) {
      // if we've already marked it, skip it
      if (notFoundYet.indexOf(b) === -1) {
        continue;
      }

      const curCalledNumbers = calledNumbers.slice(0, i + 1);
      if (hasBingo(boards[b], curCalledNumbers)) {
        console.log(`bingo on ${b} at number ${i}`);

        const deleteIndex = notFoundYet.indexOf(b);
        if (deleteIndex === -1) {
          throw `bad to delete index`;
        }
        notFoundYet.splice(deleteIndex, 1);

        // if there is only one left, this is the last one!
        if (notFoundYet.length === 0) {
          console.log(`last one!`);
          const unmarked = unmarkedNumbers(boards[b], curCalledNumbers);
          const sum = unmarked.reduce((prev, cur) => {
            return prev + cur;
          });

          const lastNumber = curCalledNumbers[curCalledNumbers.length - 1];

          console.log(lastNumber * sum);

          return;
        }
      }
    }
  }
}

findLastBingo(boards, bingoNumbersCalled);
