import ace from 'ace-builds/src-min-noconflict/ace';
import { main } from './encode/index';
import * as execute from './execute/Main';
import { addZeros, addOnes } from './encode/utility'
import { ProgramCounterBuffer } from './execute/InterStateBuffer'
var vex = require('vex-js')


vex.registerPlugin(require('vex-dialog'))
vex.defaultOptions.className = 'vex-theme-wireframe'
// Debug Flag: Set this true to open simulator pane directly
let debug: boolean = false;
/* mode: 
    0=> Without Pipeline 
    1=> Pipelining with data forwarding 
    2=> Pipelining without data forwarding
*/
let mode: number = 1;

// state of run button
let canRun = true;
// pipeline animation cycle duration in millisecond
let pipeAnimationDuration = 100;

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

// By default branchPred is enabled
let branchPred = 1;


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
                if (editor.session.getLine(i)[0] != '#') {
                    editor.session.insert({ "row": i, "column": 0 }, "# ");
                }
            }
        },
        readOnly: false
    });
}


let pipelineInfoWrapper = document.createElement('div');
pipelineInfoWrapper.classList.add('pipeline_helper');
let colorWrapper = document.createElement('div');
colorWrapper.classList.add('pipeline_color_wrapper');
['fetch', 'decode', 'alu', 'memory', 'write'].forEach((e) => {
    let t = document.createElement('div');
    t.innerText = e.toUpperCase();
    t.classList.add(`${e}_section`)
    colorWrapper.appendChild(t);
})
pipelineInfoWrapper.appendChild(colorWrapper);



