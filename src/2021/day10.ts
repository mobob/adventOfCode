import * as fs from "fs";

var array = fs.readFileSync("src/2021/day10.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

const scoreMap = { ")": 3, "]": 57, "}": 1197, ">": 25137 };
const bracketPairs = [
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
  ["<", ">"],
];

/**
{([(<{}[<>[]}>{[]{[(<()> - Expected ], but found } instead.
[[<[([]))<([[{}[[()]]] - Expected ], but found ) instead.
[{[{({}]{}}([{[{{{}}([] - Expected ), but found ] instead.
[<(<(<(<{}))><([]([]() - Expected >, but found ) instead.
<{([([[(<>()){}]>(<<{{ - Expected ], but found > instead. 
*/

function removeEmptyBracketPairs(line: string): string | null {
  var result: string | null = null;
  bracketPairs.forEach((brackets) => {
    if (result != null) {
      return;
    }
    let [left, right] = brackets;
    const pair = left + right;
    if (line.indexOf(pair) >= 0) {
      result = line.replace(pair, "");
    }
  });
  return result;
}

function removeUntilCannot(line: string): string {
  var reducedLine: string = line;
  while (true) {
    const next = removeEmptyBracketPairs(reducedLine);
    if (next == null) {
      return reducedLine;
    }
    reducedLine = next;
  }
}

// part 1!
(() => {
  var score = 0;
  array.forEach((line) => {
    const result = removeUntilCannot(line);

    // look for the first end bracket, if we have one, we bump the score
    var found: string | null = null;
    for (let char of result) {
      for (let pair of bracketPairs) {
        if (char === pair[1]) {
          found = char;
          break;
        }
      }
      if (found != null) {
        break;
      }
    }

    if (found != null) {
      const prop = `${found}`;
      score += (scoreMap as any)[prop];
    }
  });

  console.log(score);
})();

// part 2

const compScores = {
  ")": 1,
  "]": 2,
  "}": 3,
  ">": 4,
};

(() => {
  var scores = new Array<number>();
  array.forEach((line) => {
    const result = removeUntilCannot(line);

    // look for the first end bracket, if we have one, we bump the score
    var found: string | null = null;
    for (let char of result) {
      for (let pair of bracketPairs) {
        if (char === pair[1]) {
          found = char;
          break;
        }
      }
      if (found != null) {
        break;
      }
    }

    if (found != null) {
      return;
    }

    // ok this is a continuing one
    /**
[({(<(())[]>[[{[]{<()<>> - Complete by adding }}]])})].
[(()[<>])]({[<{<<[]>>( - Complete by adding )}>]}).
(((({<>}<{<{<>}{[]{[]{} - Complete by adding }}>}>)))).
{<[[]]>}<{[{[{[]{()[[[] - Complete by adding ]]}}]}]}>.
<{([{{}}[<[[[<>{}]]]>[]] - Complete by adding ])}> */

    // reverse the string
    const reversed = [...result].reverse().join("");
    // and then map each to their back counterpart
    const completionString = [...reversed]
      .map((char) => {
        return bracketPairs
          .map((pair) => {
            if (char === pair[0]) {
              return pair[1];
            }
          })
          .join("");
      })
      .join("");

    var runningScore = 0;
    for (let char of completionString) {
      runningScore *= 5;
      runningScore += (compScores as any)[char];
    }
    scores.push(runningScore);
  });

  // now sort the running scores, and get the middle item
  scores.sort((a, b) => {
    return a - b;
  });

  var half = Math.floor(scores.length / 2);
  const median = scores[half]; // should be perfect assuming the len is odd, which is stated

  console.log(median);
})();
