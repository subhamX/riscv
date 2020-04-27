import { GlobalVar } from "./Main";


// returnAddress acts as branchAddressDef
// branchAddress tells if branch is taken. Will be used by Execute to find if there is misprediction or not
// ! We don't need to use it. Its value is same as predictor state

// operCode is opcode + func3 + func7. For identification of jalr
// writeBackRegLocation contains the writebacklocation. Will be used by WriteBack
// type contains the instruction mnenomic
// branchAddress used to check if jalr target address is same or not


export class ExecutionStats {
    totalInstructions: number; //Stat2
    numberOfDataTransfers: number; //Stat4
    numberOfALUInstr: number; //Stat5
    numberOfControlInstr: number; // Stat6
    numberOfStalls: number; // Stat7
    numberOfDataHazards: number; // Stat8
    numberOfControlHazard: number; // Stat9
    branchMispredictions: number; //Stat10
    numberOfDataHazardStalls: number; // Stat11
    numberOfControlHazardStalls: number; // Stat12

    constructor() {
        this.totalInstructions = 0;
        this.numberOfDataTransfers = 0;
        this.numberOfALUInstr = 0;
        this.numberOfControlInstr = 0;
        this.numberOfStalls = 0;
        this.numberOfDataHazards = 0;
        this.numberOfControlHazard = 0;
        this.branchMispredictions = 0;
        this.numberOfDataHazardStalls = 0;
        this.numberOfControlHazardStalls = 0;
    }
}


class ISB1 {
    type: string;
    returnAddress: number;
    branchAddress: number;
    // branchAddress: boolean = true;
    operCode: string;
    writeBackRegLocation: number;
    // RM;
}


class ISB2 {
    type: string;
    returnAddress: number;
    branchAddress: number;
    // branchAddress: boolean = true;
    operCode: string;
    writeBackRegLocation: number;
}


class ISB3 {
    type: string;
    returnAddress: number;
    branchAddress: number;
    // branchAddress: boolean = true;
    operCode: string;
    writeBackRegLocation: number;

}


class ISB4 {
    type: string;
    returnAddress: number;
    branchAddress: number;
    // branchAddress: boolean = true;
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

    // This is entirely for GUI purposes
    pcBuf: ProgramCounterBuffer;

    branchTargetBuffer: Map<number, { 'predictorState': boolean, 'branchTargetAddress': number }>;

    // stores lastprediction for GUI
    lastPrediction: number;


    // E2E = 1 | M2E = 2 | M2M = 3
    // ! Don't forget to set this null before every step
    dataForwardingType: Number;

    // 1 means stall because of prevInstr and 2 means stall because of prevPrevInstr
    stallType: number;


    // Stores the Address of the Register
    prevWriteReg: Number;
    prevPrevWriteReg: Number;

    prevInstrMnenomic: string;
    prevPrevInstrMnenomic: string;




    branchAddressDef: number;
    branchAddress: number;
    controlHazardType: number;
    flushPipeline: boolean;
    stallAtDecode: boolean;


    // return address is used in jal and jalr
    // writeBackRegLocation contains the register Location where updation will take place, for some instructions it is null

    constructor() {
        this.isb1 = new ISB1();
        this.isb2 = new ISB2();
        this.isb3 = new ISB3();
        this.isb4 = new ISB4();
        this.pcBuf = new ProgramCounterBuffer();
        this.flushPipeline = false;
        this.stallAtDecode = false;
        this.stallType = null;
        this.lastPrediction = null;
        this.branchTargetBuffer = new Map<number, { 'predictorState': boolean, 'branchTargetAddress': number }>();
    }

    // GUI Exclusive functions
    updatePCBuffer(prevStall?: boolean) {
        this.pcBuf.writeBackPC = this.pcBuf.memoryPC;
        this.pcBuf.memoryPC = this.pcBuf.executePC;
        if (prevStall){
            this.pcBuf.executePC = -1;
        }else{
            this.pcBuf.executePC = this.pcBuf.decodePC;
            this.pcBuf.decodePC = this.pcBuf.fetchPC;
        }
        this.pcBuf.fetchPC = GlobalVar.pcTemp;
    }

    // pcBuf represents which hardware was used by the particular instruction in last clock cycle
    // In pcBuf it represents the last instruction executed

