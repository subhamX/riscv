import {GlobalVar, UpdatePC} from './Main';
import {determineSelectLines, evaluateImm} from './helperFun';

export function Execute(immVal : string){
    
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
    console.log("operation", GlobalVar.ALU_op);
    if(GlobalVar.ALU_op == 'add' || GlobalVar.ALU_op == 'addi' || GlobalVar.ALU_op == 'ld' || GlobalVar.ALU_op == 'lb' || GlobalVar.ALU_op == 'lh' || GlobalVar.ALU_op == 'lw'){
        GlobalVar.RZ = inA + inB;
    }
    else if(GlobalVar.ALU_op == 'sub'){
        GlobalVar.RZ = inA - inB;
    }
    else if(GlobalVar.ALU_op == 'div'){
        GlobalVar.RZ = Math.floor(inA/inB);
    }
    else if(GlobalVar.ALU_op == 'rem'){
        GlobalVar.RZ = inA%inB;
    }
    else if(GlobalVar.ALU_op == 'mul'){
        GlobalVar.RZ = inA*inB;
    }
    else if(GlobalVar.ALU_op == 'andi' || GlobalVar.ALU_op == 'and)'){
        GlobalVar.RZ = inA&inB;
    }
    else if(GlobalVar.ALU_op == 'ori' || GlobalVar.ALU_op == 'or'){
        GlobalVar.RZ = inA|inB;
    }
    else if(GlobalVar.ALU_op == 'xor'){
        GlobalVar.RZ = inA^inB;
    }
    else if(GlobalVar.ALU_op == 'beq'){
        if(inA == inB){
            UpdatePC(1, evaluateImm(immVal));
        }
    }
    else if(GlobalVar.ALU_op == 'bne'){
        if(inA != inB){
            UpdatePC(1, evaluateImm(immVal));
        }
    }
    else if(GlobalVar.ALU_op == 'bge'){
        if(inA >= inB){
            UpdatePC(1, evaluateImm(immVal));
        }
    }
    else if(GlobalVar.ALU_op == 'blt'){
        if(inA < inB){
            UpdatePC(1, evaluateImm(immVal));
            console.log('evim', evaluateImm(immVal));
        }
    }
    else if(GlobalVar.ALU_op == 'sll'){
        GlobalVar.RZ = inA << inB;
    }
    else if(GlobalVar.ALU_op == 'slt'){
        console.log(inA, "CHECK");
        console.log(inB, "CHECK");
        GlobalVar.RZ = (inA < inB) ? 1:0;
        console.log(GlobalVar.RZ);
    }
    else if(GlobalVar.ALU_op == 'sra'){
        GlobalVar.RZ = inA >> inB;
        GlobalVar.RZ |= inA & (1<<31);
    }
    else if(GlobalVar.ALU_op == 'srl'){
        GlobalVar.RZ = inA >> inB;
    }
    else if(GlobalVar.ALU_op == 'jalr'){
        GlobalVar.RZ = inA+inB;
        UpdatePC(0);
    }
    else if(GlobalVar.ALU_op == 'sb' || GlobalVar.ALU_op == 'sw' || GlobalVar.ALU_op == 'sd' || GlobalVar.ALU_op == 'sh'){
        GlobalVar.RZ = inA + evaluateImm(immVal);
        GlobalVar.RM = GlobalVar.RB;
        console.log('RM', GlobalVar.RM);
    }
    else if(GlobalVar.ALU_op == 'lui'){
        GlobalVar.RZ = inB << 12;
    }
    else if(GlobalVar.ALU_op == 'auipc'){
        inA = GlobalVar.PC-4;
        GlobalVar.RZ = inA + (inB << 12)
    }
    else if(GlobalVar.ALU_op == 'jal'){
        UpdatePC(1, inB);
    }
    // Converting any overflowing number to negative 
    GlobalVar.RZ <<=0;
    console.log('rz',GlobalVar.RZ);
}
