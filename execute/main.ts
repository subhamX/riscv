import * as fs from 'fs';
import {RegisterFile} from './RegisterFileClass';
import {opcodeMapfunc, operationMapfunc} from './mapPhase2';
import {MemoryFile, addOnesZeros, addZeros} from './MemoryFileClass'

// PC->Program Counter, IR->Instruction Register
let PC: number, IR: string, pcTemp: number, regFile:RegisterFile, memFile:MemoryFile;

let CLOCK:number=0;

// Holds return address
let returnAddr;

// intermediate Registers
let RA, RB, RZ, RM, RY, MAR, MDR;

// instruction Type, operation Code, immediate Value
let type, operCode, immVal;

// select line for muxB, muxY
let selectLineB, selectLineY=1;

let instructionMap: Map<number, string> = new Map<number, string>();
let opcodeMap: Map<string, string> = new Map<string, string>();
let operationMap : Map<string, string> = new Map<string, string>();
opcodeMapfunc(opcodeMap);
operationMapfunc(operationMap);

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
    memFile = new MemoryFile();
    // Setting pc and instrReg
    PC = 0;
    CLOCK = 0;
    while (1) {
        console.log("------------********----------");;
        Fetch();
        Decode();
        Execute(type, operCode, immVal);
        MemoryOperations();
        WriteBack();
    }
}

init();


function determineSelectLines(type: string) {
    // If the instruction is R type then selectLineB = 0
    if (type == ('R'||'SB')) {
        selectLineB = 0;
        selectLineY = 0;
    }
    else{
        // for instr. types I, S, U, UJ imm val is passed to inB
        selectLineB = 1;
    }

    if(type == ('I')){
        // if inst. is load then selectLineY = 1 , get value from MDR
        if(operationMap.get(operCode)[0]=='l'){
            selectLineY = 1;
        }
        else{
            selectLineY = 0;
        }
    }
    if(type == 'U'){
        selectLineY = 0;
    }
    if(type == 'UJ'){
        selectLineY = 2;
    }
    // for store instructions memory address(calculated by alu) will be passed on to RY using selectLineY=0
    if(type == 'S'){
        selectLineY = 1;
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
    IR = temp;
    pcTemp = PC;
    PC += 4;
    CLOCK +=1;
}

// Stage - 2
function Decode() {
    // extracting opcode of current instruction
    let opcode = IR.slice(25, 32);
    // instruction type of current instruction
    type = opcodeMap.get(opcode);
    immVal = "0";
    if(type == 'R'){
        // operation code
        operCode = IR.slice(17 ,20) + IR.slice(0, 7);

        let rd = IR.slice(20, 25);
        regFile.setRD(parseInt(rd, 2));

        let rs1 = IR.slice(12, 17);
        // console.log("rs1",);
        regFile.setRS1(parseInt(rs1, 2));

        let rs2 = IR.slice(7 ,12)
        regFile.setRS2(parseInt(rs2, 2));
        
        // updating RA and RB
        RA = regFile.getRS1();
        RB = regFile.getRS2();
    }
    else if(type == 'I'){
        // operation code
        operCode = opcode + IR.slice(17, 20);

        let rd = IR.slice(20, 25);
        console.log('rd', parseInt(rd, 2));
        regFile.setRD(parseInt(rd, 2));

        let rs1 = IR.slice(12, 17);
        regFile.setRS1(parseInt(rs1, 2));

        // as RS2 does not have any value
        regFile.setRS2(null);

        RA = regFile.getRS1();
        RB = regFile.getRS2();

        immVal = IR.slice(0, 12);
        // console.log('immVal', immVal);
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

        RA = regFile.getRS1();
        RB = regFile.getRS2();
        // RA has the base address
    }
    else if(type == 'SB'){
        // operation code
        operCode = opcode + IR.slice(17, 20);

        let rs1 = IR.slice(12, 17);
        regFile.setRS1(parseInt(rs1, 2));

        let rs2 = IR.slice(7 ,12)
        regFile.setRS2(parseInt(rs2, 2));

        immVal = IR.slice(0) + IR.slice(25) + IR.slice(1, 7) + IR.slice(20, 24);
        
        RA = regFile.getRS1();
        RB = regFile.getRS2();
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
    // console.log("value in RA => " + RA);
    // console.log("value in RB => " + RB);
    CLOCK+=1
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
    return parseInt(imVal, 2)>>0;
}

// Stage - 3
function Execute(instType : string, operCode : string, immVal : string){
    determineSelectLines(type);
    let inA :number = regFile.getRS1();
    let inB :number;
    if(selectLineB==1){
        inB = evaluateImm(immVal);
    }
    else{
        inB = regFile.getRS2()
    }
    console.log('inB inA', inB, inA);
    // finding operation to be performed
    let ALU_op = operationMap.get(operCode);

    if(ALU_op == 'add' || ALU_op == 'addi' || ALU_op == 'ld' || ALU_op == 'lb' || ALU_op == 'lh' || ALU_op == 'lw'){
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
    else if(ALU_op == 'andi' || ALU_op == 'and)'){
        RZ = inA&inB;
    }
    else if(ALU_op == 'ori' || ALU_op == 'or'){
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
        RZ = inA + inB;
    }
    else if(ALU_op == 'sb' || ALU_op == 'sw' || ALU_op == 'sd' || ALU_op == 'sh'){
        RZ = inA + evaluateImm(immVal);
        RM = RB;
        console.log('RM', RM);
    }
    else if(ALU_op == 'lui'){
        RZ = inB << 12;
    }
    else if(ALU_op == 'auipc'){
        inA = PC - 4;
        RZ = inA + (inB << 12)
    }
    else if(ALU_op == 'jal'){
        returnAddr = PC;
        UpdatePC(evaluateImm(immVal), 1);
        // TODO:jal
    }
    console.log('rz',RZ);
    CLOCK+=1;
}

// Stage - 4
function MemoryOperations(){
    let opr = operationMap.get(operCode);
    if(type == 'S'){
        MDR = RM;
        memFile.MEM_WRITE(RZ, RM, opr.slice(1));
    }
    else if(opr == 'ld'|| opr == 'lw'|| opr == 'lh'|| opr == 'lb'){
        MDR = memFile.MEM_READ(RZ, opr.slice(1));
    }

    // Updating RY
    if(selectLineY==0){
        RY = RZ;
    }
    else if(selectLineY==1){
        RY = MDR;
    }
    else if(selectLineY==2){
        RY = returnAddr;
    }
    else{
        console.error("Something's Wrong with the select line for muxY");
        return;
    }
    CLOCK+=1;
}

// Stage - 5
function WriteBack(){
    console.log('type', type);
    if(type == 'R'|| type == 'I' || type == 'U' || type == 'UJ'){
        regFile.setRegVal(regFile.getRD(), RY);
    }
    console.log("RY",RY);
    CLOCK+=1;
}
