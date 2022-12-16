/*
function requireHTTPS(req, res, next) {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}*/

const dotenv = require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {Pool} = require('pg');
var jsforce = require('jsforce');
const querystring = require('querystring');
var request = require('request');
const { response } = require('express');
const async = require('async');
var FormData = require('form-data');
var fs = require('fs');
const { Blob } = require('buffer');
const { encode } = require('querystring');
const cluster = require('cluster');
const { SfDate } = require('jsforce');
var timeout = require('connect-timeout');
const { createServer } = require("http");
const { Server } = require("socket.io");
const { Worker } = require("worker_threads");

const app = express();
const httpServer = createServer(app);



//const app = express();


//var server= app.listen(process.env.PORT);
httpServer.keepAliveTimeout = 61 * 1000;
httpServer.headersTimeout = 65 * 1000;
httpServer.setTimeout(200000);
httpServer.timeout = 1000 * 60 * 5; 

const io = new Server(httpServer, {});

httpServer.listen(process.env.PORT);



// Scket Layer over Http Server

//const io = require('socket.io')(server,options);
var sockets = [];
var session,leadPhone;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({extended: true,limit: '50mb'}));
app.use(cors());
app.use(express.static('./dist/my-first-project'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/', function(req, res) {
    session=req.query.sessionKey;
    leadPhone=req.query.leadPhone;

    res.sendFile('index.html', {root: 'dist/my-first-project/'});
    //cleanGrp('9fb607f9-4a1e-420d-919c-98304ba40eb6:404370107');
    //removeGrps('85aadbc8-03fe-4f7b-add1-3ba888758e1c:401931107');
    //socket.emit("update");
  
    //sendMassText('217bffbf-71c5-499f-b1e1-1882d522f5a6:402219707');
    //getContacts(0,500,'9fb607f9-4a1e-420d-919c-98304ba40eb6:404370107');//changeme

    //res.write('Hello\n');

});

app.post('/zipwhip/message/send',(req,res,next)=>{
  //res.status(200).json('Success');
  res.end();
  

  try {

    console.log('/zipwhip/message/send: '+JSON.stringify(req.body));

    pool.query('SELECT Id,sfid,Name FROM salesforce.ZipwhipConvoObj__c WHERE Name =\''+String(req.body.finalDestination).replace(/(\+1)*/g,'').trim()+'\';', (error, results) => {
      if (error) {
        //console.log(results);
        console.log('send webhook: ' +error);
        
      }else{
        
        if(Array.from(results.rows).length!=0){
          ///console.log(Array.from(results.rows)[0].sfid);

          try {
            pool.query('SELECT Id,sfid,isAttachment__c,MessageBody__c,Timestamp__c,Type__c,ZipwhipConvoObj__c,Sent_By__c,Account__c FROM salesforce.ZipwhipConvoMessageItem__c WHERE ZipwhipConvoObj__c = \''+Array.from(results.rows)[0].sfid+'\' ORDER BY Timestamp__c ASC;', (error, results2) => {
              if (error) {
                //console.log(results);
                console.log('getGroupContacts2: ' +error);
  
              }else{

                if(Array.from(results2.rows).length!=0){
                  var isContained = false;

                  for(var row of Array.from(results2.rows)){

                    //console.log(Date.parse(row.timestamp__c) +' to '+Date.parse(req.body.dateCreated)+' to '+  row.isattachment__c+' to '+req.body.hasAttachment+' to '+ row.messagebody__c+' to '+req.body.body);
                    
                    if(Date.parse(row.timestamp__c)==Date.parse(req.body.dateCreated) && row.isattachment__c==req.body.hasAttachment && row.messagebody__c==req.body.body){
                      isContained=true;
                      break;
                    }
                  }

                  if(!isContained){

                    console.log(true);

                    var session = '';
                    if(req.body.finalSource=='+18063914068'){
                      session = process.env.MAJOR_SESSION;
                    }else if(req.body.finalSource=='+18774754553'){
                      session = process.env.STAFFING_SESSION;
                    }else{
                      session = process.env.CHAMP_SESSION;
                    }

                    
                    if(req.body.hasAttachment){

                      var d = getAttData(req.body.fingerprint,session).then(data=>{
                      //var d = getAttData('3430848724','85aadbc8-03fe-4f7b-add1-3ba888758e1c:401931107').then(data=>{
                        if(data!=null||data!=undefined){
                          
                          var imgURL=String(data[0].ResponseMessage__c).replace('null','');
                          
                          if(imgURL.length<=131072){

                            var attD = imgURL;
                            var cont = {phone:req.body.finalDestination};
                            var msg = {attData:attD,body:String(req.body.body).trim(), dateCreated:req.body.dateCreated,hasAttachment:req.body.hasAttachment,id:req.body.id,fingerprint:req.body.fingerprint,carrier:req.body.carrier};
                  
                  
                            updateConvoObj(cont,msg,false,'Sender',session,false);
                          }
                          
                        }
                        

                      });

                    }else{
                      var cont = {phone:req.body.finalDestination};
                      var msg = {body:String(req.body.body).trim(), dateCreated:req.body.dateCreated,hasAttachment:req.body.hasAttachment,id:req.body.id,fingerprint:req.body.fingerprint,carrier:req.body.carrier};
              
              
                      updateConvoObj(cont,msg,false,'Sender',session,false);
                    }
                  }
                  
                }
              
              }
            });
          }
          catch(error){
            console.log('asdfasdfsdfasdf 1' +error);
          }
        }

      }
    });
  }catch (error) {
    console.log('send error: '+error);
  }


});

