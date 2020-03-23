/***
 * 
 * File Stores Regular Expressions Patterns required for various compilation check
 * 
 */

export let labelPattern = /^[\w]+:[ ]*$/;
export let dataSegAsciizPattern = /^[\w]+:[ ]+[.][asciiz]*[ ]+(["].+["])[ ]*$/;
export let dataSegPattern = /^[\w]+:[ ]+[.][byte|dword|word|half|asciiz]*[ ]+((0[xX][0-9a-fA-F]+|[\d]+)[ ]*,[ ]*)*(0[xX][0-9a-fA-F]+|[\d]+)[ ]*$/;
export let formatRPattern = /^[ ]*(add|and|or|sll|slt|sra|srl|sub|xor|mul|div|rem)[ ]+x([3][0-1]|[1-2][0-9]|[0-9])[ ]*,[ ]*x([3][0-1]|[1-2][0-9]|[0-9]),[ ]*x([3][0-1]|[1-2][0-9]|[0-9])[ ]*$/;
export let formatIPattern = /^[ ]*(addi|andi|ori|jalr)[ ]+x([3][0-1]|[1-2][0-9]|[0-9])[ ]*,[ ]*x([3][0-1]|[1-2][0-9]|[0-9]),[ ]*[-]?(0[xX][0-9a-fA-F]+|[\d]+)[ ]*$/;
export let formatLoadPattern = /^[ ]*(lb|ld|lh|lw|)[ ]+x([3][0-1]|[1-2][0-9]|[0-9])[ ]*,[ ]*[-]?(0[xX][0-9a-fA-F]+|[\d]+)[(]x([3][0-1]|[1-2][0-9]|[0-9])[)][ ]*$/;
export let formatLoadFromDataPattern = /^[ ]*(lb|lh|lw|)[ ]+x([3][0-1]|[1-2][0-9]|[0-9])[ ]*,[ ]*[\w]+[ ]*$/;
export let formatSPattern = /^[ ]*(sb|sh|sw|)[ ]+x([3][0-1]|[1-2][0-9]|[0-9])[ ]*,[ ]*[-]?(0[xX][0-9a-fA-F]+|[\d]+)[(]x([3][0-1]|[1-2][0-9]|[0-9])[)][ ]*$/;
export let formatSBPattern = /^[ ]*(beq|bne|bge|blt|)[ ]+x([3][0-1]|[1-2][0-9]|[0-9])[ ]*,[ ]*x([3][0-1]|[1-2][0-9]|[0-9])[ ]*,[ ]*[\w]+[ ]*$/;
export let formatUPattern = /^[ ]*(auipc|lui)[ ]+x([3][0-1]|[1-2][0-9]|[0-9])[ ]*,[ ]*(0[xX][0-9a-fA-F]+|[\d]+)[ ]*$/;
export let formatUJPattern = /^[ ]*jal[ ]+x([3][0-1]|[1-2][0-9]|[0-9])[ ]*,[ ]*([\w]+)[ ]*$/;

