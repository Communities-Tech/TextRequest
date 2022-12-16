'use strict';

var request = require('request');
const { parentPort, workerData } = require("worker_threads");

function sendCreateContactMessage(workerData){

    var phone,firstName,lastName,session,division,user,unit,dpt,updateAll;

    phone=workerData.reqCont;
    firstName=workerData.reqFirstName;
    lastName=workerData.reqLastName;
    session=workerData.session;
    division=workerData.reqAccount;
    user=workerData.reqUser;
    unit=workerData.reqUnit;
    dpt=workerData.reqDpt;
    updateAll=workerData.reqSocket;

    
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
   
  
          addContactToGroup(phone,session,division,user,unit,dpt,updateAll);
          console.log('sendCreateContactMessage Success');
          //res.status(200).json('Success');
        }
        
      });
    } catch (error) {
      console.log('asdfasdfsdfasdf 9' +error);
    }
  }

  function addContactToGroup(phone,session,division,user,unit,dpt,updateAll){

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
                        parentPort.postMessage({type:"update",obj:{convoList:phone,add:true}});
                        //io.emit("update",{convoList:phone,add:true});
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
                        parentPort.postMessage({type:"update",obj:{convoList:phone,add:true}});
                        //io.emit("update",{convoList:phone,add:true});
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

  sendCreateContactMessage(workerData);

  