app.post('/zipwhip/message/receive',(req,res)=>{

  //res.status(200).json('Success');
  res.end();
  console.log('receive request: '+req);
  var account = '';
  var sessionKey = '';
  try {

    var finalSource=String(req.body.finalSource).replace(/(\+1)*/g,'').trim();
    console.log('fin: '+finalSource);

    if(req.body.finalDestination=='+18063914068'){
      account = 'Insurance';
      sessionKey=process.env.MAJOR_SESSION;
    }else{
      account = 'Staffing';
      sessionKey=process.env.STAFFING_SESSION;
    }

    getGroupViaContact(finalSource,sessionKey).then(d=>{
      console.log('getGroupViaContact AFTER: '+d);

      var conn = new jsforce.Connection({
        // you can change loginUrl to connect to sandbox or prerelease env.
        loginUrl : 'https://login.salesforce.com'
      });
      conn.login(process.env.USER,process.env.PASSWORD, function(err, userInfo) {
        if (err) { return console.error('login-getGroupViaContact-receive:'+err); }
    
          try {

            console.log('BUILD BODY'); 
            var body = { method: "zipwhipMsgHook",
                      params: {"mapping":"received","object":"ZipwhipWidgetHookUpdate__e"},
                      body: '{"Users":"'+d+'","Type__c":"Received","ContactID__c":"'+req.body.finalSource+'","Message__c":"'+String(req.body.body).trim()+'","MsgReceipt__c":"'+req.body.dateCreated+'","AttBody__c":"","Account__c":"'+account+'"}'};
            /*
            var parsed='';
            
            try {
              console.log('about to get error: ');
              parsed = JSON.parse(body);
            } catch (e) {
              // Oh well, but whatever...
              console.log('parsed error: '+e);

            }
            if(parsed!=''){
              
            }*/
            conn.apex.post("/api/api_POST", body, function(err, res2) {
            
              if (err) { 
                
                console.error('recieve-getGroupViaContact-Post: '+err);
                //res.status(500).send(err);
              }else{ 
                console.log('Send data');

              }
      
            });
            
          } catch (error) {
            console.log('zipwhiphoook Error: '+error);
          }
      });
    });

    if(req.body.hasAttachment){

      var d = getAttData(req.body.fingerprint,sessionKey).then(data=>{
        //var d = getAttData('3430848724','9fb607f9-4a1e-420d-919c-98304ba40eb6:404370107').then(data=>{
          if(data!=null||data!=undefined){
            
            var imgURL=String(data[0].ResponseMessage__c).replace('null','');
      
            //console.log(imgURL);
            
            if(imgURL.length<=131072){
      
              var attD = imgURL;
              var cont = {phone:req.body.finalSource};
              var msg = {attDataEx2:'',attDataEx:'',attData:attD,body:String(req.body.body).trim(), dateCreated:req.body.dateCreated,hasAttachment:req.body.hasAttachment,id:req.body.id,fingerprint:req.body.fingerprint,carrier:req.body.carrier};
      
      
              updateConvoObj(cont,msg,false,'Receiver',sessionKey,true);
            }else{
              console.log('IMAGE TOO LARGE.........');
      
              /*
              var mid1 = (imgURL.length / 3); //get the middle of the String
              var mid2 = (mid1*2); //get the middle of the String*/

              var mid1 = 131072 //get the middle of the String
              var mid2 = (mid1*2);

              var part1=String(imgURL).substring(0, mid1);
              var part2=String(imgURL).substring(mid1,mid2);
              var part3=String(imgURL).substring(mid2);
      
              if(part3!=''||part3!=undefined){
                if(part3.length>131072){
                  var remainder=part3.length-131072;

                  part3=part3.substring(0,part3.length-remainder);
                }
              }
      
              var attD = part1;
              var attEx=part2;
              var attEx2=part3;
              var cont = {phone:req.body.finalSource};
              var msg = {attDataEx2:attEx2,attDataEx:attEx,attData:attD,body:String(req.body.body).trim(), dateCreated:req.body.dateCreated,hasAttachment:req.body.hasAttachment,id:req.body.id,fingerprint:req.body.fingerprint,carrier:req.body.carrier};
      
      
              updateConvoObj(cont,msg,false,'Receiver',sessionKey,true);
            }
            
          }
          
      
        });
  
    }else{
      var cont = {phone:req.body.finalSource};
      var msg = {body:String(req.body.body).trim(), dateCreated:req.body.dateCreated,hasAttachment:req.body.hasAttachment,id:req.body.id,fingerprint:req.body.fingerprint,carrier:req.body.carrier};
    
      updateConvoObj(cont,msg,false,'Receiver',sessionKey,true);
    }
    
  } catch (error) {
    console.log('receive: '+error);
  }

  
});

app.post('/api/sendSMS',(req,res,next)=>{
  
  try {

    res.end();
  
    var reqBody = req.body.body;
    var newContact = reqBody.isNewContact;
    console.log('SEND REQ BODY:'+JSON.stringify(reqBody));

    var body = String(reqBody.body).replace(/(amp;)*/g,'');

    var session=(reqBody.account=='Team Majors'||reqBody.account=='Team Champions'||reqBody.account=='Dream Team')?process.env.MAJOR_SESSION:process.env.STAFFING_SESSION;
    
    var options = {
      'method': 'POST',
      'url': 'https://api.zipwhip.com/message/send',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        'session': session,
        'contacts': reqBody.contacts,
        'body': body
      }
    };

  
    request(options, function (error, response) {
      if (error){
        //res.status(500).json(error);
        //next(error);
        console.log(error);
      }else{
        if(newContact==true){
          /*
          var reqCont=reqBody.contacts;
          var reqFirstName=reqBody.firstName;
          var reqLastName=reqBody.lastName;
          var reqAccount=reqBody.account;
          var reqUser=reqBody.user;
          var reqUnit=reqBody.unit;
          var reqDpt=reqBody.department;
          var reqSocket=reqBody.clientSocket;
          
          const worker = new Worker('./getGroupIdsFunc.js', {workerData:{reqCont,reqFirstName,reqLastName,session,reqAccount,reqUser,reqUnit,reqDpt,reqSocket}});
          worker.on('message', data=>{
            if(data!==undefined){
              console.log('emit: '+data.type + ' '+data.obj);
              io.emit(data.type,data.obj);
            }
          });
          worker.on('error', err=>console.log(err));
          worker.on('exit', (code) => {
              if (code !== 0)
                  console.log(`stopped with  ${code} exit code`);
          });*/
          sendCreateContactMessage(reqBody.contacts,reqBody.firstName,reqBody.lastName,session,reqBody.account,reqBody.user,reqBody.unit,reqBody.department,reqBody.clientSocket,next);
        }

        console.log('SEND SMS: ');

        var parsed='';

        try {
          parsed = JSON.parse(response.body);
        } catch (e) {
          // Oh well, but whatever...
          //console.log('parsed error: '+e);
          //next(e);
        }
        if(parsed!=''){
          if(JSON.parse(response.body).success==true){

            if(JSON.parse(response.body).response.tokens!=null||JSON.parse(response.body).response.tokens!=undefined){
  
              var id = JSON.parse(response.body).response.tokens[0].message;
  
              var options = {
                'method': 'POST',
                'url': 'https://api.zipwhip.com/message/get',
                'headers': {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                  'session': session,
                  'id':id
                }
              };
      
              try {
                request(options, function (error, response) {
                  if (error){
                    //res.status(500).json(error);
                    //next(error);
                    console.log(error);
                  }else{
                    var msgResp = JSON.parse(response.body).response;
      
                    var cont = {phone:msgResp.destAddress};
                    var msg = {sentBy:reqBody.user,body:String(msgResp.body).trim(), dateCreated:msgResp.dateCreated,hasAttachment:msgResp.hasAttachment,id:msgResp.id,fingerprint:msgResp.fingerprint,carrier:msgResp.carrier};
      
                    if(reqBody.clientSocket!=null||reqBody.clientSocket!=undefined){
                      if(reqBody.clientSocket){
                        updateConvoObj(cont,msg,false,'Sender',session,true);
                      }
                    }else{
                      console.log('clientSocket is null or undefined');
                    }
                    //updateConvoObj(cont,msg,false,'Sender',session,false); changedTODAY
                  }
                });
              }catch(exception){
                console.log('exception: '+exception);
              }
            }else{
              console.log('No TOKENS');
            }
            
          }else{
            console.log('Bad Request SMS');
          }
        }else{
          console.log('parsed is blank')
        }
      }
      
    });
  } catch (error) {
    //next(error);
    console.log(error);
  }


});

