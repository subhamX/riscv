import ace from 'ace-builds/src-min-noconflict/ace';
import { main } from './encode/index';
import * as execute from './execute/Main';
import { addZeros } from './encode/utility'

// Defining theme asset
ace.config.setModuleUrl('ace/theme/monokai', require('ace-builds/src-noconflict/theme-monokai.js'))

// flag to store the current display setting (0 => Hex | 1 => Decimal | 2 => ASCII)
let displaySettings = 0;
var editor: any;
let currPC: number;
// activeElem stores the active element on Navbar
let activeElem = 0;
// 
let dumpSeg: string;
// Function to setup the editor
function setupEditor() {
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setTabSize(4);
    editor.setOptions({
        fontFamily: "monospace",
        fontSize: "14pt"
    });
    editor.setShowPrintMargin(false);
    editor.session.setUseSoftTabs(true);
    editor.commands.addCommand({
        name: 'addComment',
        bindKey: { win: 'Ctrl-/', mac: 'Command-/' },
        exec: function (editor) {
            let range = editor.getSelectionRange()
            let start = range["start"]["row"]
            let end = range["end"]["row"]
            for (let i = start; i <= end; i++) {
                console.log()
                if (editor.session.getLine(i)[0] != '#') {
                    editor.session.insert({ "row": i, "column": 0 }, "# ");
                }
            }
        },
        readOnly: false
    });
}

// Helper Function to create an instruction element
function createInstrElement(pcVal: any, machineCodeVal: any, originalCodeVal: any): HTMLDivElement {
    let pc = document.createElement('span');
    let machineCode = document.createElement('span');
    let originalCode = document.createElement('span');
    pc.innerText = pcVal;
    originalCode.innerText = originalCodeVal;
    machineCode.innerText = machineCodeVal;
    let div = document.createElement('div');
    div.classList.add(`meta_instructions`);
    div.classList.add(`pc${parseInt(pcVal)}`);
    div.appendChild(pc);
    div.appendChild(machineCode);
    div.appendChild(originalCode);
    div.addEventListener('click', (e) => {
        let parentElem = e.target["parentElement"];
        if (parentElem.classList.contains('breakpoint_statement')) {
            e.target["parentElement"].classList.remove('breakpoint_statement');
        } else {
            e.target["parentElement"].classList.add('breakpoint_statement');
        }
    })
    return div;
}

document.addEventListener("DOMContentLoaded", () => {
    setupEditor();
    let navbarBtns = document.querySelectorAll(".toggle-wrapper a");
    navbarBtns[activeElem].classList.add("active");
    navbarBtns.forEach((e, index) => {
        e.addEventListener('click', () => {
            let prevActive = activeElem;
            if (prevActive == 0) {
                disableEditor();
            } else if (prevActive == 1) {
                disableSimulator();
            } else if (prevActive == 2) {
                document.getElementById('aboutsection').style.display = 'none';
            }
            if (index == 0) {
                activateEditor();
            } else if (index == 1) {
                activateSimulator();
            } else if (index == 2) {
                document.getElementById('aboutsection').style.display = 'block';
            }
            navbarBtns[activeElem].classList.remove("active");
            activeElem = index;
            navbarBtns[activeElem].classList.add("active");
        })
    })
})

// Function to remove all instructions
function removeAllInstruction() {
    document.querySelectorAll('.meta_instructions').forEach(e => {
        e.remove();
    })
}

// Wrapper function to disable editor
function disableEditor() {
    document.getElementById("editor").style.display = 'none';
}

// Wrapper function to activate editor
function activateEditor() {
    document.getElementById("editor").style.display = 'block';
    activateAssembleAndSimulateBtn();
    // Remove all instruction
    removeAllInstruction();
}


// Function to handle the event Assemble And Simulate Btn
document.querySelector('.assemble_btn').addEventListener('click', handleAssembleAndSimulate);
function handleAssembleAndSimulate() {
    let fileData = editor.getValue();
    console.log(fileData);
    if (!fileData) {
        document.querySelector('.simulator')["style"].display = 'block';
        return false;
    }
    let response = main(fileData);
    if (response.error) {
        // Showing Error Message
        alert("Error Occurred! " + response.errorMessage);
        return true;
    }
    let codeSegWrapper = document.querySelector('.code_segment_wrapper');
    let instrWrapper = document.querySelector('.instructions_wrapper');
    instrWrapper.remove();
    instrWrapper = document.createElement('div');
    instrWrapper.classList.add('instructions_wrapper');
    console.log(response);
    // For Dumping in future
    dumpSeg = response.codeSegment;
    let assembledCode = response.codeSegment.split('\n');
    // Showing assembledCode | PC | originalCode
    for (let i = 0; i < assembledCode.length; i++) {
        let e = assembledCode[i];
        let instr = e.split(" ");
        let pc = instr[0];
        let machineCode = instr[1];
        let originalCode = instr.slice(2).join(" ");
        console.log(pc);
        console.log(machineCode);
        console.log(originalCode);
        if (machineCode == '0xffffffff') {
            codeSegWrapper.appendChild(instrWrapper);
            break;
        }
        let elem = createInstrElement(pc, machineCode, originalCode);
        elem.addEventListener("click", (e) => {
            console.log(e.target);
        })
        instrWrapper.appendChild(elem);
    }
    currPC = 0;
    // Initializing Execute Statement
    console.log("CHECK", response.codeSegment);
    execute.init(response.codeSegment);
    // Updaing Register and Memory State
    updateRegAndMemState();
    // Replacing the buttons bars with RUN | STEP | SIMULATE
    document.querySelector('.simulate_btns_wrapper')['style'].display = 'none'
    document.querySelector('.simulate1_btns_wrapper')["style"].display = 'flex';
    updateHighlightedInst(-1);
    return false;
}

