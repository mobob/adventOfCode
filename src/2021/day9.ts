import { match } from "assert";
import { setDefaultResultOrder } from "dns";
import * as fs from "fs";
import { decode } from "querystring";

var array = fs.readFileSync("src/2021/day9.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

const width = array[0].length;
const height = array.length;

function calculateRiskScore(
  hm: Array<Array<number>>,
  x: number,
  y: number
): number {
  const adjacents = [];

  // look for the adjacent spots
  if (x > 0) {
    adjacents.push(hm[y][x - 1]);
  }
  if (x + 1 < width) {
    adjacents.push(hm[y][x + 1]);
  }
  if (y > 0) {
    adjacents.push(hm[y - 1][x]);
  }
  if (y + 1 < height) {
    adjacents.push(hm[y + 1][x]);
  }

  const ourVal = hm[y][x];
  var lowPoint = true;
  adjacents.forEach((adj) => {
    if (ourVal >= adj) {
      lowPoint = false;
    }
  });
  if (!lowPoint) return 0;
  return ourVal + 1;
}

const heightMap = array.map((val) => {
  return [...val].map((str) => {
    return parseInt(str);
  });
});

function sumRiskScores() {
  var sum = 0;
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      const rs = calculateRiskScore(heightMap, x, y);
      if (rs > 0) {
        console.log(`low point: ${x}, ${y} = ${rs - 1}`);
        sum += rs;
      }
    }
  }
  console.log(sum);
}

sumRiskScores();

// part 2

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

  get isOnGrid(): boolean {
    return this.x >= 0 && this.x < width && this.y >= 0 && this.y < height;
  }
}

function pointFromString(pointString: string) {
  console.dir(pointString);
  const matches = pointString.match(/-?\d+/g);
  console.dir(matches);
  return new Point(parseInt(matches![0]), parseInt(matches![1]));
}
// TEST console.log(pointFromString(new Point(-45, 0).asString()));

function isLowpoint(hm: Array<Array<number>>, x: number, y: number) {
  return calculateRiskScore(hm, x, y) > 0;
}

class Basin {
  lowPoint: Point;

  // represented as string here
  basinPoints = new Set<string>();

  constructor($lowPoint: Point) {
    this.lowPoint = $lowPoint;
  }

  addPointToBasin(p: Point) {
    this.basinPoints.add(p.asString());
  }

  hasPoint(p: Point): boolean {
    return this.basinPoints.has(p.asString());
  }

  get size(): number {
    return this.basinPoints.size;
  }
}

function exploreBasin(
  basin: Basin,
  hm: Array<Array<number>>,
  explorePoint: Point
) {
  // if point isn't valid, we're done
  if (!explorePoint.isOnGrid) {
    return;
  }

  // if its already included, we're done
  if (basin.hasPoint(explorePoint)) {
    return;
  }

  // if its a 9, can skip
  if (hm[explorePoint.y][explorePoint.x] === 9) {
    return;
  }

  // otherwise, lets add it, and explore all its friends!
  basin.addPointToBasin(explorePoint);

  exploreBasin(basin, hm, new Point(explorePoint.x - 1, explorePoint.y));
  exploreBasin(basin, hm, new Point(explorePoint.x + 1, explorePoint.y));
  exploreBasin(basin, hm, new Point(explorePoint.x, explorePoint.y - 1));
  exploreBasin(basin, hm, new Point(explorePoint.x, explorePoint.y + 1));
}

function identifyBasins(hm: Array<Array<number>>) {
  const basins = new Array<Basin>();

  // loop over low points
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      if (isLowpoint(hm, x, y)) {
        const lowPoint = new Point(x, y);
        const basin = new Basin(new Point(x, y));
        exploreBasin(basin, hm, lowPoint);
        basins.push(basin);
      }
    }
  }

  // get their sizes
  const basinSizes = basins.map((basin) => {
    return basin.size;
  });
  basinSizes.sort((a, b) => {
    return b - a;
  });

  // result is biggest 3 multiplied together
  console.dir(basins);
  console.log(basinSizes[0] * basinSizes[1] * basinSizes[2]);
}

identifyBasins(heightMap);
