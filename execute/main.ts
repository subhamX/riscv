import * as fs from 'fs';


let pc: number, instr_reg: string;
let selectLineB, selectLineY0, selectLineY1;
let instructionMap: Map<number, string> = new Map<number, string>();
function init(): void {
    let data = fs.readFileSync(__dirname + "/test/data.m", { encoding: "utf-8" });
    let dataArr = data.split('\n');
    let i = 0;
    // Loading all instructions into instructionMap
    while (dataArr[i]) {
        let key = parseInt(dataArr[i].split(" ")[0], 16);
        let value = dataArr[i].split(" ")[1];
        instructionMap.set(key, value);
        i++;
    }
    // Setting pc and instr_reg
    pc = 0;
    // instr_reg = instructionMap.get(0);
    // console.log(instructionMap.get(4));
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


function fetch() {
    // Fetching the current Instruction
    instr_reg = instructionMap.get(pc);

}

interface generateIAPayloadInterface {selectLineINC0, imm, selectLinePC0, returnAddress};

// Function updates Program Counter
function generateInstructionAddress(generateIAPayload:generateIAPayloadInterface) {
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