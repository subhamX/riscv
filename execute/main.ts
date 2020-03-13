import * as fs from 'fs';
import { addZeros } from '../encode/helperFun';
import { RegisterFile, MemoryFile } from './registerFile';

let pc: number, instrReg: string, pcTemp: number, regFile: RegisterFile, memFile: MemoryFile, imm, opcode, instrType, rA, rB, rd, inB, inA, func3, func7, rZ, rM;
let RF_write: boolean;
let selectLineB0, selectLineY0, selectLineY1;
let instructionMap: Map<number, string> = new Map<number, string>();
let operatorMap: Map<any, any> = new Map<any, any>();
// all address are in binary and values are in decimal
let addrA, addrB, addrD;
let opcodeMap: Map<string, string> = new Map<string, string>();

let MEM_read, MEM_write, type;
// rY and muxYop1 stores in decimal
let rY, muxYop1;

(function refMapForOpcode() {
    // R type
    opcodeMap.set('0110011', 'R');
    // I type
    opcodeMap.set('0010011', 'I');
    opcodeMap.set('0000011', 'I_L');
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
})();

const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function initOperatorMap() {
    // func3+func7 is key
    operatorMap.set("0000000000", { method: 'add', });
    operatorMap.set("1110000000", { method: 'and', });
    operatorMap.set("1100000000", { method: 'or', });
    operatorMap.set("0010000000", { method: 'sll', });
    operatorMap.set("0100000000", { method: 'slt', });
    operatorMap.set("1010100000", { method: 'sra', });
    operatorMap.set("1010000000", { method: 'srl', });
    operatorMap.set("0000100000", { method: 'sub', });
    operatorMap.set("1000000000", { method: 'xor', });
    operatorMap.set("0000000001", { method: 'mul', });
    operatorMap.set("1000000001", { method: 'div', });
    operatorMap.set("1100000001", { method: 'rem', });
}

(function init(): void {
    initOperatorMap();
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
    memFile = new MemoryFile();
    // let index = parseInt("0x10000005") - parseInt('0x10000000');
    // console.log(memFile.writeValue(index, '0x7FFFFFF0', 6));
    // Setting pc and instrReg
    pc = 0;
    // instrReg = instructionMap.get(0);
    // console.log(instructionMap.get(4));
    askQue();

})();

function askQue() {
    rl.question(`(pc: ${pc})Run Another Step Y/N?\n`, function (flag) {
        if (flag == 'N') {
            rl.close();
        } else {
            oneStep();
            askQue();
        }
    })
}

rl.on("close", function () {
    console.log("\nExiting...");
    process.exit(0);
});

function oneStep() {
    fetch();
    decode();
    execute();
    mem();
    write_back();
    // Setting all state to default one
    RF_write = false;
    MEM_read = MEM_write = false;
    showState();
}

