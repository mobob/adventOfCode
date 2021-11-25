var fs = require("fs");
var array = fs.readFileSync("input6.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);

class BagRule {

}

class Bag {

  get totalCount() : number {
    return 0;
  }

  get contains() : Bag[] {
    return [];
  }
}

