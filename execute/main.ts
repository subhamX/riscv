import * as fs from 'fs';
import { addZeros } from './helperFun';
import {RegisterFile} from './RegisterFileClass';
import { parse } from 'querystring';

// PC->Program Counter, IR->Instruction Register
let PC: number, IR: string, pcTemp: number, regFile:RegisterFile;
let returnAddrReg;
// intermediate Registers
let RA, RB, RZ, RY=null, RM=null;

// instruction Type, operation Code, immediate Value
let type, operCode, immVal;

// select line for muxB, muxY
let selectLineB, selectLineY0, selectLineY1;

let instructionMap: Map<number, string> = new Map<number, string>();
let opcodeMap: Map<string, string> = new Map<string, string>();
let operMap : Map<string, string> = new Map<string, string>();
// func to map opcode with corresponding instruction type
function refMapForOpcode(opcodeMap: Map<String, string>){
    // R type
    opcodeMap.set('0110011', 'R');
    // I type
    opcodeMap.set('0010011', 'I');
    opcodeMap.set('0000011', 'I');
    opcodeMap.set('1100111', 'I');
    // S type
    opcodeMap.set('0100011', 'S');
    // SB type
    opcodeMap.set('1100011', 'SB');
    // U type
    opcodeMap.set('0110111', 'U');
    opcodeMap.set('0010111', 'U');
    // UJ type
    opcodeMap.set('1101111', 'UJ');
}
refMapForOpcode(opcodeMap);

function refMapForOperation(operMap : Map<string, string>){
    // R type
    operMap.set("0000000000", 'add');
    operMap.set("0000100000", 'sub');
    operMap.set("0000000001", 'mul');
    operMap.set("1000000001", 'div');
    operMap.set("1100000001", 'rem');
    operMap.set("1110000000", 'and');
    operMap.set("1100000000", 'or');
    operMap.set("1000000000", 'xor');
    operMap.set("0010000000", 'sll');
    operMap.set("0100000000", 'slt');
    operMap.set("1010100000", 'sra');
    operMap.set("1010000000", 'srl');

    // I type
    operMap.set("0010011000", 'addi');
    operMap.set("0010011111", 'andi');
    operMap.set("0010011110", 'ori');
    operMap.set("0000011000", 'lb');
    operMap.set("0000011011", 'ld');
    operMap.set("0000011001", 'lh');
    operMap.set("0000011010", 'lw');
    operMap.set("1100111000", 'jalr');

    // S type
    operMap.set("0100011000", 'sb');
    operMap.set("0100011010", 'sw');
    operMap.set("0100011011", 'sd');
    operMap.set("0100011001", 'sh');

    // SB type
    operMap.set("1100011000", 'beq');
    operMap.set("1100011001", 'bne');
    operMap.set("1100011101", 'bge');
    operMap.set("1100011100", 'blt');

    // U type
    operMap.set("0110111", 'lui');
    operMap.set("0010111", 'auipc');

    // UJ type
    operMap.set("1101111", 'jal');
}

refMapForOperation(operMap);

