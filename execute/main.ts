import * as fs from 'fs';
import { addZeros } from '../encode/helperFun';
import { RegisterFile, MemoryFile } from './registerFile';

let pc: number, instrReg: string, pcTemp: number, regFile: RegisterFile, memFile: MemoryFile, imm, opcode, instrType, rA, rB, rd, inB, inA, func3, func7, rZ, rM;
let RF_write: boolean;
let selectLineB0, selectLineY0, selectLineY1;
let instructionMap: Map<number, string> = new Map<number, string>();

let opcodeMap: Map<string, string> = new Map<string, string>();

(function refMapForOpcode() {
    // R type
    opcodeMap.set('0110011', 'R');
    // I type
    opcodeMap.set('0010011', 'I');
    opcodeMap.set('0000011', 'IL');
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


let operatorMap: Map<any, any> = new Map<any, any>();

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
    // Setting pc and instrReg
    pc = 0;
    // instrReg = instructionMap.get(0);
    // console.log(instructionMap.get(4));
    // while (1) {
    fetch();
    decode();
    execute();
    mem();
    write_back();
    showState();
    // }

})();

// 
function evalControlLines() {
    // If the instruction is R type then selectLineB0 = 0
    if (instrType == 'R') {
        selectLineB0 = 0;
        // Setting RegisterFile Write Back as true
        RF_write = true;
    } else {
        selectLineB0 = 1;
    }
    if (instrType == 'I' || instrType == 'U' || instrType == 'UJ') {
        // Setting RegisterFile Write Back as true
        RF_write = true;
    }
    // If the instruction is jalr or auipc then selectLineY1 = 1
    if (opcode == "0010111" || opcode=='1100111') {
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
    temp = addZeros(temp, 32);
    instrReg = temp;
    opcode = instrReg.slice(25);
    instrType = opcodeMap.get(opcode)[0];
    // constructing immediate value
    // TODO: constructing immediate value and passing to MuxINC for Branch Instructions
    constructImm();
    // Determining Select Lines For Various Multiplexer
    evalControlLines();
    // storing PC in pcTemp
    console.log(instrType)
    pc += 4;
    pcTemp = pc;
}
// Function to Update PC when branch condition is true
function updatePC() {
    // Updating PC using pcTemp
    pc = pcTemp + parseInt(imm, 2);
}

function addOnes(imm: string, len: number) {
    let n = len - imm.length;
    while (n--) {
        imm = '1' + imm;
    }
    return imm;
}

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
        imm = addOnes(imm, 32);
        imm = ((parseInt(imm, 2) >> 0)).toString(2)
    } else {
        imm = addZeros(imm, 32);
    }
}

let addrA, addrB, addrD;
function decode() {
    if (instrType == 'R') {
        // rs1 = rA and rs2 = rB
        func3 = instrReg.slice(17, 20);
        func7 = instrReg.slice(0, 7);
        addrA = instrReg.slice(12, 17);
        addrB = instrReg.slice(7, 12);
        rB = regFile.readValue(parseInt(addrA, 2)).toString(2);
        rA = regFile.readValue(parseInt(addrA, 2)).toString(2);
        rM = rB;
        addrD = instrReg.slice(20, 25);
        console.log(parseInt(rA, 2), parseInt(rB, 2), parseInt(func3, 2));
    } else if (instrType == 'I') {
        func3 = instrReg.slice(17, 20);
        addrA = instrReg.slice(12, 17);
        addrD = instrReg.slice(20, 25);
        rA = regFile.readValue(parseInt(addrA, 2)).toString(2);
        console.log(parseInt(addrA, 2), parseInt(addrD, 2), rA, "CHEcK");
    }
}


