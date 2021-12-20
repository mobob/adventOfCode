import assert from "assert";
import * as fs from "fs";

var array = fs.readFileSync("src/2021/day17.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

interface Range {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

function parseIntput(line: string): {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
} {
  const matches = line.match(/-?\d+/g)!;
  return {
    xmin: parseInt(matches[0]),
    xmax: parseInt(matches[1]),
    ymin: parseInt(matches[2]),
    ymax: parseInt(matches[3]),
  };
}

class Point {
  x: number;
  y: number;
  private str: string;
  constructor($x: number, $y: number) {
    this.x = $x;
    this.y = $y;
    this.str = `(${this.x},${this.y})`;
  }

  asString(): string {
    return this.str;
  }
}

function pointInRange(p: Point, range: Range): boolean {
  return (
    p.x >= range.xmin &&
    p.x <= range.xmax &&
    p.y >= range.ymin &&
    p.y <= range.ymax
  );
}

function getPossibleInitialXvels(targetArea: Range): Array<number> {
  const startingxs = [];
  for (var xvel1 = 0; xvel1 < targetArea.xmax + 1; xvel1++) {
    var xvel = xvel1;
    var x = 0;

    // how many iterations should we do? lets start with 100
    for (var i = 0; i < 10000; i++) {
      const p = new Point(x, targetArea.ymin);
      const inTrench = pointInRange(p, targetArea);
      if (inTrench) {
        console.log(`p:${p.asString()} - ${inTrench} - initial yvel:${xvel1}`);
        startingxs.push(xvel1);
        break;
      }

      x += xvel;

      if (xvel > 0) {
        xvel--;
      } else if (xvel < 0) {
        xvel++;
      } else {
        break;
      }

      // if we're under ymin, we can bail
      if (x > targetArea.xmax) {
        break;
      }
    }
  }
  return startingxs;
}

function getPossibleInitialYvels(targetArea: Range): Array<number> {
  // lets first determine the y range where we'll land in the y range
  // we can start at a velocity of the ymin - 1 (where we shouldn't hit the range),
  // and count it out to see if we hit the range,
  const startingys = [];

  for (
    var yvel1 = targetArea.ymin - 1;
    yvel1 < Math.abs(targetArea.ymax * 5);
    yvel1++
  ) {
    var yvel = yvel1;
    var y = 0;

    // how many iterations should we do? lets start with 100
    for (var i = 0; i < 10000; i++) {
      const p = new Point(targetArea.xmin, y);
      const inTrench = pointInRange(p, targetArea);
      if (inTrench) {
        console.log(`p:${p.asString()} - ${inTrench} - initial yvel:${yvel1}`);
        startingys.push(yvel1);
        break;
      }

      y += yvel;
      yvel--;

      // if we're under ymin, we can bail
      if (y < targetArea.ymin) {
        break;
      }
    }
  }
  return startingys;
}

// adjusted this for part 2 !
// had coded it exactly this ay without the second var, minor adjustment for part 2!
function doParts1And2(): { maxy: number; matchingInitialVels: number } {
  const targetArea = parseIntput(array[0]);

  const startingxs = getPossibleInitialXvels(targetArea);
  const startingys = getPossibleInitialYvels(targetArea);

  console.log(`about to search over the velicotiry range x, y`);
  console.dir(startingxs);
  console.dir(startingys);

  var maxy = -1;
  var matchingInitialVels = 0;
  startingxs.forEach((xvel1) => {
    startingys.forEach((yvel1) => {
      var x = 0;
      var y = 0;
      var xvel = xvel1;
      var yvel = yvel1;

      var maxYForThisRound = -1;
      for (var i = 0; ; i++) {
        if (y > maxYForThisRound) {
          maxYForThisRound = y;
        }

        const inTrench = pointInRange(new Point(x, y), targetArea);
        if (inTrench) {
          // YAY we're in trench, now we can check if this is maxy
          if (maxYForThisRound > maxy) {
            maxy = maxYForThisRound;
          }

          matchingInitialVels++;
          console.log(`initial vel: ${xvel1},${yvel1}`);

          // and break regardless
          break;
        }

        // increment, then bail if need be
        x += xvel;
        y += yvel;

        if (xvel > 0) {
          xvel--;
        } else if (xvel < 0) {
          xvel++;
        }
        yvel--;

        if (x > targetArea.xmax || y < targetArea.ymin) {
          break;
        }
      }
    });
  });

  return { maxy, matchingInitialVels };
}

(() => {
  console.log(doParts1And2());
})();
