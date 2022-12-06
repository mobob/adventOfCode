import assert from "assert";
import * as fs from "fs";

var array = fs.readFileSync("src/2022/day1.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

function go() {
  // lets keep all the calories seperate for each elf, and keep a runner of their sums too
  var sums: number[] = [];
  var calories: [number[]] = [[]];
  array.forEach((element: string, index) => {
    var curElf = calories[sums.length];
    if (element.trim().length !== 0) {
      curElf.push(parseInt(element));
    }
    if (element.trim().length === 0 || index + 1 >= array.length) {
      sums.push(
        curElf.reduce((prev, cur) => {
          return prev + cur;
        }, 0)
      );
      calories.push([]);
    }
  });

  let maxCals = sums.reduce((prev, cur) => {
    return prev > cur ? prev : cur;
  }, 0);

  console.log(`sums: ${sums}`);
  console.log(`calories: ${calories}`);
  console.log(`max carrier: ${maxCals}`);

  // part two
  var sorted = sums.sort((a, b) => {
    return a - b;
  });
  console.log(`sorted pre: ${sorted}`);
  let totalOf3Biggest =
    (sorted.pop() ?? 0) + (sorted.pop() ?? 0) + (sorted.pop() ?? 0);
  console.log(`sorted post: ${sorted}`);
  console.log(`total of 3 biggest: ${totalOf3Biggest}`);
}

go();
