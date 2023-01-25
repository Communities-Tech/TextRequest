import { Component, OnInit } from '@angular/core';
import { Lead } from './Lead';
import { ZipwhipConvoObj } from './ZipwhipConvoObj';
import { ZipwhipMessageObj } from './ZipwhipMessageObj';
import { ZipwhipContactObj } from './ZipwhipContactObj';
import {HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, tap } from "rxjs/operators";
import { WebService } from './web.service';
import { ActivatedRoute } from '@angular/router';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {io} from 'socket.io-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent implements OnInit{

  title = 'zipwhipWidget';


  formGroup:FormGroup;
  date:string;
  hours:any;
  minutes:any;
  seconds:any;
  currentLocale: any;
  message:string;
  showContactMessanger:boolean;
  templates:[];
  myContacts:Observable<ZipwhipContactObj[]>;
  myContactsArr:Array<ZipwhipContactObj>;
  myContactsTempArr:Array<ZipwhipContactObj>;
  myConvosArr:Array<ZipwhipConvoObj>;
  myConvos:Observable<ZipwhipConvoObj[]>;
  myCurContact:ZipwhipContactObj;
  myCurObsContact:Observable<ZipwhipContactObj>;
  myVal:string;
  selectedPhoneNumber:Number;
  leadRecord:Lead;
  showMain:boolean;
  showContactDetails:boolean;
  recordLoadError:string;
  messangerMessageValue:string;
  CurrentUser:Object;
  Rendered:boolean;
  options:[];
  searchValue:string;
  numContacts:number;
  phoneInput:string;
  firstNameInput:string;
  lastNameInput:string;
  selectedSortOption:string;
  accountNumber:string;
  initLoad:boolean;

  private socket: any;
  public data: any;

  constructor(private route: ActivatedRoute,private http:HttpClient,private ws:WebService){

    this.formGroup = new FormGroup({

      name: new FormControl('', [

          Validators.required,

      ])

    });

    this.showContactMessanger=false;
    this.showMain=true;
    this.showContactDetails=false;
    this.Rendered=false;
    this.message="";
    this.messangerMessageValue="aef";
    this.myContactsArr = new Array<ZipwhipContactObj>();
    this.myConvosArr = new Array<ZipwhipConvoObj>();
    this.myContactsTempArr = new Array<ZipwhipContactObj>();
    this.myConvos = new Observable<ZipwhipConvoObj[]>();
    this.myContacts = new Observable<ZipwhipContactObj[]>();
    this.myCurContact=new ZipwhipContactObj();
    this.myCurObsContact=new Observable<ZipwhipContactObj>();
    this.numContacts=0;
    this.searchValue='';
    this.phoneInput='';
    this.firstNameInput='';
    this.lastNameInput='';
    this.selectedSortOption='Recent';
    this.accountNumber='';

    this.leadRecord = new Lead();

    this.socket = io(location.origin);
    this.initLoad=true;

  }

  ngOnInit() {



    this.socket.on('connect', () => {
      console.log("on connect:THIS SOCKET IS id is");

      console.log(this.socket.id);

    });

    var httpParams;
    const url = window.location.href;


    if (url.includes('?')) {
      httpParams = new HttpParams({ fromString: url.split('?')[1] });

    }else{
      httpParams = null;
    }

    if(httpParams){
      console.log('my init: '+httpParams);

      if(String(httpParams.get('session'))=='Team Champions'||String(httpParams.get('session'))=='Team Majors'||String(httpParams.get('session'))=='Dream Team'){
        this.accountNumber='+1(806) 391-4068';

      }else{
        this.accountNumber='+1(877) 475-4553';
      }

      //this.http.get<ZipwhipContactObj[]>('/api/getGroupContacts/?account='+httpParams.get('session')+'&user='+httpParams.get('user')+'&division='+httpParams.get('div')+'&unit='+httpParams.get('unit')+'&department='+httpParams.get('dpt')).subscribe();
      //this.http.get('/api/getGroupContacts/?account='+httpParams.get('session')+'&user='+httpParams.get('user')+'&division='+httpParams.get('div')+'&unit='+httpParams.get('unit')+'&department='+httpParams.get('dpt')).subscribe();
      this.socket.emit("getGroupContacts",{
        query:{
          dashes:httpParams.get('allowedServices'),
          user:httpParams.get('user'),
          socket:true,
          broadcast:false}
      });
    }

    this.socket.on("clientUpdate",()=>{

      console.log('clientUPdate');
      this.socket.emit("getGroupContacts",{
        query:{
          dashes:httpParams.get('allowedServices'),
          user:httpParams.get('user'),
          socket:true,
          broadcast:false}
      });

    });


    this.socket.on("update", (data) => {

      console.log('update 22');


      console.log(data);

      console.log(this.socket.id);

      if(data!=null||data!=undefined){

        if(data.add==true){

          console.log('HERE BABY');

          const url = window.location.href;

          if (url.includes('?')) {
            httpParams = { fromString: url.split('?')[1] };
          }else{
            httpParams = null;
          }

          console.log('HTTPPARAMS: '+url.split('?')[1]);
          //var httpParams = new HttpParams({ fromString: url.split('?')[1] });
          /*
          this.socket.emit("getGroupContacts",{
            query:{
            account:httpParams.get('session'),
            user:httpParams.get('user'),
            division:httpParams.get('div'),
            unit:httpParams.get('unit'),
            department:httpParams.get('dpt'),
            socket:true,
            broadcast:false}
          });*/

          this.myCurContact=new ZipwhipContactObj();
          this.myCurContact.phone=data.convoList;
          this.myCurContact.firstName=String(httpParams.get('firstName'));
          this.myCurContact.lastName=String(httpParams.get('lastName'));

          this.phoneInput=data.convoList;
          this.firstNameInput=String(httpParams.get('firstName'));
          this.lastNameInput=String(httpParams.get('lastName'));
          this.myContactsArr.push(this.myCurContact);
          this.initLoad=false;
          this.showContactMessanger=false;

        }else if(data.remove==true){
          console.log('HERE BABY');

          const url = window.location.href;

          if (url.includes('?')) {
            httpParams = new HttpParams({ fromString: url.split('?')[1] });

          }else{
            httpParams = null;
          }

          console.log('HTTPPARAMS: '+httpParams);
          //var httpParams = new HttpParams({ fromString: url.split('?')[1] });
          this.socket.emit("getGroupContacts",{
            query:{
            account:httpParams.get('session'),
            user:httpParams.get('user'),
            division:httpParams.get('div'),
            unit:httpParams.get('unit'),
            department:httpParams.get('dpt'),
            socket:true,
            broadcast:false}
          });

          this.myCurContact=new ZipwhipContactObj();

          this.showContactMessanger=false;
          this.showMain=true;

          this.phoneInput=data.convoList;
          this.firstNameInput=String(httpParams.get('firstName'));
          this.lastNameInput=String(httpParams.get('lastName'));
          this.myContactsArr.splice(this.myContactsArr.indexOf(this.myCurContact),1);
          this.initLoad=true;
        }else{
          this.myContacts = data.convoList;
          this.myContactsArr=data.convoList;
        }

        this.myContactsTempArr=this.myContactsArr;
        this.numContacts=this.myContactsArr.length;
        console.log(this.myCurContact);
        console.log(this.myContactsArr);

        if(this.initLoad){
          var ev= {value:'Recent'};
          this.onSortChange(ev);

          if(httpParams!=null){
            if(httpParams.get('recordPhone')!=null){

              var r = String(httpParams.get('recordPhone'));

              var foundCont= this.myContactsArr.find(element => {
                var el = element.phone.replace(/(\()*(\))*(\-)*(\s)*(\+1)*(\.)*/g,'');
                var ht = httpParams.get('recordPhone').replace(/(\()*(\))*(\-)*(\s)*(\+1)*(\.)*/g,'');

                if(ht.length>10){
                  ht=ht.slice(ht.length - 10);
                }
                if(el==ht){
                  return element;
                }
              });

              console.log('FOUND: '+ foundCont);

              if(foundCont!=null||foundCont!=undefined){

                this.showContactMessanger=true;
                this.myCurContact=foundCont;

                window.setTimeout(function(){
                  var scroll = document.getElementById("MessangerContent");
                  console.log(scroll);
                  if(scroll!=null){
                    scroll.scrollTop = scroll.scrollHeight;
                    console.log(scroll.scrollHeight);
                  }},100);

              }else{
                this.myCurContact=new ZipwhipContactObj();
                this.phoneInput='';
                this.firstNameInput='';
                this.lastNameInput='';
                this.showContactMessanger=true;

                this.phoneInput=String(httpParams.get('recordPhone').replace(/(\()*(\))*(\-)*(\s)*(\+1)*(\.)*/g,''));

                if(this.phoneInput.length>10){
                  this.phoneInput=this.phoneInput.slice(this.phoneInput.length - 10);
                }
                this.firstNameInput=String(httpParams.get('firstName'));
                this.lastNameInput=String(httpParams.get('lastName'));

              }
            }
          }
          this.initLoad=false;
        }else{
          console.log('FALSE');
        }

        if(this.myCurContact!=null||this.myCurContact!=undefined){
          if(this.myCurContact.phone!=''){

            this.myCurContact=this.myContactsArr.find(element => {
              var el = element.phone.replace(/(\()*(\))*(\-)*(\s)*(\+1)*(\.)*/g,'');
              //console.log(element.phone.replace(/(\()*(\))*(\-)*(\s)*(\+1)*(\.)*/,'') + ' TO '+this.myCurContact.phone);
              if(el==this.myCurContact.phone.replace(/(\()*(\))*(\-)*(\s)*(\+1)*(\.)*/g,'')){

                return element;
              }
            });

            window.setTimeout(function(){
              var scroll = document.getElementById("MessangerContent");
              //console.log(scroll);
              if(scroll!=null){
                scroll.scrollTop = scroll.scrollHeight;
                //console.log(scroll.scrollHeight);
              }
            },100);
          }
        }

      }else{
        //this.http.get<ZipwhipContactObj[]>('/api/getGroupContacts/?account='+httpParams.get('session')+'&user='+httpParams.get('user')+'&division='+httpParams.get('div')+'&unit='+httpParams.get('unit')+'&department='+httpParams.get('dpt')).subscribe();
      }

    });



    return () => this.socket.disconnect();
  }


  handleClickContact(contactId:string){
    this.showContactMessanger=true;
    this.myCurContact=this.myContactsArr.find(value => value.id == contactId);



    window.setTimeout(function(){
      var scroll = document.getElementById("MessangerContent");
      //console.log(scroll);
      if(scroll!=null){
        scroll.scrollTop = scroll.scrollHeight;
        console.log(scroll.scrollHeight);
      }
    },100);

  }

  doTextareaValueChange(ev) {
    try {
      this.messangerMessageValue = ev.target.value;
      console.log(this.messangerMessageValue);
    } catch(e) {
      console.info('could not set textarea-value');
    }
  }

  sendMessage(){
    //let message = this.messangerMessageValue;
    const regex1 = /<div>|<\/div>|<img(.|\n)*>|<br>/g;
    let imgList = [];

    var imgs=document.getElementById("messangerMessageTextArea").children;
    for(var i=0;i<imgs.length;i++){

      if(imgs[i].tagName=='IMG'){

        imgList.push(this.getBase64Image(imgs[i]));
      }

    }
    var s = document.getElementById("messangerMessageTextArea").innerHTML.replace(regex1,'\\n');

    //console.log(s.trim());
    s=s.replace(/&nbsp;/g, '');
    let message = s.trim();//document.getElementById("messangerMessageTextArea").innerHTML;


    const url = window.location.href;
    var httpParams;
    var firstName,lastName;
    var phone='';

    console.log(phone);

    if (url.includes('?')) {
      httpParams = new HttpParams({ fromString: url.split('?')[1] });

      if(httpParams.get('user')!=undefined){
        if(String(httpParams.get('user')!='undefined')){
          console.log(JSON.parse(JSON.stringify(message)));

          message+="\\n\\n"+String(httpParams.get('user'));
          message=JSON.parse(JSON.stringify(message));
        }
      }


    }

    console.log('CONTACT PHONE: ' +String(this.myCurContact.phone).length);

    if(String(this.myCurContact.phone).length!=0){
      if(this.myCurContact.phone.length>10){
        this.myCurContact.phone=this.myCurContact.phone.slice(this.myCurContact.phone.length - 10);
      }
      phone = this.myCurContact.phone;
    }else{
      if(this.phoneInput.length>10){
        this.phoneInput=this.phoneInput.slice(this.phoneInput.length - 10);
      }

      phone=this.phoneInput;
      firstName=this.firstNameInput;
      lastName=this.lastNameInput;

    }


    if(String(this.myCurContact.phone).length!=0){

      var user=httpParams.get('user');

      console.log('USER IS: '+user);
      var tempArr = this.myContactsArr.filter(cont=>{

        var cutUser=cont.grpName.split('_')[3];
        console.log(cont.grpName+ ' contains '+cutUser);
        if(cutUser==user){
            return true;
        }else{
            return false;
        }
      });

      console.log('TEMPARR: '+tempArr);

      if(tempArr!==null||tempArr!==undefined){
        var cons=tempArr.find(c=>c.id==this.myCurContact.id);
        console.log('cons value: '+cons);
        var isUndefined=(cons===undefined)?true:false;
        console.log(isUndefined);
        if(!isUndefined){
          console.log('Im running this anyways just because');
          this.ws.SendMessage(firstName,lastName,phone,imgList,message,httpParams,false);
        }else{
          console.log('cons is undefined');
          this.ws.SendMessage(firstName,lastName,phone,imgList,message,httpParams,true);
        }
      }else{
        console.log('tempArr is undefined');
        this.ws.SendMessage(firstName,lastName,phone,imgList,message,httpParams,true);
      }
    }else{
      console.log('phone field empty');
      this.ws.SendMessage(firstName,lastName,phone,imgList,message,httpParams,true);

    }


    //console.log(document.getElementById('messangerMessageTextArea').getAttribute('value'));
    //console.log(this.messangerMessageValue);
    document.getElementById("messangerMessageTextArea").innerHTML="";
  }

  getBase64Image(img) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    var lw=String(img.name).split('x');
    canvas.width = Number(lw[0]);
    canvas.height = Number(lw[1]);

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL("image/jpg");

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
  }


  handleNewMessageClick(){
    this.myCurContact=new ZipwhipContactObj();
    this.phoneInput='';
    this.firstNameInput='';
    this.lastNameInput='';
    this.showContactMessanger=true;


  }

  handleBackToMain(){

    this.showContactMessanger=false;
    this.myCurContact=new ZipwhipContactObj();

  }

  onFilterSortChange(ev){
    console.log(ev);

    var httpParams;
    const url = window.location.href;

    if (url.includes('?')) {
      httpParams = new HttpParams({ fromString: url.split('?')[1] });

    }else{
      httpParams = null;
    }

    if(httpParams){
      try {
        if(ev.value=='User'){

          var user=httpParams.get('user');
          this.myContactsTempArr = this.myContactsArr.filter(cont=>{

            var cutUser=cont.grpName.split('_')[3];
            console.log(cont.grpName+ ' contains '+cutUser);
            if(cutUser==user){
                console.log('yup');
                return true;
            }else{
                return false;
            }

          });
          //this.myContactsTempArr = this.myContactsArr.filter(cont=>cont.grpName.includes(httpParams.get('user')));
        }else if(ev.value=='Group'){

          this.myContactsTempArr= this.myContactsArr;
        }
      } catch (error) {
        console.log(error);
      }
    }

  }

  onSortChange(ev){

    try {
      if(ev.value=='Recent'){

        const sortByDate = arr => {
          const sorter = (a, b) => {
             return new Date(b.lastRepliedByDT).getTime() - new Date(a.lastRepliedByDT).getTime();
          }
          arr.sort(sorter);
       };
       sortByDate(this.myContactsTempArr);

       this.selectedSortOption='Recent';

      }else if(ev.value=='Asc'){

        this.myContactsTempArr=this.myContactsTempArr.sort((a, b) => {

          var nameA,nameB;

          if(a!=null||a!=undefined){
            nameA =a.firstName.toLowerCase();
          }
          if(b!=null||b!=undefined){
            nameB =b.firstName.toLowerCase();
          }

          if (nameA < nameB) //sort string ascending
            return -1;
          if (nameA > nameB)
            return 1;
          return 0;
        });

        this.selectedSortOption='Asc';

      }else if(ev.value=='Desc'){

        this.myContactsTempArr=this.myContactsTempArr.sort((b, a) => {

          var nameA,nameB;

          if(a!=null||a!=undefined){
            nameA =a.firstName.toLowerCase();
          }
          if(b!=null||b!=undefined){
            nameB =b.firstName.toLowerCase();
          }

          if (nameA < nameB) //sort string ascending
            return -1;
          if (nameA > nameB)
            return 1;
          return 0;
        });

        this.selectedSortOption='Desc';

      }
    } catch (error) {
      console.log(error);
    }

  }

  onSearchChange(searchValue){

    searchValue=String(searchValue).toLowerCase();

    if(searchValue==''){
      this.myContactsTempArr = this.myContactsArr;
    }else{
      this.myContactsTempArr = this.myContactsArr.filter(cont=>{

        if(cont!=null||cont!=undefined){
          if(cont.firstName.toLowerCase().includes(searchValue)||cont.lastName.toLowerCase().includes(searchValue)){
            return cont;
          }
        }

      });
    }

  }

  clearSearchValue(){
    this.searchValue='';
    this.myContactsTempArr = this.myContactsArr;
  }

  toBase64(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }


  selectImage(ev){
    //console.log(ev);
    ev.childNodes.forEach(child=>{
      //console.log(child.nodeName);
      if(child.nodeName=='INPUT'){
        child.click();
      }

    });

  }

  async handleDialog(e){
    console.log(e.target.files[0]);
    await this.toBase64(e.target.files[0]).then((val)=>{
      //var divContainer = document.createElement('div');

      var img = document.createElement('img');
      var newImg = new Image();
      newImg.src = String(val);

      newImg.onload = function(){
        img.setAttribute('src',String(val));
        img.setAttribute('style','transform-origin: left;');
        img.setAttribute('name',String(newImg.width)+'x'+String(newImg.height));

        ///divContainer.appendChild(img);
        document.getElementById("messangerMessageTextArea").appendChild(img);
      }

    });
  }

  saveContact(){
    const url = window.location.href;
    var httpParams;
    var phone='';

    if (url.includes('?')) {
      httpParams = new HttpParams({ fromString: url.split('?')[1] });

    }

    phone=this.phoneInput;
    httpParams.firstName=this.firstNameInput;
    httpParams.lastName=this.lastNameInput;
    console.log('fName: '+phone);
    console.log('fName: '+httpParams.firstName);
    console.log('fName: '+httpParams.lastName);



    this.ws.AddContact(phone,httpParams,true);

  }

  removeContact(){

    const url = window.location.href;
    var httpParams;
    var phone='';

    if (url.includes('?')) {
      httpParams = new HttpParams({ fromString: url.split('?')[1] });

    }

    phone=this.myCurContact.phone;
    httpParams.firstName=this.firstNameInput;
    httpParams.lastName=this.lastNameInput;
    console.log('fName: '+phone);
    console.log('fName: '+httpParams.firstName);
    console.log('fName: '+httpParams.lastName);



    this.ws.RemoveContact(phone,httpParams);
  }
}
