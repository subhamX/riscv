#.data
#var1: .word 5
#var2: .byte 51
#    var4: 
#    .byte 0x45
#var5: 
#.half 0xabedeeee
#var3: .byte 0xac
#var6: .word 0x123456789
#var7: .dword 0x15454555 
 
  .text
 var1010:
 add x1,x0,x0
 
 .data
 var2: .byte 0x1c
var10:
addi x1 , x0, 100

.data
var1:
.byte 0x1b
 
var2:
# beq x1, x10, label
addi x1, x0, 100
add x2 , x0, x1
add x5, x8, x10
and x3, x1, x2
or x3, x1, x2
 
 .text
 var1010:
 add x1,x0,x0
 
 .data
 var2: .byte 0x1c
var2:
addi x1 , x0, 100
 
.text
var2:
addi x1 , x0, 100
add x2 , x0, x1
add x5, x8, x10
and x3, x1, x2
or x3, x1, x2
sll x3, x1, x2
slt x3, x1, x2
sra x3, x1, x2
srl x3, x1, x2
sub x3, x1, x2
xor x3, x1, x2
mul x3, x1, x2
div x3, x1, x2
rem x3, x1, x2
sb x1, 900(x10)
beq x1, x10, label