// Wrapper function to activate simulator
function activateSimulator() {
    document.getElementsByClassName('simulator-wapper')[0]["style"].display = "grid";
}

// Wrapper function to disable simulator
function disableSimulator() {
    document.querySelector('.simulator-wapper')['style'].display = 'none';
}


// Toggling Memory And Register In Data Pane
// Handling click event of memory btn on memory pane
document.querySelector(".memory_btn").addEventListener("click", () => {
    let memButton = document.querySelector(".memory_btn");
    let regButton = document.querySelector(".register_btn");
    let regWrapper = document.querySelector(".registers_wrapper");
    let memWrapper = document.querySelector(".mem_data_wrapper");
    memButton.classList.add("active_btn");
    regButton.classList.remove("active_btn");
    memWrapper["style"].display = 'block';
    regWrapper["style"].display = 'none';
})

// Handling click event of register btn on memory pane
document.querySelector(".register_btn").addEventListener("click", () => {
    let memButton = document.querySelector(".memory_btn");
    let regButton = document.querySelector(".register_btn");
    let regWrapper = document.querySelector(".registers_wrapper");
    let memWrapper = document.querySelector(".mem_data_wrapper");
    memButton.classList.remove("active_btn");
    regButton.classList.add("active_btn");
    memWrapper["style"].display = 'none';
    regWrapper["style"].display = 'block';
})



// Handling click event of Cancel Button before Assemble
document.querySelector('.simulate_btns_wrapper .cancel_btn').addEventListener('click', () => {
    (<HTMLElement>document.querySelector('.editor-btn')).click();
})

// Handling click event of Cancel Button After Assemble
document.querySelector('.simulate1_btns_wrapper .cancel_btn').addEventListener('click', () => {
    document.querySelector('.simulate_btns_wrapper')['style'].display = 'flex'
    document.querySelector('.simulate1_btns_wrapper')["style"].display = 'none';
    // Remove all instrcutions
    document.querySelectorAll('.meta_instructions').forEach(e => {
        e.remove();
    })
})



// Helper function to create register element
function createRegisterElem(regNumber, data) {
    let div = document.createElement('div');
    div.classList.add('register_data');
    div.classList.add(`register${regNumber}`);
    let spanLabel = document.createElement('span');
    spanLabel.classList.add('reg_label');
    spanLabel.innerText = `x${regNumber}`;
    let spanData = document.createElement('span');
    spanData.classList.add('reg_data');
    spanData.innerText = data;
    div.appendChild(spanLabel);
    div.appendChild(spanData);
    return div;
}

// Helper function to create memory element
function createMemoryElem(address: number, data) {
    let div = document.createElement('div');
    div.classList.add('memory_data');
    div.classList.add(`memory${address}`);
    let spanLabel = document.createElement('span');
    spanLabel.classList.add('mem_label');
    spanLabel.innerText = `0x${address.toString(16)}`;
    let spanData = document.createElement('span');
    spanData.classList.add('mem_data');
    spanData.innerText = data;
    div.appendChild(spanLabel);
    div.appendChild(spanData);
    return div;
}

// Helper function to write data into register
function writeRegisters() {
    for (let i = 0; i < 32; i++) {
        let div;
        if (i == 2) {
            div = createRegisterElem(i, getRegValToDisplay(2147483632));
        } else if (i == 3) {
            div = createRegisterElem(i, getRegValToDisplay(268435456));
        } else {
            div = createRegisterElem(i, getRegValToDisplay(0));
        }
        document.getElementsByClassName('registers_wrapper')[0].appendChild(div);
    }
}

// Showing demo content in Memory Segment
function writeMemory() {
    for (let i = 0; i < 4; i++) {
        let value = getMemValToDisplay(0);
        let div = createMemoryElem((268435456 + i), value);
        document.getElementsByClassName('memory_wrapper')[0].appendChild(div);

    }
}

writeMemory();
writeRegisters();


function getMemValToDisplay(num: number) {
    let value;
    if (displaySettings == 0) {
        value = `0x${addZeros(num.toString(16), 2)}`;
    } else if (displaySettings == 1) {
        value = num.toString();
    } else {
        value = `${String.fromCodePoint(num)} [0x${addZeros(num.toString(16), 2)}]`
    }
    return value;
}

