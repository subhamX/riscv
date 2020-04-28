import { GlobalVar } from './Main';
import { addOnesZeros } from './MemFileClass';

// Determines the select lines for muxB, muxY
export function determineSelectLines(t: string) {
    // If the instruction is R or SB type then selectLineB = 0
    if (t == 'R' || t == 'SB') {
        GlobalVar.selectLineB = 0;
        GlobalVar.selectLineY = 0;
    }
    else {
        // for instr. types I, S, U, UJ imm val is passed to inB
        GlobalVar.selectLineB = 1;
    }

    if (t == 'I') {
        // if inst. is load then selectLineY = 1 , get value from MDR
        if (GlobalVar.operationMap.get(GlobalVar.operCode)[0] == 'l') {
            GlobalVar.selectLineY = 1;
        }
        else if (GlobalVar.operationMap.get(GlobalVar.operCode) == 'jalr') {
            GlobalVar.selectLineY = 2;
        }
        else {
            GlobalVar.selectLineY = 0;
        }
    }
    if (t == 'U') {
        GlobalVar.selectLineY = 0;
    }
    if (t == 'UJ') {
        GlobalVar.selectLineY = 2;
    }
    // for store instructions memory address(calculated by alu) will be passed on to RY using selectLineY=0
    if (t == 'S') {
        GlobalVar.selectLineY = 1;
    }

    if(t==='END'){
        // console.log("MUX Y: END reached")
        GlobalVar.selectLineB = 0;
        GlobalVar.selectLineY = 0;
    }
}

export function evaluateImm(imVal: string): number {
    if (imVal === undefined) {
        console.warn("No number passed, returning");
        return;
    }
    imVal = addOnesZeros(imVal);
    return parseInt(imVal, 2) >> 0;
}
