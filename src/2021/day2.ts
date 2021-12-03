import * as fs from "fs";

var array = fs.readFileSync("src/2021/day2.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  //console.log(`number of length ${key}: ${lineLengths[key]}`);
}

/// End Boilerplate

// array.reduce((prev, cur, ind, array) => {
//   return 0;
// });

// array.reduce((prev, 0, ind, array) => {
//   return "";
// })

array.map((val, ind, array) => {
  return 0;
});

enum Directive {
  forward,
  down,
  up,
}

interface SubPosition {
  depth: number;
  pos: number;
}

var position: SubPosition = {
  depth: 0,
  pos: 0,
};

function adjustPosition(
  pos: SubPosition,
  adjustment: Directive,
  value: number
): SubPosition {
  switch (adjustment) {
    case Directive.forward:
      return { depth: pos.depth, pos: pos.pos + value };
    case Directive.up:
      return { depth: pos.depth - value, pos: pos.pos };
    case Directive.down:
      return { depth: pos.depth + value, pos: pos.pos };
  }
  throw `bad directive! ${adjustment}`;
}

array.forEach((val) => {
  const matches = val.match(/^(up|down|forward)\s*([0-9]*)$/);
  if (matches == null) {
    console.log(`failed to match: ${val}`);
    throw `bad directive: ${val}`;
  }
  const directive: Directive = (<any>Directive)[matches[1]];
  position = adjustPosition(position, directive, parseInt(matches[2]));
});

console.log(
  `final pos: ${JSON.stringify(position)}, product: ${
    position.pos * position.depth
  }`
);

// part 2!

interface SubPosition2 {
  depth: number;
  pos: number;
  aim: number;
}

var position2: SubPosition2 = {
  depth: 0,
  pos: 0,
  aim: 0,
};

function adjustPosition2(
  pos: SubPosition2,
  adjustment: Directive,
  value: number
): SubPosition2 {
  switch (adjustment) {
    /**down X increases your aim by X units.
        up X decreases your aim by X units.
        forward X does two things:
          It increases your horizontal position by X units.
          It increases your depth by your aim multiplied by X. */
    case Directive.forward:
      return {
        depth: pos.depth + value * pos.aim,
        pos: pos.pos + value,
        aim: pos.aim,
      };
    case Directive.up:
      return { depth: pos.depth, pos: pos.pos, aim: pos.aim - value };
    case Directive.down:
      return { depth: pos.depth, pos: pos.pos, aim: pos.aim + value };
  }
  throw `bad directive! ${adjustment}`;
}

array.forEach((val) => {
  const matches = val.match(/^(up|down|forward)\s*([0-9]*)$/);
  if (matches == null) {
    console.log(`failed to match: ${val}`);
    throw `bad directive: ${val}`;
  }
  const directive: Directive = (<any>Directive)[matches[1]];
  position2 = adjustPosition2(position2, directive, parseInt(matches[2]));
});

console.log(
  `final pos2: ${JSON.stringify(position2)}, product: ${
    position2.pos * position2.depth
  }`
);
