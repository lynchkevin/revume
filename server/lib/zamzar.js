var     express = require('express');
var     Promise = require('bluebird');
var     app = express();
var     request = Promise.promisifyAll(require('request'));
var     fs = require('fs');
var     fstream = require('fstream');
var     promiseRetry = require('promise-retry');
var     unzip = require('unzip');


var apiKey = '849d96ac0ce79bfbc6f1e95bbef515a916d74955'
var formData = {
        target_format: 'png',
        source_file: undefined
    };
var directory = 'img'
var prefix = directory+'/';

    try {
        fs.mkdirSync(directory);
    } catch (e) {}    
    
    function unzipFile(file){
        return new Promise(function(resolve, reject){    
            var input = prefix+file.name;
            var readStream = fs.createReadStream(input);
            var writeStream = fstream.Writer(directory);
            readStream.pipe(unzip.Parse()).pipe(writeStream);
            console.log('extracted...deleting zip');
            try{
                fs.unlink(input);
            }catch(e){console.log("file unlink failed");}
            resolve();
        });
    }

    function downloadZipFile(job){
        var fileName;
        var file = job.target_files[job.target_files.length-1];
        return new Promise(function(resolve, reject){
            console.log('Getting File - ', file.name,file.id)
            request.getAsync({url: 'https://api.zamzar.com/v1/files/' + file.id + '/content',
                              followRedirect: false,
                              auth: { user:apiKey,
                              pass:'',
                              sendImmediately:true
                            }
            }).then(function(responseArray){
                var response = responseArray[0];
                var body = responseArray[1];
                // lets gelst the results
                if(response.headers.location != undefined){
                var fileRequest = request(response.headers.location);
                fileRequest.on('response', function (res) {
                    fileName = prefix+file.name;
                    console.log('request on : ',fileName);
                    res.pipe(fs.createWriteStream(fileName));
                });
                fileRequest.on('end', function () {
                    console.log('File : ',fileName,' download complete');
                    job.zipFile = file;
                    resolve(job);
                });
                } else {
                    console.log("reponse header location is undefined");
                    reject('could not download zipfile');
                }
            });
        });
    }


    function waitForJob(job){
        return new Promise(function(resolve, reject){
            var timeoutInSeconds = 100;
            var pollingWaitSeconds = 2;
            var limit = timeoutInSeconds/pollingWaitSeconds;
            var delay = pollingWaitSeconds*1000;
            var tries = 0;

            if(job.status == 'successful'){
                resolve(job);
            }else{
                var timerId = setInterval(function(){
                    console.log('waiting for job', job.id);
                    request.getAsync({url:'https://api.zamzar.com/v1/jobs/'+job.id,
                            auth: { user:apiKey,
                            pass:'',
                            sendImmediately:true
                            }
                    }).then(function(jobInfo){
                        job = JSON.parse(jobInfo[1]);
                        if(++tries > limit){
                            clearInterval(timerId);
                            reject('timeout limit reached while polling zamzar endpoint limit : ',timeoutInSeconds);
                        }else{
                            if(job.status == 'successful'){
                                clearInterval(timerId);
                                console.log("job complete");
                                resolve(job);
                            }
                        }
                    })

                },delay);
            }
        })
    }

    var zamzar = {};
    zamzar.powerpointFile = function(filePath){
        var f = filePath;
        var ext = f.substr(f.lastIndexOf('.'),f.length-1);
        if(ext == ".ppt" || ext==".pptx") {
            return true;
        } else {
        return false;
        }
    }


    zamzar.ppt2png = function(filePath){
        return new Promise(function(resolve, reject){        
        var filename = filePath;
        request.postAsync({url:'https://api.zamzar.com/v1/jobs/',
                           formData: {
                                target_format: 'png',
                                source_file: fs.createReadStream(filename)
                            },
                           auth:{user:apiKey,
                                 pass:'',
                                 sendImmediately:true
                            }
        }).then(function(jobInfo){
            job = JSON.parse(jobInfo[1]);
            console.log('Job posted successfully : ',job.id);
            return waitForJob(job)
        }).then(function(job){
            console.log('downloading zipfile');
            return promiseRetry(function(retry,number){
                console.log('attempt number', number);
                return downloadZipFile(job)
                .catch(retry);
            });
        }).then(function(job){
            console.log('unzipping file ',prefix+job.zipFile.name)
            var result = unzipFile(job.zipFile);
            resolve(job);
        }).catch(function(e){
            console.log('Error in chain: ',e);
            reject(e);
        });
    });
};
    
module.exports = zamzar;