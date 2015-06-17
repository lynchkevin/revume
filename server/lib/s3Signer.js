var express = require('express');
var AWS = require('aws-sdk');
var Promise = require('bluebird');
var s3 =  Promise.promisifyAll(new AWS.S3());

var s3Signer = function(){
    var  s3Signer = this;
    
    //AWS setup
    AWS.config.update({region: 'us-east-1'});   
    s3Signer.baseUrl = 'https://s3.amazonaws.com';
    s3Signer.domain = 'volerro.com';
    
    //initialie the domain - default to volerro.com
    s3Signer.setBucket = function(bucket,domain){
        s3Signer.bucket = bucket;
        s3Signer.domain = domain;
        s3Signer.bucketPath = bucket+'.'+domain;
        console.log('s3Signer.setBucket : ',s3Signer.bucketPath)
    };

    s3Signer.stripAccessKeys = function(urlWithKeys){
        var url = urlWithKeys;
        if(urlWithKeys.indexOf('?')>0)
            var url = urlWithKeys.slice(0,urlWithKeys.indexOf('?'));
        url = url.replace(/%20/g, " ");
        console.log('with keys: ',urlWithKeys,'stripped: ',url);
        return url;
    }
    
    s3Signer.getSignedUrl = function(src){
        return new Promise(function(resolve, reject){
            var preAmble = s3Signer.baseUrl+'/'+s3Signer.bucket+'.'+s3Signer.domain;
            var fileName = src.slice(preAmble.length+1);
            var expireTime = 60 * 60 * 12 //12 hours to expire
            var params ={Bucket:s3Signer.bucketPath,
                         Key:fileName,
                         Expires:expireTime
                        };
            var url = s3.getSignedUrlAsync('getObject',params).then(function(url){
                resolve(url);
            }).catch(function(err){
                console.log(err);
                reject(err);
            });
        });
    };
        
    s3Signer.thumb = function(thumb){
        return new Promise(function(resolve,reject){
            s3Signer.getSignedUrl(thumb).then(function(url){
                thumb = url;
                resolve(thumb);
            }).catch(function(err){
                reject(err);
            });
        });
    };
    
    s3Signer.slides = function(slides){
        return new Promise(function(resolve,reject){
            var promises = []
            slides.forEach(function(slide){
                if(slide.type == 'video'){
                    promises.push(s3Signer.getSignedUrl(slide.poster));  
                    promises.push(s3Signer.getSignedUrl(slide.src));
                }
                else
                    promises.push(s3Signer.getSignedUrl(slide.src));
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
    
    return s3Signer;
}
    

module.exports = s3Signer();
