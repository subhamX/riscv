import * as fs from 'fs';
import * as rl from 'readline';
import {Decode} from './Decode';
import {Execute} from './ALU';
import {RegisterFile} from './RegFileClass';
import {opcodeMapfunc, operationMapfunc} from './mapPhase2';
import {MemoryFile, addZeros} from './MemFileClass'
import {MemoryOperations, WriteBack} from './MA_MWB';

export class GlobalVar{
    // PC->Program Counter, IR->Instruction Register
    static PC: number;
    static IR: string;
    static pcTemp: number;
    static regFile:RegisterFile;
    static memFile:MemoryFile;

    static CLOCK:number=0;

    // Holds return address
    static returnAddr;

    // intermediate Registers
    static RA;
    static RB;
    static RZ;
    static RM;
    static RY;
    static MAR;
    static MDR;

    // instruction Type, operation Code, immediate Value
    static type: string;
    static operCode :string;
    static immVal:string;

    // select line for muxB, muxY
    static selectLineB;
    static selectLineY=1;

    // incase of invalid instruction
    static invalid: boolean = false;

    static instructionMap: Map<number, string> = new Map<number, string>();
    // opcode map
    static opcodeMap: Map<string, string> = new Map<string, string>();
    // operation map
    static operationMap : Map<string, string> = new Map<string, string>();
}

const readL = rl.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getPC() : string{
    return '0x'+ GlobalVar.PC.toString(16);
}
function getClocl() : number{
    return GlobalVar.CLOCK;
}

function init(): void {
    // Setting pc and clock
    GlobalVar.PC = 0;
    GlobalVar.CLOCK = 0;
    // let data = fs.readFileSync('./test/test.mc', {encoding: 'utf-8'});
    let data = fs.readFileSync('test/test.mc', {encoding: 'utf-8'});
    let dataArr = data.split('\n');
    let i = 0;
    
    // Loading all instructions of program into instructionMap
    while (dataArr[i]) {
        let key = parseInt(dataArr[i].split(" ")[0], 16);
        let value = dataArr[i].split(" ")[1];
        GlobalVar.instructionMap.set(key, value);
        i++;
        if((parseInt(value) >> 0) == -1){
            break;
        }
    }
    
    opcodeMapfunc(GlobalVar.opcodeMap);
    operationMapfunc(GlobalVar.operationMap);

    // Initializing Register File
    GlobalVar.memFile = new MemoryFile();
    GlobalVar.regFile = new RegisterFile();

    i++;
    while (dataArr[i]) {
        console.log(dataArr[i].split(' '));
        let temp = dataArr[i].split(' ');
        let key = temp[0];
        let value = temp[1];
        if (parseInt(value)) {
            GlobalVar.memFile.WriteData(parseInt(key, 16), value);
        }
        i++;
    }
    askQue();
}

init();

function askQue(){
    readL.question(
      '(current pc:'+ getPC() + ')\n', function(flag){
        if(flag=='step'){
            singleINS();
            if(GlobalVar.invalid){
                console.error("Invalid instruction");
            }
            showState();
            if(!GlobalVar.instructionMap.get(GlobalVar.PC)){
                readL.close();
            }
            askQue();
        }
        else if(flag == 'all'){
            allINS();
            if(GlobalVar.invalid){
                console.error("Invalid instruction");
            }
            showState(true);
            readL.close();
        }
    });
}

function showState(atEndAll?: boolean) {
    console.log(`Current PC: 0x${GlobalVar.PC.toString(16)}`);
    console.log("REGISTER");
    let tempReg = [];
    for (let i = 0; i < 32; i++) {
        tempReg.push({ i: (GlobalVar.regFile.getRegVal(i) >>> 0).toString(16) });
    }
    console.table(tempReg);
    if(GlobalVar.type == GlobalVar.opcodeMap.get('1100011') || atEndAll){
        console.log("MEMORY");
        console.table(GlobalVar.memFile.getMemory());
    };
}

readL.on("close", function(){
    console.log("\nExiting...");
    process.exit(0);
});

function singleINS(){
    console.log('-----------**********------------')
    console.log(`Current PC: 0x${GlobalVar.PC.toString(16)}`);
    Fetch();
    Decode();
    Execute(GlobalVar.operCode, GlobalVar.immVal);
    MemoryOperations();
    WriteBack();
    GlobalVar.CLOCK += 1;
}

function allINS(){
    let no_inst : boolean = false;
    while(1){
        no_inst = Fetch();
        if(no_inst){
            return;
        }
        Decode();
        if(GlobalVar.invalid){
            break;
        }
        Execute(GlobalVar.operCode, GlobalVar.immVal);
        MemoryOperations();
        WriteBack();
        GlobalVar.CLOCK += 1;
    }
}

function Fetch() :boolean {
    // Fetching the current Instruction
    let temp = GlobalVar.instructionMap.get(GlobalVar.PC);
    // Terminating Condition 
    if (!temp) {
        return true;
        // process.exit(0);
    }
    temp = parseInt(temp, 16).toString(2);
    temp = addZeros(temp, 32);
    GlobalVar.IR = temp;
    GlobalVar.pcTemp = GlobalVar.PC;
    GlobalVar.PC += 4;
    return false;
}

export function UpdatePC(PC_Select: number, inpImm?:number) : void{
    GlobalVar.pcTemp = GlobalVar.PC;
    GlobalVar.PC-=4;
    if(PC_Select == 0){
        GlobalVar.PC = GlobalVar.RZ;
    }
    else{
        if(inpImm){
            GlobalVar.PC+=inpImm;
        }
        else{
            GlobalVar.PC+=4;
        }
    }
    return ;
}
