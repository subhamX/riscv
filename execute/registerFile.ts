export class RegisterFile{
    reg:number[];
    constructor(){
        this.reg = Array<number>(32);
        for(let i=0; i<32; i++){
            this.reg[i] = 0;
        }
        this.reg[2] = 2147483632;
    }
    readValue(index:number):number{
        if(index<=31 && index>=0){
            return this.reg[index];
        }else{
            console.error("Error Encountered! Number range is not between 0-31")
        }
    }
    writeValue(index:number, value:number){
        if(index<=31 && index>=0){
            if(index!=0)
                this.reg[index] = value;
        }else{
            console.error("Error Encountered! Number range is not between 0-31")
        }
    }
}

export class MemoryFile{
    MEM:number[];
    BASEADDR:string;
    constructor(){
        this.MEM = Array<number>(4000);
        this.BASEADDR = '0x10000000';
        for(let i=0; i<4000; i++){
            this.MEM[i] = 0;
        }
    }
    // address contains the effective address, MEM_write and MEM_read are control signals for write and read respectively
    // rM is the data/payload
    process(memoryAddress:string, MEM_read:boolean, MEM_write:boolean, rM):{memoryData?:number}{
        let index = parseInt(memoryAddress) - parseInt(this.BASEADDR);
        if(MEM_read){
            let t1 = this.readValue(index);
            return {"memoryData": t1};
        }else if(MEM_write){
            this.writeValue(index, rM);
        }
    }
    readValue(index:number):number{
        return this.MEM[index];
    }
    writeValue(index:number, value:number){
        this.MEM[index] = value;
    }
}