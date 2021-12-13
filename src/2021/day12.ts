import * as fs from "fs";

var array = fs.readFileSync("src/2021/day12.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

class Cave {
  name: string;
  constructor($name: string) {
    this.name = $name;
  }

  get isStart(): boolean {
    return "start" === this.name;
  }
  get isEnd(): boolean {
    return "end" === this.name;
  }
  get isSmallCave(): boolean {
    return (
      !this.isStart && !this.isEnd && this.name.toUpperCase() !== this.name
    );
  }
  get isLargeCave(): boolean {
    return (
      !this.isStart && !this.isEnd && this.name.toUpperCase() === this.name
    );
  }
}

function parseInput(a: Array<string>): {
  caveMap: Map<string, Cave>;
  connections: Array<Array<Cave>>;
} {
  const caveMap = new Map<string, Cave>();
  const connection = new Array<Array<Cave>>();
  a.forEach((line) => {
    // add to the map
    let [left, right] = line.split("-");
    [left, right].forEach((cave) => {
      if (!caveMap.has(cave)) {
        caveMap.set(cave, new Cave(cave));
      }
    });
    // then add the paths
    connection.push([caveMap.get(left)!, caveMap.get(right)!]);
  });
  return { caveMap, connections: connection };
}

class CavePath {
  path = new Array<Cave>();

  duplicate(): CavePath {
    const dup = new CavePath();
    dup.path = [...this.path];
    return dup;
  }

  get currentCave(): Cave {
    return this.path[this.path.length - 1];
  }

  addToPath(cave: Cave) {
    this.path.push(cave);
  }

  isInPath(cave: Cave): boolean {
    return this.path.indexOf(cave) >= 0;
  }

  // for part 2
  isInPathCount(cave: Cave): number {
    return this.path.filter((val) => {
      return val === cave;
    }).length;
  }

  visitedAnySmallCaveTwice(): boolean {
    // if the array is bigger than the set of small caves visited, we have
    const smallCavesVisited = this.path.filter((val) => {
      return val.isSmallCave;
    });
    return new Set(smallCavesVisited).size < smallCavesVisited.length;
  }

  asString(): string {
    var result = "";
    this.path.forEach((c) => {
      result += c.name + "-";
    });
    return result;
  }
}

function isValidNextCave(
  cp: CavePath,
  next: Cave,
  caveMap: Map<string, Cave>,
  connections: CaveConnections
): boolean {
  if (next.isStart) {
    return false;
  }
  // for part 1!
  // if (next.isSmallCave && cp.isInPath(next)) {
  //   return false;
  // }
  // for part 2!
  if (next.isSmallCave && cp.isInPath(next) && cp.visitedAnySmallCaveTwice()) {
    return false;
  }
  return true;
}

var findCount = 0;
function findAllPaths(
  currentPath: CavePath,
  caveMap: Map<string, Cave>,
  connections: CaveConnections
): Array<CavePath> {
  const completePaths = new Array<CavePath>();

  if (findCount++ % 10000 === 0) {
    console.log(
      `find ${findCount} - complete:${completePaths.length} at len ${
        currentPath.path.length
      } for ${currentPath.asString()}`
    );
  }

  const possibleNextCaves = connections.getPossibleNextCaves(
    currentPath.currentCave
  );
  if (possibleNextCaves) {
    possibleNextCaves.forEach((next) => {
      if (isValidNextCave(currentPath, next, caveMap, connections)) {
        // spin a new path, add this on, and do the same!
        const newPath = currentPath.duplicate();
        newPath.addToPath(next);

        // if its actually the end, then this one is done
        if (next.isEnd) {
          completePaths.push(newPath);
        } else {
          const newCompletePaths = findAllPaths(newPath, caveMap, connections);
          if (newCompletePaths.length > 0) {
            completePaths.push(...newCompletePaths);
          }
        }
      }
    });
  }

  return completePaths;
}

var findCount = 0;
function findAllPathsIterative(
  currentPath: CavePath,
  caveMap: Map<string, Cave>,
  connections: CaveConnections
): number {
  var completePathCount = 0;

  var toProcessStack = [currentPath];
  while (toProcessStack.length > 0) {
    if (findCount++ % 10000 === 0) {
      console.log(
        `find ${findCount} - complete:${completePathCount} at len ${
          currentPath.path.length
        } for ${currentPath.asString()}`
      );
    }

    currentPath = toProcessStack.pop()!;
    const possibleNextCaves = connections.getPossibleNextCaves(
      currentPath.currentCave
    );
    if (possibleNextCaves) {
      possibleNextCaves.forEach((next) => {
        if (isValidNextCave(currentPath, next, caveMap, connections)) {
          // spin a new path, add this on, and do the same!
          const newPath = currentPath.duplicate();
          newPath.addToPath(next);

          // if its actually the end, then this one is done
          if (next.isEnd) {
            completePathCount++;
          } else {
            toProcessStack.push(newPath);
          }
        }
      });
    }
  }

  return completePathCount;
}

class CaveConnections {
  private directionalConnections = new Map<string, Array<Cave>>();
  constructor(caveMap: Map<string, Cave>, connections: Array<Array<Cave>>) {
    connections.forEach(([left, right]) => {
      // always add the initial one in
      this.add(left, right);

      // and add the opposite if its not start/end
      if (!left.isStart && !right.isEnd) {
        this.add(right, left);
      }
    });
  }

  add(left: Cave, right: Cave) {
    var conns = this.directionalConnections.get(left.name);
    if (!conns) {
      conns = new Array<Cave>();
      this.directionalConnections.set(left.name, conns);
    }
    conns.push(right);
  }

  getPossibleNextCaves(left: Cave): Array<Cave> {
    return this.directionalConnections.get(left.name)!;
  }
}

function spelunk(caveMap: Map<string, Cave>, connections: Array<Array<Cave>>) {
  // lets create a map for the connections that obey understood rules (that might change for part 2?)
  const caveConnections = new CaveConnections(caveMap, connections);

  const startingPath = new CavePath();
  startingPath.addToPath(caveMap.get("start")!);

  const completePaths = findAllPaths(startingPath, caveMap, caveConnections);
  // const completePaths = findAllPathsIterative(
  //   startingPath,
  //   caveMap,
  //   caveConnections
  // );
  completePaths.forEach((cp) => {
    console.log(cp.asString());
  });
  console.log(`found ${completePaths.length} complete paths`);
}

(() => {
  let { caveMap, connections } = parseInput(array);
  spelunk(caveMap, connections);
})();
