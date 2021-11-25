var fs = require('fs');
var array = fs.readFileSync('input2.txt').toString().trim().split("\n");

console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);

interface Item {
  min : number,
  max : number,
  letter : string,
  password : string
}

var numValid1 = 0;
var numValid2 = 0;
for(const i of array) {
  var raw = i.split(" ");

  // first item needs to be split now

  var item : Item = {
    min: parseInt(raw[0].split("-")[0]),
    max: parseInt(raw[0].split("-")[1]),
    letter: raw[1].replace(":", ""),
    password: raw[2]
  }
  console.log(item);


  // take the current length, then replace all the elements to find out how many
  const count = item.password.length - item.password.replaceAll(item.letter, "").length;
  if(item.min <= count && count <= item.max) {
    numValid1++;
    //console.log("Valid!" + count);
  } else {
    //console.log("Invalid! " + count);
  }


  // ok part 2 rules now
  const valid = (item.password[item.min - 1] === item.letter) != (item.password[item.max - 1] === item.letter);
  if(valid) {
    numValid2++;
    console.log("Valid!");
  } else {
    console.log("Invalid! ");
  }
}

console.log(numValid1);
console.log(numValid2);