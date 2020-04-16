

class ISB1 {

}


class ISB2 {

}


class ISB3 {

}


class ISB4 {

}


export class InterStateBuffer {
    isb1: ISB1;
    isb2: ISB2;
    isb3: ISB3;
    isb4: ISB4;


    // Rest stats are in GlobalVar
    numberOfStalls: Number; // Stat7
    numberOfDataHazards: Number; // Stat8
    numberOfControlHazard: Number; // Stat9
    numberOfBranchMisprediction: Number; //Stat10
    numberOfDataHazardStalls: Number; // Stat11
    numberOfControlHazardStalls: Number; // Stat12

    branchAddressDef: number;
    branchAddress: number;
    controlHazardType: number;

}
