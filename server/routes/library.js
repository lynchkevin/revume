var express = require('express');
var library = express.Router();
var util = require('util');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var execAsync = Promise.promisifyAll(require('child_process')).execAsync;
var mongoose = Promise.promisifyAll(require('mongoose'));
var request = Promise.promisifyAll(require('request'));
var pnService = require('../lib/pnService');
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');
var port = process.env.PORT;
var AWS = require('aws-sdk');
var s3 =  Promise.promisifyAll(new AWS.S3());
var zamzar = require('../lib/zamzar');
var signer = require('../lib/cfSigner');



// export file location information
library.baseUrl = 'https://s3.amazonaws.com';
library.bucket = 'revu';
library.domain = '.volerro.com';
library.upload = 'uploads';
library.serve = 'img';
library.fullPath = library.baseUrl+'/'+library.bucket+library.domain;
console.log('Library url= ',library.fullPath);

//set up the call back channel
//initialize the pubnub channel for pub/sub with the client
pnService.init("revume_server");
var channel = pnService.newChannel("library::fileEvents");

//set up the signer
signer.setBucket('revu','volerro.com');

var Slide = schema.Slide;
var UploadedFile = schema.UploadedFile;
var Deck = schema.Deck;
var Category = schema.Category;

//AWS setup
AWS.config.update({region: 'us-east-1'});


//save uploaded slides to the database
function savePowerpointUpload(fileName,images,userId){
    return new Promise(function(resolve, reject){ 
        var justFileName = fileName.slice(fileName.indexOf('_')+1);
        var allPromises = [];
        var slides = [];
        var uFile = new UploadedFile;
        uFile.slides = [];
        uFile.name = justFileName;
        uFile.user = userId;
        uFile.createdDate = new Date();
        for(var i=0; i< images.length-1; i++){
            var slide = new Slide;
            slide.name = images[i];
            slide.originalOrder = i;
            slide.location = library.fullPath+'/'+slide.name;
            slide.link = '';
            slide.type = 'img';
            slide.src = library.fullPath+'/'+slide.name; 
            if(i == 0)
                uFile.thumb = slide.src;
            slide.identifier = fileName.slice(fileName.indexOf('/')+1,fileName.indexOf('_'));
            console.log("saving slide",slide.name);
            allPromises.push(slide.saveAsync());
            uFile.slides.push(slide._id);
        }
        Promise.settle(allPromises).then(function(slides){
            return uFile.saveAsync();
       }).then(function(uf){
                console.log("uFile saved - resolving: ",uf);
                resolve(uf);
        }).catch(function(err){
                reject(err);
        });
    });
};


//save uploaded slides to the database
function saveVideoUpload(fileName,thumbFile,userId){
    return new Promise(function(resolve, reject){ 
    var slide = new Slide;
    var uFile = new UploadedFile;
    var justFileName = fileName.slice(fileName.indexOf('_')+1);
    var withIdentifier = fileName.slice(fileName.indexOf('/')+1);
    console.log(justFileName)
    uFile.name = justFileName;
    uFile.createdDate = new Date();
    uFile.slides = [];
    uFile.user = userId;
    slide.name = justFileName;
    slide.originalOrder = 0;
    slide.location = library.fullPath +'/'+library.serve+'/'+withIdentifier;
    slide.type = 'video';
    slide.link = '';
    slide.src = library.fullPath +'/'+library.serve+'/'+withIdentifier;
    slide.poster = library.fullPath +'/'+thumbFile;
    uFile.thumb = slide.poster;
    slide.identifier = fileName.slice(fileName.indexOf('/')+1,fileName.indexOf('_'));
    console.log('saveVideoUplaod: ',slide);
    uFile.slides.push(slide._id);
    console.log("saving slide",slide.name);
    slide.saveAsync().spread(function(sld){
        console.log(sld);
        return uFile.saveAsync();
    }).spread(function(uf){
        console.log('video saved - resolving: ',uf);
        resolve(uf);
    }).catch(function(err){
        reject(err);
    });
    });
}

function getExtention(f){
    return f.substr(f.lastIndexOf('.'),f.length-1).toLowerCase();
}
//test if powerpoint file
function documentFile(filePath){
    var f = filePath;
    var result = false;
    var ext = getExtention(f);
    switch(ext){
        case ".ppt"     :
        case ".pptx"    :
        case ".pdf"     :
        case ".doc"     :
        case ".docx"    :
            result = true;
            break
    }
    return result;
}
function videoFile(filename){
    var ext = getExtention(filename)
    var result = false;
    switch (ext){
        case ".mp4":
        case ".avi":
        case ".mov":
        case ".webm":
        case ".ogg":
        case ".mov":
        case ".wmv":
            result = true;
            break;
    }
    return result;
};      

