import {GlobalVar, UpdatePC} from './Main';
import {determineSelectLines, evaluateImm} from './helperFun';

export function Execute(operCode : string, immVal : string){
    
    determineSelectLines(GlobalVar.type);
    let inA :number = GlobalVar.regFile.getRS1();
    let inB :number;
    if(GlobalVar.selectLineB==1){
        // console.log("Buzzinga");
        console.log(immVal);
        inB = evaluateImm(immVal);
    }
    else{
        inB = GlobalVar.regFile.getRS2()
    }
    console.log('inB inA', inB, inA);
    // finding operation to be performed
    let ALU_op = GlobalVar.operationMap.get(operCode);
    console.log("operation", ALU_op);
    if(ALU_op == 'add' || ALU_op == 'addi' || ALU_op == 'ld' || ALU_op == 'lb' || ALU_op == 'lh' || ALU_op == 'lw'){
        GlobalVar.RZ = inA + inB;
    }
    else if(ALU_op == 'sub'){
        GlobalVar.RZ = inA - inB;
    }
    else if(ALU_op == 'div'){
        GlobalVar.RZ = Math.floor(inA/inB);
    }
    else if(ALU_op == 'rem'){
        GlobalVar.RZ = inA%inB;
    }
    else if(ALU_op == 'mul'){
        GlobalVar.RZ = inA*inB;
    }
    else if(ALU_op == 'andi' || ALU_op == 'and)'){
        GlobalVar.RZ = inA&inB;
    }
    else if(ALU_op == 'ori' || ALU_op == 'or'){
        GlobalVar.RZ = inA|inB;
    }
    else if(ALU_op == 'xor'){
        GlobalVar.RZ = inA^inB;
    }
    else if(ALU_op == 'beq'){
        if(inA == inB){
            UpdatePC(1, evaluateImm(immVal));
        }
    }
    else if(ALU_op == 'bne'){
        if(inA != inB){
            UpdatePC(1, evaluateImm(immVal));
        }
    }
    else if(ALU_op == 'bge'){
        if(inA >= inB){
            UpdatePC(1, evaluateImm(immVal));
        }
    }
    else if(ALU_op == 'blt'){
        if(inA < inB){
            UpdatePC(1, evaluateImm(immVal));
            console.log('evim', evaluateImm(immVal));
        }
    }
    else if(ALU_op == 'sll'){
        GlobalVar.RZ = inA << inB;
    }
    else if(ALU_op == 'slt'){
        GlobalVar.RZ = (inA < inB) ? 1:0;
    }
    else if(ALU_op == 'sra'){
        GlobalVar.RZ = inA >> inB;
        GlobalVar.RZ |= inA & (1<<31);
    }
    else if(ALU_op == 'srl'){
        GlobalVar.RZ = inA >> inB;
    }
    else if(ALU_op == 'jalr'){
        GlobalVar.PC = inA+inB;
        GlobalVar.RZ = GlobalVar.pcTemp+4;
    }
    else if(ALU_op == 'sb' || ALU_op == 'sw' || ALU_op == 'sd' || ALU_op == 'sh'){
        GlobalVar.RZ = inA + evaluateImm(immVal);
        GlobalVar.RM = GlobalVar.RB;
        console.log('RM', GlobalVar.RM);
    }
    else if(ALU_op == 'lui'){
        GlobalVar.RZ = inB << 12;
    }
    else if(ALU_op == 'auipc'){
        inA = GlobalVar.PC-4;
        GlobalVar.RZ = inA + (inB << 12)
    }
    else if(ALU_op == 'jal'){
        // to update the return address
        GlobalVar.pcTemp = GlobalVar.PC;
        UpdatePC(1, evaluateImm(immVal));
    }
    console.log('rz',GlobalVar.RZ);
}
