// import * as rl from 'readline';
import { Decode } from './Decode';
import { Execute } from './ALU';
import { RegisterFile } from './RegFileClass';
import { opcodeMapfunc, operationMapfunc } from './MapPhase2';
import { MemoryFile, addZeros } from './MemFileClass'
import { MemoryOperations, WriteBack } from './MA_MWB';
import { evaluateImm } from './helperFun';
import { InterStateBuffer, ExecutionStats } from './InterStateBuffer';

// For pipelined step and run
let noInstr: boolean = false;
let times: number = 0;

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
    static mode: number = 0;
    static pipelineEnabled: boolean = false;
    static branchPredEnabled: boolean = true;

    static CLOCK: number = 0;
    static stallCount: number;
    static isBranchTaken: boolean;

    // Stats
    static execStats: ExecutionStats;

    static isb: InterStateBuffer;
    // Holds return address
    static returnAddr;

    // intermediate Registers
    static RZ;
    static RY;

    static RA;
    static RB;
    static RM;

    static MAR;
    static MDR;

    static inA;
    static inB;

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

export function getPhase3Stats() {
    // static totalInstructions: number; //Stat2 [At pipelinedFetch]
    // static numberOfDataTransfers: number; //Stat4 [AT Memory]
    // TODO: static numberOfControlInstr: number; // Stat6
    // TODO: static numberOfALUInstr: number; //Stat5 [total-control-datatransfers]
    // TODO: numberOfControlHazard: number; // Stat9 
    //      [branchPred: 1 => If misprediction then add 1 || 0 => Equal to number of numberOfControlHazardStalls/2]
    // ? branchMispredictions: number; //Stat10 [ASK SIR]
    //      For JALR it may happen that there is no branchMisprediction but we need to stall
    // ! numberOfStalls: number; // Stat7 [numberOfDataHazardStalls+numberOfControlHazardStalls] (CHECK)

    // ! numberOfDataHazards: number; // Stat8
    // ! numberOfDataHazardStalls: number; // Stat11
    // ! numberOfControlHazardStalls: number; // Stat12
    //      
    return {
        'totalInstructions': GlobalVar.execStats.totalInstructions,
        'numberOfDataTransfers': GlobalVar.execStats.numberOfDataTransfers,
        'numberOfALUInstr': GlobalVar.execStats.numberOfALUInstr,
        'numberOfControlInstr': GlobalVar.execStats.numberOfControlInstr,
        'numberOfStalls': GlobalVar.execStats.numberOfStalls,
        'numberOfDataHazards': GlobalVar.execStats.numberOfDataHazards,
        'numberOfControlHazard': GlobalVar.execStats.numberOfControlHazard,
        'branchMispredictions': GlobalVar.execStats.branchMispredictions,
        'numberOfDataHazardStalls': GlobalVar.execStats.numberOfDataHazardStalls,
        'numberOfControlHazardStalls': GlobalVar.execStats.numberOfControlHazardStalls
    }
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

export function getAdditonalRegisters() {
    return {
        'RZ': GlobalVar.RZ,
        'RY': GlobalVar.RY,
        'CLOCK': GlobalVar.CLOCK,
        'RA': GlobalVar.RA,
        'RB': GlobalVar.RB,
        'inA': GlobalVar.inA,
        'inB': GlobalVar.inB,
        'RM': GlobalVar.RM,
        'MDR': GlobalVar.MDR
    }
}


export function init(data): void {
    // setting pipeline enabled flag
    if (GlobalVar.mode === 1 || GlobalVar.mode === 2) {
        GlobalVar.pipelineEnabled = true;
    } else if (GlobalVar.mode === 0) {
        GlobalVar.pipelineEnabled = false;
    }
    // Setting pc and clock
    GlobalVar.PC = 0;
    GlobalVar.CLOCK = 0;
    // variable used in case of pipelined instructions
    times = 0;
    noInstr = false;
    GlobalVar.RZ = null;
    GlobalVar.RA = null;
    GlobalVar.RB = null;
    GlobalVar.inA = null;
    GlobalVar.RM = null;
    GlobalVar.MDR = null;
    GlobalVar.inB = null;
    GlobalVar.RY = null;
    GlobalVar.stallCount = 0;
    GlobalVar.operCode = null;
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

    // Resetting Execution Stats
    GlobalVar.execStats = new ExecutionStats();

    // Initializing Register File
    GlobalVar.memFile = new MemoryFile();
    GlobalVar.regFile = new RegisterFile();
    let currMemoIndex = 0;
    while (dataArr[i]) {
        let key = parseInt(dataArr[i].split(" ")[0], 16);
        let value = dataArr[i].split(" ")[1];
        GlobalVar.instructionMap.set(key, value);
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


// Returns true if last instruction is fetched
function Fetch(): boolean {
    // Fetching the current Instruction
    let temp = GlobalVar.instructionMap.get(GlobalVar.PC);
    GlobalVar.pcTemp = GlobalVar.PC;
    GlobalVar.PC += 4;
    // pcTemp points to current instruction and PC points to next instruction

    // Terminating Condition 
    if (!temp || (parseInt(temp) >> 0) == -1) {
        if (!GlobalVar.pipelineEnabled) {
            GlobalVar.CLOCK++;
            // Setting isComplete Flag as true if pipeline disabled 
            GlobalVar.isComplete = true;
            return true;
        } else {
            temp = parseInt(temp, 16).toString(2);
            GlobalVar.IR = temp;
            return true;
        }
    } else {
        temp = parseInt(temp, 16).toString(2);
        temp = addZeros(temp, 32);
        GlobalVar.IR = temp;
    }
    return false;
}


/**
 * ! START
 */
function updateBranchAddress(controlHazardType: Number) {
    let branchAddress, branchAddressDef, immVal;
    if (controlHazardType == 3) {
        // Branch
        immVal = GlobalVar.IR[0] + GlobalVar.IR[24] + GlobalVar.IR.slice(1, 7) + GlobalVar.IR.slice(20, 24);
        immVal = (immVal + '0');
        branchAddress = GlobalVar.PC - 4 + evaluateImm(immVal);
        console.log("SettingNew BranchAddress as: ", branchAddress)
    } else if (controlHazardType == 2) {
        // jalr
        // !! Check if for JAL Branch address calculation is done here at fetch or not
        console.log("JAI")
        immVal = GlobalVar.IR.slice(0, 12);
        let rs1 = GlobalVar.IR.slice(12, 17);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));
        let inA: number = GlobalVar.regFile.getRS1();
        branchAddress = GlobalVar.PC - 4 + inA + evaluateImm(immVal);
    } else if (controlHazardType == 1) {
        // jal
        immVal = GlobalVar.IR[0] + GlobalVar.IR.slice(12, 20) + GlobalVar.IR[11] + GlobalVar.IR.slice(1, 11);
        immVal = (immVal + '0');
        branchAddress = evaluateImm(immVal) + GlobalVar.PC - 4;
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

/**
 * ! END
 */



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

// Returns true if execution is complete
// TODO: Need attention
export function pipelinedAllINS() {
    // Setting dataForwardingType as null
    GlobalVar.isb.dataForwardingType = null;
    let no_inst: boolean = false;
    let bp: boolean = false;
    console.log('-----------*****PIPEALL*****------------')
    console.log(`Current PC: 0x${GlobalVar.PC.toString(16)}`);
    let isBreakPointPC = GlobalVar.breakPoint.find(pc => pc == GlobalVar.PC);
    if (isBreakPointPC !== undefined) {
        // remove the current breakpoint
        removeBreakPoint(GlobalVar.PC);
        bp = true;
    }
    if (GlobalVar.isComplete) {
        console.log("ALREADY COMPLETE: times: ", times);
        return true;
    }
    if (GlobalVar.CLOCK === 0) {
        // Pipeline is empty! Only Fetching a new instruction
        noInstr = pipelinedFetch(noInstr);
    } else if (GlobalVar.CLOCK === 1) {
        // Decode then Fetch
        let res = pipelinedDecode();
        if (res === true) {
            // If stall is true
            GlobalVar.isb.updatePCBufferOnStall();
            GlobalVar.CLOCK++;
            return;
        }
        noInstr = pipelinedFetch(noInstr);
    } else if (GlobalVar.CLOCK === 2) {
        // Execute then Decode then Fetch
        console.log("NEW CHECK:", evaluateImm(GlobalVar.immVal));
        pipelinedExecute();
        let res = pipelinedDecode();
        if (res === true) {
            // If stall is true
            GlobalVar.isb.updatePCBufferOnStall();
            GlobalVar.CLOCK++;
            return;
        }
        noInstr = pipelinedFetch(noInstr);
    } else if (GlobalVar.CLOCK === 3) {
        // Memory then Execute then Decode then Fetch
        pipelinedMemory();
        pipelinedExecute();
        let res = pipelinedDecode();
        if (res === true) {
            // If stall is true
            GlobalVar.isb.updatePCBufferOnStall();
            GlobalVar.CLOCK++;
            return;
        }
        noInstr = pipelinedFetch(noInstr);
    } else {
        // Run all steps WriteBack then Memory then Execute then Decode then Fetch
        pipelineWriteBack();
        pipelinedMemory()
        pipelinedExecute();
        let res = pipelinedDecode();
        if (res === true) {
            // If stall is true
            GlobalVar.isb.updatePCBufferOnStall();
            GlobalVar.CLOCK++;
            return;
        }
        noInstr = pipelinedFetch(noInstr);
    }
    GlobalVar.CLOCK++;
    if (bp) {
        return true;
    }
    return false;
}


export function singlePipelineStep() {
    // Setting dataForwardingType as null
    GlobalVar.isb.dataForwardingType = null;

    console.log('-----------*****PIPE*****------------');
    console.table(getPhase3Stats());
    console.log(`Current PC: 0x${GlobalVar.PC.toString(16)}`);
    // console.log("OLD: ", GlobalVar.isb.pcBuf);
    if (GlobalVar.isComplete) {
        console.log("ALREADY COMPLETE: times: ", times);
        return;
    }


    if (GlobalVar.CLOCK === 0) {
        // Pipeline is empty
        // Fetch
        noInstr = pipelinedFetch(noInstr);
    } else if (GlobalVar.CLOCK === 1) {
        // Decode -> Fetch
        let res = pipelinedDecode();
        if (res === true) {
            // If stall is true
            GlobalVar.CLOCK++;
            return;
        }
        noInstr = pipelinedFetch(noInstr);
    } else if (GlobalVar.CLOCK === 2) {
        // Execute -> Decode -> Fetch
        console.log("NEW CHECK:", evaluateImm(GlobalVar.immVal));
        let flushRes = pipelinedExecute();
        if (flushRes) {
            // If flush is true
            GlobalVar.CLOCK++;
            return;
        }
        let res = pipelinedDecode();
        if (res === true) {
            // If stall is true
            GlobalVar.CLOCK++;
            return;
        }
        noInstr = pipelinedFetch(noInstr);
    } else if (GlobalVar.CLOCK === 3) {
        // Memory -> Execute -> Decode -> Fetch
        pipelinedMemory();
        let flushRes = pipelinedExecute();
        if (flushRes) {
            // If flush is true
            GlobalVar.CLOCK++;
            return;
        }
        let res = pipelinedDecode();
        if (res === true) {
            // stall is true
            // updating pc buffer for GUI 
            GlobalVar.CLOCK++;
            return;
        }
        noInstr = pipelinedFetch(noInstr);
    } else {
        // WriteBack -> Memory -> Execute -> Decode -> Fetch
        pipelineWriteBack();
        pipelinedMemory()
        let flushRes = pipelinedExecute();
        if (flushRes) {
            // If flush is true
            GlobalVar.CLOCK++;
            return;
        }
        let res = pipelinedDecode();
        if (res === true) {
            // If stall is true
            GlobalVar.CLOCK++;
            return;
        }
        noInstr = pipelinedFetch(noInstr);
    }
    GlobalVar.CLOCK++;

    // GlobalVar.isb.showInterStateBuffer();
}




function pipelinedMemory() {
    MemoryOperations();
}


function pipelinedDecode(): boolean {
    // Make sure to nullify the stallType before calling actual Decode
    GlobalVar.isb.stallType = null;

    Decode();

    console.log("StallAtDecode:Bool =>", GlobalVar.isb.stallAtDecode);

    if (GlobalVar.isb.stallAtDecode === true) {
        // stall pipeline
        console.log("STALLING PIPELINE! Returning true from Decode");
        GlobalVar.stallCount++;
        GlobalVar.isb.updateOnStall();
        GlobalVar.isb.updatePCBufferOnStall();
        return true;
    } else {
        if(GlobalVar.stallCount!=0){
            // Previously there was stalling. Not updating decodePC
            prevStall=true;
        }else{
            prevStall=false;
        }
        GlobalVar.stallCount = 0;
        GlobalVar.isb.updateInterStateBufferAfterDecode();
        return false;
    }
}

let prevStall:boolean = false;
/**
 * 
 * @param no_inst : Returns state of the current execution
 * true -> Means no new instruction need to be fetched
 */
function pipelinedFetch(no_inst): boolean {
    // setting lastPrediction as null
    GlobalVar.isb.lastPrediction = null;

    GlobalVar.isb.branchAddress = null;

    console.log("FETCH: PC", GlobalVar.PC);

    // If no instructions then returning true
    if (no_inst) {
        // Updating Inter State Buffer
        GlobalVar.isb.updateInterStateBuffer();
        GlobalVar.isb.updatePCBuffer();

        GlobalVar.isb.pcBuf.fetchPC = -1;
        GlobalVar.PC = -1;

        times++;
        console.log("SETTING times as: ", times);
        if (times === 4) {
            GlobalVar.isComplete = true;
        }
        return true;
    }
    // incrementing total number of instructions
    GlobalVar.execStats.totalInstructions += 1;

    no_inst = Fetch();

    // PC is pointing to next instruction and pcTemp is pointing to current one
    if (GlobalVar.branchPredEnabled) {
        // TODO: Create Branch Target Buffer And save addresses indexed by PC 
        if (GlobalVar.isb.branchTargetBuffer.has(GlobalVar.pcTemp)) {
            let instance = GlobalVar.isb.branchTargetBuffer.get(GlobalVar.pcTemp);
            console.log(instance);
            // If predictor state is true
            if (instance.predictorState) {
                // setting lastPrediction as 1
                GlobalVar.isb.lastPrediction = 1;

                // GlobalVar.isb.pcBuf.decodePC = GlobalVar.pcTemp;
                GlobalVar.isb.branchAddress = instance.branchTargetAddress;
                GlobalVar.isb.branchAddressDef = GlobalVar.PC;

                // pcTemp will be used by decode
                GlobalVar.PC = GlobalVar.isb.branchAddress;
            } else {
                GlobalVar.isb.lastPrediction = 0;
            }
        } else {
            console.warn("No state found");
        }
    }

    if (no_inst) {
        GlobalVar.PC = -1;
    }

    // Updating the InterstateBuffer
    GlobalVar.isb.updatePCBuffer(prevStall);
    // Updating Inter State Buffer
    GlobalVar.isb.updateInterStateBuffer();

    return no_inst;
}


function pipelinedExecute() {
    // overriding any previous values
    GlobalVar.isb.flushPipeline = false;
    // Calling main function
    Execute();
    // Checking if I need to flushPipeline or not
    if (GlobalVar.isb.flushPipeline) {
        console.error('FLUSHING<< Adding 2 to numberOfControlHazardStalls');

        GlobalVar.execStats.numberOfControlHazardStalls+=2;
        // updating prev and prevPrev instruction metadata
        GlobalVar.isb.prevPrevInstrMnenomic = null;
        GlobalVar.isb.prevInstrMnenomic = null;

        GlobalVar.isb.prevPrevWriteReg = null;
        GlobalVar.isb.prevWriteReg = null;

        GlobalVar.isb.updateDataFlowOnFlush();
        GlobalVar.isb.updatePCBufferOnFlush();
        return true;
    }
    return false;
}


function pipelineWriteBack() {
    WriteBack();
}