function createVideoThumb(fileName){
    return new Promise(function(resolve, reject){ 
        var justFile = fileName.slice(fileName.indexOf('/')+1);
        var thumbFile = justFile.substring(0,justFile.lastIndexOf('.')-1)+'.png';
        var source = 'tmp/'+justFile;
        var params = { Bucket: library.bucket+library.domain,
                       Key: library.serve+'/'+justFile
                     };
        s3.getObjectAsync(params).then(function(object){
            fs.writeFile(source,object.Body);
            console.log('file written');
            //create the thumb
            var execStr = 'ffmpeg -i '+source+' -vframes 1 -s 320x240 -ss 00:00:10 '+'tmp/'+thumbFile;
            return execAsync(execStr);
        }).then(function(status){
            //upload the thumb
            var fileStream = fs.createReadStream('tmp/'+thumbFile);
            params.Bucket = library.bucket+library.domain;
            params.Key = library.serve+'/'+thumbFile;
            params.Body = fileStream;
            return s3.putObjectAsync(params);
        }).then(function(status){
            console.log('upload status: ',status);
            //delete the tmp files
            console.log('deleting temp files...');
            fs.unlink('tmp/'+thumbFile);
            fs.unlink(source);
            resolve(library.serve+'/'+thumbFile);
        }).catch(function(err){
            console.log(err);
            reject(err);
        });
    });
}

function callZamzar(fileName){
    return new Promise(function(resolve, reject){ 
        var justFile = fileName.slice(fileName.indexOf('/')+1);
        var thumbFile = justFile.substring(0,justFile.lastIndexOf('.')-1)+'.png';
        var source = 'tmp/'+justFile;
        var job = {};
        var images = [];
        var promises = [];
        var params = { Bucket: library.bucket+library.domain,
                       Key: library.upload+'/'+justFile
                     };
        console.log('target for download: ',source);
        s3.getObjectAsync(params).then(function(object){
            return fs.writeFileAsync(source,object.Body);
        }).then(function(){
            console.log('file written');
            //call zamzar
            return zamzar.ppt2png(source);
        }).then(function(j){
            //upload the png files
            job = j;            
            // delete the source file - zamzar deletes the zip
            console.log('deleting: ',source);
            fs.unlink(source);
            if(job.status != 'successful')
              reject('zamzar fails');
            else {
              job.target_files.splice(-1,1);
              console.log(job.target_files);
              job.target_files.forEach(function(file){
                var fileStream = fs.createReadStream('tmp/'+file.name);
                params.Bucket = library.bucket+library.domain;
                params.Key = library.serve+'/'+file.name;
                params.Body = fileStream;
                images.push(params.Key);
                console.log('uploading: ',file.name);
                promises.push(s3.putObjectAsync(params));
              });
              return Promise.settle(promises);
            }
        }).then(function(resArray){
            job.target_files.forEach(function(file){
                try{
                console.log('deleting: ','tmp/'+file.name);
                fs.unlink('tmp/'+file.name); 
                } catch(err){
                    console.log('error deleting file: ',file.name);
                }
            });
           resolve(images);
        }).catch(function(err){
            console.log(err);
            reject(err);
        });
    });
}

function pptx2png(s3FileName,userId){
    return new Promise(function(resolve, reject){
        var restUrl = 'https://rb.volerro.com/api/convert/pptxtopng';
        var justName = library.serve+'/'+s3FileName.slice(library.upload.length+1,s3FileName.lastIndexOf('.ppt'));
        var propertiesObject = { sourceBucket: library.bucket,
                                 sourceFile : s3FileName,
                                 outputBucket: library.bucket,
                                 outputPrefix: justName
                               };

            console.log(propertiesObject);
    
            request.getAsync({url: restUrl, 
                              qs:propertiesObject,
                              followRedirect: false,
                              auth: { 
                                  user:'klynch@volerro.com',
                                  pass:'hinault'
                              }})
            .then(function(response){
                var body = JSON.parse(response[0].body);
                console.log(body);
                if(body.status != 'ok')
                        reject(body.message);
                else {
                    var images = body.images;
                    return savePowerpointUpload(s3FileName,images,userId);
                }
            })
            .then(function(uFile){
                resolve(uFile);          
            }).catch(function(err){
                console.log(err);
                reject(err);
            });
    });
}

