import assert from "assert";
import * as fs from "fs";

var array = fs
  .readFileSync("src/2021/day23test.txt")
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

// returns a map of position to amphipod type
// this is day 2 now, so we can jam in the extra lines
function parseInput(a: string[]): Map<string, AmphipodType> {
  var roomLines = a.slice(2, 4);
  roomLines.splice(1, 0, "#D#C#B#A#", "#D#B#A#C#");
  const positions = new Map<string, AmphipodType>();
  for (var y = roomLines.length - 1; y >= 0; y--) {
    const matches = (roomLines[roomLines.length - 1 - y] as string).match(
      /[ABCD]+/g
    );
    matches?.forEach((char, ind) => {
      const type: AmphipodType = (<any>AmphipodType)[char];
      positions.set(pk({ x: 2 + ind * 2, y: y }), type);
    });
  }
  return positions;
}

const yHallway = 4;

enum AmphipodType {
  A,
  B,
  C,
  D,
}

function scoreForType(type: AmphipodType): number {
  switch (type) {
    case AmphipodType.A:
      return 1;
    case AmphipodType.B:
      return 10;
    case AmphipodType.C:
      return 100;
    case AmphipodType.D:
      return 1000;
  }
}

function targetPillarForType(type: AmphipodType): number {
  switch (type) {
    case AmphipodType.A:
      return 2;
    case AmphipodType.B:
      return 4;
    case AmphipodType.C:
      return 6;
    case AmphipodType.D:
      return 8;
  }
}

class GameMap {
  allPositions = new Array<Position>();
  roomColumns = [2, 4, 6, 8];
  adjacencyMap = new Map<string, Array<Position>>();
  constructor() {
    // build up the positions, and set all their adjacencies
    // #############
    // #...........#
    // ###B#C#B#D###
    //   #A#D#C#A#
    //   #########
    // 11 across the top, ie x 0->10, y = 4 as its the 4th row above origin
    for (var x = 0; x < 11; x++) {
      this.allPositions.push({ x: x, y: yHallway });
    }

    // then at x = 2, 4, 6, 8 we have our pillars at all non hallway y's
    this.roomColumns.forEach((x) => {
      for (var y = yHallway - 1; y >= 0; y--) {
        this.allPositions.push({ x: x, y: y });
      }
    });

    // build the adjacency maps
    this.allPositions.forEach((pos1) => {
      const adjacentTo: Position[] = [];
      this.allPositions.forEach((pos2) => {
        if (this.positionIsAdjacentTo(pos1, pos2)) {
          adjacentTo.push(pos2);
        }
      });
      this.adjacencyMap.set(pk(pos1), adjacentTo);
    });
  }

