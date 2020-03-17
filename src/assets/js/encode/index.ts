import * as schema from './schema/schema';
import { loadRefMap } from './refMap'
import { addZeros, addRegZeros, preProcess } from './utility';
import * as patterns from './regexPatterns';

// refMap maps mnemonic to its metadata
let refMap: Map<string, schema.InstructionMetaData> = new Map<string, schema.InstructionMetaData>();
// labelMap maps labels to its metadata
let labelMap: Map<string, schema.LabelInterface>;
// dataSegmentMap maps variable names to its metadata
let dataSegmentMap: Map<string, schema.DataLabelInterface>;
// dataMemory contains the data of dataMemory or [.data]
let dataMemory: Array<string>;
let firstErrorLineIndex = -1;
let errorMessage: string;
let BASE_DATA_SEG = 65536;

// Loading the Reference Map
loadRefMap(refMap);

function sendErrorResponse() {
    console.log(`RETURNING ERROR RESPONSE`);
    return { "firstErrorLineIndex": firstErrorLineIndex, "error": true, "errorMessage": errorMessage };
}


export function main(fileData:string): {"error": boolean, "codeSegment"?:string[], "errorMessage"?:string, "firstErrorLineIndex"?:number} {
    dataMemory = Array<string>();
    dataSegmentMap = new Map();
    labelMap = new Map<string, schema.LabelInterface>()
    console.log("Reading File src/input/input.asm");
    // Synchronously reading contents of asm file
    let lines: string[] = fileData.split("\n");
    // preProcessing the file
    console.log("Preprocess all lines");
    lines = preProcess(lines);

    console.log("Checking For Errors");
    let response = check(lines);
    if (firstErrorLineIndex != -1) {
        return sendErrorResponse();
    }
    console.log("Handling Data Segment");
    let dataSegment = response.dataSegment;
    let textSegment = response.textSegment;
    let codeSegment: Array<string> = Array<string>();
    handleDataSegment(dataSegment);
    if (firstErrorLineIndex != -1) {
        return sendErrorResponse();
    }
    console.log("Handling Text Segment");
    handleTextSegment(textSegment, codeSegment);
    if (firstErrorLineIndex != -1) {
        return sendErrorResponse();
    }
    console.log("Writing Code Segment");
    codeSegment = codeSegment.map((a, index) => {
        let temp = a.split(' ');
        let instructionCode = temp[0];
        let originalCode = temp.slice(1).join(" ");
        return `0x${(4 * index).toString(16)} 0x${addZeros(instructionCode, 8)} ${originalCode}`;
    })
    // Adding dataMemory
    codeSegment.push(...dataMemory.map((a, index) => {
        return `0x${(268435456 + index).toString(16)} 0x${a}`
    }));
    console.log("Success!");
    return {"error": false, codeSegment};
}



/**
 * Parses the file and checks for any errors
 * Stores the text labels in labelMap
 * 
 * RETURNS: dataSegment and textSegment
 *  */
