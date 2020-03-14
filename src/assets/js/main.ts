import ace from 'ace-builds/src-min-noconflict/ace';
import { encodeTextFromUser } from './encode/index';
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


let assembledCode = `0x0 0x3e850513
0x4 0x10000097
0x8 0x00c0a083
0xc 0x10000097
0x10 0x0080a083
0x14 0x10000097
0x18 0x0080a083
0x1c 0x10000097
0x20 0xfe409083
0x24 0x10000097
0x28 0xff008083
0x2c 0x3e850513
0x30 0xffffffff

0x10000000 0xef
0x10000001 0x0e
0x10000002 0x00
0x10000003 0x00
0x10000004 0xbf
0x10000005 0x0b`;




function createLiElement(pcVal, machineCodeVal, originalCodeVal) {
    let pc = document.createElement('span');
    let machineCode = document.createElement('span');
    let originalCode = document.createElement('span');
    pc.innerText = pcVal;
    originalCode.innerText = originalCodeVal;
    machineCode.innerText = machineCodeVal;
    let li = document.createElement('li');
    li.appendChild(pc);
    li.appendChild(machineCode);
    li.appendChild(originalCode);
    return li;
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
                let errorFlag = activateSimulator();
                if (errorFlag) {
                    return;
                }
            } else if (index == 2) {

            }
            navbarBtns[activeElem].classList.remove("active");
            activeElem = index;
            navbarBtns[activeElem].classList.add("active");
        })
    })
})

function disableEditor() {
    document.getElementById("editor").style.display = 'none';
}

function activateEditor() {
    document.getElementById("editor").style.display = 'block';
}

function activateSimulator(): boolean {
    let fileData = editor.getValue();
    console.log(fileData);
    if (!fileData) {
        document.querySelector('.simulator')["style"].display = 'block';

        return false;
    }
    let response = encodeTextFromUser(fileData);
    if (response.error) {
        alert("Error Occurred at line: " + response.firstOccurance);
        // sending error flag as true
        return true;
    }
    console.log(response);
    let assembledCode = response.data;
    let q1 = assembledCode.split(/[\n]{2}/);
    let instrData = q1[0].split("\n");
    let dataSeg = q1[1].split("\n");
    let instrElem = document.querySelector('.code-segment');
    instrData.forEach((e) => {
        let instr = e.split(" ");
        let pc = instr[0];
        let machineCode = instr[1];
        if (machineCode == '0xffffffff') {
            return;
        }
        let elem = createLiElement(pc, machineCode, 'add, x10,x10, 1');
        instrElem.appendChild(elem);
        elem.addEventListener("click", (e) => {
            console.log(e.target)
        })
    });
    document.querySelector('.simulator')["style"].display = 'block';
    // sending error flag as false
    return false;

}

function disableSimulator() {
    document.querySelector('.simulator')['style'].display = 'none';
}