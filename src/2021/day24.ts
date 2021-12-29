import assert from "assert";
import * as fs from "fs";

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
    displayFun: (alu: ALU) => void = (_) => {}
  ) {
    for (var i of program) {
      try {
        this.executeSingle(i, input);
        displayFun(this);
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

type DisplayFunctionType = (alu: ALU) => void;

function isValidMONAD(
  num: number,
  monad: Instruction[],
  alu: ALU = new ALU(),
  validTargetZregisters: Set<number> = new Set([0]),
  displayFun: DisplayFunctionType = (_) => {}
): false | number {
  alu.failOnMissingInput = false;

  const strNum = `${num}`;
  if (/*strNum.length !== 14 ||*/ strNum.includes("0")) return false;

  const input = strNum.split("");
  alu.execute(monad, input, displayFun);

  if (!validTargetZregisters.has(alu.variableValueNamed("z"))) {
    return false;
  }

  return alu.variableValueNamed("z");
}

// returns resultant z register
function testMonad(
  num: number,
  monad: Instruction[],
  alu: ALU = new ALU(),
  displayFun: DisplayFunctionType = (_) => {}
): number {
  alu.failOnMissingInput = false;

  const strNum = `${num}`;
  if (strNum.includes("0")) throw `bad input!`;

  const input = strNum.split("");
  alu.execute(monad, input, displayFun);

  return alu.variableValueNamed("z");
}

const logItAll = (alu: ALU) => {
  const ppv = (v: Variable) => {
    return `${v.name}:\t${v.value}`;
  };
  console.log(
    `${ppv(alu.variables[0])} - ${ppv(alu.variables[1])} - ${ppv(
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

(() => {
  test();
  test2();

  const instructions = parseInput(array);

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
  const max = 10000000;
  const min = -10000000;
  var smallestFound = NaN;
  var biggestFound = NaN;

  // OK we'll work our way backwards, starting at 0 in the carry over, and working our way up, and bail if we
  // don't nail every digit

  // for each segment, we'll create a map of the carry over + input value that produces a valid result.
  // for the last segment, the result we want is all 1's, but that changes
  var carryOverValuesAndDigitThatProduceValid: Set<number>[][] = new Array<
    Set<number>[]
  >(numSegments + 1);
  for (var segment = 0; segment < numSegments + 1; segment++) {
    carryOverValuesAndDigitThatProduceValid[segment] = new Array<Set<number>>(
      10
    );
    for (var digit = 1; digit <= 9; digit++) {
      carryOverValuesAndDigitThatProduceValid[segment][digit] =
        new Set<number>();
    }
  }
  for (var digit = 1; digit <= 9; digit++) {
    carryOverValuesAndDigitThatProduceValid[numSegments][digit].add(0);
  }

  var iteration = 0;

  // // just take a look at the first segment for a bit
  // for (var digit = 1; digit <= 9; digit++) {
  //   const result = testMonad(digit, monadSegments[0]);
  //   console.log(`segment 0, digit: ${digit} result: ${result}`);
  // }

  // return;

  // we don't go right to segment 0 - we know what the carrying info for that should be, it should be 0!
  for (var segment = numSegments - 1; segment >= 0; segment--) {
    // lets get our valid target value set
    var validTargetZregisters = new Set<number>();
    carryOverValuesAndDigitThatProduceValid[segment + 1].forEach((set) =>
      set.forEach((val) => validTargetZregisters.add(val))
    );

    console.log(
      `segment ${segment} starting, valid z regs (size:${
        validTargetZregisters.size
      }): ${Array.from(validTargetZregisters)}`
    );

    for (var carryInto = min; carryInto < max; carryInto++) {
      // we can just jump out if its the first segment, we only have one option for carrying in, and its 0.
      if (segment === 0 && carryInto !== 0) break;

      for (var digit = 1; digit <= 9; digit++) {
        const alu = new ALU();
        alu.variableNamed("z").value = carryInto;
        const log = iteration++ % 999997 === 0; //&& segment <= 2;
        if (log) {
          console.log(
            `about to test seg: ${segment}, carryInfo: ${carryInto} digit: ${digit}, against: ${Array.from(
              validTargetZregisters
            )}`
          );
        }

        const result = isValidMONAD(
          digit,
          monadSegments[segment],
          alu,
          validTargetZregisters,
          log ? logItAll : () => {}
        );

        if (result !== false) {
          if (isNaN(smallestFound) || carryInto < smallestFound)
            smallestFound = carryInto;
          if (isNaN(biggestFound) || carryInto > biggestFound)
            biggestFound = carryInto;

          console.log(
            `valid! seg: ${segment}, carryInfo: ${carryInto} digit: ${digit}, matched: ${result}`
          );

          // tell the prev segment what they should be looking for
          carryOverValuesAndDigitThatProduceValid[segment][digit].add(
            carryInto
          );
        }
      }

      // we can bail if we have a full set... actually not quite sure we can right now
      // const total = carryOverValuesAndDigitThatProduceValid[segment].reduce(
      //   (prev, set) => {
      //     return prev + set.size;
      //   },
      //   0
      // );
      // const totalDigits = carryOverValuesAndDigitThatProduceValid[
      //   segment
      // ].reduce((prev, set) => {
      //   return prev + set.size > 0 ? 1 : 0;
      // }, 0);
      // if (totalDigits === 9) {
      //   break;
      // }
    }

    console.log(`biggest: ${biggestFound}, smallest: ${smallestFound}`);

    // TODO
    // step through the first two iterations...  i think there might just be a bug with the ALU
    // there are ~100 unique numbers to test there. lets see what output that produces...
    // but actually walk through the instructions to underestand it better. READ THE CODE.

    // do we have a good set
    const total = carryOverValuesAndDigitThatProduceValid[segment].reduce(
      (prev, set) => {
        return prev + set.size;
      },
      0
    );
    if (total < 1) {
      console.log(
        `didn't get a valid set segment:${segment}! ${Array.from(
          carryOverValuesAndDigitThatProduceValid[segment].values()
        )}`
      );
      break;
      //throw `invalid!!`;
    }
  }

  console.log("info...");
  carryOverValuesAndDigitThatProduceValid.forEach((setsForDigits, segment) => {
    console.log(`segment: ${segment}`);
    setsForDigits.forEach((set, digit) => {
      console.log(`segment: ${segment} - ${digit} - z size: ${set.size}`);
    });
  });

  //console.dir(carryOverValuesAndDigitThatProduceValid);

  // ok - now we can iterate through our set building up the perfect number!
  console.log(`about to find best number...`);

  var bestDigit = "";

  for (var segment = 0; segment < numSegments; segment++) {
    var found = false;
    for (var digit = 9; digit >= 1; digit--) {
      const set = carryOverValuesAndDigitThatProduceValid[segment + 1][digit];
      if (set.size === 0) continue;

      // process this numberon this segment for the given z input, and see what the output is
      const zreg = testMonad(digit, monadSegments[segment]);

      if (set.has(zreg)) {
        bestDigit += `${digit}`;
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`didn't find at ${segment}`);
      // throw `doh doh doh!`;
      break;
    }
  }

  const isValid = isValidMONAD(parseInt(bestDigit), instructions);
  console.log(`is valid? ${isValid}`);
  console.log(`best: ${bestDigit}`);
})();