function check(lines: string[]): { dataSegment: string[], textSegment: string[] } {
    let dataSegment: string[] = Array();
    let textSegment: string[] = Array();
    // Segment Flag || 0 => void | 1 => data | 2 => text
    let segmentFlag: number = 2;
    let i = 0;
    try {
        for (i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line[0] == ".") {
                if (line == ".data") {
                    segmentFlag = 1;
                } else if (line == ".text") {
                    segmentFlag = 2;
                } else {
                    // Error
                    throw Error(`(No Label Found) ErrorB Encountered at line: ${i} (${line})`);
                }
            } else {
                if (segmentFlag == 1) {
                    // Check if the line has only label
                    let labelResult = patterns.labelPattern.test(line);
                    if (labelResult) {
                        i++;
                        if (i != lines.length) {
                            line += " " + lines[i].trim();
                        } else {
                            throw Error(`Error Encountered at line: ${i}`);
                        }
                    }
                    let result = patterns.dataSegPattern.test(line);
                    let resultAsciiz = patterns.dataSegAsciizPattern.test(line);
                    if (result || resultAsciiz) {
                        dataSegment.push(line);
                    } else {
                        // Check if it belongs to voidSegment
                        segmentFlag = 0;
                        // If the i-1 statement is just a label
                        if (labelResult) {
                            i -= 2;
                        } else {
                            // If the ith statement is a valid instruction [but not data one]
                            i--;
                        }
                    }
                } else {
                    if (patterns.dataSegPattern.test(line) || patterns.dataSegAsciizPattern.test(line)) {
                        segmentFlag = 1;
                        i--;
                        continue;
                    }
                    // Check if the line is a valid R, I, S, SB, U or UJ
                    let resultRformat: boolean = patterns.formatRPattern.test(line);
                    let resultIformat: boolean = patterns.formatIPattern.test(line);
                    let resultLoadformat: boolean = patterns.formatLoadPattern.test(line);
                    let resultSformat: boolean = patterns.formatSPattern.test(line);
                    let resultSBformat: boolean = patterns.formatSBPattern.test(line);
                    let resultUformat: boolean = patterns.formatUPattern.test(line);
                    let resultUJformat: boolean = patterns.formatUJPattern.test(line);
                    let resultLoadFromDataformat: boolean = patterns.formatLoadFromDataPattern.test(line);
                    if (resultIformat || resultRformat || resultSformat || resultSBformat || resultUJformat || resultUformat || resultLoadformat || resultLoadFromDataformat) {
                        // The line is a valid instruction
                        let instr = line.split(/[ ]+|[,]/).filter((a) => a);
                        let mnemonic = instr[0];
                        // If instruction is loading using registers to load or not a load instruction
                        if (mnemonic[0] != 'l' || resultLoadformat) {
                            textSegment.push(line);
                            continue;
                        }
                        // If instruction is loading from labels in data segment
                        let rd = instr[1].replace(',', '').slice(1);
                        rd = parseInt(rd).toString();
                        // Pusing auipc statement
                        textSegment.push(`auipc x${rd} ${BASE_DATA_SEG}`);

                        if (segmentFlag == 2) {
                            // If the current segment is text segment
                            textSegment.push(line);
                        } else if (segmentFlag == 0) {
                            // If the current segment is void segment
                            if (resultSBformat) {
                                // If the instruction is using branch then ERROR
                                throw Error(`(Branch Instructions Not Allowed In Void Segement)|| Only jal is allowed ErrorC Encountered at line: ${i} (${line})`);
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
                            // storing label in labelMap
                            labelMap.set(line, { "location": textSegment.length, "scope": "text" });
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
        console.log('Exiting Code From Check');
        errorMessage = err;
        firstErrorLineIndex = i;
        return;
    }
}


// Function performs encoding of instructions to binary
function encodeInstruction(params: { line: string, index: number, lineNumber: number }, codeSegment: string[]) {
    let line = params.line;
    let index = params.index;
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
                // Instruction is of R Format
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
                codeSegment.push(`${parseInt(encodedInstr, 2).toString(16)} ${line.split(",").join(" ")}`);
            } else if (format == "I") {
                if (mnemonic[0] == "l") {
                    // Instruction is ld, lh, lw, lb
                    let resultLoadformat: boolean = patterns.formatLoadPattern.test(line);
                    if (!resultLoadformat) {
                        let label = instr[2];
                        let meta = dataSegmentMap.get(label);
                        if(!meta){
                            throw Error("Label Error Occurred!");
                        }
                        let imm = meta.startIndex - (index - 1) * 4;
                        let rd = instr[1].replace(',', '').slice(1);
                        rd = parseInt(rd).toString(2);
                        rd = addZeros(rd, 5);
                        let rs1 = rd;
                        instr[2] = `${imm}(x${parseInt(rd, 2)})`;
                        // 268435479 is auipc x0, 0x10000000
                        // codeSegment.push((268435479 + (parseInt(rs1, 2) << 7)).toString(16));
                        if (imm > 2047 || imm < -2048) {
                            throw Error(`Immediate Field Length not Enough! ${line}`);
                        }
                        let offset = getImmString(imm, 12);
                        let encodedInstr = offset.concat(rs1, func3, rd, opcode);
                        // Converting auipc statement to load one
                        let lastInstr = codeSegment[codeSegment.length-1];
                        codeSegment[codeSegment.length-1] = `${lastInstr.split(' ')[0]} ${instr.join(' ')}`;
                        // Pushing the current statement 
                        codeSegment.push(`${parseInt(encodedInstr, 2).toString(16)} ${instr.join(" ")}`);
                    } else {
                        let rd = instr[1].replace(',', '').slice(1);
                        rd = parseInt(rd).toString(2);
                        rd = addZeros(rd, 5);
                        let arg2 = instr[2];
                        let rs1 = arg2.match(/([(]x[\d]+)/)[0].slice(2);
                        rs1 = parseInt(rs1).toString(2);
                        rs1 = addZeros(rs1, 5);
                        let offset = arg2.match(/[-]?(0[xX][0-9a-fA-F]+|[\d]+)/)[0];
                        let imm = parseInt(offset);
                        // Checking if the immediate field is enough to store 
                        if (imm > 2047 || imm < -2048) {
                            throw Error(`Immediate Field Length not Enough! ${line}`);
                        }
                        offset = getImmString(imm, 12);
                        let encodedInstr = offset.concat(rs1, func3, rd, opcode);
                        codeSegment.push(`${parseInt(encodedInstr, 2).toString(16)} ${line.split(",").join(" ")}`);
                    }
                } else {
                    let rd = instr[1].replace(',', '').slice(1);
                    rd = parseInt(rd).toString(2);
                    let rs1 = instr[2].replace(',', '').slice(1);
                    rs1 = parseInt(rs1).toString(2);
                    let immString = instr[3].replace(',', '');
                    let imm = parseInt(immString);
                    // Checking if the immediate field is enough to store 
                    if (imm > 2047 || imm < -2048) {
                        throw Error(`Immediate Field Length not Enough! ${line}`);
                    }
                    immString = getImmString(imm, 12);
                    rs1 = addRegZeros(rs1);
                    rd = addRegZeros(rd);

                    let encodedInstr = immString + rs1 + func3 + rd + opcode;
                    codeSegment.push(`${parseInt(encodedInstr, 2).toString(16)} ${line.split(",").join(" ")}`);
                }
            } else if (format == "S") {
                let rs2 = instr[1].replace(',', '').slice(1);
                rs2 = parseInt(rs2).toString(2);
                rs2 = addZeros(rs2, 5);
                let arg2 = instr[2];
                let rs1 = arg2.match(/([(]x[\d]+)/)[0].slice(2);
                rs1 = parseInt(rs1).toString(2);
                rs1 = addZeros(rs1, 5);
                let offset = arg2.match(/[-]?(0[xX][0-9a-fA-F]+|[\d]+)/)[0];
                let imm = parseInt(offset);
                // Checking if the immediate field is enough to store 
                if (imm > 2047 || imm < -2048) {
                    throw Error(`Immediate Field Length not Enough! ${line}`);
                }
                offset = getImmString(imm, 12);
                let imm1 = offset.slice(7);
                let imm2 = offset.slice(0, 7);
                let encodedInstr = imm2.concat(rs2, rs1, func3, imm1, opcode);
                codeSegment.push(`${parseInt(encodedInstr, 2).toString(16)} ${line.split(",").join(" ")}`);
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
                    let imm = (labelMeta.location - params.index) * 2;
                    // Checking if the immediate field is enough to store 
                    if (imm > 2047 || imm < -2048) {
                        throw Error(`Immediate Field Length not Enough! ${line}`);
                    }
                    let encodedInstr: string;
                    let immString = getImmString(imm, 12);
                    let imm1 = immString[1];
                    let imm2 = immString.slice(8, 12);
                    let imm3 = immString.slice(2, 8);
                    let imm4 = immString[0];
                    encodedInstr = imm1.concat(imm3, rs2, rs1, func3, imm2, imm4, opcode);
                    codeSegment.push(`${parseInt(encodedInstr, 2).toString(16)} ${line.split(",").join(" ")}`);
                } else {
                    throw Error(`Label Error Occurred at line: ${line}`);
                }
            } else if (format == "U") {
                let offset = instr[2];
                let imm = parseInt(offset);
                // Checking if the immediate field is enough to store 
                if (imm < 0 || imm > 1048575) {
                    throw Error(`Immediate Field Length not Enough! ${line}`);
                }
                offset = getImmString(imm, 20);
                let rd = instr[1].replace(',', '').slice(1);
                rd = parseInt(rd).toString(2);
                rd = addZeros(rd, 5);
                let encodedInstr = offset + rd + opcode;
                codeSegment.push(`${parseInt(encodedInstr, 2).toString(16)} ${line.split(",").join(" ")}`);
            } else if (format == "UJ") {
                let rd = instr[1].replace(',', '').slice(1);
                rd = parseInt(rd).toString(2);
                rd = addZeros(rd, 5);
                let label = instr[2];
                let labelMeta = labelMap.get(label);
                if (labelMeta) {
                    let imm = (labelMeta.location - params.index) * 2;
                    // Checking if the immediate field is enough to store 
                    // TODO: Check the range for jal
                    let encodedInstr: string;
                    let immString = getImmString(imm, 20);
                    let imm1 = immString[9]; // 11
                    let imm2 = immString.slice(10, 20); // 1-10
                    let imm3 = immString.slice(1, 9); //12-19
                    let imm4 = immString[0]; // 20
                    encodedInstr = imm4.concat(imm2, imm1, imm3, rd, opcode);
                    codeSegment.push(`${parseInt(encodedInstr, 2).toString(16)} ${line.split(",").join(" ")}`);
                } else {
                    throw Error(`Label Error Occurred at line: ${line}`);
                }
            } else {
                throw Error(`Invalid Statement! ${line}`);
            }
        } else {
            // Raise Error
            throw Error(`Error Occurred at line: ${line}`);
        }
    } catch (err) {
        console.log(err);
        errorMessage = err;
        firstErrorLineIndex = params.index;
        return;
    }
}
// Handles Text Segment
function handleTextSegment(lines: string[], codeSegment: string[]) {
    // index refers to current index of program counter
    let params = { 'line': null, 'index': 0, 'lineNumber': 0 };
    for (let i = 0; i < lines.length; i++) {
        params.line = lines[i];
        encodeInstruction(params, codeSegment);
        params.index++;
        params.lineNumber++;
    }
    codeSegment.push('ffffffff END CODE');
}


function getImmString(imm: number, len: number) {
    let immString;
    if (imm >= 0) {
        immString = parseInt((imm).toString()).toString(2);
        immString = addZeros(immString, len);
    } else {
        immString = (parseInt(imm.toString(), 10) >>> 0).toString(2);
        // Reducing the length to len from LSB
        immString = immString.slice(immString.length - len);
    }
    return immString;
}

// Handles Data Segment
function handleDataSegment(lines: string[]) {
    let index;
    try {
        for (let index in lines) {
            // Using Regex to catch multiple spaces
            let line = lines[index];
            let instr = line.split(/[ ]+/);
            let name: string = instr[0].replace(':', '');
            let type: string = instr[1];
            type = type.slice(1);
            name = name.slice(0, name.length);
            if (dataSegmentMap.get(name)) {
                throw Error(`[Data Segment]: ${name} Label already Exist`);
            }
            if (type == 'asciiz') {
                let data: string = instr[2].split('"').join('');
                // Parsing Escape Sequences
                data = data.split('\\b').join('\b');
                data = data.split('\\\\').join('\\');
                data = data.split('\\xFF').join('\xFF');
                data = data.split('\\"').join('\"');
                data = data.split("\\'").join("\"");
                data = data.split('\\n').join('\n');
                data = data.split('\\r').join('\r');
                data = data.split('\\t').join('\t');
                data = data.split('\\f').join('\f');
                data = data.split('\\v').join('\v');
                data = data.split('\\0').join('\0');
                dataSegmentMap.set(name, { "type": type, "startIndex": dataMemory.length, length: data.length + 1 });
                data.split('').forEach((e) => {
                    let t1 = e.charCodeAt(0).toString(16)
                    t1 = addZeros(t1, 2);
                    dataMemory.push(t1);
                })
                dataMemory.push('00');
            } else {
                let totalNums = line.match(/((0[xX][0-9a-fA-F]+|[\d]+)[ ]*,[ ]*)*(0[xX][0-9a-fA-F]+|[\d]+)[ ]*$/)[0].split(/[ ]|[,]/).filter((e) => e);
                // Half Bytes means 4 bits;
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
                if (dataSegmentMap.get(name)) {
                    throw Error(`${name} variable already exists!`)
                }
                // Inserting to dataSegmentMap
                dataSegmentMap.set(name, { "length": numberOfHalfBytes, "type": type, "startIndex": dataMemory.length })
                totalNums.forEach((e) => {
                    if (parseInt(e) > Number.MAX_SAFE_INTEGER) {
                        throw Error(`MAX_SAFE_INTEGER VALUE REACHED!`);
                    }
                    let hexstring = parseInt(e).toString(16);
                    hexstring = addZeros(hexstring, numberOfHalfBytes);
                    // hexstring is now >=numberOfHalfBytes
                    let index = hexstring.length - 1;
                    for (let i = 0; i < numberOfHalfBytes; i += 2) {
                        let foo = hexstring.slice(index - 1, index + 1);
                        dataMemory.push(foo);
                        index -= 2;
                    }
                })
            }

        }
    } catch (err) {
        console.log(err);
        errorMessage = err;
        firstErrorLineIndex = index;
        return;
    }

}
