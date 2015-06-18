var express = require('express');
var AWS = require('aws-sdk');
var Promise = require('bluebird');
var s3 =  Promise.promisifyAll(new AWS.S3());

var clFrPrefix = 'https://dw69ofzd8w57f.cloudfront.net';

var cfSigner = function(){
    var  cfSigner = this;
    
    cfSigner.baseUrl = 'https://dw69ofzd8w57f.cloudfront.net/';
    cfSigner.s3Prefix = 'https://s3.amazonaws.com/revu.volerro.com/img/';
    
    //initialie the domain - default to volerro.com
    cfSigner.setBucket = function(bucket,domain){
    };

    cfSigner.stripAccessKeys = function(urlWithKeys){
        var url = urlWithKeys;
        if(urlWithKeys.lastIndexOf('/')>0){
            //strip the cloudfront url and replace with s3Prefix
            url = urlWithKeys.slice(urlWithKeys.lastIndexOf('/')+1);
            url = cfSigner.s3Prefix+url;
        }
        url = url.replace(/%20/g, " ");
        console.log('with keys: ',urlWithKeys,'stripped: ',url);
        return url;
    }
    
    cfSigner.getSignedUrl = function(src){
        return new Promise(function(resolve, reject){
            var url = src;
            if(url.lastIndexOf('/')>0){
                //strip the s3Prefix and replace with cloudFront
                url = url.slice(url.lastIndexOf('/')+1);
                url = cfSigner.baseUrl+url;
            }   
            resolve(url);
        });
    };
        
    cfSigner.thumb = function(thumb){
        return new Promise(function(resolve,reject){
            cfSigner.getSignedUrl(thumb).then(function(url){
                thumb = url;
                resolve(thumb);
            }).catch(function(err){
                reject(err);
            });
        });
    };
    
    cfSigner.slides = function(slides){
        return new Promise(function(resolve,reject){
            var promises = []
            slides.forEach(function(slide){
                if(slide.type == 'video'){
                    promises.push(cfSigner.getSignedUrl(slide.poster));  
                    promises.push(cfSigner.getSignedUrl(slide.src));
                }
                else
                    promises.push(cfSigner.getSignedUrl(slide.src));
            });
            Promise.settle(promises).then(function(urls){
                var idx = 0;
                slides.forEach(function(slide){
                    if(slide.type == 'video'){
                        slide.poster = urls[idx++].value();
                        slide.src = urls[idx++].value();
                    }
                    else
                        slide.src = urls[idx++].value();                    
                });            
                resolve(slides);
            }).catch(function(err){
                reject(err);
            });
        })
    };
    
    return cfSigner;
}
    

module.exports = cfSigner();
