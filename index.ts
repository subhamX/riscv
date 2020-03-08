import * as fs from 'fs';
import * as schema from './schema/schema';
import { loadRefMap } from './refMap'
import { addZeros, addRegZeros } from './helperFun'; 
// refMap maps mnemonic to its metadata
let refMap: Map<String, schema.InstructionMetaData> = new Map<String, schema.InstructionMetaData>();
// DataInterfaceMap maps variable names to its metadata
let DataInterfaceMap: Map<string, schema.DataInterface> = new Map();
// DataInterface contains the data of DataInterface or [.data]
let DataInterface: Array<string> = Array();

// Loading the Reference Map
loadRefMap(refMap);

// Synchronously reading contents of asm file
let fileData = fs.readFileSync("test/data.asm", { encoding: 'utf-8' })

let lines: string[] = fileData.split("\n");
lines = preProcess(lines);
let { dataSegment, textSegment, voidSegment } = check(lines);
console.log("Data Segment")
console.log(dataSegment);
console.log("Text Segment")
console.log(textSegment);
console.log("Void Segment")
console.log(voidSegment);

// handleDataSegment(dataSegment);
handleTextSegment(textSegment);

function check(lines: string[]): { dataSegment: string[], textSegment: string[], voidSegment: string[] } {
    let onlyIdentifierPattern = /^[\w]+[ ]*:[ ]*$/;
    let dataSegPattern = /^.+[ ]*:[ ]+[.][byte|dword|word|half|asciz]*[ ]+(0[xX][0-9a-fA-F]+|[\d]+)$/;
    let onlyIdentifierRegExp = RegExp(onlyIdentifierPattern);
    let dataSegRegExp = RegExp(dataSegPattern);
    let dataSegment: string[] = Array();
    let textSegment: string[] = Array();
    let voidSegment: string[] = Array();
    // Segment Flag || 0 => void | 1 => data | 2 => text
    let segmentFlag: number = 0;
    try {
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            // line = line.trim();
            // If the instruction is not a comment
            if (line[0] == ".") {
                if (line == ".data") {
                    console.log("Handling: ", line);
                    // dataSegment.push(".data");
                    segmentFlag = 1;
                } else if (line == ".text") {
                    // textSegment.push(".text");
                    segmentFlag = 2;
                } else {
                    // Error
                }
            } else {
                if (i == 0) {
                    segmentFlag = 2;
                }
                if (segmentFlag == 1) {
                    // Check if the line is a valid Data Segment Line
                    console.log(line);
                    let result = onlyIdentifierRegExp.test(line);
                    console.log(result);
                    if (result) {
                        i++;
                        if (i != lines.length) {
                            console.log(line);
                            console.log(lines[i]);
                            line += " " + lines[i].trim();
                            console.log(line);
                        } else {
                            throw Error(`Error Encountered at line: ${i}`);
                        }
                    }
                    result = dataSegRegExp.test(line);
                    console.log(`${line} Result- ${result}`);

                    if (result) {
                        dataSegment.push(line);
                    } else {
                        throw Error(`Error Encountered at line: ${i}`);
                    }
                } else {
                    // Check if the line is a valid Text Segment Line
                    textSegment.push(line);
                }
            }
        }
        return { dataSegment, textSegment, voidSegment };
    } catch (err) {
        console.log(err);
        console.log('Exiting Code');
        process.exit(1);
    }
}


// Function to prePrcocess the instructions. It removes the comments and trims the instruction.
function preProcess(lines: string[]): string[] {
    let finalLines: string[] = Array();
    for (let line of lines) {
        line = line.trim();
        // If the instruction is not a comment
        if (line && line[0] != '#') {
            finalLines.push(line);
        }
    }
    return finalLines;
}

// driverFun(lines);

function driverFun(lines: string[]) {
    let dataSegment: string[] = Array();
    let textSegment: string[] = Array();
    let testLines: string[] = Array();
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] == '.data') {
            // Assembler Directive
            let j = i + 1;
            for (; j < lines.length; j++) {
                if (lines[j][0] != '.') {
                    dataSegment.push(lines[j]);
                } else {
                    break;
                }
            }
            // handleDataSegment(testLines);
            // testLines = Array();
            i = j - 1;
        } else if (lines[i] == ".text") {
            // Assembler Directive
            let j = i + 1;
            for (; j < lines.length; j++) {
                if (lines[j][0] != '.') {
                    textSegment.push(lines[j]);
                } else {
                    break;
                }
            }
            console.log("Handling Text Segment");
            // handleTextSegment(testLines);
            // testLines = Array();
            i = j - 1;
        }
    }
}

