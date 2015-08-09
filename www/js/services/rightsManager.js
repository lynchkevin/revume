angular.module('RevuMe')
//service to manage the behavior of each model - like a strategy pattern
.service('rightsManager',['$rootScope',function($rootScope){
    var $ = this;
    
    //Clients of this service
    $.clients = { scopes: [],
                  names : [],
                  allActions : [],
                  rights : [],
                  handles : [],
                  keys : []
                };
    
    //two roles currently supported by the system
    $.roles = ['Admin','Viewer'];
    
    $.register = function(name,$scope,actionList,key){
        var clientIdx = $.clients.names.indexOf(name);
        if(clientIdx >=0){
            $.clients.scopes[clientIdx] = $scope;
            $.clients.allActions[clientIdx] = actionList;
            $.clients.keys[clientIdx] = key;
            return $.clients.handles[clientIdx];
        } else {
            $.clients.scopes.push($scope);
            $.clients.names.push(name);
            $.clients.allActions.push(actionList);
            clientIdx = $.clients.names.length - 1;
            //create new rights array for each role and set all rights to false
            $.clients.rights[clientIdx] = [];
            for(var i = 0; i<$.roles.length; i++)
                $.clients.rights[clientIdx].push(newRightsArray(clientIdx,false));
            var handle = {};
            handle.setAll = function(role,trueFalse){ 
                setAll(clientIdx,role,trueFalse);
            }
            handle.setRight = function(role,action,enabled) {
                setRight(clientIdx,role,action,enabled);
            }
            handle.getRight = function(role,action){ 
                var retVal = getRight(clientIdx,role,action);
                return retVal;
            }
            handle.getName = function(){ 
                var retVal = $.clients.names[clientIdx]; 
                return retVal;
            }
            handle.applyRights = function(role,optionalTarget){
                applyRights(clientIdx,role,optionalTarget);
            }
            $.clients.handles[clientIdx] = handle;
            $.clients.keys.push(key);
        }
        return $.clients.handles[clientIdx];
    }
    $.get = function(name){
        var clientIdx = $.clients.names.indexOf(name);
        if(clientIdx >=0)
            return $.clients.handles[clientIdx];
        else
            console.log('rightsManager:client: '+clientName+' not found');
    }
    $.findKey = function(key){
        var clientIdx = $.clients.keys.indexOf(key);
        if(clientIdx >=0)
            return $.clients.handles[clientIdx];
        else
            console.log('rightsManager:client: '+key.toString()+' not found');
    }
    // set all rights to a value
    function setAll(clientIdx,role,trueFalse){
        var roleIdx = $.roles.indexOf(role);
        $.clients.rights[clientIdx][roleIdx].forEach(function(right){
            right.enabled = trueFalse;
        });
    };
    //create a rights array with every right enabled            
    function newRightsArray(clientIdx,setAll){
        var rights = [];
        var allActions = $.clients.allActions[clientIdx];
        allActions.forEach(function(action){
            var r = {}
            r.name = action;
            r.enabled = setAll;
            rights.push(r);
        });
        return rights;
    }
    //set a rights element by role and action name
    function setRight(clientIdx,role,action,enabled){
        var roleIdx = $.roles.indexOf(role);
        var actionIdx = $.clients.allActions[clientIdx].indexOf(action);
        $.clients.rights[clientIdx][roleIdx][actionIdx].enabled = enabled;
    };
    //get the rights by role and action name
    function getRight(clientIdx,role,action){
        var roleIdx = $.roles.indexOf(role);        
        var actionIdx = $.clients.allActions[clientIdx].indexOf(action);
        var retVal = true;
        if(actionIdx >= 0)
            retVal = $.clients.rights[clientIdx][roleIdx][actionIdx].enabled;

        return retVal;
    }; 
    function applyRights(clientIdx,role,optionalTarget){
        var target = {};
        if(optionalTarget != undefined)
            target = optionalTarget;
        else
            target = $.clients.scopes[clientIdx];
        $.clients.allActions[clientIdx].forEach(function(action){
             var can = getRight(clientIdx,role,action);
             var propName = '_$'+action.replace(/\s/g,'');
             target[propName] = can;
        })
    }
/*                          
    $.models = [{name:'files',model:files},
                {name:'categories',model:categories},
                {name:'decks',model:decks}];
                
    $.allActions = ['Edit','New Meeting','Share','Hide','Delete'];
    

   
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
*/
}])
