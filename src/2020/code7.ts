var fs = require("fs");
var array = fs.readFileSync("input7.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);

type BagType = string;

class BagMustContain {
  containerType: BagType;
  containType: BagType | undefined;
  containCount: number | undefined;

	constructor($containerType: BagType, $containType: BagType | undefined = undefined, $containCount: number | undefined = undefined) {
		this.containerType = $containerType;
    this.containType = $containType;
	  this.containCount = $containCount;
	}
}

class Bag {
  type : BagType;

	constructor($type : string) {
    this.type = $type;

    // lets build it!
    // no! lets be lazy
	}

  private innerBags? : Bag[];
  private built : boolean = false;

  build() {
    if(this.built) {
      return;
    }
    
    // go through the rules, looking for matches, then add those bags in
    for(const rule of rules) {
      if(rule.containerType === this.type) {
        if(!this.innerBags) {
          this.innerBags = new Array();
        }
        for(let i = 0;i<(rule.containCount ?? 0);i++) {
          this.innerBags.push(new Bag(rule.containType!))

          // for now, just add one...  we don't need to count
          // nope! put em in for part 2! break;
        }
      }
    }
    this.built = true;
  }

  get totalCount() : number {
    if(!this.built) {
      this.build();
    }

    var total = 0;
    for(const innerBag of this.getInnerBags) {
      total++;

      total += innerBag.totalCount;
    }

    return total;
  }

  get getInnerBags() : Bag[] {
    if(!this.built) {
      this.build();
    }
    return this.innerBags!;
  }

  containsBag(other : BagType) : boolean {
    if(!this.built) {
      this.build();
    }

    //console.log(`looking to see if ${this.type} contains ${other}`);

    for(const innerBag of this.getInnerBags) {
      if(innerBag.type === other) {
        return true;
      }

      if(innerBag.containsBag(other)) {
        return true;
      }
    }

    return false;
  }
}

/**
dotted salmon bags contain 2 dark lavender bags, 1 muted red bag, 1 vibrant magenta bag.
vibrant purple bags contain 1 pale cyan bag, 1 dotted lavender bag, 3 striped blue bags, 5 clear magenta bags.
 */
var rules : BagMustContain[] = new Array();
var uniqueColors : Set<BagType> = new Set();
function processRules() {

  for (var line of array) {
    if (line.trim() === "") {
      continue;
    }

    // lets parse off the initial bag type first
    const initialMatches = line.match(/(.*)(bags contain )(.*)/);

    const containerType = initialMatches[1].trim(); // initial container color
    uniqueColors.add(containerType);
    const mustContain = initialMatches[3].trim(); // the rest

    // if we find "no other", then it doesn't have to contain anything
    if(mustContain.match(/.*no other bags.$/) != null) {
      console.log(`found an end bag: ${containerType}`);

      rules.push(new BagMustContain(containerType));
      continue;
    }

    //console.log(mustContain);
    const bagRules = mustContain.replace(".", "").split(",");

    //console.dir(bagRules);
    for(const bagRule of bagRules) {
      //console.log(`bagRule: ${bagRule}`);
      const parsed = bagRule.trim().match(/([0-9]*)(.*)bag(s\b|\b)/);
      const count = parseInt(parsed[1]);
      const bagType = parsed[2].trim();

      rules.push(new BagMustContain(containerType, bagType, count));
    }

  }

  //console.log(rules);
  console.log(`unique color count: ${uniqueColors.size}`);
}
processRules();

// loop over the unique kinds looking for bag type
var canContain = 0;
var lookingFor = "shiny gold";

// uncomment this for part 1, and add back in the break in containsBag
// for(const uniqueColor of uniqueColors) {
//   if(new Bag(uniqueColor).containsBag(lookingFor)) {
//     canContain++;
//   }
// }

console.log(canContain);

console.log(new Bag(lookingFor).totalCount);