app.post('/api/sendMMS',(req,res,next)=>{

  res.end();

  var reqBody = req.body.body;
  var newContact = reqBody.isNewContact;
  var imgList = [];
  imgList=reqBody.imageList;

  console.log(reqBody.contacts);
  

  fs.writeFileSync("image.jpg", Buffer.from(imgList[0], 'base64',1024*1024*0.3));

  //console.log(fs.createReadStream("image.jpg"));


  var session=(reqBody.account=='Team Majors'||reqBody.account=='Team Champions'||reqBody.account=='Dream Team')?process.env.MAJOR_SESSION:process.env.STAFFING_SESSION;

  var options2 = {
    'method': 'POST',
    'url': 'https://api.zipwhip.com/hostedContent/save?session='+session,
    'headers': {
      'Content-Type': 'text/plain'
    },
    formData: {
      'image': {
        'value': fs.createReadStream('image.jpg'),
        'options': {
          'filename': 'image.jpg',
          'contentType': null
        }
      }
    }
  };

  try {
    request(options2, function (error, response) {
      if (error){
        res.status(500).json(error);
      }else{

        console.log(response.body);

        var parsed='';

        try {
          parsed = JSON.parse(response.body).response.url;
        } catch (e) {
          // Oh well, but whatever...
          //console.log('parsed error: '+e);

        }
        if(parsed!=''){
          var storageKey = JSON.parse(response.body).response.url;

          console.log(storageKey);
  
          var options = {
            'method': 'POST',
            'url': 'https://api.zipwhip.com/messaging/send?session='+session,
            'headers': {
              'Content-Type': 'text/plain'
            },
            formData: {
              'to': reqBody.contacts,
              'body': reqBody.body,
              'key' : storageKey
            }
          };
        
          try {
            request(options, function (error, response) {
              if (error){
                res.status(500).json(error);
              }else{
                if(newContact==true){
                  sendCreateContactMessage(reqBody.contacts,reqBody.firstName,reqBody.lastName,session,reqBody.account,reqBody.user,reqBody.unit,reqBody.department,true,next);
                }
          
                //getContacts(0,500,session);
  
              }
              
            });
          } catch (error) {
            console.log('asdfasdfsdfasdf 5' +error);
          }
        }
 
      }
    });
  }catch(error){
    res.status(500).json(error);
  }

});

app.post('/api/saveContact',(req,res,next)=>{

  res.end();

  var reqBody = req.body.body;
  var newContact = reqBody.isNewContact;
  //var session=(reqBody.account=='Team Majors')?process.env.MAJOR_SESSION:process.env.CHAMP_SESSION;
  var session=(reqBody.account=='Team Majors'||reqBody.account=='Team Champions'||reqBody.account=='Dream Team')?process.env.MAJOR_SESSION:process.env.STAFFING_SESSION;

  if(newContact==true){
    sendCreateContactMessage(reqBody.contacts,reqBody.firstName,reqBody.lastName,session,reqBody.account,reqBody.user,reqBody.unit,reqBody.department,true,next);
    

  }
});

app.post('/api/removeGroupContact',(req,res)=>{

  res.end();

  var reqBody = req.body.body;
  console.log(reqBody);
  var session=(reqBody.account=='Team Majors'||reqBody.account=='Team Champions'||reqBody.account=='Dream Team')?process.env.MAJOR_SESSION:process.env.STAFFING_SESSION;

  removeContactFromGroup(reqBody.contacts,session,reqBody.account,reqBody.user,reqBody.unit,reqBody.department);
    
});

