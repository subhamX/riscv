import { GlobalVar, UpdatePC } from './Main';
import { determineSelectLines, evaluateImm } from './helperFun';

export function Execute() {
    console.log("EXECUTE BEGIN: RA, RB, imm", GlobalVar.RA, GlobalVar.RB, evaluateImm(GlobalVar.immVal));

    if(GlobalVar.isb.isb2.type===null){
        console.log('As a result of last cycle flushing! No task');
        return;
    }
    if (GlobalVar.pipelineEnabled) {
        console.log("HELLo ISB2: Type: ", GlobalVar.isb.isb2.type)
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
    console.log('inB inA', inB, inA);
    console.log("operation", GlobalVar.ALU_op);
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
        console.log("Imm", evaluateImm(GlobalVar.immVal))
        GlobalVar.RZ = inA + evaluateImm(GlobalVar.immVal);
        console.log("RZ", GlobalVar.RZ)
        // Using RB and forwarding it to RM (For both pipelined and non-pipelined instructions)
        if (GlobalVar.pipelineEnabled && (GlobalVar.mode === 1)) {
            // Here prev istruction is prevPrev instruction
            let prevInstrMnenomic = GlobalVar.isb.prevPrevInstrMnenomic;
            if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                console.error("M to M data Forwarding: Prev RM, New RM (=MDR)", GlobalVar.RM, GlobalVar.MDR, GlobalVar.isb.prevPrevInstrMnenomic)
                // ! M to M Data Forwarding
                GlobalVar.isb.dataForwardingType = 3;
                GlobalVar.RM = GlobalVar.MDR;
                console.log("SETTING");
            } else {
                GlobalVar.RM = GlobalVar.RB;
            }
        } else {
            GlobalVar.RM = GlobalVar.RB;
        }
        console.log('RM', GlobalVar.RM);
    }
    else if (GlobalVar.ALU_op == 'lui') {
        GlobalVar.RZ = inB << 12;
    }
    else if (GlobalVar.ALU_op == 'auipc') {
        // TODO: need to use something else (not GlobalVar.PC) maybe returnAddress (DONE)
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
                console.log('evim', evaluateImm(GlobalVar.immVal));
            }
        }
    }


    // Verifing the branch prediction for pipeline enabled
    if (GlobalVar.pipelineEnabled) {
        let instrAddress = GlobalVar.isb.isb2.returnAddress-4;
        if (GlobalVar.type === 'SB') {
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
                    console.log('evim', evaluateImm(GlobalVar.immVal));
                }
            }
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
                        GlobalVar.isb.branchMispredictions++;
                        console.log("MISPREDiCTION");
                        GlobalVar.isb.flushPipeline = true;
                        // toggling the predictor state
                        instance.predictorState = !instance.predictorState;
                        GlobalVar.PC = GlobalVar.isb.branchAddressDef;
                    } else if (instance.predictorState && branchActualCondition) {
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
                    // Only if branchActualCondition is true then we will update PC
                    // Since by default we updated PC = PC+4
                    if (branchActualCondition === true) {
                        // adding this branch instruction instance in BTB
                        GlobalVar.isb.branchTargetBuffer.set(instrAddress, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                        GlobalVar.PC = actualBranchAddress;
                        GlobalVar.isb.flushPipeline = true;
                        console.log('We did\'t had it; Now we do');
                    }
                }
            } else {
                // branch prediction is disabled
                console.log('Branch Prediction Disabled');
                if (branchActualCondition) {
                    // update PC
                    GlobalVar.PC = actualBranchAddress;
                    // flushing the pipeline
                    GlobalVar.isb.flushPipeline = true;
                }
            }
        } else if (GlobalVar.type === 'UJ') {
            let actualBranchAddress = evaluateImm(GlobalVar.immVal) + instrAddress;
            console.error("Branch to: ", actualBranchAddress);
            if (GlobalVar.branchPredEnabled) {
                // If there is no instance of the instruction in BTB
                if (!GlobalVar.isb.branchTargetBuffer.has(instrAddress)) {
                    // adding this jal instruction instance in BTB with predictor state true
                    GlobalVar.isb.branchTargetBuffer.set(instrAddress, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                    // updating PC
                    GlobalVar.PC = actualBranchAddress;
                    GlobalVar.isb.flushPipeline = true;
                }
                // If there is an instance then we are sure that predictorState is true always! No scope for misprediction
            } else {
                // prediction is not enabled
                // We need to flush and update the PC
                GlobalVar.PC = actualBranchAddress;
                // flushing the pipeline
                GlobalVar.isb.flushPipeline = true;
            }

        } else if (GlobalVar.ALU_op === 'jalr') {
            // ! Check this
            console.log("CHECKING inA with RS1: ", inA, GlobalVar.regFile.getRS1())
            let actualBranchAddress = GlobalVar.regFile.getRS1() + evaluateImm(GlobalVar.immVal);
            if (GlobalVar.branchPredEnabled) {
                if (!GlobalVar.isb.branchTargetBuffer.has(instrAddress)) {
                    // No instance found
                    // adding this jalr instruction instance in BTB with predictor state true
                    GlobalVar.isb.branchTargetBuffer.set(instrAddress, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                    // updating PC
                    GlobalVar.PC = actualBranchAddress;
                    GlobalVar.isb.flushPipeline = true;
                } else {
                    // Instance found
                    let instance = GlobalVar.isb.branchTargetBuffer.get(instrAddress);
                    // check if the targetaddress calculated is true or not
                    // If true then no problem else increment stat12 
                    if (instance.branchTargetAddress !== actualBranchAddress) {
                        // setting the updated value in BTB
                        GlobalVar.isb.branchTargetBuffer.set(instrAddress, { 'predictorState': true, 'branchTargetAddress': actualBranchAddress });
                        // updating PC
                        GlobalVar.PC = actualBranchAddress;
                        // increment stat12
                        // GlobalVar.isb.numberOfControlHazardStalls++;
                        GlobalVar.isb.flushPipeline = true;
                    }
                }
            } else {
                // prediction is not enabled
                // We need to flush and update the PC
                GlobalVar.isb.flushPipeline = true;
                GlobalVar.PC = actualBranchAddress;
            }
        }
    }

    // Converting any overflowing number to negative 
    console.log('Without Overflow Check: rz', GlobalVar.RZ)
    GlobalVar.RZ <<= 0;
    console.log('rz', GlobalVar.RZ);
}
