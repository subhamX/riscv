import * as fs from 'fs';
import * as schema from './schema/schema';
import { loadRefMap } from './refMap'
import { addZeros, addRegZeros } from './helperFun';
import * as patterns from './regexPatterns';

// refMap maps mnemonic to its metadata
let refMap: Map<string, schema.InstructionMetaData> = new Map<string, schema.InstructionMetaData>();
// labelMap maps labels to its metadata
let labelMap: Map<string, schema.LabelInterface> = new Map<string, schema.LabelInterface>();
// dataSegmentMap maps variable names to its metadata
let dataSegmentMap: Map<string, schema.DataLabelInterface> = new Map();
// dataMemory contains the data of dataMemory or [.data]
let dataMemory: Array<string> = Array();

// Loading the Reference Map
loadRefMap(refMap);

// Synchronously reading contents of asm file
let fileData = fs.readFileSync("test/data.asm", { encoding: 'utf-8' })

let lines: string[] = fileData.split("\n");
lines = preProcess(lines);
let { dataSegment, textSegment } = check(lines);
console.log("Data Segment")
console.log(dataSegment);
console.log("Text Segment")
console.log(textSegment);
console.log("Label Map");
console.log(labelMap);

handleTextSegment(textSegment);
handleDataSegment(dataSegment);

