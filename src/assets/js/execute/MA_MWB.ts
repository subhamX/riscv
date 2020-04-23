import { GlobalVar } from './Main';

// Memory Access and Memory Write Back
export function MemoryOperations() {
    console.log("MEMORY OPERATIONS")
    // If pipeline is enabled
    if (GlobalVar.pipelineEnabled) {
        let opr = GlobalVar.operationMap.get(GlobalVar.isb.isb3.operCode);
        if (GlobalVar.isb.isb3.type === 'S') {
            // Incrementing total number of data transfers
            GlobalVar.numberOfDataTransfers++;
            GlobalVar.MDR = GlobalVar.RM;
            console.log("(STORE)HANU: operCode, opr, RZ(Address), RM(Value)", GlobalVar.isb.isb3.operCode, opr, GlobalVar.RZ, GlobalVar.RM)
            GlobalVar.memFile.MEM_WRITE(GlobalVar.RZ, GlobalVar.RM, opr.slice(1));
        } else if (opr == 'ld' || opr == 'lw' || opr == 'lh' || opr == 'lb') {
            // Incrementing total number of data transfers
            GlobalVar.numberOfDataTransfers++;
            console.log("(LOAD)HANU: operCode, opr, RZ(Address)", GlobalVar.isb.isb3.operCode, opr, GlobalVar.RZ)
            GlobalVar.MDR = GlobalVar.memFile.MEM_READ(GlobalVar.RZ, opr.slice(1));
        }

        // Updating RY
        if (GlobalVar.selectLineY == 0) {
            GlobalVar.RY = GlobalVar.RZ;
            console.log("Chose path from ALU: RY", GlobalVar.RY)
        }
        else if (GlobalVar.selectLineY == 1) {
            GlobalVar.RY = GlobalVar.MDR;
        }
        else if (GlobalVar.selectLineY == 2) {
            console.log("Return address: ", GlobalVar.isb.isb3.returnAddress);
            GlobalVar.RY = GlobalVar.isb.isb3.returnAddress;
        }
        else {
            console.error("Something's Wrong with the select line for muxY");
            return;
        }
    } else {
        // Pipeline is disabled
        let opr = GlobalVar.operationMap.get(GlobalVar.operCode);
        if (GlobalVar.type == 'S') {
            GlobalVar.MDR = GlobalVar.RM;
            GlobalVar.memFile.MEM_WRITE(GlobalVar.RZ, GlobalVar.RM, opr.slice(1));
        }
        else if (opr == 'ld' || opr == 'lw' || opr == 'lh' || opr == 'lb') {
            GlobalVar.MDR = GlobalVar.memFile.MEM_READ(GlobalVar.RZ, opr.slice(1));
        }
        // Updating RY
        if (GlobalVar.selectLineY == 0) {
            GlobalVar.RY = GlobalVar.RZ;
        }
        else if (GlobalVar.selectLineY == 1) {
            GlobalVar.RY = GlobalVar.MDR;
        }
        else if (GlobalVar.selectLineY == 2) {
            GlobalVar.RY = GlobalVar.pcTemp;
        }
        else {
            console.error("Something's Wrong with the select line for muxY");
            return;
        }
    }
}

// Stage - 5
export function WriteBack() {
    console.log("WRITEBACK");
    if (GlobalVar.pipelineEnabled) {
        let type = GlobalVar.isb.isb4.type;
        console.log("WRITE TO: ", GlobalVar.isb.isb4.writeBackRegLocation);
        console.log('type', type);
        if (type == 'R' || type == 'I' || type == 'U' || type == 'UJ') {
            GlobalVar.regFile.setRegVal(GlobalVar.isb.isb4.writeBackRegLocation, GlobalVar.RY);
        }
        console.log("RY", GlobalVar.RY);
    } else {
        console.log('type', GlobalVar.type);
        if (GlobalVar.type == 'R' || GlobalVar.type == 'I' || GlobalVar.type == 'U' || GlobalVar.type == 'UJ') {
            GlobalVar.regFile.setRegVal(GlobalVar.regFile.getRDAddr(), GlobalVar.RY);
        }
        console.log("Ry", GlobalVar.RY);
    }
}
