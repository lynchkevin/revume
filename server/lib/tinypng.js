var Promise = require('bluebird');
var https = Promise.promisifyAll(require('https'));
var fs = Promise.promisifyAll(require("fs"));
var key = "J0vVapm9YFQ9TbE6SwBbrYjU8xc4rZ0t";


var tinyPng = function(){
    var  tinyPng = this;
    
    tinyPng.compress = function(file){
        return new Promise(function(resolve, reject){  
            var smFile = 'tmp/$'+file;
            var input = fs.createReadStream('tmp/'+file);
            var output = fs.createWriteStream(smFile);

            /* Uncomment below if you have trouble validating our SSL certificate.
               Download cacert.pem from: http://curl.haxx.se/ca/cacert.pem */
            // var boundaries = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----\n/g
            // var certs = fs.readFileSync(__dirname + "/cacert.pem").toString()
            // https.globalAgent.options.ca = certs.match(boundaries);

            
            var options = require("url").parse("https://api.tinify.com/shrink");
            options.auth = "api:" + key;
            options.method = "POST";
            
            console.log('options are: ',options);
            
            var request = https.request(options,function(response) {
                 if (response.statusCode === 201) {
                    /* Compression was successful, retrieve output from Location header. */
                    https.get(response.headers.location, function(response) {
                      response.pipe(output)
                      .on('close',function(){
                          console.log('compress completed...');
                          resolve(smFile);
                        });
                    });
                  } else {
                    /* Something went wrong! You can parse the JSON body for details. */
                    console.log("Compression failed");
                     reject('compression failed');
                  }
            });
                     
            input.pipe(request);
        });
    }
    return tinyPng;
}
    

module.exports = tinyPng();
