var fs = require("fs");

var array = fs.readFileSync("input5.txt").toString().trim().split("\n");

console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);

interface SeatInterface {
  row: number,
  col: number,
  readonly id : number;
}

// type TypeSeat = {
//   row: number,
//   col: number
// }

class Seat implements SeatInterface {
  row: number;
  col: number;
  constructor (r: number, c: number) {
    this.row = r;
    this.col = c;
  }
  get id() : number {
    return this.row * 8 + this.col;
  }
};



/** For example, consider just the first seven characters of FBFBBFFRLR:

Start by considering the whole range, rows 0 through 127.
F means to take the lower half, keeping rows 0 through 63.
B means to take the upper half, keeping rows 32 through 63.
F means to take the lower half, keeping rows 32 through 47.
B means to take the upper half, keeping rows 40 through 47.
B keeps rows 44 through 47.
F keeps rows 44 through 45.
The final F keeps the lower of the two, row 44. 

For example, consider just the last 3 characters of FBFBBFFRLR:

Start by considering the whole range, columns 0 through 7.
R means to take the upper half, keeping columns 4 through 7.
L means to take the lower half, keeping columns 4 through 5.
The final R keeps the upper of the two, column 5.*/
function parseSeat(seatString: string) : Seat {

  // first 7 are F or B
  var row = 0;
  for(let i = 0 ; i < 7 ; i++ ) {
    if(!(seatString[i] === 'F' || seatString[i] === 'B')) {
      throw "bad input!";
    }
    const lowerHalf = seatString[i] === 'F';

    // range is 2^7 - to decide which side we start on
    row += lowerHalf ? 0 : 2 ** (6 - i);
  }

  // last 3 are R or L
  var col = 0;
  for(let i = 7 ; i < 10 ; i++ ) {
    if(!(seatString[i] === 'L' || seatString[i] === 'R')) {
      throw "bad input!";
    }
    const lowerHalf = seatString[i] === 'L';

    // range is 2^7 - to decide which side we start on
    col += lowerHalf ? 0 : 2 ** (9 - i);
  }

  return new Seat(row, col);
}



console.log(parseSeat(array[0]).id);
console.log(parseSeat('FBFBBFFRLR').id);

var highest = 0;
for(const seatString of array) {
  const cur = parseSeat(seatString).id;
  if(cur > highest) {
    highest = cur;
  }
}
console.log(highest);


///// second question

// lets map them by id - as that should be sequential. and then look for gaps?
// or lets just print out each row. lets sort it all
var seats : Seat[] = new Array();
for(const seatString of array) {
  const cur = parseSeat(seatString);
  seats.push(cur);
}

seats = seats.sort((a, b) => { 
  if(a.row < b.row) { return -1; }
  if(a.row > b.row) { return 1; }
  if(a.col < b.col) { return -1; }
  if(a.col > b.col) { return 1; }
  throw "shouldn't have the same values!";
})

var ids = new Set();
seats.forEach((value, ind, array) => {
  ids.add(value.id);
});

  //((prev, cur, ind, arr) =>)

function isSeatPresent(seat : Seat) {
  return ids.has(seat.id);
}

for(var row = 0 ; row < 128 ; row++ ) {
  var rowStr = row + "\t";
  for(var col = 0 ; col < 8 ; col++) {
    rowStr += isSeatPresent(new Seat(row, col)) ? "Y" : "-";
  }
  console.log(rowStr);
}

// OK its after we start recording, so the next that doesn't, is it
var foundSome = false;
for(var row = 0 ; row < 128 ; row++ ) {
  for(var col = 0 ; col < 8 ; col++) {

    const present = isSeatPresent(new Seat(row, col));
    if(present && !foundSome) {
      foundSome = true;
    } else if(!present && foundSome) {
      // this is it!
      console.log(new Seat(row, col).id);
    }
  }

}