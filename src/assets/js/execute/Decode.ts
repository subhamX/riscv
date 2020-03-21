import {GlobalVar} from './Main';

export function Decode() {
    // extracting opcode of current instruction
    let opcode = GlobalVar.IR.slice(25, 32);
    // instruction type of current instruction
    GlobalVar.type = GlobalVar.opcodeMap.get(opcode);
    GlobalVar.immVal = "0";
    if(GlobalVar.type == 'R'){
        // operation code
        GlobalVar.operCode = GlobalVar.IR.slice(17 ,20) + GlobalVar.IR.slice(0, 7);
        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));
        console.log('rd', GlobalVar.regFile.getRD());

        let rs1 = GlobalVar.IR.slice(12, 17);
        // console.log("rs1",);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));

        let rs2 = GlobalVar.IR.slice(7 ,12)
        GlobalVar.regFile.setRS2(parseInt(rs2, 2));
        
        // updating RA and RB
        GlobalVar.RA = GlobalVar.regFile.getRS1();
        GlobalVar.RB = GlobalVar.regFile.getRS2();
    }
    else if(GlobalVar.type == 'I'){
        // operation code
        GlobalVar.operCode = opcode + GlobalVar.IR.slice(17, 20);

        if(GlobalVar.operationMap.get(GlobalVar.operCode)=='ld'){
            console.error('`InstructionNotSupportedError: LD is not supported by 32 bit systems!');
            GlobalVar.invalid = true;
            return;
        }

        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));

        let rs1 = GlobalVar.IR.slice(12, 17);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));

        // as RS2 does not have any value
        GlobalVar.regFile.setRS2(null);

        GlobalVar.RA = GlobalVar.regFile.getRS1();
        GlobalVar.RB = GlobalVar.regFile.getRS2();

        GlobalVar.immVal = GlobalVar.IR.slice(0, 12);
        // console.log('GlobalVar.immVal', GlobalVar.immVal);
    }
    else if(GlobalVar.type == 'S'){
        // operation code
        GlobalVar.operCode = opcode + GlobalVar.IR.slice(17, 20);

        if(GlobalVar.operationMap.get(GlobalVar.operCode)=='sd'){
            console.error('`InstructionNotSupportedError: sd is not supported on 64 bit systems!');
            GlobalVar.invalid = true;
            return;
        }

        let rs1 = GlobalVar.IR.slice(12, 17);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));

        let rs2 = GlobalVar.IR.slice(7 ,12)
        GlobalVar.regFile.setRS2(parseInt(rs2, 2));

        let imm4_0 = GlobalVar.IR.slice(20, 25);
        let imm11_5 = GlobalVar.IR.slice(0, 7);
        GlobalVar.immVal = imm11_5 + imm4_0;

        GlobalVar.RA = GlobalVar.regFile.getRS1();
        GlobalVar.RB = GlobalVar.regFile.getRS2();
        // RA has the base address
    }
    else if(GlobalVar.type == 'SB'){
        // operation code
        GlobalVar.operCode = opcode + GlobalVar.IR.slice(17, 20);

        let rs1 = GlobalVar.IR.slice(12, 17);
        GlobalVar.regFile.setRS1(parseInt(rs1, 2));

        let rs2 = GlobalVar.IR.slice(7 ,12)
        GlobalVar.regFile.setRS2(parseInt(rs2, 2));

        // missing lsb of immediate field
        GlobalVar.immVal = GlobalVar.IR[0] + GlobalVar.IR[24] + GlobalVar.IR.slice(1, 7) + GlobalVar.IR.slice(20, 24);
        GlobalVar.immVal = (GlobalVar.immVal + '0');

        GlobalVar.RA = GlobalVar.regFile.getRS1();
        GlobalVar.RB = GlobalVar.regFile.getRS2();
    }
    else if(GlobalVar.type == 'U'){
        // operation code
        GlobalVar.operCode = opcode;

        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));

        // shifting by 12 bits;
        GlobalVar.immVal = GlobalVar.IR.slice(0, 20)
    }
    else if(GlobalVar.type == 'UJ'){
        // operation code
        GlobalVar.operCode = opcode;

        let rd = GlobalVar.IR.slice(20, 25);
        GlobalVar.regFile.setRD(parseInt(rd, 2));

        // missing lsb of immediate
        GlobalVar.immVal = GlobalVar.IR[0] + GlobalVar.IR.slice(12, 20) + GlobalVar.IR[11] + GlobalVar.IR.slice(1, 11);
        GlobalVar.immVal = (GlobalVar.immVal + '0');
        // console.log(GlobalVar.immVal);
    }
    else{
        console.log(GlobalVar.operCode)
        console.error('Not a valid instruction!(invalid Opcode)');
        GlobalVar.invalid = true;
        return;
    }
    GlobalVar.ALU_op = GlobalVar.operationMap.get(GlobalVar.operCode);
    // console.log("value in GlobalVar.RA => " + GlobalVar.RA);
    // console.log("value in GlobalVar.RB => " + GlobalVar.RB);
}
