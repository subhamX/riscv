export class RegisterFile{
    // Registers hold the register values
    private Registers: Array<number> = Array<number>();
    // rs1, rs2, rd holds the address of the current instruction's source and destination register
    private RS2: number;
    private RD: number;
    private RS1: number;

    constructor(){
        //initializing every registor with zero
        this.RS1 = 0;
        this.RS2 = 0;
        this.RD = 0;
        for(let i=0;i<32;i++){
            this.Registers[i]=0;
        }        
        // initializing sp (x2), gp (x3)
        this.Registers[2] = parseInt("0x7FFFFFF0", 16);
        this.Registers[3] = parseInt("0x10000000", 16);
    }
    // RS1
    setRS1(rs1Addr: number){
        this.RS1 = rs1Addr;
    }
    getRS1(){
        return this.getRegVal(this.RS1);
    }
    // RS2
    setRS2(rs2Addr: number){
        this.RS2 = rs2Addr;
    }
    getRS2(){
        return this.getRegVal(this.RS2);
    }
    // RD
    setRD(rdAddr: number){
        this.RD = rdAddr;
    }
    getRD(){
        return this.RD;
    }
    // REgisters
    setRegVal(regAddr: number, value : number){
        this.Registers[regAddr] = value;
    }
    getRegVal(regAddr: number) :number {
        return this.Registers[regAddr];
    }
    getALL(): Array<number>{
        // return type array<number>
        return this.Registers;
    }
}