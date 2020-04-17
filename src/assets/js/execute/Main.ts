// import * as rl from 'readline';
import { Decode } from './Decode';
import { Execute } from './ALU';
import { RegisterFile } from './RegFileClass';
import { opcodeMapfunc, operationMapfunc } from './MapPhase2';
import { MemoryFile, addZeros } from './MemFileClass'
import { MemoryOperations, WriteBack } from './MA_MWB';
import { evaluateImm } from './helperFun';
import { InterStateBuffer } from './InterStateBuffer';

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
    // TODO: Handle Default Values
    static mode: number = 2;
    static pipelineEnabled: boolean = true;

    static CLOCK: number = 0;

    // Stats
    static totalInstructions: Number; //Stat2
    static numberOfDataTransfers: Number; //Stat4
    static numberOfALUInstr: Number; //Stat5
    static numberOfControlInstr: Number; // Stat6

    static isb: InterStateBuffer;
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
    GlobalVar.isb = new InterStateBuffer();
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
    Execute();
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
    Execute();
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
    // TODO: If pipelining is enabled
    if (GlobalVar.mode == 1 || GlobalVar.mode == 2) {
        let controlHazardType = detectControlHazard();
        // TODO: Create Branch Target Buffer And save addresses indexed by PC 
        let { branchAddressDef, branchAddress } = updateBranchAddress(controlHazardType);
        console.log("BRANCH: ", branchAddress, branchAddressDef);
        GlobalVar.isb.branchAddress = branchAddress;
        GlobalVar.isb.branchAddressDef = branchAddressDef;
        GlobalVar.isb.controlHazardType = controlHazardType;
    }
    return false;
}



function updateBranchAddress(controlHazardType: Number) {
    let branchAddress, branchAddressDef;
    if (controlHazardType == 3) {
        // Branch
        GlobalVar.immVal = GlobalVar.IR[0] + GlobalVar.IR[24] + GlobalVar.IR.slice(1, 7) + GlobalVar.IR.slice(20, 24);
        GlobalVar.immVal = (GlobalVar.immVal + '0');
        branchAddress = GlobalVar.PC - 4 + evaluateImm(GlobalVar.immVal);
        console.log("SettingNew BranchAddress as: ", branchAddress)
    } else if (controlHazardType == 2) {
        // jalr
        // !! Check if for JAL Branch address calculation is done here at fetch or not
        console.log("JAI")
        GlobalVar.immVal = GlobalVar.IR.slice(0, 12);
        let rs1 = GlobalVar.IR.slice(12, 17);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));
        let inA: number = GlobalVar.regFile.getRS1();
        branchAddress = GlobalVar.PC - 4 + inA + evaluateImm(GlobalVar.immVal);
    } else if (controlHazardType == 1) {
        // jal
        GlobalVar.immVal = GlobalVar.IR[0] + GlobalVar.IR.slice(12, 20) + GlobalVar.IR[11] + GlobalVar.IR.slice(1, 11);
        GlobalVar.immVal = (GlobalVar.immVal + '0');
        branchAddress = evaluateImm(GlobalVar.immVal) + GlobalVar.PC - 4;
    }
    branchAddressDef = GlobalVar.PC;
    return { branchAddressDef, branchAddress };
}


function detectControlHazard() {
    let opcode = GlobalVar.IR.slice(25, 32);
    // setting instruction type of current instruction
    GlobalVar.type = GlobalVar.opcodeMap.get(opcode);
    if (GlobalVar.type == 'SB') {
        // Branch
        return 3;
    } else if (opcode == '1100111') {
        // jalr
        return 2;
    } else if (GlobalVar.type == 'UJ') {
        // jal
        return 1;
    } else {
        return 0;
    }
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



/**
 * 
 * Pipeline functions
 * 
 * 
 */


export function singlePipelineStep() {
    console.log('-----------*****PIPE*****------------')
    console.log(`Current PC: 0x${GlobalVar.PC.toString(16)}`);
    let no_inst: boolean = false;
    if (GlobalVar.CLOCK === 0) {
        // Pipeline is empty! Only Fetch a new instruction
        pipelinedFetch(no_inst);
    } else if (GlobalVar.CLOCK === 1) {
        // Decode then Fetch
        pipelinedDecode();
        pipelinedFetch(no_inst);
    } else {
        // Execute then Decode then Fetch
        Execute();

    }
    GlobalVar.CLOCK++;

    GlobalVar.isb.showInterStateBuffer();
    console.log("CH", GlobalVar.PC);

    if (no_inst === false) {

    }
}


function pipelinedDecode() {
    // Decode Begin
    Decode();
    if (GlobalVar.isb.stallAtDecode === true) {
        // stall pipeline
        console.log("STALLING PIPELINE");
    }
    // Decode End    
}

function pipelinedFetch(no_inst) {
    // Fetch Begin
    no_inst = Fetch();
    // Updating the InterstateBuffer
    console.log(GlobalVar.pcTemp);
    GlobalVar.isb.updateInterStateBuffer();
    // If the fetched instruction is jal, beq, jalr
    if (GlobalVar.isb.controlHazardType) {
        // Overriding the updation of PC and pcTemp inside Fetch()
        GlobalVar.PC = GlobalVar.isb.branchAddress;
        GlobalVar.pcTemp = GlobalVar.PC;
    }
    // TODO: Run for four more times. If Last Instructions is fetched
    if (no_inst) {
        return;
    }
    // Fetch End
}