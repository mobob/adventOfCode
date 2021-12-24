import assert from "assert";
import * as fs from "fs";

var array = fs.readFileSync("src/2021/day19.txt").toString().trim().split("\n");
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

function vectorFromString(vstr: string): Vector {
  const matches = vstr.match(/-?\d+/g);
  return new Vector(
    parseInt(matches![0]),
    parseInt(matches![1]),
    parseInt(matches![2])
  );
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

  // push one more!
  scanners.push({
    identifier: currentIdentifier,
    beaconLocations: current,
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

// returns all 24 (cough - 32! - cough even more!!) permutations of the vector
// definitely some duplication here, but it works.
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

  const numPermutes = 6;
  const permute = (x: number, y: number, z: number, ind: number): Vector => {
    if (ind === 0) return new Vector(x, y, z);
    if (ind === 1) return new Vector(x, z, y);
    if (ind === 2) return new Vector(y, x, z);
    if (ind === 3) return new Vector(y, z, x);
    if (ind === 4) return new Vector(z, x, y);
    if (ind === 5) return new Vector(z, y, x);
    throw `bad permutation ${ind}`;
  };

  // there must be some redundancy in these as there should be 24...  but this will make 32. Oh well
  const result = new Array<Vector>();
  posOrNegXYZOptions.forEach((pon) => {
    for (var pi = 0; pi < numPermutes; pi++) {
      result.push(permute(v.x * pon[0], v.y * pon[1], v.z * pon[2], pi));
    }
  });
  return result;
}

// this is used to transform one coordinate system to another
class Transform {
  translation: Vector;

  // this is an index into the returned array of #rotationalPermutationsOf
  rotationalPermutationIndex: number;

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
        dvsKnown.forEach((known, knownEndOfDvIndex) => {
          known.differenceVectors.forEach((knownDv, knownStartOfDevIndex) => {
            if (knownDv.isZeroVector) return;

            // this is a bit weird - but to avoid having to append transforms together, we transform
            // this now based on what it is, so it becomes absolute

            // pulling this out - i think the chaining isn't working right as when i go to compare 1 and 4,
            // they're not finding any matches
            knownDv =
              rotationalPermutationsOf(knownDv)[
                transform.rotationalPermutationIndex
              ];

            dvsTarget.forEach((target, targetEndOfDvIndex) => {
              target.differenceVectors.forEach(
                (targetDv, targetStartOfDvIndex) => {
                  if (targetDv.isZeroVector) return;

                  const targetPermumtations =
                    rotationalPermutationsOf(targetDv);
                  targetPermumtations.forEach(
                    (possibleMatchVector, permutationIndex) => {
                      if (knownDv.isEqualTo(possibleMatchVector)) {
                        // found one!
                        // lets calculate what the origin -> target vector would look like as we'll need it
                        // its basically the s1->b1 + b1->s2.
                        const absoluteKnownBeaconLocation = transform.transform(
                          known.beaconLocation.clone()
                        ); // origin->b1

                        // so run this through this permutation
                        const targetBeaconLocationToKnownCoords =
                          rotationalPermutationsOf(target.beaconLocation)[
                            permutationIndex
                          ];

                        // and subtract it - which is essentially inverting it, and adding it
                        const originToTarget =
                          absoluteKnownBeaconLocation.minus(
                            targetBeaconLocationToKnownCoords
                          );

                        matches.push([permutationIndex, originToTarget]);
                      }
                    }
                  );
                }
              );
            });
          });
        });

        if (matches.length > 0) {
          console.log(
            `found ${matches.length} between ${knownScannerIndex} and ${targetScannerIndex}`
          );
          console.dir(matches);

          // i don't _really_ understand this, but it seems one set maps amazingly,
          // and then another doesnt

          // build a map of perm number to unique vectors
          const map = new Map<number, Set<string>>();
          const permCount = new Map<number, number>();
          matches.forEach(([perm, vec]) => {
            map.set(
              perm,
              (map.get(perm) ?? new Set<string>()).add(vec.asString())
            );
            permCount.set(perm, (permCount.get(perm) ?? 0) + 1);
          });

          // and then only pick any of those that have at least 3 matches ?
          permCount.forEach((count, perm) => {
            if (count <= 2) {
              map.delete(perm);
            }
          });

          console.dir(map);
          console.dir(permCount);

          // reduce it down to only ones that only have one unique vector
          const uniqueMap = new Map<number, Vector>();
          const uniquePermValues = map.forEach((val, key) => {
            if (val.size === 1) {
              uniqueMap.set(key, vectorFromString(Array.from(val)[0]));
            }
          });

          if (uniqueMap.size !== 1) {
            throw `didn't nail it, perms of size 1: ${uniqueMap.size}`;
          }

          const perm = Array.from(uniqueMap.keys())[0];
          const translation = uniqueMap.get(perm)!;

          // this transform is actually going to be a combination of the first one, and the one we just applied
          transforms.set(targetScannerIndex, new Transform(translation, perm));
        }
      });
    });
  }

  return transforms;
}

function countBeacons(
  scanners: Scanner[],
  transforms: Map<number, Transform>
): number {
  const beaconLocationStrings = new Set<string>();

  scanners.forEach((s, ind) => {
    const transform = transforms.get(ind)!;

    s.beaconLocations.forEach((bl) => {
      const blright = transform.transform(bl);

      beaconLocationStrings.add(blright.asString());
    });
  });

  console.dir(Array.from(beaconLocationStrings).sort());

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

  // first lets list all transfroms so we know what they are
  const v = new Vector(2, 1, 0);
  rotationalPermutationsOf(v).forEach((v1, ind) =>
    console.log(`perm:${ind} - ${v1.asString()}`)
  );

  // scanner2: so lets do the one that flips over 180:
  const scanner2actual = new Vector(2, -2, 0);
  const scanner2permIndex180 = 24;

  // and just 90 degrees
  const scanner3actual = new Vector(1, -4, 0);
  const scanner3permIndex90 = 14;

  const beacon1actual = new Vector(0, -2, 0);
  const beacon2actual = new Vector(4, -5, 0);

  // ok, lets do beacon1 from scanner 2
  const scanner2beacon1given = new Vector(2, 0, 0);
  const scanner2transform = new Transform(scanner2actual, scanner2permIndex180);
  assert(
    beacon1actual.isEqualTo(scanner2transform.transform(scanner2beacon1given))
  );
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

  const transforms = identifyTransforms(scanners);

  console.dir(transforms);

  const count = countBeacons(scanners, transforms);
  console.log(`beacon count: ${count}`);

  // part 2 - largest manhattan distance between any two translation vectors
  var maxManDistance = 0;
  transforms.forEach((t1, scannerIndex) => {
    transforms.forEach((t2, scannerIndex) => {
      const diff = t1.translation.minus(t2.translation);
      const manDist = diff.magnitudeMahatten;
      if (manDist > maxManDistance) {
        maxManDistance = manDist;
      }
    });
  });
  console.log(`max man distance: ${maxManDistance}`);
})();
