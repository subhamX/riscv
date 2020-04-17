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


export class InterStateBuffer {
    isb1: ISB1;
    isb2: ISB2;
    isb3: ISB3;
    isb4: ISB4;

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

    constructor() {
        this.isb1 = new ISB1();
        this.isb2 = new ISB2();
        this.isb3 = new ISB3();
        this.isb4 = new ISB4();
        this.branchMispredictions = 0;
        this.flushPipeline = false;
        this.stallAtDecode = false;
    }

    updateInterStateBufferAfterDecode() {
        this.isb4.writeBackRegLocation = this.isb3.writeBackRegLocation;
        this.isb3.writeBackRegLocation = this.isb2.writeBackRegLocation;
        this.isb2.writeBackRegLocation = GlobalVar.regFile.getRDAddr();
    }

    updateOnStall() {
        this.isb4.type = this.isb3.type;
        this.isb3.type = this.isb2.type;
        // this.isb2.type = this.isb1.type;
        this.isb4.returnAddress = this.isb3.returnAddress;
        this.isb3.returnAddress = this.isb2.returnAddress;

        this.isb4.operCode = this.isb3.operCode;
        this.isb3.operCode = this.isb2.operCode;
    }

    updateInterStateBuffer() {
        this.isb4.returnAddress = this.isb3.returnAddress;
        this.isb3.returnAddress = this.isb2.returnAddress;
        this.isb2.returnAddress = this.isb1.returnAddress;
        this.isb1.returnAddress = GlobalVar.pcTemp;

        // Passing type to next Interstatebuffer
        this.isb4.type = this.isb3.type;
        this.isb3.type = this.isb2.type;
        this.isb2.type = this.isb1.type;
        this.isb1.type = GlobalVar.type;

        // Passing type to next Interstatebuffer
        this.isb4.operCode = this.isb3.operCode;
        this.isb3.operCode = this.isb2.operCode;
        this.isb2.operCode = GlobalVar.operCode;
        // operCode directly set to isb2
    }

    showInterStateBuffer() {
        console.log(`ISB1:`, this.isb1);
        console.log(`ISB2:`, this.isb2);
        console.log(`ISB3:`, this.isb3);
        console.log(`ISB4:`, this.isb4);
    }

}
