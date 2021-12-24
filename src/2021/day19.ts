import assert from "assert";
import * as fs from "fs";

var array = fs
  .readFileSync("src/2021/day19test.txt")
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

class Vector {
  x: number;
  y: number;
  z: number;

  constructor($x: number, $y: number, $z: number) {
    this.x = $x;
    this.y = $y;
    this.z = $z;
  }

  clone(): Vector {
    return new Vector(this.x, this.y, this.z);
  }

  asString(): string {
    return `${this.x},${this.y},${this.z}`;
  }

  get scalars(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  get scalarsAbs(): [number, number, number] {
    return this.scalars.map((s) => Math.abs(s)) as [number, number, number];
  }

  isEqualTo(v: Vector): boolean {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }

  isAnyAngleEqualTo(v: Vector): boolean {
    return setEquals(new Set(this.scalarsAbs), new Set(v.scalarsAbs));
  }

  sum(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  minus(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  get magnitudeMahatten(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }

  get isZeroVector(): boolean {
    return this.x === 0 && this.y === 0 && this.z === 0;
  }
}

interface Scanner {
  identifier: number;
  beaconLocations: Array<Vector>;
}

function parseInput(a: string[]) {
  var current = new Array<Vector>();
  var currentIdentifier = -1;
  var scanners = new Array<Scanner>();
  a.forEach((line) => {
    if (line.length === 0) return;

    const headerMatches = line.match(/--- scanner (\d+) ---/);
    if (headerMatches != null) {
      // ditch the old
      if (current.length > 0) {
        scanners.push({
          identifier: currentIdentifier,
          beaconLocations: current,
        });
        currentIdentifier = -1;
        current = new Array<Vector>();
      }

      currentIdentifier = parseInt(headerMatches[1]);
    } else {
      const vmatch = line.match(/-?\d+/g)!;
      current.push(
        new Vector(
          parseInt(vmatch[0]),
          parseInt(vmatch[1]),
          parseInt(vmatch[2]!)
        )
      );
    }
  });
  return scanners;
}

function setSubtract<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter((val) => !b.has(val)));
}
function setIntersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter((val) => b.has(val)));
}
function setEquals<T>(a: Set<T>, b: Set<T>): boolean {
  return a.size === b.size && a.size === setIntersect(a, b).size;
}

interface DifferenceInfo {
  beaconLocation: Vector;
  differenceVectors: Array<Vector>;
  magnitudes: Array<number>;
  magnitudesSet: Set<number>;
}

// function getDifferenceVectorsFor(s1: Scanner, s2: Scanner) {
//   var differenceVectors: Array<Vector> = s1.beaconLocations.map(
//     (bl1) => {
//       return bl1.minus(bl2);
//     }
//   );
//   const magnitudes = differenceVectors.map((v) => {
//     return v.magnitude;
//   });
//   const magnitudesSet = new Set(magnitudes);
//   alldiffs.push({
//     beaconLocation: bl1,
//     differenceVectors,
//     magnitudes: magnitudes,
//     magnitudesSet,
//   });
// }

function getAllDifferenceVectors(scanner: Scanner) {
  const alldiffs = new Array<DifferenceInfo>();
  scanner.beaconLocations.forEach((bl1) => {
    var differenceVectors: Array<Vector> = scanner.beaconLocations.map(
      (bl2) => {
        return bl1.minus(bl2);
      }
    );
    const magnitudes = differenceVectors.map((v) => {
      return v.magnitude;
    });
    const magnitudesSet = new Set(magnitudes);
    alldiffs.push({
      beaconLocation: bl1,
      differenceVectors,
      magnitudes: magnitudes,
      magnitudesSet,
    });
  });
  return alldiffs;
}

