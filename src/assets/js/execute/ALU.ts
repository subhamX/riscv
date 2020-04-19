import { GlobalVar, UpdatePC } from './Main';
import { determineSelectLines, evaluateImm } from './helperFun';

export function Execute() {
    console.log("EXECUTE BEGIN: RA, RB, imm", GlobalVar.RA, GlobalVar.RB, evaluateImm(GlobalVar.immVal));
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
            console.error("M to M data Forwarding: Prev RM, New RM (=MDR)", GlobalVar.RM, GlobalVar.MDR, GlobalVar.isb.prevPrevInstrMnenomic)
            // Here prev istruction is prevPrev instruction
            let prevInstrMnenomic = GlobalVar.isb.prevPrevInstrMnenomic;
            if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
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

    // Converting any overflowing number to negative 
    GlobalVar.RZ <<= 0;
    console.log('rz', GlobalVar.RZ);
}