// Helper function to 
function getRegValToDisplay(num: number) {
    let value;
    if (displaySettings == 1) {
        value = num.toString();
    } else {
        value = `0x${addZeros(num.toString(16).toUpperCase(), 8)}`;
    }
    return value;
}




// Function to update Registers and Memory after each instruction exectution
function updateRegAndMemState() {
    let mem: Map<number, number> = execute.GlobalVar.memFile.getMemory();
    let regFile = execute.GlobalVar.regFile.getALL();
    regFile.forEach((val, index) => {
        let div = document.querySelector(`.registers_wrapper .register${index}`);
        let regData = div.querySelector('.reg_data') as HTMLElement;
        regData.innerText = getRegValToDisplay(val);
    });
    mem.forEach((val, key) => {
        console.log(key);
        let div = document.querySelector(`.memory_wrapper .memory${key}`);
        console.log(div);
        let displayNum = getMemValToDisplay(val);
        if (div) {
            let memData = div.querySelector('.mem_data') as HTMLElement;
            memData.innerText = displayNum;
        } else {
            let div = createMemoryElem(key, displayNum);
            document.getElementsByClassName('memory_wrapper')[0].append(div);
        }
    });
}

// Handling Click Event Of Step Button
document.getElementsByClassName('step_btn')[0].addEventListener('click', () => {
    execute.singleINS();
    updateRegAndMemState();
    let prevHighlighted = currPC;
    currPC = execute.getPC();
    if (execute.getInstrReg() == '0xffffffff') {
        activateAssembleAndSimulateBtn();
        return;
    }
    updateHighlightedInst(prevHighlighted)
})

// Handling Click Event Of Run Button
document.getElementsByClassName('run_btn')[0].addEventListener('click', () => {
    execute.allINS();
    updateRegAndMemState();
    activateAssembleAndSimulateBtn();
})


// Handling Clicking Event Of Hex Button
document.getElementById('hex_btn').addEventListener('click', () => {
    if (displaySettings != 0) {
        let prevDisplaySettings = displaySettings;
        displaySettings = 0;
        onSettingsChange(prevDisplaySettings);
    }
})

// Handling Clicking Event Of ASCII Button
document.getElementById('ascii_btn').addEventListener('click', () => {
    if (displaySettings != 2) {
        let prevDisplaySettings = displaySettings;
        displaySettings = 2;
        onSettingsChange(prevDisplaySettings);
    }
})

// Handling Clicking Event Of Decimal Button
document.getElementById('decimal_btn').addEventListener('click', () => {
    if (displaySettings != 1) {
        let prevDisplaySettings = displaySettings;
        displaySettings = 1;
        onSettingsChange(prevDisplaySettings);
    }
})

// Function to transform the current values Registers and Memory Segment
function onSettingsChange(prevDisplaySettings: number) {
    let currRegs = Array.from(document.getElementsByClassName('register_data'));
    currRegs.forEach((e) => {
        e.children[1].innerHTML = getRegValToDisplay(parseInt(e.children[1].innerHTML));
    })
    let currMems = Array.from(document.getElementsByClassName('memory_data'));
    currMems.forEach((e) => {
        if (prevDisplaySettings == 2) {
            let val = e.children[1].innerHTML.match(/\[.+\]/)[0].split(/\[|\]/).join('');
            e.children[1].innerHTML = getMemValToDisplay(parseInt(val));
        } else {
            e.children[1].innerHTML = getMemValToDisplay(parseInt(e.children[1].innerHTML));
        }
    })
}



function activateAssembleAndSimulateBtn() {
    document.querySelector('.simulate_btns_wrapper')['style'].display = 'flex'
    document.querySelector('.simulate1_btns_wrapper')["style"].display = 'none';
}


// TODO: Search Feature
// document.getElementById('mem_addr_val').addEventListener('keyup', (e) => {
//     if(e.keyCode===13){
//         // Enter Key is pressed
//         let val = parseInt(e.target["value"]);

//         if(!isNaN(val)){
//             let memFile = execute.GlobalVar.memFile.getMemory();

//         }
//         console.log()
//     }
// })

// Function to Highlight the Current Instruction 
function updateHighlightedInst(prevPC: number) {
    let prevInstr = document.getElementsByClassName(`pc${prevPC}`)[0];
    if (prevInstr) {
        prevInstr.classList.remove('active_statement')
    }
    let currInstr = document.getElementsByClassName(`pc${currPC}`)[0];
    if (currInstr) {
        currInstr.classList.add('active_statement');

    }
}

// Handle Click Event Of Dump Button
document.querySelector('.dump_btn').addEventListener('click', (e) => {
    let dumpArray = [];
    dumpSeg.split("\n").forEach((e) => {
        if (e) {
            let ins = e.split(' ');
            dumpArray.push(`${ins[0]} ${ins[1]}`)
            if (ins[1] == '0xffffffff') {
                dumpArray.push('');
            }
        }
    })
    navigator.clipboard.writeText(dumpArray.join('\n')).then(function () {
        alert('Code Dump to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
})