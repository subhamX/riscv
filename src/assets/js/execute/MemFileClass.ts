export class MemoryFile{
    private memory : Map<number, number>;
    private UpAddr : number;
    constructor(){
        this.memory = new Map<number, number>();
    }

    getMemory(){
        // return only those memory slots that has been used in the program
        // return type map
        return this.memory;
    }
    MEM_READ(addr: number, dtype: string): number{
        let temp: string = "";
        let len :number;
        if(dtype == 'b'){len = 1;}
        else if(dtype == 'h'){len = 2;}
        else if(dtype == 'w'){len = 4;}
        else if(dtype == 'd'){len = 8;}
        let temp1, val;
        for(let i=0;i<len;i++){
            val = this.memory.get(addr+i);
            if(val==null){
                console.log('set', )
                this.memory.set(addr+i, 0);
                val = this.memory.get(addr+i);
            }
            if(val>=0){
                temp1 = addZeros((val).toString(2), 8);
            }
            else{
                temp1 = ( val >>> 0).toString(2);
                temp1 = temp1.slice(temp1.length-8, temp1.length);
            }
            temp = temp1+ temp;
        }
        return parseInt(addOnesZeros(temp), 2)>>0;
    }

    MEM_WRITE(addr: number, value:number, dtype:string){
        let len : number;
        if(dtype == 'b'){len = 1;}
        else if(dtype == 'h'){len = 2;}
        else if(dtype == 'w'){len = 4;}
        else if(dtype == 'd'){len = 8;}
        let valString : string, tempStr : string;
        if(value>=0){
            valString = addZeros(value.toString(2), 8*len);
        }
        else{
            valString = (value >>> 0).toString(2);
        }
        for(let i=0;i<len;i++){
            tempStr = valString.slice((len-i-1)*8, (len-i)*8);
            tempStr = addOnesZeros(tempStr);
            let val = parseInt(tempStr, 2)>>0;
            this.memory.set((addr + i), val);
        }
        console.table(this.memory);
    }

    WriteData(addr: number, value: string){
        let paddedVal = addZeros(parseInt(value, 16).toString(2), 8);
        paddedVal = addOnesZeros(paddedVal);
        this.memory.set(addr, parseInt(paddedVal, 2)>>0);
        console.log(addr, parseInt(paddedVal, 2)>>0);
    }
}

// padding of zeros or ones to end up with a 32 bit value
export function addOnesZeros(value: string, len?:number) :string {
    let pad:string;
    if(!len){
        len = 32
    }
    if(value[0]=='1'){
        pad = "1".repeat(len-value.length);
    }
    else{
        pad = "0".repeat(len-value.length);
    }
    return pad+value;
}

export function addZeros(imm:string, length: number):string{
    let n = length - imm.length;
    let immPad = "0".repeat(n);
    return immPad + imm;
}