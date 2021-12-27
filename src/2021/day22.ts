import * as fs from "fs";

var array = fs.readFileSync("src/2021/day22.txt").toString().trim().split("\n");
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

      // and apply the holes from this one in it
      hole.populateHoles(other.exclusiveHoles);

      // now we're good add this to our set
      this.exclusiveHoles.push(hole);
    });
  }

  volumeExclusive(): number {
    var ongoingVolume = this.volume;
    this.exclusiveHoles.forEach((other, phindex) => {
      const holeVolumeExclusive = other.volumeExclusive();
      ongoingVolume -= holeVolumeExclusive;
    });
    return ongoingVolume;
  }

  litVolumeExclusive(): number {
    // if it's not lit, it cannot have exclusive lit volume
    if (!this.lit) return 0;
    var ongoingVolume = this.volume;
    this.exclusiveHoles.forEach((other, phindex) => {
      // otherwise always remove all volume from the holes
      const holeVolume = other.volumeExclusive();
      ongoingVolume -= holeVolume;
    });
    return ongoingVolume;
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
interface Instruction {
  flipOn: boolean;
  cuboid: Cuboid;
}

function parseInput(a: string[]): Instruction[] {
  var instructions: Instruction[] = [];
  a.forEach((line) => {
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
    instructions.push({ flipOn: on, cuboid: c });
  });
  return instructions;
}

(() => {
  var instructions = parseInput(array);

  const part1 = false;
  if (part1) {
    instructions = instructions.filter(
      ({ cuboid }) =>
        cuboid.x1 >= -50 &&
        cuboid.x2 <= 50 &&
        cuboid.y1 >= -50 &&
        cuboid.y2 <= 50 &&
        cuboid.z1 >= -50 &&
        cuboid.z2 <= 50
    );
  }

  // lets add up the volume of each one, not accounting for overlap
  var totalVolume = instructions.reduce((prev, { cuboid }) => {
    return prev + cuboid.volume;
  }, 0);
  console.log(`total volume: ${totalVolume}`);

  // build up our holey cubes backwards to front
  const holeyCubes: CuboidWithHoles[] = [];
  instructions.reverse().forEach((i) => {
    const cwh = new CuboidWithHoles(i.cuboid, i.flipOn);

    cwh.populateHoles(holeyCubes);

    holeyCubes.push(cwh);
  });

  // then go through just the lit cubes, asking for their exclusive volume
  // i could reverse this back but i don't think its necessary :thinkingface:
  var totalOn = 0;
  holeyCubes
    .filter((cwh) => cwh.lit)
    .forEach((cwh, ind) => {
      console.log(`holeycube ${ind} - vol: ${cwh.litVolumeExclusive()}`);
      totalOn += cwh.litVolumeExclusive();
    });

  console.log(`total on: ${totalOn}`);
})();
