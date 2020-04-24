import { GlobalVar } from "./Main";


class ISB1 {
    type: string;
    returnAddress;
    // For identification of jalr
    // operCode is opcode + func3 + func7
    operCode: string;
    RM;
    isBranchTaken: boolean = true;
    writeBackRegLocation: number;
}


class ISB2 {
    type: string;
    returnAddress;
    // operCode is opcode + func3 + func7
    operCode: string;
    writeBackRegLocation: number;

}


class ISB3 {
    type: string;
    returnAddress;
    // operCode is opcode + func3 + func7
    operCode: string;
    writeBackRegLocation: number;

}


class ISB4 {
    type: string;
    returnAddress;
    // operCode is opcode + func3 + func7
    operCode: string;
    writeBackRegLocation: number;

}

export class ProgramCounterBuffer {
    fetchPC: number;
    decodePC: number;
    executePC: number;
    memoryPC: number;
    writeBackPC: number;

    constructor() {
        this.fetchPC = -1;
        this.decodePC = -1;
        this.executePC = -1;
        this.memoryPC = -1;
        this.writeBackPC = -1;
    }
}

export class InterStateBuffer {
    isb1: ISB1;
    isb2: ISB2;
    isb3: ISB3;
    isb4: ISB4;

    // stored lastprediction for GUI
    lastPrediction: number;

    branchTargetBuffer: Map<number, { 'predictorState': boolean, 'branchTargetAddress': number }>;

    // This is entirely for GUI purposes
    pcBuf: ProgramCounterBuffer;

    // E2E = 1 | M2E = 2 | M2M = 3
    // ! Don't forget to set this null before every step
    dataForwardingType: Number;

    // Stores the Address of the Register
    prevWriteReg: Number;
    prevPrevWriteReg: Number;

    prevInstrMnenomic: string;
    prevPrevInstrMnenomic: string;

    // Rest stats are in GlobalVar
    numberOfStalls: number; // Stat7
    numberOfDataHazards: number; // Stat8
    numberOfControlHazard: number; // Stat9
    branchMispredictions: number; //Stat10
    numberOfDataHazardStalls: number; // Stat11
    numberOfControlHazardStalls: number; // Stat12

    branchAddressDef: number;
    branchAddress: number;
    controlHazardType: number;
    flushPipeline: boolean;
    stallAtDecode: boolean;
    // 1 means stall because of prevInstr and 2 means stall because of prevPrevInstr
    stallType: number;

    // return address is used in jal and jalr
    // writeBackRegLocation contains the register Location where updation will take place, for some instructions it is null

    constructor() {
        this.isb1 = new ISB1();
        this.isb2 = new ISB2();
        this.isb3 = new ISB3();
        this.isb4 = new ISB4();
        this.pcBuf = new ProgramCounterBuffer();
        this.branchMispredictions = 0;
        this.flushPipeline = false;
        this.stallAtDecode = false;
        this.stallType = null;
        this.lastPrediction = null;
        this.branchTargetBuffer = new Map<number, { 'predictorState': boolean, 'branchTargetAddress': number }>();
    }

    // GUI Exclusive functions
    updatePCBuffer() {
        this.pcBuf.writeBackPC = this.pcBuf.memoryPC;
        this.pcBuf.memoryPC = this.pcBuf.executePC;
        this.pcBuf.executePC = this.pcBuf.decodePC;
        this.pcBuf.decodePC = this.pcBuf.fetchPC;
        this.pcBuf.fetchPC = GlobalVar.pcTemp;
    }

    // pcBuf represents which hardware was used by the particular instruction in last clock cycle
    // In pcBuf it represents the last instruction executed
    updatePCBufferOnStall() {
        console.log('GlobalVar.stallCount', GlobalVar.stallCount);
        if (GlobalVar.isb.flushPipeline) {
            this.pcBuf.writeBackPC = this.pcBuf.memoryPC;
            this.pcBuf.memoryPC = this.pcBuf.executePC;
            this.pcBuf.executePC = this.pcBuf.decodePC;
            this.pcBuf.decodePC = this.pcBuf.fetchPC;
            this.pcBuf.fetchPC = -1;
            return;
        }
        if (GlobalVar.stallCount === 1) {
            // if stallcount is 1
            this.pcBuf.writeBackPC = this.pcBuf.memoryPC;
            this.pcBuf.memoryPC = this.pcBuf.executePC;
            // whatever had been decoded in last cycle executed in current cycle
            this.pcBuf.executePC = this.pcBuf.decodePC;
            // whatever was fetched in last cycle is decoded in current cycle and caused stalling
            this.pcBuf.decodePC = this.pcBuf.fetchPC;
            // because of stalling no fetching can be done
            this.pcBuf.fetchPC = -1;
        } else if (GlobalVar.stallCount >= 2) {
            // if stallcount is >=2
            this.pcBuf.writeBackPC = this.pcBuf.memoryPC;
            this.pcBuf.memoryPC = this.pcBuf.executePC;
            // decoded value cannot be passed to execute
            this.pcBuf.executePC = -1;
            // fetch is also -1
        } else {
            console.error('Wrong StallCount NOT POSSIBLE:', GlobalVar.stallCount)
        }


        // Not updating the decode or fetch! Since we need to decode the instruction in next clock cycle
    }
    // GUI Exclusive functions end


