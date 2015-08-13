//service to manage the behavior of each model - like a strategy pattern
.service('libraryRights',['UploadedFiles','Categories','Decks',function(files,categories,decks){
    var $ = this;
    
    $.models = [{name:'files',model:files},
                {name:'categories',model:categories},
                {name:'decks',model:decks}];
                
    $.allActions = ['Edit','New Meeting','Share','Hide','Delete'];
    
    $.roles = ['Admin','Viewer'];
    
    //get the index of the model from an object
    function modelLookup(modelObject){
        var modelIdx = -1;
        for(var i=0; i<$.models.length;i++)
            if(modelObject == $.models[i].model)
                modelIdx = i;
        return modelIdx;
    };   
    function wordLookup(word,array){
        var idx = -1;
        for(var i=0; i<array.length;i++)
            if(array[i] == word)
                idx = i;
        return idx;
    }; 
    //lookup the Id of a role
    $.roleIndex = function(role){
        return wordLookup(role,$.roles);
    }
    //create a rights array with every right enabled            
    function allEnabled(){
        var finalRights = [];
        var rights = [];
        $.roles.forEach(function(role){
            rights = [];
            $.allActions.forEach(function(action){
                var r = {}
                r.name = action;
                r.enabled = true;
                rights.push(r);
            })
            finalRights.push(rights);
        })
        return finalRights;
    };
    //set one array false
    function setFalse(rights){
        rights.forEach(function(right){
            right.enabled = false;
        });
    };
    //set a rights element by role and action name
    function setRight(accessRights,role,action,enabled){
        var roleIdx = wordLookup(role,$.roles);
        var actionIdx = wordLookup(action,$.allActions);
        accessRights[roleIdx][actionIdx].enabled = enabled;
    };
    //get the rights by role and action name
    function getRight(accessRights,action){
        var actionIdx = wordLookup(action,$.allActions);
        if(actionIdx >= 0)
            return accessRights[actionIdx].enabled;
        else
            return true;
    };    
    //set rights for the file model (strategy)       
    function setFileRights(){
        var fileRights = allEnabled();
        //set the Admin rights
        setRight(fileRights,'Admin','New Meeting',false);
        setRight(fileRights,'Admin','Hide',false);
        //set the viewer rights
        setFalse(fileRights[1]); //all viewer rights false
        setRight(fileRights,'Viewer','Share',true);
        return fileRights;
    };
    //set the rights for categories
    function setCategoryRights(){
        var catRights = allEnabled();
        //set the Admin rights
        setRight(catRights,'Admin','New Meeting',false);
        setRight(catRights,'Admin','Hide',false);
        //set the viewer rights
        setFalse(catRights[1]); //all viewer rights false
        setRight(catRights,'Viewer','Hide',true);
        return catRights;
    };
    //set the rights for decks
    function setDeckRights(){
        var deckRights = allEnabled();
        //set the Admin rights
        setRight(deckRights,'Admin','Hide',false);
        //set the viewer rights
        setFalse(deckRights[1]); //all viewer rights false
        setRight(deckRights,'Viewer','Hide',true);
        return deckRights;
    };
    // organize the rights database for all rights             
    $.accessRights = [{model:$.models[0],accessRights:setFileRights()},
                      {model:$.models[1],accessRights:setCategoryRights()},
                      {model:$.models[2],accessRights:setDeckRights()} ];
    
    $.getAccessRights = function(model,role){
        var modelIdx = modelLookup(model);
        var roleIdx = wordLookup(role,$.roles);
        if(modelIdx >=0 && roleIdx >=0)
            return $.accessRights[modelIdx].accessRights[roleIdx];
    };
    $.rightEnabled = function(model,role,action){
        var rights = $.getAccessRights(model,role)
        if(rights!=undefined)
            return getRight(rights,action);
        else
            return true;
    };
    //get model name from model object
    $.modelName = function(model){
        var modelIdx = modelLookup(model);
        return $.models[modelIdx].name;
    };
    //add actions to the scope based on rights
    $.addActions = function($scope){
        var model = $scope.model;
        var items = $scope.navItems;
        items.forEach(function(item){
            var refActions = (item.beingEdited) ? $scope.editActions: $scope.actions ;
            item.actions =[];
            refActions.forEach(function(action){
                var idx = 0;
                if($.rightEnabled(model,item.role,action.name)){
                   var newAction = {};
                   newAction.name = action.name;
                   newAction.class = action.class;
                   newAction.callBack = action.callBack;
                   newAction.idx = idx++;
                   item.actions.push(newAction);
                }
            });
            item.action = {selected:item.actions[0]};
        });
    }
}])
