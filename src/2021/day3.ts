import * as fs from "fs";
import { parse } from "path/posix";

var array = fs.readFileSync("src/2021/day3.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

// if numbers - don't really want to do this here...
// const numbers: Array<number> = array.map((value) => {
//   parseInt(value, 2);
// });

/// End Boilerplate

// assume all the same len
const binCount = array[0].length;
const oneCount = new Array<number>(binCount).fill(0);
const zeroCount = new Array<number>(binCount).fill(0);
for (var i = 0; i < array.length; i++) {
  for (var c = 0; c < binCount; c++) {
    const char = array[i][c];
    if (char === "1") {
      oneCount[c]++;
    } else if (char === "0") {
      zeroCount[c]++;
    } else {
      throw `unexpected ${char}`;
    }
  }
}

var mostCommonBits = "",
  leastCommonBits = "";
for (var c = 0; c < binCount; c++) {
  if (oneCount[c] > zeroCount[c]) {
    mostCommonBits += "1";
    leastCommonBits += "0";
  } else if (oneCount[c] < zeroCount[c]) {
    mostCommonBits += "0";
    leastCommonBits += "1";
  } else {
    throw `equal!!!`;
  }
}

const product = parseInt(mostCommonBits, 2) * parseInt(leastCommonBits, 2);
console.log(product);

// part 2

function countCommonality(a: string[], countingMostCommon: boolean): string {
  const binCount = a[0].length;
  const oneCount = new Array<number>(binCount).fill(0);
  const zeroCount = new Array<number>(binCount).fill(0);
  for (var i = 0; i < a.length; i++) {
    for (var c = 0; c < binCount; c++) {
      const char = a[i][c];
      if (char === "1") {
        oneCount[c]++;
      } else if (char === "0") {
        zeroCount[c]++;
      } else {
        throw `unexpected ${char}`;
      }
    }
  }

  var mostCommonBits = "",
    leastCommonBits = "";
  for (var c = 0; c < binCount; c++) {
    if (oneCount[c] > zeroCount[c]) {
      mostCommonBits += "1";
      leastCommonBits += "0";
    } else if (oneCount[c] < zeroCount[c]) {
      mostCommonBits += "0";
      leastCommonBits += "1";
    } else {
      // this is the tie break
      mostCommonBits += "1";
      leastCommonBits += "0";
    }
  }

  return countingMostCommon ? mostCommonBits : leastCommonBits;
}

var mostCommonArray = [...array];
var leastCommonArray = [...array];
for (var c = 0; c < binCount; c++) {
  if (mostCommonArray.length > 1) {
    // recount
    const mostCommonBits = countCommonality(mostCommonArray, true);

    var newMostCommonArray: string[] = [];
    mostCommonArray.forEach((val) => {
      if (val[c] === mostCommonBits[c]) {
        newMostCommonArray.push(val);
      }
    });
    mostCommonArray = newMostCommonArray;
  }
  if (leastCommonArray.length > 1) {
    // recound
    const leastCommonBits = countCommonality(leastCommonArray, false);

    var newLeastCommonArray: string[] = [];
    leastCommonArray.forEach((val) => {
      if (val[c] === leastCommonBits[c]) {
        newLeastCommonArray.push(val);
      }
    });
    leastCommonArray = newLeastCommonArray;
  }
}

console.log(mostCommonArray);
console.log(leastCommonArray);
console.log(parseInt(mostCommonArray[0], 2) * parseInt(leastCommonArray[0], 2));