    updateInterStateBufferAfterDecode() {
        console.log("UPDATING ISB BECAUSE OF DECODE");
        this.isb4.writeBackRegLocation = this.isb3.writeBackRegLocation;
        this.isb3.writeBackRegLocation = this.isb2.writeBackRegLocation;
        console.warn(GlobalVar.type);
        // If R | I | U | UJ
        let type = GlobalVar.type;
        if (type === 'R' || type === 'I' || type === 'U' || type === 'UJ') {
            this.isb2.writeBackRegLocation = GlobalVar.regFile.getRDAddr();
            console.log(`(Type: ${type})Setting isb2 WriteBackRegLocation: `, this.isb2.writeBackRegLocation)
        } else {
            console.log(`(Type: ${type})Setting isb2 WriteBackRegLocation: null`);
            this.isb2.writeBackRegLocation = null;
        }
    }


    updateDataFlowOnFlush() {
        this.isb4.type = this.isb3.type;
        this.isb3.type = this.isb2.type;
        // updating type (Fundamental duty of decode) :)
        this.isb2.type = GlobalVar.type;

        this.isb4.returnAddress = this.isb3.returnAddress;
        this.isb3.returnAddress = this.isb2.returnAddress;
        this.isb2.returnAddress = this.isb1.returnAddress;


        this.isb4.operCode = this.isb3.operCode;
        this.isb3.operCode = this.isb2.operCode;
        if (this.isb2.type !== 'END') {
            this.isb2.operCode = GlobalVar.operCode;
        }

        this.isb4.writeBackRegLocation = this.isb3.writeBackRegLocation;
        this.isb3.writeBackRegLocation = this.isb2.writeBackRegLocation;

        // If R | I | U | UJ
        let type = GlobalVar.type;
        if (type === 'R' || type === 'I' || type === 'U' || type === 'UJ') {
            this.isb2.writeBackRegLocation = GlobalVar.regFile.getRDAddr();
            console.log(`(Type: ${type})Setting isb2 WriteBackRegLocation: `, this.isb2.writeBackRegLocation)
        } else {
            console.log(`(Type: ${type})Setting isb2 WriteBackRegLocation: null`);
            this.isb2.writeBackRegLocation = null;
        }
        
        // Since there was no fetch thus destroying data
        this.isb1.writeBackRegLocation = null;
        this.isb1.returnAddress = null;
        this.isb1.operCode = null;
        this.isb1.type = null;

        GlobalVar.type = null;
        GlobalVar.operCode = null;
        GlobalVar.IR = null;
        return
    }

    updateOnStall() {
        console.log("UPDATING ISB BECAUSE OF STALL");

        this.isb4.type = this.isb3.type;
        this.isb3.type = this.isb2.type;
        // this.isb3.type = null;

        // this.isb2.type = this.isb1.type;

        this.isb4.returnAddress = this.isb3.returnAddress;
        this.isb3.returnAddress = this.isb2.returnAddress;
        // this.isb3.returnAddress = null;

        this.isb4.operCode = this.isb3.operCode;
        this.isb3.operCode = this.isb2.operCode;
        // this.isb3.operCode = null;

        this.isb4.writeBackRegLocation = this.isb3.writeBackRegLocation;
        this.isb3.writeBackRegLocation = this.isb2.writeBackRegLocation;
        // this.isb3.writeBackRegLocation = null;

        this.isb2.writeBackRegLocation = null;
        this.isb2.returnAddress = null;
        this.isb2.operCode = null;
        this.isb2.type = null;

    }

    updateInterStateBuffer() {
        console.log("UPDATING ISB (normal)");
        this.isb4.returnAddress = this.isb3.returnAddress;
        this.isb3.returnAddress = this.isb2.returnAddress;
        this.isb2.returnAddress = this.isb1.returnAddress;
        // ! check alter of +4
        this.isb1.returnAddress = GlobalVar.pcTemp + 4;

        // Passing type to next Interstatebuffer
        this.isb4.type = this.isb3.type;
        this.isb3.type = this.isb2.type;
        console.warn(GlobalVar.type);
        // updating type (Fundamental duty of decode) :)
        this.isb2.type = GlobalVar.type;
        this.isb1.type = 'WILL_UPDATE_IN_NEXT_CYCLE';

        // Passing type to next Interstatebuffer
        this.isb4.operCode = this.isb3.operCode;
        this.isb3.operCode = this.isb2.operCode;
        if (this.isb2.type !== 'END') {
            this.isb2.operCode = GlobalVar.operCode;
        }
        // writeBackRegLocation is set after decode since it is the position where it's calculated
        // operCode directly set to isb2
        // this.isb4.writeBackRegLocation = this.isb3.writeBackRegLocation;
        // this.isb3.writeBackRegLocation = this.isb2.writeBackRegLocation;
        // this.isb2.writeBackRegLocation = this.isb1.writeBackRegLocation;
        // this.isb1.writeBackRegLocation = GlobalVar.regFile.getRDAddr();        
    }

    showInterStateBuffer() {
        console.log(`ISB1:`, this.isb1);
        console.log(`ISB2:`, this.isb2);
        console.log(`ISB3:`, this.isb3);
        console.log(`ISB4:`, this.isb4);
    }

}