// process uploaded file based on file type
function processFile(fileName,userId){
    return new Promise(function(resolve, reject){
    var uFile = {};
    if(fileName != undefined){
        console.log("processFile...",fileName);
        if(documentFile(fileName)){
            console.log("document!");
            callZamzar(fileName).then(function(images){
                return savePowerpointUpload(fileName,images,userId);
            }).then(function(uf){
                uFile = uf;
                // delete uploaded file
                var params = {
                  Bucket: library.bucket+library.domain, 
                  Key: fileName, 
                };
                return s3.deleteObjectAsync(params);
            }).then(function(data) {
                resolve(uFile);                
            }).catch(function(err){
                reject(err);
            });
        }       
        if(videoFile(fileName)){
            var target = library.serve+fileName.slice(fileName.indexOf('/'));
            var source = encodeURI('revu.volerro.com' + '/' + fileName);
            console.log('target is: ',target);
            console.log('source is: ',source);
            var params = {
                Bucket: library.bucket+library.domain, 
                CopySource: source,
                Key: target,
                ACL: 'bucket-owner-full-control'
                };
                console.log(params);
                s3.copyObjectAsync(params)
                .then(function(data){
                console.log('copy returns: ',data);
                // delete uploaded file       
                var params = {
                  Bucket: library.bucket+library.domain, 
                  Key: fileName, 
                };
                console.log('deleting...');
                console.log(params);
                return s3.deleteObjectAsync(params);
            }).then(function(){
                // create thumb
                return createVideoThumb(fileName);
            }).then(function(thumbFile){
                console.log('thumb created: ',thumbFile);          
                return saveVideoUpload(fileName,thumbFile,userId)
            }).then(function(uf){
                uFile = uf;
                resolve(uFile);
            }).catch(function(err){
                reject(err);
            });
        }
    } else {
        reject('fileName undefined');
    }    
    });
}


// some handy queries
//GET functionality
function getByUser(Model,req,res){
    var userId = req.query.user;
    console.log(Model.modelName,' query! with userID populate - id: ',userId);
    var promises = [];
    var items = {};
    Model.find({user:new ObjectId(userId)})
    .populate('user slides')
    .sort({createdDate:-1})
    .execAsync()
    .then(function(results){
        items = results;
        items.forEach(function(item){
            promises.push(signer.thumb(item.thumb));
            promises.push(signer.slides(item.slides));
        });
        return Promise.settle(promises);
    }).then(function(pees){
        for(var i=0,j=0; i < pees.length; i+=2,j++)
            items[j].thumb = pees[i].value();
        res.send(items);      
    }).catch(function(err){
        res.send(err);
    });
}
function getById(Model,req,res){
    var id = req.params.id;
    var item = {}
    var promises = [];
    console.log(Model.modelName," get");  
    Model.findOne({_id:new ObjectId(id)})
    .populate('user slides')
    .sort({createdDate:-1})
    .execAsync().then(function(result){
        item = result;
        return signer.thumb(item.thumb);
    }).then(function(url){
        item.thumb = url;
        return signer.slides(item.slides);
    }).then(function(){
        res.send(item);
    }).catch(function(err){
        res.send(err);
    });
}
//handle requests for library objects
// uploaded files
library.get('/library/uploadedFiles/processFile/:filePath',function(req,res){
    var filePath = req.params.filePath;
    var userId = req.query.userId;    //strip the encodedUri Name
    filePath = filePath.replace(/%20/g, " ");
    console.log('filePath: ',filePath,'userId: ',userId);
    if (filePath != undefined){
        res.send('OK - Processing file...');
        processFile(filePath,userId).then(function(uFile){
        //send the uFile over pubnub
        //channel.publish(uFile[0]);
        channel.publish({success:true});
        }).catch(function(err){
            channel.publish({success:false, error: err});
            console.log(err);
        });
    } else 
        res.send('filePath is required');
});
// uploaded files
library.get('/library/uploadedFiles',function(req,res){
    getByUser(UploadedFile,req,res);
});

library.delete('/library/uploadedFiles',function(req,res){
 console.log("library got delete!");
});

