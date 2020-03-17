import ace from 'ace-builds/src-min-noconflict/ace';
import { main } from './encode/index';
ace.config.setModuleUrl('ace/theme/monokai', require('ace-builds/src-noconflict/theme-monokai.js'))
var editor;

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

// Helper Function to create an instruction element for DOM
function createInstrElement(pcVal, machineCodeVal, originalCodeVal) {
    let pc = document.createElement('span');
    let machineCode = document.createElement('span');
    let originalCode = document.createElement('span');
    pc.innerText = pcVal;
    originalCode.innerText = originalCodeVal;
    machineCode.innerText = machineCodeVal;
    let div = document.createElement('div');
    div.classList.add('meta_instructions');
    div.appendChild(pc);
    div.appendChild(machineCode);
    div.appendChild(originalCode);
    return div;
}

let navbarBtns: NodeListOf<Element>, activeElem = 0;
document.addEventListener("DOMContentLoaded", () => {
    setupEditor();
    navbarBtns = document.querySelectorAll(".toggle-wrapper a");
    navbarBtns[activeElem].classList.add("active");
    navbarBtns.forEach((e, index) => {
        e.addEventListener('click', () => {
            let prevActive = activeElem;
            if (prevActive == 0) {
                disableEditor();
            } else if (prevActive == 1) {
                disableSimulator();
            } else if (prevActive == 2) {
            }
            if (index == 0) {
                activateEditor();
            } else if (index == 1) {
                activateSimulator();
            } else if (index == 2) {

            }
            navbarBtns[activeElem].classList.remove("active");
            activeElem = index;
            navbarBtns[activeElem].classList.add("active");
        })
    })
})

// Wrapper function to disable editor
function disableEditor() {
    document.getElementById("editor").style.display = 'none';
}

// Wrapper function to activate editor
function activateEditor() {
    document.getElementById("editor").style.display = 'block';
}



// Function to handle the event Assemble And Simulate
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
        alert("Error Occurred at line: " + response.error);
        // sending error flag as true
        return true;
    }
    console.log(response);
    let assembledCode = response.codeSegment;
    assembledCode.forEach((e) => {
        let instr = e.split(" ");
        let pc = instr[0];
        let machineCode = instr[1];
        let originalCode = instr.slice(2).join(" ");
        console.log(pc);
        console.log(machineCode);
        console.log(originalCode);
        let instrWrapper = document.querySelector('.instructions_wrapper');
        if (machineCode == '0xffffffff') {
            return;
        }
        let elem = createInstrElement(pc, machineCode, originalCode);
        elem.addEventListener("click", (e) => {
            console.log(e.target);
        })
        instrWrapper.appendChild(elem);
    });
    // TODO: Implement Error Flag
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

// Handling click event of Assemble Btn
document.querySelector('.assemble_btn').addEventListener('click', (e) => {
    document.querySelector('.simulate_btns_wrapper')['style'].display = 'none'
    document.querySelector('.simulate1_btns_wrapper')["style"].display = 'flex';
})

// Handling click event of Cancel Button before Assemble
document.querySelector('.simulate_btns_wrapper .cancel_btn').addEventListener('click', ()=> {
    (<HTMLElement>document.querySelector('.editor-btn')).click();
})

// Handling click event of Cancel Button After Assemble
document.querySelector('.simulate1_btns_wrapper .cancel_btn').addEventListener('click', ()=> {
    document.querySelector('.simulate_btns_wrapper')['style'].display = 'flex'
    document.querySelector('.simulate1_btns_wrapper')["style"].display = 'none';
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
function createMemoryElem(address, data) {
    let div = document.createElement('div');
    div.classList.add('memory_data');
    div.classList.add(`memory${address}`);
    let spanLabel = document.createElement('span');
    spanLabel.classList.add('mem_label');
    spanLabel.innerText = `0x${parseInt(address).toString(16)}`;
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
        if(i!=2){
            div = createRegisterElem(i, `0x00000000`);
        }else{
            div = createRegisterElem(i, `0x7FFFFFF0`);
        }
        document.getElementsByClassName('registers_wrapper')[0].appendChild(div);
    }
}
let BASE_ADDR = "0x100000"
function writeMemory() {
    let MEM = new Map<number, string>();
    MEM.set(0, "0x00");
    MEM.set(1, "0x00");
    MEM.set(2, "0x00");
    MEM.set(3, "0x00");
    MEM.set(4, "0x00");
    MEM.forEach((e, index) => {
        let div = createMemoryElem(parseInt(BASE_ADDR) + index, e);
        document.getElementsByClassName('memory_wrapper')[0].appendChild(div);
    })
}


writeRegisters();
writeMemory();

// TODO: Search Feature