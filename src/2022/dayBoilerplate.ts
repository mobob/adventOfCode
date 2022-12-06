import * as fs from "fs";

export function importInputAsLines(inputFileName: string): string[] {
  var array = fs
    .readFileSync("src/2022/" + inputFileName)
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
  return array;
}

function dayXSolve(inputFileName: string): [string, string | undefined] {
  const lines = importInputAsLines(inputFileName);
  return ["", undefined];
}

// const resultTest = daySolve("dayXtest.txt");
// console.log(`test result: ${resultTest}`);
// const result = daySolve("dayX.txt");
// console.log(`real result: ${result}`);

export function assertOrDie(logic: boolean) {
  if (logic !== true) {
    console.log(`Assertion faulre!`);
    throw new Error("Assertion failure, should have been true");
  }
}
