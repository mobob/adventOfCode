var fs = require("fs");
var array = fs.readFileSync("input18.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths : {[length: number] : number} = {};
array.forEach((element : string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for(let key in lineLengths) {
  //console.log(`number of length ${key}: ${lineLengths[key]}`);
}


///
// For those reading this - perhaps this is my worst code ever?!
// Works for part 1, but didn't get to part 2. :)
/// 


type ExpressionNode = number | Expression | NestedExpression;

enum Operator {
  multiply = 'multiply', 
  plus = 'plus'
};

function printId(id: number | string) {
  if (typeof id === "string") {
    // In this branch, id is of type 'string'
    console.log(id.toUpperCase());
  } else {
    // Here, id is of type 'number'
    console.log(id);
  }
}

class Expression {

  element!: ExpressionNode;
  operator? : Operator;
  next? : ExpressionNode;

  constructor($element: ExpressionNode) {
    this.element = $element;
  }

  append($operator: Operator, $toAppend: ExpressionNode) {
    console.log(`appending to ${JSON.stringify(this)} ${$operator} and ${JSON.stringify($toAppend)}`);

    // if we have nothing, we're good
    if(!this.next) {
      if(this.operator) {
        throw `shouldn't have an operator in append: ${this.toString()}`;
      }

      this.operator = $operator;
      this.next = $toAppend;
      return;
    }

    // if we don't have an expression, its an endpoint
    if(typeof this.next === 'number') {
      var newe = new Expression(this.next);
      newe.operator = $operator;
      newe.next = $toAppend;
      this.next = newe;
      return;
    }

    // it must be an expression at this point
    if(!(this.next instanceof Expression)) {
      throw `expected an Expression!`;
    }

    // and lets get to the end of it
    this.next.append($operator, $toAppend);
  }

  toString() : string {
    var build = "";
    if(typeof this.element === 'number') {
      build += `${this.element}`
    } else 
    
    if(this.element instanceof Expression) {
      build += `(${this.element.toString()})`;
    }

    if(this.operator === Operator.multiply) {
      build += ' X ';
    } else if(this.operator === Operator.plus) {
      build += ' + ';
    } else {
      // there is no operator, so we should just be done
      return build;
      //throw `bad operator in print: ${this.operator}`;
    }

    if(this.next) {
      build += this.next.toString();
    }

    return build;
  }

  evaluate() : number {
    console.log(`eval called; ${JSON.stringify(this)}`);

    // do the base cases first
    const leftSide = (this.element instanceof Expression) ? this.element.evaluate() : this.element;

    if(!this.operator || !this.next) {
      return (this.element instanceof Expression) ? this.element.evaluate() : this.element;
    }

    if(typeof this.next === 'number') {
      switch(this.operator) {
        case Operator.plus:
          return leftSide + this.next;
        case Operator.multiply:
          return leftSide * this.next;
      };
    }

    return this.next.evaluateWithLeftSideTally(leftSide, this.operator);
  }

  evaluateWithLeftSideTally(leftSide: number, operator: Operator) : number {
    console.log(`evallst on ${JSON.stringify(this)} - leftSide:${leftSide}, operator:${operator}`);

    //var leftSide : number;
    const element = (this.element instanceof Expression) ? this.element.evaluate() : this.element;
    // if(this.element instanceof Expression) {
    //   leftSide = this.element.evaluateWithLeftSideTally(leftSide, operator);
    // } else {
    switch(operator) {
      case Operator.plus:
        leftSide += element;
        break;
      case Operator.multiply:
        leftSide *= element;
        break;
    };
    //}

    console.log(`... leftSide: ${leftSide}`);

    if(!this.operator) {
      return leftSide;
    }

    if(!this.next) {
      throw `should be a right side!`;
    }

    // if its a number, we're ok
    if(typeof this.next === 'number') {
      switch(this.operator) {
        case Operator.plus:
          return leftSide + this.next;
        case Operator.multiply:
          return leftSide * this.next;
      };
    }

    // otherwise tally along
    return this.next.evaluateWithLeftSideTally(leftSide, this.operator);

  }
};

class NestedExpression extends Expression {
  evaluate() : number {
    return -2;
  }
}

// returns the expression and the number of characters that were consumed in line
function parseExpression(line: string) : [Expression, number] {

  if(line.length === 0) {
    throw 'bad empty expression';
  }

  // (8 * 4 + 6 + (7 + 3 * 9 + 4 * 3) + 2 + 2) * 3 * 8 * 2 * 9 * (5 * 5 * 2 * 6)
  // var startingExpression = new Expression();
  // var currentExpression = startingExpression;
  var currentExpression : Expression | null = null; //new Expression();
  var currentOperator : Operator | null = null;

  // one char at a time
  for(var ind = 0 ; ind < line.length ; ind++) {
    console.log(`ind: ${ind}, line:'${line}', ce: ${JSON.stringify(currentExpression)}`);

    if(line[ind] === ' ') {
      // ignore to avoid trimming everywhere
    } else if(line[ind] === '(') {

      // new expression
      var [result, jumpAhead] = parseExpression(line.substring(ind + 1));
      ind += jumpAhead;

      if(!currentExpression) {
        currentExpression = new Expression(result);
      } else if(currentOperator != null) {
        currentExpression.append(currentOperator, new Expression(result));
        currentOperator = null;
      } else {
        throw `missing an operator for append!`;
      }

    } else if(line[ind] === ')') {
      if(currentExpression == null) {
        throw `should have an expression`;
      }

      // we're done this expression
      return [currentExpression, ind + 1];

    } else if(line[ind] === '+' || line[ind] === '*') {
      if(currentOperator != null) {
        throw `shouldn't have an operator, line: ${line}`;
      }

      currentOperator = line[ind] === '+' ? Operator.plus : Operator.multiply;

    } else {
      
      const numberMatch = line.substring(ind).match(/^([0-9])+/);
      if(numberMatch != null) {
        //console.dir(numberMatch);

        const number = parseInt(numberMatch[0]);
        console.log(`matched number: ${number} of length ${numberMatch[0].length}`);

        // advance our counter past the number
        const adv = numberMatch[0].length - 1;
        //console.log(`advancing by; ${adv}`);
        ind += (adv);

        // and assign to expression
        if(currentExpression == null) {
          currentExpression = new Expression(number);
        } else {
          if(!currentOperator) {
            throw `should have an operator!!: -- ${currentExpression.operator} --`;
          }
          currentExpression.append(currentOperator, number);
          currentOperator = null;
        }
      }
    }
  }
  if(currentExpression == null) {
    throw `should have an expression at the end`;
  }
  return [currentExpression, ind];
}


console.log("go for it: ");
const eee = "1 + (2 * 3) + (4 * (5 + 6))";
//const eee = "4 + 2 + (7 * 2)";
//const eee = "(4 + 4) * 2 + 9 * (4 + 42 * (8 * 9))";
const parsed = parseExpression(eee);
console.dir(parsed);
console.log(`expr: ${parsed[0].toString()}`);
console.log(`evaluated: ${parsed[0].evaluate()}`);



// just parse each line one at a time, and calculate as we go
var ongoingSum = 0;
for(var line of array) {

  const expr = parseExpression(line);
  ongoingSum += expr[0].evaluate();
  //console.log(`expr: ${JSON.stringify(expr)}`);

  //break;
}
console.log(`ongoing sum: ${ongoingSum}`);