// returns all 24 (cough - 32!) permutations of the vector
function rotationalPermutationsOf(v: Vector): Array<Vector> {
  const posOrNegXYZOptions = [
    [1, 1, 1],
    [-1, 1, 1],
    [1, -1, 1],
    [1, 1, -1],
    [-1, -1, 1],
    [-1, 1, -1],
    [1, -1, -1],
    [-1, -1, -1],
  ];

  const numPermutes = 4;
  const permute = (x: number, y: number, z: number, ind: number): Vector => {
    if (ind === 0) return new Vector(x, y, z);
    if (ind === 1) return new Vector(y, x, z);
    if (ind === 2) return new Vector(z, y, x);
    if (ind === 3) return new Vector(x, z, y);
    throw `bad permutation ${ind}`;
  };

  // there must be some redundancy in these as there should be 24...  but this will make 32. Oh well
  const result = new Array<Vector>();
  posOrNegXYZOptions.forEach((pon) => {
    for (var pi = 0; pi < 4; pi++) {
      result.push(permute(v.x * pon[0], v.y * pon[1], v.z * pon[2], pi));
    }
  });
  return result;
}

// this is used to transform one coordinate system to another
class Transform {
  private translation: Vector;

  // this is an index into the returned array of #rotationalPermutationsOf
  private rotationalPermutationIndex: number;

  // this is how these things chain on. When you do this one, THEN the next, etc., until all done
  next?: Transform;

  constructor($t: Vector, $rotationalPermutationIndex: number) {
    this.translation = $t.clone();
    this.rotationalPermutationIndex = $rotationalPermutationIndex;
  }

  clone(): Transform {
    const c = new Transform(
      this.translation.clone(),
      this.rotationalPermutationIndex
    );
    c.next = this.next?.clone();
    return c;
  }

  append(t: Transform): Transform {
    const c = this.clone();
    c.next = t.clone();
    return c;
  }

  transform(v: Vector): Vector {
    var t = rotationalPermutationsOf(v)[this.rotationalPermutationIndex];

    // then sum the above from our translation
    t = this.translation.sum(t);

    // and apply child transforms
    if (this.next) {
      return this.next.transform(t);
    } else {
      return t;
    }
  }
}

function identifyTransforms(scanners: Scanner[]): Map<number, Transform> {
  // add the first one to start, the 0th index as its all relative to that
  const transforms = new Map<number, Transform>();
  transforms.set(0, new Transform(new Vector(0, 0, 0), 0));

  // ok algorithm looks like this

  while (transforms.size < scanners.length) {
    // loop over all the scanners that have all their beacons known (we start with just 0)
    transforms.forEach((transform, knownScannerIndex) => {
      // now go through all scanners that do NOT have all their beacons known
      scanners.forEach((scanner, targetScannerIndex) => {
        if (transforms.has(targetScannerIndex)) return;

        // get the difference vectors between the one we're transforming from
        // and our current one
        const dvsKnown = getAllDifferenceVectors(scanners[knownScannerIndex]);
        const dvsTarget = getAllDifferenceVectors(scanners[targetScannerIndex]);

        // we don't need to transform our known yet, we can apply that later

        // we loop over all possibly permutations on the target
        var matches: Array<[number, Vector]> = [];
        dvsKnown.forEach((known, knownDvsIndex) => {
          known.differenceVectors.forEach((knownDv, knownDvIndex) => {
            if (knownDv.isZeroVector) return;

            dvsTarget.forEach((target, targetDvsIndex) => {
              target.differenceVectors.forEach((targetDv, targetDvIndex) => {
                if (targetDv.isZeroVector) return;

                const targetPermumtations = rotationalPermutationsOf(targetDv);
                targetPermumtations.forEach(
                  (possibleMatchVector, permutationIndex) => {
                    if (knownDv.isEqualTo(possibleMatchVector)) {
                      // found one!
                      // lets calculate what the known -> target vector would look like as we'll need it
                      // its basically the s1->b1 + b1->s2.
                      const knownBeaconLocation = known.beaconLocation.clone(); // s1->b1

                      // so run this through this permutation
                      const targetBeaconLocationToKnownCoords =
                        rotationalPermutationsOf(target.beaconLocation)[
                          permutationIndex
                        ];

                      // and subtract it - which is essentially inverting it, and adding it
                      const sourceToTarget = knownBeaconLocation.minus(
                        targetBeaconLocationToKnownCoords
                      );

                      matches.push([permutationIndex, sourceToTarget]);
                    }
                  }
                );
              });
            });
          });
        });

        if (matches.length > 0) {
          console.log(
            `found ${matches.length} between ${knownScannerIndex} and ${targetScannerIndex}`
          );

          // make sure its just one unique transform, map the perm indexes to a set to check this
          const transformIndexSet = new Set(matches.map((info) => info[0]));
          if (transformIndexSet.size != 1) {
            throw `got too many unique transforms`;
          }

          // this transform is actually going to be a combination of the first one, and the one we just applied
          transforms.set(
            targetScannerIndex,
            transforms
              .get(knownScannerIndex)!
              .append(new Transform(matches[0][1], matches[0][0]))
          );
        }
      });
    });
  }

  return transforms;
}

