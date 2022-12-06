var fs = require("fs");
var array = fs.readFileSync("src/2020/input1.txt").toString().split("\n");

var numbers: number[] = new Array();

for (const i in array) {
  let number = parseInt(array[i]);
  if (number >= 0) {
    numbers.push(number);
    //console.log(numbers[numbers.length-1]);
  }
}

// ok find the two numbers that sum to 2020!
for (var i = 0; i < numbers.length; i++) {
  for (var j = 0; j < numbers.length; j++) {
    if (numbers[i] + numbers[j] === 2020) {
      console.log(`${numbers[i]} + ${numbers[j]} === 2020`);
      console.log(`product is: ${numbers[i] * numbers[j]}`);
    }
  }
}

// ok find the THREE numbers that sum to 2020!
for (var i = 0; i < numbers.length; i++) {
  for (var j = 0; j < numbers.length; j++) {
    for (var k = 0; k < numbers.length; k++) {
      if (numbers[i] + numbers[j] + numbers[k] === 2020) {
        console.log(`${numbers[i]} + ${numbers[j]} + ${numbers[k]} === 2020`);
        console.log(`product is: ${numbers[i] * numbers[j] * numbers[k]}`);
      }
    }
  }
}
