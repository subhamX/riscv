0x0 0x3e850513 addi x10 x10, 1000
0x4 0x10000097 lw x1 12(x1)
0x8 0x00c0a083 lw x1 12(x1)
0xc 0x10000097 lw x1 8(x1)
0x10 0x0080a083 lw x1 8(x1)
0x14 0x10000097 lw x1 8(x1)
0x18 0x0080a083 lw x1 8(x1)
0x1c 0x10000097 lh x1 -28(x1)
0x20 0xfe409083 lh x1 -28(x1)
0x24 0x10000097 lb x1 -16(x1)
0x28 0xff008083 lb x1 -16(x1)
0x2c 0x3e850513 addi x10 x10, 1000
0x30 0x10005097 auipc x1 0x10005
0x34 0x06412503 lw x10 100(x2)
0x38 0x06a12223 sw x10 100(x2)
0x3c 0x3e8f8513 addi x10 x31, 1000
0x40 0xf9c12503 lw x10 -100(x2)
0x44 0xf8a12e23 sw x10 -100(x2)
0x48 0x10000517 lw x10 -56(x10)
0x4c 0xfc852503 lw x10 -56(x10)
0x50 0x10000497 lw x9 -64(x9)
0x54 0xfc04a483 lw x9 -64(x9)
0x58 0x10000517 lw x10 -88(x10)
0x5c 0xfa852503 lw x10 -88(x10)
0x60 0x06412503 lw x10 100(x2)
0x64 0x06a12223 sw x10 100(x2)
0x68 0x3e8f8513 addi x10 x31, 1000
0x6c 0xf9c12503 lw x10 -100(x2)
0x70 0xf8a12e23 sw x10 -100(x2)
0x74 0xc18f8513 addi x10 x31, -1000
0x78 0x10012503 lw x10 0x100(x2)
0x7c 0x10a12023 sw x10 0x100(x2)
0x80 0x100f8513 addi x10 x31, 0x100
0x84 0x7ff12503 lw x10 0x7ff(x2)
0x88 0x7ea12fa3 sw x10 0x7ff(x2)
0x8c 0x7fff8513 addi x10 x31, 0x7ff
0x90 0x01d60533 add x10 x12, x29
0x94 0x01d67533 and x10 x12, x29
0x98 0x01d66533 or x10 x12, x29
0x9c 0x01d61533 sll x10 x12, x29
0xa0 0x01d62533 slt x10 x12, x29
0xa4 0x41d65533 sra x10 x12, x29
0xa8 0x01d65533 srl x10 x12, x29
0xac 0x41d60533 sub x10 x12, x29
0xb0 0x01d64533 xor x10 x12, x29
0xb4 0x03d60533 mul x10 x12, x29
0xb8 0x03d64533 div x10 x12, x29
0xbc 0x03d66533 rem x10 x12, x29
0xc0 0x014f9fb3 sll x31 x31, x20
0xc4 0x7ea60513 addi x10 x12, 0x7ea
0xc8 0x81660513 addi x10 x12, -0x7ea
0xcc 0xff160513 addi x10 x12, -0xf
0xd0 0x57660513 addi x10 x12, 1398
0xd4 0x80060513 addi x10 x12, -2048
0xd8 0x7ea67513 andi x10 x12, 0x7ea
0xdc 0x81667513 andi x10 x12, -0x7ea
0xe0 0xff167513 andi x10 x12, -0xf
0xe4 0x57667513 andi x10 x12, 1398
0xe8 0x80067513 andi x10 x12, -2048
0xec 0x7ea66513 ori x10 x12, 0x7ea
0xf0 0x81666513 ori x10 x12, -0x7ea
0xf4 0xff166513 ori x10 x12, -0xf
0xf8 0x57666513 ori x10 x12, 1398
0xfc 0x80066513 ori x10 x12, -2048
0x100 0x7ea60567 jalr x10 x12, 0x7ea
0x104 0x81660567 jalr x10 x12, -0x7ea
0x108 0xff160567 jalr x10 x12, -0xf
0x10c 0x57660567 jalr x10 x12, 1398
0x110 0x80060567 jalr x10 x12, -2048
0x114 0x7ea60503 lb x10 0x7ea(x12)
0x118 0x81660503 lb x10 -0x7ea(x12)
0x11c 0xff160503 lb x10 -0xf(x12)
0x120 0x57660503 lb x10 1398(x12)
0x124 0x80060503 lb x10 -2048(x12)
0x128 0x7ea61503 lh x10 0x7ea(x12)
0x12c 0x81661503 lh x10 -0x7ea(x12)
0x130 0xff161503 lh x10 -0xf(x12)
0x134 0x57661503 lh x10 1398(x12)
0x138 0x80061503 lh x10 -2048(x12)
0x13c 0x7ea63503 ld x10 0x7ea(x12)
0x140 0x81663503 ld x10 -0x7ea(x12)
0x144 0xff163503 ld x10 -0xf(x12)
0x148 0x57663503 ld x10 1398(x12)
0x14c 0x80063503 ld x10 -2048(x12)
0x150 0x7ea62503 lw x10 0x7ea(x12)
0x154 0x81662503 lw x10 -0x7ea(x12)
0x158 0xff162503 lw x10 -0xf(x12)
0x15c 0x57662503 lw x10 1398(x12)
0x160 0x80062503 lw x10 -2048(x12)
0x164 0x7ea60523 sb x10 0x7ea(x12)
0x168 0x80a60b23 sb x10 -0x7ea(x12)
0x16c 0xfea608a3 sb x10 -0xf(x12)
0x170 0x56a60b23 sb x10 1398(x12)
0x174 0x80a60023 sb x10 -2048(x12)
0x178 0x7ea61523 sh x10 0x7ea(x12)
0x17c 0x80a61b23 sh x10 -0x7ea(x12)
0x180 0xfea618a3 sh x10 -0xf(x12)
0x184 0x56a61b23 sh x10 1398(x12)
0x188 0x80a61023 sh x10 -2048(x12)
0x18c 0x7ea63523 sd x10 0x7ea(x12)
0x190 0x80a63b23 sd x10 -0x7ea(x12)
0x194 0xfea638a3 sd x10 -0xf(x12)
0x198 0x56a63b23 sd x10 1398(x12)
0x19c 0x80a63023 sd x10 -2048(x12)
0x1a0 0x7ea62523 sw x10 0x7ea(x12)
0x1a4 0x80a62b23 sw x10 -0x7ea(x12)
0x1a8 0xfea628a3 sw x10 -0xf(x12)
0x1ac 0x56a62b23 sw x10 1398(x12)
0x1b0 0x80a62023 sw x10 -2048(x12)
0x1b4 0x007ea517 auipc x10 0x7ea
0x1b8 0x007ea517 auipc x10 0x7ea
0x1bc 0x0000f517 auipc x10 0xf
0x1c0 0x00576517 auipc x10 1398
0x1c4 0x0140056f jal x10 label
0x1c8 0xf9dff56f jal x10 label1
0x1cc 0xfc5ff56f jal x10 label2
0x1d0 0xe89ff56f jal x10 label5
0x1d4 0xfb450ee3 beq x10 x20, label2
0x1d8 0xffffffff END CODE

0x10000000 0xef
0x10000001 0x0e
0x10000002 0x00
0x10000003 0x00
0x10000004 0xbf
0x10000005 0x0b
0x10000006 0x00
0x10000007 0x00
0x10000008 0xad
0x10000009 0xde
0x1000000a 0x00
0x1000000b 0x00
0x1000000c 0xef
0x1000000d 0xbe
0x1000000e 0x00
0x1000000f 0x00
0x10000010 0xe8
0x10000011 0x03
0x10000012 0x00
0x10000013 0x00
0x10000014 0xe8
0x10000015 0x03
0x10000016 0x00
0x10000017 0x00
0x10000018 0xe8
0x10000019 0x03
0x1000001a 0x00
0x1000001b 0x00
0x1000001c 0xe8
0x1000001d 0x03
0x1000001e 0x00
0x1000001f 0x00
0x10000020 0x61
0x10000021 0x62
0x10000022 0x63
0x10000023 0x31
0x10000024 0x30
0x10000025 0x30
0x10000026 0x64
0x10000027 0x65
0x10000028 0x66
0x10000029 0x08
0x1000002a 0x00
0x1000002b 0xef
0x1000002c 0xbe
0x1000002d 0xad
0x1000002e 0xde