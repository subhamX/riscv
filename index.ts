import * as fs from 'fs';
import * as schema from './schema/schema';
import { loadRefMap } from './refMap'

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

driverFun(lines);

function driverFun(lines: string[]) {
    let testLines: string[] = Array();
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] == '.data') {
            // Assembler Directive
            let j = i + 1;
            for (; j < lines.length; j++) {
                if (lines[j][0] != '.') {

                    testLines.push(lines[j]);
                } else {
                    break;
                }
            }
            handleDataSegment(testLines);
            testLines = Array();
            i = j - 1;
        } else if (lines[i] == ".text") {
            // Assembler Directive
            let j = i + 1;
            for (; j < lines.length; j++) {
                if (lines[j][0] != '.') {
                    testLines.push(lines[j]);
                } else {
                    break;
                }
            }
            console.log("Handling Text Segment");
            handleTextSegment(testLines);
            testLines = Array();
            i = j - 1;
        }
    }
}

// Function adds zeros to make the size of any register exactly 5 bit
function addRegZeros(reg:string):string {
    let n = 5 - reg.length;
    while(n>0){
        reg = "0" + reg;
        n--;
    }
    return reg;
}

// Function performs encoding of instructions to binary
function encodeInstruction(line: string) {
    let instr = line.split(" ");
    let mnemonic = instr[0];
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
    let metadata = refMap.get(mnemonic);
    if (metadata) {
        // Instruction Found
        let format = metadata.format;
        let opcode = metadata.opcode;
        let func7 = metadata.func7;
        let func3 = metadata.func3;
        if (format == "R") {
            let encodedInstr = func7 + rs2 + rs1 + func3 + rd + opcode;
            console.log(`(${mnemonic}) R Format: ` + parseInt(encodedInstr, 2).toString(16));
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
