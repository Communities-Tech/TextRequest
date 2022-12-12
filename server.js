const PORT = process.env.PORT || 5000
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const app = express();
const cors = require('cors');
var server = app.listen(PORT);
var fs = require('fs');
const ngrok = require('ngrok');
var request= require('request');
var jsforce = require('jsforce');

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

app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({extended: true,limit: '100mb'}));
app.use(cors());
app.use(authentication);
////////////////////////////////////////////////PATHS///////////////////////////////////////////////////

app.get('/', function(req, res) {
  
  res.json('connected').status(200);
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

  var options = {
    uri: 'https://api.textrequest.com/api/v3/messages',
    method: 'POST',
    headers: {
      "x-api-key" : process.env.API_KEY,
      "Content-Type":"application/json"
    },
    json: {
      "from": req.body.service,
      "to": req.body.phone,
      "body": req.body.message,
      "sender_name": req.body.userId
    }
  };
  
  request(options, function (error, response) {
    if (!error && response.statusCode == 200) {
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