// On every Client Connection
io.on('connection', (socket)=> {
  sockets.push(socket);
  console.log('Socket: client connected id: '+socket.id + ' count is: ' + sockets.length);

  socket.on("disconnect", ()=> {

    console.log("disconnect "+socket.id);

    let index = sockets.indexOf(socket.id);
    sockets.splice(index, 1);
  
  });
  
  socket.on("getGroupContacts", (req)=> {
  
    console.log(socket.id + ' requested GETGROUPCONTACTS payload');
      //var session=(req.query.account=='Team Majors')?process.env.MAJOR_SESSION:process.env.CHAMP_SESSION;
    var session=(req.query.account=='Team Majors'||req.query.account=='Team Champions'||req.query.account=='Dream Team')?process.env.MAJOR_SESSION:process.env.STAFFING_SESSION;
    var unit=req.query.unit;
    var dpt=req.query.department;
    var user=req.query.user;
    var broadcast=req.query.broadcast;
    //console.log(req.query.account);
    try {
  
      if(req.query.account!=''||req.query.account!=null||req.query.account!=undefined){
        getGroupContacts(req.query.account,session,user,unit,dpt,broadcast).then((contactArr)=>{
  
          
          //console.log('got getGroupContacts 1');
  
          var pNums = [];
          var convoObjs=[];
          var pList =[];
  
          if(contactArr!==undefined){
            try {
              new Promise((res1,rej1)=>{
              
        
                for(var contact of contactArr){
                    pNums.push("\'"+contact.mobileNumber+"\'");
                }
          
                if(pNums.length!=0){
                  //console.log('SELECT Id,sfid,FirstName__c,LastName__c,Phone__c FROM salesforce.ZipwhipConvoObj__c WHERE Phone__c IN ('+pNums+');');
          
                  pool.query('SELECT Id,sfid,FirstName__c,LastName__c,Phone__c FROM salesforce.ZipwhipConvoObj__c WHERE Phone__c IN ('+pNums+') AND Total_Messages__c != 0;', (error, results) => {
                    if (error) {
                      //console.log(results);
                      console.log('getGroupContacts1: ' +error);
                      rej1(error);
                    }else{
                      
                      //console.log('got getGroupContacts 2');
                      var convos = Array.from(results.rows);
                      convoObjs=Array.from(results.rows);
            
                      for(var i=0;i< convos.length;i++){
                        //console.log(convo.id);
                        
                        var aList=new Promise((res,rej)=>{
        
                          try {
                            pool.query('SELECT Id,sfid,isAttachment__c,AttBody__c,AttBodyEx__c,AttBodyEx2__c,MessageBody__c,Timestamp__c,Type__c,ZipwhipConvoObj__c,Sent_By__c,Account__c FROM salesforce.ZipwhipConvoMessageItem__c WHERE ZipwhipConvoObj__c = \''+convos[i].sfid+'\' ORDER BY Timestamp__c ASC;', (error, results2) => {
                              if (error) {
                                //console.log(results);
                                console.log('getGroupContacts2: ' +error);
                                rej(error);
                              }else{
                              
                                //var convoObj={id:convos[i].id,sfid:convos[i].sfid,messsage:Array.from(results2.rows)};
                                //console.log('got getGroupContacts 3');  
                                res(Array.from(results2.rows));
                
                              }
                            });
                          } catch (error) {
                            console.log('asdfasdfsdfasdf 6' +error);
                          }
                          //console.log('SELECT Id,sfid,isAttachment__c,AttBody__c,MessageBody__c,Timestamp__c,Type__c,ZipwhipConvoObj__c FROM salesforce.ZipwhipConvoMessageItem__c WHERE ZipwhipConvoObj__c = \''+convos[i].sfid+'\';');
                          
                        }).catch(error =>aList=[]);
                        pList.push(aList);
                      }
        
                      Promise.all(pList).then((values) => {
            
            
                        for(var conversation of convoObjs){
                          var arr=[];
                          for(var messages of values){
            
                            for(var message of Array.from(messages)){
                              if(message.zipwhipconvoobj__c==conversation.sfid){
                                var acc = (session==process.env.STAFFING_SESSION)?'Staffing':null;
                                
                                if(message.isattachment__c){
      
                                  if(message.attbody__c!=undefined||message.attbody__c!=null){
                                    message.attbody__c=String(message.attbody__c).replace(/(<p>)*(<\/p>)*(<br>)*(\d{4}-\d{2}-\d{2}([^]*):\s)*/g,'');
      
                                  } 
                                  if(message.attbodyex__c!=undefined||message.attbodyex__c!=null){
                                    message.attbodyex__c=String(message.attbodyex__c).replace(/(<p>)*(<\/p>)*(<br>)*(\d{4}-\d{2}-\d{2}([^]*):\s)*/g,'');
                                    message.attbody__c+=message.attbodyex__c;
              
                                  } 
                                  if(message.attbodyex2__c!=undefined||message.attbodyex2__c!=null){
      
                                    message.attbody__c+=message.attbodyex2__c;
      
                                  } 
                                }
  
                                if(message.timestamp__c!=undefined||message.timestamp__c!=null){
      
                                  var d='';
                                  d=new Date(Date.parse(String(message.timestamp__c)));
                                  d.setHours(d.getHours() - 5);
                                  d=d.toLocaleString('en-US', { month:'short',day:'numeric',year:'numeric', hour: 'numeric',minute: 'numeric', hour12: true });
                                  message.timestamp__c=d;
  
                                }
                                if(message.account__c==acc){
                                  arr.push(message);
                                }
      
                              }
                            }
                          }
            
                          var firstName='';
                          var lastName='';
                          var lastRepliedName='';
                          var grpName='';
            
                          for(var contact of contactArr){
                            if(contact.mobileNumber==conversation.phone__c){
                              firstName=contact.firstName;
                              lastName=contact.lastName;
                              grpName=contact.grpName;
                              break;
                            }
                          }
        
                          
        
                          conversation.grpName=grpName;
                          conversation.messages=arr;
                          conversation.firstName=firstName;
                          conversation.lastName=lastName;
                          conversation.lastMessage=(arr.length!=0)?arr[(arr.length-1)].messagebody__c:'';
        
                          if(arr.length!=0){
                            lastRepliedName = (arr[(arr.length-1)].type__c=='Sender')?'KT BLACK':(firstName + ' ' +lastName);
                          }
                          conversation.lastRepliedByName=lastRepliedName;
                          var d='';
                          if(arr.length!=0){
                            d=new Date(Date.parse(String(arr[(arr.length-1)].timestamp__c)));
                            d.setHours(d.getHours() - 5);
                            d=d.toLocaleString('en-US', { month:'short',day:'numeric',year:'numeric', hour: 'numeric',minute: 'numeric', hour12: true });
  
                          }
                          //d.setHours(d.getHours-3);
                          conversation.lastRepliedByDT=(arr.length!=0)?d:'';
                          conversation.numUnreadMessages=0;
                          conversation.phone=conversation.phone__c;
            
            
                        }
      
                        //console.log('got getGroupContacts 4');
            
                        res1(convoObjs);
                        
                      });
                    }
                  });
                }else{
                  console.log('NO NUMBERS');
      
                  res1(convoObjs);
    
                }
                
              }).then(data=>{
  
                if(!broadcast){
                  io.to(socket.id).emit('update',{convoList:data});
  
                }else{
                  io.emit('update',{convoList:data});
  
                }
                
              });
            } catch (error) {
              
              console.log('getGRoupContacts: '+error);
            }
          }
          
          
      
        },(rejected)=>{
          if(rejected!==undefined){
            console.error('Rejected Amount: '+rejected.length); // Error!

          }
        });
      }else{
        //res.status(200);
      }
      
    } catch (error) {

      console.log('getGRoupContacts: '+error);
    }

    //console.log('OUT CONVOS');

  });

  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on('clientError', (err, socket) => {
    console.error(err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  socket.on('error', function () {
    
    console.log('SERVER :: error');
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    
  });

  socket.on('timeout', function () {
    console.log('SERVER :: error');
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });
  /*
  server.on('clientError', (err, socket) => {
    console.error('clientError:'+err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });*/
  

});

function savePost (post, cb) {
  setTimeout(function () {
    cb(null, ((Math.random() * 40000) >>> 0))
  }, 31000);
}

async function getAttData(fingerprint,session){
  console.log('getAttData');
  /*getconvoList - https://api.zipwhip.com/conversation/get
      filter by id
        get messageId
          messageAttList with messageId - https://api.zipwhip.com/messageAttachment/list
            get storagekey
              get img - https://api.zipwhip.com/hostedContent/get
        */
  console.log(fingerprint);
  console.log(session);
  return new Promise((resolve, reject) => {
    var options = {
      'method': 'POST',
      'url': 'https://api.zipwhip.com/conversation/get',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        'session': session,
        'fingerprint': fingerprint
      }
    };
  
    try {
      request(options, function (error, response) {
        if (error){
          console.log('asdfasdfsdfasdf 7' +error);
          //res.status(500).json(error);
          reject(error);
        }else{
    
          var parsed='';

          try {
            parsed = JSON.parse(response.body);
          } catch (e) {
            // Oh well, but whatever...
            //console.log('parsed error: '+e);

          }
          if(parsed!=''){
            if(JSON.parse(response.body).response !=null||JSON.parse(response.body).response!=undefined){

              var msgId='';
              
              if(JSON.parse(response.body).response.messages!=null||JSON.parse(response.body).response.messages!=undefined){
                msgId = JSON.parse(response.body).response.messages[0].id;
              }
              
    
              console.log(msgId);
              var options2 = {
                'method': 'POST',
                'url': 'https://api.zipwhip.com/messageAttachment/list',
                'headers': {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                  'session': session,
                  'messageId': msgId
                }
              };
            
              try {
                request(options2, function (error, response) {
                  if (error){
                    console.log('getAttData: '+error);
                    //res.status(500).json(error);
                  }else{
                    
                    var storageKey='';
                    if(JSON.parse(response.body).response!=null||JSON.parse(response.body).response!=undefined){
                      //console.log(JSON.parse(response.body).response);

                      if(Array.isArray(JSON.parse(response.body).response)){

                        //console.log(Array.of(JSON.parse(response.body).response)[0].length);

                        var ao=Array.of(JSON.parse(response.body).response)[0];

                        for(var imgArr=0;imgArr< ao.length;imgArr++){

                          var mimeType=ao[imgArr].mimeType;
                          //console.log('MIMETYPE: '+mimeType);
                          if(String(mimeType).includes('image')){
                            storageKey = ao[imgArr].storageKey;
                          }
                        }
                        
                      }
                      
                    }
                    
      
                    var conn = new jsforce.Connection({
                      // you can change loginUrl to connect to sandbox or prerelease env.
                      loginUrl : 'https://login.salesforce.com'
                    });
                    conn.login(process.env.USER,process.env.PASSWORD, function(err, userInfo) {
                      if (err) { return console.error(err); }
  
                        var body = { method: "convertImageToBase64",
                          params: {"session":session,"storageKey":storageKey},
                          body: ''};
        
                        conn.apex.post("/api/api_POST", body, function(err, res2) {
              
                          if (err) { 
                            
                            console.error(err);
                            reject(error);
                          }else{ 
                            
                            resolve(res2);
  
                          }
                  
                        });
                    });
  
                  }
                });
              }catch(error){
                reject(error);
              }
            }
          }
        }
        
      });
    } catch (error) {
      reject(error);
    }
  });

}

function resolveAfter10Seconds(nextId,message,updateClient,sendType,accountName) {
  return new Promise(resolve => {
    setTimeout(() => {

      pool.query('SELECT sfid,Id,Name,Phone__c FROM salesforce.ZipwhipConvoObj__c WHERE id=\''+nextId+'\';',(error,results)=>{
        if (error) {
          console.log('2: ' +error);
        }else{
          console.log('2t: ' +JSON.stringify(results));
          var newConvoObj = results.rows[0];
          console.log(JSON.stringify(newConvoObj));
          
          if(message.hasAttachment){
              //att=getContactAtt(JSON.serialize(message)).attData;
              //att=getAttFromUrl(message.attData);
              console.log('attbody_c length: '+String(message.AttBody__c).length);
          }

          console.log('attbody_c length: '+String(message.AttBody__c).length);


          if(sendType===undefined||sendType==null||sendType==''){
            if(message.carrier==''||message.carrier==null||message.carrier==undefined){
              sendType='Sender';
            }else{
              sendType='Receiver';
            }
          }
          

          var bod=String(message.body).replace(/(\')*/g, "");
          
          console.log(bod);
          console.log(JSON.stringify(message));
          console.log(newConvoObj.sfid);
          console.log(sendType);
          console.log(accountName);
          console.log(updateClient);

          if(newConvoObj.sfid!=undefined||newConvoObj.sfid != null){
            
            pool.query('INSERT INTO salesforce.ZipwhipConvoMessageItem__c(AttBody__c,AttBodyEx__c,AttBodyEx2__c,Name,isAttachment__c,MessageBody__c,Timestamp__c,ZipwhipConvoObj__c,Type__c,Sent_By__c,Account__c) VALUES (\''+message.attData+'\',\''+message.attDataEx+'\',\''+message.attDataEx2+'\',\''+message.id+'\','+message.hasAttachment+',\''+bod+'\',\''+message.dateCreated+'\',\''+newConvoObj.sfid+'\',\''+sendType+'\',\''+message.sentBy+'\',\''+accountName+'\');', (error, results) => {
              if (error) {
                console.log('3: ' +error);
              }else{
                resolve('3: '+JSON.stringify(results));

              }
            });
          }else{
            console.log('newConvoObj SFID FAIL');
          }
        }
      });
    }, 20000);
  }).catch(error=>console.log('asyncCreateMessageItem error: '+error));
}

async function asyncCreateMessageItem(nextId,message,updateClient,sendType,accountName) {
  
  console.log('calling');
  const result = await resolveAfter10Seconds(nextId,message,updateClient,sendType,accountName);

  if(updateClient){
    setTimeout(() => {
      io.emit('clientUpdate');
    }, 3000);
  }
  console.log('asyncCreateMessageItem result: '+result);
  // expected output: "resolved"
}

function updateConvoObj(cont,message,mgMsg,sendType,sessionKey,updateClient){
  //Create lead convoObj upon receiving message for lead without existing convoObj
  //Create lead convoObj upon sending message for lead without existing convoObj


  var phone=String(cont.phone.replace(/(\()*(\))*(\-)*(\s)*(\+1)*(\.)*/g,'')).toString();
  var accountName = (sessionKey!=process.env.MAJOR_SESSION)?'Staffing':'';
  console.log('updateConvoObj');
  console.log('passed cont: '+JSON.stringify(cont));
  console.log('SENDTYPE: '+sendType);

  try {
    pool.query('SELECT sfid,Id,Name,Phone__c FROM salesforce.ZipwhipConvoObj__c WHERE Phone__c = \''+phone+'\' OR Phone__c = \''+phone+'\';', (error, results) => {
      if (error) {
        //console.log(results);
        console.log('1: ' +error);
      }else{
  
        var convos=results.rows;
  
        console.log('convos length: '+convos.length);
        try{
          if(convos.length==0){
            if(cont.firstName===undefined){
              cont.firstName='';
            }
            if(cont.lastName===undefined){
              cont.lastName='';
            }
  
      
            console.log('INSERT INTO salesforce.ZipwhipConvoObj__c(FirstName__c,LastName__c,Name,Phone__c) VALUES ("'+cont.firstName+'","'+cont.lastName+'","'+phone+'","'+phone+'");');
            pool.query('INSERT INTO salesforce.ZipwhipConvoObj__c(FirstName__c,LastName__c,Name,Phone__c) VALUES (\''+cont.firstName+'\',\''+cont.lastName+'\',\''+phone+'\',\''+phone+'\') RETURNING id;', (error, results) => {
              if (error) {
                console.log('2: ' +error);
              }else{
                console.log('2: ' +JSON.stringify(results));
  
                var nextId;
                var convoObj ={};
                if(results!=null||results!=undefined){
                  try{
                    var parsed='';

                    try {
                      parsed = JSON.parse(JSON.stringify(results));
                    } catch (e) {
                      // Oh well, but whatever...
                      //console.log('parsed error: '+e);

                    }
                    if(parsed!=''){
                      JSON.stringify(JSON.parse(JSON.stringify(results)), function (key, value) {
                        if(value!=='null'){
                          nextId=value.rows[0].id;
                          console.log('NEXTID: '+nextId);

                          asyncCreateMessageItem(nextId,message,updateClient,sendType,accountName);
                        }
                        
                      });
                    }else{
                      console.log('parsed empty');
                    }
                    
                  }catch(e){
                    console.log('updateConvo Failed Parse:'+results);
                  }
                  
                }

                //updateConvoObjP2(phone,convoObj,'85aadbc8-03fe-4f7b-add1-3ba888758e1c:401931107');
              }
            }); 
          }else if(convos.length!=0 && mgMsg==true){
              phone = String(convos[0].phone__c.replace(/(\()*(\))*(\-)*(\s)*(\+1)*(\.)*/g,'')).toString();

              var convoObj ={};
              var parsed='';

              try {
                parsed = JSON.parse(JSON.stringify(results));
              } catch (e) {
                // Oh well, but whatever...
                //console.log('parsed error: '+e);

              }
              if(parsed!=''){
                JSON.stringify(JSON.parse(JSON.stringify(results)), function (key, value) {
                  if(value!=='null'){
                    convoObj=value.rows[0];
                  }
                  
                });
              }

              //console.log(convoObj);
              if(convoObj!=null){
                //updateConvoObjP2(phone,convoObj,'9fb607f9-4a1e-420d-919c-98304ba40eb6:404370107');//changeme
              }
              
              //updateConvoObjP2(phone,convoObj,'85aadbc8-03fe-4f7b-add1-3ba888758e1c:401931107');
          }else{
              var newConvoObj = convos[0];
              //console.log(newConvoObj);
              
              if(message.hasAttachment){
                  //att=getContactAtt(JSON.serialize(message)).attData;
                  //att=getAttFromUrl(message.attData);
                  console.log('attbody_c length: '+String(message.attData).length);
              }
              
              var theDate = new Date(message.dateCreated);
              dateString = theDate.toUTCString();
              //console.log('Created: '+dateString);
              //console.log('Created: '+message.dateCreated);
              var type='';
              if(message.carrier==''||message.carrier==null||message.carrier==undefined){
                type='Sender';
              }else{
                type='Receiver';
              }
  
              var bod=String(message.body).replace(/(\')*/g, "");

              
  
              if(newConvoObj.sfid!=undefined||newConvoObj.sfid != null){
                console.log('INSERT INTO salesforce.ZipwhipConvoMessageItem__c(AttBody__c,AttBodyEx__c,AttBodyEx2__c,Name,isAttachment__c,MessageBody__c,Timestamp__c,ZipwhipConvoObj__c,Type__c,Sent_By__c,Account__c) VALUES (\''+message.attData+'\',\''+message.attDataEx+'\',\''+message.attDataEx2+'\',\''+message.id+'\','+message.hasAttachment+',\''+bod+'\',\''+message.dateCreated+'\',\''+newConvoObj.sfid+'\',\''+sendType+'\',\''+message.sentBy+'\',\''+accountName+'\');');
                pool.query('INSERT INTO salesforce.ZipwhipConvoMessageItem__c(AttBody__c,AttBodyEx__c,AttBodyEx2__c,Name,isAttachment__c,MessageBody__c,Timestamp__c,ZipwhipConvoObj__c,Type__c,Sent_By__c,Account__c) VALUES (\''+message.attData+'\',\''+message.attDataEx+'\',\''+message.attDataEx2+'\',\''+message.id+'\','+message.hasAttachment+',\''+bod+'\',\''+message.dateCreated+'\',\''+newConvoObj.sfid+'\',\''+sendType+'\',\''+message.sentBy+'\',\''+accountName+'\');', (error, results) => {
                  if (error) {
                    console.log('3: ' +error);
                  }else{
                    //socket.emit("update");mememe

                    if(updateClient){
                      io.emit('clientUpdate');
                    }
                    console.log('insert ZipwhipConvoMessageItem__c succ');
                  }
                });
              }
              
          }
        }catch(e){
          console.log('updateConvoObj: '+e);
        }
      }
    
    });
  } catch (error) {
    console.log('updateConvoObj: '+error);
  }

};

function sendCreateContactMessage(phone,firstName,lastName,session,division,user,unit,dpt,updateAll,next){

  console.log('sendCreateContactMessage');
  var options = {
    'method': 'POST',
    'url': 'https://api.zipwhip.com/contact/save',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      'session': session,
      'mobileNumber': phone,
      'firstName': firstName,
      'lastName': lastName
    }
  };

  try {
    request(options, function (error, response) {
      if (error){
        console.log('asdfasdfsdfasdf 8' +error);
        //res.status(500).json(error);
      }else{
        
        addContactToGroup(phone,session,division,user,unit,dpt,updateAll,next);
        console.log('sendCreateContactMessage Success');
        //res.status(200).json('Success');
      }
      
    });
  } catch (error) {
    console.log('asdfasdfsdfasdf 9' +error);
  }

  

}

async function getGroupContacts(division,session,user,unit,dpt){

  console.log('getGroupContacts');
  var contacts=[];
  var pro=[];
  console.log('getGroupContacts: Division: '+division+ ' Session: '+session+'USER: '+user+ ' DPT: '+dpt);

  return new Promise((resolve, reject) => {
    
    getGroupIds(division,session,user,unit,dpt).then((groups)=>{

      if(groups!=null){
        for(var grp of Array.from(groups)){

          if(grp!=undefined){
            //console.log(grp);
            var options = {
              'method': 'POST',
              'url': 'https://api.zipwhip.com/group/members',
              'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              form: {
                'session': session,
                'group': grp.address,
              }
            };

            pro.push(new Promise((res, rej) => {

              var displayName=grp.displayName;
              request(options, function (error, response) {
                if (error){
                  rej(error);
                  console.log('getGroupContacts req: '+error);

                }else{
                  var cont =[];

                  try {

                    var parsed='';

                    try {
                      parsed = JSON.parse(response.body);
                    } catch (e) {
                      // Oh well, but whatever...
                      //console.log('parsed error: '+e);
                      rej(error);
                    }

                    if(parsed!=''){
                      if(JSON.parse(response.body).response!=undefined){
                        Array.from(JSON.parse(response.body).response).forEach(ct=>{
                          ct.grpName = displayName;
                          cont.push(ct);
                        });
                      }

                      res(cont);
                    }
                    
                  } catch (error1) {
                    rej(error1);
                    console.log('getGroupContacts: '+error1);
                  }

                  
                }
              }).on('error',(e)=>{
                rej(e);
                console.log('getGroupContacts req push: '+e);
              });
            }).catch(ex=>{
              rej(ex);
              console.log('getGroupContacts req outer prom: '+ex);
            }));
          }
          
        }

        Promise.all(pro).then((values) => {

          for(var a of values){
            for(var co of a){
              contacts.push(co);
            }
          }

          resolve(contacts);
        }).catch(err=>reject(err));
      }else{
        console.log('res error: getGROUPIDS'+groups);
        resolve(contacts);
      }
    }); 
  }).catch(err=>{
    console.log('getGroupContacts caught '+err);
  });


}

function removeContactFromGroup(phone,session,division,user,unit,dpt){

  console.log('removeContactFromGroup: Division: '+division+ ' Session: '+session+' USER: '+user+ ' DPT: '+dpt+' PHONE: '+phone+' UNIT:'+unit);

  getGroupIds(division,session,user,unit,1).then((groups)=>{

    console.log('next:');

    if(groups!==null){

        console.log('has groups'+Array.from(groups).length);
        for(var grp of Array.from(groups)){

          if(grp!=undefined){
            var options = {
              'method': 'POST',
              'url': 'https://api.zipwhip.com/group/removeMember',
              'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              form: {
                'session': session,
                'group': grp.address,
                'member':phone
              }
            };
  
            request(options, function (error, response) {
              if (error){
               
                console.log('asdfasdfsdfasdf 11' +error);
  
              }else{
                io.emit("update",{convoList:phone,remove:true});
                console.log('Deleted Contact');
              }
            });
          }
          
        }
    }else{
      console.log('NO GROUPS');
    }
  });
}

function addContactToGroup(phone,session,division,user,unit,dpt,updateAll,next){

  try {

    var exists;
    console.log('addContactToGroup: Division: '+division+ ' Session: '+session+'USER: '+user+ ' DPT: '+dpt);

    getGroupIds(division,session,user,unit,1).then((groups)=>{

      var selectedGroup = null;

      /////////////////////////////////////////////////////////////

      var pro=[];

      if(groups!==null){
          for(var grp of Array.from(groups)){
            
            if(grp!=undefined){
              //console.log(grp);
              var options = {
                'method': 'POST',
                'url': 'https://api.zipwhip.com/group/members',
                'headers': {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                  'session': session,
                  'group': grp.address,
                }
              };

              pro.push(new Promise((res, rej) => {

                var displayName=grp.displayName;
                var address=grp.address;

                try {
                  request(options, function (error, response) {
                  
                    if (error){

                      console.log(error);
                      rej(error);
                      //throw new Error(error);
                      //next(error);
                      //return;
                    }else{
                      var cont =[];
                      try{
    
                        var parsed='';
    
                        try {
                          parsed = JSON.parse(response.body);
                        } catch (e) {
                          // Oh well, but whatever...
                          //console.log('parsed error: '+e);
    
                        }
                        if(parsed!=''){
                          if(JSON.parse(response.body).response!==undefined){
                            Array.from(JSON.parse(response.body).response).forEach(ct=>{
                              ct.grpName = displayName;
                              ct.address= address;
                              cont.push(ct);
                            });
                          }else{
                            console.log('addtogroup body null');
                          }
                        }
    
                        res(cont);
                      }catch(je){
                        console.log('addtogroup error:'+je);
                        //next(je)
                      }
                    }
                  }).on('error', function(err) {
                    //next(err);
                    console.log('addContactToGroup req error caught: '+err);

                  });
                } catch (error) {
                  //next(error);
                  console.log(error)
                }


              }).catch(err=>console.log('addContactToGroup pro push:' +err)));
            }
            
          }

          Promise.all(pro).then((contactGrps) => {

            for(var g of groups){
              //console.log(g);
              if(contactGrps!=undefined && g !=undefined){

                var gps = contactGrps.find(cg=>{
                  if(cg!=undefined){
                    if(cg[0]!=undefined){
                      if(cg[0].address!=undefined&&g.address!=undefined){
                        if(cg[0].address==g.address){
                          return cg;
                        }
                      }
                    }
                  }
                  
                  
                });
                var conCount= (gps!=undefined)?(contactGrps.find(cg=>cg[0].address==g.address)).length:0;
                //console.log('count: '+conCount);
                if(conCount!=undefined){
                  if(conCount<100){
                    selectedGroup=g;
                    break;
                  }
                }
              }
            }
            //console.log(selectedGroup);

            if(unit!=undefined||unit!=null){
              unit = (String(unit).length!=0)?String(unit):user;
            }
        
            if(selectedGroup==null){
              
              var options = {
                'method': 'POST',
                'url': 'https://api.zipwhip.com/group/save',
                'headers': {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                  'session': session,
                  'name': 'Admin_'+unit+'_'+division +'_'+user+'_'+Date.now(),
                  'member': phone
                }
              };
            
              try {
                request(options, function (error, response) {
                  if (error){
                    console.log('asdfasdfsdfasdf 13' +error);
                  }else{
                    //String testResp='{"response":{"address":"ad:f3455","firstName":"firstName"}}';
                    
                    if(updateAll){
                      io.emit("update",{convoList:phone,add:true});
                    }
                    console.log('success save group');
                  }
                  
                });
              } catch (error) {
                console.log('asdfasdfsdfasdf 14' +error);
              }
              
        
            }else{
                
              var options = {
                'method': 'POST',
                'url': 'https://api.zipwhip.com/group/addMember',
                'headers': {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                  'session': session,
                  'group': selectedGroup.address,
                  'mobileNumber': phone
                }
              };
        
              try {
                request(options, function (error, response) {
                  if (error){
                    console.log('asdfasdfsdfasdf 15' +error);
                  }else{
                    //String testResp='{"response":{"address":"ad:f3455","firstName":"firstName"}}';
          
                    if(updateAll){
                      io.emit("update",{convoList:phone,add:true});
                    }
                    
                    console.log('success save group');
                  }
                  
                });
              } catch (error) {
                console.log('asdfasdfsdfasdf 26' +error);
              }
        
            }
          }).catch(error=>console.log('addContactToGroup pro all: '+error));
          
      }

      
        
      /////////////////////////////////////////////////////////////////////////////////////

      
    });
  } catch (error) {
    console.log('big catch');
    //next(error);
  }
        
}

function getGroupViaContact(contact,session){

  //get list of groups on account
  console.log('getGroupViaContact');
  var users=[];

  var pro=[];
  
  var options = {
    'method': 'POST',
    'url': 'https://api.zipwhip.com/group/list',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      'session': session
    }
  };

  try {
    return new Promise((resolve, reject) => {
      request(options, function (error, response) {
        if (error){
          resolve(null);
        }else{
    
          try{

            var parsed='';

            try {
              parsed = JSON.parse(response.body);
            } catch (e) {
              // Oh well, but whatever...
              console.log('getGroupViaContact parsed error 1: '+e);

            }
            if(parsed!=''){
              var grps = JSON.parse(response.body).response;

              if(grps!=undefined||grps!=null){
                for(var grp of Array.from(grps)){
          
                  //console.log(grp);
                  var options = {
                    'method': 'POST',
                    'url': 'https://api.zipwhip.com/group/members',
                    'headers': {
                      'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: {
                      'session': session,
                      'group': grp.device.address,
                    }
                  };
        
                  pro.push(new Promise((res, rej) => {
        
                    
                    var displayName=grp.device.displayName;

                    request(options, function (error, response) {
                      if (error){
                        rej(error);
                        console.log('asdfasdfsdfasdf 66' +error);
                        //console.log(error);
          
                      }else{

                        var tempUsers =[];

                        var parsed='';

                        try {
                          parsed = JSON.parse(response.body);
                        } catch (e) {
                          // Oh well, but whatever...
                          //console.log('getGroupViaContact parsed error 2: '+e);

                        }

                        if(parsed!=''){
                          if(JSON.parse(response.body).response!=undefined){
                            Array.from(JSON.parse(response.body).response).forEach(ct=>{
                              ct.grpName = displayName;
    
                              if(ct.mobileNumber==contact){
                                var user = String(displayName).split('_')[3];
                                
                                tempUsers.push(user);
                              }
                              
                            });
                          }
                        }
                        
                        res(tempUsers);
                      }
                    }).on('error',(e)=>{
                      console.log('asa error first caught'+e);
                    });
                  }).catch(e=>console.log('asa error caught'+e)));
        
                }
        
                
                Promise.all(pro).then((values) => {
        
                  for(var a of values){
                    for(var co of a){
                      users.push(co);
                    }
                  }
  
                  resolve(users.filter((c, index) => {
                    console.log('C: '+c);
                    console.log('Idx: '+index);
                    if(c!='')return users.indexOf(c) === index;
                  }));
                }).catch(e=>console.log('getGroupViaContact pro all: '+e));
              }
            }

          }catch(error){
            console.log('getGroupViaContact: '+error);
          }
        }
      });
    });
    
  }catch(error){
    console.log('getGroupViaContact:'+error);
  }
  
}

function getGroupIds(grp,session,user,unit,dpt){

  if(grp!=null||grp!=undefined){
      if(grp.length==0){
          grp=null;
      }
  }

  var groups= [];

  var options = {
    'method': 'POST',
    'url': 'https://api.zipwhip.com/group/list',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      'session': session
    }
  };

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (error){
        resolve(null);
        
        //response.status(500).json(error);
      }else{
  
        try{

          var parsed='';

          try {
            parsed = JSON.parse(response.body);
          } catch (e) {
            // Oh well, but whatever...
            //console.log('parsed error: '+e);

          }
          if(parsed!=''){

            var grps = JSON.parse(response.body).response;

            if(grps!=null||grps!=undefined){
              for(var i=0;i<grps.length;i++){
  
  
                //break up displayName
                if(unit==''||unit==undefined||unit==null){
                  unit = user;
                }
  
                if(grp==''||grp==undefined||grp==null){
                  grp = 'All';
                }
                var grpNameArr = String(grps[i].device.displayName).split('_');
                var idx=(dpt!=null||dpt!=undefined)?Number.parseInt(dpt):null;
                var grpComArr = ['Admin',unit,grp,user,dpt];
                
                //console.log(unit + ' '+grp+' '+grpComArr);
                //console.log(grpNameArr);
                //console.log(grpComArr);
  
                if(idx!=null){
                  if(grpNameArr.length==grpComArr.length){
  
                    var matches=true;
  
                    for(var j=0;j<(5-idx);j++){
                      //console.log('compare idx '+(5-idx) + ' '+grpNameArr[j]+' to ' + grpComArr[j])
  
                      if(grpComArr[j]!='All'){
                        if(grpNameArr[j]!=grpComArr[j]){
                          matches=false;
                        }
                      }
                      
                    }
  
                    if(matches){
                      groups.push(grps[i].device);
                      //console.log('Group added');
                    }
                  }
                }
  /*
                if(grp.includes('Champions')){
                  //console.log(grps[i].displayName+ ' TO '+grp);
                  if(grps[i].displayName.includes('Champions')||grps[i].displayName.includes('Dream')){
    
                    groups.push(grps[i]);
                  }
                }else{
                  //console.log(grps[i].displayName+ ' TO '+grp);
                  if(grps[i].displayName.includes(grp)){
                    groups.push(grps[i]);
                  }
                }*/
      
              }
            }
  
          }
          
          resolve(groups);
        
        }catch(e){
          console.log('getGroupIds: '+e);
        }
      }
      
    });
  });

}

app.use((err, req, res, next) => {

 
  console.log('12 ERROR '+err.message);
  console.error(err.stack);

})

process.on('uncaughtException', function(err){
  console.error((new Date).toUTCString()+ ' uncaughtException: ',err.message);
  console.error(err.stack);
  process.exit(1);
});



