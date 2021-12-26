import assert from "assert";
import * as fs from "fs";

var array = fs.readFileSync("src/2021/day20.txt").toString().trim().split("\n");
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

type ImageType = Map<string, boolean>;
type ImageEnhancementAlgorithmType = Map<number, boolean>;

function minAndMaxForImage(image: ImageType): { min: Vector; max: Vector } {
  const allVectors = Array.from(image.keys()).map((vstr) => {
    return vectorFromString(vstr);
  });
  const min = allVectors.reduce((prev, cur) => {
    return new Vector(
      prev.x < cur.x ? prev.x : cur.x,
      prev.y < cur.y ? prev.y : cur.y,
      prev.z < cur.z ? prev.z : cur.z
    );
  }, new Vector(0, 0, 0));
  const max = allVectors.reduce((prev, cur) => {
    return new Vector(
      prev.x > cur.x ? prev.x : cur.x,
      prev.y > cur.y ? prev.y : cur.y,
      prev.z > cur.z ? prev.z : cur.z
    );
  }, new Vector(0, 0, 0));
  return { min, max };
}

function displayImage(image: ImageType) {
  const { min, max } = minAndMaxForImage(image);
  for (var y = min.y; y <= max.y; y++) {
    var line = "";
    for (var x = min.x; x <= max.x; x++) {
      line += image.get(new Vector(x, y, 0).asString()) ? "#" : ".";
    }
    console.log(line);
  }
}

function countLit(image: ImageType): number {
  const { min, max } = minAndMaxForImage(image);
  return countLitWithMinAndMax(image, min, max);
}

function countLitWithMinAndMax(
  image: ImageType,
  min: Vector,
  max: Vector
): number {
  var count = 0;
  for (var y = min.y; y <= max.y; y++) {
    for (var x = min.x; x <= max.x; x++) {
      const key = new Vector(x, y, 0).asString();
      if (!image.has(key)) {
        throw `bad index`;
      }
      count += image.get(key) === true ? 1 : 0;
    }
  }
  return count;
}

function parseLightOrDark(c: string): boolean {
  var boolval: boolean;
  if (c === "#") {
    boolval = true;
  } else if (c === ".") {
    boolval = false;
  } else {
    throw `bad input`;
  }
  return boolval;
}

function parseInput(a: Array<String>) {
  // first line, lets just make a map of light==true, dark==false
  const imageEnhancementAlg = new Map<number, boolean>();
  [...a[0]].forEach((elem, ind) => {
    imageEnhancementAlg.set(ind, parseLightOrDark(elem));
  });

  // now parse the image
  // we'll index our map by string positions so that we can expand any which way
  // (possibly in to 3d for day 2.... ;))
  const imagePixels = new Map<string, boolean>();
  const imageLines = a.slice(2);
  imageLines.forEach((line, ind) => {
    [...line].forEach((char, lineind) => {
      imagePixels.set(
        new Vector(lineind, ind, 0).asString(),
        parseLightOrDark(char)
      );
    });
  });

  return { imageEnhancementAlg, imagePixels };
}

function snapshotSurroundingArea(
  location: Vector,
  image: ImageType,
  radius: number = 3,
  defaultUnknownValue: boolean = false
): string {
  // add them all in to an array
  var bitarray = "";
  const bounds = (radius - 1) / 2; // (not thinking about this, just 3 -1 / 2, is -1...1 on either side)
  for (var y = -bounds; y <= bounds; y++) {
    for (var x = -bounds; x <= bounds; x++) {
      const key = new Vector(location.x + x, location.y + y, 0).asString();
      if (image.has(key)) {
        bitarray += image.get(key) ? "1" : "0";
      } else {
        bitarray += defaultUnknownValue ? "1" : "0";
      }
    }
  }
  return bitarray;
}

function lookupEnhancement(
  bitarray: string,
  imageEnhancementAlg: ImageEnhancementAlgorithmType
): boolean {
  // then convert to decimal
  const decimal = parseInt(bitarray, 2);

  // and then lookup
  if (decimal === NaN || decimal < 0 || decimal >= imageEnhancementAlg.size) {
    throw `decimal out of bounds`;
  }

  return imageEnhancementAlg.get(decimal)!;
}

function enhanceSnapshotSurroundingArea(
  location: Vector,
  image: ImageType,
  imageEnhancementAlg: ImageEnhancementAlgorithmType,
  defaultUnknownValue: boolean,
  radius: number = 3
): boolean {
  const bitarray = snapshotSurroundingArea(
    location,
    image,
    radius,
    defaultUnknownValue
  );
  return lookupEnhancement(bitarray, imageEnhancementAlg);
}

function enhance(
  image: ImageType,
  imageEnhancementAlg: ImageEnhancementAlgorithmType,
  overshoot: number = 1,
  defaultUnknownValue: boolean = false
): ImageType {
  // go through each one, one outside of the bounds of what we have currently
  const enhancedImage = new Map<string, boolean>();
  const { min, max } = minAndMaxForImage(image);
  for (var y = min.y - overshoot; y <= max.y + overshoot; y++) {
    var line = "";
    for (var x = min.x - overshoot; x <= max.x + overshoot; x++) {
      const location = new Vector(x, y, 0);
      const enhanced = enhanceSnapshotSurroundingArea(
        location,
        image,
        imageEnhancementAlg,
        defaultUnknownValue
      );
      enhancedImage.set(location.asString(), enhanced);
    }
  }

  return enhancedImage;
}

function trim(
  image: ImageType,
  originalminmax: { min: Vector; max: Vector },
  iterations: number
) {
  const minmax = minAndMaxForImage(image);
  for (var y = minmax.min.y; y <= minmax.max.y; y++) {
    for (var x = minmax.min.x; x <= minmax.max.x; x++) {
      // if (x < -4 || x > 103 || y < -4 || y > 103) {
      //   e2.delete(new Vector(x, y, 0).asString());
      // }
      if (
        x < originalminmax.min.x - iterations ||
        x > originalminmax.max.x + iterations ||
        y < originalminmax.min.y - iterations ||
        y > originalminmax.max.y + iterations
      ) {
        image.delete(new Vector(x, y, 0).asString());
      }
    }
  }
}

(() => {
  const { imageEnhancementAlg, imagePixels } = parseInput(array);
  const originalminmax = minAndMaxForImage(imagePixels);

  const e1 = enhance(imagePixels, imageEnhancementAlg, 3);
  const e2 = enhance(e1, imageEnhancementAlg, 3);

  // do some trimming - i don't love this, but there is crud around the outside, and any
  // value that i overshoot doesn't seem to help.
  // this trimming is for overshoot = 5
  trim(e2, originalminmax, 2);

  displayImage(e2);
  console.log(countLit(e2));

  //return;

  // part 2 - 50 times!
  // we flip the default unknown value for this one, as it starts with dark so every 2nd
  // iteration it flips
  var cur = imagePixels;
  for (var i = 0; i < 50; i++) {
    cur = enhance(cur, imageEnhancementAlg, 3, i % 2 === 1);
    trim(cur, originalminmax, i + 3);
  }

  //trim(cur, originalminmax, 50);

  displayImage(cur);
  console.log(countLit(cur));
})();
