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

//console.log(riskAtPosition(2, 0));

class Point {
  x: number;
  y: number;
  private str: string;
  constructor($x: number, $y: number) {
    this.x = $x;
    this.y = $y;
    this.str = `(${this.x},${this.y})`;
  }

  distance: number = Infinity;
  rootDistance: number = Infinity;
  discovered: boolean = false;

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

  distanceTo(p: Point): number {
    // don't need/want to be this precise
    // const dx = p.x - this.x;
    // const dy = p.y - this.y;
    // return Math.floor(Math.sqrt(dx * dx + dy * dy));

    return Math.abs(p.y - this.y) + Math.abs(p.x - this.x);
  }

  manhattanDistanceHeuristic(point: Point): number {
    // assume 5 is the mean
    return 5 * this.distanceTo(point);
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

  unvisitLast() {
    const last = this.points.pop()!;
    this.visited.delete(last!.asString());
    this.risk -= riskAtPosition(last.x, last.y);
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
    return val && val.isInMap && !pq.has(val) && !val.discovered;
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

var exploreCount = 0;
function aStar(start: Point, end: Point) {
  const queue = new PriorityQueue<Point>();

  const map = makeMap();

  //const path = new Path();
  const parentMap = new Map<string, Point>();

  // Distance to the root itself is zero
  start.rootDistance = 0;

  // Init queue with the root node
  queue.enqueue(start, 0);

  // Iterate over the priority queue until it is empty.
  while (!queue.isEmpty) {
    var p = queue.dequeue()!; // Fetch next closest node
    p.discovered = true; // Mark as discovered

    if (++exploreCount % 1000 === 0) {
      console.log(
        `astar ${exploreCount} at (${p.x}, ${p.y}), parentMap len:${parentMap.size}`
      );
      // throw `foobar`;
    }

    // Iterate over unvisited neighbors
    const neighbours = getUnvisitedNeighbours(map, queue, p);
    for (var neighbor of neighbours) {
      // Update root minimal distance to neighbor including manhattan distance
      neighbor.rootDistance = Math.min(
        neighbor.rootDistance,
        p.rootDistance + riskAtPosition(neighbor.x, neighbor.y)
      );
      const minDistance = Math.min(
        neighbor.distance,
        neighbor.rootDistance + neighbor.manhattanDistanceHeuristic(end)
      );
      if (minDistance !== neighbor.distance) {
        neighbor.distance = minDistance; // update mininmal distance

        // update best parent
        parentMap.set(neighbor.asString(), p);

        // Change queue priority of the neighbor since it have became closer.
        queue.updatePriorityIfHas(neighbor, minDistance);
      }

      // Add neighbor to the queue for further visiting.
      if (!queue.has(neighbor)) queue.enqueue(neighbor, neighbor.distance);
    }
  }

  // Done ! At this point we just have to walk back from the end using the parent
  // If end does not have a parent, it means that it has not been found.
  //console.dir(parentMap);

  return parentMap;
}

function dijkstra(start: Point, end: Point) {
  const queue = new PriorityQueue<Point>();

  const map = makeMap();

  //const path = new Path();
  const parentMap = new Map<string, Point>();

  // Distance to the root itself is zero
  start.distance = 0;

  // Init queue with the root node
  queue.enqueue(start, 0);

  // Iterate over the priority queue until it is empty.
  while (!queue.isEmpty) {
    var p = queue.dequeue()!; // Fetch next closest node
    p.discovered = true; // Mark as discovered

    if (++exploreCount % 1000 === 0) {
      console.log(
        `djykstra ${exploreCount} at (${p.x}, ${p.y}), parentMap len:${parentMap.size}`
      );
      // throw `foobar`;
    }

    // Iterate over unvisited neighbors
    const neighbours = getUnvisitedNeighbours(map, queue, p);
    for (var neighbor of neighbours) {
      // Update minimal distance to neighbor
      // Note: distance between to adjacent node is constant and equal 1 in our grid
      const minDistance = Math.min(
        neighbor.distance,
        p.distance + riskAtPosition(neighbor.x, neighbor.y)
      );

      if (minDistance !== neighbor.distance) {
        neighbor.distance = minDistance; // update mininmal distance

        // update best parent
        parentMap.set(neighbor.asString(), p);

        // Change queue priority of the neighbor since it have became closer.
        queue.updatePriorityIfHas(neighbor, minDistance);
      }

      // Add neighbor to the queue for further visiting.
      if (!queue.has(neighbor)) queue.enqueue(neighbor, neighbor.distance);
    }
  }

  // Done ! At this point we just have to walk back from the end using the parent
  // If end does not have a parent, it means that it has not been found.
  return parentMap;
}

interface Stringable {
  asString(): string;
}

class PQNode<T extends Stringable> {
  obj: T;
  cost: number;
  constructor($obj: T, $cost: number) {
    this.obj = $obj;
    this.cost = $cost;
  }
}

class PriorityQueue<T extends Stringable> {
  items = new Array<PQNode<T>>();
  keyStrToItem = new Map<string, PQNode<T>>();

  // yes. i totally stole all this code from: https://www.geeksforgeeks.org/implementation-priority-queue-javascript/
  enqueue(obj: T, cost: number) {
    // creating object from queue element
    var qElement = new PQNode(obj, cost);
    var contain = false;

    // iterating through the entire
    // item array to add element at the
    // correct location of the Queue
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].cost > qElement.cost) {
        // Once the correct location is found it is
        // enqueued
        this.items.splice(i, 0, qElement);
        contain = true;
        break;
      }
    }

    // if the element have the highest priority
    // it is added at the end of the queue
    if (!contain) {
      this.items.push(qElement);
      this.keyStrToItem.set(qElement.obj.asString(), qElement);
    }
  }

  get isEmpty() {
    return this.items.length == 0;
  }

  // dequeue method to remove
  // element from the queue
  dequeue() {
    // return the dequeued element
    // and remove it.
    // if the queue is empty
    // returns Underflow
    if (this.isEmpty) throw `underflow!`;
    return this.items.shift()?.obj;
  }

  // front function
  front() {
    // returns the highest priority element
    // in the Priority queue without removing it.
    if (this.isEmpty) throw `no items!`;
    return this.items[0];
  }

  // rear function
  rear() {
    // returns the lowest priority
    // element of the queue
    if (this.isEmpty) throw "No elements in Queue";
    return this.items[this.items.length - 1];
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

  updatePriorityIfHas(obj: T, newPriority: number) {
    // if we successfully remove it, readd it
    if (this.remove(obj)) {
      this.enqueue(obj, newPriority);
    }

    // const mappedObj = this.keyStrToItem.get(obj.asString());
    // if (mappedObj) {
    //   mappedObj.cost = newPriority;
    // }
  }
}

(() => {
  const startPoint = new Point(0, 0);
  const endPoint = new Point(width - 1, height - 1);

  const startTime = new Date();

  const parentMap = aStar(startPoint, endPoint);
  //const parentMap = dijkstra(startPoint, endPoint);

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
