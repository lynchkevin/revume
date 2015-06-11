var express = require('express');
var library = express.Router();
var fs = require('fs');
var util = require('util');
var Promise = require('bluebird');
var execAsync = Promise.promisifyAll(require('child_process')).execAsync;
var mongoose = Promise.promisifyAll(require('mongoose'));
var request = Promise.promisifyAll(require('request'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');
var baseUrl = process.env.BASE_URL;
var port = process.env.PORT;
var AWS = require('aws-sdk');
var s3 =  Promise.promisifyAll(new AWS.S3());
var zamzar = require('../lib/zamzar');



// export file location information
library.baseUrl = 'https://s3.amazonaws.com';
library.bucket = 'revu';
library.domain = '.volerro.com';
library.upload = 'uploads';
library.serve = 'img';
library.fullPath = library.baseUrl+'/'+library.bucket+library.domain;
console.log('Library url= ',library.fullPath);

var Slide = schema.Slide;
var UploadedFile = schema.UploadedFile;
var Deck = schema.Deck;
var Category = schema.Category;

//AWS setup
AWS.config.update({region: 'us-east-1'});

//signing and link functions for S3 assets 
function getSignedUrl(src){
    return new Promise(function(resolve, reject){
        var baseUrl = library.baseUrl+'/'+library.bucket+library.domain;
        var start = baseUrl.length+1;
        var fileName = src.slice(start);
        var retVal = ''
        var expireTime = 60 * 60 * 12 //12 hours to expire
        var params ={Bucket:library.bucket+library.domain,Key:fileName,Expires:expireTime};
        console.log('params: ',params);
        var url = s3.getSignedUrlAsync('getObject',params).then(function(url){
            resolve(url);
        }).catch(function(err){
            retVal = '';
            reject(err);
        });
    });
}

function s3Thumb(thumb){
    return new Promise(function(resolve,reject){
        getSignedUrl(thumb).then(function(url){
            thumb = url;
            console.log(thumb);
            resolve(thumb);
        }).catch(function(err){
            reject(err);
        });
    });
}
function s3Slides(slides){
    return new Promise(function(resolve,reject){
        var promises = []
        slides.forEach(function(slide){
            if(slide.type == 'video')
                promises.push(getSignedUrl(slide.poster));               
            else
                promises.push(getSignedUrl(slide.src));
        });
        Promise.settle(promises).then(function(urls){
            var idx = 0;
            slides.forEach(function(slide){
                if(slide.type == 'video')
                    slide.poster = urls[idx++].value();
                else
                    slide.src = urls[idx++].value();                    
            });            
            resolve(slides);
        }).catch(function(err){
            reject(err);
        });
    })
}
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
    return f.substr(f.lastIndexOf('.'),f.length-1);
}
//test if powerpoint file
function powerpointFile(filePath){
    var f = filePath;
    var ext = getExtention(f);
    if(ext == ".ppt" || ext==".pptx") {
        return true;
    } else {
    return false;
    }
}
function videoFile(filename){
    var ext = getExtention(filename)
    console.log(ext);
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
        console.log('target for download: ',source);
        s3.getObjectAsync(params).then(function(object){
            console.log(object);
            fs.writeFile(source,object.Body);
            console.log('file written');
            //create the thumb
            var execStr = 'ffmpeg -i '+source+' -vframes 1 -s 320x240 -ss 00:00:10 '+'tmp/'+thumbFile;
            console.log(execStr);
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
        var params = { Bucket: library.bucket+library.domain,
                       Key: library.upload+'/'+justFile
                     };
        console.log('target for download: ',source);
        console.log(params);
        s3.getObjectAsync(params).then(function(object){
            console.log(object);
            fs.writeFile(source,object.Body);
            console.log('file written');
            //call zamzar
            return zamzar.ppt2png(source);
        }).then(function(job){
            //upload the thumb
           resolve(job);
/*
            var fileStream = fs.createReadStream('tmp/'+justFile);
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
*/
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
                    })
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
        if(powerpointFile(fileName)){
            console.log("powerpoint!");
            pptx2png(fileName,userId)
            .then(function(uf){
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
            promises.push(s3Thumb(item.thumb));
            promises.push(s3Slides(item.slides));
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
        return getSignedUrl(item.thumb);
    }).then(function(url){
        console.log(url);
        item.thumb = url;
        return s3Slides(item.slides);
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
        processFile(filePath,userId).then(function(uFile){
        var response = [];
        res.send(uFile[0]);
        }).catch(function(err){
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
            promises.push(getSignedUrl(slide.src));
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
function stripAccessKeys(urlWithKeys){
    var url = urlWithKeys.slice(0,urlWithKeys.indexOf('?'));
    console.log('with keys: ',urlWithKeys,'stripped: ',url);
    return url;
}

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
        slide.src = stripAccessKeys(slide.src);
        if(slide.poster != undefined)
            slide.poster = stripAccessKeys(slide.poster);
    })
    newDoc.slides = newItem.slides;
    newDoc.thumb = stripAccessKeys(newItem.thumb);
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
                s.src = stripAccessKeys(slide.src);
                s.identifier = slide.identifier;
                if(slide.poster!= undefined)
                    s.poster = stripAccessKeys(slide.poster);
                allPromises.push(s.saveAsync())
            })
            return Promise.settle(allPromises);
        }).then(function(slides){
            console.log('new slides saved...saving navItem');
            foundItem.slides =[];
            slides.forEach(function(arr){ 
                foundItem.slides.push(arr.value()[0]._id);
        });
        foundItem.thumb = stripAccessKeys(req.body.thumb);
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
