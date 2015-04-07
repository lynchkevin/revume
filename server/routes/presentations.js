var express = require('express');
var router = express.Router();

var BASEFILENAME = "content/Slide";
var pDatabase = [];
var filename = "";


var init = function(){
    //presentation 1    
    presentation = new Object();
    presentation.id = 0;
    presentation.name = "PresentationOne";
    presentation.slides=[];
    for (var i = 1; i<9;i++){
        filename = BASEFILENAME+i.toString()+".png";
        presentation.slides.push({
            type : "img",
            source : filename
            });
    }
    presentation.slides.splice(5,0,{type:"video", source:"http://video-js.zencoder.com/oceans-clip.mp4", poster:"http://video-js.zencoder.com/oceans-clip.png"});
    pDatabase.push(presentation);

    presentation = new Object();
    presentation.id = 1;
    presentation.name = "PresentationTwo";
    presentation.slides=[];
    for (var i = 10; i<18;i++){
        filename = BASEFILENAME+i.toString()+".png";
        presentation.slides.push({
            type : "img",
            source : filename
            });
    }
    presentation.slides.splice(4,0,{type:"video", source:"http://video-js.zencoder.com/oceans-clip.mp4",poster:"http://video-js.zencoder.com/oceans-clip.png"});
    pDatabase.push(presentation);

    presentation = new Object();
    presentation.id = 2;
    presentation.name = "PresentationThree";
    presentation.slides=[];
    for (var i = 21; i<34;i++){
        filename = BASEFILENAME+i.toString()+".png";
        presentation.slides.push({
            type : "img",
            source : filename
            });
    }
    presentation.slides.splice(4,0,{type:"video", source:"http://video-js.zencoder.com/oceans-clip.mp4", poster:"http://video-js.zencoder.com/oceans-clip.png"});
    pDatabase.push(presentation);
    console.log("presentations initialized");
}

init();

/* get presentations either all or by id */
router.get('/presentations', function(req, res, next) {
    res.send(pDatabase);
});
router.get('/presentations/:id', function(req, res, next) {
    console.log(req.params.id);
    var id = parseInt(req.params.id);
    res.send(pDatabase[id]);
});

module.exports = router;
