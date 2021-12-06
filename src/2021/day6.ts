import * as fs from "fs";

var array = fs.readFileSync("src/2021/day6.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

const gen0: Array<number> = array[0]
  .trim()
  .split(",")
  .map((val) => {
    return parseInt(val);
  });

//console.log(gen0);

function nextFish(cur: number): [number, number?] {
  if (cur > 0) {
    return [cur - 1];
  }

  return [6, 8];
}

function nextGeneration(cur: Array<number>): Array<number> {
  var result = new Array<number>();
  var newFish = new Array<number>();

  cur.forEach((val) => {
    const nextIteration = nextFish(val);
    result.push(nextIteration[0]);
    if (nextIteration[1]) {
      newFish.push(nextIteration[1]);
    }
  });

  return [...result, ...newFish];
}

function calcTo(lastDay: number): Array<number> {
  var cur: Array<number> = gen0;
  for (var i = 1; i <= lastDay; i++) {
    cur = nextGeneration(cur);
  }
  console.log(`after ${lastDay} iterations we have ${cur.length} fish`);
  return cur;
}

// uncomment to see result of part 1: const res = calcTo(80);
//console.log(res);

// part 2 - lets just count those on the given day

// lets convert what we have in to an array of counts

function convertToArrayOfCounts(gen: Array<number>): Array<number> {
  const max = gen.reduce((prev, cur) => {
    return prev > cur ? prev : cur;
  }, 0);
  var result = new Array<number>();
  for (var i = 0; i <= max; i++) {
    result.push(
      gen.reduce((prev, cur) => {
        return cur === i ? prev + 1 : prev;
      }, 0)
    );
  }
  return result;
}

const gen0counts = convertToArrayOfCounts(gen0);
// 3,4,3,1,2
console.log(`counts: ${gen0counts}`);

const maxDay = 8;
function nextGenerationCounts(curCounts: Array<number>): Array<number> {
  // start with all counts up to 8 being 0
  var resultCounts = new Array(maxDay + 1).fill(0);

  curCounts.forEach((mult, ind) => {
    const nextIterationCounts = nextFish(ind);
    nextIterationCounts.forEach((val) => {
      resultCounts[val!] += mult;
    });
    // console.log(
    //   `day ${ind} has count ${mult}, ngc: ${nextIterationCounts}, and now result counts is: ${resultCounts}`
    // );
  });

  return resultCounts;
}

function calcToCounts(lastDay: number): Array<number> {
  var cur: Array<number> = gen0counts;
  for (var i = 1; i <= lastDay; i++) {
    cur = nextGenerationCounts(cur);
  }
  console.log(`after ${lastDay} iterations...`); // we have ${cur.length} fish`);
  return cur;
}

const resCounts = calcToCounts(256);
const numFish = resCounts.reduce((prev, cur, ind) => {
  return prev + cur;
}, 0);
console.log(`have ${numFish}`);
