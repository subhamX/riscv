import * as fs from 'fs';


let pc:number, instr_reg:number;
let selectLineB, selectLineY0, selectLineY1;
function init():void{
    let data = fs.readFileSync(__dirname + "/test/data.m", {encoding: "utf-8"});
    let instructions = data.split('\n');
    // pc = instructions[]
    console.log(instructions);
}

init();





function determineSelectLines(opcode: string){
    // If the instruction is R type then selectLineB = 0
    if(opcode=='0110011'){
        selectLineB=0;
    }else{
        selectLineB=1;
    }
    // If the instruction is auipc then selectLineY1 = 1
    if(opcode=="0010111"){
        selectLineY1 = 1;
    }else{
        selectLineY1 = 0;
    }
    // If the instruction is lw, lh, lb, ld then selectLineY0 = 1
    if(opcode=="0000011"){
        selectLineY0 = 1;
    }else{
        selectLineY0 = 0;
    }
}