  positionIsAdjacentTo(p1: Position, p2: Position) {
    // if its in our top row, its easy
    if (p1.y === yHallway && p2.y === yHallway) {
      return Math.abs(p1.x - p2.x) === 1;
    }
    // now it needs to be same horiz
    if (p1.x !== p2.x) return false;
    return Math.abs(p1.y - p2.y) === 1;
  }
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

type Amphipod = {
  amphipodType: AmphipodType;
  position: Position;
  inStartingPosition: boolean;
  inFinalPosition: boolean;
  placesMoved: number;
  score: number;
};

// this assumes there is only one path to a destination
function findPathTo(
  a: Position,
  b: Position,
  gm: GameMap,
  visited: string[] = []
): Position[] | null {
  const apk = pk(a);
  visited.push(apk);
  const bpk = pk(b);

  //console.log(`finding path from ${apk} -> ${bpk}, visited: ${visited}`);

  for (var adj of gm.adjacencyMap.get(pk(a))!) {
    const adjpk = pk(adj);

    // if we've already visited this, skip it
    if (visited.includes(adjpk)) continue;

    // if the adj is our target, we're done and this must be the best target
    if (adjpk === bpk) {
      return [adj];
    }

    // otherwise, scope it out
    const path = findPathTo(adj, b, gm, visited);
    if (path !== null) {
      // found it!
      return [adj, ...path];
    }
  }

  return null;
}

// result is an array of an array of positions that track a given possible move, each item
// being one step along the way
function possibleMovesFor(a: Amphipod, gs: GameState): Array<Position[]> {
  // if we're in our final position, no deal
  if (a.inFinalPosition) return [];

  const pms = new Array<Position[]>();

  // loop over all positions
  gs.gm.allPositions.forEach((position) => {
    const posKey = pk(position);

    // if its occupied, no deal
    if (gs.positionMap.has(posKey)) return;

    // pillar collumn
    if (gs.gm.roomColumns.includes(position.x)) {
      // if its a spot outside a pillar, no deal
      if (position.y === yHallway) return;

      // if its a spot in a pillar that isn't our target pillar, no deal
      if (targetPillarForType(a.amphipodType) !== position.x) return;

      // if its in a target pillar but its not the deepest most occupied pillar location, no deal
      const deepestOccupied = gs.positionMap.get(pk({ x: position.x, y: 0 }));

      // if its occupied also make sure its occupied someone in their final position
      if (!deepestOccupied) {
        // deepest is not occupied, so lets make sure we're going to the deepest spot
        if (position.y !== 0) return false;
      } else if (position.y === 0 || !deepestOccupied.inFinalPosition) {
        // otherwise we better be going to a slot other than 0, and the deepest one better be in the final position
        return false;
      }
    }

    // if we're in the hallway, we must move in to a room
    if (a.position.y === yHallway && position.y === yHallway) return;

    // look for the best path to it
    const path = findPathTo(a.position, position, gs.gm);
    if (path === null) return;

    // console.log(
    //   `found path from ${pk(a.position)} -> ${pk(position)}, path: ${path.map(
    //     (p) => pk(p)
    //   )}`
    // );

    // if path is length 1, its not useful
    if (path.length === 1) return;

    // if there is no path to it, ie we're blocked from getting there / any of these locations are occupid, then no deal
    const anyOccupied =
      path.filter((position) => gs.positionMap.has(pk(position))).length > 0;
    if (anyOccupied) return;

    // otherwise add this path
    pms.push(path);
  });

  // console.log(
  //   `pmfc:${pmfCount} fbs:${fbsCount} found ${pms.length} possible moves`
  // );

  return pms;
}

class GameState {
  positionMap = new Map<string, Amphipod>();
  gm: GameMap = new GameMap();
  moveCount = 0;
  moveInfo: string[] = [];
  dumpMoves() {
    this.moveInfo.forEach((mi) => console.log(mi));
  }
  dumpPositions() {
    // #############
    // #...........#
    // ###B#C#B#D###
    //   #A#D#C#A#
    //   #########
    const allPositionKeys = new Set(this.gm.allPositions.map((pos) => pk(pos)));
    console.log(`#############`);
    for (var y = yHallway; y >= 0; y--) {
      var line = "";
      for (var x = -1; x <= 11; x++) {
        const pos: Position = { x, y };
        const posKey = pk(pos);
        if (!allPositionKeys.has(posKey)) {
          line += "#";
          continue;
        }
        if (!this.positionMap.has(posKey)) {
          line += ".";
          continue;
        }
        line += this.positionMap.get(posKey)!.amphipodType;
      }
      console.log(line);
    }
    console.log(`#############`);
  }

  clone(): GameState {
    const c = new GameState();
    c.gm = this.gm; // nothing in here to worry about
    c.moveCount = this.moveCount;
    c.moveInfo = [...this.moveInfo];
    this.positionMap.forEach((val, key) => {
      c.positionMap.set(key, { ...val });
    });
    return c;
  }

  amphipodMove(fromPosition: Position, validPath: Position[]): GameState {
    // this does little validation, it assumes its good
    const positionString = pk(fromPosition);
    const amphipod = this.positionMap.get(positionString)!;
    assert(this.positionMap.delete(positionString));
    const finalPosition = validPath[validPath.length - 1];
    this.positionMap.set(pk(finalPosition), amphipod);
    amphipod.position = finalPosition;
    amphipod.placesMoved++;
    amphipod.score += scoreForType(amphipod.amphipodType) * validPath.length;

    // assume we're in the correct final position if we're in a room (cause we can't move to
    // a room temporarily)
    amphipod.inStartingPosition = false;
    amphipod.inFinalPosition = amphipod.position.y !== yHallway;

    this.moveCount++;
    this.moveInfo.push(
      `moved ${amphipod.amphipodType} ${pk(fromPosition)} -> ${pk(
        finalPosition
      )} - infinal:${amphipod.inFinalPosition}`
    );

    return this;
  }

