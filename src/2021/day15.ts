import exp from "constants";
import * as fs from "fs";

var array = fs.readFileSync("src/2021/day15.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

function parseInput(a: Array<string>) {
  const rows = new Array<Array<number>>();
  a.forEach((line) => {
    rows.push(
      [...line].map((char) => {
        return parseInt(char);
      })
    );
  });
  const width = rows[0].length;
  const height = rows.length;
  return { riskMap: rows, width, height };
}
const { riskMap, width, height } = parseInput(array);

function riskAtPosition(x: number, y: number): number {
  return riskMap[y][x];
}

//console.log(riskAtPosition(2, 0));

class Point {
  x: number;
  y: number;
  constructor($x: number, $y: number) {
    this.x = $x;
    this.y = $y;
  }

  asString(): string {
    return `(${this.x},${this.y})`;
  }

  get isEndPoint(): boolean {
    return this.x + 1 === width && this.y + 1 === height;
  }
  get isStartPoint(): boolean {
    return this.x === 0 && this.y === 0;
  }

  get isInMap(): boolean {
    return this.x >= 0 && this.x < width && this.y >= 0 && this.y < height;
  }
}

function pointFromString(pointString: string) {
  const matches = pointString.match(/-?\d+/g);
  return new Point(parseInt(matches![0]), parseInt(matches![1]));
}

// can we just go through all possible paths?

class Path {
  points = new Array<Point>();
  visited = new Set<string>();
  risk = 0;

  visit(p: Point) {
    this.points.push(p);
    this.visited.add(p.asString());
    if (!p.isStartPoint) {
      this.risk += riskAtPosition(p.x, p.y);
    }
  }

  get last(): Point {
    return this.points[this.points.length - 1];
  }

  duplicate(): Path {
    const dup = new Path();
    dup.points = [...this.points];
    dup.visited = new Set(this.visited);
    dup.risk = this.risk;
    return dup;
  }
}

function newBestRiskScore(
  resultPathRiskScore: number | null,
  lowestRiskSoFar: number | null
): number | null {
  if (resultPathRiskScore === null) return lowestRiskSoFar;
  if (!lowestRiskSoFar) return resultPathRiskScore;
  if (resultPathRiskScore < lowestRiskSoFar) {
    //console.log(`new low risk score: ${resultPathRiskScore}`);
    return resultPathRiskScore;
  }
  return lowestRiskSoFar;
}

var lowestCostLocationMap = new Map<String, number>();

// returns a Path if it finds one that is lower risk than the one past in
var exploreCount = 0;
function explore(
  path: Path,
  p: Point,
  lowestRiskSoFar: number | null
): number | null {
  if (!p.isInMap) return null;
  if (path.visited.has(p.asString())) return null;

  if (++exploreCount % 100000 === 0) {
    console.log(
      `exploreCount ${exploreCount} at (${p.x}, ${p.y}), lowestRiskSoFar: ${lowestRiskSoFar}, cur: ${path.risk}`
    );
    // throw `foobar`;
  }
  // console.log(
  //   `exploreCount ${exploreCount} at (${p.x}, ${p.y}), lowestRiskSoFar: ${lowestRiskSoFar}, cur: ${path.risk}`
  // );

  // lets visit it
  path.visit(p);

  // if we went over the risk tolerance, we're done
  if (lowestRiskSoFar && path.risk >= lowestRiskSoFar) {
    return null;
  }

  // if we've been at this spot before at this cost or cheaper, then we're also done
  const curSpotLowCost = lowestCostLocationMap.get(p.asString());
  if (curSpotLowCost) {
    if (curSpotLowCost < path.risk) {
      return null;
    }
  }
  lowestCostLocationMap.set(p.asString(), path.risk);

  // if we reached the end, we're done
  if (p.isEndPoint) {
    return path.risk;
  }

  // lets explore! all the ways!
  // lowestRiskSoFar = newBestRiskScore(
  //   explore(path.duplicate(), new Point(p.x - 1, p.y), lowestRiskSoFar),
  //   lowestRiskSoFar
  // );

  if (exploreCount % 2 === 0) {
    lowestRiskSoFar = newBestRiskScore(
      explore(path.duplicate(), new Point(p.x + 1, p.y), lowestRiskSoFar),
      lowestRiskSoFar
    );
    // lowestRiskSoFar = newBestRiskScore(
    //   explore(path.duplicate(), new Point(p.x, p.y - 1), lowestRiskSoFar),
    //   lowestRiskSoFar
    // );
    lowestRiskSoFar = newBestRiskScore(
      explore(path.duplicate(), new Point(p.x, p.y + 1), lowestRiskSoFar),
      lowestRiskSoFar
    );
  } else {
    lowestRiskSoFar = newBestRiskScore(
      explore(path.duplicate(), new Point(p.x, p.y + 1), lowestRiskSoFar),
      lowestRiskSoFar
    );

    lowestRiskSoFar = newBestRiskScore(
      explore(path.duplicate(), new Point(p.x + 1, p.y), lowestRiskSoFar),
      lowestRiskSoFar
    );
    // lowestRiskSoFar = newBestRiskScore(
    //   explore(path.duplicate(), new Point(p.x, p.y - 1), lowestRiskSoFar),
    //   lowestRiskSoFar
    // );
  }

  return lowestRiskSoFar;
}

function testPath(): Path {
  // visit all the x, then work our way down
  const path = new Path();
  for (let x = 0; x < width; x++) {
    path.visit(new Point(x, 0));
  }
  for (let y = 0; y < width; y++) {
    path.visit(new Point(width - 1, y));
  }
  return path;
}

(() => {
  const apath = testPath();
  console.log(`a test path is: ${apath.risk}`);

  const startPath = new Path();

  const lowestRisk = explore(startPath, new Point(0, 0), apath.risk);

  console.log(lowestRisk);
})();
