import { setDefaultResultOrder } from "dns";
import * as fs from "fs";
import { decode } from "querystring";

var array = fs.readFileSync("src/2021/day8.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

// helpful!
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

function setToString<T>(set: Set<T> | undefined): string {
  if (!set) {
    return "";
  }
  const a = Array.from(set);
  return a.reduce((prev, val) => {
    return prev + `${val}`;
  }, "");
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

function codedNumberAsSet(cn: CodedNumber): Set<String> {
  return new Set([...cn.code]);
}

function cnSubtract(cn1: CodedNumber, cn2: CodedNumber): Set<string> {
  return new Set(
    [...cn1.code].filter((val) => !codedNumberAsSet(cn2).has(val))
  );
}
function cnIntersect(cn1: CodedNumber, cn2: CodedNumber): Set<string> {
  return new Set([...cn1.code].filter((val) => codedNumberAsSet(cn2).has(val)));
}

function sortCodedNumber(cn: CodedNumber) {
  cn.code = [...cn.code].sort().join("");
}

function justUnknown(cn: CodedNumber) {
  return cnSubtract(cn, { code: "0123456789" });
}

class DecoderRing {
  // this can contain multi - ie ab -> 25
  map = new Map<string, number>();
  digitMap = new Map<number, CodedNumber>();

  get digitIndexToDecoded(): Array<string> {
    const result = new Array(10);
    this.digitMap.forEach((val, key) => {
      result[key] = val.code;
    });
    return result;
  }
}

// decodes in place, returns number of swaps done
function decodeAsBestPossible(
  codedSet: Array<CodedNumber>,
  decoderRing: DecoderRing
) {
  codedSet.forEach((cn) => {
    decodeSingle(cn, decoderRing);
  });
}
function decodeSingle(cn: CodedNumber, decoderRing: DecoderRing) {
  // sort before, sort after
  sortCodedNumber(cn);

  decoderRing.map.forEach((decodedValue, encodedKey) => {
    // we can't just do index of - we need to know that all chars are present
    var charsPresent = 0;
    [...encodedKey].forEach((encodedChar) => {
      charsPresent += cn.code.indexOf(encodedChar) >= 0 ? 1 : 0;
    });

    if (charsPresent === encodedKey.length) {
      //console.log(`found match of ${encodedKey} in ${cn.code}, about to replace with ${decodedValue}`);
      [...encodedKey].forEach((encodedChar) => {
        cn.code = cn.code.replace(encodedChar, "");
      });
      cn.code = cn.code + `${decodedValue}`;
      //console.log(`match is now ${cn.code}`);
    }
  });

  // resort
  sortCodedNumber(cn);
}

function generateDecoderRing(codedSet: Array<CodedNumber>): DecoderRing {
  const decoderRing = new DecoderRing();

  // build them up by length
  const codedByLength = new Array<Array<CodedNumber>>(codedSet.length);
  codedSet.forEach((val) => {
    if (!codedByLength[val.code.length]) {
      codedByLength[val.code.length] = new Array();
    }
    codedByLength[val.code.length].push(val);
  });

  ///
  // first, find the 2 that have length 2 and 3, which we know are 1 and 7
  decoderRing.digitMap.set(1, codedByLength[2][0]);
  decoderRing.digitMap.set(7, codedByLength[3][0]);

  const [seg0] = cnSubtract(
    decoderRing.digitMap.get(7)!,
    decoderRing.digitMap.get(1)!
  );
  decoderRing.map.set(seg0, 0);
  // this is two chars so needs to be sorted then joined
  const seg25 = Array.from(
    cnIntersect(decoderRing.digitMap.get(7)!, decoderRing.digitMap.get(1)!)
  )
    .sort()
    .join("");
  decoderRing.map.set(seg25, 25);

  decodeAsBestPossible(codedSet, decoderRing);

  ///
  // now there should be one of length 4 that has two that are not decoded
  // it is our digit 4
  decoderRing.digitMap.set(4, codedByLength[4][0]);
  const seg13 = Array.from(justUnknown(decoderRing.digitMap.get(4)!))
    .sort()
    .join("");
  decoderRing.map.set(seg13, 13);

  decodeAsBestPossible(codedSet, decoderRing);

  ///
  // there are 3 numbers with length 6 - the 9 should have only one remaining
  // unsolved part (the bottom), and this is the one we want
  const oneRemaining = codedByLength[6].filter((val) => {
    return justUnknown(val).size === 1;
  });
  if (oneRemaining.length !== 1) {
    throw `got a bad 9`;
  }
  decoderRing.digitMap.set(9, oneRemaining[0]);
  const [seg6] = justUnknown(oneRemaining[0]);
  decoderRing.map.set(seg6, 6);

  decodeAsBestPossible(codedSet, decoderRing);

  ///
  // so lets get the 8 - the only segment
  // it should have missing that we haven't mapped out yet is segment 4
  decoderRing.digitMap.set(8, codedByLength[7][0]);
  const [seg4] = Array.from(justUnknown(decoderRing.digitMap.get(8)!))[0];
  decoderRing.map.set(seg4, 4);

  decodeAsBestPossible(codedSet, decoderRing);

  ///
  // ok now we'll just be specific - the two remaining digits of length 6, 6 and 0,
  // each have a segment left to sort. the one that includes a 3 cannot be the 0.
  // and the missing segment is segment 1!
  const the0 = codedByLength[6].filter((val) => {
    return justUnknown(val).size === 1 && !(val.code.indexOf("3") >= 0);
  });
  if (the0.length !== 1) {
    throw `expected 0`;
  }
  decoderRing.digitMap.set(0, the0[0]);
  const [seg1] = Array.from(justUnknown(decoderRing.digitMap.get(0)!))[0];
  decoderRing.map.set(seg1, 1);

  decodeAsBestPossible(codedSet, decoderRing);

  ///
  // and NOW there should only be one value of size 6 left, the 6
  // missing segment is 5!
  const the6 = codedByLength[6].filter((val) => {
    return justUnknown(val).size === 1;
  });
  if (the6.length !== 1) {
    throw `expected 6`;
  }
  decoderRing.digitMap.set(6, the6[0]);
  const [seg5] = Array.from(justUnknown(decoderRing.digitMap.get(6)!))[0];
  decoderRing.map.set(seg5, 5);

  decodeAsBestPossible(codedSet, decoderRing);

  ///
  // 5 should be solved now
  const the5 = codedByLength[5].filter((val) => {
    return justUnknown(val).size === 0;
  });
  if (the5.length !== 1) {
    throw `expected 5`;
  }
  decoderRing.digitMap.set(5, the5[0]);

  ///
  // NOW we have 2 left. two left of size 5, the 3 and the 2.
  // the 3 has one remaining to sort, and the 2 has 2 remaining to sort

  const the3 = codedByLength[5].filter((val) => {
    return justUnknown(val).size === 1;
  });
  if (the3.length !== 1) {
    throw `expected 3`;
  }

  decoderRing.digitMap.set(3, the3[0]);
  const [seg3] = Array.from(justUnknown(decoderRing.digitMap.get(3)!))[0];
  decoderRing.map.set(seg3, 3);

  decodeAsBestPossible(codedSet, decoderRing);

  ///
  // the 2!

  const the2 = codedByLength[5].filter((val) => {
    return justUnknown(val).size === 1;
  });
  if (the2.length !== 1) {
    throw `expected 2`;
  }
  decoderRing.digitMap.set(2, the2[0]);
  const [seg2] = Array.from(justUnknown(decoderRing.digitMap.get(2)!))[0];
  decoderRing.map.set(seg2, 2);

  decodeAsBestPossible(codedSet, decoderRing);

  ///
  // verify we all good
  codedSet.forEach((val) => {
    if (justUnknown(val).size > 0) {
      console.error(`not done!!`);
    }
  });

  ///
  // now prune anything from the ring that is multiple values, we don't need that
  decoderRing.map.forEach((val, key, map) => {
    if (key.length > 1) {
      map.delete(key);
    }
  });
  if (decoderRing.map.size !== 7) {
    throw `bad decoder ring!`;
  }

  return decoderRing;
}

function decodeOutputValues(
  outputValues: CodedNumber[],
  decoderRing: DecoderRing
): number {
  var digitString = "";
  outputValues.forEach((val) => {
    digitString += `${decodeOutputValue(val, decoderRing)}`;
  });

  // and the final number is!
  return parseInt(digitString);
}

function decodeOutputValue(ov: CodedNumber, decoderRing: DecoderRing): number {
  // now translate the input - decode, then lookup in map
  decodeSingle(ov, decoderRing);

  const di2d = decoderRing.digitIndexToDecoded;

  const digit = di2d.indexOf(ov.code);

  if (digit >= 0) {
    return digit;
  }

  throw `didn't properly parse output value!`;
}

function processAll() {
  var sum = 0;
  signalOutputPairs.forEach((sop) => {
    const decoderRing = generateDecoderRing(sop.codedNumbers);

    sum += decodeOutputValues(sop.outputValues, decoderRing);
  });

  console.log(sum);
}

let { signalOutputPairs: sops } = parseInput(array);
processAll();
