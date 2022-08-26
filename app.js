const express=require("express");
const bodyParser=require("body-parser");
const request=require("request");
const https= require("https");
const crypto=require("crypto");
const fs = require("fs");
const handlebars = require("handlebars");
const app=express();

app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}));

app.get("/",function(req,res){
  res.sendFile(__dirname+"/signup.html")
})

const successTemplate = fs.readFileSync("success.html", "utf8");
const updateTemplate = fs.readFileSync("update.html","utf8");
const vipuserTemplate = fs.readFileSync("vipuser.html","utf8");
const vipdownTemplate = fs.readFileSync("vipdown.html","utf8");
const unsubscribeTemplate = fs.readFileSync("unsubscribe.html","utf8");

app.post("/",function(req,res){
  const fName=req.body.firstName;
  const lName=req.body.lastName;
  const mail=req.body.eMail;
  const webdata={
    members:[
      {
        email_address: mail,
        status: "subscribed",
        merge_fields: {
          FNAME: fName,
          LNAME: lName
        }
      }
    ]
  };
  var source = {
      message : mail
    };
  const hash=crypto.createHash('md5').update(mail).digest('hex');
  const geturl="https://<dc>.api.mailchimp.com/3.0/lists/{List_ID}/members/"+hash;
  const getoptions={
    method: "GET",
    auth: "{anystring}:<api>"
  }
  https.get(geturl,getoptions,function(dataCheckResponse){
    dataCheckResponse.on("data",function(checkData){
      const jscheckData=JSON.parse(checkData);
      if(jscheckData.status===404 || jscheckData.status==="archived"){
        const postUrl="https://<dc>.api.mailchimp.com/3.0/lists/{List_ID}";
        const postOptions={
          method: "POST",
          auth: "{anystring}:<api>"
        }
        const jsonPostData= JSON.stringify(webdata);
        const postRequest= https.request(postUrl,postOptions,function(postResponse){
          postResponse.on("data",function(data){
            const d=JSON.parse(data)
            if(d.error_count===0){
              var pageBuilder = handlebars.compile(successTemplate);
              var pageText = pageBuilder(source);
              res.writeHead(200, {"Context-Type": "text/html"});
              res.write(pageText);
              res.end();
              res.send();
            }
            else{
              res.sendFile(__dirname+"/failure.html")
            }
          })

        })
        postRequest.write(jsonPostData);
        postRequest.end();
      }
      else if(jscheckData.status==="unsubscribed"){
        source.unsubdata="hidden";
        var pageBuilder = handlebars.compile(updateTemplate);
        var pageText = pageBuilder(source);
        res.writeHead(200, {"Context-Type": "text/html"});
        res.write(pageText);
        res.send();
      }
      else{
        if(jscheckData.vip===true){
          source.formtype="/downgradevip";
          source.vipupdown="Downgrade";
        }
        else{
          source.formtype="/upgradevip";
          source.vipupdown="Upgrade to";
        }
        source.subagain="hidden";
        var pageBuilder = handlebars.compile(updateTemplate);
        var pageText = pageBuilder(source);
        res.writeHead(200, {"Context-Type": "text/html"});
        res.write(pageText);
        res.end();
        res.send();
      }
    })
  })
})

// Subscribe again
app.post("/subscribe", function(req,res){
  var mailid=req.body.subscribe
  var hash=crypto.createHash('md5').update(mailid).digest('hex');
  const url="https://<dc>.api.mailchimp.com/3.0/lists/{List_ID}/members/"+hash;
  const options={
    method: "PATCH",
    auth: "{anystring}:<api>"
  }
  var source={
    message: mailid
  }
  const request = https.request(url,options,function(postResponse){
    if(postResponse.statusCode===200){
      var pageBuilder = handlebars.compile(successTemplate);
      var pageText = pageBuilder(source);
      res.writeHead(200, {"Context-Type": "text/html"});
      res.write(pageText);
      res.end();
      res.send();
    }
    else{
      res.sendFile(__dirname+"/failure.html")
    }
  })
  const webdata={
    status: "subscribed"
  }
  const jsonData=JSON.stringify(webdata);
  request.write(jsonData);
  request.end();
})

