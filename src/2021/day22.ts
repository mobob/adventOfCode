import * as fs from "fs";

var array = fs
  .readFileSync("src/2021/day22test.txt")
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

class Cuboid {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  z1: number;
  z2: number;
  constructor(
    $x1: number,
    $x2: number,
    $y1: number,
    $y2: number,
    $z1: number,
    $z2: number
  ) {
    this.x1 = $x1;
    this.x2 = $x2;
    this.y1 = $y1;
    this.y2 = $y2;
    this.z1 = $z1;
    this.z2 = $z2;
  }

  get volume(): number {
    // we add one on - cause even a point is volume of 1 for these
    return (
      (this.x2 - this.x1 + 1) *
      (this.y2 - this.y1 + 1) *
      (this.z2 - this.z1 + 1)
    );
  }
}

type CubeWithHole = {
  lit: boolean;
  base: Cuboid;
  holes: Cuboid[];
};

class CuboidWithHoles extends Cuboid {
  exclusiveHoles: CuboidWithHoles[] = [];
  lit: boolean;

  constructor($base: Cuboid, $lit: boolean) {
    super($base.x1, $base.x2, $base.y1, $base.y2, $base.z1, $base.z2);
    this.lit = $lit;
  }

  populateHoles(possibleHoles: CuboidWithHoles[]) {
    possibleHoles.forEach((other, phindex) => {
      // if there is no intersection, we can skip it
      const intersection = intersect(this, other);
      if (intersection === false) {
        return;
      }

      // lets make this in to an new hole based on the intersection
      const hole = new CuboidWithHoles(intersection, other.lit);

      // const hole: CubeWithHole = {
      //   lit: ph.lit,
      //   base: intersection,
      //   holes: [],
      // };

      // calculate it's volume, and turn off or on that many depending
      const holeVolume = calculateVolumeOf(hole, lit, possibleHoles.slice(1));

      console.log(
        `calculated holeVolume: ${holeVolume} and its lit: ${ph.lit}`
      );

      currentVolumeOfTargetLitness -= holeVolume;
    });
  }

  litVolumeExclusive(possibleHoles: CuboidWithHoles[]): number {
    // if we already have our holes initialized
    var vol = this.volume;

    return vol;
  }
}

function intersect(a: Cuboid, b: Cuboid): Cuboid | false {
  const x1 = Math.max(a.x1, b.x1);
  const x2 = Math.min(a.x2, b.x2);
  const y1 = Math.max(a.y1, b.y1);
  const y2 = Math.min(a.y2, b.y2);
  const z1 = Math.max(a.z1, b.z1);
  const z2 = Math.min(a.z2, b.z2);
  if (x1 > x2 || y1 > y2 || z1 > z2) {
    return false;
  }

  return new Cuboid(x1, x2, y1, y2, z1, z2);
}

function calculateVolumeOf(
  cwh: CubeWithHole,
  lit: boolean,
  possibleHoles: CubeWithHole[]
): number {
  var currentVolumeOfTargetLitness = cwh.base.volume;

  possibleHoles.forEach((ph, phindex) => {
    // if there is no intersection, we can skip it
    const intersection = intersect(cwh.base, ph.base);
    if (intersection === false) {
      return;
    }

    // lets make this in to a hole
    const hole: CubeWithHole = {
      lit: ph.lit,
      base: intersection,
      holes: [],
    };

    // calculate it's volume, and turn off or on that many depending
    const holeVolume = calculateVolumeOf(hole, lit, possibleHoles.slice(1));

    console.log(`calculated holeVolume: ${holeVolume} and its lit: ${ph.lit}`);

    currentVolumeOfTargetLitness -= holeVolume;
  });

  // TODO - none of this really works yet...  i don't think i'm thinking about it right
  // or dealing with the lit vs not correctly
  // if an intersection is on and we're on, should we do anything? it eventually will have
  // a hole in it which could affect it, so that NEEDS to be calculated.
  // but also when i get to that eventual hole, i don't want to double count it?
  // so how do i avoid that...  somehow i need to compare / recompare

  if (
    currentVolumeOfTargetLitness < 0 ||
    currentVolumeOfTargetLitness > cwh.base.volume
  ) {
    throw `bad value: ${currentVolumeOfTargetLitness} > ${cwh.base.volume}`;
  }

  return lit === cwh.lit ? currentVolumeOfTargetLitness : 0;
}

interface Instruction {
  flipOn: boolean;
  cuboid: Cuboid;
}

function parseInput(a: string[]): Instruction[] {
  return a.map((line) => {
    var on: boolean;
    if (line.startsWith("on")) {
      on = true;
    } else if (line.startsWith("off")) {
      on = false;
    } else {
      throw `bad parsing`;
    }
    const numbers = line.match(/-?\d+/g)?.map((val) => parseInt(val))!;
    const c = new Cuboid(
      numbers[0],
      numbers[1],
      numbers[2],
      numbers[3],
      numbers[4],
      numbers[5]
    );
    return { flipOn: on, cuboid: c };
  });
}

(() => {
  const instructions = parseInput(array);

  // lets add up the volume of each one, not accounting for overlap
  var totalVolume = instructions.reduce((prev, { cuboid }) => {
    return prev + cuboid.volume;
  }, 0);
  console.log(`total volume: ${totalVolume}`);

  // don't like the instructions, lets make them all cubes with holes, uninitialized
  const allcwhs: CubeWithHole[] = instructions.map((i) => {
    return {
      lit: i.flipOn,
      base: i.cuboid,
      holes: [],
    };
  });

  // ok lets iterate over each one
  var totalOn = 0;
  allcwhs.forEach((cwh, index) => {
    // process the current one with those that remain
    const remaining = allcwhs.slice(index + 1);

    totalOn += calculateVolumeOf(cwh, true, remaining);
  });

  console.log(`total on: ${totalOn}`);
})();