  get totalScore(): number {
    return Array.from(this.positionMap.values()).reduce(
      (prev: number, cur: Amphipod) => {
        return prev + cur.score;
      },
      0
    );
  }

  get inFinalState(): boolean {
    return Array.from(this.positionMap.values()).reduce(
      (prev: boolean, cur: Amphipod) => {
        return prev && cur.inFinalPosition;
      },
      true
    );
  }

  get minRemainingScore(): number {
    // go through all that are not in their final position, and calculate min distance to get there
    var total = 0;
    this.positionMap.forEach((a, posKey) => {
      if (a.inFinalPosition) return;

      const pos = positionFromString(posKey);

      const colDiff = Math.abs(pos.x - targetPillarForType(a.amphipodType));

      if (a.inStartingPosition) {
        // don't know total height but assume it needs to go up then down once either side
        total += (2 + colDiff) * scoreForType(a.amphipodType);
        return;
      }

      if (colDiff === 0) {
        throw `this shouldn't happen if we're not in starting or target positiong!`;
      }

      // otherwise just one elevation will do
      // TODO part 2 - might be able to make this smarter
      total += (1 + colDiff) * scoreForType(a.amphipodType);
    });

    return total;
  }
}

var fbsCount = 0;
var fbsDisqualified = 0;
function findBestScore(gs: GameState, bestScoreSoFar = -1): number | false {
  // if all pieces are in final position, we're done, report total score back if its better
  if (gs.inFinalState) {
    if (bestScoreSoFar === -1 || gs.totalScore < bestScoreSoFar) {
      return gs.totalScore;
    }
    return false;
  }

  // if we've gone over best score, don't keep digging
  // also can check how much we need to add on
  if (
    bestScoreSoFar !== -1 &&
    gs.totalScore + gs.minRemainingScore >= bestScoreSoFar
  ) {
    fbsDisqualified++;
    return false;
  }

  fbsCount++;
  if (fbsCount % 10000 == 0) {
    console.log(
      `fbs:${fbsCount} dissed:${fbsDisqualified} - moves:${gs.moveCount} curScore:${gs.totalScore} remaining:${gs.minRemainingScore} bestScore: ${bestScoreSoFar}`
    );
    gs.dumpMoves();
    gs.dumpPositions();
  }

  // go through each possible move for each amphipod
  gs.positionMap.forEach((amphipod, positionString) => {
    const currentPosition = positionFromString(positionString);

    if (amphipod.inFinalPosition) return;

    possibleMovesFor(amphipod, gs).forEach((pmv) => {
      const result = findBestScore(
        gs.clone().amphipodMove(currentPosition, pmv),
        bestScoreSoFar
      );
      if (
        result !== false &&
        (bestScoreSoFar === -1 || result < bestScoreSoFar)
      ) {
        console.log(
          `winner! score:${result} < ${bestScoreSoFar} in ${gs.moveCount} moves`
        );
        bestScoreSoFar = result;
      }
    });
  });

  // if we didn't update this, then we didn't make any progress
  return bestScoreSoFar === -1 ? false : bestScoreSoFar;
}

(() => {
  const initialPositions = parseInput(array);

  const gs = new GameState();
  initialPositions.forEach((type, positionString) => {
    const position = positionFromString(positionString);
    const amphipod: Amphipod = {
      amphipodType: type,
      position: position,
      inStartingPosition: true,
      inFinalPosition: false,
      placesMoved: 0,
      score: 0,
    };

    // edge case - we have one that starts in its final position
    // we're not doing if a full pillar is setup yet, just if this is on the bottom rung
    if (
      amphipod.position.x === targetPillarForType(amphipod.amphipodType) &&
      amphipod.position.y === 0
    ) {
      console.log(`one ${amphipod.amphipodType} is in final position`);
      amphipod.inFinalPosition = true;
      amphipod.inStartingPosition = false;
    }

    gs.positionMap.set(positionString, amphipod);
  });

  // gs.dumpPositions();
  // return;

  // for the test we seed with 50000
  const best = findBestScore(gs, 50000);

  console.log(`best score: ${best}`);
})();
