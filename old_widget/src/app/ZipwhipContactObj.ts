import { ZipwhipMessageObj } from './ZipwhipMessageObj';

export class ZipwhipContactObj {
    id: string;
    firstName:string;
    lastName:string;
    lastMessage:string;
    lastRepliedByName:string;
    lastRepliedByDT:string;
    numUnreadMessages:number;
    phone:string;
    messages:Array<ZipwhipMessageObj>;
    carrier:string;
    grpName:string;
    

    constructor(){
        this.id="";
        this.firstName="";
        this.lastName="";
        this.lastMessage="";
        this.lastRepliedByName="";
        this.lastRepliedByDT="";
        this.numUnreadMessages=0;
        this.phone="";
        this.messages=new Array<ZipwhipMessageObj>();
        this.carrier="";
        this.grpName="";
    }
}