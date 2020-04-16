// import * as rl from 'readline';
import { Decode } from './Decode';
import { Execute } from './ALU';
import { RegisterFile } from './RegFileClass';
import { opcodeMapfunc, operationMapfunc } from './MapPhase2';
import { MemoryFile, addZeros } from './MemFileClass'
import { MemoryOperations, WriteBack } from './MA_MWB';

export class GlobalVar {
    // PC->Program Counter, IR->Instruction Register
    static PC: number;
    static IR: string;
    static pcTemp: number;
    static regFile: RegisterFile;
    static memFile: MemoryFile;
    /* mode: 
    0=> Without Pipeline 
    1=> Pipelining with data forwarding 
    2=> Pipelining without data forwarding
    */
    static mode: number = 1;

    static CLOCK: number = 0;

    // Stats
    static totalInstructions: Number; //Stat2
    static numberOfDataTransfers: Number; //Stat4
    static numberOfALUInstr: Number; //Stat5
    static numberOfControlInstr: Number; // Stat6

    // Holds return address
    static returnAddr;

    // intermediate Registers
    static RA;
    static RB;
    static RZ;
    static RM;
    static RY;
    static MAR;
    static MDR;

    // instruction Type, operation Code, immediate Value
    static type: string;
    static operCode: string;
    static immVal: string;
    static ALU_op: string;

    // select line for muxB, muxY
    static selectLineB;
    static selectLineY = 1;

    // incase of invalid instruction
    static invalid: boolean;
    static isComplete: boolean;

    // holds the breakpoints
    static breakPoint: Array<number>;

    static instructionMap: Map<number, string>;
    // opcode map
    static opcodeMap: Map<string, string> = new Map<string, string>();
    // operation map
    static operationMap: Map<string, string> = new Map<string, string>();
}

export function getPC(): number {
    return GlobalVar.PC;
}
function getClock(): number {
    return GlobalVar.CLOCK;
}


export function getBreakPoint(): Array<number> {
    return GlobalVar.breakPoint;
}

export function addBreakPoint(instrPC: number) {
    let out = GlobalVar.breakPoint.find((e) => {
        return e == instrPC;
    })
    if (out === undefined) {
        GlobalVar.breakPoint.push(instrPC);
    }
}
// Helper function to remove Breakpoint
export function removeBreakPoint(instrPC: number) {
    GlobalVar.breakPoint = GlobalVar.breakPoint.filter((pc) => instrPC !== pc);
}



export function init(data): void {
    // Setting pc and clock
    GlobalVar.PC = 0;
    GlobalVar.CLOCK = 0;
    GlobalVar.isComplete = false;
    GlobalVar.invalid = false;
    GlobalVar.instructionMap = new Map<number, string>();
    GlobalVar.breakPoint = new Array<number>();
    let dataArr = data.split('\n');
    let i = 0;

    // Loading all instructions of program into instructionMap
    opcodeMapfunc(GlobalVar.opcodeMap);
    operationMapfunc(GlobalVar.operationMap);

    // Initializing Register File
    GlobalVar.memFile = new MemoryFile();
    GlobalVar.regFile = new RegisterFile();
    let currMemoIndex = 0;
    while (dataArr[i]) {
        let key = parseInt(dataArr[i].split(" ")[0], 16);
        let value = dataArr[i].split(" ")[1];
        GlobalVar.instructionMap.set(key, value);
        console.log()
        let index = 7;
        for (let i = 0; i < 8; i += 2) {
            let foo = value.replace('0x', '').slice(index - 1, index + 1);
            GlobalVar.memFile.WriteData(currMemoIndex, foo);
            currMemoIndex += 1;
            index -= 2;
        }
        i++;
        if ((parseInt(value) >> 0) == -1) {
            break;
        }
    }



    i++;
    while (dataArr[i]) {
        let temp = dataArr[i].split(' ');
        let key = temp[0];
        let value = temp[1];
        if (parseInt(value)) {
            GlobalVar.memFile.WriteData(parseInt(key, 16), value);
        }
        i++;
    }
}

export function getIsComplete() {
    return GlobalVar.isComplete
}

export function getInstrReg() {
    return GlobalVar.IR;
}
function showState(atEndAll?: boolean) {
    console.log(`Current PC: 0x${GlobalVar.PC.toString(16)}`);
    console.log("REGISTER");
    let tempReg = [];
    for (let i = 0; i < 32; i++) {
        tempReg.push({ i: (GlobalVar.regFile.getRegVal(i) >>> 0).toString(16) });
    }
    console.table(tempReg);
    if (GlobalVar.type == GlobalVar.opcodeMap.get('1100011') || atEndAll) {
        console.log("MEMORY");
        console.table(GlobalVar.memFile.getMemory());
    };
}

export function singleINS() {
    let no_inst: boolean = false;
    console.log('-----------**********------------')
    console.log(`Current PC: 0x${GlobalVar.PC.toString(16)}`);
    no_inst = Fetch();
    if (no_inst) {
        return;
    }
    Decode();
    if (GlobalVar.invalid) {
        return;
    }
    Execute(GlobalVar.immVal);
    MemoryOperations();
    WriteBack();
    GlobalVar.CLOCK += 1;
}

// Returns true if execution is complete
export function allINS() {
    let no_inst: boolean = false;
    let bp: boolean = false;
    console.log('-----------**********------------')
    console.log(`Current PC: 0x${GlobalVar.PC.toString(16)}`);
    let isBreakPointPC = GlobalVar.breakPoint.find(pc => pc == GlobalVar.PC);
    if (isBreakPointPC !== undefined) {
        // remove the current breakpoint
        removeBreakPoint(GlobalVar.PC);
        bp = true;
    }
    no_inst = Fetch();
    if (no_inst) {
        return true;
    }
    Decode();
    if (GlobalVar.invalid) {
        return true;
    }
    Execute(GlobalVar.immVal);
    MemoryOperations();
    WriteBack();
    GlobalVar.CLOCK += 1;
    if (bp) {
        return true;
    }
    return false;
}

function Fetch(): boolean {
    // Fetching the current Instruction
    let temp = GlobalVar.instructionMap.get(GlobalVar.PC);
    GlobalVar.pcTemp = GlobalVar.PC;
    GlobalVar.PC += 4;
    // Terminating Condition 
    if (!temp || (parseInt(temp) >> 0) == -1) {
        GlobalVar.CLOCK++;
        // Setting isComplete Flag as true
        GlobalVar.isComplete = true;
        return true;
    } else {
        temp = parseInt(temp, 16).toString(2);
        temp = addZeros(temp, 32);
        GlobalVar.IR = temp;
    }
    return false;
}

export function UpdatePC(PC_Select: number, inpImm?: number): void {
    GlobalVar.pcTemp = GlobalVar.PC;
    GlobalVar.PC -= 4;
    if (PC_Select == 0) {
        GlobalVar.PC = GlobalVar.RZ;
    }
    else {
        if (inpImm) {
            GlobalVar.PC += inpImm;
        }
        else {
            GlobalVar.PC += 4;
        }
    }
}
