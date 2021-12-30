import assert from "assert";
import * as fs from "fs";
import { cursorTo } from "readline";
import { DebugLoggerFunction } from "util";

var array = fs.readFileSync("src/2021/day24.txt").toString().trim().split("\n");
var arrayTest = fs
  .readFileSync("src/2021/day24test.txt")
  .toString()
  .trim()
  .split("\n");
var arrayTest2 = fs
  .readFileSync("src/2021/day24test2.txt")
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

const numDigits = 14;

enum InstructionCommand {
  inp,
  add,
  mul,
  div,
  mod,
  eql,
}

type Variable = {
  name: string;
  value: number;
};

type Instruction = {
  command: InstructionCommand;
  parm1: string;
  parm2: undefined | string | number;
};

class ALU {
  failOnMissingInput = true;

  variables: Variable[] = [
    { name: "w", value: 0 },
    { name: "x", value: 0 },
    { name: "y", value: 0 },
    { name: "z", value: 0 },
  ];

  reset() {
    this.variables = [
      { name: "w", value: 0 },
      { name: "x", value: 0 },
      { name: "y", value: 0 },
      { name: "z", value: 0 },
    ];
  }

  variableNamed(char: string): Variable {
    return this.variables.filter((v) => v.name === char)[0];
  }

  variableValueNamed(char: string): number {
    return this.variables.filter((v) => v.name === char)[0].value;
  }

  executeSingle(i: Instruction, input: string[]) {
    if (i.command == InstructionCommand.inp) {
      if (input.length === 0) throw `missing input`;

      const readInput = input.reverse().pop()!; // take the front off
      input.reverse();

      this.variableNamed(i.parm1).value = parseInt(readInput);
      return;
    }

    const parm1var = this.variableNamed(i.parm1);

    if (typeof i.parm2 === "undefined") {
      throw `should have a second paramater`;
    }

    const parm2value: number =
      typeof i.parm2 === "number" ? i.parm2 : this.variableNamed(i.parm2).value;

    // calculate the result
    switch (i.command) {
      case InstructionCommand.add:
        parm1var.value += parm2value;
        break;
      case InstructionCommand.mul:
        parm1var.value *= parm2value;
        break;
      case InstructionCommand.div:
        parm1var.value = Math.floor(parm1var.value / parm2value);
        break;
      case InstructionCommand.mod:
        parm1var.value %= parm2value;
        break;
      case InstructionCommand.eql:
        parm1var.value = parm1var.value === parm2value ? 1 : 0;
        break;
    }
  }

  execute(
    program: Instruction[],
    input: string[],
    displayFun: DisplayFunctionType = (_) => {}
  ) {
    for (var iind = 0; iind < program.length; iind++) {
      try {
        this.executeSingle(program[iind], input);
        displayFun(this, iind);
      } catch (e) {
        if (e === `missing input` && !this.failOnMissingInput) {
          return;
        }
        throw e;
      }
    }
  }
}

function parseInput(lines: string[]): Instruction[] {
  var instructions: Instruction[] = [];
  lines.forEach((line) => {
    const parts = line.split(" ");
    const ic: InstructionCommand = (<any>InstructionCommand)[parts[0]];
    const parm1 = parts[1];
    var parm2;
    if (parts.length === 3) {
      const num = parseInt(parts[2]);
      if (!isNaN(num)) {
        parm2 = num;
      } else {
        parm2 = parts[2];
      }
    }
    instructions.push({ command: ic, parm1, parm2 });
  });

  return instructions;
}

const instructions = parseInput(array);

const test = () => {
  const instructions = parseInput(arrayTest);

  {
    const input = [`${parseInt("0000", 2)}`];
    const alu = new ALU();
    alu.execute(instructions, input);
    assert(alu.variableValueNamed("z") === 0);
    assert(alu.variableValueNamed("y") === 0);
    assert(alu.variableValueNamed("x") === 0);
    assert(alu.variableValueNamed("w") === 0);
  }
  {
    const input = [`${parseInt("1111", 2)}`];
    const alu = new ALU();
    alu.execute(instructions, input);
    assert(alu.variableValueNamed("z") === 1);
    assert(alu.variableValueNamed("y") === 1);
    assert(alu.variableValueNamed("x") === 1);
    assert(alu.variableValueNamed("w") === 1);
  }
  {
    const input = [`${parseInt("11101", 2)}`];
    const alu = new ALU();
    alu.execute(instructions, input);
    assert(alu.variableValueNamed("z") === 1);
    assert(alu.variableValueNamed("y") === 0);
    assert(alu.variableValueNamed("x") === 1);
    assert(alu.variableValueNamed("w") === 1);
  }
  {
    const input = [`${parseInt("1", 2)}`];
    const alu = new ALU();
    alu.execute(instructions, input);
    assert(alu.variableValueNamed("z") === 1);
    assert(alu.variableValueNamed("y") === 0);
    assert(alu.variableValueNamed("x") === 0);
    assert(alu.variableValueNamed("w") === 0);
  }
  console.log(`tests pass!`);
};