// Function performs encoding of instructions to binary
function encodeInstruction(line: string) {
    let instr = line.split(/[ ]+|[,]/).filter((a) => a);
    let mnemonic = instr[0];

    let metadata = refMap.get(mnemonic);
    if (metadata) {
        // Instruction Found
        let format = metadata.format;
        let opcode = metadata.opcode;
        let func3 = metadata.func3;
        if (format == "R") {
            let func7 = metadata.func7;

            let rd = instr[1].replace(',', '').slice(1);
            rd = parseInt(rd).toString(2);
            let rs1 = instr[2].replace(',', '').slice(1);
            rs1 = parseInt(rs1).toString(2);
            let rs2 = instr[3].replace(',', '').slice(1);
            rs2 = parseInt(rs2).toString(2);

            rs1 = addRegZeros(rs1);
            rs2 = addRegZeros(rs2);
            rd = addRegZeros(rd);
            // Expecting rd, rs1, rs2 lengths to be exactly 5
            let encodedInstr = func7 + rs2 + rs1 + func3 + rd + opcode;
            console.log(`(${mnemonic}) R Format: ` + parseInt(encodedInstr, 2).toString(16));
        } else if (format == "I") {
            console.log(instr);
            let rd = instr[1].replace(',', '').slice(1);
            rd = parseInt(rd).toString(2);
            let rs1 = instr[2].replace(',', '').slice(1);
            rs1 = parseInt(rs1).toString(2);
            let imm = instr[3].replace(',', '');
            console.log(imm);
            imm = parseInt(imm).toString(2);
            console.log("Before, " + imm);
            imm = addZeros(imm, metadata.immLen);
            console.log("After, " + imm);
            rs1 = addRegZeros(rs1);
            rd = addRegZeros(rd);
            console.log(`${rd} || ${rs1} || ${opcode} || ${imm} || `)
            let encodedInstr = imm + rs1 + func3 + rd + opcode;
            console.log(`(${mnemonic}) I Format: ` + parseInt(encodedInstr, 2).toString(16));
        }else if(format=="S"){
            let rs2 = instr[1].replace(',', '').slice(1);
            rs2 = parseInt(rs2).toString(2);
            rs2 = addZeros(rs2, 5);
            let arg2 = instr[2];
            let offset = arg2.match(/[\d]+/)[0];
            let rs1 = arg2.match(/(x[\d]+)/)[0].slice(1);
            rs1 = parseInt(rs1).toString(2);
            rs1 = addZeros(rs1, 5);
            offset = parseInt(offset).toString(2);
            offset = addZeros(offset, metadata.immLen);
            let imm1 = offset.slice(7);
            let imm2 = offset.slice(0, 7);
            let encodedInstr = imm2.concat(rs2, rs1, func3, imm1, opcode);
            // console.log(`${imm2}|${rs2}|${rs1}|${func3}|${imm1}|${opcode}`)
            console.log(`(${mnemonic}) S Format: ` + parseInt(encodedInstr, 2).toString(16));
        }
    } else {
        // Raise Error
    }
}
// Handles Text Segment
function handleTextSegment(lines: string[]) {
    for (let line of lines) {
        encodeInstruction(line);
    }
}


// Handles Data Segment
function handleDataSegment(lines: string[]) {
    for (let line of lines) {
        // Using Regex to catch multiple spaces
        let instr = line.split(/[ ]+/);
        let name: string = instr[0];
        let type: string = instr[1];
        let data: string = instr[2];

        // Processing type
        if (type[0] != '.') {
            // Error
        } else {
            type = type.slice(1);
        }

        // Processing name
        if (name[name.length - 1] != ':') {
            // Error
        } else {
            name = name.slice(0, name.length);
        }

        // Processing data
        let hexstring = parseInt(data).toString(16);
        // console.log("Hex", hexstring.length);

        // Half Bytes means 4;
        let numberOfHalfBytes: number;
        switch (type) {
            case 'word': {
                numberOfHalfBytes = 8;
                break;
            }
            case 'byte': {
                numberOfHalfBytes = 2;
                break;
            }
            case 'dword': {
                numberOfHalfBytes = 16;
                break;
            }
            case 'half': {
                numberOfHalfBytes = 4;
                break;
            }
        }
        // Inserting to DataInterfaceMap
        DataInterfaceMap.set(name, { "length": numberOfHalfBytes, "type": type, "startIndex": DataInterface.length })
        // Finding number of zeros to be inserted
        let zerosSize = numberOfHalfBytes - hexstring.length;
        // Inserting Zeroes
        while (zerosSize > 0) {
            hexstring = "0" + hexstring;
            zerosSize--;
        }
        // hexstring is now >=numberOfHalfBytes
        let index = hexstring.length - 1;
        for (let i = 0; i < numberOfHalfBytes; i += 2) {
            let foo = hexstring.slice(index - 1, index + 1);
            DataInterface.push(foo);
            index -= 2;
        }
    }
}

// console.log(DataInterfaceMap);
// console.log(DataInterface);
