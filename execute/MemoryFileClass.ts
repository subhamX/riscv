export class MemoryFile{
    private memory : Array<number>;
    private UpAddr : number;
    stackStart: number = parseInt('0x7FFFFFEC', 16);
    heapStart: number = parseInt('0x10008000', 16);
    dataStart: number = parseInt('0x10000000', 16);
    textStart: number = 0;

    constructor(){
        this.memory = Array<number>(2147483644);
        this.UpAddr = 2147483644;
        for(let i=0;i<2147483644;i++){
            this.memory[i]=0;
        }
    }

    MEM_READ(addr: number, dtype: string): number{
        let temp: string = "";
        let len :number;
        if(dtype == 'b'){len = 1;}
        else if(dtype == 'h'){len = 2;}
        else if(dtype == 'w'){len = 4;}
        else if(dtype == 'd'){len = 8;}
        if(addr<(this.UpAddr+len) && addr>=0){
            for(let i=0;i<len;i++){
                temp = this.memory[addr] + temp;
                addr +=1;
            }
            return parseInt(addOnesZeros(temp), 2)>>0;
        }
        else{
            console.error("Memory Address is out of range");
        }
    }

    MEM_WRITE(addr: number, value:number, dtype:string){
        // TODO: convert negative numbers to binary string
        let len : number;
        if(dtype == 'b'){len = 1;}
        else if(dtype == 'h'){len = 2;}
        else if(dtype == 'w'){len = 4;}
        else if(dtype == 'd'){len = 8;}
        if(addr>=0 && addr < this.UpAddr){
            let tempStr : number;
            for(let i=0;i<len;i++){
                tempStr = value<<((len*8)-(i*8));
                this.memory[addr+i] = tempStr>>(len*8);
            }
        }
        else{
            console.error("Memory Address out of range");
        }
    }
}

// padding of zeros or ones to end up with a 32 bit value
export function addOnesZeros(value: string) :string {
    let pad:string;
    if(value[0]=='1'){
        pad = "1".repeat(32-value.length);
    }
    else{
        pad = "0".repeat(32-value.length);
    }
    return pad+value;
}
