import * as fs from 'fs';
import { addZeros } from './helperFun';
import {RegisterFile} from './RegisterFileClass';
import {opcodeMap, operationMap} from './mapPhase2';
import {MemoryFile, addOnesZeros} from './MemoryFileClass'

// PC->Program Counter, IR->Instruction Register
let PC: number, IR: string, pcTemp: number, regFile:RegisterFile, memFile:MemoryFile;
let returnAddr;
// intermediate Registers
let RA, RB, RZ, RY, RM=null, MAR, MDR;

// instruction Type, operation Code, immediate Value
let type, operCode, immVal;

// select line for muxB, muxY
let selectLineB, selectLineY0=1, selectLineY1=0, selectLineY3=0;

let instructionMap: Map<number, string> = new Map<number, string>();
let opMap: Map<string, string> = new Map<string, string>();
let operMap : Map<string, string> = new Map<string, string>();
opcodeMap(opMap);
operationMap(operMap);

function init(): void {
    // let data = fs.readFileSync(__dirname + "/test/data.m", { encoding: "utf-8" });
    let data = fs.readFileSync('test/test.mc', {encoding: 'utf-8'});
    let dataArr = data.split('\n');
    let i = 0;
    opcodeMap(opMap);
    operationMap(operMap);
    
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
    let type = opMap.get(opcode);
    immVal = "0";
    if(type == 'R'){
        // operation code
        operCode = IR.slice(17 ,20) + IR.slice(0, 7);

        let rd = IR.slice(20, 25);
        regFile.setRD(parseInt(rd, 2));

        let rs1 = IR.slice(12, 17);
        regFile.setRS1(parseInt(rs1, 2));

        let rs2 = IR.slice(7 ,12)
        regFile.setRS2(parseInt(rs2, 2));
        selectLineB = 0;
    }
    else if(type == 'I'){
        // operation code
        operCode = opcode + IR.slice(17, 20);

        let rd = IR.slice(20, 25);
        regFile.setRD(parseInt(rd, 2));

        let rs1 = IR.slice(12, 17);
        regFile.setRS1(parseInt(rs1, 2));

        // rs2 has the second operand

        immVal = IR.slice(0, 12);
    }
    else if(type == 'S'){
        // operation code
        operCode = opcode + IR.slice(17, 20);

        let rs1 = IR.slice(12, 17);
        regFile.setRS1(parseInt(rs1, 2));

        let rs2 = IR.slice(7 ,12)
        regFile.setRS2(parseInt(rs2, 2));

        let imm4_0 = IR.slice(20, 25);
        let imm11_5 = IR.slice(0, 7);
        immVal = imm11_5 + imm4_0;

        // rs2 has the base address
        selectLineB = 0
    }
    else if(type == 'SB'){
        // operation code
        operCode = opcode + IR.slice(17, 20);

        let rs1 = IR.slice(12, 17);
        regFile.setRS1(parseInt(rs1, 2));

        let rs2 = IR.slice(7 ,12)
        regFile.setRS2(parseInt(rs2, 2));

        immVal = IR.slice(0) + IR.slice(25) + IR.slice(1, 7) + IR.slice(20, 24);
        
        // rs2 has the base address
        selectLineB = 0
    }
    else if(type == 'U'){
        // operation code
        operCode = opcode;

        let rd = IR.slice(20, 25);
        regFile.setRD(parseInt(rd, 2));

        immVal = IR.slice(0, 20);
    }
    else if(type == 'UJ'){
        // operation code
        operCode = opcode;

        let rd = IR.slice(20, 25);
        regFile.setRD(parseInt(rd, 2));

        immVal = IR.slice(0) + IR.slice(1, 9) + IR.slice(9) + IR.slice(10, 20);
    }
    else{
        console.error('Not a valid instruction!(invalid Opcode)');
    }
}

//  updates PC
function UpdatePC(PC_Select: number, inpImm?:number) : void{
    pcTemp = PC;
    PC-=4;
    if(PC_Select == 0){
        PC = RZ;
    }
    else{
        if(inpImm){
            PC+=immVal;
        }
        else{
            PC+=4;
        }
    }
}

// evaluate Immediate values
function evaluateImm(imVal : string) : number{
    imVal = addOnesZeros(imVal);
    return parseInt(imVal, 2);
}

// Stage - 3
function Execute(instType : string, operCode : string, immVal : string){
    let inA :number = regFile.getRS1();
    let inB :number;
    if(selectLineB){
        inB = evaluateImm(immVal);
    }
    else{
        inB = regFile.getRS2()
    }
    // finding operation to be performed
    let ALU_op = operMap.get(operCode);

    if(ALU_op == ('add' || 'addi' || 'ld' || 'lb' || 'lh' || 'lw')){
        RZ = inA + inB;
    }
    else if(ALU_op == 'sub'){
        RZ = inA - inB;
    }
    else if(ALU_op == 'div'){
        RZ = Math.floor(inA/inB);
    }
    else if(ALU_op == 'rem'){
        RZ = inA%inB;
    }
    else if(ALU_op == 'mul'){
        RZ = inA*inB;
    }
    else if(ALU_op == ('andi' || 'and)')){
        RZ = inA&inB;
    }
    else if(ALU_op == ('ori' || 'or')){
        RZ = inA|inB;
    }
    else if(ALU_op == 'xor'){
        RZ = inA^inB;
    }
    else if(ALU_op == 'beq'){
        if(inA == inB){
            UpdatePC(evaluateImm(immVal));
        }
    }
    else if(ALU_op == 'bne'){
        if(inA != inB){
            UpdatePC(evaluateImm(immVal));
        }
    }
    else if(ALU_op == 'bge'){
        if(inA >= inB){
            UpdatePC(evaluateImm(immVal));
        }
    }
    else if(ALU_op == 'blt'){
        if(inA < inB){
            UpdatePC(evaluateImm(immVal));
        }
    }
    else if(ALU_op == 'sll'){
        RZ = inA << inB;
    }
    else if(ALU_op == 'slt'){
        RZ = (inA < inB) ? 1:0;
    }
    else if(ALU_op == 'sra'){
        RZ = inA >> inB;
        RZ |= inA & (1<<31);
    }
    else if(ALU_op == 'srl'){
        RZ = inA >> inB;
    }
    else if(ALU_op == 'jalr'){
        PC = returnAddr;
        
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
        returnAddr = PC;
        UpdatePC(evaluateImm(immVal), 1);
        // TODO:jal
    }
}

// Stage - 4
function MemoryOperations(){
    if(type == 'S'){
        selectLineY0 = 0;
        selectLineY1 = 0;
        memFile.MEM_WRITE(RZ, RM, operMap.get(operCode).slice(1));
    }
    else if(operMap.get(operCode) == ('ld'||'lw'||'lh'||'lb')){
        selectLineY0 = 0;
        selectLineY1 = 1;
        MDR = memFile.MEM_READ(RZ, operMap.get(operCode).slice(1));
    }
}

// Stage - 5
function WriteBack(){
    if(selectLineY0){
        RY = RZ;
    }
    else if(selectLineY1){
        RY = MDR;
    }
    else if(selectLineY3){
        RY = returnAddr;
    }
    else{
        console.error("Something's Wrong with the select line for muxY");
        return;
    }

}
