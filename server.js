const PORT = process.env.PORT || 3000;
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const app = express();
const cors = require('cors');
var fs = require('fs');
//const ngrok = require('ngrok');
var request= require('request');
var jsforce = require('jsforce');
const { createServer } = require("http");
const { Server } = require("socket.io");


var serviceNumbers=new Map([
  ['+18063753738',['34640','Insurance Sales']],
  ['+18774754553',['34666','Zipwhip']],
  ['+18063040609',['34730','Sales']],
  ['+18065421633',['34731','Staffing Direct Hire']],
  ['+18066066512',['34732','HelpDesk Sales']],
  ['+18065313278',['34733','Fitness Sales']],
  ['+18066022690',['34734','Recruiting']]
]);
/*
(async function() {
  const url = await ngrok.connect(5000);
  console.log(url);
})();*/

const httpServer = createServer(app);

httpServer.keepAliveTimeout = 61 * 1000;
httpServer.headersTimeout = 65 * 1000;
httpServer.setTimeout(200000);
httpServer.timeout = 1000 * 60 * 5; 

const io = new Server(httpServer, {});
httpServer.listen(process.env.PORT);

app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({extended: true,limit: '100mb'}));
app.use(cors());
app.use(express.static('./dist/my-first-project'));
var sockets = [];

//app.use(authentication);// turn on after testing

////////////////////////////////////////////////PATHS///////////////////////////////////////////////////

app.get('/', function(req, res) {
  res.sendFile('index.html', {root: 'dist/my-first-project/'});

});

app.post('/sendSMS', function(req, res){

  /*obj.put('service',service);
    obj.put('phone',phone);
    obj.put('message',message);
    obj.put('contactName',firstName+'_'+lastName);
    obj.put('userId',userDetails.Id);*/

  console.log(req.body);
  //send message

  //create/update contact

  //add to user group

  //https://api.textrequest.com/api/v3/dashboards/121/contacts/8067906072/messages
  var options = {
    uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(req.body.service)[0]+'/contacts/'+req.body.phone+'/messages',
    method: 'POST',
    headers: {
      "x-api-key" : process.env.API_KEY,
      "Content-Type":"application/json"
    },
    json: {
      "body": req.body.message,
      "sender_name": req.body.userId
    }
  };
  
  request(options, function (error, response) {

    if (!error && response.statusCode == 200) {

      console.log('message sent');

      var name=String(req.body.contactName).split('_');
      var lName=(name.length>1)?name[1]:'';
      var fName=name[0];


      var con={phone_number: req.body.phone, first_name: fName, last_name: lName, display_name:fName+' '+lName};
      console.log('contact:'+JSON.stringify(con));

      var options2 = {
        uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(req.body.service)[0]+'/contacts/'+req.body.phone,
        method: 'POST',
        headers: {
          "x-api-key" : process.env.API_KEY,
          "Content-Type":"application/json",
          "accept":"application/json"
        },
        json:con
      };
      
      request(options2, function (error2, response4) {
        console.log(response4.body);
        if (!error2 && response4.statusCode == 200) {

          console.log('contact created')
          console.log(response4.body);
        }else{
          console.log(error2);
        }
        
      });
      /*
      var options = {
        uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(req.body.service)[0]+'/groups?page=0&page_size=100',
        method: 'GET',
        headers: {
          "x-api-key" : process.env.API_KEY,
          "Content-Type":"application/json"
        }
      };
      
      request(options, function (error, response) {
        if (!error && response.statusCode == 200) {

          var groups=JSON.parse(response.body).items;

          if(groups!==undefined){

            var group=groups.find(g=>String(g.name).includes(req.body.userId));

            if(group!==undefined){

              console.log('group found');

              var options = {
                uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(req.body.service)[0]+'/contacts/'+req.body.phone,
                method: 'GET',
                headers: {
                  "x-api-key" : process.env.API_KEY,
                  "Content-Type":"application/json"
                }
              };
              
              request(options, function (error, response) {
            
                if (!error && response.statusCode == 200) {

                  var arr=JSON.parse(response.body).groups;
                  var tags=JSON.parse(response.body).contact_tags;

                  console.log(arr);

                  if(arr.find(gr=>String(gr)===String(group.id))===undefined){

                    console.log('group not found');

                    arr.push(group.id);

                    var options = {
                 
                      uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(req.body.service)[0]+'/tags?page=0&page_size=100',
                      method: 'GET',
                      headers: {
                        "x-api-key" : process.env.API_KEY,
                        "Content-Type":"application/json",
                      }
                    };
                    
                    request(options, function (error, response) {
                      if (!error && response.statusCode == 200) {

                        var tagsFull=JSON.parse(response.body).items;

                        var result = tagsFull.find(tg => tg.tag === group.name);
                        if(result!==undefined){
                          tags.push(result.id);
                        }
                        
                        console.log(arr);
                        console.log(tags);

                        var b = JSON.parse(response.body);
                        b.groups=arr;
                        b.contact_tags=tags;

                        console.log(b.groups);
                        console.log(b.contact_tags);

                        var options2 = {
                          uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(req.body.service)[0]+'/contacts/'+req.body.phone,
                          method: 'POST',
                          headers: {
                            "x-api-key" : process.env.API_KEY,
                            "Content-Type":"application/json",
                            "accept":"application/json"
                          },
                          json:b
                        };
                        
                        request(options2, function (error2, response2) {
                          if (!error2 && response2.statusCode == 200) {
                            console.log(response2.body);
                          }else{
                            console.log(error2);
                          }
                          
                        });
                        
                      }else{
                        console.log(error);
                      }
                      
                    });

                  }else{
                    console.log('group found');
                  }

                }else{
                  console.log(error);
                }
              });
              
            }else{
              console.log('group not found');
              createGroup(req.body);
            }
          }else{

            console.log('groups not found');
            createGroup(req.body);
          }
   
        }
      });*/
    }
  });
     
  res.end();
});

