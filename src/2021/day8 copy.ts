import { FORMERR } from "dns";
import * as fs from "fs";
import { decode } from "punycode";

var array = fs
  .readFileSync("src/2021/day8test.txt")
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

interface CodedNumber {
  code: string;
}

interface SignalOutputPair {
  codedNumbers: Array<CodedNumber>;
  outputValues: Array<CodedNumber>;
}

function parseInput(array: Array<string>): {
  signalOutputPairs: Array<SignalOutputPair>;
} {
  const pairs = new Array<SignalOutputPair>();
  array.forEach((line) => {
    const side = line.split("|");
    const pattern: Array<CodedNumber> = side[0]
      .trim()
      .split(" ")
      .map((value) => {
        return { code: value };
      });
    const output: Array<CodedNumber> = side[1]
      .trim()
      .split(" ")
      .map((value) => {
        return { code: value };
      });
    pairs.push({ codedNumbers: pattern, outputValues: output });
  });
  return { signalOutputPairs: pairs };
}
let { signalOutputPairs } = parseInput(array);

//console.dir(signalOutputPairs);

/**  0:      1:      2:      3:      4:
 aaaa    ....    aaaa    aaaa    ....
b    c  .    c  .    c  .    c  b    c
b    c  .    c  .    c  .    c  b    c
 ....    ....    dddd    dddd    dddd
e    f  .    f  e    .  .    f  .    f
e    f  .    f  e    .  .    f  .    f
 gggg    ....    gggg    gggg    ....

  5:      6:      7:      8:      9:
 aaaa    aaaa    aaaa    aaaa    aaaa
b    .  b    .  .    c  b    c  b    c
b    .  b    .  .    c  b    c  b    c
 dddd    dddd    ....    dddd    dddd
.    f  e    f  .    f  e    f  .    f
.    f  e    f  .    f  e    f  .    f
 gggg    gggg    ....    gggg    gggg */
// lets map the above as an array of bools for each digit
// will use the letter ordering above as the indices 0->9, a-g
const segementsEnabledForDigit = [
  [1, 1, 1, 0, 1, 1, 1],
  [0, 0, 1, 0, 0, 1, 0], // 1
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 1],
  [0, 1, 1, 1, 0, 1, 0],
  [1, 1, 0, 1, 0, 1, 1],
  [1, 1, 0, 1, 1, 1, 1],
  [1, 0, 1, 0, 0, 1, 0], // 7
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 0, 1, 1],
];

function enabledCountFor(num: number) {
  return segementsEnabledForDigit[num].reduce((prev, cur) => {
    return prev + cur;
  }, 0);
}
// lets check to see ones that have a distance of two
function differencesBetween(ind1: number, ind2: number): Array<number> {
  var diffs = new Array<number>();
  for (var i = 0; i < 7; i++) {
    if (
      segementsEnabledForDigit[ind1][i] !== segementsEnabledForDigit[ind2][i]
    ) {
      diffs.push(i);
    }
  }
  return diffs;
}

interface VaryingInfo {
  len: number;
  smaller: number;
  larger: number;
  differentIndices: Array<number>;
}
function numbersThatVaryBy(distance: number) {
  const results = new Array<VaryingInfo>();
  for (var i = 0; i < segementsEnabledForDigit.length; i++) {
    for (var j = i + 1; j < segementsEnabledForDigit.length; j++) {
      const diffs = differencesBetween(i, j);
      if (diffs.length === distance) {
        // find out which one is smaller
        const iec = enabledCountFor(i);
        const jec = enabledCountFor(j);
        if (iec < jec) {
          results.push({
            len: iec,
            smaller: i,
            larger: j,
            differentIndices: diffs,
          });
        } else {
          results.push({
            len: jec,
            smaller: j,
            larger: i,
            differentIndices: diffs,
          });
        }
      }
    }
  }
  return results;
}

function displayDifferences() {
  for (var diff = 1; diff <= 7; diff++) {
    console.log(
      `numbers that differ by ${diff}: '${JSON.stringify(
        numbersThatVaryBy(diff)
      )}'`
    );
  }
}
displayDifferences();

// don't really need this method
function numberOfSegmentsUsed(num: number): number {
  switch (num) {
    case 0:
      return 6;
    case 1: // unique
      return 2;
    case 2:
      return 5;
    case 3:
      return 5;
    case 4: // unique
      return 4;
    case 5:
      return 5;
    case 6:
      return 6;
    case 7: // unique
      return 3;
    case 8: // unique
      return 7;
    case 9:
      return 6;
  }
  throw `bad input num ${num}`;
}

