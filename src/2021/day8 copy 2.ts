import * as fs from "fs";
import { decode } from "querystring";

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
const segmentsEnabledForDigit = [
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

function segmentLengthForArray(segmentArray: Array<number>): number {
  return segmentArray.reduce((prev, cur) => {
    return prev + cur;
  }, 0);
}

function segmentLengthForDigit(digit: number): number {
  return segmentLengthForArray(segmentsEnabledForDigit[digit]);
}

// ie 0-9
type SegmentNumber = number;

class Decoder {
  piecesDecoded = new Map<string, SegmentNumber>();

  possibleSegments = new Map<string, Set<SegmentNumber>>();

  constructor() {
    const allSegments = new Array(7).map((val, ind) => {
      return ind;
    });
    this.possibleSegments.set("a", new Set([...allSegments]));
    this.possibleSegments.set("b", new Set([...allSegments]));
    this.possibleSegments.set("c", new Set([...allSegments]));
    this.possibleSegments.set("d", new Set([...allSegments]));
    this.possibleSegments.set("e", new Set([...allSegments]));
    this.possibleSegments.set("f", new Set([...allSegments]));
    this.possibleSegments.set("g", new Set([...allSegments]));
  }
}

function toCodedSegments(coded: CodedNumber): Set<string> {
  return new Set([...coded.code]);
}

function setToString<T>(set: Set<T> | undefined): string {
  if (!set) {
    return "";
  }
  const a = Array.from(set);
  return a.reduce((prev, val) => {
    return prev + `${val}`;
  }, "");
}

class PartiallyDecodedString {
  original: CodedNumber;
  decodedSegmentNumbers: Set<SegmentNumber>;
  stillCoded: Set<string>;

  toString(): string {
    //return this.original.code;
    return `still: [${setToString(this.stillCoded)}], decoded: [${setToString(
      this.decodedSegmentNumbers
    )}]`;
  }

  constructor($original: CodedNumber, $decoder: Decoder) {
    this.original = $original;

    const { decodedSegmentNumbers, stillCoded } = this.decode($decoder);
    this.decodedSegmentNumbers = decodedSegmentNumbers;
    this.stillCoded = stillCoded;
  }

  get segmentLength() {
    return this.original.code.length;
  }

  get digit(): string {
    if (!this.isFullyDecoded) {
      throw `not fully decoded!`;
    }

    // now figure out what actual number it is
    for (var i = 0; i <= 9; i++) {
      var match = true;
      for (var j = 0; j < 7; j++) {
        if (
          (segmentsEnabledForDigit[i][j] === 1) !==
          this.decodedSegmentNumbers.has(j)
        ) {
          match = false;
          break;
        }
      }
      if (match) {
        // we found it!
        return `${i}`;
      }
    }

    throw `didn't find the number!`;
  }

  get isFullyDecoded(): boolean {
    return this.stillCoded.size === 0;
  }

  // decodes what we can into segments
  private decode(decoder: Decoder): {
    decodedSegmentNumbers: Set<SegmentNumber>;
    stillCoded: Set<string>;
  } {
    const codedSegments = toCodedSegments(this.original);
    const decodedSegmentNumbers = new Set<SegmentNumber>();
    const stillCodedSet = new Set<string>();
    codedSegments.forEach((codedSegment) => {
      if (decoder.piecesDecoded.has(codedSegment)) {
        decodedSegmentNumbers.add(decoder.piecesDecoded.get(codedSegment)!);
      } else {
        stillCodedSet.add(codedSegment);
      }
    });
    return {
      decodedSegmentNumbers: decodedSegmentNumbers,
      stillCoded: stillCodedSet,
    };
  }

  mightMatch(segmentArray: Array<number>): {
    mightMatch: boolean;
    maybeSegments?: Set<number>;
  } {
    // verify the length
    if (this.segmentLength !== segmentLengthForArray(segmentArray)) {
      return { mightMatch: false };
    }

    // make sure all the decoded ones are 1 in the array
    var stillGood = true;
    var possibleMatches = new Set<number>();
    segmentArray.forEach((val, ind) => {
      // if we know we have this, but the digit does not, definitely not a match
      if (this.decodedSegmentNumbers.has(ind) && val === 1) {
        stillGood = false;
      }

      // otherwise if it is a digit, then its a possible
      if (val === 1) {
        possibleMatches.add(ind);
      }
    });

    if (!stillGood) {
      return { mightMatch: false };
    }

    return { mightMatch: true, maybeSegments: possibleMatches };
  }
}

function multiProcess(decoder: Decoder, codedSegments: Array<CodedNumber>) {
  var loops = 0;
  while (loops++ < 2) {
    console.log(`-- main loop, decoded: ${decoder.piecesDecoded.size}`);

    process(decoder, codedSegments);
  }
}

function process(decoder: Decoder, codedSegments: Array<CodedNumber>) {
  const partiallyDecodedNumbers = codedSegments.map((val) => {
    return new PartiallyDecodedString(val, decoder);
  });

  // for a given decoder, and a given set of coded segments, lets build a map to array where the key
  // is the number of unknowns, and
  const stillCodedLengthToPartiallyDecoded = new Map<
    number,
    Array<PartiallyDecodedString>
  >();
  partiallyDecodedNumbers.forEach((pdn) => {
    let curArray = stillCodedLengthToPartiallyDecoded.get(pdn.stillCoded.size);
    if (!curArray) {
      stillCodedLengthToPartiallyDecoded.set(pdn.stillCoded.size, [pdn]);
    } else {
      curArray.push(pdn);
    }
  });

  console.log(`partiallyDecoded: ${partiallyDecodedNumbers}`);

  var identifiedNumbers = new Set<number>();

  // now lets look for 2 elements in this array next to each other that have a length of one
  for (var i = 1; i < 7; i++) {
    if (
      stillCodedLengthToPartiallyDecoded.get(i)?.length === 1 &&
      stillCodedLengthToPartiallyDecoded.get(i)?.length ===
        stillCodedLengthToPartiallyDecoded.get(i + 1)?.length
    ) {
      console.log(`found match at i:${i}`);

      // now lets find the difference between the two coded numbers
      const smaller = stillCodedLengthToPartiallyDecoded.get(i)![0];
      const larger = stillCodedLengthToPartiallyDecoded.get(i + 1)![0];

      console.log(`smaller: ${smaller}, larger: ${larger}`);

      // find the one that is missing
      let setSubtract = new Set(
        [...larger.stillCoded].filter((val) => !smaller.stillCoded.has(val))
      );
      if (setSubtract.size !== 1) {
        throw `math is off or we haven't deduced enough, should only be one: ${setToString(
          setSubtract
        )}`;
      }

      let [decoded] = setSubtract;

      // now WHICH segment is this????
      const possibleSmallerDigits = new Map<number, Set<number>>();
      const possibleLargerDigits = new Map<number, Set<number>>();
      segmentsEnabledForDigit.forEach((segments, digit) => {
        // if we've already found this, skip it
        if (identifiedNumbers.has(digit)) {
          return;
        }

        const segLenth = segmentLengthForDigit(digit);

        let {
          mightMatch: smallerMightMatch,
          maybeSegments: smallerMaybeSegments,
        } = smaller.mightMatch(segments);
        let {
          mightMatch: largerMightMatch,
          maybeSegments: largerMaybeSegments,
        } = larger.mightMatch(segments);

        console.log(
          `digit:${digit}, smm:${smallerMightMatch}, sms:${setToString(
            smallerMaybeSegments
          )}, lmm:${largerMightMatch}, lms:${setToString(largerMaybeSegments)}`
        );

        if (smallerMightMatch) {
          possibleSmallerDigits.set(digit, smallerMaybeSegments!);
        }
        if (largerMightMatch) {
          possibleLargerDigits.set(digit, largerMaybeSegments!);
        }
      });

      // ok, if we have one in each, find the difference in the segments and WE ARE GOOD
      if (possibleSmallerDigits.size === 1 && possibleLargerDigits.size === 1) {
        let [largerInfo] = possibleLargerDigits;
        let [smallerInfo] = possibleSmallerDigits;
        let setSubtract = new Set(
          [...largerInfo[1]].filter((val) => !smallerInfo[1].has(val))
        );
        // if its size one, WE ARE GOOD
        if (setSubtract.size === 1) {
          let [foundSegment] = setSubtract;
          console.log(
            `identified '${decoded}' to be for segment ${foundSegment}`
          );

          decoder.piecesDecoded.set(decoded, foundSegment);

          // must break to repeat
          break;
        } else {
          throw `matched the wrong stuff in the set subtract: ${setToString(
            setSubtract
          )}`;
        }
      } else {
        throw `didn't make progress`;
      }
    }
  }

  // can we make further deductions
  // and then have a new intpu+possibilities set?
}

const decoder = new Decoder();
multiProcess(decoder, signalOutputPairs[0].codedNumbers);

// wow, really need to rethink this

// starting from the top, the decoder indicates that all chars could be any of 0-6.
// we then deduce, and as we go we limit those we narrow down, as well as remove what
// we narrow down from others

// we're going to have to apply the rules too, of what we know
