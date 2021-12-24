import assert from "assert";
import * as fs from "fs";

var array = fs.readFileSync("src/2021/day18.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

type SnailfishNumberNode = SnailfishNumber | number;

class SnailfishNumber {
  parent?: SnailfishNumber;

  left: SnailfishNumberNode;
  right: SnailfishNumberNode;
  constructor($left: SnailfishNumberNode, $right: SnailfishNumberNode) {
    this.left = $left;
    this.right = $right;

    // assign the parents
    if (this.left instanceof SnailfishNumber) {
      this.left.parent = this;
    }
    if (this.right instanceof SnailfishNumber) {
      this.right.parent = this;
    }
  }

  asString(): string {
    const l =
      typeof this.left === "number" ? `${this.left}` : this.left.asString();
    const r =
      typeof this.right === "number" ? `${this.right}` : this.right.asString();
    return `[${l},${r}]`;
  }

  // returns true if we do any explosion
  reduceExplode(): boolean {
    // look for the left most pair that is 4 deep
    const needsToExplode = findNestedNumberOfDepth(this, 4);
    if (needsToExplode === null) {
      return false;
    }

    //console.log(`need to explode ${needsToExplode.asString()}`);

    // increment to the left and right
    const toTheLeft = findRegularAncestor(needsToExplode, true);
    if (toTheLeft.leftSide && toTheLeft.result != null) {
      (toTheLeft.result.left as number) += needsToExplode.left as number;
    } else if (!toTheLeft.leftSide && toTheLeft.result != null) {
      (toTheLeft.result.right as number) += needsToExplode.left as number;
    }

    const toTheRight = findRegularAncestor(needsToExplode, false);
    if (toTheRight.leftSide && toTheRight.result != null) {
      (toTheRight.result.left as number) += needsToExplode.right as number;
    } else if (!toTheRight.leftSide && toTheRight.result != null) {
      (toTheRight.result.right as number) += needsToExplode.right as number;
    }

    // now replace us with a 0 up above, and kill our parent link so we get deallocated
    if (needsToExplode.parent?.left === needsToExplode) {
      needsToExplode.parent!.left = 0;
    } else {
      needsToExplode.parent!.right = 0;
    }
    needsToExplode.parent = undefined;

    return true;
  }

  // returns true if we do any split
  reduceSplit(): boolean {
    // do both sides, but exit as soon as we find one
    if (typeof this.left === "number") {
      if (this.left >= 10) {
        const newLeftVal = Math.floor(this.left / 2);
        const newRightVal = Math.ceil(this.left / 2);
        this.left = new SnailfishNumber(newLeftVal, newRightVal);
        this.left.parent = this;
        return true;
      }
    } else {
      if (this.left.reduceSplit()) {
        return true;
      }
    }
    if (typeof this.right === "number") {
      if (this.right >= 10) {
        const newLeftVal = Math.floor(this.right / 2);
        const newRightVal = Math.ceil(this.right / 2);
        this.right = new SnailfishNumber(newLeftVal, newRightVal);
        this.right.parent = this;
        return true;
      }
    } else {
      if (this.right.reduceSplit()) {
        return true;
      }
    }

    return false;
  }

  reduce() {
    //If any pair is nested inside four pairs, the leftmost such pair explodes.
    //If any regular number is 10 or greater, the leftmost such regular number splits.
    //console.log(`about to reduce: ${this.asString()}`);
    while (true) {
      if (this.reduceExplode()) {
        //console.log(`exploded to: ${this.asString()}`);
        continue;
      }
      if (this.reduceSplit()) {
        //console.log(`split to: ${this.asString()}`);
        continue;
      }
      break;
    }
  }

  get depth(): number {
    return this.parent ? 1 + this.parent.depth : 0;
  }

  get magnitude(): number {
    return 3 * magnitudeOfNode(this.left) + 2 * magnitudeOfNode(this.right);
  }

  clone(): SnailfishNumber {
    return parseNumber(this.asString()).node;
  }
}

/// UTILS

function magnitudeOfNode(node: SnailfishNumberNode): number {
  if (typeof node === "number") {
    return node;
  }
  return node.magnitude;
}

function sum(a: SnailfishNumber, b: SnailfishNumber): SnailfishNumber {
  const s = new SnailfishNumber(a.clone(), b.clone());
  s.reduce();
  return s;
}

function findNestedNumberOfDepth(
  sfn: SnailfishNumber,
  depth: number
): SnailfishNumber | null {
  if (depth === 0) {
    return sfn;
  }

  if (!(typeof sfn.left === "number")) {
    const found = findNestedNumberOfDepth(sfn.left, depth - 1);
    if (found != null) {
      return found;
    }
  }
  if (!(typeof sfn.right === "number")) {
    const found = findNestedNumberOfDepth(sfn.right, depth - 1);
    if (found != null) {
      return found;
    }
  }

  return null;
}

function findRegularAncestor(
  sfn: SnailfishNumber,
  lookLeft: boolean
): {
  result: SnailfishNumber | null;
  leftSide: boolean;
} {
  // work our way up until the LEFT side is not a parent of us
  var parent = sfn.parent;
  var us = sfn;
  while (parent && (lookLeft ? parent.left : parent.right) == us) {
    us = parent;
    parent = us.parent;
  }

  // if we got to the top and there is none, well then there is none!
  if (!parent) {
    return { result: null, leftSide: lookLeft };
  }

  // if its a scalar, then we're done
  // TODO echeck the bool ehre???
  if (typeof (lookLeft ? parent.left : parent.right) === "number") {
    return { result: parent, leftSide: lookLeft };
  }

  // now work our way down
  var drillingNode = (lookLeft ? parent.left : parent.right) as SnailfishNumber;
  var drillingDirection = lookLeft;

  // we're looking in the opposite direction of our initial search
  while (
    (drillingDirection ? drillingNode.right : drillingNode.left) instanceof
    SnailfishNumber
  ) {
    drillingNode = (
      drillingDirection ? drillingNode.right : drillingNode.left
    ) as SnailfishNumber;
  }

  return { result: drillingNode, leftSide: !drillingDirection };
}

function parseLeftOrRightNode(line: string): {
  node: SnailfishNumberNode;
  consumed: number;
} {
  //console.log(`parseLeftOrRightNode: ${line}`);

  // if first character is a number, then we good
  const intVal = parseInt(line[0]);
  if (intVal >= 0) {
    return { node: intVal, consumed: 1 };
  }

  // if we're beginning, then parse one of them with the remainder
  // if the first char is opening, then parse a node
  if (line[0] === "[") {
    // don't consume here, let the number parser do that
    const { node, consumed } = parseNumber(line);
    return { node, consumed: consumed };
  }

  throw `unexpected first char: ${line}, intVal: ${intVal}`;
}

function parseNumber(line: string): {
  node: SnailfishNumber;
  consumed: number;
} {
  //console.log(`parseNumber: ${line}`);

  var cur: SnailfishNumber | null = null;
  var depth = 0;

  // if the first char is opening, then parse a node
  if (line[0] === "[") {
    var consumed = 0;

    line = line.slice(1);
    consumed++;

    const { node: left, consumed: consumedLeft } = parseLeftOrRightNode(line);
    line = line.slice(consumedLeft);
    consumed += consumedLeft;

    // next should be a comma
    assert(line[0] === ",");
    line = line.slice(1);
    consumed++;

    const { node: right, consumed: consumedRight } = parseLeftOrRightNode(line);
    line = line.slice(consumedRight);
    consumed += consumedRight;

    // next should be end brace
    assert(line[0] === "]");
    line = line.slice(1);
    consumed++;

    return { node: new SnailfishNumber(left, right), consumed };
  }

  throw `should have started with bracket: ${line}`;
}

function parseInput(a: Array<string>): Array<SnailfishNumber> {
  const sfns = new Array<SnailfishNumber>();

  a.forEach((line) => {
    sfns.push(parseNumber(line).node);
  });

  return sfns;
}
function tests() {
  const explodeTestPairs = [
    ["[[[[[9,8],1],2],3],4]", "[[[[0,9],2],3],4]"],
    ["[7,[6,[5,[4,[3,2]]]]]", "[7,[6,[5,[7,0]]]]"],
    ["[[6,[5,[4,[3,2]]]],1]", "[[6,[5,[7,0]]],3]"],
    [
      "[[3,[2,[1,[7,3]]]],[6,[5,[4,[3,2]]]]]",
      "[[3,[2,[8,0]]],[9,[5,[4,[3,2]]]]]",
    ],
    [
      "[[3,[2,[1,[7,3]]]],[[2,1],[6,[5,[4,[3,2]]]]]]",
      "[[3,[2,[8,0]]],[[5,1],[6,[5,[4,[3,2]]]]]]",
    ],
    ["[[3,[2,[8,0]]],[9,[5,[4,[3,2]]]]]", "[[3,[2,[8,0]]],[9,[5,[7,0]]]]"],
  ];

  explodeTestPairs.forEach(([pre, post]) => {
    const explodeTest = parseNumber(pre);
    // explodeTest.node.reduceExplode();
    // console.log(explodeTest.node.asString());
    assert(explodeTest.node.reduceExplode() === true);
    assert(post === explodeTest.node.asString());
    //console.log(`exploded: ${explodeTest.node.asString()}`);
  });

  const sums = [
    [
      "[[[[4,3],4],4],[7,[[8,4],9]]]",
      "[1,1]",
      "[[[[0,7],4],[[7,8],[6,0]]],[8,1]]",
    ],
    [
      "[[[[4,0],[5,4]],[[7,7],[6,0]]],[[8,[7,7]],[[7,9],[5,0]]]]",
      "[[2,[[0,8],[3,4]]],[[[6,7],1],[7,[1,6]]]]",
      "[[[[6,7],[6,7]],[[7,7],[0,7]]],[[[8,7],[7,7]],[[8,8],[8,0]]]]",
    ],
  ];
  sums.forEach(([astr, bstr, post]) => {
    const a = parseNumber(astr);
    const b = parseNumber(bstr);
    const result = sum(a.node, b.node);
    assert(post === result.asString());
  });

  const magtests = [
    ["[[1,2],[[3,4],5]]", 143],
    ["[[[[0,7],4],[[7,8],[6,0]]],[8,1]]", 1384],
    ["[[[[1,1],[2,2]],[3,3]],[4,4]]", 445],
    ["[[[[3,0],[5,3]],[4,4]],[5,5]]", 791],
    ["[[[[5,0],[7,4]],[5,5]],[6,6]]", 1137],
    ["[[[[8,7],[7,7]],[[8,6],[7,7]]],[[[0,7],[6,6]],[8,7]]]", 3488],
  ];
  magtests.forEach(([str, result]) => {
    const num = parseNumber(str as string);
    assert(result === num.node.magnitude);
  });

  console.log(`tests pass!`);
}

(() => {
  tests();

  const snfs = parseInput(array);

  var ongoingSum = snfs[0];
  for (var i = 1; i < snfs.length; i++) {
    console.log(`ongoing: ${ongoingSum.asString()}`);
    ongoingSum = sum(ongoingSum, snfs[i]);
  }

  console.log(`final: ${ongoingSum.asString()}`);
  console.log(`final mag: ${ongoingSum.magnitude}`);

  // part 2 - all sum mags
  var maxSum = 0;
  for (var i = 0; i < snfs.length; i++) {
    for (var j = 0; j < snfs.length; j++) {
      const curSum = sum(snfs[i], snfs[j]).magnitude;
      if (curSum > maxSum) {
        maxSum = curSum;
      }
    }
  }
  console.log(`max sum: ${maxSum}`);
})();
