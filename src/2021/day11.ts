import * as fs from "fs";

var array = fs.readFileSync("src/2021/day11.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

function buildGrid(a: string[]) {
  const g = new Array<Array<number>>();
  for (let line of a) {
    g.push(
      line.split("").map((char) => {
        return parseInt(char);
      })
    );
  }
  return g;
}
const grid = buildGrid(array);
const width = grid[0].length;
const height = grid.length;

function printGrid(grid: Array<Array<number>>) {
  grid.forEach((line) => {
    console.log(line.join(""));
  });
}

function processFlashAt(
  grid: Array<Array<number>>,
  x: number,
  y: number
): number {
  // do all around it, and IF we trigger it, then we need to process it flashing too!
  var totalFlashes = 1;
  for (var dx = -1; dx <= 1; dx++) {
    for (var dy = -1; dy <= 1; dy++) {
      const adjx = x + dx;
      const adjy = y + dy;
      if (
        adjx < 0 ||
        adjx >= width ||
        adjy < 0 ||
        adjy >= height ||
        (dx === 0 && dy === 0)
      ) {
        continue;
      }
      grid[adjy][adjx]++;
      if (grid[adjy][adjx] === 10) {
        totalFlashes += processFlashAt(grid, adjx, adjy);
      }
    }
  }
  return totalFlashes;
}

function stepLights(grid: Array<Array<number>>): number {
  // first, they all increase by 1, and track those that flashed
  var flashedThisStep = new Array<Array<number>>();
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      grid[y][x]++;
      if (grid[y][x] === 10) {
        flashedThisStep.push([x, y]);
      }
    }
  }

  // next, process those that flashed
  var totalFlashes = 0;
  for (let pair of flashedThisStep) {
    totalFlashes += processFlashAt(grid, pair[0], pair[1]);
  }

  // now lets reset everything 10 or above to 0
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      if (grid[y][x] >= 10) {
        grid[y][x] = 0;
      }
    }
  }

  return totalFlashes;
}

// part 1
() => {
  var totalFlashes = 0;
  for (let i = 0; i < 100; i++) {
    totalFlashes += stepLights(grid);
  }
  console.log(totalFlashes);
}; // removed call to not alter for part 2!

// part 2
(() => {
  for (let i = 1; ; i++) {
    const flashes = stepLights(grid);
    if (flashes === width * height) {
      console.log(`all flashed at step ${i}`);
      printGrid(grid);
      break;
    }
  }
})();
