var     express = require('express');
var     Promise = require('bluebird');
var     app = express();
var     request = Promise.promisifyAll(require('request'));
var     fs = require('fs');
var     fstream = require('fstream');
var     promiseRetry = require('promise-retry');
var     unzip = require('unzip');

// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});




var apiKey = '849d96ac0ce79bfbc6f1e95bbef515a916d74955'
var formData = {
        target_format: 'png',
        source_file: fs.createReadStream('Volerro Overview.pptx')
    };
var directory = './results'
var prefix = directory+'/';


function unzipFile(file){
    return new Promise(function(resolve, reject){    
        var input = prefix+file.name;
        var readStream = fs.createReadStream(input);
        var writeStream = fstream.Writer(directory);
        readStream.pipe(unzip.Parse()).pipe(writeStream);
        console.log('started extraction');
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
                resolve(file);
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

                  
var myArgs = process.argv.slice(2);
var action = ""
if(myArgs.length){
    var action = myArgs[0];
}
if(action == "get"){
    if(myArgs.length>1){
        var job = myArgs[1];
        console.log("Getting Job : ",job);
        request.getAsync({url:'https://api.zamzar.com/v1/jobs/'+job,
                     auth: { user:apiKey,
                             pass:'',
                             sendImmediately:true
                           } 
        }).then(function(jobInfo){
            job = JSON.parse(jobInfo[1]);
            console.log('Job posted successfully : ',job.id);
            return waitForJob(job)
        }).then(function(job){
            console.log("job is",job);
            return downloadZipFile(job);
        }).then(function(file){
            console.log('file ready to unzip',file.name);
            return unzipFile(file);
        }).catch(function(e){
            console.log('Unable to get job: ',e);
        });
    }
} else {
    request.postAsync({url:'https://api.zamzar.com/v1/jobs/',
                       formData: formData,
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
    }).then(function(file){
        console.log('unzipping file ',prefix+file.name)
        return unzipFile(file);
    }).catch(function(e){
        console.log('Error in chain: ',e);
    });

}