function execute() {
    evalMuxB();
    // Passing inA to rA
    inA = rA;
    console.log(`Execute Started! inA = ${parseInt(inA, 2)} || inB = ${parseInt(inB, 2)}` )
    // If instruction type is SB then comparing and sending control signal to update the PC if the condition is true
    if (instrType == 'SB') {
        if (func3 == '000') {
            // beq
            if (parseInt(inA, 2) == parseInt(inB, 2)) {
                updatePC();
            }
        } else if (func3 == '001') {
            // bne
            if (parseInt(inA, 2) != parseInt(inB, 2)) {
                updatePC();
            }
        } else if (func3 == '101') {
            // bge
            if (parseInt(inA, 2) >= parseInt(inB, 2)) {
                updatePC();
            }
        } else if (func3 == '100') {
            // blt
            if (parseInt(inA, 2) < parseInt(inB, 2)) {
                updatePC();
            }
        }
    } else if (instrType == 'R') {
        console.log(func3, func7);
        let meta = operatorMap.get(func3 + func7);
        console.log(meta);
        if (meta) {
            if (meta.method == 'add') {
                rZ = parseInt(inA, 2) + parseInt(inB, 2);
            } else if (meta.method == 'and') {
                rZ = parseInt(inA, 2) & parseInt(inB, 2);
            } else if (meta.method == 'or') {
                rZ = parseInt(inA, 2) | parseInt(inB, 2);
            } else if (meta.method == 'sll') {
                rZ = parseInt(inA, 2) << parseInt(inB, 2);
            } else if (meta.method == 'slt') {
                rZ = parseInt(inA, 2) < parseInt(inB, 2);
            } else if (meta.method == 'sinA') {
                rZ = parseInt(inA, 2) >> parseInt(inB, 2);
            } else if (meta.method == 'srl') {
                rZ = parseInt(inA, 2) >>> parseInt(inB, 2);
            } else if (meta.method == 'sub') {
                rZ = parseInt(inA, 2) - parseInt(inB, 2);
            } else if (meta.method == 'xor') {
                rZ = parseInt(inA, 2) ^ parseInt(inB, 2);
            } else if (meta.method == 'mul') {
                rZ = parseInt(inA, 2) * parseInt(inB, 2);
            } else if (meta.method == 'div') {
                rZ = parseInt(inA, 2) / parseInt(inB, 2);
            } else if (meta.method == 'rem') {
                rZ = parseInt(inA, 2) % parseInt(inB, 2);
            }
        }
    } else if (instrType == 'I') {
        if (func3 == '000') {
            // addi and jalr
            rZ = parseInt(inA, 2) + parseInt(inB, 2);
        } else if (func3 == '111') {
            // andi
            rZ = parseInt(inA, 2) & parseInt(inB, 2);
            console.log("cec", inA, inB);

        } else if (func3 == '110') {
            // ori
            rZ = parseInt(inA, 2) | parseInt(inB, 2);

        }
        console.log(rZ);

    }
}

let MEM_read, MEM_write;

let rY, muxYop1;

function mem() {
    if (instrType == 'S') {
        MEM_write = true;
    } else if (instrType == 'I') {
        if (opcodeMap.get(opcode)[1] == 'L') {
            // Load Instructions
            MEM_read = true;
        }
    }
    // Using the memFile Interface to communicate with memory. And storing the option 1 of MuxY in muxYop1
    let res = memFile.process(rZ, MEM_read, MEM_write, rM);
    if (res) {
        muxYop1 = res.memoryData;
    }
    evalMuxY();
}

function evalMuxY() {
    let temp = selectLineY1*2 + selectLineY0;
    switch (temp) {
        case 0: {
            console.log("EVALMUXY: (rY = rZ) finalVal=>", parseInt(rZ, 2));
            rY = rZ;
            break;
        }
        case 1: {
            rY = muxYop1;
            console.log("EVALMUXY: (rY = muxYop1) finalVal=>", parseInt(rY, 2));
            break;
        }
        case 2: {
            rY = pcTemp;
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
        console.log(`${i} ${(regFile.readValue(i)>>>0).toString(16)}`);
    }

}

function evalMuxMA(){
    if(instrType=='I'){
        // jalr
        if(opcode=='1100111'){
            pc = rZ;
        }
    }
}