function check(lines: string[]): { dataSegment: string[], textSegment: string[] } {

    let dataSegment: string[] = Array();
    let textSegment: string[] = Array();
    let voidSegment: string[] = Array();
    // Segment Flag || 0 => void | 1 => data | 2 => text
    let segmentFlag: number = 2;
    try {
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            // line = line.trim();
            // console.log(line);
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
                    throw Error(`(No Label Found) ErrorB Encountered at line: ${i} (${line})`);
                }
            } else {
                if (segmentFlag == 1) {
                    // Check if the line has only label
                    let result = patterns.labelPattern.test(line);
                    if (result) {
                        i++;
                        if (i != lines.length) {
                            line += " " + lines[i].trim();
                        } else {
                            throw Error(`Error Encountered at line: ${i}`);
                        }
                    }
                    result = patterns.dataSegPattern.test(line);
                    console.log(`${line} Result- ${result}`);

                    if (result) {
                        dataSegment.push(line);
                    } else {
                        // Check if it belongs to voidSegment
                        segmentFlag = 0;
                        i--;
                    }
                } else {
                    // Check if the line is a valid R, I, S, SB, U or UJ
                    let resultRformat: boolean = patterns.formatRPattern.test(line);
                    let resultIformat: boolean = patterns.formatIPattern.test(line);
                    let resultLoadformat: boolean = patterns.formatLoadPattern.test(line);
                    let resultSformat: boolean = patterns.formatSPattern.test(line);
                    let resultSBformat: boolean = patterns.formatSBPattern.test(line);
                    let resultUformat: boolean = patterns.formatUPattern.test(line);
                    let resultUJformat: boolean = patterns.formatUJPattern.test(line);
                    console.table({ "Instr": line, "R Format": resultRformat, "I Format": resultIformat, "S Format": resultSformat, "SB Format": resultSBformat, "U Format": resultUformat, "UJ Format": resultUJformat });
                    if (resultIformat || resultRformat || resultSformat || resultSBformat || resultUJformat || resultUformat || resultLoadformat) {
                        // The line is a valid instruction
                        if (segmentFlag == 2) {
                            textSegment.push(line);
                        } else if (segmentFlag == 0) {
                            if (resultSBformat) {
                                throw Error(`(Branch Instructions Not Allowed In Void Segement) ErrorC Encountered at line: ${i} (${line})`);
                            }
                            textSegment.push(line);
                        }
                    } else {
                        // Check if the line is valid label
                        let isValidLabel = patterns.labelPattern.test(line);
                        if (isValidLabel) {
                            line = line.replace(':', '');
                            line = line.replace(' ', '');
                            if (labelMap.has(line)) {
                                throw Error(`Label Already Defined: ${i} (${line})`);
                            }
                            labelMap.set(line, { "location": textSegment.length, "scope": "text" });
                            console.log(labelMap);
                        } else {
                            // Error! The line is neither a valid instruction nor a valid label
                            throw Error(`ErrorA Encountered at line: ${i} (${line})`);
                        }
                    }

                }
            }
        }
        return { dataSegment, textSegment };
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
function encodeInstruction(line: string, index: number) {
    try {
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
                console.log(`(${mnemonic}||${line}) R Format: ` + parseInt(encodedInstr, 2).toString(16));
            } else if (format == "I") {
                if (mnemonic[0] == "l") {
                    // Instruction is ld, lh, lw, lb
                    let rd = instr[1].replace(',', '').slice(1);
                    rd = parseInt(rd).toString(2);
                    rd = addZeros(rd, 5);
                    let arg2 = instr[2];
                    let rs1 = arg2.match(/(x[\d]+)/)[0].slice(1);
                    rs1 = parseInt(rs1).toString(2);
                    rs1 = addZeros(rs1, 5);
                    let offset = arg2.match(/[\d]+/)[0];
                    offset = parseInt(offset).toString(2);
                    offset = addZeros(offset, metadata.immLen);
                    let encodedInstr = offset.concat(rs1, func3, rd, opcode);
                    console.log(`(${mnemonic}||${line}) I Format: ` + parseInt(encodedInstr, 2).toString(16));
                } else {
                    let rd = instr[1].replace(',', '').slice(1);
                    rd = parseInt(rd).toString(2);
                    let rs1 = instr[2].replace(',', '').slice(1);
                    rs1 = parseInt(rs1).toString(2);
                    let imm = instr[3].replace(',', '');
                    imm = parseInt(imm).toString(2);
                    imm = addZeros(imm, metadata.immLen);
                    rs1 = addRegZeros(rs1);
                    rd = addRegZeros(rd);
                    // console.log(`${rd} || ${rs1} || ${opcode} || ${imm} || `)
                    let encodedInstr = imm + rs1 + func3 + rd + opcode;
                    console.log(`(${mnemonic}||${line}) I Format: ` + parseInt(encodedInstr, 2).toString(16));
                }
            } else if (format == "S") {
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
                console.log(`(${mnemonic}||${line}) S Format: ` + parseInt(encodedInstr, 2).toString(16));
            } else if (format == "SB") {
                // beq, bne, bge, blt
                let rs1 = instr[1].replace(',', '').slice(1);
                rs1 = parseInt(rs1).toString(2);
                rs1 = addZeros(rs1, 5);
                let rs2 = instr[2].replace(',', '').slice(1);
                rs2 = parseInt(rs2).toString(2);
                rs2 = addZeros(rs2, 5);
                let label = instr[3];
                let labelMeta = labelMap.get(label);
                if (labelMeta) {
                    let imm = (labelMeta.location - index) * 2;
                    // Checking if the immediate field is enough to store 
                    if (imm > 2047 || imm < -2048) {
                        throw Error(`Immediate Field Length Now Enough! ${line}`);
                    }
                    let encodedInstr:string;
                    if (imm >= 0) {
                        let immString = parseInt((imm).toString()).toString(2);
                        immString = addZeros(immString, 12);
                        let imm1 = immString[1];
                        let imm2 = immString.slice(8, 12);
                        let imm3 = immString.slice(2, 8);
                        let imm4 = immString[0];
                        // console.log(`${imm1}|${imm3}|${rs2}|${rs1}|${func3}|${imm2}|${imm4}|${opcode}`)
                        encodedInstr = imm1.concat(imm3, rs2, rs1, func3, imm2, imm4, opcode);
                    } else {
                        let immString = (parseInt(imm.toString(), 10) >>> 0).toString(2);
                        // Reducing the length to 12 from LSB
                        immString = immString.slice(immString.length - 12);
                        immString = addZeros(immString, 12);
                        let imm1 = immString[1];
                        let imm2 = immString.slice(8, 12);
                        let imm3 = immString.slice(2, 8);
                        let imm4 = immString[0];
                        encodedInstr = imm1.concat(imm3, rs2, rs1, func3, imm2, imm4, opcode);
                        // console.log(parseInt(encodedInstr, 2).toString(16))
                    }
                    console.log(`(${mnemonic}||${line}) SB Format: ` + parseInt(encodedInstr, 2).toString(16));

                } else {
                    throw Error(`Label Error Occurred at line: ${line}`);
                }
            }else if(format=="U"){

            }else if(format=="UJ"){

            }else{
                
            }
        } else {
            // Raise Error
            throw Error(`Error Occurred at line: ${line}`);
        }
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}
// Handles Text Segment
function handleTextSegment(lines: string[]) {
    for (let index in lines) {
        encodeInstruction(lines[index], parseInt(index));
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
        // Inserting to dataSegmentMap
        dataSegmentMap.set(name, { "length": numberOfHalfBytes, "type": type, "startIndex": dataMemory.length })
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
            dataMemory.push(foo);
            index -= 2;
        }
    }
}

console.log(dataSegmentMap);
console.log(dataMemory);
console.log(labelMap);
