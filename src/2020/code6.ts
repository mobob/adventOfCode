var fs = require("fs");
var array = fs.readFileSync("input6.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);

function processCur(cur: Set<string>) {
  // sanity
  var str = "";
  Array.from(cur)
    .sort()
    .forEach((val, val2, set) => {
      str += val;
    });
  //console.log(Array.from(cur).sort());

  if (str.match(/([^a-z])$/) != null) {
    throw `bad stuff! -- ${str} --`;
  }

  //console.log(cur);
}

function q1() {
  var items = new Array();

  let cur = new Set<string>();

  var sum = 0;
  for (var line of array) {
    //console.log(line);
    if (line.trim() === "") {
      processCur(cur);
      sum += cur.size;
      cur = new Set();
      continue;
    }

    // just loop over it, adding each line in
    for (let char of line.trim()) {
      cur.add(char);
    }
  }
  processCur(cur);
  sum += cur.size;
  cur = new Set();

  console.log(sum);
}
q1();


// oh farts - now everyone!
type CountMap = Map<string, number>; 
//{
//   [key: string]: number;
// }
function processAll(map: CountMap, numPassengers: number) : number  {
  //map.set('foo', 4);
  // map.forEach((key, value)) => {
  //   return 'foo';
  // });
  var count = 0;
  for(let [key, value] of map) {
    if(value == numPassengers) {
      count++;
    }
  }
  return count;
}


function q2() {
  var items = new Array();

  let cur = new Map<string, number>();
  let numPassengers = 0;

  var sum = 0;
  for (var line of array) {
    //console.log(line);
    if (line.trim() === "") {
      sum += processAll(cur, numPassengers);
      numPassengers = 0;
      cur = new Map<string, number>();
      continue;
    }

    // just loop over it, adding each line in
    for (let char of line.trim()) {
      cur.set(char, cur.get(char) ? cur.get(char)! + 1 : 1);
    }
    numPassengers++;
  }
  sum += processAll(cur, numPassengers);

  console.log(sum);
}
q2();