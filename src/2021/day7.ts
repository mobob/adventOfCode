import { match } from "assert";
import { count } from "console";
import * as fs from "fs";

var array = fs.readFileSync("src/2021/day7.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

const horizPositions: Array<number> = array[0]
  .trim()
  .split(",")
  .map((val) => {
    return parseInt(val);
  });

const max = horizPositions.reduce((prev, cur) => {
  return prev > cur ? prev : cur;
}, 0);

// lets build an array of counts
function arrayOfCounts(horizPositions: Array<number>): Array<number> {
  const result = Array(max + 1).fill(0);
  horizPositions.forEach((val) => {
    result[val]++;
  });
  return result;
}

function gasToGetToPosition(
  arrayOfCounts: Array<number>,
  target: number
): number {
  return arrayOfCounts.reduce((prev, cur, ind) => {
    return prev + cur * Math.abs(ind - target);
  }, 0);
}

function costToMove(maxDistance: number): Array<number> {
  const values = new Array<number>(maxDistance + 1).fill(0);
  for (var i = 1; i <= maxDistance; i++) {
    values[i] = values[i - 1] + i;
  }
  return values;
}

const globalCostsToMove = costToMove(10000);

function gasToGetToPositionIncreasing(
  arrayOfCounts: Array<number>,
  target: number
): number {
  return arrayOfCounts.reduce((prev, cur, ind) => {
    const distance = Math.abs(ind - target);
    return prev + cur * globalCostsToMove[distance];
  }, 0);
}

function findCheapestPosition(
  arrayOfCounts: Array<number>,
  countFun: typeof gasToGetToPosition = gasToGetToPosition
) {
  // we'll assume the array is basically "sorted"
  // nawww...  lets just iterate

  var totalGases = new Array<number>(max).fill(0);
  arrayOfCounts.forEach((val, ind) => {
    totalGases[ind] = countFun(arrayOfCounts, ind);
  });

  // now find the smallest
  var minInd = 0;
  var minVal = totalGases.reduce((prev, cur, ind) => {
    if (prev > cur || minInd === 0) {
      minInd = ind;
      return cur;
    } else {
      return prev;
    }
  }, 0);

  //console.dir(arrayOfCounts);
  //console.dir(totalGases);
  console.log(`min position ${minInd}, value: ${minVal}`);
}

const counts = arrayOfCounts(horizPositions);

console.log(`gasToGetToPosition to 3: ${gasToGetToPosition(counts, 3)}`);
console.log(
  `gasToGetToPositionIncreasing to 5: ${gasToGetToPositionIncreasing(
    counts,
    5
  )}`
);

findCheapestPosition(counts);
findCheapestPosition(counts, gasToGetToPositionIncreasing);
