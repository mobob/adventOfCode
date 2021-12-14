import * as fs from "fs";

var array = fs.readFileSync("src/2021/day13.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

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
}

function pointFromString(pointString: string) {
  const matches = pointString.match(/-?\d+/g);
  return new Point(parseInt(matches![0]), parseInt(matches![1]));
}

interface Fold {
  axis: string;
  value: number;
}

function parseFold(line: string): Fold {
  const matches = line.match(/( [x|y])=(\d+)/);
  return { axis: matches![1].trim(), value: parseInt(matches![2]) };
}

function parseInput(a: string[]) {
  const points = new Array<Point>();
  const folds = new Array<Fold>();
  var parsingPoints = true;
  a.forEach((line) => {
    if (parsingPoints && line.trim().length === 0) {
      parsingPoints = false;
      return;
    }
    if (parsingPoints) {
      points.push(pointFromString(line));
    } else {
      folds.push(parseFold(line));
    }
  });
  return { points, folds };
}

function processFold(points: Array<Point>, fold: Fold) {
  points.forEach((point) => {
    if (fold.axis === "x") {
      if (point.x > fold.value) {
        point.x = point.x - 2 * (point.x - fold.value);
      }
    } else if (fold.axis === "y") {
      if (point.y > fold.value) {
        point.y = point.y - 2 * (point.y - fold.value);
      }
    } else {
      throw `bad axis! ${fold.axis}`;
    }
  });
}

function consoleDisplay(points: Array<Point>) {
  const maxx = points.reduce((prev, cur) => {
    return prev > cur.x ? prev : cur.x;
  }, 0);
  const maxy = points.reduce((prev, cur) => {
    return prev > cur.y ? prev : cur.y;
  }, 0);
  for (var y = 0; y <= maxy; y++) {
    var line = "";
    for (var x = 0; x <= maxx; x++) {
      var found = false;
      for (var p of points) {
        if (p.x === x && p.y === y) {
          found = true;
          break;
        }
      }
      line += found ? "#" : ".";
    }
    console.log(line);
  }
  console.log("");
}

(() => {
  let { points, folds } = parseInput(array);
  //console.dir(points);
  //console.dir(folds);

  for (var fold of folds) {
    processFold(points, fold);

    // remove any dups
    points = Array.from(
      new Set(
        points.map((p) => {
          return p.asString();
        })
      )
    ).map((pstr) => {
      return pointFromString(pstr);
    });

    console.log(
      `after fold ${JSON.stringify(fold)} we have ${
        points.length
      } unique points.`
    );

    //console.dir(points);
    consoleDisplay(points);
  }
})();
