export class RegisterFile{
    // Registers hold the register values
    private Registers: Array<string> = Array<string>();

    // rs1, rs2, rd holds the address of the current instruction's source and destination register
    private RS1: string;
    private RS2: string;
    private RD: string;

    constructor(){
        //initializing every registor with zero
        this.RS1 = "0x00000000";
        this.RS2 = "0x00000000";
        this.RD = "0x00000000";
        this.Registers = "0x00000000 ".repeat(32).split(" ");
        this.Registers.pop();
        
        // initializing sp (x2), gp (x3)
        this.Registers[2] = "0x7FFFFFF0";
        this.Registers[3] = "0x10000000";
    }
    // RS1
    setRS1(rs1Addr: string){
        this.RS1 = rs1Addr;
    }
    getRS1(){
        return this.RS1;
    }
    // RS2
    setRS2(rs2Addr: string){
        this.RS2 = rs2Addr;
    }
    getRS2(){
        return this.RS2;
    }
    // RD
    setRD(rdAddr: string){
        this.RD = rdAddr;
    }
    getRD(){
        return this.RD;
    }
    // REgisters
    setRegVal(regAddr: string, value : string){
        let regIdx = parseInt(regAddr).toString(10);
        this.Registers[regIdx] = value;
    }
    getRegVal(all: boolean, regAddr: string){
        if(all){
            return this.Registers;
        }
        let regIdx = parseInt(regAddr).toString(10);
        let value : string = this.Registers[regIdx];
        return value;
    }
}

// let RegFile : RegisterFile = new RegisterFile();
// RegFile.setRS1("0x01245780");
// console.log(RegFile.getRegVal(false, "0x00000003"));
