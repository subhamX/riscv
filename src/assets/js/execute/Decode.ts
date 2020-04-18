import { GlobalVar } from './Main';
import { evaluateImm } from './helperFun';

export function Decode() {
    console.log("BEGIN OF DECODE")
    // extracting opcode of current instruction
    let opcode = GlobalVar.IR.slice(25, 32);
    // setting instruction type of current instruction
    GlobalVar.type = GlobalVar.opcodeMap.get(GlobalVar.IR.slice(25, 32));
    GlobalVar.immVal = "0";
    if (GlobalVar.type == 'R') {
        // operation code
        GlobalVar.operCode = GlobalVar.IR.slice(17, 20) + GlobalVar.IR.slice(0, 7);
        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));
        console.log('rd', GlobalVar.regFile.getRDAddr());

        let rs1 = GlobalVar.IR.slice(12, 17);
        // console.log("rs1",);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));

        let rs2 = GlobalVar.IR.slice(7, 12)
        GlobalVar.regFile.setRS2(parseInt(rs2, 2));

        // ! updating RA and RB > Commented
        // GlobalVar.RA = GlobalVar.regFile.getRS1();
        // GlobalVar.RB = GlobalVar.regFile.getRS2();
    }
    else if (GlobalVar.type == 'I') {
        // operation code
        GlobalVar.operCode = opcode + GlobalVar.IR.slice(17, 20);

        if (GlobalVar.operationMap.get(GlobalVar.operCode) == 'ld') {
            console.error('`InstructionNotSupportedError: LD is not supported by 32 bit systems!');
            GlobalVar.invalid = true;
            return;
        }

        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));
        console.log('rd', GlobalVar.regFile.getRDAddr());


        let rs1 = GlobalVar.IR.slice(12, 17);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));

        // as RS2 does not have any value
        GlobalVar.regFile.setRS2(null);

        // ! updating RA and RB > Commented
        // GlobalVar.RA = GlobalVar.regFile.getRS1();
        // GlobalVar.RB = GlobalVar.regFile.getRS2();

        GlobalVar.immVal = GlobalVar.IR.slice(0, 12);
        // console.log('GlobalVar.immVal', GlobalVar.immVal);
    }
    else if (GlobalVar.type == 'S') {
        // operation code
        GlobalVar.operCode = opcode + GlobalVar.IR.slice(17, 20);

        if (GlobalVar.operationMap.get(GlobalVar.operCode) == 'sd') {
            console.error('`InstructionNotSupportedError: sd is not supported on 64 bit systems!');
            GlobalVar.invalid = true;
            return;
        }

        let rs1 = GlobalVar.IR.slice(12, 17);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));

        let rs2 = GlobalVar.IR.slice(7, 12)
        GlobalVar.regFile.setRS2(parseInt(rs2, 2));

        let imm4_0 = GlobalVar.IR.slice(20, 25);
        let imm11_5 = GlobalVar.IR.slice(0, 7);
        GlobalVar.immVal = imm11_5 + imm4_0;

        // ! updating RA and RB > Commented
        // GlobalVar.RA = GlobalVar.regFile.getRS1();
        // GlobalVar.RB = GlobalVar.regFile.getRS2();

        // RA has the base address
    }
    else if (GlobalVar.type == 'SB') {
        // operation code
        GlobalVar.operCode = opcode + GlobalVar.IR.slice(17, 20);

        let rs1 = GlobalVar.IR.slice(12, 17);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));

        let rs2 = GlobalVar.IR.slice(7, 12)
        GlobalVar.regFile.setRS2(parseInt(rs2, 2));

        // missing lsb of immediate field
        GlobalVar.immVal = GlobalVar.IR[0] + GlobalVar.IR[24] + GlobalVar.IR.slice(1, 7) + GlobalVar.IR.slice(20, 24);
        GlobalVar.immVal = (GlobalVar.immVal + '0');

        // ! updating RA and RB > Commented
        // GlobalVar.RA = GlobalVar.regFile.getRS1();
        // GlobalVar.RB = GlobalVar.regFile.getRS2();
    }
    else if (GlobalVar.type == 'U') {
        // operation code
        GlobalVar.operCode = opcode;

        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));

        // shifting by 12 bits;
        GlobalVar.immVal = GlobalVar.IR.slice(0, 20)
    }
    else if (GlobalVar.type == 'UJ') {
        // operation code
        GlobalVar.operCode = opcode;

        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));

        // missing lsb of immediate
        GlobalVar.immVal = GlobalVar.IR[0] + GlobalVar.IR.slice(12, 20) + GlobalVar.IR[11] + GlobalVar.IR.slice(1, 11);
        GlobalVar.immVal = (GlobalVar.immVal + '0');
        // console.log(GlobalVar.immVal);
    }
    else if (GlobalVar.type === 'END') {
        // GlobalVar.regFile.setRD(0);
        console.warn("Decoding the End");
    } else {
        console.log(GlobalVar.operCode)
        console.error('Not a valid instruction!(invalid Opcode)');
        GlobalVar.invalid = true;
        return;
    }
    GlobalVar.ALU_op = GlobalVar.operationMap.get(GlobalVar.operCode);
    // console.log("value in GlobalVar.RA => " + GlobalVar.RA);
    // console.log("value in GlobalVar.RB => " + GlobalVar.RB);

    // ? Reference
    // Data Forwarding
    // Write Back Address is in 
    // GlobalVar.regFile.getRD();
    // location of inA
    // GlobalVar.regFile.getRS1();
    // location of inB
    // GlobalVar.regFile.getRS2();


    let locationA = GlobalVar.regFile.getR1Addr();
    let stallRA: boolean = false;

    // Only for R || I || S || SB instructions RS1 is set
    if ((GlobalVar.pipelineEnabled) && (locationA == GlobalVar.isb.prevWriteReg && locationA != 0)) {
        // Pipelining is Enabled 
        if (GlobalVar.mode == 1) {
            // Data Forwarding is Enabled
            let prevInstrMnenomic = GlobalVar.isb.prevInstrMnenomic;
            if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                // load instructions
                // TODO: WE may need M to M data forwarding! Check
                stallRA = true;
            } else {
                stallRA = false;
                // Address is already set above
                // ? CHECK: Type Data Forwarding
                console.warn("Data Forwarding: RA = ", GlobalVar.RZ)
                GlobalVar.RA = GlobalVar.RZ;
            }
        } else {
            stallRA = true;
        }
    } else if ((GlobalVar.pipelineEnabled) && (locationA == GlobalVar.isb.prevPrevWriteReg && GlobalVar.isb.prevPrevWriteReg != 0)) {
        if (GlobalVar.mode === 1) {
            stallRA = false;
            // ? CHECK: Type Data Forwarding
            GlobalVar.RA = GlobalVar.RY;
        } else {
            stallRA = true;
        }
    } else {
        // either pipeline is not enabled or there is no data dependency which is causing hazard
        stallRA = false;
        GlobalVar.RA = GlobalVar.regFile.getRS1();
    }


    // Handling RS2
    let stallRB: boolean = false;
    let locationB = GlobalVar.regFile.getRS2Addr();

    if (GlobalVar.type === 'R' || GlobalVar.type === 'SB') {
        if ((GlobalVar.pipelineEnabled) && GlobalVar.isb.prevWriteReg && locationB === GlobalVar.isb.prevWriteReg) {
            if (GlobalVar.mode === 1) {
                // Data Forwarding is enabled
                let prevInstrMnenomic = GlobalVar.isb.prevInstrMnenomic;
                if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                    stallRB = true;
                } else {
                    stallRB = false;
                    // ? CHECK: Type Data Forwarding
                    GlobalVar.RB = GlobalVar.RZ;
                }
            } else {
                // Data Forwarding is disabled and only pipelining is enabled
                stallRB = true;
            }

        } else if ((GlobalVar.pipelineEnabled) && GlobalVar.isb.prevPrevWriteReg && locationB === GlobalVar.isb.prevPrevWriteReg) {
            if (GlobalVar.mode === 1) {
                // Data Forwarding is enabled
                stallRB = false;
                // ? CHECK: Type Data Forwarding
                GlobalVar.RB = GlobalVar.RY;
            } else {
                stallRB = true;
            }
        } else {
            // either pipeline is not enabled or there is no data dependency which is causing hazard
            stallRB = false;
            GlobalVar.RB = GlobalVar.regFile.getRS2();
        }
    } else if (GlobalVar.type === 'I' || GlobalVar.type === 'S') {
        GlobalVar.RB = GlobalVar.regFile.getRS2();
    }

    // Passing values to inA and inB
    // ALU: if (!GlobalVar.pipelineEnabled) {
    //     GlobalVar.inA = GlobalVar.regFile.getRS1();
    // }
    // Handling RD
    let stallRC: boolean = false;
    let locationC = GlobalVar.regFile.getRDAddr();

    // For store instructions
    if (GlobalVar.type == 'S') {
        if ((GlobalVar.pipelineEnabled) && GlobalVar.isb.prevWriteReg && locationC === GlobalVar.isb.prevWriteReg) {
            if (GlobalVar.mode === 1) {
                console.log("TESTING !)!", GlobalVar.isb.prevInstrMnenomic)
                // Data Forwarding is enabled
                let prevInstrMnenomic = GlobalVar.isb.prevInstrMnenomic;
                if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                    stallRC = false;
                    console.warn("NOT STALLING as it will be handled by ALU (M to M data forwarding)")
                    // ! M to M data forwarding will be done at ALU
                    GlobalVar.RB = GlobalVar.regFile.getRS2()
                } else {
                    stallRC = false;
                    console.log("RX DATA", GlobalVar.RZ, GlobalVar.RY);
                    // Forwarding Data
                    GlobalVar.RB = GlobalVar.RZ;
                }
            } else {
                // Data Forwarding is disabled and only pipelining is enabled
                stallRC = true;
            }
        } else if ((GlobalVar.pipelineEnabled) && GlobalVar.isb.prevPrevWriteReg && locationC === GlobalVar.isb.prevPrevWriteReg) {
            if (GlobalVar.mode === 1) {
                // Data Forwarding is enabled
                stallRC = false;
                GlobalVar.RB = GlobalVar.RY;
            } else {
                stallRC = true;
            }
        } else {
            // either pipeline is not enabled or there is no data dependency which is causing hazard
            stallRC = false;
            // Check if this statement is necessary. Since ALU uses does it too.
            GlobalVar.RB = GlobalVar.regFile.getRS2();
            console.error("HELLO: ", GlobalVar.RB);
        }
    }

    // ! Migrating from ALU to here
    // Passing 
    if (!GlobalVar.pipelineEnabled) {
        GlobalVar.isb.isb1.RM = GlobalVar.regFile.getRegVal(locationC);
    }

    // TODO: Handle JALR instructions (DONE)
    if (GlobalVar.isb.controlHazardType === 2) {
        console.log("JALR(From Decode): Setting newpc value");
        // setting new value of PC
        console.log(GlobalVar.PC);
        GlobalVar.PC = GlobalVar.regFile.getRS1() + evaluateImm(GlobalVar.immVal);
        console.log("NEW PC:", GlobalVar.PC);
    }

    // Verifing the branch prediction
    if (GlobalVar.type === 'SB') {
        let inA: number = GlobalVar.regFile.getRS1();
        let inB: number = GlobalVar.regFile.getRS2();
        let branchActualCondition: boolean = false;
        if (GlobalVar.ALU_op == 'beq') {
            if (inA == inB) {
                branchActualCondition = true;
            }
        }
        else if (GlobalVar.ALU_op == 'bne') {
            if (inA != inB) {
                branchActualCondition = true;
            }
        }
        else if (GlobalVar.ALU_op == 'bge') {
            if (inA >= inB) {
                branchActualCondition = true;
            }
        }
        else if (GlobalVar.ALU_op == 'blt') {
            if (inA < inB) {
                branchActualCondition = true;
                console.log('evim', evaluateImm(GlobalVar.immVal));
            }
        }
        // Finding misprediction: If true then updating PC
        if (GlobalVar.isb.isb1.isBranchTaken && branchActualCondition == false) {
            GlobalVar.isb.branchMispredictions++;
            console.log("MISPREDiCTION");
            GlobalVar.isb.flushPipeline = true;
            GlobalVar.PC = GlobalVar.isb.branchAddressDef;
        } else if (GlobalVar.isb.isb1.isBranchTaken == false && branchActualCondition) {
            GlobalVar.isb.branchMispredictions++;
            console.log("MISPREDiCTION");
            GlobalVar.isb.flushPipeline = true;
            GlobalVar.PC = GlobalVar.isb.branchAddressDef;
        } else {
            GlobalVar.isb.flushPipeline = false;
        }
    }

    // Handling Immediate values for I, S, U, UJ
    // if (!(GlobalVar.type === 'R' || GlobalVar.type == 'SB')) {
    //     GlobalVar.RB = evaluateImm(GlobalVar.immVal);
    // }
    // else {
    //     GlobalVar.RB = GlobalVar.regFile.getRS2()
    // }


    // Write Back pcTemp value to Register [We will save 3 cycles if we perform this operation here]
    if (GlobalVar.pipelineEnabled && (GlobalVar.isb.controlHazardType === 1 || GlobalVar.isb.controlHazardType === 2)) {
        GlobalVar.regFile.setRegVal(locationC, GlobalVar.isb.isb1.returnAddress);
    }
    // Increment the stall count
    if (stallRB || stallRC || stallRA) {
        GlobalVar.isb.numberOfStalls++;
        GlobalVar.isb.stallAtDecode = true;
    } else {
        GlobalVar.isb.stallAtDecode = false;
    }

    GlobalVar.isb.prevPrevInstrMnenomic = GlobalVar.isb.prevInstrMnenomic;
    GlobalVar.isb.prevInstrMnenomic = GlobalVar.ALU_op;

    // Updating prevWrite and prevPrevWrite Register location
    GlobalVar.isb.prevPrevWriteReg = GlobalVar.isb.prevWriteReg;

    // For R, I and U only we need to put prevWriteReg as locationC
    if (GlobalVar.isb.stallAtDecode === true || GlobalVar.type === 'S') {
        GlobalVar.isb.prevWriteReg = 0;
    } else {
        GlobalVar.isb.prevWriteReg = locationC;
    }

    console.log("END OF DECODE: RA, RB", GlobalVar.RA, GlobalVar.RB)

}
