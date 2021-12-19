import * as fs from "fs";

var array = fs.readFileSync("src/2021/day15.txt").toString().trim().split("\n");
console.log(`parsed: ${array.length} elements, first one is ${array[0]}`);
var lineLengths: { [length: number]: number } = {};
array.forEach((element: string) => {
  const len = element.trim().length;
  lineLengths[len] = (lineLengths[len] ?? 0) + 1;
});
for (let key in lineLengths) {
  console.log(`number of length ${key}: ${lineLengths[key]}`);
}

/**
8A004A801A8002F478 represents an operator packet (version 4) which contains an operator packet (version 1) which contains an operator packet (version 5) which contains a literal value (version 6); this packet has a version sum of 16.
620080001611562C8802118E34 represents an operator packet (version 3) which contains two sub-packets; each sub-packet is an operator packet that contains two literal values. This packet has a version sum of 12.
C0015000016115A2E0802F182340 has the same structure as the previous example, but the outermost packet uses a different length type ID. This packet has a version sum of 23.
A0016C880162017C3686B18A3D4780 is an operator packet that contains an operator packet that contains an operator packet that contains five literal values; it has a version sum of 31.
*/

function parseIntoBinary(line: string): string {
  // parse one hex number at a time
  var binString = "";
  for (var ind = 0; ind < line.length; ind++) {
    binString += line[ind].charCodeAt(0).toString(2);
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
    `${packet.version} ${packet.type} ${packet.literal ?? "?"} : operator:${
      packet.operator ?? "?"
    }`
  );
  if (packet.subPackets)
    packet.subPackets.forEach((sp) => {
      printPacket(sp, indent + "  ");
    });
}

class Parser {
  consume(binStr: string, bits: number): number {
    return parseInt(binStr.slice(0, bits), 2);
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
    bits: number
  ): { packet: Packet; bitsConsumed: number } {
    if (binStr.length === 0 || bits === 0) {
      throw `bad input`;
    }

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
      let { literal, bits } = this.parseLiteral(binStr);
      binStr = binStr.slice(bits);
      bitsConsumed += bits;

      return {
        packet: { version: version, type: type, literal },
        bitsConsumed,
      };
    }

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

      // stop when we've consumed exactly the right amount
      var subPacketsBitsConsumedTotal = 0;
      while (subPacketsBitsConsumedTotal < totalBitsForSubPackets) {
        const { packet: subPacket, bitsConsumed: subPacketBitsConsumed } =
          this.parse(binStr, bits - bitsConsumed);
        binStr = binStr.slice(subPacketBitsConsumed);
        bitsConsumed += subPacketBitsConsumed;

        subPacketsBitsConsumedTotal += subPacketBitsConsumed;
        subPackets.push(subPacket);
      }
    } else if (lengthType === 1) {
      const totalNumberOfSubPackets = this.consume(binStr, 11);
      binStr = binStr.slice(11);
      bitsConsumed += 11;

      // parse this many - we don't know how many exactly we have, but we have a max bound
      for (var i = 0; i < totalNumberOfSubPackets; i++) {
        const { packet: subPacket, bitsConsumed: subPacketBitsConsumed } =
          this.parse(binStr, bits - bitsConsumed);
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

(() => {
  const bin = parseIntoBinary("8A004A801A8002F478");
  console.log(bin);
  const { packet } = new Parser().parse(bin, bin.length);
  printPacket(packet);
})();