// 
function evalControlLines() {
    // If the instruction is R or SB type then selectLineB0 = 0
    if (instrType == 'R' || instrType == 'SB') {
        selectLineB0 = 0;
    } else {
        selectLineB0 = 1;
    }
    if (instrType == 'I' || instrType == 'U' || instrType == 'UJ' || instrType == 'R') {
        // Setting RegisterFile Write Back as true
        console.log("TOGGLING RF_write to True");
        RF_write = true;
    }
    // If the instruction is jalr or jal then selectLineY1 = 1
    if (opcode == '1100111' || opcode == '1101111') {
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
    // if()
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
    temp = addZeros(temp, 32);
    instrReg = temp;
    opcode = instrReg.slice(25);
    instrType = opcodeMap.get(opcode).split("_")[0];
    // constructing immediate value
    // TODO: constructing immediate value and passing to MuxINC for Branch Instructions
    constructImm();
    // Determining Select Lines For Various Multiplexer
    evalControlLines();
    // storing PC in pcTemp
    console.log(instrType)
    pcTemp = pc;
    pc += 4;
}
// Function to Update PC when branch condition is true
function updatePC() {
    // Updating PC using pcTemp
    pc = pcTemp + convertBinaryToDecimal(imm);
    console.log("Branch Instruction or jal Encountered with condition True; NEW PC-", pc, "OLD PC-", pcTemp);
}

// Helper Function to AddOnes in Beginning
function addOnes(imm: string, len: number) {
    let n = len - imm.length;
    while (n--) {
        imm = '1' + imm;
    }
    return imm;
}

// Function to re-construct the immediate field from the encoded 32 bit binary instruction
function constructImm() {
    if (instrType == 'I') {
        imm = instrReg.slice(0, 12);
    } else if (instrType == 'SB') {
        let temp = instrReg.split('').reverse().join('');
        imm = temp.slice(8, 12) + temp.slice(25, 31) + temp[7] + temp[31];
        imm = imm.split('').reverse().join('');
        imm = imm + '0';
    } else if (instrType == 'S') {
        let temp = instrReg.split('').reverse().join('');
        imm = temp.slice(7, 12) + temp.slice(25);
        imm = imm.split('').reverse().join('');
    } else if (instrType == 'U') {
        imm = instrReg.slice(0, 20);
    } else if (instrType == 'UJ') {
        imm = instrReg.slice(1, 11).split('').reverse().join('') + instrReg[11] + instrReg.slice(12, 19).split('').reverse().join('') + instrReg[0];
        imm = imm.split('').reverse().join('');
        imm = imm + '0';
        console.log(imm);
    } else {
        console.error("Instruction is R Type. No imm calculation required");
        return;
    }
    // If the MSB is 1 then adding 1's to create a 32 length imm
    if (imm[0] == '1') {
        // imm value is negative
        imm = addOnes(imm, 32);
        imm = ((parseInt(imm, 2) >> 0)).toString(2)
    } else {
        // imm value is positive
        imm = addZeros(imm, 32);
    }
}


function decode() {
    if (instrType == 'R') {
        // rs1 = rA and rs2 = rB
        func3 = instrReg.slice(17, 20);
        func7 = instrReg.slice(0, 7);
        addrA = instrReg.slice(12, 17);
        addrB = instrReg.slice(7, 12);
        rB = (regFile.readValue(parseInt(addrB, 2)) >>> 0).toString(2);
        rA = (regFile.readValue(parseInt(addrA, 2)) >>> 0).toString(2);
        rM = rB;
        addrD = instrReg.slice(20, 25);
        console.log(parseInt(rA, 2), parseInt(rB, 2), parseInt(func3, 2));
    } else if (instrType == 'I') {
        func3 = instrReg.slice(17, 20);
        addrD = instrReg.slice(20, 25);
        addrA = instrReg.slice(12, 17);
        rA = (regFile.readValue(parseInt(addrA, 2)) >>> 0).toString(2);
        console.log(parseInt(addrA, 2), parseInt(addrD, 2), rA, "CHEcK");
    } else if (instrType == 'SB') {
        // rs1 = rA and rs2 = rB
        func3 = instrReg.slice(17, 20);
        addrA = instrReg.slice(12, 17);
        addrB = instrReg.slice(7, 12);
        rB = (regFile.readValue(parseInt(addrB, 2)) >>> 0).toString(2);
        rA = (regFile.readValue(parseInt(addrA, 2)) >>> 0).toString(2);
        // rM = rB;
        // addrD = instrReg.slice(20, 25);
        console.log(parseInt(addrA, 2), parseInt(addrB, 2), parseInt(func3, 2));
    } else if (instrType == 'S') {
        func3 = instrReg.slice(17, 20);
        addrD = instrReg.slice(20, 25);
        addrA = instrReg.slice(12, 17);
        addrB = instrReg.slice(7, 12);
        rB = (regFile.readValue(parseInt(addrB, 2)) >>> 0).toString(2);
        rA = (regFile.readValue(parseInt(addrA, 2)) >>> 0).toString(2);
        console.log(parseInt(addrA, 2), parseInt(addrB, 2), parseInt(func3, 2));
    } else if (instrType == 'U') {
        // Fetching destination address
        addrD = instrReg.slice(20, 25);
    } else if (instrType == 'UJ') {
        // jal
        // Since this is unconditional jump thus updating the PC in decode step itself
        updatePC();
        addrD = instrReg.slice(20, 25);
    }

}

function convertBinaryToDecimal(value: string): number {
    return parseInt(value, 2) >> 0;
}

function convertDecimalToBinary(value: number) {
    if (value)
        return (value >>> 0).toString(2);
}

function execute() {
    evalMuxB();
    // Passing inA to rA
    inA = rA;
    console.log(`Execute Started! inA = ${parseInt(inA, 2)} || inB = ${parseInt(inB, 2)}`)
    // If instruction type is SB then comparing and sending control signal to update the PC if the condition is true
    if (instrType == 'SB') {
        if (func3 == '000') {
            // beq
            if (convertBinaryToDecimal(inA) == convertBinaryToDecimal(inB)) {
                updatePC();
            }
        } else if (func3 == '001') {
            // bne
            if (convertBinaryToDecimal(inA) != convertBinaryToDecimal(inB)) {

                updatePC();
            }
        } else if (func3 == '101') {
            // bge
            if (convertBinaryToDecimal(inA) >= convertBinaryToDecimal(inB)) {

                updatePC();
            }
        } else if (func3 == '100') {
            // blt
            if (convertBinaryToDecimal(inA) < convertBinaryToDecimal(inB)) {

                updatePC();
            }
        }
    } else if (instrType == 'R') {
        console.log(func3, func7);
        let meta = operatorMap.get(func3 + func7);
        console.log(meta);
        if (meta) {
            if (meta.method == 'add') {
                rZ = convertBinaryToDecimal(inA) + convertBinaryToDecimal(inB);
            } else if (meta.method == 'and') {
                rZ = convertBinaryToDecimal(inA) & convertBinaryToDecimal(inB);
            } else if (meta.method == 'or') {
                rZ = convertBinaryToDecimal(inA) | convertBinaryToDecimal(inB);
            } else if (meta.method == 'sll') {
                rZ = convertBinaryToDecimal(inA) << convertBinaryToDecimal(inB);
            } else if (meta.method == 'slt') {
                rZ = convertBinaryToDecimal(inA) < convertBinaryToDecimal(inB);
                rZ = parseInt(inA, 2) < parseInt(inB, 2);
            } else if (meta.method == 'sinA') {
                rZ = convertBinaryToDecimal(inA) >> convertBinaryToDecimal(inB);
            } else if (meta.method == 'srl') {
                rZ = convertBinaryToDecimal(inA) >>> convertBinaryToDecimal(inB);
            } else if (meta.method == 'sub') {
                rZ = convertBinaryToDecimal(inA) - convertBinaryToDecimal(inB);
                console.log("CHECK", parseInt(inA, 2), parseInt(inB, 2));
            } else if (meta.method == 'xor') {
                rZ = convertBinaryToDecimal(inA) ^ convertBinaryToDecimal(inB);
            } else if (meta.method == 'mul') {
                rZ = convertBinaryToDecimal(inA) * convertBinaryToDecimal(inB);
            } else if (meta.method == 'div') {
                rZ = convertBinaryToDecimal(inA) / convertBinaryToDecimal(inB);
            } else if (meta.method == 'rem') {
                rZ = convertBinaryToDecimal(inA) % convertBinaryToDecimal(inB);
            }
        }
    } else if (instrType == 'I') {
        if (opcodeMap.get(opcode) == 'I_L') {
            // Instruction is load
            rZ = convertBinaryToDecimal(inA) + convertBinaryToDecimal(inB);
            // rM = rB;
        } else {
            if (func3 == '000') {
                // addi and jalr
                rZ = convertBinaryToDecimal(inA) + convertBinaryToDecimal(inB);
            } else if (func3 == '111') {
                // andi
                rZ = convertBinaryToDecimal(inA) & convertBinaryToDecimal(inB);
                console.log("cec", inA, inB);
            } else if (func3 == '110') {
                // ori
                rZ = convertBinaryToDecimal(inA) | convertBinaryToDecimal(inB);
            }
        }

    } else if (instrType == 'S') {
        // store instructions
        rZ = convertBinaryToDecimal(inA) + convertBinaryToDecimal(inB);
        rM = rB;
    } else if (instrType == 'U') {
        if (opcode == '0010111') {
            // auipc
            inA = pcTemp - 4;
            rZ = ((convertBinaryToDecimal(inB)) << 12) + inA;
        } else if (opcode == '0110111') {
            // lui
            rZ = ((convertBinaryToDecimal(inB)) << 12);
        }
    }
    rZ = convertDecimalToBinary(rZ);
    console.log(`ALU Operation Complete: rZ in binary=${rZ}`);

}

function mem() {
    if (instrType == 'S') {
        MEM_write = true;
    } else if (instrType == 'I') {
        if (opcodeMap.get(opcode) == 'I_L') {
            // Load Instructions
            MEM_read = true;
        }
    }
    // if instructions is load or store
    if (opcode == '0100011' || opcode == '0000011') {
        if (func3 == "000") {
            type = 'b';
        } else if (func3 == '010') {
            type = 'w';
        } else if (func3 == '011') {
            type = 'd';
        } else if (func3 == '001') {
            type = 'h';
        }
    } else {
        type = '';
    }
    console.log(opcode, func3);
    // Using the memFile Interface to communicate with memory. And storing the option 1 of MuxY in muxYop1
    console.log(`${rZ} ${rM} ${type}`);
    // rM will be undefined for load instructions
    let res = memFile.process(rZ, MEM_read, MEM_write, rM, type);
    if (res) {
        muxYop1 = res.memoryData;
    }
    evalMuxY();
}

function evalMuxY() {
    let temp = selectLineY1 * 2 + selectLineY0;
    switch (temp) {
        case 0: {
            console.log("EVALMUXY: (rY = rZ) finalVal=>", parseInt(rZ, 2));
            rY = convertBinaryToDecimal(rZ);
            break;
        }
        case 1: {
            rY = muxYop1;
            console.log("EVALMUXY: (rY = muxYop1) finalVal=>", parseInt(rY, 2));
            break;
        }
        case 2: {
            rY = pcTemp + 4;
            console.log("EVALMUXY: (rY = pcTemp) finalVal=>", parseInt(rY, 2));
            break;
        }
        case 3: {
            console.log("MuxY Error");
            break;
        }
    }
    // sending signal to MuxMA
    evalMuxMA();
    if (selectLineB0) {
        inB = imm;
    } else {
        inB = rB;
    }
}



function write_back() {
    if (RF_write) {
        console.log('Writing Back to: ', parseInt(addrD, 2));
        // console.log(rY);
        regFile.writeValue(parseInt(addrD, 2), rY);
    }
}


function evalMuxB() {
    if (selectLineB0) {
        inB = imm;
        console.log("EVALMUXB: (inB = imm) imm=>", parseInt(imm, 2));
    } else {
        console.log("EVALMUXB: (inB = rB) rb=>", parseInt(rB, 2));
        inB = rB;
    }
}




function showState() {
    console.log(`Current PC: ${pc}`);
    for (let i = 0; i < 32; i++) {
        console.log(`${i} ${(regFile.readValue(i) >>> 0).toString(16)}`);
    }
    // let index = parseInt("0x10000064") - parseInt('0x10000000');
    // console.log(memFile.readValue(index, 100));
}

function evalMuxMA() {
    if (instrType == 'I') {
        // jalr
        if (opcode == '1100111') {
            pc = rZ;
        }
    }

}