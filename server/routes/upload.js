var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var postedFileDir = 'tmp';
var flow = require('flow-node')(postedFileDir);
var fs = require('fs');

// create the destination directory if not already created
try {
    fs.mkdirSync(postedFileDir);
} catch (e) {}    
// Configure access control allow origin header stuff
var ACCESS_CONTROLL_ALLOW_ORIGIN = false;
//clean up the parts after download complete
function clean(dirPath, identifier) {
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    var targetFile = 'flow-'+identifier;
    for (var i = 0; i < files.length; i++) {
      var parts = files[i].split('.')
      var extension = parts[1];
      if(files[i].indexOf(targetFile)>=0 && parseInt(extension) != NaN){
        var filePath = dirPath + '/' + files[i];
        if (fs.statSync(filePath).isFile())
            fs.unlinkSync(filePath);
      }
    }
};

router.onPost = function(callback){
    var noop = function(){};
    router.postCallback = callback || noop;
};

router.post('/upload', multipartMiddleware, function(req, res) {
  flow.post(req, function(status, filename, original_filename, identifier) {
    var params = {dir:postedFileDir,
                  filename:filename,
                  original_filename:original_filename,
                  identifier:identifier}
    console.log('POST', status, original_filename, identifier);
    if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
      res.header("Access-Control-Allow-Origin", "*");
    }
    res.status(status).send();
    //if callback is available then call it
    if(status === 'done'){      
         console.log("re-assembling chunks");
         var path = postedFileDir+'/';
         var stream = fs.createWriteStream(path + filename);
         flow.write(identifier, stream, { end: true });   
         stream.on('finish',function(){
             console.log("got finish");
             clean(path,identifier);
             if(router.postCallback != undefined){
                router.postCallback(status,params);
             }      
         });
    }
  });
});

router.options('/upload', function(req, res){
  console.log('OPTIONS');
  if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.status(200).send();
});
// Handle status checks on chunks through Flow.js
router.get('/upload', function(req, res) {
  flow.get(req, function(status, filename, original_filename, identifier) {
    console.log('GET', status);
    if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
      res.header("Access-Control-Allow-Origin", "*");
    }
    if (status == 'found') {
      status = 200;
    } else {
      status = 404;
    }
    res.status(status).send();
  });
});

router.destination = postedFileDir;
module.exports = router;
