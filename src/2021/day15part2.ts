import * as fs from "fs";

var array = fs
  .readFileSync("src/2021/day15test.txt")
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

function buildRiskMap(a: Array<string>) {
  const baseRows = new Array<Array<number>>();
  a.forEach((line) => {
    baseRows.push(
      [...line].map((char) => {
        return parseInt(char);
      })
    );
  });

  const width = baseRows[0].length;
  const height = baseRows.length;

  // ok lets part 2-ify it
  var rows = new Array<Array<number>>();
  for (var y = 0; y < 5; y++) {
    for (var h = 0; h < height; h++) {
      var row = new Array<number>();
      for (var x = 0; x < 5; x++) {
        row.push(
          ...baseRows[h].map((val) => {
            return ((val + x + y - 1) % 9) + 1;
          })
        );
      }
      rows.push(row);
    }
  }

  return { riskMap: rows, width: width * 5, height: height * 5 };
}
const { riskMap, width, height } = buildRiskMap(array);

function riskAtPosition(x: number, y: number): number {
  return riskMap[y][x];
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

  costFromRoot: number = Infinity;

  asString(): string {
    return this.str;
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

  manhattanDistance(p: Point): number {
    return Math.abs(p.y - this.y) + Math.abs(p.x - this.x);
  }
}

///

interface Stringable {
  asString(): string;
}

class PQNode<T extends Stringable> {
  obj: T;
  constructor($obj: T) {
    this.obj = $obj;
  }
}

class PriorityQueue<T extends Stringable> {
  private items = new Array<PQNode<T>>();
  private keyStrToItem = new Map<string, PQNode<T>>();

  private comparator: (a: T, b: T) => number;
  constructor($comparator: (a: T, b: T) => number) {
    this.comparator = $comparator;
  }

  // yes. i totally stole all this code from: https://www.geeksforgeeks.org/implementation-priority-queue-javascript/
  enqueue(obj: T) {
    var qElement = new PQNode(obj);
    var contain = false;

    for (var i = 0; i < this.items.length; i++) {
      if (this.comparator(this.items[i].obj, qElement.obj) > 0) {
        this.items.splice(i, 0, qElement);
        contain = true;
        break;
      }
    }

    if (!contain) {
      this.items.push(qElement);
    }

    // and add to our set
    this.keyStrToItem.set(qElement.obj.asString(), qElement);
  }

  get isEmpty() {
    return this.items.length == 0;
  }

  get size() {
    return this.items.length;
  }

  dequeue() {
    if (this.isEmpty) throw `underflow!`;

    const obj = this.items.shift()!.obj;
    this.keyStrToItem.delete(obj.asString());

    return obj;
  }

  has(obj: T): boolean {
    return !!this.keyStrToItem.get(obj.asString());
  }

  remove(obj: T): boolean {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].obj == obj) {
        this.items.splice(i, 1);
        this.keyStrToItem.delete(obj.asString());
        return true;
      }
    }
    return false;
  }

  updatePriorityIfHas(obj: T) {
    // if we successfully remove it, readd it
    if (this.remove(obj)) {
      this.enqueue(obj);
    }
  }
}

///

function getUnvisitedNeighbours(
  map: Array<Array<Point>>,
  pq: PriorityQueue<Point>,
  p: Point
): Array<Point> {
  var pointsToExplore = new Array<Point>();
  if (p.x + 1 < width) pointsToExplore.push(map[p.y][p.x + 1]);
  if (p.y + 1 < height) pointsToExplore.push(map[p.y + 1][p.x]);
  if (p.x > 0) pointsToExplore.push(map[p.y][p.x - 1]);
  if (p.y > 0) pointsToExplore.push(map[p.y - 1][p.x]);
  pointsToExplore = pointsToExplore.filter((val) => {
    return val && val.isInMap;
  });
  return pointsToExplore;
}

function makeMap() {
  const map = new Array<Array<Point>>();
  for (var y = 0; y < height; y++) {
    var row = new Array<Point>();
    for (var x = 0; x < width; x++) {
      const p = new Point(x, y);
      row.push(new Point(x, y));
    }
    map.push(row);
  }
  return map;
}

const comparisonFunction = (a: Point, b: Point, end: Point) => {
  // lets sort by the "closest" pieces first
  const mdistdiff = a.manhattanDistance(end) - b.manhattanDistance(end);
  if (mdistdiff !== 0) {
    return mdistdiff;
  }

  // otherwise its the one that is least cost
  return a.costFromRoot - b.costFromRoot;
};

var exploreCount = 0;
function aStar(start: Point, end: Point) {
  const queue = new PriorityQueue<Point>((a: Point, b: Point) => {
    return comparisonFunction(a, b, end);
  });

  const map = makeMap();

  const parentMap = new Map<string, Point>();

  start.costFromRoot = 0;

  // Init queue with the root node
  queue.enqueue(start);

  while (!queue.isEmpty) {
    var p = queue.dequeue()!;

    if (++exploreCount % 1000000 === 0) {
      console.log(
        `astar ${exploreCount} at (${p.x}, ${p.y}), parentMap len:${parentMap.size}, qsize: ${queue.size}`
      );
      // throw `foobar`;
    }

    const neighbours = getUnvisitedNeighbours(map, queue, p);
    for (var neighbor of neighbours) {
      // if the new cost is cheaper, then this is the best path to this one so we need to explore it
      const newNeighbourCost =
        p.costFromRoot + riskAtPosition(neighbor.x, neighbor.y);
      if (newNeighbourCost < neighbor.costFromRoot) {
        neighbor.costFromRoot = newNeighbourCost;

        // update it's best parent
        parentMap.set(neighbor.asString(), p);

        // and lets enqueue it, or update its priority in the queue
        if (!queue.has(neighbor)) {
          queue.enqueue(neighbor);
        } else {
          queue.updatePriorityIfHas(neighbor);
        }
      }
    }
  }

  return parentMap;
}

///

(() => {
  const startPoint = new Point(0, 0);
  const endPoint = new Point(width - 1, height - 1);

  const startTime = new Date();
  const parentMap = aStar(startPoint, endPoint);
  console.log(`total time: ${new Date().getTime() - startTime.getTime()}`);

  // trace it back
  var cur = endPoint;
  var cost = 0;
  while (cur !== startPoint) {
    cost += riskAtPosition(cur.x, cur.y);
    cur = parentMap.get(cur.asString())!;
  }

  console.dir(cost);
})();