library.get('/library/uploadedFiles/:id',function(req,res){
    getById(UploadedFile,req,res);
});

library.delete('/library/uploadedFiles/:id',function(req,res){
    var id = req.params.id;
    var x = new ObjectId(id);
    var idArray = [];
    var allPromises = [];
    console.log('ufiles about to remove id: ',id, 'objId:',x);
    UploadedFile.findAsync({_id:new ObjectId(id)}).spread(function(uf){
        console.log(uf);
        uf.slides.forEach(function(id){
            idArray.push(id);
        });
        console.log(idArray);
        return uf.removeAsync();
    }).then(function(){
        console.log('uFile Removed!');
        return Slide.findAsync({_id:{$in:idArray}})
    }).then(function(slds){
        console.log('removing slides');
        slds.forEach(function(slide){
                var params = {
                  Bucket: library.bucket+library.domain, 
                  Key: fileName, 
                };
                console.log('deleting...');
                console.log(params);
                return s3.deleteObjectAsync(params);
            allPromises.push(slide.removeAsync());
        });
        return Promise.settle(allPromises);
    }).then(function(){
        console.log('successfully deep deleted uFile');
        res.send('');                
    }).catch(function(err){
        console.log(err);
        res.send(err);
    });
});

library.get('/library/slides',function(req,res){
    var url = '';
    var promises = [];
    var theSlides = [];
    Slide.find()
    .sort({identifier:1,originalOrder:1})
    .execAsync().then(function(slides){
        theSlides = slides;
        slides.forEach(function(slide){
            promises.push(signer.getSignedUrl(slide.src));
        });
        return Promise.settle(promises);
    }).then(function(urls){
        urls.forEach(function(url){
            console.log('isFulfilled',url.isFulfilled(),'value',url.value());
        });

        theSlides.forEach(function(slide){
            slide.src = urls[idx++];
        });
        res.send(slides);
    }).catch(function(err){
        res.send(err);
    });
});
library.get('/library/slides/convert',function(req,res){
    var prefix = 'http://192.168.1.167:5000/facades/';
    var start = prefix.length;
    var filename ='';
    var baseUrl = 'https://s3.amazonaws.com/revu.volerro.com/img/';
    var newSrc = '';
    var promises = [];
    Category.find()
    .sort({identifier:1,originalOrder:1})
    .execAsync().then(function(items){
        console.log(items);
        items.forEach(function(item){
            fileName = item.thumb.slice(start);
            newSrc = baseUrl+fileName;
            item.thumb = newSrc;
            promises.push(item.saveAsync());
            return Promise.settle(promises);
        }).then(function(){
            console.log('conversion complete');
            res.send('conversion complete');
        });
    }).catch(function(err){
        res.send(err);
        console.log(err);
    });
});

function doGetSlides(model,req){
    var id = req.params.id;
    var x = new ObjectId(id);
    console.log('model id: ',id, 'objId:',x);
    return new Promise(function(resolve, reject){ 
        model.findAsync({_id:new ObjectId(id)}).spread(function(item){
            console.log(item);
            var idArray = []
            item.slides.forEach(function(id){
                idArray.push(id);
            });
            console.log(idArray);
            return Slide.findAsync({_id:{$in:idArray}})
        }).then(function(slds){
            console.log('slides ',slds);
            resolve(slds);
        }).catch(function(err){
            reject(err);
        });
    });
};

function doDelete(model,req){
    var id = req.params.id;
    var x = new ObjectId(id);
    var idArray = [];
    var allPromises = [];
    var foundItem = {};
    console.log('Library about to remove id: ',id, 'objId:',x);
    model.findAsync({_id:new ObjectId(id)}).spread(function(item){
            foundItem = item;
            return Slide.removeAsync({_id:{$in:item.slides}})
    }).then(function(){ 
        console.log('deleting navItem');
        return foundItem.removeAsync();
    }).then(function(response){
        var s = '';
        return s;
    }).catch(function(err){
        console.log(err);
        return err;
    });
};
function doSave(model,req){
    var newItem = req.body;
    var newDoc = new model;
    newDoc.name = newItem.name;
    newDoc.user = newItem.user._id;
    newItem.slides.forEach(function(slide){
        slide.src = signer.stripAccessKeys(slide.src);
        if(slide.poster != undefined)
            slide.poster = signer.stripAccessKeys(slide.poster);
    })
    newDoc.slides = newItem.slides;
    newDoc.thumb = signer.stripAccessKeys(newItem.thumb);
    console.log(newDoc);
    return newDoc.saveAsync();
};

