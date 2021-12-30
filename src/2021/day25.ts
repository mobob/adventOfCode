import * as fs from "fs";

var array = fs.readFileSync("src/2021/day25.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

type Position = {
  x: number;
  y: number;
};

function positionAsString(pos: Position): string {
  return `(${pos.x},${pos.y})`;
}

function pk(pos: Position): string {
  return positionAsString(pos);
}

function positionFromString(str: string): Position {
  const matches = str.match(/-?\d+/g);
  return { x: parseInt(matches![0]), y: parseInt(matches![1]) };
}

enum Direction {
  SOUTH,
  EAST,
}

function directionForChar(cukeChar: string): Direction {
  if (cukeChar === ">") {
    return Direction.EAST;
  } else if (cukeChar === "v") {
    return Direction.SOUTH;
  }
  throw `bad direction: ${cukeChar}`;
}

function cukeCharForDirection(direction: Direction): string {
  switch (direction) {
    case Direction.EAST:
      return ">";
    case Direction.SOUTH:
      return "v";
  }
}

type Cucumber = {
  direction: Direction;
  position: Position;
};

class OceanFloor {
  width: number;
  height: number;
  constructor($width: number, $height: number) {
    this.width = $width;
    this.height = $height;
  }
  positionMap = new Map<string, Cucumber>();
  numSteps = 0;

  display() {
    for (var y = this.height - 1; y >= 0; y--) {
      var line = "";
      for (var x = 0; x < this.width; x++) {
        const pos = pk({ x, y });
        const possibleCuke = this.positionMap.get(pos);
        if (possibleCuke === undefined) {
          line += ".";
        } else {
          line += cukeCharForDirection(possibleCuke.direction);
        }
      }
      console.log(line);
    }
  }

  assign(cukeChar: string, x: number, y: number) {
    var direction: Direction = directionForChar(cukeChar);
    const position: Position = { x, y };
    this.positionMap.set(pk(position), { direction, position });
  }

  step(): boolean {
    this.numSteps++;
    var cukesMoved = 0;
    [Direction.EAST, Direction.SOUTH].forEach((direction) => {
      // identify which ones don't have anyone adjacent
      const movableCukes: Cucumber[] = [];
      this.positionMap.forEach((cuke, posKey) => {
        if (cuke.direction !== direction) return;

        const position = positionFromString(posKey);
        const adj = this.adjacentPos(cuke.direction, cuke.position);
        const adjKey = pk(adj);
        if (!this.positionMap.has(adjKey)) {
          movableCukes.push(cuke);
        }
      });

      // move all that can be moved
      movableCukes.forEach((cuke) => {
        const curPosKey = pk(cuke.position);
        this.positionMap.delete(curPosKey);

        const adj = this.adjacentPos(cuke.direction, cuke.position);
        cuke.position = adj;
        const adjKey = pk(adj);
        this.positionMap.set(adjKey, cuke);
      });

      cukesMoved += movableCukes.length;
    });

    return cukesMoved > 0;
  }

  adjacentPos(direction: Direction, position: Position): Position {
    switch (direction) {
      case Direction.EAST:
        const x = (position.x + 1) % this.width;
        return { x, y: position.y };
      case Direction.SOUTH:
        const y = position.y - 1 < 0 ? this.height - 1 : position.y - 1;
        return { x: position.x, y };
    }
  }
}

function parseInput(lines: string[]): OceanFloor {
  const of = new OceanFloor(lines[0].length, lines.length);
  for (var line = 0; line < lines.length; line++) {
    // to keep things sane, lets always let y go UP, 0 indexed, so the bottom one in the input is 0
    const y = lines.length - line - 1;
    const lineStr = lines[line];

    [...lineStr].forEach((char, x) => {
      if (char !== ".") {
        of.assign(char, x, y);
      }
    });
  }

  return of;
}

(() => {
  const oceanFloor = parseInput(array);
  oceanFloor.display();

  while (oceanFloor.step()) {
    if (oceanFloor.numSteps % 10000 === 0) {
      console.log(`after ${oceanFloor.numSteps}::`);
      oceanFloor.display();
    }
  }

  console.log(oceanFloor.numSteps);
})();