app.post('/webhooks/msg_received', function(req, res){

  console.log(req.body);

  var dashNumber='+'+req.body.yourPhoneNumber.phoneNumber;
  var message=req.body.conversation.message;
  var author=req.body.conversation.consumerPhoneNumber;

  console.log(dashNumber);
  var options = {
    uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(dashNumber)[0]+'/groups?page=0&page_size=100',
    method: 'GET',
    headers: {
      "x-api-key" : process.env.API_KEY,
      "Content-Type":"application/json"
    }
  };
  
  request(options, function (error, response) {
    if (!error && response.statusCode == 200) {
      var groups=JSON.parse(response.body).items;

      var userGroup=groups.find(grp=>grp.name.includes('DashUsers'));

      if(userGroup!==undefined){

        console.log(userGroup);
        var id=userGroup.id;

        var options = {
          uri: 'https://api.textrequest.com/api/v3/dashboards/34640/contacts?groups='+id+'&page=0&page_size=100',
          method: 'GET',
          headers: {
            "x-api-key" : process.env.API_KEY,
            "Content-Type":"application/json"
          }
        };
        
        request(options, function (error, response) {
          if (!error && response.statusCode == 200) {
            var users=[];

            var items = Array.from(JSON.parse(response.body).items);
            items.forEach(item=>{
              users.push(String(JSON.parse(JSON.stringify(item)).display_name).split('_')[1]);
            });

            console.log(users);

            var messageObj={Body:message,Author:author};

            sendNotificationToSF(users,messageObj);
          }
        });

      }
          
    }
  });

  res.end();
});

app.post('/webhooks/contact_updated', function(req, res){

  console.log(req.body);

  res.end();
});

