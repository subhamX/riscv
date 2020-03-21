import {GlobalVar} from './Main';

// Memory Access and Memory Write Back
export function MemoryOperations(){
    let opr = GlobalVar.operationMap.get(GlobalVar.operCode);
    if(GlobalVar.type == 'S'){
        GlobalVar.MDR = GlobalVar.RM;
        GlobalVar.memFile.MEM_WRITE(GlobalVar.RZ, GlobalVar.RM, opr.slice(1));
    }
    else if(opr == 'ld'|| opr == 'lw'|| opr == 'lh'|| opr == 'lb'){
        GlobalVar.MDR = GlobalVar.memFile.MEM_READ(GlobalVar.RZ, opr.slice(1));
    }

    // Updating RY
    if(GlobalVar.selectLineY==0){
        GlobalVar.RY = GlobalVar.RZ;
    }
    else if(GlobalVar.selectLineY==1){
        GlobalVar.RY = GlobalVar.MDR;
    }
    else if(GlobalVar.selectLineY==2){
        GlobalVar.RY = GlobalVar.pcTemp;
    }
    else{
        console.error("Something's Wrong with the select line for muxY");
        return;
    }
}

// Stage - 5
export function WriteBack(){
    console.log('type', GlobalVar.type);
    if(GlobalVar.type == 'R'|| GlobalVar.type == 'I' || GlobalVar.type == 'U' || GlobalVar.type == 'UJ'){
        GlobalVar.regFile.setRegVal(GlobalVar.regFile.getRD(), GlobalVar.RY);
    }
    console.log("RY",GlobalVar.RY);
}