    updatePCBufferOnFlush() {
        // will be called by Execute on Flush
        this.pcBuf.writeBackPC = this.pcBuf.memoryPC;
        this.pcBuf.memoryPC = this.pcBuf.executePC;
        this.pcBuf.executePC = this.pcBuf.decodePC;
        this.pcBuf.decodePC = -1;
        this.pcBuf.fetchPC = -1;
    }


    updatePCBufferOnStall() {
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
        // Will be called everytime after a successful decode (Not at Stall)

        console.log("UPDATING ISB BECAUSE OF DECODE");
        this.isb4.writeBackRegLocation = this.isb3.writeBackRegLocation;
        this.isb3.writeBackRegLocation = this.isb2.writeBackRegLocation;


        // If R | I | U | UJ
        let type = GlobalVar.type;
        if (type === 'R' || type === 'I' || type === 'U' || type === 'UJ') {
            this.isb2.writeBackRegLocation = GlobalVar.regFile.getRDAddr();
        } else {
            this.isb2.writeBackRegLocation = null;
        }
    }


    updateDataFlowOnFlush() {
        // Will be called after Execute incase of any misprediction etc
        // Equivalent to 2 cycle stalls

        this.isb4.type = this.isb3.type;
        this.isb3.type = this.isb2.type;

        this.isb4.returnAddress = this.isb3.returnAddress;
        this.isb3.returnAddress = this.isb2.returnAddress;


        this.isb4.operCode = this.isb3.operCode;
        this.isb3.operCode = this.isb2.operCode;

        this.isb4.writeBackRegLocation = this.isb3.writeBackRegLocation;
        this.isb3.writeBackRegLocation = this.isb2.writeBackRegLocation;

        this.isb4.branchAddress = this.isb3.branchAddress;
        this.isb3.branchAddress = this.isb2.branchAddress;


        // Destroying all data inside isb1 and other GlobarVar variables like IR
        this.isb2.writeBackRegLocation = null;
        this.isb2.returnAddress = null;
        this.isb2.operCode = null;
        this.isb2.type = null;

        this.isb1.writeBackRegLocation = null;
        this.isb1.returnAddress = null;
        this.isb1.operCode = null;
        this.isb1.type = null;

        GlobalVar.ALU_op = null;
        GlobalVar.type = null;
        GlobalVar.operCode = null;
        GlobalVar.IR = null;
    }

    updateOnStall() {
        // Will be called by Decode on stall
        // No data is forwarded from isb1 to isb2
        console.log("UPDATING ISB BECAUSE OF STALL");

        this.isb4.type = this.isb3.type;
        this.isb3.type = this.isb2.type;

        this.isb4.returnAddress = this.isb3.returnAddress;
        this.isb3.returnAddress = this.isb2.returnAddress;

        this.isb4.operCode = this.isb3.operCode;
        this.isb3.operCode = this.isb2.operCode;

        this.isb4.writeBackRegLocation = this.isb3.writeBackRegLocation;
        this.isb3.writeBackRegLocation = this.isb2.writeBackRegLocation;

        // Destroying isb2 data so ALU recieves no data in next cycle
        this.isb2.writeBackRegLocation = null;
        this.isb2.returnAddress = null;
        this.isb2.operCode = null;
        this.isb2.type = null;
    }

    updateInterStateBuffer() {
        console.log("UPDATING ISB (Normal)");
        // Will be set only for jump and branch instructions only
        this.isb4.branchAddress = this.isb3.branchAddress;
        this.isb3.branchAddress = this.isb2.branchAddress;
        this.isb2.branchAddress = this.isb1.branchAddress;
        this.isb1.branchAddress = GlobalVar.isb.branchAddress;


        this.isb4.returnAddress = this.isb3.returnAddress;
        this.isb3.returnAddress = this.isb2.returnAddress;
        this.isb2.returnAddress = this.isb1.returnAddress;
        // ! check alter of +4
        this.isb1.returnAddress = GlobalVar.pcTemp + 4;
        // ! This will also work (CHECK)
        // this.isb1.returnAddress = GlobalVar.isb.branchAddressDef;


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
    }

    showInterStateBuffer() {
        console.log(`ISB1:`, this.isb1);
        console.log(`ISB2:`, this.isb2);
        console.log(`ISB3:`, this.isb3);
        console.log(`ISB4:`, this.isb4);
    }

}
