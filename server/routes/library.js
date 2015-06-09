var express = require('express');
var library = express.Router();
var uploader = require('./upload');
var pnService = require('../lib/pnService');
var zamzar = require('../lib/zamzar');
var fs = require('fs');
var util = require('util');
var exec = require('child_process').exec;
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var request = Promise.promisifyAll(require('request'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');
var baseUrl = process.env.BASE_URL;
var port = process.env.PORT;
var fp = baseUrl+':'+port;
var AWS = require('aws-sdk');
var s3 =  Promise.promisifyAll(new AWS.S3());



// export file location information
library.url = '/facades';
library.appPath = '/img';
library.path = 'img/';
library.baseUrl = 'https://s3.amazonaws.com';
library.bucket = 'revu';
library.upload = 'uploads';
library.serve = 'img';
library.fullPath = library.baseUrl+'/'+library.bucket+'.volerro.com';
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
        var baseUrl = 'https://s3.amazonaws.com/revu.volerro.com/';
        var start = baseUrl.length;
        var fileName = src.slice(start);
        var retVal = ''
        var expireTime = 60 * 60 * 12 //12 hours to expire
        var params ={Bucket:'revu.volerro.com',Key:fileName,Expires:expireTime};
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
            promises.push(getSignedUrl(slide.src));
        });
        Promise.settle(promises).then(function(urls){
            var idx = 0;
            slides.forEach(function(slide){
                slide.src = urls[idx++].value();
            });            
            resolve(slides);
        }).catch(function(err){
            reject(err);
        });
    })
}
//save uploaded slides to the database
function savePowerpointUpload(job){
    return new Promise(function(resolve, reject){ 
        var t = job.target_files;
        var allPromises = [];
        var uFile = new UploadedFile;
        if(t.length>0)
            uFile.name = job.oFileName;
        uFile.createdDate = new Date();
        for(var i=0; i< t.length-1; i++){
            var slide = new Slide;
            slide.name = t[i].name;
            slide.originalOrder = i;
            slide.location = job.location;
            slide.link = '';
            slide.type = 'img';
            slide.src = library.fullPath+slide.location+'/'+slide.name; 
            if(i == 0)
                uFile.thumb = slide.src;
            slide.identifier = job.identifier;
            console.log("saving slide",slide.name);
            allPromises.push(slide.saveAsync());
        }
        Promise.settle(allPromises).then(function(slides){
            slides.forEach(function(resArray){
                var r = resArray.value();
                s = r[0];
                console.log("slide : ", s);
                uFile.slides.push(s._id);
            });
            uFile.markModified("slides");
            return uFile.saveAsync()
        }).spread(function(uf){
                console.log("uFile saved - resolving job: ",job);
                job.file_id = uf._id;
                resolve(job);
        }).catch(function(err){
                reject(err);
        });
    });
};


//save uploaded slides to the database
function saveVideoUpload(job){
    return new Promise(function(resolve, reject){ 
    var slide = new Slide;
    var uFile = new UploadedFile;
    uFile.name = job.filename;
    uFile.createdDate = new Date();
    slide.name = job.filename;
    slide.originalOrder = 0;
    slide.location = job.location;
    slide.type = 'video';
    slide.link = '';
    slide.src = library.fullPath+slide.location+'/'+slide.name; 
    slide.poster = library.fullPath+slide.location+'/'+job.poster;
    uFile.thumb = slide.poster;
    slide.identifier = job.identifier;
    console.log("saving slide",slide.name);
    slide.saveAsync().spread(function(sld){
        console.log(sld);
        uFile.slides.push(sld._id)
        return uFile.saveAsync();
    }).spread(function(uf){
        job.file_id = uf._id;
        resolve(job);
    }).catch(function(err){
        reject(err);
    });
    });
}
    
//initialize the pubnub channel for pub/sub with the client
pnService.init("library");
var channel = pnService.newChannel("library::fileEvents");

function identifierKey(identifier){
    var identifierKey = identifier.substring(0,identifier.indexOf('-')-1); 
    return identifierKey;
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

function handleVideo(status, params){
    var f = params.original_filename;
    var file = f.substr(0,f.lastIndexOf('.')-1);
    var thumbName = '\"'+library.path+file+'.png'+'\"';
    var source = params.dir+'/'+f;
    var final = library.path+f;
    //squeeze spaces
    
    console.log('source: ',source);
    console.log('final :', final);
    try{ //handleVideo may get called twice
    fs.renameSync(source,final);
    }catch(e){
        //don't save duplicates...
        console.log("file already processed")
        return;
    };
    //write video and thumbnail
    final = '\"'+final+'\"';
    var execStr = 'ffmpeg -i '+final+' -vframes 1 -s 320x240 -ss 1 '+thumbName;
    console.log(execStr);
    exec(execStr);
    
    // done - save it to thge database
    var job = {};
    job.message = "Video Upload Complete";
    job.location = library.url;   
    job.filename = f;
    job.identifier = f;
    job.poster = file+'.png';
    saveVideoUpload(job).then(function(job){
        channel.publish(job);
    }).catch(function(err){
        channel.publish(err);
    });
    
};

//this callback will be done when a post is recieved to upload
function callZamzar(status,params){
    //if it's a powerpoint then convert it - else noop
    var oldName = params.dir+'/'+params.original_filename;
    var fileName = params.dir+'/'+identifierKey(params.identifier)+'-'+params.original_filename;
    fs.renameSync(oldName,fileName);
    zamzar.ppt2png(fileName).then(function(job){
        job.message = "Powerpoint Conversion Complete";
        job.location = library.url;         
        job.identifier = params.identifier.substring(0,params.identifier.indexOf('-')-1); 
        job.oFileName = params.original_filename;
        return savePowerpointUpload(job);
    }).then(function(job){
        channel.publish(job);     
    }).catch(function(error){
        console.log(error);
        channel.publish(error);
    });     
};
function pptx2png(s3FileName){
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
                                  pass:'hinault4777'
                              }
            }).then(function(response){
                console.log(response);
                var images = response.images;
                var status = response.status;
                console.log(images);
                resolve(images);
            }).catch(function(err){
                console.log(err);
                reject(err);
            });
        
    });
}



// process uploaded file based on file type
function processFile(fileName){
    if(fileName != undefined){
        console.log("processFile...",fileName);
        if(powerpointFile(fileName)){
            console.log("powerpoint!");
            pptx2png(fileName);
      //     callZamzar(status,params);
        }
        if(videoFile(fileName)){
            console.log("video!");
       //    handleVideo(status,params);
        }
    }
};

// connect to uploader when complete callback
uploader.onPost(processFile);

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
    if (filePath != undefined){
        processFile(filePath);
        var response = [];
        res.send('success');
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
    newDoc.slides = newItem.slides;
    newDoc.thumb = newItem.thumb;
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
                s.src = slide.src;
                s.identifier = slide.identifier;
                s.poster = slide.poster;
                allPromises.push(s.saveAsync())
            })
            return Promise.settle(allPromises);
        }).then(function(slides){
            console.log('new slides saved...saving navItem');
            foundItem.slides =[];
            slides.forEach(function(arr){ 
                foundItem.slides.push(arr.value()[0]._id);
        });
        foundItem.thumb = req.body.thumb;
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