const test2 = () => {
  const instructions = parseInput(arrayTest2);

  {
    const input = [`1`, `3`];
    const alu = new ALU();
    alu.execute(instructions, input);
    assert(alu.variableValueNamed("z") === 1);
  }
  {
    const input = [`0`, `3`];
    const alu = new ALU();
    alu.execute(instructions, input);
    assert(alu.variableValueNamed("z") === 0);
  }
  {
    const input = [`3`, `3`];
    const alu = new ALU();
    alu.execute(instructions, input);
    assert(alu.variableValueNamed("z") === 0);
  }
  {
    const input = [`9`, `27`];
    const alu = new ALU();
    alu.execute(instructions, input);
    assert(alu.variableValueNamed("z") === 1);
  }
  console.log(`tests 2 pass!`);
};

type DisplayFunctionType = (alu: ALU, iind: number) => void;

function isValidMONAD(
  num: number,
  monad: Instruction[] = instructions,
  alu: ALU = new ALU(),
  validTargetZregisters: Set<number> = new Set([0]),
  displayFun: DisplayFunctionType = (_) => {}
): boolean {
  const zreg = testMonad(num, monad, alu, displayFun);
  return validTargetZregisters.has(zreg);
}

// returns resultant z register
function testMonad(
  num: number,
  monadSegments: Instruction[],
  alu: ALU = new ALU(),
  displayFun: DisplayFunctionType = (_) => {}
): number {
  alu.failOnMissingInput = false;

  const strNum = `${num}`;
  if (strNum.includes("0")) throw `bad input!`;

  const input = strNum.split("");
  alu.execute(monadSegments, input, displayFun);

  return alu.variableValueNamed("z");
}

const logItAll = (alu: ALU, ind: number = -1) => {
  const ppv = (v: Variable) => {
    return `${v.name}:\t${v.value}`;
  };
  console.log(
    `IN:${ind} ${ppv(alu.variables[0])} - ${ppv(alu.variables[1])} - ${ppv(
      alu.variables[2]
    )} - ${ppv(alu.variables[3])}`
  );
};

var logEveryIteration = 0;
const logEvery = (iterations: number): ((alu: ALU) => void) => {
  return (alu: ALU) => {
    if (logEveryIteration++ % iterations === 0) {
      const ppv = (v: Variable) => {
        return `${v.name}:\t${v.value}`;
      };
      console.log(
        `${ppv(alu.variables[0])} - ${ppv(alu.variables[1])} - ${ppv(
          alu.variables[2]
        )} - ${ppv(alu.variables[3])}`
      );
    }
  };
};

function testMonadSegmentWith(
  instructions: Instruction[],
  zregvalues: number[],
  digits: number[],
  logFunction: DisplayFunctionType = () => {}
): Map<number, Map<number, number>> {
  // digit -> zreg -> zregout
  const results = new Map<number, Map<number, number>>();
  for (var digit of digits) {
    const digitMap = new Map<number, number>();
    results.set(digit, digitMap);
    for (var zreg of zregvalues) {
      const alu = new ALU();
      alu.variableNamed("z").value = zreg;
      const result = testMonad(digit, instructions, alu, logFunction);
      digitMap.set(zreg, result);

      console.log(
        `--- testMonadSegmentWith, digit: ${digit} result: ${result}`
      );
    }
  }

  return results;
}

type SegmentDigitZinZoutMapType = Map<number, Map<number, Map<number, number>>>;

// // for a given segment and zin input, return all the digit->[zout] matches that would work, sorted
// // by higest digit value
// function findAllMatchesForZin(
//   map: SegmentDigitZinZoutMapType,
//   segment: number,
//   zin: number
// ): Map<number, number[]> {

//   // segDigitZinZoutMap.get(5).get(7).forEach((val, key)=>{if(key === 272125) console.log(`${key} - ${val}`);});

//   const result = new Map<number, number[]>();
//   map.get(segment)!.forEach((zinZout, digit)=>{
//     const zout = zinZout.get(zin);
//     if(zouts) {
//       result.set(digit, zouts);
//     }
//   });

// return result;
// }