function init(): void {
    // let data = fs.readFileSync(__dirname + "/test/data.m", { encoding: "utf-8" });
    let data = fs.readFileSync('test/test.mc', {encoding: 'utf-8'});
    let dataArr = data.split('\n');
    let i = 0;
    // Loading all instructions of program into instructionMap
    while (dataArr[i]) {
        let key = parseInt(dataArr[i].split(" ")[0], 16);
        // console.log(key);
        let value = dataArr[i].split(" ")[1];
        // console.log(value);
        instructionMap.set(key, value);
        i++;
    }
    // Initializing Register File
    regFile = new RegisterFile();
    // Setting pc and instrReg
    PC = 0;
    // instrReg = instructionMap.get(0);
    // console.log(instructionMap.get(4));
    while (1) {
        selectLineB = 1;
        Fetch();
        Decode();
        Execute(type, operCode, immVal);
        MemoryOperations();
        WriteBack();
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

// Stage 1
// program counter pc register which holds the address of the current instruction
function Fetch() {
    // Fetching the current Instruction
    let temp = instructionMap.get(PC);
    // Terminating Condition 
    if (!temp) {
        // TODO: Write Data Memory
        process.exit(0);
    }
    temp = parseInt(temp, 16).toString(2);
    temp = addZeros(temp, 32);
    // console.log(temp);
    // console.log("try");
    IR = temp;
    pcTemp = PC;
    // TODO: Updating PC
    PC += 4;
    // TODO: constructing immediate value and passing to MuxB
    // TODO: constructing immediate value and passing to MuxINC for Branch Instructions

}

// Stage - 2
function Decode() {
    // extracting opcode of current instruction
    let opcode = IR.slice(25, 32);
    // instruction type of current instruction
    let type = opcodeMap.get(opcode);
    let immVal :string = "0";
    let operCode;
    if(type == 'R'){
        // operation code
        operCode = IR.slice(17 ,20) + IR.slice(0, 7);

        let rd = IR.slice(20, 25);
        regFile.setRD(rd);

        let rs1 = IR.slice(12, 17);
        regFile.setRS1(rs1);

        let rs2 = IR.slice(7 ,12)
        regFile.setRS2(rs2);
        selectLineB = 0;
    }
    else if(type == 'I'){
        // operation code
        operCode = opcode + IR.slice(17, 20);

        let rd = IR.slice(20, 25);
        regFile.setRD(rd);

        let rs1 = IR.slice(12, 17);
        regFile.setRS1(rs1);

        // rs2 has the second operand

        let immVal = IR.slice(0, 12);
    }
    else if(type == 'S'){
        // operation code
        operCode = opcode + IR.slice(17, 20);

        let rs1 = IR.slice(12, 17);
        regFile.setRS1(rs1);

        let rs2 = IR.slice(7 ,12)
        regFile.setRS2(rs2);

        let imm4_0 = IR.slice(20, 25);
        let imm11_5 = IR.slice(0, 7);
        let immVal = imm11_5 + imm4_0;

        // rs2 has the base address
        selectLineB = 0
    }
    else if(type == 'SB'){
        // operation code
        operCode = opcode + IR.slice(17, 20);

        let rs1 = IR.slice(12, 17);
        regFile.setRS1(rs1);

        let rs2 = IR.slice(7 ,12)
        regFile.setRS2(rs2);

        let immVal = IR.slice(0) + IR.slice(25) + IR.slice(1, 7) + IR.slice(20, 24);
        
        // rs2 has the base address
        selectLineB = 0
    }
    else if(type == 'U'){
        // operation code
        operCode = opcode;

        let rd = IR.slice(20, 25);
        regFile.setRD(rd);

        let immVal = IR.slice(0, 20);
    }
    else if(type == 'UJ'){
        // operation code
        operCode = opcode;

        let rd = IR.slice(20, 25);
        regFile.setRD(rd);

        let immVal = IR.slice(0) + IR.slice(1, 9) + IR.slice(9) + IR.slice(10, 20);
    }
    else{
        console.error('Not a valid instruction!(invalid Opcode)');
    }
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
        PC = returnAddress;
    } else {
        // if selectLineINC0 = 1 then new pc = pc + imm
        if (selectLineINC0) {
            PC = PC + imm;
        } else {
            PC = PC + 4;
        }
    }
}

// Stage - 3
function Execute(instType : string, operCode : string, immVal : string){
    let inA = parseInt(regFile.getRS1(), 16);
    let inB;
    if(selectLineB){
        inB = parseInt(immVal, 16);
    }
    else{
        inB = regFile.getRS2();
    }
    inB = parseInt(inB, 16);
    // finding operation to be performed
    let ALU_op = operMap.get(operCode);

    if(ALU_op == ('add' || 'addi' || 'ld' || 'lb' || 'lh' || 'lw')){
        RZ = inA + inB;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == 'sub'){
        RZ = inA - inB;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == 'div'){
        // TODO: current output is decimal, required is integer
        RZ = inA/inB;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == 'rem'){
        RZ = inA%inB;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == 'mul'){
        RZ = inA*inB;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == ('andi' || 'and)')){
        RZ = inA&inB;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == ('ori' || 'or')){
        RZ = inA|inB;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == 'xor'){
        RZ = inA^inB;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == 'beq'){
        if(inA == inB){
            // TODO : update the PC
        }
    }
    else if(ALU_op == 'bne'){
        if(inA != inB){
            // TODO : update the PC
        }
    }
    else if(ALU_op == 'bge'){
        if(inA >= inB){
            // TODO : update the PC
        }
    }
    else if(ALU_op == 'blt'){
        if(inA < inB){
            // TODO : update the PC
        }
    }
    else if(ALU_op == 'sll'){
        RZ = inA << inB;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == 'slt'){
        RZ = (inA < inB) ? 1:0;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == 'sra'){
        RZ = inA >> inB;
        RZ |= inA & (1<<31);
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == 'srl'){
        RZ = inA >> inB;
        RZ = parseInt(RZ, 10).toString(16);
    }
    else if(ALU_op == 'jalr'){
        // RZ = inA
        // TODO: update the PC
        // update the return address
    }
    else if(ALU_op == ('sb' || 'sw' || 'sd' || 'sh')){
        RZ = inA + immVal;
        RM = inB;
    }
    else if(ALU_op == 'lui'){
        RZ = inB << 12;
    }
    else if(ALU_op == 'auipc'){
        // TODO:auipc
    }
    else if(ALU_op == 'jal'){
        // TODO:jal
    }
}

// Stage - 4
function MemoryOperations(){
    // if(selectLineY0)
}

// Stage - 5
function WriteBack(){

}
