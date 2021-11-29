var fs = require("fs");
var array = fs.readFileSync("input17.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths : {[length: number] : number} = {};
array.forEach((element : string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for(let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}
// console.log(`number of nonempty lines:\t${nonempty}`)
// console.log(`number of empty lines:\t${empty}`)

// need a way to store for a given [x,y,z] index, if a cube is there or not
// and a way to query if it is there
// x/y/z are integers and they can go any which way for a while...  so can be negative

// interesting idea - lets let the key be a string!!!

type PostitionKey = string;

class Postion {
  constructor($x: number, $y: number, $z: number) {
		this.x = $x;
		this.y = $y;
		this.z = $z;
	}

  x: number;
  y: number;
  z : number;

  get key() : PostitionKey {
    return `${this.x}|${this.y}|${this.z}`;
  }
}

// eacy element in this will contain an iteration
var iterations = new Array<Set<PostitionKey>>();
var firstIteration = new Set<PostitionKey>();
iterations.push(firstIteration);

// lets load the first one in
for(var y = 0; y < array.length ; y++) {
  const z = 0;
  const line : string = array[y];
  for(var x = 0; x < line.length ; x++) {
    if(line[x] == '#') {
      const p = new Postion(x, y, z);
      firstIteration.add(p.key);
    }
  }
}

console.log(`first iteration has ${iterations[0].size} elements.`);
console.dir(iterations[0]);

// and then can calculate the next 6 cycles - start this at 1 as its the "current" cycle
var xbounds = [0, array.length - 1];
var ybounds = [0, array.length - 1];
var zbounds = [0, 0];
const totalCycles = 6;
for(var cycle = 1 ; cycle <= totalCycles ; cycle++) {

  // update the bounds at the beginning
  xbounds[0]--; xbounds[1]++;
  ybounds[0]--; ybounds[1]++;
  zbounds[0]--; zbounds[1]++;

  // and create the new one
  var iteration = new Set<PostitionKey>();
  iterations.push(iteration);

  for(var x = xbounds[0]; x <= xbounds[1] ; x++) {
    for(var y = ybounds[0]; y <= ybounds[1] ; y++) {
      for(var z = zbounds[0]; z <= zbounds[1] ; z++) {
        
        // check all 26 adjacent spots in prev cycle and count how many we have
        const prevCycle = iterations[cycle - 1];
        const currentlyActive = prevCycle.has(new Postion(x, y, z).key);
        var neighboursActive = 0;

        for(var cx = -1 ; cx <= 1 ; cx++) {
          for(var cy = -1 ; cy <= 1 ; cy++) {
            for(var cz = -1 ; cz <= 1 ; cz++) {

              // skip where we're at
              if(cx === 0 && cy === 0 && cz === 0) {
                continue;
              }

              neighboursActive += prevCycle.has(new Postion(x + cx, y + cy, z + cz).key) ? 1 : 0;
            }
          }
        }
        // neighboursActive += prevCycle.has(new Postion(x - 1, y, z).key) ? 1 : 0;
        // neighboursActive += prevCycle.has(new Postion(x + 1, y, z).key) ? 1 : 0;
        // neighboursActive += prevCycle.has(new Postion(x, y - 1, z).key) ? 1 : 0;
        // neighboursActive += prevCycle.has(new Postion(x, y + 1, z).key) ? 1 : 0;
        // neighboursActive += prevCycle.has(new Postion(x, y, z - 1).key) ? 1 : 0;
        // neighboursActive += prevCycle.has(new Postion(x, y, z + 1).key) ? 1 : 0;

        console.log(`(${x},${y},${z} - currently:${currentlyActive} num active:${neighboursActive}`)

        /**
         * If a cube is active and exactly 2 or 3 of its neighbors are also active, the cube remains active. Otherwise, the cube becomes inactive.
         * If a cube is inactive but exactly 3 of its neighbors are active, the cube becomes active. Otherwise, the cube remains inactive. 
         * */
        const active = (currentlyActive && (neighboursActive === 2 || neighboursActive === 3)) ||
          (!currentlyActive && (neighboursActive === 3));

        if(active) {
          iteration.add(new Postion(x, y, z).key);
        }
        
      }
    }
  }
  printCycle(iteration, xbounds, ybounds, zbounds);
  console.log(`iteration ${cycle} has ${iterations[cycle].size} elements.`);
}

function printCycle(cycle: Set<PostitionKey>, xbounds: number[], ybounds: number[], zbounds: number[]) {
  for(var z = zbounds[0]; z <= zbounds[1] ; z++) {
    console.log(`z=${z}`);
    for(var y = ybounds[0]; y <= ybounds[1] ; y++) {
      var xstr = "";
      for(var x = xbounds[0]; x <= xbounds[1] ; x++) {
        xstr += cycle.has(new Postion(x, y, z).key) ? "#" : ".";
      }
      console.log(xstr); 
    }
    console.log("---"); 
  }
}

