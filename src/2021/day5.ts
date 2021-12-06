import * as fs from "fs";

var array = fs.readFileSync("src/2021/day5.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

interface Point {
  x: number;
  y: number;
}

class PointImpl implements Point {
  x!: number;
  y!: number;
  constructor($x: number, $y: number) {
    this.x = $x;
    this.y = $y;
  }

  toString() {
    return `(${this.x},${this.y})`;
  }
}

function pointKey(p: Point): PointKey {
  return `(${p.x},${p.y})`;
}
type PointKey = string;

interface Line {
  p1: Point;
  p2: Point;
}

function parse(input: Array<String>) {
  const lines = new Array<Line>();
  input.forEach((element) => {
    const matches = element.match(/^([0-9]*),([0-9]*) -> ([0-9]*),([0-9]*)$/);
    if (matches == null || matches.length != 5) {
      throw `bad input: ${element}, matches: ${matches}`;
    }
    lines.push({
      p1: {
        x: parseInt(matches[1]),
        y: parseInt(matches[2]),
      },
      p2: {
        x: parseInt(matches[3]),
        y: parseInt(matches[4]),
      },
    });
  });
  return lines;
}
const lines = parse(array);
//console.dir(lines);

function plotCoveredPoints(lines: Array<Line>): Map<PointKey, number> {
  const counts = new Map<PointKey, number>();
  for (var line of lines) {
    // for now, only consider straight lines
    if (line.p1.x !== line.p2.x && line.p1.y !== line.p2.y) {
      continue;
    }

    if (line.p1.x === line.p2.x) {
      // chose the smallest p first
      var p1, p2;
      if (line.p1.y <= line.p2.y) {
        p1 = line.p1;
        p2 = line.p2;
      } else {
        p1 = line.p2;
        p2 = line.p1;
      }

      for (var y = p1.y; y <= p2.y; y++) {
        const p = new PointImpl(p1.x, y);
        counts.set(
          pointKey(p),
          counts.get(pointKey(p)) ? counts.get(pointKey(p))! + 1 : 1
        );
      }
    } else if (line.p1.y === line.p2.y) {
      // chose the smallest p first
      var p1, p2;
      if (line.p1.x <= line.p2.x) {
        p1 = line.p1;
        p2 = line.p2;
      } else {
        p1 = line.p2;
        p2 = line.p1;
      }

      for (var x = p1.x; x <= p2.x; x++) {
        const p = new PointImpl(x, p1.y);
        counts.set(
          pointKey(p),
          counts.get(pointKey(p)) ? counts.get(pointKey(p))! + 1 : 1
        );
      }
    }
  }

  return counts;
}

const coveredPoints = plotCoveredPoints(lines);

var countOfMoreThanOne = 0;
coveredPoints.forEach((count: number, key: PointKey) => {
  countOfMoreThanOne += count > 1 ? 1 : 0;
});

//console.dir(coveredPoints);
//console.dir(coveredPoints.keys());
console.log(countOfMoreThanOne);

// part 2!

function plotCoveredPointsInclDiagonals(
  lines: Array<Line>
): Map<PointKey, number> {
  const counts = new Map<PointKey, number>();
  for (var line of lines) {
    if (line.p1.x === line.p2.x) {
      // chose the smallest p first
      var p1, p2;
      if (line.p1.y <= line.p2.y) {
        p1 = line.p1;
        p2 = line.p2;
      } else {
        p1 = line.p2;
        p2 = line.p1;
      }

      for (var y = p1.y; y <= p2.y; y++) {
        const p = new PointImpl(p1.x, y);
        counts.set(
          pointKey(p),
          counts.get(pointKey(p)) ? counts.get(pointKey(p))! + 1 : 1
        );
      }
    } else if (line.p1.y === line.p2.y) {
      // chose the smallest p first
      var p1, p2;
      if (line.p1.x <= line.p2.x) {
        p1 = line.p1;
        p2 = line.p2;
      } else {
        p1 = line.p2;
        p2 = line.p1;
      }

      for (var x = p1.x; x <= p2.x; x++) {
        const p = new PointImpl(x, p1.y);
        counts.set(
          pointKey(p),
          counts.get(pointKey(p)) ? counts.get(pointKey(p))! + 1 : 1
        );
      }
    } else {
      // must be a diagonal line, this means both are changing - and we know its 45 degrees
      // lets make this work regardless of which is bigger
      const p1 = line.p1;
      const p2 = line.p2;
      for (
        var x = p1.x, y = p1.y;
        (p1.x < p2.x ? x <= p2.x : x >= p2.x) &&
        (p1.y < p2.y ? y <= p2.y : y >= p2.y);
        p1.x < p2.x ? x++ : x--, p1.y < p2.y ? y++ : y--
      ) {
        const p = new PointImpl(x, y);
        counts.set(
          pointKey(p),
          counts.get(pointKey(p)) ? counts.get(pointKey(p))! + 1 : 1
        );
      }
    }
  }

  return counts;
}

const coveredPointsWithDiags = plotCoveredPointsInclDiagonals(lines);

var countOfMoreThanOne = 0;
coveredPointsWithDiags.forEach((count: number, key: PointKey) => {
  countOfMoreThanOne += count > 1 ? 1 : 0;
});

//console.dir(coveredPoints);
//console.dir(coveredPoints.keys());
console.log(countOfMoreThanOne);