function countBeacons(scanners: Scanner[], transforms: Transform[]): number {
  const beaconLocationStrings = new Set<string>();

  scanners.forEach((s, ind) => {
    const transform = transforms[ind];

    s.beaconLocations.forEach((bl) => {
      const blright = transform.transform(bl);

      beaconLocationStrings.add(blright.asString());
    });
  });

  return beaconLocationStrings.size;
}

function tests() {
  // lets test the transforms
  const t1 = new Transform(new Vector(2, 1, 0), 0);
  const t2 = new Transform(new Vector(1, 0, 1), 0);

  assert(t1.transform(new Vector(0, 0, 0)).isEqualTo(new Vector(2, 1, 0)));
  assert(
    t1.append(t2).transform(new Vector(0, 0, 0)).isEqualTo(new Vector(3, 1, 1))
  );

  // 3 scanners, 3 beacons, all different
}

(() => {
  tests();

  const scanners = parseInput(array);

  console.log(`parsed ${scanners.length} scanners`);

  // distances between various beacons should be absolute
  const maxBeaconsInAScanner = scanners.reduce((prev, cur) => {
    return prev < cur.beaconLocations.length
      ? cur.beaconLocations.length
      : prev;
  }, 0);
  const beaconCount = new Array<number>(maxBeaconsInAScanner + 1).fill(0);
  scanners.forEach((s) => {
    beaconCount[s.beaconLocations.length]++;
  });
  console.log(`scanners with beacon counts: ${beaconCount}`);

  // lets compare the magituntdes of differences between all points in the first 2 to see
  // const dvs1 = getAllDifferenceVectors(scanners[0]);
  // const dvs2 = getAllDifferenceVectors(scanners[1]);

  // compare all those in v1 to see how many are in common with v2
  // var intersections = new Map<number, Array<[number, number]>>();
  // dvs1.forEach((dvs, ind) => {
  //   intersections.set(ind, []);
  //   dvs2.forEach((other, otherind) => {
  //     const intersect = setIntersect(dvs.magnitudesSet, other.magnitudesSet);
  //     intersections.get(ind)?.push([otherind, intersect.size]);

  //     const dvs1vectorSet = new Set(
  //       dvs.differenceVectors.map((v) => v.asString())
  //     );
  //     const dvs2vectorSet = new Set(
  //       other.differenceVectors.map((v) => v.asString())
  //     );
  //     const vectorIntersections = setIntersect(dvs1vectorSet, dvs2vectorSet);

  //     if (intersect.size >= 12) {
  //       console.log(`found ${intersect.size} intersections...`);
  //       dvs.differenceVectors.forEach((v) => {
  //         console.log(`${ind} - ${v.asString()} - mag:${v.magnitude}`);
  //       });
  //       other.differenceVectors.forEach((v) => {
  //         console.log(`${otherind} - ${v.asString()} - mag:${v.magnitude}`);
  //       });

  //       console.log(`vector intersections: ${vectorIntersections.size}`);
  //       vectorIntersections.forEach((vstr) => {
  //         console.log(`${otherind} - ${vstr}`);
  //       });
  //     }
  //   });
  // });

  // console.log(dvs1);
  // console.log(dvs2);
  // console.log(`intersections: `);
  // console.dir(intersections);

  // // lets take a look at 0, and 3
  // console.log("intersection vectors: ");
  // console.dir(dvs1[0].differenceVectors);
  // console.dir(dvs1[3].differenceVectors);

  const transforms = identifyTransforms(scanners);

  console.dir(transforms);
})();
