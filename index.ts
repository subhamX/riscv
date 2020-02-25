import * as fs from 'fs';
import * as schema from './schema/schema';

// DataInterfaceMap maps variable names to its metadata
let DataInterfaceMap: Map<string, schema.DataInterface> = new Map();
// DataInterface contains the data of DataInterface or [.data]
let DataInterface: Array<string> = Array();

// Synchronously reading contents of asm file
let fileData  = fs.readFileSync("test/data.asm", {encoding: 'utf-8'})

let lines: string[] = fileData.split("\n");

for(let line of lines){
    // Using Regex to catch multiple spaces
    let instr = line.split(/[ ]+/);
    let name:string = instr[0];
    let type:string = instr[1];
    let data:string = instr[2];

    // Processing type
    if(type[0]!='.'){
        // Error
    }else{
        type = type.slice(1);
    }

    // Processing name
    if(name[name.length-1]!=':'){
        // Error
    }else{
        name = name.slice(0, name.length);
    }

    // Processing data
    let hexstring = parseInt(data).toString(16);
    // console.log("Hex", hexstring.length);

    // Half Bytes means 4;
    let numberOfHalfBytes:number;
    switch(type){
        case 'word':{
            numberOfHalfBytes = 8;
            break;
        }
        case 'byte':{
            numberOfHalfBytes = 2;
            break;
        }
        case 'dword':{
            numberOfHalfBytes = 16;
            break;  
        }
        case 'half':{
            numberOfHalfBytes = 4;
            break;  
        }
    }
    // Inserting to DataInterfaceMap
    DataInterfaceMap[name] = {"length": numberOfHalfBytes, "type": type, "startIndex": DataInterface.length};
    // Finding number of zeros to be inserted
    let zerosSize = numberOfHalfBytes-hexstring.length;
    // Inserting Zeroes
    while(zerosSize>0){
        hexstring = "0"+hexstring;
        zerosSize--;
    }
    // hexstring is now >=numberOfHalfBytes
    let index = hexstring.length-1;
    for(let i=0; i<numberOfHalfBytes; i+=2){
        let foo = hexstring.slice(index-1, index+1);
        DataInterface.push(foo);
        index-=2;
    }
}

console.log(DataInterfaceMap);
console.log(DataInterface);
