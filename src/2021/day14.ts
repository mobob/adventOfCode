import * as fs from "fs";

var array = fs.readFileSync("src/2021/day14.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

interface PolymerRule {
  target: string;
  becomes: string;
  left: string;
  right: string;
}

function parseInput(a: Array<string>) {
  const template = a[0].trim();
  const polymerRules = a.slice(2).map((line) => {
    const matches = line.match(/([A-Z]+) -> ([A-Z]+)/);
    const split = matches![1].split("");
    return {
      target: matches![1],
      becomes: matches![2],
      left: split[0] + matches![2],
      right: matches![2] + split[1],
    };
  });

  // and then make a map of the rules
  const polymerRulesMap = new Map<string, PolymerRule>();
  polymerRules.forEach((pr) => {
    polymerRulesMap.set(pr.target, pr);
  });

  return { template, polymerRulesMap };
}

function findCommons(template: string, countMap: Map<String, number>) {
  // count only the first char
  const charCount = new Map<string, number>();
  countMap.forEach((val, [char1, char2]) => {
    charCount.set(char1, val + (charCount.get(char1) ?? 0));
    //charCount.set(char2, val + (charCount.get(char2) ?? 0));
  });

  // and then for the VERY last character in the string, which will always be
  // the same, add on one more
  charCount.set(
    template[template.length - 1],
    charCount.get(template[template.length - 1])! + 1
  );

  const mostCommon = Array.from(charCount.values()).reduce((prev, cur) => {
    return prev === -1 || cur > prev ? cur : prev;
  }, -1);
  const leastCommon = Array.from(charCount.values()).reduce((prev, cur) => {
    return prev === -1 || cur < prev ? cur : prev;
  }, -1);

  return { leastCommon, mostCommon, charCount };
}

((iterations: number) => {
  const { template, polymerRulesMap } = parseInput(array);

  const countMap = new Map<string, number>();
  polymerRulesMap.forEach(({ left, right }) => {
    countMap.set(left, 0);
    countMap.set(right, 0);
  });

  // add initial set to counts manually
  for (var i = 0; i < template.length - 1; i++) {
    const pair = template[i] + template[i + 1];
    countMap.set(pair, (countMap.get(pair) ?? 0) + 1);
  }

  for (var i = 0; i < iterations; i++) {
    const countMapCopy = new Map(countMap);

    countMapCopy.forEach((val, key) => {
      if (val === 0) return;

      // find the given rule, and increment each side of it in the main map
      const rule = polymerRulesMap.get(key)!;
      countMap.set(rule.left, val + countMap.get(rule.left)!);
      countMap.set(rule.right, val + countMap.get(rule.right)!);

      countMap.set(key, countMap.get(key)! - val);
    });

    const { leastCommon, mostCommon, charCount } = findCommons(
      template,
      countMap
    );
  }

  //console.dir(countMap);
  const { leastCommon, mostCommon } = findCommons(template, countMap);
  console.log(mostCommon - leastCommon);
})(40);
