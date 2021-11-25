var fs = require("fs");

var array = fs.readFileSync("input4.txt").toString().trim().split("\n");

console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);

interface Passport {
  byr?: string; //(Birth Year)
  iyr?: number; //(Issue Year)
  eyr?: string; //(Expiration Year)
  hgt?: number; // (Height)
  hcl?: string; //(Hair Color)
  ecl?: string; //(Eye Color)
  pid?: string; //(Passport ID)
  cid?: string; //(Country ID)
}

var passports = new Array();
var cur: Passport = new Object(); //{};
for (var line of array) {
  //console.log(line);

  if (line.trim() === "") {
    //console.log(cur);

    addPassport(cur, passports);
    cur = new Object();

    continue;
  }

  // split up the first one based on spaces
  for (var nameValueString of line.trim().split(" ")) {
    // split this base on the colon, and there must be exactly one
    const nameValue = nameValueString.split(":");
    if (nameValue.length != 2) {
      throw "Bad data! " + nameValueString + " len: " + nameValue.length;
    }

    const name = nameValue[0] as string;
    //@ts-ignore
    cur[nameValue[0]] = nameValue[1];
  }
}

// need to add the last one
addPassport(cur, passports);

function addPassport(passport: Passport, array: Passport[]) {
  array.push(passport);
}

// OK - now process
var numValid = 0;
var valid = Array();
for (const passport of passports) {
  // basically all these need to be defined
  if (
    !!passport.byr &&
    !!passport.iyr &&
    !!passport.eyr &&
    !!passport.hgt &&
    !!passport.hcl &&
    !!passport.ecl &&
    !!passport.pid
  ) {
    numValid++;
    valid.push(passport);
  }
}

console.log(`${numValid} valid out of ${passports.length}`);

// OK PART 2!!!

/**byr (Birth Year) - four digits; at least 1920 and at most 2002.
iyr (Issue Year) - four digits; at least 2010 and at most 2020.
eyr (Expiration Year) - four digits; at least 2020 and at most 2030.
hgt (Height) - a number followed by either cm or in:
If cm, the number must be at least 150 and at most 193.
If in, the number must be at least 59 and at most 76.
hcl (Hair Color) - a # followed by exactly six characters 0-9 or a-f.
ecl (Eye Color) - exactly one of: amb blu brn gry grn hzl oth.
pid (Passport ID) - a nine-digit number, including leading zeroes.
cid (Country ID) - ignored, missing or not.
 */
numValid = 0;
for (const passport of valid) {
  if (!(passport.byr >= 1920 && passport.byr <= 2002)) {
    console.log(`failed byr: ${passport.byr}`);
    continue;
  }
  if (!(passport.iyr >= 2010 && passport.iyr <= 2020)) {
    continue;
  }
  if (!(passport.eyr >= 2020 && passport.eyr <= 2030)) {
    continue;
  }

  const h = passport.hgt;
  const cm = h.match(/^([0-9]*)cm$/);
  const inch = h.match(/^([0-9]*)in$/);
  if (!!cm) {
    //console.log(`found ${cm[1]}cm in ${h}`);
    if (!(parseInt(cm) >= 150 && parseInt(cm) <= 193)) {
      console.log(`failed cm ${cm[1]}cm in ${h}`);
      continue;
    }
  } else if (!!inch) {
    if (!(parseInt(inch) >= 59 && parseInt(inch) <= 76)) {
      console.log(`failed inch ${inch[1]}in in ${h}`);
      continue;
    }
    //console.log(`found ${inch[1]}in in ${h}`);
  } else {
    console.log(`failed height parse ${h}`);
    continue;
  }

  // (Hair Color) - a # followed by exactly six characters 0-9 or a-f.
  const hc = passport.hcl.match(/^#[0-9a-f]{6}$/i);
  if (!!!hc) {
    console.log(`invalid hair color ${passport.hcl}`);
    continue;
  }

  // amb blu brn gry grn hzl oth
  if(!passport.ecl.match(/^(amb|blu|brn|gry|grn|hzl|oth)$/)) {
    console.log(`bad eye color: ${passport.ecl}`);
    continue;
  }

  if(!passport.pid.match(/^[0-9]{9}$/)) {
    console.log(`bad pid ${passport.pid}`);
    continue;
  }

  numValid++;
}


console.log(`${numValid} valid out of ${passports.length}`);