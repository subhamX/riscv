import * as fs from 'fs';
import { addZeros } from '../encode/helperFun';
import { RegisterFile } from './registerFile';

let pc: number, instrReg: string, pcTemp: number, regFile:RegisterFile;
let selectLineB, selectLineY0, selectLineY1;
let instructionMap: Map<number, string> = new Map<number, string>();

function init(): void {
    let data = fs.readFileSync(__dirname + "/test/data.m", { encoding: "utf-8" });
    let dataArr = data.split('\n');
    let i = 0;
    // Loading all instructions of program into instructionMap
    while (dataArr[i]) {
        let key = parseInt(dataArr[i].split(" ")[0], 16);
        let value = dataArr[i].split(" ")[1];
        instructionMap.set(key, value);
        i++;
    }
    // Initializing Register File
    regFile = new RegisterFile();
    // Setting pc and instrReg
    pc = 0;
    // instrReg = instructionMap.get(0);
    // console.log(instructionMap.get(4));
    while (1) {
        fetch();
        decode();
    }

}

init();


function determineSelectLines(opcode: string) {
    // If the instruction is R type then selectLineB = 0
    if (opcode == '0110011') {
        selectLineB = 0;
    } else {
        selectLineB = 1;
    }
    // If the instruction is auipc then selectLineY1 = 1
    if (opcode == "0010111") {
        selectLineY1 = 1;
    } else {
        selectLineY1 = 0;
    }
    // If the instruction is lw, lh, lb, ld then selectLineY0 = 1
    if (opcode == "0000011") {
        selectLineY0 = 1;
    } else {
        selectLineY0 = 0;
    }
}

// program counter pc register which holds the address of the current instruction
function fetch() {
    // Fetching the current Instruction
    let temp = instructionMap.get(pc);
    // Terminating Condition 
    if (!temp) {
        // TODO: Write Data Memory
        process.exit(0);
    }
    temp = parseInt(temp, 16).toString(2);
    temp = addZeros(temp, 32).split('').reverse().join('');
    instrReg = temp;
    pcTemp = pc;
    // TODO: Updating PC
    pc += 4;
    // TODO: constructing immediate value and passing to MuxB
    // TODO: constructing immediate value and passing to MuxINC for Branch Instructions

}


function decode() {
    let opcode = instrReg.slice(0, 7);
    // let rd = 
    let rs1 = instrReg.slice(22, 27);
    rs1 = rs1.split('').reverse().join('');
    let rs2 = instrReg.slice(27, 32);
    rs2 = rs2.split('').reverse().join('');
    console.log(rs1, rs2);
}


interface generateIAPayloadInterface { selectLineINC0, imm, selectLinePC0, returnAddress };

// Function updates Program Counter
function generateInstructionAddress(generateIAPayload: generateIAPayloadInterface) {
    let selectLineINC0 = generateIAPayload.selectLineINC0;
    let imm = generateIAPayload.imm;
    let selectLinePC0 = generateIAPayload.selectLinePC0;
    let returnAddress = generateIAPayload.returnAddress;
    // if selectLinePC0 = 1 then new pc = returnAddress
    if (selectLinePC0) {
        pc = returnAddress;
    } else {
        // if selectLineINC0 = 1 then new pc = pc + imm
        if (selectLineINC0) {
            pc = pc + imm;
        } else {
            pc = pc + 4;
        }
    }
}









