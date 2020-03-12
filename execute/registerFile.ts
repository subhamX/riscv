export class RegisterFile{
    reg:number[];
    constructor(){
        this.reg = Array<number>(32);
        for(let i=0; i<32; i++){
            this.reg[i] = 0;
        }
        this.reg[2] = 200000;
    }
    readValue(num:number):number{
        if(num<=31 && num>=0){
            return this.reg[num];
        }else{
            console.error("Error Encountered! Number range is not between 0-31")
        }
    }
    writeValue(num:number, value:number){
        if(num<=31 && num>=0){
            if(num!=0)
                this.reg[num] = value;
        }else{
            console.error("Error Encountered! Number range is not between 0-31")
        }
    }
}