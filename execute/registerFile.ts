import { addZeros } from "../encode/helperFun";

export class RegisterFile{
    reg:number[];
    constructor(){
        this.reg = Array<number>(32);
        for(let i=0; i<32; i++){
            this.reg[i] = 0;
        }
        this.reg[2] = 2147483632;
        // Temp
        this.reg[1] = parseInt('0x10000000');
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
    MEM:string[];
    length:number;
    BASEADDR:string;
    constructor(){
        this.length = 40000;
        this.MEM = Array<string>(this.length);
        this.BASEADDR = '0x10000000';
        for(let i=0; i<this.length; i++){
            this.MEM[i] = '00';
        }
    }
    // address contains the effective address, MEM_write and MEM_read are control signals for write and read respectively
    // rM is the data/payload in binary
    process(memoryAddress:string, MEM_read:boolean, MEM_write:boolean, rM:string, type):{memoryData?:number}{
        if(!MEM_write&&!MEM_read){
            return;
        }
        rM = parseInt(rM, 2).toString(16);
        console.log(rM);
        rM = addZeros(rM, 8);
        let index = parseInt(memoryAddress,2) - parseInt(this.BASEADDR);
        let len;
        if(type=='b'){
            len = 1;
        }else if(type=='w'){
            len=4;
        }else if(type=='d'){
            len=8;
        }else if(type=='h'){
            len=2;
        }
        if(MEM_read){
            let t1 = this.readValue(index, len);
            console.log(t1, "Hello");
            return {"memoryData": parseInt(t1, 16)};
        }else if(MEM_write){
            this.writeValue(index, rM, len);
        }
    }
    // Helper Function to Read Value from Memory File
    readValue(index:number, len:number):string{
        let temp = this.MEM.slice(index, index+len);
        let ans:string = "";
        temp.forEach((e) => {
            ans = e.toString() + (ans);
        });
        return ans;
    }
    // Helper Function to Write Value in Memory File
    writeValue(index:number, val:string, len:number){
        // Splitting with separator x | X
        console.log("VAL", val);
        let n = val.length;
        console.log("VALindex", index);
        let tempIndex = index;
        console.log("VALn", n);
        // while len is true and i>=0
        for(let i=n-2; i>=0&&len--; i-=2){
            console.log(index.toString(16), val.slice(i, i+2))
            this.MEM[tempIndex++] = val.slice(i, i+2);
        }
        console.log("Write Successful");
        this.displayViscinity(index);
    }
    displayViscinity(index:number){
        let displayData = {};
        if(index>8){
            let temp = this.MEM.slice(index, index-8);
            temp.forEach((e, ind) => {
                displayData[parseInt(this.BASEADDR)-ind+ index] = e;
            });
        }
        let temp = this.MEM.slice(index, index+8);
        temp.forEach((e, ind) => {
            displayData[(parseInt(this.BASEADDR)+ind+ index).toString(16)] = e;
        });
        console.table(displayData);
    }
}