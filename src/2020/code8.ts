var fs = require("fs");
var array = fs.readFileSync("input8.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var empty = 0, nonempty = 0;
array.forEach((element : string) => {
  if(element.trim().length > 0) {
    nonempty++;
  } else {
    empty++;
  }
});
console.log(`number of nonempty lines:\t${nonempty}`)
console.log(`number of empty lines:\t${empty}`)

enum Operation {
  nop = 'nop',
  acc = 'acc',
  jmp = 'jmp',
}

/**  
  nop +0
acc +1
jmp +4
acc +3
jmp -3
acc -99
acc +1
jmp -4
acc +6*/

// <operations> <value>
var instructions = new Array();

class Instruction {
  private operation: Operation;
  private scalar : number;

	constructor($operation: Operation, $scalar: number) {
		this.operation = $operation;
		this.scalar = $scalar;
	}
}

array.forEach((element : string) => {
  //console.log(element);

  const matches = element.match(/(nop|acc|jmp)\s([+|-][0-9]*)$/);
  if(matches == null) {
    throw `didn't match: ${element}`;
  }
  //console.dir(matches)

  var i = new Instruction(matches[1]! as Operation, parseInt(matches[2]));
  instructions.push(i);
  //console.dir(i);
});


var haveBeenRun : { [index : number] : boolean } = {};

// ok lets go! loop with index, interpret, and see how it goes
var executions = 0;
var index = 0;
var acc = 0;
while(executions < 10000000) {
  const instruction= instructions[index];
  console.dir(instruction);
  if(haveBeenRun[index]) {
    console.log(`last acc: ${acc}`);
    break;
  }
  haveBeenRun[index] = true;

  switch(instruction.operation) {
    case Operation.nop:
      index++;
      break;
    case Operation.jmp:
      index += instruction.scalar;
      break;
    case Operation.acc:
      acc += instruction.scalar;
      index++;
      break;
    default:
      throw `bad instruction!`;
  }
}


// part 2

// wrap it all in a loop - and do a swap on each nop / jmp to see if we complete
for(var i=0;i<instructions.length;i++) {

  var haveBeenRun : { [index : number] : boolean } = {};

  // ok lets go! loop with index, interpret, and see how it goes
  var executions = 0;
  var index = 0;
  var acc = 0;
  while(executions < 10000000 && index < instructions.length) {
    const instruction= instructions[index];
    console.log(`${index} : ${instruction}`);
    if(haveBeenRun[index]) {
      console.log(`last acc: ${acc}`);
      break;
    }
    haveBeenRun[index] = true;

    const swappedOperation = index === i ? (instruction.operation === Operation.nop ? Operation.jmp :
    instruction.operation === Operation.jmp ? Operation.nop : instruction.operation) : instruction.operation;

    switch(swappedOperation) {
      case Operation.nop:
        index++;
        break;
      case Operation.jmp:
        index += instruction.scalar;
        break;
      case Operation.acc:
        acc += instruction.scalar;
        index++;
        break;
      default:
        throw `bad instruction!`;
    }
  }

  if(index >= instructions.length) {
    console.log(`done!!! acc: ${acc}`);
    break;
  }
}