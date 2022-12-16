import { ZipwhipMessageObj } from './ZipwhipMessageObj';

export class ZipwhipConvoObj {
    id: string;
    firstname__c:string;
    lastname__c:string;
    name:string;
    phone__c:string;
    messages:Array<ZipwhipMessageObj>;

    constructor(){
        this.id="";
        this.firstname__c="";
        this.lastname__c="";
        this.name="";
        this.phone__c="";
        this.messages=new Array<ZipwhipMessageObj>();
    }
}