app.post('/deleteGroups', function(req, res){

  console.log('good');

  var options = {
    uri: 'https://api.textrequest.com/api/v3/dashboards/34666/groups/?page=0&page_size=1000',
    method: 'GET',
    headers: {
      "x-api-key" : process.env.API_KEY,
      "Content-Type":"application/json"
    }
  };
  
  request(options, function (error, response) {

    if (response.statusCode == 200) {

      console.log('good');
      var arr=JSON.parse(response.body).items;

      for(var i=0;i<arr.length;i++){

        var id=String(arr[i].id).trim();

        var options2 = {
          uri: 'https://api.textrequest.com/api/v3/dashboards/34666/groups/'+id,
          method: 'DELETE',
          headers: {
            "x-api-key" : process.env.API_KEY,
            "accept":"*/*"
          }
        };
        
        request(options2, function (error2, response4) {
  
          if (response4.statusCode == 200) {
  
            console.log('group'+id+' deleted');

          }else{
            console.log(response4.body);
          }
          
        });
      }
      
      
    }else{
      console.log(response.body);
    }
  });
     
  res.end();
});

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

    var dashes=String(req.query.dashes).split(';');
    var user=req.query.user;
    var broadcast=req.query.broadcast;
    var cons=[];

    try {

    
      for(var dash of dashes){
        cons.push(getGroupContacts('+1'+dash,user,broadcast));

      }

      Promise.all(cons).then((values) => {


        var data=[];
        

        for(var con of values){
          for(var c of con){
            var contactObj={};
            var messageObjs=[];
            c.messages.forEach(message=>{
              var messageObj={messagebody__c:message.body,type__c:(String(message.message_direction)==='S')?'Sender':'Received',attbody__c:'',id:'',timestamp__c:''};
              messageObjs.push(messageObj);
            });
            
            contactObj.phone=c.phone;
            contactObj.messages=messageObjs;
            contactObj.firstName=c.firstName;
            contactObj.lastName=c.lastName;
            contactObj.lastMessage=c.lastMessage;
            contactObj.lastRepliedByName=c.firstName;
            contactObj.id=c.phone;
            contactObj.grpName="";
            contactObj.numUnreadMessages=0;

            data.push(contactObj);
          }
        }
        
        if(!broadcast){
          io.to(socket.id).emit('update',{convoList:data});

        }else{
          io.emit('update',{convoList:data});

        }
    
      }).catch(err=>console.log(err));


    } catch (error) {

      console.log('getGRoupContacts: '+error);
    }

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

});

function sendNotificationToSF(users,messageObj){

  try {
    var conn = new jsforce.Connection({loginUrl : 'https://test.salesforce.com'});
    conn.login(process.env.SBX_USER,process.env.SBX_PASSWORD, function(err, userInfo) {
        if (err) { 
            console.error(err); 
        }else{
            try {
            var body = { method: "twilioNotificationMgr",
                    params: {},
                    body: JSON.stringify({parts:users,msg:messageObj})};

            conn.apex.post("/api/api_POST", body, function(err, res2) {
            
                if (err) { 
                
                    console.error(err);
                }else{ 

                    console.log('succ');

                }
            });
            }catch(exception){
              console.log(exception);
            }
        }
    });
  } catch (error) {
    console.log(error);
  }
}