function processTotals(signalOutputPairs: Array<SignalOutputPair>) {
  const totalOutputsOfLenUsed = new Array<number>(7 + 1).fill(0);
  signalOutputPairs.forEach((pair) => {
    pair.outputValues.forEach((ov) => {
      totalOutputsOfLenUsed[ov.code.length]++;
    });
  });

  console.dir(totalOutputsOfLenUsed);

  console.log(
    `unique: ${
      totalOutputsOfLenUsed[2] +
      totalOutputsOfLenUsed[3] +
      totalOutputsOfLenUsed[4] +
      totalOutputsOfLenUsed[7]
    }`
  );
}
processTotals(signalOutputPairs);

// part 2 - some is mixed above

class SignalDecoder {
  // map of char to 0-6 of the positions
  knownLetters = new Map<String, number>();

  decodeValue(value: CodedNumber) {
    const decodedSegments = new Array<number>(7).fill(0);
    for (var char = 0; char < value.code.length; char++) {
      decodedSegments[this.knownLetters.get(value.code[char])!] = 1;
    }

    // now figure out what actual number it is
    for (var i = 0; i <= 9; i++) {
      var match = true;
      for (var j = 0; j < 7; j++) {
        if (segementsEnabledForDigit[i][j] !== decodedSegments[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        // we found it!
        return i;
      }
    }

    throw `didn't find the number!`;
  }

  identifyDecoderAndDecodeValue(signalOutputPairs: SignalOutputPair): number {
    // map the signals into "by length" map
    var byLengthSignals = new Map<number, Array<string>>();
    signalOutputPairs.codedNumbers.forEach((val) => {
      const len = val.code.length;
      const cur = byLengthSignals.get(len) ?? [];
      cur.push(val.code);
      byLengthSignals.set(len, cur);
    });

    // work our way from differences of 1 and up, until we've figured it all out
    // TODO - 1 to 7
    for (var diff = 1; diff <= 7 && this.knownLetters.size < 7; diff++) {
      const varyingInfo = numbersThatVaryBy(diff);

      varyingInfo.forEach((vi) => {
        // make a new array of the differing indices
        var differeingIndices = [...vi.differentIndices];

        // remove any that are already accounted for
        this.knownLetters.forEach((value, key) => {
          console.log(key, value);

          differeingIndices.splice(value);
        });

        // we should have one left
        if (differeingIndices.length > 1) {
          throw `too many left`;
        }
        if (differeingIndices.length === 0) {
          return;
        }

        // now look at our signals which ones match at the length
        const signals = byLengthSignals.get(vi.len);

        // IF there is exactly one of these signals of this size, we're good
        if (signals?.length !== 1) {
          console.log("too many signals");
          return;
        }

        // IF there is exactly one of THESE signals we're good
        const biggerSignals = byLengthSignals.get(vi.len + diff);
        if (biggerSignals?.length !== 1) {
          console.log("too many signals on next level up");
          return;
        }

        // this too for now ?
        // vi.differentIndices

        console.log(
          `found a good looking signal for dist ${diff}: ${JSON.stringify(
            varyingInfo
          )}`
        );

        // get the next signal up in length
        const smallerSignal = signals[0];
        const biggerSignal = biggerSignals[0];

        // find the letters that don't match, ie is its the larger but not the smaller
        var decodedChars = new Array<string>();
        for (var char = 0; char < biggerSignal.length; char++) {
          if (smallerSignal.indexOf(biggerSignal[char]) >= 0) {
            // nope
            continue;
          }

          decodedChars.push(biggerSignal[char]);
        }

        // now remove from this list those that are in

        // can add it in, we know what it is now!
        this.knownLetters.set(decodedChar, vi.differentIndices[0]);

        console.log(
          `decoded letter: ${decodedChar} to segment ${vi.differentIndices[0]}`
        );
        console.dir(signalOutputPairs);
      });
    }

    if (this.knownLetters.size !== 7) {
      throw `failed to determine, what we have figured out is: ${this.knownLetters}`;
    }

    var stringNumber = "";
    signalOutputPairs.outputValues.forEach((val) => {
      stringNumber += this.decodeValue(val).toString();
    });

    return parseInt(stringNumber);
  }
}

const sd = new SignalDecoder();
console.log(sd.identifyDecoderAndDecodeValue(signalOutputPairs[0]));
