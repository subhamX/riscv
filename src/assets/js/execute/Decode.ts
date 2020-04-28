import { GlobalVar } from './Main';
import { evaluateImm } from './helperFun';

export function Decode() {
    if (GlobalVar.IR === null) {
        GlobalVar.type = null;
        // console.log('ONLY POSSIBLE IF THERE IS MISPREDICTION!');
        return;
    }
    // extracting opcode of current instruction
    let opcode = GlobalVar.IR.slice(25, 32);
    // setting instruction type of current instruction
    GlobalVar.type = GlobalVar.opcodeMap.get(GlobalVar.IR.slice(25, 32));
    GlobalVar.immVal = "0";
    if (GlobalVar.type == 'R') {
        // for R type instructions ( func7 | rs2 | rs1 | func3 | rd | opcode )
        // Passing => rA = rs1 and rB = rs2
        GlobalVar.operCode = GlobalVar.IR.slice(17, 20) + GlobalVar.IR.slice(0, 7);

        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));

        let rs1 = GlobalVar.IR.slice(12, 17);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));

        let rs2 = GlobalVar.IR.slice(7, 12)
        GlobalVar.regFile.setRS2(parseInt(rs2, 2));
    }
    else if (GlobalVar.type == 'I') {
        // for I type instructions ( imm | rs1 | func3 | rd | opcode )
        // Passing => rA = rs1
        GlobalVar.operCode = opcode + GlobalVar.IR.slice(17, 20);

        if (GlobalVar.operationMap.get(GlobalVar.operCode) == 'ld') {
            console.error('Instruction Not Supported: LD is not supported by 32 bit systems!');
            GlobalVar.invalid = true;
            return;
        }

        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));

        let rs1 = GlobalVar.IR.slice(12, 17);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));

        // as RS2 does not have any value
        GlobalVar.regFile.setRS2(null);

        GlobalVar.immVal = GlobalVar.IR.slice(0, 12);
        // console.log('GlobalVar.immVal', GlobalVar.immVal);
    }
    else if (GlobalVar.type == 'S') {
        // for S type instructions ( imm | rs2 | rs1 | func3 | imm | opcode )
        // Passing => rA = rs1 and rB = rs2
        // rs1 has the base address

        GlobalVar.operCode = opcode + GlobalVar.IR.slice(17, 20);

        if (GlobalVar.operationMap.get(GlobalVar.operCode) == 'sd') {
            console.error('Instruction Not Supported: LD is not supported by 32 bit systems!');
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

    }
    else if (GlobalVar.type == 'SB') {
        // for SB type instructions ( imm | rs2 | rs1 | func3 | imm | opcode )
        // Passing => rA = rs1 and rB = rs2
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
    }
    else if (GlobalVar.type == 'U') {
        // for U type instructions ( imm | rd | opcode )

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
        // for UJ type instructions ( imm | rd | opcode )

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
        // console.warn("Decoding the End");
    } else {
        console.log(GlobalVar.operCode)
        console.error('Not a valid instruction!(Invalid Opcode)');
        GlobalVar.invalid = true;
        return;
    }
    GlobalVar.ALU_op = GlobalVar.operationMap.get(GlobalVar.operCode);

    let locationA = GlobalVar.regFile.getR1Addr();
    let stallRA: number = 0;
    // console.log("locationA:", locationA);

    // Only for R || I || S || SB instructions rs1 is set
    if (locationA && (GlobalVar.pipelineEnabled) && (locationA === GlobalVar.isb.prevWriteReg && locationA != 0)) {
        // Pipelining is Enabled 
        if (GlobalVar.mode == 1) {
            // Data Forwarding is Enabled
            let prevInstrMnenomic = GlobalVar.isb.prevInstrMnenomic;
            if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                // stalling
                stallRA = 1;
            } else if (prevInstrMnenomic === 'jal' || prevInstrMnenomic === 'jalr') {
                // no stall
                // only possible if jal/jalr is prev actually with no misprediction [i.e prediction was correct]
                console.warn('(jal/jalr is prev instruction with no misprediction)');
                stallRA = 0;
                // No dataForwardingType assigned for GUI since it is from ISB
                GlobalVar.RA = GlobalVar.isb.isb2.returnAddress;
            } else {
                // no stall
                stallRA = 0;
                // E to E data Forwarding
                GlobalVar.isb.dataForwardingType = 1;
                // console.warn("1=>(E2E)Data Forwarding: RA = ", GlobalVar.RZ);
                GlobalVar.RA = GlobalVar.RZ;
            }
        } else {
            // Data Forwarding is disabled
            stallRA = 1;
        }
    } else if (locationA && (GlobalVar.pipelineEnabled) && (locationA == GlobalVar.isb.prevPrevWriteReg && GlobalVar.isb.prevPrevWriteReg != 0)) {
        if (GlobalVar.mode === 1) {
            // Data Forwarding is Enabled
            // no stalling
            stallRA = 0;
            // M to E data Forwarding
            GlobalVar.isb.dataForwardingType = 2;
            // console.warn("1=>(M2E)Data Forwarding: RA = ", GlobalVar.RY);
            GlobalVar.RA = GlobalVar.RY;
        } else {
            // Data Forwarding is Disabled
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

    // Need to handle for R, SB, S
    if (GlobalVar.type === 'R' || GlobalVar.type === 'SB') {
        if (locationB && (GlobalVar.pipelineEnabled) && GlobalVar.isb.prevWriteReg && locationB === GlobalVar.isb.prevWriteReg) {
            if (GlobalVar.mode === 1) {
                // Data Forwarding is enabled
                let prevInstrMnenomic = GlobalVar.isb.prevInstrMnenomic;
                if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                    // stalling
                    stallRB = 1;
                } else if (prevInstrMnenomic === 'jal' || prevInstrMnenomic === 'jalr') {
                    // not stalling
                    // only possible if jal is prev actually with no misprediction [i.e prediction was correct]
                    console.warn('(jal is prev actually with no misprediction)Taking data from ISB JAL or JALR! 2');
                    stallRB = 0;
                    GlobalVar.RB = GlobalVar.isb.isb2.returnAddress;
                } else {
                    // no stalling
                    stallRB = 0;
                    // E to E data Forwarding
                    GlobalVar.isb.dataForwardingType = 1;
                    // console.warn("2=>(E2E)Data Forwarding: RB = ", GlobalVar.RZ);
                    GlobalVar.RB = GlobalVar.RZ;
                }
            } else {
                // Data Forwarding is disabled
                // stalling
                stallRB = 1;
            }
        } else if (locationB && (GlobalVar.pipelineEnabled) && GlobalVar.isb.prevPrevWriteReg && locationB === GlobalVar.isb.prevPrevWriteReg) {
            if (GlobalVar.mode === 1) {
                // Data Forwarding is enabled
                // no stall
                stallRB = 0;
                // M to E data Forwarding
                GlobalVar.isb.dataForwardingType = 2;
                // console.warn("2=>(M2E)Data Forwarding: RB = ", GlobalVar.RY);
                GlobalVar.RB = GlobalVar.RY;
            } else {
                // stalling
                stallRB = 2;
            }
        } else {
            // either pipeline is not enabled or there is no data dependency which is causing hazard
            stallRB = 0;
            GlobalVar.RB = GlobalVar.regFile.getRS2();
        }
    } else if (GlobalVar.type === 'S') {
        if (locationB && (GlobalVar.pipelineEnabled) && GlobalVar.isb.prevWriteReg && locationB === GlobalVar.isb.prevWriteReg) {
            if (GlobalVar.mode === 1) {
                // Data Forwarding is enabled
                let prevInstrMnenomic = GlobalVar.isb.prevInstrMnenomic;
                if (prevInstrMnenomic === 'lw' || prevInstrMnenomic === 'lb' || prevInstrMnenomic === 'lh') {
                    stallRB = 0;
                    // console.warn("NOT STALLING as it will be handled by ALU (M to M data forwarding)")
                    // M to M data forwarding will be done at ALU
                    GlobalVar.RB = GlobalVar.regFile.getRS2();
                    // Dummy Val
                } else if (prevInstrMnenomic === 'jal' || prevInstrMnenomic === 'jalr') {
                    // not stalling
                    // only possible if jal is prev actually with no misprediction [i.e prediction was correct]
                    console.warn('(jal is prev actually with no misprediction)Taking data from ISB JAL or JALR! 3');
                    stallRB = 0;
                    GlobalVar.RB = GlobalVar.isb.isb2.returnAddress;
                } else {
                    // E to E data Forwarding
                    stallRB = 0;
                    // console.warn("3=>(E2E)Data Forwarding: RB = ", GlobalVar.RZ);
                    // Forwarding Data
                    GlobalVar.RB = GlobalVar.RZ;
                    GlobalVar.isb.dataForwardingType = 1;
                }
            } else {
                // Data Forwarding is disabled and only pipelining is enabled
                stallRB = 1;
            }
        } else if (locationB && (GlobalVar.pipelineEnabled) && GlobalVar.isb.prevPrevWriteReg && locationB === GlobalVar.isb.prevPrevWriteReg) {
            if (GlobalVar.mode === 1) {
                // Data Forwarding is enabled
                stallRB = 0;
                // M to E data Forwarding
                GlobalVar.RB = GlobalVar.RY;
                GlobalVar.isb.dataForwardingType = 2;
            } else {
                stallRB = 2;
            }
        } else {
            // either pipeline is not enabled or there is no data dependency which is causing hazard
            stallRB = 0;
            // Check if this statement is necessary. Since ALU uses does it too.
            GlobalVar.RB = GlobalVar.regFile.getRS2();
        }
    }


    [GlobalVar.isb.isb2, GlobalVar.isb.isb3].forEach((e) => {
        if (locationA && (e.writeBackRegLocation === locationA)) {
            GlobalVar.dataHazardMap.set(`${GlobalVar.isb.isb1.returnAddress - 4}-${e.returnAddress - 4}A`, locationA.toString());
        }
        if (locationB && e.writeBackRegLocation === locationB) {
            GlobalVar.dataHazardMap.set(`${GlobalVar.isb.isb1.returnAddress - 4}-${e.returnAddress - 4}B`, locationB.toString());
        }
    })
    if(GlobalVar.isb.isb2.type===null && GlobalVar.isb.isb3.type===null){
        let e = GlobalVar.isb.isb4;
        if (locationA && (e.writeBackRegLocation === locationA)) {
            GlobalVar.dataHazardMap.set(`${GlobalVar.isb.isb1.returnAddress - 4}-${e.returnAddress - 4}A`, locationA.toString());
        }
        if (locationB && e.writeBackRegLocation === locationB) {
            GlobalVar.dataHazardMap.set(`${GlobalVar.isb.isb1.returnAddress - 4}-${e.returnAddress - 4}B`, locationB.toString());
        }
    }



    // Increment the stall count
    if (stallRB || stallRA) {
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
        GlobalVar.isb.prevWriteReg = GlobalVar.regFile.getRDAddr();
    }

}
