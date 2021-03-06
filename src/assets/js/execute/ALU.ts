import { GlobalVar, UpdatePC } from './Main';
import { determineSelectLines, evaluateImm } from './helperFun';

export function Execute() {
    // console.log("EXECUTE BEGIN: RA, RB, imm", GlobalVar.RA, GlobalVar.RB, evaluateImm(GlobalVar.immVal));

    if (GlobalVar.isb.isb2.type === null) {
        // console.log('As a result of last cycle flushing! No task');
        return;
    }
    if (GlobalVar.pipelineEnabled) {
        determineSelectLines(GlobalVar.isb.isb2.type);
    } else {
        determineSelectLines(GlobalVar.type);
    }
    let inA: number = GlobalVar.RA;
    let inB: number;
    if (GlobalVar.selectLineB == 1) {
        inB = evaluateImm(GlobalVar.immVal);
    }
    else {
        inB = GlobalVar.RB;
    }
    // Setting inA and inB into GlobalVar
    GlobalVar.inA = inA;
    GlobalVar.inB = inB;
    // console.log('inB inA', inB, inA);
    // console.log("operation", GlobalVar.ALU_op);
    if (GlobalVar.ALU_op == 'add' || GlobalVar.ALU_op == 'addi' || GlobalVar.ALU_op == 'ld' || GlobalVar.ALU_op == 'lb' || GlobalVar.ALU_op == 'lh' || GlobalVar.ALU_op == 'lw') {
        GlobalVar.RZ = inA + inB;
    }
    else if (GlobalVar.ALU_op == 'sub') {
        GlobalVar.RZ = inA - inB;
    }
    else if (GlobalVar.ALU_op == 'div') {
        GlobalVar.RZ = Math.floor(inA / inB);
    }
    else if (GlobalVar.ALU_op == 'rem') {
        GlobalVar.RZ = inA % inB;
    }
    else if (GlobalVar.ALU_op == 'mul') {
        GlobalVar.RZ = inA * inB;
    }
    else if (GlobalVar.ALU_op == 'andi' || GlobalVar.ALU_op == 'and)') {
        GlobalVar.RZ = inA & inB;
    }
    else if (GlobalVar.ALU_op == 'ori' || GlobalVar.ALU_op == 'or') {
        GlobalVar.RZ = inA | inB;
    }
    else if (GlobalVar.ALU_op == 'xor') {
        GlobalVar.RZ = inA ^ inB;
    } else if (GlobalVar.ALU_op == 'sll') {
        GlobalVar.RZ = inA << inB;
    }
    else if (GlobalVar.ALU_op == 'slt') {
        console.log(inA, "CHECK");
        console.log(inB, "CHECK");
        GlobalVar.RZ = (inA < inB) ? 1 : 0;
        console.log(GlobalVar.RZ);
    }
    else if (GlobalVar.ALU_op == 'sra') {
        GlobalVar.RZ = inA >> inB;
        GlobalVar.RZ |= inA & (1 << 31);
    }
    else if (GlobalVar.ALU_op == 'srl') {
        GlobalVar.RZ = inA >> inB;
    }
    else if (GlobalVar.ALU_op == 'jalr') {
        GlobalVar.RZ = inA + inB;
        // If pipeline enabled then no updation of PC
        if (!GlobalVar.pipelineEnabled) {
            UpdatePC(0);
        }
    }
    else if (GlobalVar.ALU_op == 'sb' || GlobalVar.ALU_op == 'sw' || GlobalVar.ALU_op == 'sd' || GlobalVar.ALU_op == 'sh') {
        GlobalVar.RZ = inA + evaluateImm(GlobalVar.immVal);
        // Using RB and forwarding it to RM (For both pipelined and non-pipelined instructions)
        if (GlobalVar.pipelineEnabled && (GlobalVar.mode === 1)) {
            // Here prev istruction is prevPrev instruction
            let prevInstrMnenomic = GlobalVar.isb.prevPrevInstrMnenomic;
            if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                // ! M to M Data Forwarding
                GlobalVar.isb.dataForwardingType = 3;
                GlobalVar.RM = GlobalVar.MDR;
            } else {
                GlobalVar.RM = GlobalVar.RB;
            }
        } else {
            GlobalVar.RM = GlobalVar.RB;
        }
    }
    else if (GlobalVar.ALU_op == 'lui') {
        GlobalVar.RZ = inB << 12;
    }
    else if (GlobalVar.ALU_op == 'auipc') {
        if (GlobalVar.pipelineEnabled) {
            inA = GlobalVar.isb.isb2.returnAddress - 4;
            GlobalVar.RZ = inA + (inB << 12)
        } else {
            inA = GlobalVar.PC - 4;
            GlobalVar.RZ = inA + (inB << 12)
        }
    }
    else if (GlobalVar.ALU_op == 'jal') {
        // enabling this only for non pipelined version
        if (!GlobalVar.pipelineEnabled) {
            UpdatePC(1, inB);
        }
    } else if (GlobalVar.ALU_op === 'END') {
        GlobalVar.RZ = 0;
    }


    // Branch Instructions
    // Handling only if pipelining is false;
    if (!GlobalVar.pipelineEnabled) {
        if (GlobalVar.ALU_op == 'beq') {
            if (inA == inB) {
                UpdatePC(1, evaluateImm(GlobalVar.immVal));
            }
        }
        else if (GlobalVar.ALU_op == 'bne') {
            if (inA != inB) {
                UpdatePC(1, evaluateImm(GlobalVar.immVal));
            }
        }
        else if (GlobalVar.ALU_op == 'bge') {
            if (inA >= inB) {
                UpdatePC(1, evaluateImm(GlobalVar.immVal));
            }
        }
        else if (GlobalVar.ALU_op == 'blt') {
            if (inA < inB) {
                UpdatePC(1, evaluateImm(GlobalVar.immVal));
                // console.log('evim', evaluateImm(GlobalVar.immVal));
            }
        }
    }


    // Verifing the branch prediction for pipeline enabled
    if (GlobalVar.pipelineEnabled) {
        let instrAddress = GlobalVar.isb.isb2.returnAddress - 4;
        if (GlobalVar.type === 'SB') {
            GlobalVar.execStats.numberOfControlInstr++;
            // rs1 and rs2 is in RA and RB
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
                }
            }
            // console.log("branchActualCondition: ", GlobalVar.ALU_op, branchActualCondition)
            // actualBranchAddress contains the real target address
            let actualBranchAddress = instrAddress + evaluateImm(GlobalVar.immVal);

            // branch prediction is enabled
            if (GlobalVar.branchPredEnabled) {
                // checking if there is an instance in branchTargetBuffer
                if (GlobalVar.isb.branchTargetBuffer.has(instrAddress)) {
                    let instance = GlobalVar.isb.branchTargetBuffer.get(instrAddress);
                    // checking for misprediction
                    // Finding misprediction: If true then updating PC and flushing the pipeline
                    // isBranchTaken contains the prediction
                    if (instance.predictorState && branchActualCondition == false) {
                        GlobalVar.execStats.branchMispredictions++;
                        // console.log("MISPREDiCTION Type1");
                        GlobalVar.isb.flushPipeline = true;
                        // toggling the predictor state
                        instance.predictorState = !instance.predictorState;
                        GlobalVar.noInstr = false;
                        GlobalVar.PC = GlobalVar.isb.isb2.returnAddress;
                    } else if (instance.predictorState === false && branchActualCondition) {
                        GlobalVar.execStats.branchMispredictions++;
                        // console.log("MISPREDiCTION Type2");
                        GlobalVar.isb.flushPipeline = true;
                        // toggling the predictor state
                        instance.predictorState = !instance.predictorState;
                        GlobalVar.noInstr = false;
                        GlobalVar.PC = actualBranchAddress;
                    } else {
                        // Correct Prediction
                        GlobalVar.isb.flushPipeline = false;
                    }
                } else {
                    // BTB Miss
                    GlobalVar.execStats.branchMispredictions++;
                    // Only if branchActualCondition is true then we will update PC
                    GlobalVar.isb.branchTargetBuffer.set(instrAddress, { 'predictorState': branchActualCondition, 'branchTargetAddress': actualBranchAddress });
                    // Since by default we updated PC = PC+4
                    if (branchActualCondition === true) {
                        // adding this branch instruction instance in BTB
                        GlobalVar.PC = actualBranchAddress;
                        GlobalVar.noInstr = false;
                        GlobalVar.isb.flushPipeline = true;
                        // console.log('We did\'t had it; Now we do');
                    }
                }
            } else {
                // branch prediction is disabled
                // console.log('Branch Prediction Disabled');
                if (branchActualCondition) {
                    // update PC
                    GlobalVar.PC = actualBranchAddress;
                    GlobalVar.noInstr = false;
                    // flushing the pipeline
                    GlobalVar.isb.flushPipeline = true;
                }
            }
        } else if (GlobalVar.type === 'UJ') {
            GlobalVar.execStats.numberOfControlInstr++;
            let actualBranchAddress = evaluateImm(GlobalVar.immVal) + instrAddress;
            // console.error("Branch to: ", actualBranchAddress);
            if (GlobalVar.branchPredEnabled) {
                // If there is no instance of the instruction in BTB (BTB MISS)
                GlobalVar.execStats.branchMispredictions++;
                if (!GlobalVar.isb.branchTargetBuffer.has(instrAddress)) {
                    // adding this jal instruction instance in BTB with predictor state true
                    GlobalVar.isb.branchTargetBuffer.set(instrAddress, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                    // updating PC
                    GlobalVar.PC = actualBranchAddress;
                    GlobalVar.noInstr = false;
                    GlobalVar.isb.flushPipeline = true;
                }
                // If there is an instance then we are sure that predictorState is true always! No scope for misprediction
            } else {
                // prediction is not enabled
                // We need to flush and update the PC
                GlobalVar.PC = actualBranchAddress;
                GlobalVar.noInstr = false;
                // flushing the pipeline
                GlobalVar.isb.flushPipeline = true;
            }

        } else if (GlobalVar.ALU_op === 'jalr') {
            GlobalVar.execStats.numberOfControlInstr++;

            // console.log("CHECKING inA with RS1: ", inA, GlobalVar.regFile.getRS1())
            let actualBranchAddress = GlobalVar.regFile.getRS1() + evaluateImm(GlobalVar.immVal);
            if (GlobalVar.branchPredEnabled) {
                if (!GlobalVar.isb.branchTargetBuffer.has(instrAddress)) {
                    // No instance found
                    GlobalVar.execStats.branchMispredictions++;
                    // adding this jalr instruction instance in BTB with predictor state true
                    GlobalVar.isb.branchTargetBuffer.set(instrAddress, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                    // updating PC
                    GlobalVar.PC = actualBranchAddress;
                    GlobalVar.noInstr = false;
                    GlobalVar.isb.flushPipeline = true;
                } else {
                    // Instance found
                    let instance = GlobalVar.isb.branchTargetBuffer.get(instrAddress);
                    // check if the targetaddress calculated is true or not
                    // If true then no problem else increment stat12 
                    if (instance.branchTargetAddress !== actualBranchAddress) {
                        // console.log('JALR special case');
                        // setting the updated value in BTB
                        GlobalVar.isb.branchTargetBuffer.set(instrAddress, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                        // updating PC
                        GlobalVar.PC = actualBranchAddress;
                        GlobalVar.noInstr = false;
                        // increment stat12
                        // GlobalVar.isb.numberOfControlHazardStalls++;
                        GlobalVar.isb.flushPipeline = true;
                    }
                }
            } else {
                // prediction is not enabled
                // We need to flush and update the PC
                GlobalVar.isb.flushPipeline = true;
                GlobalVar.noInstr = false;
                GlobalVar.PC = actualBranchAddress;
            }
        }
    }

    // Converting any overflowing number to negative 
    // console.log('Without Overflow Check: rz', GlobalVar.RZ)
    GlobalVar.RZ <<= 0;
    // console.log('rz', GlobalVar.RZ);
}
