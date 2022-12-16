import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ZipwhipContactObj } from './ZipwhipContactObj';

@Injectable({
  providedIn: 'root'
})
export class WebService {

  constructor(private http:HttpClient) { }

  SendMessage(first:string,last:string,phone:string,imgList:string[],message:string,params:HttpParams,isNew:boolean){
    
    var acc='';
    var firstName='';
    var lastName='';
    var user='';
    var unit='';
    var dpt='';
    var contacts=[];
    var cSocket=true;

    console.log('ps:'+params);
    console.log(params.get('dpt'));

    if(params!=null){
      acc = params.get('session');
      user=params.get('user');
      unit=params.get('unit');
      dpt=params.get('dpt');
    }

    if(first==undefined){
      firstName=params.get('firstName');
    }else{
      firstName=first;
    }
    
    if(last==undefined){
      lastName=params.get('lastName');
    }else{
      lastName=last;
    }
    //console.log(params);
    //console.log(acc);
    //console.log(message);
    
    //console.log('{"department":"'+dpt+'","unit":"'+unit+'","imageList":'+JSON.stringify(imgList)+',"contacts":"'+phone+'","account":"'+acc+'","body":"'+message+'","firstName":"'+firstName+'","lastName":"'+lastName+'","isNewContact":'+isNew+'}');
    
    if(imgList.length!=0){

      if(phone!=null||phone!=undefined){
        contacts.push('+1'+phone);
      }
      this.http.post<any>('/api/sendMMS',
      {body:JSON.parse('{"clientSocket":"'+cSocket+'","department":"'+dpt+'","unit":"'+unit+'","imageList":'+JSON.stringify(imgList)+',"contacts":"'+contacts+'","account":"'+acc+'","body":"'+message+'","firstName":"'+firstName+'","lastName":"'+lastName+'","isNewContact":'+isNew+',"user":"'+user+'"}')}).subscribe(data => {
        //console.log(data);
      });
      
    }else{
      if(phone!=null||phone!=undefined){
        contacts.push(phone);
      }
      this.http.post<any>('/api/sendSMS',
      {body:JSON.parse('{"clientSocket":"'+cSocket+'","department":"'+dpt+'","unit":"'+unit+'","contacts":"'+contacts+'","account":"'+acc+'","body":"'+message+'","firstName":"'+firstName+'","lastName":"'+lastName+'","isNewContact":'+isNew+',"user":"'+user+'"}')}).subscribe(data => {
        console.log('Data: '+data);
        console.log('DEPARTMENT: '+dpt);
        console.log({body:JSON.parse('{"clientSocket":"'+cSocket+'","department":"'+dpt+'","unit":"'+unit+'","contacts":"'+contacts+'","account":"'+acc+'","body":"'+message+'","firstName":"'+firstName+'","lastName":"'+lastName+'","isNewContact":'+isNew+',"user":"'+user+'"}')});
      });
    }
    
  }

  AddContact(phone:string,params:HttpParams,isNew:boolean){

    var acc='';
    var firstName='';
    var lastName='';
    var user='';
    var unit='';
    var dpt='';
    var cSocket=true;

    if(params!=null){
      acc = params.get('session');
      firstName=params.get('firstName');
      lastName=params.get('lastName');
      user=params.get('user');
      unit=params.get('unit');
      dpt=params.get('dpt');
    }

    this.http.post<any>('/api/saveContact',
      {body:JSON.parse('{"clientSocket":"'+cSocket+'","department":"'+dpt+'","unit":"'+unit+'","contacts":"'+phone+'","account":"'+acc+'","firstName":"'+firstName+'","lastName":"'+lastName+'","isNewContact":'+isNew+',"user":"'+user+'"}')}).subscribe(data => {
        console.log(data);
      });
  }

  RemoveContact(phone:string,params:HttpParams){

    var acc='';
    var firstName='';
    var lastName='';
    var user='';
    var unit='';
    var dpt='';
    var cSocket=true;

    if(params!=null){
      acc = params.get('session');
      firstName=params.get('firstName');
      lastName=params.get('lastName');
      user=params.get('user');
      unit=params.get('unit');
      dpt=params.get('dpt');
    }

    this.http.post<any>('/api/removeGroupContact',
      {body:JSON.parse('{"clientSocket":"'+cSocket+'","department":"'+dpt+'","unit":"'+unit+'","contacts":"'+phone+'","account":"'+acc+'","firstName":"'+firstName+'","lastName":"'+lastName+'","user":"'+user+'"}')}).subscribe(data => {
        console.log(data);
      });
  }
}

