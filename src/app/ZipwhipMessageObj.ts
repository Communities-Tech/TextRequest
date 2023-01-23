export class ZipwhipMessageObj {
    type__c: string;
    id: string;
    messagebody__c: string;
    isattachment__c: boolean;
    timestamp__c:string;
    attbody__c:string;
    firstName:string;
    lastName:string;
    isRead:boolean;

    constructor(){
        this.type__c="";
        this.id="";
        this.messagebody__c="";
        this.isattachment__c=false;
        this.timestamp__c="";
        this.attbody__c="";
        this.firstName="";
        this.lastName="";
        this.isRead=true;
    }
}