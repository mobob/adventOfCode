var fs = require("fs");
var array = fs.readFileSync("src/2021/day1.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});

var increasingCount = 0;
for (let key in lineLengths) {
  //console.log(`number of length ${key}: ${lineLengths[key]}`);
}

// skip the first
for (let i = 1; i < array.length; i++) {
  const last = parseInt(array[i - 1]);
  const cur = parseInt(array[i]);
  increasingCount += cur > last ? 1 : 0;
}

console.log(increasingCount);

// part 2 - only chunks of 3 - so start there
increasingCount = 0;
const sumamt = 3;
for (let i = sumamt; i < array.length; i++) {
  var lastSum = 0;
  for (let lasti = i - sumamt; lasti < i; lasti++) {
    lastSum += parseInt(array[lasti]);
  }
  var curSum = 0;
  for (let lasti = i - sumamt + 1; lasti <= i; lasti++) {
    curSum += parseInt(array[lasti]);
  }

  increasingCount += curSum > lastSum ? 1 : 0;
}

console.log(increasingCount);