// Upgrade to VIP
app.post("/upgradevip", function(req,res){
  var mailid=req.body.vip
  var hash=crypto.createHash('md5').update(mailid).digest('hex');
  const url="https://<dc>.api.mailchimp.com/3.0/lists/{List_ID}/members/"+hash;
  const options={
    method: "PATCH",
    auth: "{anystring}:<api>"
  }
  var source1={
    message: mailid
  }
  const request = https.request(url,options,function(postResponse){
    if(postResponse.statusCode===200){
      var pageBuilder = handlebars.compile(vipuserTemplate);
      var pageText = pageBuilder(source1);
      res.writeHead(200, {"Context-Type": "text/html"});
      res.write(pageText);
      res.end();
      res.send();
    }
    else{
      res.sendFile(__dirname+"/failure.html")
    }
  })
  const webdata={
    vip: true
  }
  const jsonData=JSON.stringify(webdata);
  request.write(jsonData);
  request.end();
})

// Downgrade from VIP
app.post("/downgradevip", function(req,res){
  const mailid=req.body.vip
  var hash=crypto.createHash('md5').update(mailid).digest('hex');
  const url="https://<dc>.api.mailchimp.com/3.0/lists/{List_ID}/members/"+hash;
  const options={
    method: "PATCH",
    auth: "{anystring}:<api>"
  }
  var source1={
    message: mailid
  }
  const request = https.request(url,options,function(postResponse){
    if(postResponse.statusCode===200){
      var pageBuilder = handlebars.compile(vipdownTemplate);
      var pageText = pageBuilder(source1);
      res.writeHead(200, {"Context-Type": "text/html"});
      res.write(pageText);
      res.end();
      res.send();
    }
    else{
      res.sendFile(__dirname+"/failure.html")
    }
  })
  const webdata={
    vip: false
  }
  const jsonData=JSON.stringify(webdata);
  request.write(jsonData);
  request.end();
})

// Unsubscribe
app.post("/unsubscribe", function(req,res){
  var mailid=req.body.unsubscribe
  var hash=crypto.createHash('md5').update(mailid).digest('hex');
  const url="https://<dc>.api.mailchimp.com/3.0/lists/{List_ID}/members/"+hash;
  const options={
    method: "PATCH",
    auth: "{anystring}:<api>"
  }
  var source={
    message: mailid
  }
  const request = https.request(url,options,function(patchResponse){
    if(patchResponse.statusCode===200){
      var pageBuilder = handlebars.compile(unsubscribeTemplate);
      var pageText = pageBuilder(source);
      res.writeHead(200, {"Context-Type": "text/html"});
      res.write(pageText);
      res.end();
      res.send();
    }
    else{
      res.sendFile(__dirname+"/failure.html")
    }
  })
  const webdata={
    status: "unsubscribed"
  }
  const jsonData=JSON.stringify(webdata);
  request.write(jsonData);
  request.end();
})

//Delete data Permenantly
app.post("/delete", function(req,res){
  var mailid=req.body.delete
  var hash=crypto.createHash('md5').update(mailid).digest('hex');
  const url="https://<dc>.api.mailchimp.com/3.0/lists/{List_ID}/members/"+hash;
  const options={
    method: "DELETE",
    auth: "{anystring}:<api>"
  }
  const reqUest= https.request(url,options,function(patchResponse){
    if(patchResponse.statusCode===204){
      res.sendFile(__dirname+"/delete.html")
    }
    else{
      res.sendFile(__dirname+"/failure.html")
    }
  })
  reqUest.end();
})

app.post("/retry", function(req,res){
  res.redirect("/")
})

app.listen(process.env.PORT || 3030, function(){
  console.log("Server Started on node 3030");
})