// returns a valid number, or false, based on a given stem
var highestSearchCount = 0;
function findHighestValidNumber(
  map: SegmentDigitZinZoutMapType,
  curStr: string = "",
  zin: number = 0
): number | false {
  //if (highestSearchCount++ % 10000000 === 0) {
  console.log(
    `${highestSearchCount} looking for highest, cur: ${curStr}, zin: ${zin}`
  );
  //}

  if (curStr.length === numDigits) {
    // perform a final validation, and then we're good
    const cur = parseInt(curStr);
    if (!isValidMONAD(cur)) {
      throw `this number really should have been valid: ${curStr}`;
    }

    return cur;
  }

  // start on the given segment

  const segment = curStr.length;

  // for (var segment = curStr.length; segment < numDigits; segment++) {
  // const digitToZoutMap = findAllMatchesForZin(map, segment, zin);
  // if(digitToZoutMap.size == 0) return false;

  // work our way from the top downwards in digits
  for (var digit = 9; digit >= 1; digit--) {
    const zout = map.get(segment)?.get(digit)?.get(zin);
    if (!zout) continue;

    // const zouts : number[] = digitToZoutMap.get(digit);
    // if(!zouts) continue;

    // lets try em all, and once we find one, we're done
    //for(var zout of zouts) {
    const highestValidOrFalse = findHighestValidNumber(
      map,
      curStr + `${digit}`,
      zout
    );
    if (highestValidOrFalse !== false) {
      console.log(`found it!!!!: ${highestValidOrFalse}`);
      return highestValidOrFalse;
      //}
    }
  }
  // }

  return false;
}