function doUpdate(model,req){
    var id = req.params.id;
    var x = new ObjectId(id);
    var idArray = [];
    var allPromises = [];
    var s = {};
    var foundItem = {};
    return new Promise(function(resolve, reject){ 
    model.findAsync({_id:new ObjectId(id)}).spread(function(item){
        console.log('item',item);
        foundItem = item;
        return Slide.removeAsync({_id:{$in:item.slides}})
        }).then(function(){
            console.log('slides removed now adding back new slides');
            allPromises = [];
            req.body.slides.forEach(function(slide){
                s = new Slide;
                s.name = slide.name;
                s.originalOrder = slide.originalOrder;
                s.location = slide.location;
                s.type = slide.type;
                s.link = slide.link;
                s.src = signer.stripAccessKeys(slide.src);
                s.identifier = slide.identifier;
                if(slide.poster!= undefined)
                    s.poster = signer.stripAccessKeys(slide.poster);
                allPromises.push(s.saveAsync())
            })
            return Promise.settle(allPromises);
        }).then(function(slides){
            console.log('new slides saved...saving navItem');
            foundItem.slides =[];
            slides.forEach(function(arr){ 
                foundItem.slides.push(arr.value()[0]._id);
        });
        foundItem.thumb = signer.stripAccessKeys(req.body.thumb);
        foundItem.originalOrder = req.body.originalOrder;
        console.log('foundItem.user= ',foundItem.user);
        foundItem.lastUpdate = new Date();
        return foundItem.saveAsync();
    }).spread(function(item){
        console.log('updated item - done!');
        resolve(item);
    }).catch(function(err){
        reject(err);
    });
    });
};


//update an uploaded file
library.put('/library/uploadedFiles/:id',function(req,res){
    console.log("Files: got update!");
    doUpdate(UploadedFile,req).then(function(item){
        console.log(item);
        res.send(item);
    }).catch(function(err){
        console.log('Error:',err);
        res.send(err);
    });
});
//update an  just the user uploaded file
library.put('/library/uploadedFiles/setuser/:id',function(req,res){
    console.log("Files: got set user!",req.params.id,req.body.id);
    UploadedFile.findOneAsync(new ObjectId(req.params.id)).then(function(ufile){
        console.log(ufile);
        if(ufile != undefined){
            ufile.user = new ObjectId(req.body.id);
            ufile.saveAsync().then(function(){
                res.send('success');
            }).catch(function(err){
                res.send(err);
            });
        }else
            res.send('not found');
    });
});
//get all decks
library.get('/library/decks',function(req,res){
    getByUser(Deck,req,res);
});
//get all the slides for a deck
library.get('/library/decks/:id',function(req,res){
    getById(Deck,req,res);
});    

//delete a deck
library.delete('/library/decks/:id',function(req,res){
    console.log("decks delete");
    res.send(doDelete(Deck,req));
});
//save a deck
library.post('/library/decks',function(req,res){
    console.log("Deck: got save!");
    doSave(Deck,req).spread(function(item){
        console.log(item);
        res.send(item);
    }).catch(function(err){
        console.log('Error:',err);
        res.send(err);
    });
});
//update a deck
library.put('/library/decks/:id',function(req,res){
    console.log("Deck: got update!");
    doUpdate(Deck,req).then(function(item){
        console.log(item);
        res.send(item);
    }).catch(function(err){
        console.log('Error:',err);
        res.send(err);
    });
});
library.get('/library/categories',function(req,res){
    getByUser(Category,req,res);
});
//get all the slides for a category    
library.get('/library/categories/:id',function(req,res){
    getById(Category,req,res);
});
//delete a category
library.delete('/library/categories/:id',function(req,res){
    res.send(doDelete(Category,req));
});    
//save a category
library.post('/library/categories',function(req,res){
    console.log("Category: got save!");
    doSave(Category,req).spread(function(item){
        console.log(item);
        res.send(item);
    }).catch(function(err){
        console.log('Error:',err);
        res.send(err);
    });
});
//update a category
library.put('/library/categories/:id',function(req,res){
    console.log("Categories: got update!");
    doUpdate(Category,req).then(function(item){
        console.log(item);
        res.send(item);
    }).catch(function(err){
        console.log('Error:',err);
        res.send(err);
    });
});
module.exports = library;