function createGroup(body){

  var options = {
    uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(body.service)[0]+'/groups',
    method: 'POST',
    headers: {
      "x-api-key" : process.env.API_KEY,
      "Content-Type":"application/json"
    },
    json: {
      "name": body.userId+'_Group'
    }
  };
  
  request(options, function (error, res) {

    if (!error && res.statusCode == 200) {

      var group=JSON.parse(JSON.stringify(res.body));

      console.log('group: '+group.name);

      var options = {
        uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(body.service)[0]+'/tags',
        method: 'POST',
        headers: {
          "x-api-key" : process.env.API_KEY,
          "Content-Type":"application/json"
        },
        json: {
          "tag_color": "#1EB1C4",
          "tag": group.name
        }
      };
      
      request(options, function (error, response) {
        if (!error && response.statusCode == 200) {
          console.log('group created tag created');

          var options = {
            uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(body.service)[0]+'/contacts/'+body.phone,
            method: 'GET',
            headers: {
              "x-api-key" : process.env.API_KEY,
              "Content-Type":"application/json"
            }
          };
          
          request(options, function (error, response2) {
        
            if (!error && response2.statusCode == 200) {

              var arr=JSON.parse(response2.body).groups;
              var tags=JSON.parse(response2.body).contact_tags;

              console.log(arr);

              if(arr.find(gr=>String(gr)===String(group.id))===undefined){

                console.log('group not found');

                arr.push(group.id);

                var options = {
             
                  uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(body.service)[0]+'/tags?page=0&page_size=100',
                  method: 'GET',
                  headers: {
                    "x-api-key" : process.env.API_KEY,
                    "Content-Type":"application/json",
                  }
                };
                
                request(options, function (error, response3) {
                  if (!error && response3.statusCode == 200) {

                    var tagsFull=JSON.parse(response3.body).items;

                    var result = tagsFull.find(tg => tg.tag === group.name);
                    if(result!==undefined){
                      tags.push(result.id);
                    }
                    
                    console.log(arr);
                    console.log(tags);

                    var b = JSON.parse(response3.body);
                    b.groups=arr;
                    b.contact_tags=tags;

                    console.log(b.groups);
                    console.log(b.contact_tags);

                    var options2 = {
                      uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(body.service)[0]+'/contacts/'+body.phone,
                      method: 'POST',
                      headers: {
                        "x-api-key" : process.env.API_KEY,
                        "Content-Type":"application/json",
                        "accept":"application/json"
                      },
                      json:b
                    };
                    
                    request(options2, function (error2, response4) {
                      if (!error2 && response4.statusCode == 200) {
                        console.log(response4.body);
                      }else{
                        console.log(error2);
                      }
                      
                    });
                    
                  }else{
                    console.log(error);
                  }
                  
                });

              }else{
                console.log('group found');
              }

            }else{
              console.log(error);
            }
          });
        }
      });
    }
  });
}

function authentication(req, res, next) {
  var authheader = req.headers.authorization;
  console.log(req.headers);

  if (!authheader) {
      var err = new Error('You are not authenticated!');
      res.setHeader('WWW-Authenticate', 'Basic');
      err.status = 401;
      return next(err)
  }

  var auth = new Buffer.from(authheader.split(' ')[1],
  'base64').toString().split(':');
  var user = auth[0];
  var pass = auth[1];

  if (user == process.env.SUSER && pass == process.env.SPASS) {

      // If Authorized user
      next();
  } else {
      var err = new Error('You are not authenticated!');
      res.setHeader('WWW-Authenticate', 'Basic');
      err.status = 401;
      return next(err);
  }

}


async function getGroupContacts(dash,user,broadcast){

  console.log(dash);
  return new Promise((resolve) => {

    var contacts=[];
    
    var contactOps = {
      uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(dash)[0]+'/contacts?page_size=1000&page=0',
      method: 'GET',
      headers: {
        "x-api-key" : process.env.API_KEY,
        "Content-Type":"application/json"
      }
    };

    request(contactOps, function (error, response) {

      var pro=[];

      if (!error && response.statusCode == 200) {
        
        var cons = JSON.parse(response.body).items;

        for(var contact of Array.from(cons)){

          pro.push(new Promise((res) => {

            var phone = contact.phone_number;
            var fName= contact.first_name;
            var lName = contact.last_name;
            var lMessage= contact.lastMessage;
    
            var convoOps = {
              uri: 'https://api.textrequest.com/api/v3/dashboards/'+serviceNumbers.get(dash)[0]+'/contacts/'+phone+'/messages',
              method: 'GET',
              headers: {
                "x-api-key" : process.env.API_KEY,
                "Content-Type":"application/json"
              }
            };

            request(convoOps, function (error, response2) {
        
              if (!error && response2.statusCode == 200) {
          
                var messages=[];
                var resMess=JSON.parse(response2.body).items;

                for(var message of resMess){
  
                  messages.push(message);
                }
                
      
                var nContact={lastMessage:lMessage,firstName:fName,lastName:lName,phone:phone,messages:messages};
            
                res(nContact);
                
              }else{
                console.log('error 2');
              }
            });
          }));
        
        }

        Promise.all(pro).then((values) => {

          for(var con of values){

            contacts.push(con);
          }
          resolve(contacts);
        }).catch(err=>console.log(err));
        
      }else{

        console.log('error 1');
      }

    });

  }).then(vals=>{
    return vals;

  });
}