(() => {
  test();
  test2();

  console.log(
    `parsed ${
      instructions.length
    } instructions, total input instructions: ${instructions.reduce(
      (prev, i) => {
        return prev + (i.command === InstructionCommand.inp ? 1 : 0);
      },
      0
    )}`
  );

  //const n1 = 13579246899999;
  // console.log(isValidMONAD(13579246899999, instructions, logItAll));
  // console.log(isValidMONAD(11111111111111, instructions, logItAll));
  // console.log(isValidMONAD(99999999999999, instructions, logItAll));

  //searchForValids(instructions, 10000000, 1000000000);

  // lets test some smaller numbers

  // break up the instructions into monad segments - there are numInstructions / 14 of them
  const monadSegments: Instruction[][] = [];
  const numSegments = numDigits;
  const segmentLength = instructions.length / numDigits;
  for (var i = 0; i < numSegments; i++) {
    monadSegments[i] = instructions.slice(
      i * segmentLength,
      (i + 1) * segmentLength
    );
  }

  // lets experiment with different inputs - via inspection we can see that only the z value is passed from
  // one segment to the other, so its all that matters
  const max = 500000; //10000000;
  const min = 0; //-10000000;
  var smallestFound = NaN;
  var biggestFound = NaN;

  // OK we'll work our way backwards, starting at 0 in the carry over, and working our way up, and bail if we
  // don't nail every digit

  const allDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // this moves forward

  const results = new Map<number, ReturnType<typeof testMonadSegmentWith>>();
  for (var segment of [0, 1]) {
    var zregvaluesToTestWith: number[] = [];
    if (segment === 0) {
      zregvaluesToTestWith.push(0);
    } else {
      const digitMap = results.get(segment - 1);

      // merge all these together
      digitMap!.forEach((zregmap, digit) => {
        zregvaluesToTestWith.push(...Array.from(zregmap.values()));
      });
    }

    results.set(
      segment,
      testMonadSegmentWith(
        monadSegments[segment],
        zregvaluesToTestWith,
        allDigits,
        logItAll
      )
    );
  }

  results.forEach((digitMap, segment) => {
    digitMap.forEach((zinMap, digit) => {
      zinMap.forEach((zout, zin) => {
        console.log(
          `segment ${segment}, digit: ${digit} zin: ${zin} zout: ${zout}`
        );
      });
    });
  });

  console.log(isValidMONAD(3559921181672, instructions));
  console.log(isValidMONAD(35599211816721, instructions));
  console.log(isValidMONAD(35599211816722, instructions));
  console.log(isValidMONAD(35599211816723, instructions));
  console.log(isValidMONAD(35599211816724, instructions));
  console.log(isValidMONAD(35599211816725, instructions));
  console.log(isValidMONAD(35599211816726, instructions));
  console.log(isValidMONAD(35599211816727, instructions));
  console.log(isValidMONAD(35599211816728, instructions));
  console.log(isValidMONAD(35599211816729, instructions));
  return;

  /*

  //return;

  // for each segment, we'll create a map of the carry over + input value that produces a valid result.
  // for the last segment, the result we want is all 1's, but that changes

  // segment -> digit -> zin -> zout
  var segDigitZinZoutMap: Map<
    number,
    Map<number, Map<number, number>>
  > = new Map<number, Map<number, Map<number, number>>>();

  var iteration = 0;

  for (var segment = numSegments - 1; segment >= 0; segment--) {
    const digitZinZoutMap = new Map<number, Map<number, number>>();

    // lets get our valid target value set
    var validTargetZregisters = new Set<number>();

    // if this is the last segment, we know the only valid output is 0
    if (segment === numSegments - 1) {
      validTargetZregisters.add(0);
    } else {
      // pull from the one above us
      segDigitZinZoutMap.get(segment + 1)?.forEach((zinZoutMap, digit) => {
        Array.from(zinZoutMap.keys()).forEach((zin) =>
          validTargetZregisters.add(zin)
        );
      });
    }

    console.log(
      `segment ${segment} starting, valid z regs (size:${
        validTargetZregisters.size
      }): ${Array.from(validTargetZregisters).slice(0, 50)} ... ${Array.from(
        validTargetZregisters
      ).slice(validTargetZregisters.size - 50)}`
    );

    // we can just jump out if its the first segment, we only have one option for carrying in, and its 0.
    // NOPE - lets try some valid z values here:
    // if (segment === 0 && carryInto !== 0) break;

    for (var digit = 1; digit <= 9; digit++) {
      const zinZoutMap = new Map<number, number>();

      const maxToUse = segment === 5 ? 15000000 : max;
      for (var zin = min; zin < maxToUse; zin++) {
        const alu = new ALU();
        alu.variableNamed("z").value = zin;
        const log = false; //iteration++ % 999997 === 0; //&& segment <= 2;
        if (log) {
          console.log(
            `about to test seg: ${segment}, zin: ${zin} digit: ${digit}, against: ${Array.from(
              validTargetZregisters
            ).slice(0, 100)} len: ${validTargetZregisters.size}`
          );
        }

        const zoutOrFalse = isValidMONAD(
          digit,
          monadSegments[segment],
          alu,
          validTargetZregisters,
          log ? logItAll : () => {}
        );

        if (zoutOrFalse !== false) {
          if (isNaN(smallestFound) || zin < smallestFound) smallestFound = zin;
          if (isNaN(biggestFound) || zin > biggestFound) biggestFound = zin;

          // console.log(
          //   `valid! seg: ${segment}, digit: ${digit}, zin: ${zin}, zout: ${zoutOrFalse} (foundsofarfordigit: ${zinZoutMap.size})`
          // );

          // tell the prev segment what they should be looking for
          zinZoutMap.set(zin, zoutOrFalse);
        }
      }

      if (zinZoutMap.size > 0) {
        digitZinZoutMap.set(digit, zinZoutMap);
      }
    }

    if (digitZinZoutMap.size > 0) {
      segDigitZinZoutMap.set(segment, digitZinZoutMap);
    }

    console.log(`biggest: ${biggestFound}, smallest: ${smallestFound}`);

    // TODO
    // step through the first two iterations...  i think there might just be a bug with the ALU
    // there are ~100 unique numbers to test there. lets see what output that produces...
    // but actually walk through the instructions to underestand it better. READ THE CODE.

    // do we have a good set
    var total = 0;
    digitZinZoutMap.forEach((zinZoutMap, digit) => {
      total += zinZoutMap.size;
    });

    // const total = zinputAndDigitTozoutput[segment].reduce((prev, set) => {
    //   return prev + set.size;
    // }, 0);
    if (total < 1) {
      console.log(
        `didn't get a valid set segment: ${segment}! ${Array.from(
          digitZinZoutMap.entries()
        )}`
      );
      break;
      //throw `invalid!!`;
    }
  }

  console.log("info...");
  segDigitZinZoutMap.forEach((digitZinZoutMap, segment) => {
    console.log(`segment: ${segment}`);
    digitZinZoutMap.forEach((zinZoutMap, digit) => {
      console.log(
        `segment: ${segment} - ${digit} - z size: ${
          zinZoutMap.size
        } ... ${Array.from(zinZoutMap.entries()).slice(0, 30)}`
      );
    });
  });

  //console.dir(carryOverValuesAndDigitThatProduceValid);

  // ok - now we can iterate through our set building up the perfect number!
  console.log(`about to find best number...`);

  var highest = findHighestValidNumber(segDigitZinZoutMap);

  // this part needs to be recurive, its going to need to search

  // for (var segment = 0; segment < numSegments; segment++) {
  //   var found = false;
  //   for (var digit = 9; digit >= 1; digit--) {
  //     const zinZoutMap = segDigitZinZoutMap.get(segment)!.get(digit);
  //     const set = zinputAndDigitTozoutput[segment + 1][digit];
  //     if (set.size === 0) continue;

  //     // process this numberon this segment for the given z input, and see what the output is
  //     const zreg = testMonad(digit, monadSegments[segment]);

  //     if (set.has(zreg)) {
  //       bestDigit += `${digit}`;
  //       found = true;
  //       break;
  //     }
  //   }
  //   if (!found) {
  //     console.log(`didn't find at ${segment}`);
  //     // throw `doh doh doh!`;
  //     break;
  //   }
  // }

  console.log(`highest: ${highest}`);


  */
})();
