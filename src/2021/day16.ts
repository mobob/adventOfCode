import assert from "assert";
import * as fs from "fs";

var array = fs.readFileSync("src/2021/day16.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

function parseIntoBinary(line: string): string {
  // parse one hex number at a time
  var binString = "";
  for (var ind = 0; ind < line.length; ind++) {
    // convert back from hex
    var nonPaddedVal = parseInt(line[ind], 16).toString(2);

    // add on 0's to make this 4 in length
    const missingZeros = 4 - nonPaddedVal.length;

    binString +=
      new Array<string>(missingZeros).fill("0").join("") + nonPaddedVal;
  }
  return binString;
}

interface Packet {
  version: number;
  type: number;
  literal?: number;
  operator?: number;
  subPackets?: Packet[];
}

function printPacket(packet: Packet, indent: string = "") {
  console.log(
    indent +
      `ver:${packet.version} type:${packet.type} lit:${
        packet.literal ?? "?"
      } : operator:${packet.operator ?? "NA"}`
  );
  if (packet.subPackets) {
    packet.subPackets.forEach((sp) => {
      printPacket(sp, indent + "  ");
    });
  }
}

class Parser {
  consume(binStr: string, bits: number): number {
    if (bits > binStr.length) {
      throw `cannot consume ${bits} from ${binStr}`;
    }

    const str = binStr.slice(0, bits);
    const strl = str.length;

    const result = parseInt(binStr.slice(0, bits), 2);
    console.log(`consuming ${bits} from: ${binStr.slice(0, bits)} = ${result}`);
    return result;
  }

  parseLiteral(binStr: string): { literal: number; bits: number } {
    // read 4 bit groups at a time, until one doesn't start with a 1
    var actualBits = "";
    for (var i = 0; ; i += 5) {
      actualBits += binStr.slice(i + 1, i + 5);
      if (binStr[i] === "0") {
        break;
      }
    }
    return { literal: parseInt(actualBits, 2), bits: i + 5 };
  }

  parse(
    binStr: string,
    bitsAvailable: number
  ): { packet: Packet; bitsConsumed: number } {
    const original = binStr;
    if (binStr.length === 0 || bitsAvailable === 0) {
      throw `bad input: '${binStr}', count:${bitsAvailable}`;
    }
    console.log(`parsing, bit count: ${bitsAvailable}`);

    var bitsConsumed = 0;

    // version is 3 bits
    const version = this.consume(binStr, 3);
    binStr = binStr.slice(3);
    bitsConsumed += 3;

    // type is next 3 bits
    const type = this.consume(binStr, 3);
    binStr = binStr.slice(3);
    bitsConsumed += 3;

    // if type is 4 then this is a literal version
    if (type === 4) {
      console.log(`LITERAL packet (ver:${version})`);
      let { literal, bits: bitsInLiteral } = this.parseLiteral(binStr);
      binStr = binStr.slice(bitsInLiteral);
      bitsConsumed += bitsInLiteral;

      return {
        packet: { version: version, type: type, literal },
        bitsConsumed,
      };
    }

    console.log(`OPERATOR packet (ver:${version}) with TYPE: ${type}`);

    // otherwise its an operator, parse the length type
    const lengthType = this.consume(binStr, 1);
    binStr = binStr.slice(1);
    bitsConsumed += 1;

    //If the length type ID is 0, then the next 15 bits are a number that represents the total length in bits of the sub-packets contained by this packet.
    //If the length type ID is 1, then the next 11 bits are a number that represents the number of sub-packets immediately contained by this packet.
    const subPackets = new Array<Packet>();
    if (lengthType === 0) {
      const totalBitsForSubPackets = this.consume(binStr, 15);
      binStr = binStr.slice(15);
      bitsConsumed += 15;

      if (totalBitsForSubPackets > bitsAvailable) {
        throw `asked to consume too many bits ${totalBitsForSubPackets} > ${bitsAvailable}`;
      }

      console.log(
        `about to parse BITS for subpacket ${totalBitsForSubPackets} (allowed len ${bitsAvailable}), consumed: ${bitsConsumed}`
      );

      // stop when we've consumed exactly the right amount
      var subPacketsBitsConsumedTotal = 0;
      while (subPacketsBitsConsumedTotal < totalBitsForSubPackets) {
        const { packet: subPacket, bitsConsumed: subPacketBitsConsumed } =
          this.parse(
            binStr,
            totalBitsForSubPackets - subPacketsBitsConsumedTotal
          );
        binStr = binStr.slice(subPacketBitsConsumed);
        bitsConsumed += subPacketBitsConsumed;

        subPacketsBitsConsumedTotal += subPacketBitsConsumed;
        subPackets.push(subPacket);
      }
    } else if (lengthType === 1) {
      const totalNumberOfSubPackets = this.consume(binStr, 11);
      binStr = binStr.slice(11);
      bitsConsumed += 11;

      if (totalNumberOfSubPackets > bitsAvailable) {
        throw `asked to consume too many sub packets`;
      }

      console.log(
        `about to parse NUM for subpacket ${totalNumberOfSubPackets} (allowed len ${bitsAvailable}), consumed: ${bitsConsumed}`
      );

      // parse this many - we don't know how many exactly we have, but we have a max bound
      for (var i = 0; i < totalNumberOfSubPackets; i++) {
        const { packet: subPacket, bitsConsumed: subPacketBitsConsumed } =
          this.parse(binStr, bitsAvailable - bitsConsumed);
        binStr = binStr.slice(subPacketBitsConsumed);
        bitsConsumed += subPacketBitsConsumed;
        subPackets.push(subPacket);
      }
    } else {
      throw `bad length type! ${lengthType}`;
    }

    return {
      packet: {
        version: version,
        type: type,
        operator: type,
        subPackets: subPackets,
      },
      bitsConsumed,
    };
  }
}

function sumVersionNumbers(packet: Packet): number {
  return (
    packet.version +
    (packet.subPackets ?? []).reduce((sum, sub) => {
      return sum + sumVersionNumbers(sub);
    }, 0)
  );
}

// part 2
function evaluate(packet: Packet): number {
  if (packet.type === 4) {
    return packet.literal!;
  }

  const subEvals = packet.subPackets!.map((sub) => {
    return evaluate(sub);
  });

  if (packet.type === 0) {
    // sum
    return subEvals.reduce((prev, cur) => {
      return prev + cur;
    }, 0);
  }

  if (packet.type === 1) {
    // product
    return subEvals.reduce((prev, cur) => {
      return prev * cur;
    }, 1);
  }

  if (packet.type === 2) {
    // min
    return subEvals.reduce((prev, cur) => {
      return prev < cur ? prev : cur;
    }, Infinity);
  }

  if (packet.type === 3) {
    // max
    return subEvals.reduce((prev, cur) => {
      return prev > cur ? prev : cur;
    }, -1);
  }

  // at this point there are only two
  assert(subEvals.length == 2, `should have exactly 2 sub packets`);

  const [a, b] = subEvals;

  if (packet.type === 5) {
    return a > b ? 1 : 0;
  }
  if (packet.type === 6) {
    return a < b ? 1 : 0;
  }
  if (packet.type === 7) {
    return a === b ? 1 : 0;
  }

  throw `bad packet type: ${packet.type}`;
}

(() => {
  // tests
  assert(
    "110100101111111000101000" === parseIntoBinary("D2FE28"),
    "bad parsing"
  );
  assert(
    "00111000000000000110111101000101001010010001001000000000" ===
      parseIntoBinary("38006F45291200"),
    "bad parsing"
  );

  // go for it
  //const bin = parseIntoBinary("D2FE28");
  //const bin = parseIntoBinary("38006F45291200");
  //const bin = parseIntoBinary("EE00D40C823060");
  // const bin = parseIntoBinary("8A004A801A8002F478");
  // const bin = parseIntoBinary("620080001611562C8802118E34");
  // const bin = parseIntoBinary("C0015000016115A2E0802F182340");
  // const bin = parseIntoBinary("A0016C880162017C3686B18A3D4780");
  //const bin = parseIntoBinary("9C0141080250320F1802104A08");
  //const bin = parseIntoBinary("9C005AC2F8F0");

  const bin = parseIntoBinary(array.join(""));
  console.log(`bit length: ${bin.length}`);
  //console.log(bin);

  const { packet } = new Parser().parse(bin, bin.length);
  printPacket(packet);

  console.log(sumVersionNumbers(packet));

  // part 2
  console.log(evaluate(packet));
})();