// Helper Function to create an instruction element
function createInstrElement(pcVal: any, machineCodeVal: any, originalCodeVal: any): HTMLDivElement {
    let pc = document.createElement('span');
    let machineCode = document.createElement('span');
    let originalCode = document.createElement('span');
    pc.innerText = pcVal;
    originalCode.innerText = originalCodeVal;
    machineCode.innerText = machineCodeVal.toUpperCase();
    let div = document.createElement('div');
    div.classList.add(`meta_instructions`);
    div.classList.add(`pc${parseInt(pcVal)}`);
    div.appendChild(pc);
    div.appendChild(machineCode);
    div.appendChild(originalCode);
    div.addEventListener('click', (e) => {
        let parentElem = <HTMLElement>e.target["parentElement"];
        let containBreakpoint = false;
        let containActive = false;
        let instrPC: number;
        parentElem.classList.forEach((e) => {
            if (e === 'breakpoint_statement') {
                containBreakpoint = true;
            } else if (e === 'active_statment') {
                containActive = true;
            } else {
                let grps = e.match(/(pc)([\d]+)/);
                if (grps) {
                    if (grps[1] === 'pc') {
                        instrPC = parseInt(grps[2]);
                    }
                }
            }
        })
        if (containBreakpoint) {
            // Remove breakpoint_statment
            e.target["parentElement"].classList.remove('breakpoint_statement');
            if (instrPC !== undefined)
                execute.removeBreakPoint(instrPC);
        } else {
            e.target["parentElement"].classList.add('breakpoint_statement');
            if (instrPC !== undefined)
                execute.addBreakPoint(instrPC);
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
                stopCurrentExec();
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
    if (debug == true) {
        (<HTMLElement>document.querySelector('.simulator-btn')).click();
        // setting mode as pipeline + data forwarding
        mode = 2;
    }
    execute.GlobalVar.mode = mode;
    execute.GlobalVar.branchPredEnabled = (branchPred === 1);

})

// Function to remove all instructions and pipelineWrapper if any
function removeAllInstructionAndPipeHelper() {
    document.querySelectorAll('.meta_instructions, .pipeline_helper').forEach(e => {
        e.remove();
    });
}

// Remove all data from memory segment
function removeMemorySegment() {
    document.querySelectorAll('.memory_data').forEach(e => {
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
    reorganiseGrid();
    // Remove all instruction and pipeline helper if any
    removeAllInstructionAndPipeHelper();
}


// Function to reorganise the grid if there are any change
function reorganiseGrid() {
    if (mode === 1 || mode === 2) {
        if (document.querySelector('.simulator-wapper .pipeline_helper')) {
            document.querySelector('.simulator-wapper .pipeline_helper').remove()
        }
        document.querySelector('.simulator-wapper').classList.remove('pipeline_grid');
        document.querySelector('.additional_registers_wrapper')['style'].display = 'none';
        // TODO: Removing all control and data hazards segment
    }
}

// Function to handle the event Assemble And Simulate Btn
document.querySelector('.assemble_btn').addEventListener('click', () => {
    if (mode === 0) {
        if (document.querySelector('.simulator-wapper .pipeline_helper')) {
            document.querySelector('.simulator-wapper .pipeline_helper').remove()
        }
        document.querySelector('.simulator-wapper').classList.remove('pipeline_grid');
        document.querySelector('.additional_registers_wrapper')['style'].display = 'none';
    }
    let res = handleAssembleAndSimulate()
    // response is false if there is no error and true if there is some error
    // Replacing the buttons bars with RUN | STEP | SIMULATE
    if (!res) {
        document.querySelector('.simulate_btns_wrapper')['style'].display = 'none'
        document.querySelector('.simulate1_btns_wrapper')["style"].display = 'flex';
    }
});


// Function assembles and initializes the execution stack
function handleAssembleAndSimulate() {
    let fileData = editor.getValue();
    let response = main(fileData);
    if (response.error) {
        // Showing Error Message
        vex.dialog.alert(`${response.errorMessage}`);
        return true;
    }
    let codeSegWrapper = document.querySelector('.code_segment_wrapper');
    let instrWrapper = codeSegWrapper.querySelector('.instructions_wrapper');
    instrWrapper.remove();
    instrWrapper = document.createElement('div');
    instrWrapper.classList.add('instructions_wrapper');
    // Pushing pipeline information palette
    if (mode === 1 || mode === 2) {
        // changing the grid layout
        let simulatorWrapper = document.querySelector('.simulator-wapper') as HTMLElement;
        simulatorWrapper.classList.add('pipeline_grid')

        // removing display:none from additional registers 
        let additionalRegWrapper = document.querySelector('.additional_registers_wrapper') as HTMLElement;
        additionalRegWrapper.style.display = '';
        codeSegWrapper.appendChild(pipelineInfoWrapper);
        instrWrapper.classList.add('pipelined_exec_size');
    }
    // For dumping in future
    dumpSeg = response.codeSegment;
    let assembledCode = response.codeSegment.split('\n');
    // Showing assembledCode | PC | originalCode
    for (let i = 0; i < assembledCode.length; i++) {
        let e = assembledCode[i];
        let instr = e.split(" ");
        let pc = instr[0];
        let machineCode = instr[1];
        let originalCode = instr.slice(2).join(" ");
        let elem = createInstrElement(pc, machineCode, originalCode);
        instrWrapper.appendChild(elem);
        if (machineCode == '0xffffffff') {
            codeSegWrapper.appendChild(instrWrapper);
            break;
        }
    }
    currPC = 0;
    // removing memory segment data
    removeMemorySegment();
    // Initializing Execute Statement
    execute.init(response.codeSegment);
    // Updating Register and Memory State
    updateRegAndMemState();
    // Highlighting only if pipeline is enabled
    if (!execute.GlobalVar.pipelineEnabled) {
        updateHighlightedInst(-1);
    } else {
        updateHighlightedPipelineInstr(null, -1);
    }
    return false;
}

// Wrapper function to activate simulator
function activateSimulator() {
    document.querySelector('.simulator-wapper').classList.remove('display_none');
}

// Wrapper function to disable simulator
function disableSimulator() {
    document.querySelector('.simulator-wapper').classList.add('display_none');
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

function updateAdditionalRegPane() {
    let payload = execute.getAdditonalRegisters();
    Object.entries(payload).forEach((e) => {
        let instance = document.querySelector(`.addregI_${e[0].toLowerCase()}`);
        let valDiv = instance.querySelector(`.add_reg_value`) as HTMLElement;
        if (e[0] === 'CLOCK') {
            valDiv.innerText = e[1];
            return;
        }
        let value = getRegValToDisplay(e[1]);
        valDiv.innerText = value
    })
}

// Handling click event of Cancel Button before Assemble
document.querySelector('.simulate_btns_wrapper .cancel_btn').addEventListener('click', () => {
    // reorganising the grid
    reorganiseGrid();
    (<HTMLElement>document.querySelector('.stop_btn')).click();
    (<HTMLElement>document.querySelector('.editor-btn')).click();
})

// Handling click event of Cancel Button After Assemble
document.querySelector('.simulate1_btns_wrapper .cancel_btn').addEventListener('click', async () => {
    // Stopping the Run if there is any
    stopCurrentExec();
    // reorganising the grid
    reorganiseGrid();
    document.querySelector('.simulate_btns_wrapper')['style'].display = 'flex'
    document.querySelector('.simulate1_btns_wrapper')["style"].display = 'none';
    // Remove all instrcutions and pipeline_helper if it exist
    document.querySelectorAll('.meta_instructions, .pipeline_helper').forEach(e => {
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
    spanLabel.innerText = `0x${addZeros(address.toString(16), 8).toUpperCase()}`;
    let spanData = document.createElement('span');
    spanData.classList.add('mem_data');
    spanData.innerText = data.toUpperCase();
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

// writeMemory();
writeRegisters();


function getMemValToDisplay(num: number) {
    let value, temp;
    if (num < 0) {
        // Keeping only last 2 values of HexString
        temp = (num >>> 0).toString(16).slice(6);
        num = parseInt(temp, 16);
    }
    if (displaySettings == 0) {
        value = `0x${addZeros((num >>> 0).toString(16), 2)}`;
    } else if (displaySettings == 1) {
        let immNum;
        if (num > 127) {
            immNum = (num).toString(2)
            // If the MSB is 1 then adding 1's to create a 32 length immNum
            immNum = addOnes(immNum, 32);
            immNum = ((parseInt(immNum, 2) >> 0))
        } else {
            immNum = (num)
        }
        value = immNum;
    } else {
        value = `${String.fromCodePoint(num)} [0x${addZeros(num.toString(16), 2)}]`
    }
    return value.toString().toUpperCase();
}


function getRegValToDisplay(num: number) {
    let value;
    if (displaySettings == 1) {
        value = (num >> 0).toString()
    } else {
        value = `0x${addZeros((num >>> 0).toString(16).toUpperCase(), 8)}`;
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
        let newVal = getRegValToDisplay(val);
        // Updating only if there are some changes
        if (regData.innerText !== newVal) {
            regData.innerText = newVal;
            // scrolling into the element
            regData.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
            // adding texthighlight class
            regData.classList.add('reg_text_highlight');
            setTimeout(() => { regData.classList.remove('reg_text_highlight') }, 700);
        }
    });
    mem.forEach((val, key) => {
        let div = document.querySelector(`.memory_wrapper .memory${key}`) as HTMLElement;
        let displayNum = getMemValToDisplay(val);
        if (div) {
            let memData = div.querySelector('.mem_data') as HTMLElement;
            if (memData.innerText !== displayNum) {
                memData.innerText = displayNum;
                // scrolling into the element
                memData.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
                // adding texthighlight class
                memData.classList.add('reg_text_highlight');
                setTimeout(() => { memData.classList.remove('reg_text_highlight') }, 700);
            }
        } else {
            // 0 => Code Seg | 1 => Data Seg | 2 => Heap Seg | 3 => Stack Segment |
            let div = createMemoryElem(key, displayNum);
            if (key < 268435456 && key >= 0) {
                document.getElementsByClassName('code_segment')[0].append(div);
                // Code Segment
            } else if (key >= 268435456 && key < 268468200) {
                // Data Segment
                document.getElementsByClassName('data_segment')[0].append(div);
            } else if (key >= 268468200 && key <= 2147483644) {
                // Heap and Stack
                document.getElementsByClassName('stack_segment')[0].append(div);
            } else {
                // Add Segment
                document.getElementsByClassName('addi_segment')[0].append(div);
            }
            let memData = div.querySelector('.mem_data') as HTMLElement;
            // scrolling into the element
            memData.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
            // adding texthighlight class
            memData.classList.add('reg_text_highlight');
            setTimeout(() => { memData.classList.remove('reg_text_highlight') }, 700);
        }
    });

    // updatingAdditionalRegPane
    if (mode === 1 || mode === 2) {
        updateAdditionalRegPane();
    }
}

// Helper function to showSnackBar
function showSnackBar(message: string, timeo?: number) {
    return new Promise((res, rej) => {
        var x = document.getElementById("snackbar");
        x.innerText = message;
        // Add the "show" class to DIV
        x.className = "show";
        // After 3 seconds, remove the show class from DIV
        setTimeout(function () { x.className = x.className.replace("show", ""); res() }, timeo ? timeo : 1200);
    })
}

let pcBufNameToClassName: Map<string, string> = new Map<string, string>();

pcBufNameToClassName.set('fetchPC', 'curr_fetch_statement')
pcBufNameToClassName.set('decodePC', 'curr_decode_statement')
pcBufNameToClassName.set('executePC', 'curr_execute_statement')
pcBufNameToClassName.set('memoryPC', 'curr_memory_statement')
pcBufNameToClassName.set('writeBackPC', 'curr_writeback_statement')


// F D E M W
function getPCBufferColorsArray(pcBuf: Object) {
    let payload = new Map<number, string>();
    Object.entries(pcBuf).forEach((e) => {
        if (e[1] === -1) {
            return;
        }
        let initialVal = payload.get(e[1]) ? payload.get(e[1]) : '';
        if (e[0] === 'fetchPC') {
            payload.set(e[1], initialVal + 'F');
        } else if (e[0] === 'decodePC') {
            payload.set(e[1], initialVal + 'D');
        } else if (e[0] === 'executePC') {
            payload.set(e[1], initialVal + 'E');
        } else if (e[0] === 'memoryPC') {
            payload.set(e[1], initialVal + 'M');
        } else if (e[0] === 'writeBackPC') {
            payload.set(e[1], initialVal + 'W');
        }
    });
    // If the pcBuf is not previous
    let currPC = execute.getPC();
    let initialVal = payload.get(currPC) ? payload.get(currPC) : '';
    if (currPC != -1)
        payload.set(currPC, initialVal + 'A');

    return payload;
}

// linear gradient colors map
let linearGradientConfig = {
    'fetch': '#aa00ff',
    'decode': '#311b92',
    'execute': '#0288d1',
    'memory': '#880e4f',
    'writeback': '#673ab7',
    'background': '#ef6c00',
    'active': '#fdd835',
}

// Generates linear-gradient based on current state
function getLinearGradient(metaData: string) {
    let linearGradProperty = `linear-gradient(90deg, `;
    if (metaData.includes('F')) {
        linearGradProperty += `${linearGradientConfig['fetch']}, ${linearGradientConfig['fetch']} 20%, `;
    } else {
        linearGradProperty += `${linearGradientConfig['background']}, ${linearGradientConfig['background']} 20%, `;
    }

    if (metaData.includes('D')) {
        linearGradProperty += `${linearGradientConfig['decode']} 20%, ${linearGradientConfig['decode']} 40%, `;
    } else {
        linearGradProperty += `${linearGradientConfig['background']} 20%, ${linearGradientConfig['background']} 40%, `;
    }

    if (metaData.includes('E')) {
        linearGradProperty += `${linearGradientConfig['execute']} 40%, ${linearGradientConfig['execute']} 60%, `;
    } else {
        linearGradProperty += `${linearGradientConfig['background']} 40%, ${linearGradientConfig['background']} 60%, `;
    }
    if (metaData.includes('M')) {
        linearGradProperty += `${linearGradientConfig['memory']} 60%, ${linearGradientConfig['memory']} 80%, `;
    } else {
        linearGradProperty += `${linearGradientConfig['background']} 60%, ${linearGradientConfig['background']} 80%, `;
    }
    if (metaData.includes('W') && metaData.includes('A')) {
        linearGradProperty += `${linearGradientConfig['writeback']} 80%, ${linearGradientConfig['writeback']} 95%, rgba(0, 0, 0, 0) 95%, rgba(0, 0, 0, 0) 100% ), `;
        linearGradProperty += `linear-gradient(70deg, ${linearGradientConfig['writeback']} 80%, ${linearGradientConfig['writeback']} 95%, ${linearGradientConfig['active']} 95%, ${linearGradientConfig['active']} 100%)`;
    } else {
        if (metaData.includes('W')) {
            // only writeback
            linearGradProperty += `${linearGradientConfig['writeback']} 80%, ${linearGradientConfig['writeback']} 100%)`;
        } else if (metaData.includes('A')) {
            // only active
            linearGradProperty += `${linearGradientConfig['background']} 80%, ${linearGradientConfig['background']} 95%, rgba(0, 0, 0, 0) 95%, rgba(0, 0, 0, 0) 100% ), `;
            linearGradProperty += `linear-gradient(70deg, ${linearGradientConfig['background']} 80%, ${linearGradientConfig['background']} 95%, ${linearGradientConfig['active']} 95%, ${linearGradientConfig['active']} 100%)`;
        } else {
            // normal backgroud
            linearGradProperty += `${linearGradientConfig['background']} 80%, ${linearGradientConfig['background']} 100% )`;
        }
    }
    return linearGradProperty;
}

// Highlight pipeline instructions during execution 
function updateHighlightedPipelineInstr(prev: ProgramCounterBuffer, prevPC: number, removeOnly: boolean = false) {
    try {
        if (prev) {
            Object.entries(prev).forEach((e) => {
                if (e[1] === -1) {
                    return;
                }
                let instr = document.querySelector(`.pc${e[1]}`) as HTMLElement;
                instr.style.background = '';
                instr.style.color = '';
            });
            if (prevPC != -1) {
                let instr = document.querySelector(`.pc${prevPC}`) as HTMLElement;
                instr.style.background = '';
                instr.style.color = '';
            }
        }
        if (!removeOnly) {
            getPCBufferColorsArray(execute.GlobalVar.isb.pcBuf).forEach((val, key) => {
                let instr = document.querySelector(`.pc${key}`) as HTMLElement;
                instr.style.background = getLinearGradient(val);
                instr.style.color = 'white';
            });
        }
    } catch (err) {
        console.error(err);
    }
}


// Handling Click Event Of Step Button
document.getElementsByClassName('step_btn')[0].addEventListener('click', async () => {
    // If it's a pipelined execution then calling pipelined step
    if (mode == 1 || mode == 2) {
        // updating Inital PC
        let prevHighlightedPCBuffer = Object.assign({}, execute.GlobalVar.isb.pcBuf);
        let prevHighlightedActivePC = currPC;
        // Executing Pipeline step instead of normal step
        execute.singlePipelineStep();

        let lastPred = execute.GlobalVar.isb.lastPrediction;
        if (lastPred !== null) {
            if (lastPred == 0) {
                await showSnackBar(`0x${execute.GlobalVar.isb.pcBuf.fetchPC.toString(16)}: Branch Prediction -> False`)
            } else if (lastPred == 1) {
                await showSnackBar(`0x${execute.GlobalVar.isb.pcBuf.fetchPC.toString(16)}: Branch Prediction -> True`)
            } else {
                console.error('Error in Prediction Value')
            }
        }


        if (execute.GlobalVar.isb.flushPipeline) {
            await showSnackBar(`0x${execute.GlobalVar.isb.pcBuf.executePC.toString(16)}: Flushing the Pipeline`);
        }

        if (execute.GlobalVar.isb.stallAtDecode) {
            await showSnackBar(`0x${execute.GlobalVar.isb.pcBuf.decodePC.toString(16)}: Stalling at Decode`)
        }


        let dfType = execute.GlobalVar.isb.dataForwardingType
        if (dfType) {
            if (dfType === 1) {
                await showSnackBar(`E (0x${execute.GlobalVar.isb.pcBuf.executePC.toString(16)}) to E (0x${execute.GlobalVar.isb.pcBuf.decodePC.toString(16)}) Data Forwarding`)
            } else if (dfType === 2) {
                await showSnackBar(`M (0x${execute.GlobalVar.isb.pcBuf.memoryPC.toString(16)}) to E (0x${execute.GlobalVar.isb.pcBuf.decodePC.toString(16)}) Data Forwarding`)
            } else if (dfType === 3) {
                await showSnackBar(`M (0x${execute.GlobalVar.isb.pcBuf.memoryPC.toString(16)}) to M (0x${execute.GlobalVar.isb.pcBuf.executePC.toString(16)}) Data Forwarding`)
            }
        }
        // DEBUG Print
        // execute.GlobalVar.isb.showInterStateBuffer()
        updateRegAndMemState();
        // updating Current PC locally
        currPC = execute.getPC();
        if (execute.getIsComplete()) {
            updateHighlightedPipelineInstr(prevHighlightedPCBuffer, prevHighlightedActivePC, true);
            activateAssembleAndSimulateBtn();
            // Not awaiting here
            showSnackBar('Program Successfully Executed');
            return;
        }
        updateHighlightedPipelineInstr(prevHighlightedPCBuffer, prevHighlightedActivePC);
    } else {
        // updating Inital PC
        let prevHighlighted = currPC;
        //  Executing SingleINS
        execute.singleINS();
        //  Executing Pipeline step instead of normal step
        updateRegAndMemState();
        // updating Current PC locally
        currPC = execute.getPC();
        if (execute.getIsComplete()) {
            activateAssembleAndSimulateBtn();
            showSnackBar('Program Successfully Executed');
            return;
        }
        updateHighlightedInst(prevHighlighted)
    }
})

// Function which run all instructions at one go (No Pipeline Version)
function runAllInstructions() {
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            // updating Inital PC
            let prevHighlighted = currPC;
            let res = execute.allINS();
            // updating Current PC locally
            currPC = execute.getPC();
            updateRegAndMemState();
            if (execute.getIsComplete()) {
                activateAssembleAndSimulateBtn();
                showSnackBar('Program Successfully Executed');
                clearInterval(interval);
                return;
            }
            updateHighlightedInst(prevHighlighted)
            if (res || !canRun) {
                clearInterval(interval);
                resolve();
            }
        }, pipeAnimationDuration);
    })
}

// Wrapper function to run in pipelined mode
function runPipelinedInstructions() {
    return new Promise((resolve, reject) => {
        let interval = setInterval(async () => {
            let prevHighlightedPCBuffer = Object.assign({}, execute.GlobalVar.isb.pcBuf);
            let prevHighlightedActivePC = currPC;
            // Calling pipeline run
            let res = execute.pipelinedAllINS();
            if (pipeAnimationDuration > 700) {
                let lastPred = execute.GlobalVar.isb.lastPrediction;
                if (lastPred !== null) {
                    if (lastPred == 0) {
                        await showSnackBar(`0x${execute.GlobalVar.isb.pcBuf.fetchPC.toString(16)}: Branch Prediction -> False`, pipeAnimationDuration / 2)
                    } else if (lastPred == 1) {
                        await showSnackBar(`0x${execute.GlobalVar.isb.pcBuf.fetchPC.toString(16)}: Branch Prediction -> True`, pipeAnimationDuration / 2)
                    } else {
                        console.error('Error in Prediction Value');
                    }
                }

                // Flush Pipeline Toast
                if (execute.GlobalVar.isb.flushPipeline) {
                    await showSnackBar(`0x${execute.GlobalVar.isb.pcBuf.executePC.toString(16)}: Flushing the Pipeline`, pipeAnimationDuration / 2);
                }
                // Stalling At Decode Toast
                if (execute.GlobalVar.isb.stallAtDecode) {
                    await showSnackBar(`0x${execute.GlobalVar.isb.pcBuf.decodePC.toString(16)}: Stalling at Decode`, pipeAnimationDuration / 2)
                }
                // If data forwarding is enabled
                if (mode === 1) {
                    // Data Forwarding information
                    let dfType = execute.GlobalVar.isb.dataForwardingType
                    if (dfType) {
                        if (dfType === 1) {
                            await showSnackBar(`E (0x${execute.GlobalVar.isb.pcBuf.executePC.toString(16)}) to E (0x${execute.GlobalVar.isb.pcBuf.decodePC.toString(16)}) Data Forwarding`, pipeAnimationDuration / 2)
                        } else if (dfType === 2) {
                            await showSnackBar(`M (0x${execute.GlobalVar.isb.pcBuf.memoryPC.toString(16)}) to E (0x${execute.GlobalVar.isb.pcBuf.decodePC.toString(16)}) Data Forwarding`, pipeAnimationDuration / 2)
                        } else if (dfType === 3) {
                            await showSnackBar(`M (0x${execute.GlobalVar.isb.pcBuf.memoryPC.toString(16)}) to M (0x${execute.GlobalVar.isb.pcBuf.executePC.toString(16)}) Data Forwarding`, pipeAnimationDuration / 2)
                        }
                    }
                }
            }

            updateRegAndMemState();
            // updating currPC
            currPC = execute.getPC();
            if (!canRun || res) {
                clearInterval(interval);
                resolve();
                return;
            }
            if (execute.getIsComplete()) {
                updateHighlightedPipelineInstr(prevHighlightedPCBuffer, prevHighlightedActivePC, true);
                activateAssembleAndSimulateBtn();
                showSnackBar('Program Successfully Executed');
                clearInterval(interval);
                resolve();
                return;
            }
            updateHighlightedPipelineInstr(prevHighlightedPCBuffer, prevHighlightedActivePC);
        }, pipeAnimationDuration);
    })
}


// Handling Click Event Of Run Button
document.getElementsByClassName('run_btn')[0].addEventListener('click', async () => {
    if (mode == 1 || mode == 2) {
        // Executing Pipeline step instead of normal step
        await runPipelinedInstructions();
    } else {

        // Executing allINS
        await runAllInstructions();
    }
})

// stopping current execution
function stopCurrentExec(timeo?: number) {
    return new Promise((res, rej) => {
        canRun = false;
        // console.warn("Stopping the Run");
        let runBtn = (<HTMLElement>document.querySelector('.run_btn'));
        runBtn.style.textDecoration = 'line-through'
        runBtn.style.backgroundColor = '#000';
        runBtn.style.color = '#fff';
        setTimeout(() => {
            canRun = true;
            // console.warn("Setting canRun as true");
            runBtn.innerText = 'Run';
            runBtn.style.backgroundColor = '';
            runBtn.style.color = '';
            runBtn.style.textDecoration = ''
            res();
        }, 1000)
    })
}

document.querySelector('.stop_btn').addEventListener('click', async () => {
    await stopCurrentExec();
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
        e.children[1].innerHTML = getRegValToDisplay(parseInt(e.children[1].innerHTML) >> 0);
    })
    let currMems = Array.from(document.getElementsByClassName('memory_data'));
    currMems.forEach((e) => {
        if (prevDisplaySettings == 2) {
            let val = e.children[1].innerHTML.match(/\[.+\]/)[0].split(/\[|\]/).join('');
            e.children[1].innerHTML = getMemValToDisplay(parseInt(val) >> 0);
        } else {
            e.children[1].innerHTML = getMemValToDisplay(parseInt(e.children[1].innerHTML) >> 0);
        }
    })
    // If pipeline is enabled 
    if (mode === 1 || mode === 2) {
        // updating additionalregpane
        updateAdditionalRegPane();
    }
}



function activateAssembleAndSimulateBtn() {
    document.querySelector('.simulate_btns_wrapper')['style'].display = 'flex'
    document.querySelector('.simulate1_btns_wrapper')["style"].display = 'none';
}


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


function getdumpArrayOutput() {
    let dumpArray = [];
    dumpSeg.split("\n").forEach((e) => {
        if (e) {
            let ins = e.split(' ');
            dumpArray.push(`${ins[0]} ${ins[1]}`)
            if (ins[1] == '0xffffffff') {
                dumpArray.push('');
            }
        }
    });
    return dumpArray;
}

// Handle Click Event Of Dump Button
document.querySelector('.dump_btn').addEventListener('click', (e) => {
    let dumpArray = getdumpArrayOutput();
    if (dumpArray.length) {

        navigator.clipboard.writeText(dumpArray.join('\n')).then(function () {
            vex.dialog.alert('Code Dump to clipboard was successful!');
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
    }
})

function saveContent(data: string, title: string) {
    var blob = new Blob([data], {
        type: "text/plain;charset=utf-8"
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    // the filename you want
    a.download = title;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}

// Various shortcuts to save the file, stats, assembled code etc
document.addEventListener("keydown", async function (e) {
    if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode == 83) {
        e.preventDefault();
        if (activeElem == 0) {
            vex.dialog.confirm({
                message: 'Are you sure you want to download the current version of the code?',
                callback: function (res) {
                    if (res) {
                        let data = editor.getValue();
                        saveContent(data, 'riscv_heritage.asm');
                    }
                }
            })

        } else if (activeElem == 1) {
            if (document.querySelector('.simulate_btns_wrapper')['style'].display === 'none') {
                vex.dialog.confirm({
                    message: 'Are you sure you want to download the assembled file?',
                    callback: function (res) {
                        if (res) {
                            let data = getdumpArrayOutput();
                            saveContent(data.join('\n'), 'riscv_heritage_out.m');
                        }
                    }
                })
            } else {
                vex.dialog.alert('Please assemble the code before downloading :)')
            }
        }
    } else if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode == 68) {
        e.preventDefault();
        if (activeElem === 1) {
            if (document.querySelector('.simulate_btns_wrapper')['style'].display !== 'none') {
                if (execute.GlobalVar.isComplete) {
                    // serving stats
                    serveStatsFile(`Are you sure you want to download the stats?`);
                } else {
                    vex.dialog.alert('Please assemble and complete the whole execution before downloading the stats :)')
                }
            } else {
                if (mode !== 0) {
                    // currently simulating
                    vex.dialog.alert('Please complete the whole execution before downloading the stats :)')
                } else {
                    vex.dialog.alert('This functionality is only for pipelined simulation :(')
                }
            }
        }

    }

}, false);


// Serves compiled stats
function serveStatsFile(message) {
    if (mode !== 0) {

        vex.dialog.confirm({
            message: `${message}`,
            callback: function (res) {
                if (res) {
                    let tExecStats = execute.compileStats();
                    let data = `*******************************************************************\n`;
                    data += `Stat1 : Total Cycles               :  ${execute.GlobalVar.CLOCK}\n`;
                    data += `Stat2 : Total Instructions         :  ${tExecStats.totalInstructions}\n`;
                    data += `Stat3 : CPI                        :  ${execute.GlobalVar.CLOCK / tExecStats.totalInstructions}\n`;
                    data += `Stat4 : Data-Transfer Instructions :  ${tExecStats.numberOfDataTransfers}\n`;
                    data += `Stat5 : ALU Instruction            :  ${tExecStats.numberOfALUInstr}\n`;
                    data += `Stat6 : Control Instructions       :  ${tExecStats.numberOfControlInstr}\n`;
                    data += `Stat7 : Total Stalls               :  ${tExecStats.numberOfStalls}\n`;
                    data += `Stat8 : Data Hazards               :  ${tExecStats.numberOfDataHazards}\n`;
                    data += `Stat9 : Control Hazards            :  ${tExecStats.numberOfControlHazard}\n`;
                    data += `Stat10: Branch Mis-predictions     :  ${tExecStats.branchMispredictions}\n`;
                    data += `Stat11: Stalls due Data Hazard     :  ${tExecStats.numberOfDataHazardStalls}\n`;
                    data += `Stat12: Stalls due Control Hazard  :  ${tExecStats.numberOfControlHazardStalls}\n`;
                    data += `*******************************************************************\n`;
                    // console.log(data);
                    saveContent(data, 'stats.txt');
                }
            }
        })
    } else {
        vex.dialog.alert('This functionality is only for pipelined simulation :(')
    }
}



// On Click Reset Button
document.querySelector('.reset_btn').addEventListener('click', async () => {
    await stopCurrentExec();
    handleAssembleAndSimulate();
})



// Contains a set of modals which triggers and allow user to alter execution configuration 
var configWrapper = {
    bPred: function () {
        vex.dialog.open({
            input: [
                `
                ${mode === 0 ? `<div class='help-text-prompt'>Please enable pipelining to activate Branch Prediction</div>` : `<div class='heading-text-prompt'><input type="checkbox" id="data"  name="data" ${mode === 0 ? 'disabled' : branchPred === 1 ? 'checked' : ''} />
                <label for="data">Enable Branch Prediction</label></div>`}  
                `
            ].join(''),
            callback: function (value) {
                if (!value) {
                    return;
                }
                // Assuming mode!=1
                if (value.data == 'on') {
                    // Branch Prediction Enabled
                    branchPred = 1;
                    execute.GlobalVar.branchPredEnabled = true;
                } else {
                    // Branch Prediction Disabled
                    branchPred = 0;
                    execute.GlobalVar.branchPredEnabled = false;
                }
            }
        });
    },
    runDuration: function () {
        vex.dialog.open({
            input: [
                `
                <input type="range" min="5" max="1000" value="${pipeAnimationDuration}" class="slider" id="duration" name='duration'>
                ${`<div class='heading-text-prompt'><p>Animation Cycle Duration: <span id="durationVal"></span> ms</p></div>`}  
                
                `
                // <div class='heading-text-prompt' style='color: #856404; background-color: #fff3cd; border-color: #ffeeba; font-size: 13px'>Note: This functionality is only available for pipelined execution</div>
            ].join(''),
            callback: function (value) {
                if (!value) {
                    return;
                }
                pipeAnimationDuration = parseInt(value.duration);
            }
        });
        var slider = document.getElementById("duration");
        var output = document.getElementById("durationVal");
        output.innerHTML = (pipeAnimationDuration).toString();

        // Update the current slider value (each time you drag the slider handle)
        slider.oninput = function () {
            output.innerHTML = ((parseInt(this['value']))).toString();
        }
    },
    dForward: function () {
        vex.dialog.open({
            input: [
                `
                ${mode === 0 ? `<div class='help-text-prompt'>Please enable pipelining to activate Data Forwarding</div>` : `<div class='heading-text-prompt'><input type="checkbox" id="data" name="data" ${mode === 1 ? 'checked' : mode === 0 ? 'disabled' : ''} />
                <label for="data">Enable Data Forwarding</label></div>`}  
                `
            ].join(''),
            callback: function (value) {
                if (!value) {
                    return;
                }
                if (value.data == 'on') {
                    // Pipelining with Data Forwarding
                    mode = 1;
                    execute.GlobalVar.mode = 1;
                } else {
                    if (mode !== 0) {
                        // Pipelining without Data Forwarding
                        mode = 2;
                        execute.GlobalVar.mode = 2;
                    }
                }
            }
        });
    },
    pipeline: function () {
        vex.dialog.open({
            input: [
                `
                <div class='heading-text-prompt'><input type="checkbox" id="pipe" name="pipe" ${mode !== 0 ? 'checked' : ''}/>
                <label for="pipe">Enable Pipeline</label></div>
                `
            ].join(''),
            callback: function (value) {
                if (!value) {
                    return;
                }
                if (value.pipe === 'on') {
                    // Pipelining enabled with Data Forwarding and branch Pred
                    mode = 1;
                    branchPred = 1;
                    execute.GlobalVar.mode = 1;
                } else {
                    // Pipelining Disabled
                    mode = 0;
                    branchPred = 0;
                    execute.GlobalVar.mode = 0;
                }
            }
        });
    }
};


// Triggers Modal to allow user to alter configuration before execution
document.querySelector(".config-btn").addEventListener('click', () => {
    vex.dialog.open({
        className: 'vex-theme-wireframe main_config_wrapper',
        input: [
            `
            <div class='heading-text-prompt' style='color: #155724; background-color: #d4edda; font-weight: bold; font-family: "Roboto Mono"'>Configuration Menu:</div>
            <div class="configWrapper">
            <a data-trigger="pipeline">Pipeline</a>
            <a data-trigger="dForward">Data Forwarding</a>
            <a data-trigger="bPred">Branch Prediction</a>
            <a data-trigger="runDuration">Animation Cycle Duration</a>
            </div>`
        ].join(''),
        callback: function () {
            console.log("Branch Predition, Mode: ", branchPred, mode);
        }
    });
    document.querySelectorAll('.configWrapper a').forEach((e) => {
        e.addEventListener('click', (el) => {
            configWrapper[e.getAttribute('data-trigger')]();
        })
    })

})


// Triggers Modal to show configuration during execution
document.querySelector('.config-btn-display-only').addEventListener('click', () => {
    let disabledStyle = `color: #721c24;
    background-color: #f8d7da;
    border-color: #f5c6cb;
    padding: .75rem 1.25rem;
    margin-bottom: 0.5rem;
    font-size: 15px
    `;

    let activeStyle = `color: #155724;
    background-color: #d4edda;
    border-color: #c3e6cb;
    padding: .75rem 1.25rem;
    margin-bottom: 0.5rem;
    font-size: 15px
    `;

    vex.dialog.open({
        input: [
            `
            <div class='heading-text-prompt' style='font-weight: bold; font-family: "Roboto Mono"'>Configuration [Read Only]</div>
            <div class="configWrapper">
            <div class='heading-text-prompt' style='${mode === 0 ? disabledStyle : activeStyle}'>Pipelining <span style='font-weight: bold'>${mode === 0 ? 'Disabled' : 'Enabled'}</span></div>
            <div class='heading-text-prompt' style='${mode !== 1 ? disabledStyle : activeStyle}'>Data Forwarding <span style='font-weight: bold'>${mode !== 1 ? 'Disabled' : 'Enabled'}</span></div>
            <div class='heading-text-prompt' style='${branchPred === 0 ? disabledStyle : activeStyle}'>Branch Prediction <span style='font-weight: bold'>${branchPred === 0 ? 'Disabled' : 'Enabled'}</span></div>
            <div class='heading-text-prompt' style='background-color: #d1ecf1; color: #0c5460; border-color: #bee5eb; font-size: 15px'>Animation Cycle Duration: <span style='font-weight: bold'>${pipeAnimationDuration / 1000} sec</span></div> 
            </div>
            `
        ].join(''),
        callback: function () {
            console.log("Branch Predition, Mode: ", branchPred, mode);
        }
    })
})

