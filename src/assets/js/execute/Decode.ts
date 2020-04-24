import { GlobalVar } from './Main';
import { evaluateImm } from './helperFun';

export function Decode() {
    if (GlobalVar.pipelineEnabled) {
        // setting flushpipeline to false;
        GlobalVar.isb.flushPipeline = false;
    }

    console.log("BEGIN OF DECODE: ppInstr, pInstr, ppWrite, pWrite", GlobalVar.isb.prevPrevInstrMnenomic, GlobalVar.isb.prevInstrMnenomic, GlobalVar.isb.prevPrevWriteReg, GlobalVar.isb.prevWriteReg)
    if(GlobalVar.IR===null){
        GlobalVar.type = null;
        return;
    }
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

        // as RD does not have any value
        GlobalVar.regFile.setRD(null);
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

        // as RD does not have any value
        GlobalVar.regFile.setRD(null);

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

        // as RS2 does not have any value
        GlobalVar.regFile.setRS2(null);

        // as RS1 does not have any value
        GlobalVar.regFile.setRS1(null);

        // shifting by 12 bits;
        GlobalVar.immVal = GlobalVar.IR.slice(0, 20)
    }
    else if (GlobalVar.type == 'UJ') {
        // operation code
        GlobalVar.operCode = opcode;
        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));


        // as RS2 does not have any value
        GlobalVar.regFile.setRS2(null);

        // as RS1 does not have any value
        GlobalVar.regFile.setRS1(null);

        // missing lsb of immediate
        GlobalVar.immVal = GlobalVar.IR[0] + GlobalVar.IR.slice(12, 20) + GlobalVar.IR[11] + GlobalVar.IR.slice(1, 11);
        GlobalVar.immVal = (GlobalVar.immVal + '0');
        // console.log(GlobalVar.immVal);
    }
    else if (GlobalVar.type === 'END') {
        // Setting RD, RS1, RS2 to zero to avoid any possible data hazard
        GlobalVar.regFile.setRD(0);
        GlobalVar.regFile.setRS1(0);
        GlobalVar.regFile.setRS2(0);
        // Setting ALU_op to zero to avoid any possible data hazard
        GlobalVar.operCode = opcode;
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
    let stallRA: number = 0;
    console.log("locationA:", locationA);
    // Only for R || I || S || SB instructions RS1 is set
    if (locationA&&(GlobalVar.pipelineEnabled) && (locationA === GlobalVar.isb.prevWriteReg && locationA != 0)) {
        // Pipelining is Enabled 
        if (GlobalVar.mode == 1) {
            // Data Forwarding is Enabled
            let prevInstrMnenomic = GlobalVar.isb.prevInstrMnenomic;
            if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                // load instructions
                // TODO: WE may need M to M data forwarding! (NO, M2M is handled only for RB)
                // stalling
                stallRA = 1;
            } else if (prevInstrMnenomic === 'jal' || prevInstrMnenomic === 'jalr') {
                // stalling
                console.error('Stalling JAL or JALR! 1');
                stallRA = 1;
            }
            else {
                // no stall
                stallRA = 0;
                // ! E to E data Forwarding
                GlobalVar.isb.dataForwardingType = 1;
                console.log("1=>(E2E)Data Forwarding: RA = ", GlobalVar.RZ);
                GlobalVar.RA = GlobalVar.RZ;
            }
        } else {
            stallRA = 1;
        }
    } else if (locationA&&(GlobalVar.pipelineEnabled) && (locationA == GlobalVar.isb.prevPrevWriteReg && GlobalVar.isb.prevPrevWriteReg != 0)) {
        if (GlobalVar.mode === 1) {
            // Data Forwarding is Enabled
            let prevPrevInstrMnenomic = GlobalVar.isb.prevPrevInstrMnenomic;
            if (prevPrevInstrMnenomic === 'jal' || prevPrevInstrMnenomic === 'jalr') {
                // stalling
                stallRA = 2;
                console.error('Stalling JAL or JALR! 2');
            } else {
                // no stall! Handling by data forwarding
                stallRA = 0;
                // ! M to E data Forwarding
                GlobalVar.isb.dataForwardingType = 2;
                console.log("1=>(M2E)Data Forwarding: RA = ", GlobalVar.RY);
                GlobalVar.RA = GlobalVar.RY;
            }
        } else {
            // stalling
            stallRA = 2;
        }
    } else {
        // either pipeline is not enabled or there is no data dependency which is causing hazard
        stallRA = 0;
        GlobalVar.RA = GlobalVar.regFile.getRS1();
    }


    // Handling RS2
    let stallRB: number = 0;
    let locationB = GlobalVar.regFile.getRS2Addr();

    if (GlobalVar.type === 'R' || GlobalVar.type === 'SB') {
        if (locationB&&(GlobalVar.pipelineEnabled) && GlobalVar.isb.prevWriteReg && locationB === GlobalVar.isb.prevWriteReg) {
            if (GlobalVar.mode === 1) {
                // Data Forwarding is enabled
                let prevInstrMnenomic = GlobalVar.isb.prevInstrMnenomic;
                if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                    // stalling
                    stallRB = 1;
                } else if (prevInstrMnenomic === 'jal' || prevInstrMnenomic === 'jalr') {
                    // stalling
                    stallRB = 1;
                    console.error('Stalling JAL or JALR! 3');
                } else {
                    // no stalling
                    stallRB = 0;
                    // ! E to E data Forwarding
                    GlobalVar.isb.dataForwardingType = 1;
                    console.log("2=>(E2E)Data Forwarding: RB = ", GlobalVar.RZ);
                    GlobalVar.RB = GlobalVar.RZ;
                }
            } else {
                // Data Forwarding is disabled and only pipelining is enabled
                // stalling
                stallRB = 1;
            }
        } else if (locationB&&(GlobalVar.pipelineEnabled) && GlobalVar.isb.prevPrevWriteReg && locationB === GlobalVar.isb.prevPrevWriteReg) {
            if (GlobalVar.mode === 1) {
                // Data Forwarding is enabled
                let prevPrevInstrMnenomic = GlobalVar.isb.prevPrevInstrMnenomic;
                if (prevPrevInstrMnenomic === 'jal' || prevPrevInstrMnenomic === 'jalr') {
                    // stalling
                    stallRB = 2;
                    console.error('Stalling JAL or JALR! 4');
                } else {
                    // no stall
                    stallRB = 0;
                    // ! M to E data Forwarding
                    GlobalVar.isb.dataForwardingType = 2;
                    console.log("2=>(M2E)Data Forwarding: RB = ", GlobalVar.RY);
                    GlobalVar.RB = GlobalVar.RY;
                }
            } else {
                // stalling
                stallRB = 2;
            }
        } else {
            // either pipeline is not enabled or there is no data dependency which is causing hazard
            stallRB = 0;
            GlobalVar.RB = GlobalVar.regFile.getRS2();
        }
    } else if (GlobalVar.type === 'I' || GlobalVar.type === 'S') {
        // ! Check Maybe only for S instruction we need it
        // no stalling
        console.log('check this and maybe merge this with GlobalVar.type===\'S\'')
        // GlobalVar.RB = GlobalVar.regFile.getRS2();
    }

    // Passing values to inA and inB
    // ALU: if (!GlobalVar.pipelineEnabled) {
    //     GlobalVar.inA = GlobalVar.regFile.getRS1();
    // }
    // Handling RD
    let stallRC: number = 0;
    let locationC = GlobalVar.regFile.getRDAddr();

    // For store instructions
    if (GlobalVar.type === 'S') {
        if (locationC&&(GlobalVar.pipelineEnabled) && GlobalVar.isb.prevWriteReg && locationC === GlobalVar.isb.prevWriteReg) {
            if (GlobalVar.mode === 1) {
                console.log("TESTING !)!", GlobalVar.isb.prevInstrMnenomic)
                // Data Forwarding is enabled
                let prevInstrMnenomic = GlobalVar.isb.prevInstrMnenomic;
                if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                    stallRC = 0;
                    console.warn("NOT STALLING as it will be handled by ALU (M to M data forwarding)")
                    // ! M to M data forwarding will be done at ALU
                    GlobalVar.RB = GlobalVar.regFile.getRS2()
                } else if (prevInstrMnenomic === 'jal' || prevInstrMnenomic === 'jalr') {
                    stallRC = 1;
                    console.error('Stalling JAL or JALR! 5');
                } else {
                    // ! E to E data Forwarding
                    stallRC = 0;
                    console.log("3=>(E2E)Data Forwarding: RB = ", GlobalVar.RZ);
                    // Forwarding Data
                    GlobalVar.RB = GlobalVar.RZ;
                    GlobalVar.isb.dataForwardingType = 1;
                }
            } else {
                // Data Forwarding is disabled and only pipelining is enabled
                stallRC = 1;
            }
        } else if (locationC&&(GlobalVar.pipelineEnabled) && GlobalVar.isb.prevPrevWriteReg && locationC === GlobalVar.isb.prevPrevWriteReg) {
            if (GlobalVar.mode === 1) {
                // Data Forwarding is enabled
                let prevPrevInstrMnenomic = GlobalVar.isb.prevPrevInstrMnenomic;
                if (prevPrevInstrMnenomic === 'jal' || prevPrevInstrMnenomic === 'jalr') {
                    // stalling
                    stallRC = 2;
                    console.error('Stalling JAL or JALR! 6');
                } else {
                    stallRC = 0;
                    // ! M to E data Forwarding
                    GlobalVar.RB = GlobalVar.RY;
                    GlobalVar.isb.dataForwardingType = 2;
                }
            } else {
                stallRC = 2;
            }
        } else {
            // either pipeline is not enabled or there is no data dependency which is causing hazard
            stallRC = 0;
            // Check if this statement is necessary. Since ALU uses does it too.
            GlobalVar.RB = GlobalVar.regFile.getRS2();
        }
    }

    // ! Migrating from ALU to here
    // Passing 
    if (!GlobalVar.pipelineEnabled) {
        GlobalVar.isb.isb1.RM = GlobalVar.regFile.getRegVal(locationC);
    }

    // TODO: Handle JALR instructions (DONE)
    // if (GlobalVar.isb.controlHazardType === 2) {
    //     // setting new value of PC
    //     GlobalVar.PC = GlobalVar.regFile.getRS1() + evaluateImm(GlobalVar.immVal);
    // }

    if (GlobalVar.pipelineEnabled) {
        // Verifing the branch prediction
        if (GlobalVar.type === 'SB') {
            // rs1 and rs2 is in RA and RB
            let inA: number = GlobalVar.RA;
            let inB: number = GlobalVar.RB;
            console.log("DECODE: inA inB", inA, inB);
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
            // ! Check for Alter Case
            // actualBranchAddress contains the real target address
            let actualBranchAddress = GlobalVar.pcTemp + evaluateImm(GlobalVar.immVal);

            // branch prediction is enabled
            if (GlobalVar.branchPredEnabled) {
                // checking if there is an instance in branchTargetBuffer
                if (GlobalVar.isb.branchTargetBuffer.has(GlobalVar.pcTemp)) {
                    let instance = GlobalVar.isb.branchTargetBuffer.get(GlobalVar.pcTemp)
                    // checking for misprediction
                    // Finding misprediction: If true then updating PC
                    // isBranchTaken contains the prediction
                    if (GlobalVar.isb.isb1.isBranchTaken && branchActualCondition == false) {
                        GlobalVar.isb.branchMispredictions++;
                        console.log("MISPREDiCTION");
                        GlobalVar.isb.flushPipeline = true;
                        // toggling the predictor state
                        instance.predictorState = !instance.predictorState;
                        GlobalVar.PC = GlobalVar.isb.branchAddressDef;
                    } else if (GlobalVar.isb.isb1.isBranchTaken == false && branchActualCondition) {
                        GlobalVar.isb.branchMispredictions++;
                        console.log("MISPREDiCTION");
                        GlobalVar.isb.flushPipeline = true;
                        // toggling the predictor state
                        instance.predictorState = !instance.predictorState;
                        GlobalVar.PC = GlobalVar.isb.branchAddressDef;
                    } else {
                        // Correct Prediction
                        GlobalVar.isb.flushPipeline = false;
                    }
                } else {
                    // adding this branch instruction instance in BTB
                    GlobalVar.isb.branchTargetBuffer.set(GlobalVar.pcTemp, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                    GlobalVar.PC = actualBranchAddress;
                    GlobalVar.isb.flushPipeline = true;
                    console.log('We did\'t had it; Now we do');
                }

            } else {
                // branch prediction is disabled
                console.log('Branch Prediction Disabled');
                // update PC
                GlobalVar.PC = actualBranchAddress;
            }
        } else if (GlobalVar.type === 'UJ') {
            let actualBranchAddress = evaluateImm(GlobalVar.immVal) + GlobalVar.pcTemp;
            console.error("Branch to: ", actualBranchAddress);
            if (GlobalVar.branchPredEnabled) {
                // If there is no instance of the instruction in BTB
                if (!GlobalVar.isb.branchTargetBuffer.has(GlobalVar.pcTemp)) {
                    // adding this jal instruction instance in BTB with predictor state true
                    GlobalVar.isb.branchTargetBuffer.set(GlobalVar.pcTemp, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                    // updating PC
                    GlobalVar.PC = actualBranchAddress;
                    GlobalVar.isb.flushPipeline = true;
                }
            } else {
                // prediction is not enabled
                GlobalVar.PC = actualBranchAddress;
            }

        } else if (GlobalVar.ALU_op === 'jalr') {
            let actualBranchAddress = GlobalVar.regFile.getRS1() + evaluateImm(GlobalVar.immVal);
            if (GlobalVar.branchPredEnabled) {
                if (!GlobalVar.isb.branchTargetBuffer.has(GlobalVar.pcTemp)) {
                    // No instance found
                    // adding this jalr instruction instance in BTB with predictor state true
                    GlobalVar.isb.branchTargetBuffer.set(GlobalVar.pcTemp, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                    // updating PC
                    GlobalVar.PC = actualBranchAddress;
                    GlobalVar.isb.flushPipeline = true;
                } else {
                    // Instance found
                    let instance = GlobalVar.isb.branchTargetBuffer.get(GlobalVar.pcTemp);
                    // check if the targetaddress calculated is true or not
                    // If true then no problem else increment stat12 
                    if (instance.branchTargetAddress !== actualBranchAddress) {
                        GlobalVar.isb.flushPipeline = true;
                        // setting the updated value in BTB
                        GlobalVar.isb.branchTargetBuffer.set(GlobalVar.pcTemp, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                        // updating PC
                        GlobalVar.PC = actualBranchAddress;
                        // increment stat12
                        // GlobalVar.isb.numberOfControlHazardStalls++;
                        GlobalVar.isb.flushPipeline = true;
                    }
                }
            } else {
                // prediction is not enabled
                GlobalVar.PC = actualBranchAddress;
            }
        }
    }

    // ! Handling Immediate values for I, S, U, UJ (It goes to inB not RB)
    // if (!(GlobalVar.type === 'R' || GlobalVar.type == 'SB')) {
    //     GlobalVar.RB = evaluateImm(GlobalVar.immVal);
    // }
    // else {
    //     GlobalVar.RB = GlobalVar.regFile.getRS2()
    // }


    // ! (Confirmed By Sir) DON'T DO=> Write Back pcTemp value to Register [We will save 3 cycles if we perform this operation here]
    // if (GlobalVar.pipelineEnabled && (GlobalVar.isb.controlHazardType === 1 || GlobalVar.isb.controlHazardType === 2)) {
    //     GlobalVar.regFile.setRegVal(locationC, GlobalVar.isb.isb1.returnAddress);
    // }
    // Increment the stall count
    if (stallRB || stallRC || stallRA) {
        GlobalVar.isb.numberOfDataHazardStalls++;
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
    if (GlobalVar.isb.flushPipeline) {
        console.error('FLUSH PIPELINE')
    }

    console.log("END OF DECODE: RA, RB, prevPrevWriteReg, prevWriteReg, prevInstrMen, prevPrevInstrMen", GlobalVar.RA, GlobalVar.RB, GlobalVar.isb.prevPrevWriteReg, GlobalVar.isb.prevWriteReg, GlobalVar.isb.prevInstrMnenomic, GlobalVar.isb.prevPrevInstrMnenomic)

}
