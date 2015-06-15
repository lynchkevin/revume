var     express = require('express');
var     mongoose = require('mongoose');
var     bodyParser     = require('body-parser');
var     methodOverride = require('method-override');
var     AWS = require('aws-sdk');
var     port = process.env.PORT || 5000;
var     app = express();
var     Promise = require('bluebird');
var     s3 =  Promise.promisifyAll(new AWS.S3());
var     zlib = require('zlib');
var     fs = require('fs');
var     s3Stream = require('s3-upload-stream')(new AWS.S3());
var     zamzar = require('./lib/zamzar');
var     Streamifier = require('streamifier');






app.use(bodyParser());          // pull information from html in POST
app.use(methodOverride());      // simulate DELETE and PUT
app.use(express.static('./www'));


// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

AWS.config.update({region: 'us-east-1'});

/*var params ={Bucket:'revu.volerro.com',Key:'uploads/revume.pptx'};
var url = s3.getSignedUrl('getObject',params,function(err,url){
    if(err) 
        console.log('Error: ',err);
    else 
        console.log('Url is: ',url);
});
*/
/*
s3.listBuckets(function(err,data){
    if(err) {console.log('Error : ',err);}
    else {
        for(var index in data.Buckets){
            var bucket = data.Buckets[index];
            console.log('Bucket: ',bucket.Name,' : ',bucket.CreationDate);
            var params = {
                Bucket: bucket.Name,
                EncodingType:'url',
            };
            /*
            s3.listObjects(params,function(err,data){
                if(err)console.log(err,err.stack);
                else console.log(data);
            });
            
        }
    }
});
*/

// get a file from s3 
/*
var params = {Bucket:'revu-test.volerro.com',
              Key:'Uploads/revume.pptx'};
var stream;
s3.getObjectAsync(params).then(function(data){
        console.log(data);
        stream = Streamifier.createReadStream(data.Body);
        stream.pipe(process.stdout);
        return zamzar.s3ppt2png(stream);
}).then(function(job){
    console.log('Conversion Complete...');
}).catch(function(err){
    console.log('error: ',err);
});
*/


/*zamzar.s3ppt2png(stream).then(function(job){
    console.log('Conversion Complete...');
}).catch(function(err){
    console.log(err);
});
*/
var fileName = './tmp/'+'1434130521175_May Work-0.png';
var read = fs.createReadStream(fileName);
var params = {Bucket:'revu.volerro.com',
              Key: 'uploads/1434130521175_May Work-0.png',
              Body: read
             }
 s3.putObjectAsync(params).then(function(data){
     console.log(data);
 });

// Upload to s3....
//var upload = s3Stream.upload({
//  "Bucket": "revu.volerro.com",
//  "Key": "uploads/revume.pptx"
//});

// Handle errors.
//upload.on('error', function (error) {
//  console.log(error);
//});
//handle parts
//upload.on('part', function (details) {
//  console.log(details);
//});
//handle completion
/*
upload.on('uploaded', function (details) {
  console.log(details);
});
*/
//do it
//console.log('uploading file...');
//read.pipe(upload);

//catch uncaught exceptions and log
process.on('uncaughtException', function(err) {
    console.log('process.on handler');
    console.log(err);
});








