var express = require('express');
var Dashboard = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var request = Promise.promisifyAll(require('request'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');
var share = require('./share');
var moment = require('moment');

var UploadedFile = schema.UploadedFile;
var Deck = schema.Deck;
var Session = schema.Session;
var SI = schema.SessionInteraction;

// utility functions for module-wide use


var forToday = function(date){
    var today = moment().dayOfYear();
    var scheduled = moment(date).dayOfYear();
    var isEqual = (scheduled == today);
    return scheduled == today;
}
var forThisWeek = function(date){
    var week = moment(date).week();
    var thisWeek = moment().week();
    return week == thisWeek;
}
var forThisMonth = function(date){
    var today = new Date();
    var thisMonth = today.getMonth();
    var thisYear = today.getFullYear();
    return(date.getFullYear() == thisYear && date.getMonth() == thisMonth);
}

var getDocumentStats = function(Model, userId){
    return new Promise(function(resolve,reject){
        var query = {};
        var stats = {
            items:{today:0,thisWeek:0,thisMonth:0,stubs:[]},
            archivedItems:{stubs:[]}
        };
        //only go back 30 days
        var queryDate = moment().subtract(30,'days').toDate();
        console.log('queryDate is: ',queryDate);
        //get unarchived files first
        query.user = new ObjectId(userId);
        query.isArchived=false;
        query.createdDate={'$gt':queryDate};
        Model.find(query)    
        .sort({createdDate:-1})
        .execAsync()
        .then(function(results){
            results.forEach(function(file){
                if(forToday(file.createdDate))
                    stats.items.today++;
                if(forThisWeek(file.createdDate))
                    stats.items.thisWeek++;
                if(forThisMonth(file.createdDate))
                    stats.items.thisMonth++;
                stats.items.stubs.push({name:file.name,createdDate:file.createdDate});
            });
            query = {};
            query.user = new ObjectId(userId);            
            query.isArchived=true;
            return Model.find(query).sort({createdDate:-1}).execAsync();
        }).then(function(results){
            results.forEach(function(file){
                stats.archivedItems.stubs.push({name:file.name,createdDate:file.createdDate});
            });
            query.isArchived = false;
            return Model.find(query).count().execAsync();
        }).then(function(activeFiles){
            console.log('Active Files = ',activeFiles);
            stats.items.all = activeFiles;
            resolve(stats);
        }).catch(function(err){
            reject(err);
        });
    });
}

var getFileStats = function(userId){
    return new Promise(function(resolve,reject){
        var statistics = {};
        //get file stats 
        getDocumentStats(UploadedFile,userId).then(function(stats){
            statistics.files = stats.items;
            statistics.archivedFiles = stats.archivedItems;
            return share.getShared('files',userId);
        }).then(function(shares){
            statistics.sharedFiles = shares.length;
            return getDocumentStats(Deck,userId);
        }).then(function(stats){
            statistics.decks = stats.items;
            statistics.archivedDecks = stats.archivedItems;
            return share.getShared('decks',userId);
        }).then(function(shares){
            statistics.sharedDecks = shares.length;
            resolve(statistics);
        }).catch(function(err){
            reject(err);
        })
    });
}
var categorizeMeetings = function(stats,completed){
    //first divide meetings into upcomming and completed
    if(completed.length==0){
        stats.upcomming.stubs = stats.all.stubs;
        stats.all.upcomming = stats.all.stubs.length;
    }else{
        //populate all the completed meetings
        completed.forEach(function(id){
            stats.all.stubs.some(function(meeting){
                if(meeting._id.toString() == id.toString()){
                    console.log('meeting is: ',meeting.name);
                    meeting.completed = true;
                    stats.completed.stubs.push(meeting);
                    stats.all.completed++
                    return true;
                }else{
                    return false;
                }
            });
        });
        console.log('categorizeMeetings - populate completed: ',stats.completed.stubs.length);
        //then put all of the non completed into upcomming
        stats.all.stubs.forEach(function(meeting){
            if(meeting.completed != true)
                stats.upcomming.stubs.push(meeting);
                stats.all.upcomming++;
        });
        console.log('categorizeMeetings - populate upcomming: ',stats.upcomming.stubs.length);
        //now split into today and this month
        stats.completed.stubs.forEach(function(meeting){
            if(forToday(meeting.date))
                stats.completed.today++;
            if(forThisWeek(meeting.date))
                stats.completed.thisWeek++;
            if(forThisMonth(meeting.date))
                stats.completed.thisMonth++;
        })
        stats.upcomming.stubs.forEach(function(meeting){
            if(forToday(meeting.date))
               stats.upcomming.today++;
            if(forThisWeek(meeting.date))
                stats.upcomming.thisWeek++;
            if(forThisMonth(meeting.date))
                stats.upcomming.thisMonth++
        });
    }
}
var getMeetings = function(userId, queryDate){
    return new Promise(function(resolve,reject){
        Session.find({
            organizer:new ObjectId(userId),
            archiveStatus: {$elemMatch:{id:new ObjectId(userId),isArchived:false}},
            date:{$gt:queryDate}
        })
        .sort({date:-1})    
        .execAsync().then(function(results){
            resolve(results);
        }).catch(function(err){
            reject(err);
        });
    });
}
var getAllMeetings = function(userId){
    return new Promise(function(resolve,reject){
        var allMeetings = {
            all:0,
            active:0,
            archived:0
        };
        //get all meetings regardless of archiving status
        Session.find({
            organizer:new ObjectId(userId),
            archiveStatus: {$elemMatch:{id:new ObjectId(userId),isArchived:false}},
        })
        .count()
        .execAsync().then(function(active){
            allMeetings.active = active;
            return Session.find({
                organizer:new ObjectId(userId),
                archiveStatus: {$elemMatch:{id:new ObjectId(userId),isArchived:false}}})
                .count()
                .execAsync();
        }).then(function(archived){
            allMeetings.archived = archived;
            allMeetings.all = allMeetings.active+allMeetings.archived;
            resolve(allMeetings);
        }).catch(function(err){
            reject(err);
        });
    });
}
var getMetricsIn = function(idList){
    return new Promise(function(resolve,reject){
        SI.find({session:{$in:idList}})
        .distinct('session')
        .exec(function(err,results){
            if(err){
                console.log('getMetricsIn error: ',err);
                reject(err);
            }else
                resolve(results);
        });
    });
}
var getRecentMetrics = function(idList){
    return new Promise(function(resolve,reject){
        SI.find({session:{$in:idList}})
        .distinct('session')
        .exec(function(err,results){
            if(err){
                console.log('getMetricsIn error: ',err);
                reject(err);
            }else
                resolve(results);
        });
    });
}
var getMeetingStats = function(userId){
    return new Promise(function(resolve,reject){
        var stats = {
            all:{upcomming:0,completed:0,archived:0,stubs:[]},
            upcomming:{today:0,thisWeek:0,thisMonth:0,stubs:[]},
            completed:{today:0,thisWeek:0,thisMonth:0,stubs:[]},
        };
        var queryDate = moment().subtract(30,'days').toDate();
        console.log('queryDate is: ',queryDate);
        //get all the sessions for this user in the last 30 days
        getMeetings(userId,queryDate).then(function(meetings){
            var idList = [];
            console.log('getbyorganizer: returns ',meetings.length,' meetings');
            meetings.forEach(function(meeting){
                meeting.completed = false; // this is an in memory variable only to be used later
                stats.all.stubs.push(meeting);
                idList.push(meeting._id);
            });
            if(idList.length>0){
                console.log('idList: ',idList);
                getMetricsIn(idList).then(function(completed){
                    console.log('Completed : ',completed);
                    categorizeMeetings(stats,completed)
                    return getAllMeetings(userId);
                }).then(function(all){
                    stats.all = all;
                    resolve(stats);
                });
            }else{
                categorizeMeetings(stats,[]);
                getAllMeetings(userId).then(function(all){
                    stats.all = all;
                    resolve(stats);
                });
            }        
        }).catch(function(err){
            reject(err);
        });
    });
}

var getRecentInteractions = function(userId){
    return new Promise(function(resolve,reject){
        var queryDate = moment().subtract(7,'days').toDate();
        //first get all non-archived meetings for the user
        Session.find({
            organizer:new ObjectId(userId),
            archiveStatus: {$elemMatch:{id:new ObjectId(userId),isArchived:false}},
        })
        .execAsync().then(function(active){
            console.log('getRecentInteractions total active meetings: ',active.length);
            var idList = [];
            active.forEach(function(meeting){
                idList.push(meeting._id);
            });
            //now get all recent interactions for these sessions
            return  SI.find({session:{$in:idList},eventDate:{'$gt':queryDate},viewers:{$size:1} })
            .populate('session session.decks')
            .sort({eventDate:-1})
            .execAsync();
        }).then(function(interactions){
            console.log('getRecentInteractions found: ',interactions);
            resolve(interactions);
        }).catch(function(err){
            reject(err);
        });
    });
}

var averageEngagement = function(interactions,endDate){
    var totalInteractions = 0; // total interactions
    var totalDuration = 0; //sum of all durations
    var viewDuration = 0; //sum of all views
    var avgEngagement = 0.0; //the result
    var iDuration= 0; //total duration for a single interaction
    var iViewed = 0; //total view for a single interaction
    var sumEngagements = 0; //accumulate individual interaction engagement
    var interactionEngagement;
    var recentEngagement = 0;
    var data = [];
    var justRecent = [];
    interactions.forEach(function(interaction){
        if(endDate != undefined && recentEngagement == 0){//if there's an endDate, then check for limits
            var current = moment(interaction.eventDate);       
            if( current.isBefore(endDate)){
                console.log('Past Due Date: ',current.toDate(),endDate.toDate());
                console.log('Total Interactions : ',totalInteractions);
                console.log('Sum Engagements : ',sumEngagements);
                recentEngagement = (sumEngagements/totalInteractions)*100.0;
                justRecent = data.slice(0);
                console.log('Recent Engagement : ',recentEngagement);
            }
        } //otherwise keep processing
        iDuration = iViewed = 0;
        interaction.slideViews.forEach(function(sView){
            totalDuration += sView.duration;
            iDuration += sView.duration;
            var denom = sView.views.length;
            var viewSum = 0;
            sView.views.forEach(function(view){
                viewSum += view.viewed;
            });
            if(denom!=0){
                viewDuration += viewSum/denom;
                iViewed = viewSum/denom;
            }
        });
        interactionEngagement = iViewed/iDuration;
        if(interactionEngagement != 0){
            data.push({date:interaction.eventDate,engagement:interactionEngagement});
            console.log('Interaction Engagement : ', interactionEngagement);
            sumEngagements += interactionEngagement;
            totalInteractions++;
        }
    });
    //calculate the average engagement only if the denom != 0
    if(totalInteractions != 0){
        var aEng = (viewDuration/totalDuration)*100.0;
        var bEng = (sumEngagements/totalInteractions)*100.0;
        console.log('aEng bEng: ',aEng, bEng);
        avgEngagement = bEng;
    }
    if(recentEngagement == 0)
        recentEngagement = avgEngagement;
    return {recent:recentEngagement,
            recentData: justRecent,
            overall:avgEngagement,
            overallData:data
           };
}
                
    
var getEngagement = function(userId){
    return new Promise(function(resolve,reject){
        var queryDate = moment().subtract(30,'days');
        //first get all meetings for the user
        Session.find({
            organizer:new ObjectId(userId)
        })
        .execAsync().then(function(meetings){
            console.log('getEngagement total meetings: ',meetings.length);
            var idList = [];
            meetings.forEach(function(meeting){
                idList.push(meeting._id);
            });
            //now get all interactions for these sessions
            return  SI.find({session:{$in:idList}})
            .populate('session session.decks')
            .sort({eventDate:-1})
            .execAsync();
        }).then(function(interactions){
            console.log('getEngagement found: ',interactions.length);
            var engagement = averageEngagement(interactions,queryDate);
            resolve(engagement);
        }).catch(function(err){
            reject(err);
        });
    });
}
//handle requests for Dashboard objects
Dashboard.get('/dashboard/stats/files',function(req,res){
    console.log('Dashboard - get fileStats stats: ');
    var userId = req.query.userId;
    getFileStats(userId).then(function(statistics){
        res.send(statistics);
    }).catch(function(err){
        res.send(err);
    });
});
Dashboard.get('/dashboard/stats/meetings',function(req,res){
    console.log('Dashboard - get meeting stats: ');
    var userId = req.query.userId;
    getMeetingStats(userId).then(function(stats){
        res.send(stats);
    }).catch(function(err){
        res.send(err);
    });
});
Dashboard.get('/dashboard/stats/views',function(req,res){
    console.log('Dashboard - get views: ');
    var userId = req.query.userId;
    getRecentInteractions(userId).then(function(views){
        var i = {results:views}
        res.send(i);
    }).catch(function(err){
        console.log('Dashboard - get interactions ERROR!:',err);
        res.send(err);
    });
});

Dashboard.get('/dashboard/stats/engagement',function(req,res){
    console.log('Dashboard - get engagement: ');
    var userId = req.query.userId;
    getEngagement(userId).then(function(engagement){
        res.send(engagement);
    }).catch(function(err){
        console.log('Dashboard - get engagement ERROR!:',err);
        res.send(err);
    });
});

var testId = "5521a609e4897e41061d5a21";
Dashboard.get('/dashboard/meetingTest',function(req,res){
    getMeetingStats(testId).then(function(stats){
        res.send(stats);
    });
});
Dashboard.get('/dashboard/fileTest',function(req,res){
    getFileStats(testId).then(function(stats){
        res.send(stats);
    });
});
module.exports = Dashboard;
