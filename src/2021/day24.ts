import assert from "assert";
import * as fs from "fs";

var array = fs.readFileSync("src/2021/day24.txt").toString().trim().split("\n");
var arrayTest = fs
  .readFileSync("src/2021/day24test.txt")
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
  variables: Variable[] = [
    { name: "w", value: 0 },
    { name: "x", value: 0 },
    { name: "y", value: 0 },
    { name: "z", value: 0 },
  ];

  variableNamed(char: string): Variable {
    return this.variables.filter((v) => v.name === char)[0];
  }

  variableValueNamed(char: string): number {
    return this.variables.filter((v) => v.name === char)[0].value;
  }

  executeSingle(i: Instruction, input: string[]) {
    if (i.command == InstructionCommand.inp) {
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
    program.forEach((i) => {
      this.executeSingle(i, input);
      displayFun(this);
    });
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

function isValidMONAD(
  num: number,
  monad: Instruction[],
  displayFun: (alu: ALU) => void = (_) => {}
): boolean {
  const alu = new ALU();
  const strNum = `${num}`;
  if (strNum.length !== 14 || strNum.includes("0")) return false;

  const input = strNum.split("");
  alu.execute(monad, input, displayFun);

  return alu.variableValueNamed("z") === 0;
}

(() => {
  test();

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

  const n1 = 13579246899999;
  console.log(isValidMONAD(13579246899999, instructions, logItAll));
  console.log(isValidMONAD(11111111111111, instructions, logItAll));
  console.log(isValidMONAD(99999999999999, instructions, logItAll));

  const max = 99999999999999;
  for (var n = max; ; n--) {
    if (isValidMONAD(n, instructions)) {
      console.log(`valid! ${n}`);
      break;
    }

    if (n % 1000000 === 0) {
      console.log(`at ${n}...`);
    }
  }
})();
