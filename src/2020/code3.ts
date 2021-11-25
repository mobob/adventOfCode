var fs = require('fs');

var array = fs.readFileSync('input3.txt').toString().trim().split("\n");

console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);

// whats the width of the map?
const width = array[0].length;
console.log(width);

var position = 0; // ok we'll try to do 0 indexes!
var jump = 3;
var numTrees = 0;
for(var i=0;i<array.length;i++) {
  // skip the first one
  if(i == 0) continue;

  // if advancing to the right rolls us over, roll over
  position += jump;
  position %= width;
  
  // if we're on a tree, we're on a tree!
  const onTree = array[i][position] === "#";
  if(onTree) {
    numTrees++;
  }
}

console.log("num trees: " + numTrees);


// ok part 2

function countTrees(right: number, down: number) {
  var position = 0; // ok we'll try to do 0 indexes!
  var jump = right;
  var numTrees = 0;
  for(var i=0;i<array.length;i+=down) {
    // skip the first one
    if(i == 0) continue;

    // if advancing to the right rolls us over, roll over
    position += jump;
    position %= width;
    
    // if we're on a tree, we're on a tree!
    const onTree = array[i][position] === "#";
    if(onTree) {
      numTrees++;
    }
  }
  return numTrees;
}

/* Right 1, down 1.
Right 3, down 1. (This is the slope you already checked.)
Right 5, down 1.
Right 7, down 1.
Right 1, down 2.*/
var results : number[] = new Array();
results.push(countTrees(1,1));
results.push(countTrees(3,1));
results.push(countTrees(5,1));
results.push(countTrees(7,1));
results.push(countTrees(1,2));

console.log(results);
console.log(results.reduce((prev, cur, ind, array) => {
  return prev * cur;
}))