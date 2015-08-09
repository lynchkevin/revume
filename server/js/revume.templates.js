angular.module('development').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/addDeckTemplate.html',
    "<ion-modal-view>\n" +
    "    <ion-header-bar class=\"bar-calm\"> <h1 class=\"title\"> Add a Deck </h1> \n" +
    "    <div class=\"buttons\">\n" +
    "      <button class=\"button button-clear button-light\" \n" +
    "              ng-click=\"sb.defer.pop().reject('cancel')\">Close</button>\n" +
    "    </div>\n" +
    "    </ion-header-bar> \n" +
    "    <ion-content> \n" +
    "        <ion-list >\n" +
    "            <ion-item ng-repeat=\"deck in sb.decks\" class=\"item-thumbnail-left item-button-right\" >\n" +
    "                <img ng-src=\"{{deck.thumb}}\" alt=\"New\" class=\"alt\">\n" +
    "                <h2>{{deck.name}} <span ng-show=\"deck.added\" class=\"add-color heavy\">-Added-</span></h2>\n" +
    "                <p>{{deck.user.firstName}} {{deck.user.lastName}}</p>\n" +
    "                <p>{{deck.createdDate | date:\"MM/dd/yyyy  h:mma\"}}</p>\n" +
    "                <button class=\"ion-plus-circled button icon button-icon add-color\" \n" +
    "                        ng-click=\"sb.addDeck($index)\"\n" +
    "                        ng-show=\"!deck.added\">\n" +
    "                </button>\n" +
    "                <button class=\"ion-minus-circled button icon button-icon del-color\" \n" +
    "                        ng-click=\"sb.delDeck($index)\"\n" +
    "                        ng-show=\"deck.added\">\n" +
    "                </button>\n" +
    "            </ion-item>\n" +
    "        </ion-list>\n" +
    "\n" +
    "    </ion-content>\n" +
    "    <ion-footer-bar>\n" +
    "        <div class=\"centered-container\">\n" +
    "          <button ng-disabled=\"sb.session.decks.length==0\"\n" +
    "                  class=\"button button-positive button-calm\"\n" +
    "                  ng-click=\"sb.defer.pop().resolve()\">\n" +
    "              Ok\n" +
    "          </button>\n" +
    "          <button class=\"button button-stable\" ng-click=\"sb.defer.pop().reject('cancel')\">\n" +
    "              Cancel\n" +
    "          </button>\n" +
    "        </div>\n" +
    "    </ion-footer-bar>\n" +
    "</ion-modal-view>"
  );


  $templateCache.put('templates/attendeeSessions.html',
    "<ion-view title=\"{{titles.attendee}}\">\n" +
    "  <ion-nav-buttons side=\"left\">\n" +
    "      <button menu-toggle=\"left\" class=\"button button-icon icon ion-navicon\"></button>\n" +
    "  </ion-nav-buttons>\n" +
    "  <ion-content class=\"has-header\">\n" +
    "        <div class=\"revu-list-header calm-bg\">\n" +
    "            <button ng-if=\"!archiveOn()\" \n" +
    "                    class=\"button button-icon icon ion-minus-circled revu-list-button revu-left\"\n" +
    "                     ng-click=\"toggleListDelete('att')\"\n" +
    "                   ></button>\n" +
    "            You're an Attendee:\n" +
    "        </div> \n" +
    "        <ion-scroll elem-height=\"0.8\">\n" +
    "      <ion-refresher\n" +
    "        pulling-text=\"Pull to refresh...\"\n" +
    "        on-refresh=\"doRefresh()\" >\n" +
    "      </ion-refresher>\n" +
    "            \n" +
    "        <ion-list show-delete=\"shouldShowDelete\" delegate-handle=\"att\">\n" +
    "          <ion-item class=\"item-thumbnail-left item-button-right\" ng-repeat=\"session in attSessions\" href=\"#/app/attsessions/{{session._id}}\">\n" +
    "            <ion-delete-button class=\"ion-minus-circled\" \n" +
    "                               ng-click=\"markAttArchive($index)\"\n" +
    "                               style=\"color:#ffe900\"></ion-delete-button>\n" +
    "              <img ng-src=\"{{session.decks[0].thumb}}\">\n" +
    "              <h2>{{session.name}}</h2>\n" +
    "              <p>{{session.date | date:\"MM/dd/yyyy\"}} {{session.time | date:\"h:mma\"}}</p>\n" +
    "              <ion-option-button ng-if=\"smallScreen()&&archiveOn()\" class=\"button button-energized\" \n" +
    "                      ng-click=\"markAttArchive($index); $event.preventDefault(); $event.stopPropagation();\">\n" +
    "                  UnArchive\n" +
    "              </ion-option-button>\n" +
    "              <button ng-if=\"!smallScreen()&&archiveOn()\" class=\"button item-button button-energized\" \n" +
    "                      ng-click=\"markAttArchive($index,$event); $event.preventDefault(); $event.stopPropagation();\">\n" +
    "                  UnArchive\n" +
    "              </button>\n" +
    "          </ion-item>\n" +
    "      </ion-list>\n" +
    "      </ion-scroll>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n" +
    "                    \n" +
    "                \n"
  );


  $templateCache.put('templates/attendeesession.html',
    "<ion-view view-title=\"{{session.name}}\" ng-cloak>\n" +
    "    <ion-content class=\"has-header\">\n" +
    "        <div class=\"list card\">\n" +
    "            <div class=\"item item-divider\">\n" +
    "                Meeting Detalis\n" +
    "            </div>\n" +
    "            <div class=\"item item-thumbnail-left item-button-right\">\n" +
    "                <img ng-src=\"{{session.decks[0].thumb}}\">\n" +
    "                <p><strong>Date:&#160&#160&#160&#160&#160&#160&#160&#160&#160&#160</strong>{{session.date | date:\"MM/dd/yyyy\"}}</p>  \n" +
    "                <p><strong>Time:&#160&#160&#160&#160&#160&#160&#160&#160&#160&#160</strong>{{session.time | date:\"h:mma\"}}</p>  \n" +
    "                <p><strong>Organizer:</strong>    \n" +
    "                    {{session.organizer.firstName}} {{session.organizer.lastName}}</p>\n" +
    "                <p ng-if=\"session.bridge && !isMobile\"><strong>Dial in: </strong>&#160&#160&#160&#160&#160&#160{{session.bridgeNumber}}</p>  \n" +
    "                <p ng-if=\"session.bridge && isMobile\"><strong>Dial in: </strong>&#160&#160&#160&#160&#160&#160<a href=\"tel:{{session.bridgeNumber}},,,{{session.confId}}#\">{{session.bridgeNumber}}</a></p>  \n" +
    "                <p><strong>meeting id: </strong>    {{session.ufId}}</p>\n" +
    "                <p ng-if=\"!bridgeService.activeBridge()\"\n" +
    "                   class=\"notice\">Join to Open Bridge</p>\n" +
    "                <p ng-if=\"bridgeService.activeBridge()\"\n" +
    "                   class=\"advise\">Bridge is Open</p>\n" +
    "                <button class=\"button button-positive\"\n" +
    "                        ng-click=\"go(session._id,0)\">\n" +
    "                    Join\n" +
    "                </button>\n" +
    "            </div>\n" +
    "            <div class=\"item item-divider\">\n" +
    "                Attendees\n" +
    "            </div>\n" +
    "            <div class=\"item\" >\n" +
    "                <span><strong>Organizer: </strong>{{session.organizer.firstName}} {{session.organizer.lastName}}</span><br>\n" +
    "                <span ng-repeat=\"attendee in session.attendees\">\n" +
    "                {{attendee.firstName}} {{attendee.lastName}}  e: {{attendee.email}} <br>\n" +
    "                </span>\n" +
    "            </div>\n" +
    "            <div class=\"item item-body\">\n" +
    "                {{session.description}}\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        \n" +
    "    </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/autocomplete.html',
    "      <ion-popover-view>\n" +
    "        <ion-content>\n" +
    "          <div class=\"list\">\n" +
    "            <div class=\"item\" ng-repeat=\"entry in auto.entries\">\n" +
    "                <p ng-click=\"finishComplete($index)\">{{entry.firstName}} {{entry.lastName}} </p>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </ion-content>\n" +
    "      </ion-popover-view>"
  );


  $templateCache.put('templates/batman.html',
    "\n" +
    "<ion-view view-title=\"Revu.Me Demo\">\n" +
    "  <ion-content ng-class=\"{'dark-bg':isMobile}\">\n" +
    "\n" +
    "    <div class=\"centered-container\"  >\n" +
    "    <div class=\"row row-center\">\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>\n" +
    "    <div class=\"col col-80 \">\n" +
    "     <!--   <img ng-src=\"{{image}}\" class=\"splash-image\"> -->\n" +
    "        <div class=\"centered-container hero-container positive-bg\" elem-height=\"0.20\">\n" +
    "              <h3 class=\"hero-welcome\">Welcome Batman </h3> \n" +
    "        </div>\n" +
    "    </div>\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>    \n" +
    "    </div>\n" +
    "    <div class=\"row row-center\">\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>\n" +
    "        <div class=\"col col-80\">\n" +
    "            <div class=\"centered-container user_list\">\n" +
    "            \n" +
    "          <ion-list>\n" +
    "              <div class=\"item item-divider\">\n" +
    "                Utility Belt\n" +
    "              </div>\n" +
    "              <ion-item ng-repeat=\"action in utility.actions\"\n" +
    "                        ng-click=\"action.action()\">\n" +
    "                <h2>{{action.name}}</h2>\n" +
    "              </ion-item>\n" +
    "              <ion-item>\n" +
    "                  <h2>Device Info:</h2>\n" +
    "                  <p>Platform: {{device.currentPlatform}}</p>\n" +
    "                  <p>Mobile:{{isMobile}}</p>\n" +
    "                  <p ng-if=\"device.isIPad\">iPad</p>\n" +
    "                  <p ng-if=\"device.isIOS\">IOS</p>\n" +
    "                  <p ng-if=\"device.isAndroid\">Android</p>\n" +
    "                  <p ng-if=\"device.isWindowsPhone\">WindowPhone</p>\n" +
    "              </ion-item>\n" +
    "              <ion-item>\n" +
    "                  <h2>User From Local Store</h2>\n" +
    "                  <p>Name: {{ls.user.name}}</p>\n" +
    "                  <p>Email: {{ls.user.email}}</p>\n" +
    "                  <p>_id: {{ls.user._id}}</p>\n" +
    "              </ion-item>\n" +
    "              <ion-item>\n" +
    "                  <h2>Total Cached Images</h2>\n" +
    "                  <p>{{library.cachedImages.length}}</p>\n" +
    "              </ion-item>\n" +
    "          </ion-list>    \n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>        \n" +
    "    </div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/buildSession.html',
    "  <ion-modal-view style=\"z-index:15\">\n" +
    "    <ion-header-bar class=\"bar-dark\">\n" +
    "      <h1 class=\"title\">New Meeting</h1>\n" +
    "        <div class=\"buttons\">\n" +
    "          <button class=\"button button-clear button-light\" ng-click=\"sb.defer.pop().reject()\">Close</button>\n" +
    "        </div>\n" +
    "    </ion-header-bar>\n" +
    "    <ion-content class=\"ionic-modal-hack\">\n" +
    "        <div class=\"revu-list-header positive-bg\">\n" +
    "            <button class=\"button button-icon icon ion-minus-circled revu-list-button revu-left\"\n" +
    "                    ng-click=\"toggleListDelete('sb')\">\n" +
    "            </button>\n" +
    "                Add or Remove Decks\n" +
    "            <button class=\"button button-icon icon ion-plus-circled revu-list-button revu-right\"\n" +
    "                    ng-click=\"sb.subEdit()\">\n" +
    "            </button>\n" +
    "        </div> \n" +
    "        <form name=\"sb.sessionForm\">\n" +
    "            <ion-list show-delete=\"shouldShowDelete\" delegate-handle=\"sb\" >\n" +
    "              <ion-item ng-repeat=\"deck in sb.session.decks\" \n" +
    "                        class=\"item item-thumbnail-left\">\n" +
    "                <ion-delete-button class=\"ion-minus-circled\" \n" +
    "                               ng-click=\"sb.delDeck($index)\"></ion-delete-button>\n" +
    "                <img class=thumb-small ng-src=\"{{deck.thumb}}\" alt=\"New\" class=\"alt\">\n" +
    "                <h2>{{deck.name}}</h2>\n" +
    "                    <p>{{deck.user.firstName}} {{deck.user.lastName}}</p>\n" +
    "                    <p>{{deck.createdDate | date:\"MM/dd/yyyy  h:mma\"}}</p>\n" +
    "              </ion-item>\n" +
    "            </ion-list>\n" +
    "              <label class=\"item item-input\">\n" +
    "                <span class=\"input-label\">Name</span>\n" +
    "                <input type=\"text\" ng-model=\"sb.session.name\" placeholder=\"Meeting Name\" required>\n" +
    "              </label>\n" +
    "              <label class=\"item item-input\">\n" +
    "                <span class=\"input-label\">Description</span>\n" +
    "                <input type=\"text\" ng-model=\"sb.session.description\" placeholder=\"Description\">\n" +
    "              </label>\n" +
    "              <label class=\"item item-input \">\n" +
    "                <span class=\"input-label\">Date</span>\n" +
    "                <input type=\"Date\" name=\"date\" ng-model=\"sb.session.date\" placeholder=\"Date\" required>\n" +
    "              </label>\n" +
    "              <div class=\"row\">\n" +
    "                <div class=\"col col-50\">\n" +
    "                  <label class=\"item item-input\">\n" +
    "                    <span class=\"input-label\">Time</span>\n" +
    "                    <input type=\"Time\" name=\"time\" ng-model=\"sb.session.time\" placeholder=\"Time\" required>\n" +
    "                  </label>\n" +
    "                </div>\n" +
    "                <div class=\"col col-50\">\n" +
    "                  <label class=\"item item-input\">\n" +
    "                    <span class=\"input-label\">length</span>\n" +
    "                    <select ng-model=\"sb.session.length\">\n" +
    "                        <option ng-repeat=\"l in sb.session.lengthOptions\">{{l}}</option>\n" +
    "                    </select>\n" +
    "                  </label>    \n" +
    "                </div>\n" +
    "             </div>\n" +
    "            <!--\n" +
    "              <div class=\"row\">\n" +
    "                <div class=\"col col-50\">\n" +
    "                <div class=\"item item-checkbox\">\n" +
    "                     <label class=\"checkbox\">\n" +
    "                       <input ng-model=\"sb.session.showTeams\" type=\"checkbox\">\n" +
    "                     </label>\n" +
    "                     Add Teams?\n" +
    "                </div>\n" +
    "                </div>\n" +
    "                <div class=\"col col-50\">\n" +
    "                  <label class=\"item item-input\">\n" +
    "                    <span class=\"input-label\">length</span>\n" +
    "                    <select ng-model=\"sb.session.length\">\n" +
    "                        <option ng-repeat=\"l in sb.session.lengthOptions\">{{l}}</option>\n" +
    "                    </select>\n" +
    "                  </label>    \n" +
    "                </div>\n" +
    "             </div>\n" +
    "            -->\n" +
    "                <div class=\"list\">\n" +
    "                    <div class=\"item item-input-inset\">\n" +
    "                        <label class=\"item-input-wrapper\">\n" +
    "                          <input type=\"text\" name=\"aName\" \n" +
    "                                    user-complete\n" +
    "                                    field-type='name'\n" +
    "                                    instance-name='session'\n" +
    "                                ng-model=\"sb.session.formname\" placeholder=\"Attendee Name\">\n" +
    "                        </label>\n" +
    "                        <label class=\"item-input-wrapper\">\n" +
    "                          <input type=\"email\" name=\"aEmail\" \n" +
    "                                    user-complete\n" +
    "                                    field-type='email'\n" +
    "                                    instance-name='session'\n" +
    "                                 ng-model=\"sb.session.formemail\" placeholder=\"Attendee Email\">\n" +
    "                        </label>\n" +
    "                        <button class=\"button button-small\"\n" +
    "                                ng-click=\"sb.addAttendee()\" \n" +
    "                                ng-disabled=\"!sb.sessionForm.aName.$dirty || !sb.sessionForm.aEmail.$dirty \n" +
    "                                             || sb.sessionForm.aEmail.$invalid\">\n" +
    "                          add\n" +
    "                        </button>\n" +
    "                    </div>\n" +
    "                    <div class=\"item item-divider item-button-right\">\n" +
    "                        Attendees\n" +
    "                        <button class=\"button button-small button-positive divider-button\"\n" +
    "                                ng-click=\"sb.session.showTeams=!sb.session.showTeams\">Add Teams?</button>\n" +
    "                    </div> \n" +
    "                    <div class=\"item item-button-right\"\n" +
    "                         ng-if=\"sb.session.showTeams && sb.session.teamList.length > 0\"\n" +
    "                         style=\"padding:0px\">\n" +
    "                          <label class=\"item-input\">\n" +
    "                            <span class=\"input-label\"\n" +
    "                                  style=\"width:20%\">Teams</span>\n" +
    "                            <select ng-model=\"sb.session.team\" ng-options=\"t.name for t in sb.session.teamList\">\n" +
    "                            </select>\n" +
    "                          </label> \n" +
    "                            <button class=\"button button-small\"\n" +
    "                                    ng-click=\"sb.addTeam()\" \n" +
    "                                    style=\"font-size:14px\"\n" +
    "                                    ng-class=\"{'shove-right':smallScreen() == false}\">\n" +
    "                              add\n" +
    "                            </button>\n" +
    "                    </div>\n" +
    "                        <div class=\"list\">\n" +
    "                            <div ng-repeat=\"attendee in sb.session.attendees\" class=\"item item-icon-left\" >\n" +
    "                                <i class=\"icon ion-minus-circled \" style=\"font-size:95%\" ng-click=\"sb.delAttendee($index)\">\n" +
    "                                <p class=\"padding-left\">{{sb.session.attendees[$index].name}}     {{sb.session.attendees[$index].email}}</p>         \n" +
    "                                </i>\n" +
    "\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        <div class=\"item item-checkbox\">\n" +
    "                             <label class=\"checkbox\">\n" +
    "                               <input ng-model=\"sb.session.bridge\" type=\"checkbox\">\n" +
    "                             </label>\n" +
    "                             conference bridge\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"centered-container\">\n" +
    "                 <button class=\"button button-positive\" ng-click=\"sb.defer.pop().resolve()\" \n" +
    "                         ng-disabled=\"sb.sessionForm.$invalid\">\n" +
    "                    OK\n" +
    "                </button>\n" +
    "                <button class=\"button padding-left button-stable\" ng-click=\"sb.defer.pop().reject()\">\n" +
    "                    Cancel\n" +
    "                </button>          \n" +
    "            </div>\n" +
    "            <div class=\"centered-container\">\n" +
    "                <p ng-show=\"sb.sessionForm.sName.$invalid\">Session Name is Required</p>\n" +
    "                <p ng-show=\"sb.sessionForm.date.$invalid\">Session Date is Required</p>\n" +
    "                <p ng-show=\"sb.sessionForm.time.$invalid\">Session Time is Required</p>            \n" +
    "            </div>\n" +
    "\n" +
    "        </form>\n" +
    "      \n" +
    "    </ion-content>\n" +
    "  </ion-modal-view>\n"
  );


  $templateCache.put('templates/changePassword.html',
    "\n" +
    "<ion-view view-title=\"Change Password\">\n" +
    "  <ion-content ng-class=\"{'dark-bg':isMobile}\">\n" +
    "\n" +
    "    <div class=\"centered-container\"  >\n" +
    "    <div class=\"row row-center\">\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>\n" +
    "    <div class=\"col col-80 \">\n" +
    "     <!--   <img ng-src=\"{{image}}\" class=\"splash-image\"> -->\n" +
    "        <div class=\"centered-container hero-container positive-bg padding-bottom rounded-corners\" >\n" +
    "            <span class=\"hero-header\">Revu.Me</span> \n" +
    "            <div class=\"signup-form\">\n" +
    "                <form name=\"forms.resetPw\" ng-controller=\"changePasswordCtrl\">\n" +
    "                    <div class=\"list list-inset\">\n" +
    "                      <label class=\"item item-input\">\n" +
    "                        <span class=\"input-label\">Email</span>\n" +
    "                        <input name=\"inpEmail\"\n" +
    "                               ng-model=\"forms.resetPw.email\"\n" +
    "                               type=\"email\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                      <div class=\"input-spacer positive-bg\"></div>\n" +
    "                      <label class=\"item item-input\">\n" +
    "                        <span class=\"input-label\">Old Password</span>\n" +
    "                        <input name=\"inpOldPassword\"\n" +
    "                               ng-model=\"forms.resetPw.oldPassword\"\n" +
    "                               type=\"password\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                      <div class=\"input-spacer positive-bg\"></div>\n" +
    "                      <label class=\"item item-input\">\n" +
    "                        <span class=\"input-label\">New Password</span>\n" +
    "                        <input name=\"inpNewPassword\"\n" +
    "                               ng-model=\"forms.resetPw.newPassword\"\n" +
    "                               type=\"password\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                      <div class=\"input-spacer positive-bg\"></div>\n" +
    "                      <label class=\"item item-input\">\n" +
    "                        <span class=\"input-label\">Retype PW</span>\n" +
    "                        <input name=\"inpResetPW\"\n" +
    "                               ng-model=\"forms.resetPw.repeat\"\n" +
    "                               type=\"password\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                    </div>\n" +
    "                    <button class=\"button \"\n" +
    "                            ng-click=\"resetPassword()\"\n" +
    "                            ng-disabled=\"!forms.resetPw.inpEmail.$dirty ||\n" +
    "                                         forms.resetPw.inpEmail.$invalid ||\n" +
    "                                         !forms.resetPw.inpOldPassword.$dirty ||\n" +
    "                                         !forms.resetPw.inpNewPassword.$dirty ||\n" +
    "                                         !forms.resetPw.inpResetPW.$dirty\">\n" +
    "                        Change Password\n" +
    "                    </button>\n" +
    "                    <div>\n" +
    "                        <span ng-if=\"forms.resetPw.inpEmail.$dirty && forms.resetPw.inpEmail.$invalid\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            Invalid Email Format\n" +
    "                        </span>\n" +
    "                        <span ng-if=\"forms.resetPw.inpOldPassword.$dirty &&\n" +
    "                                     forms.resetPw.inpOldPassword.$error.required\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            Old Password is Required\n" +
    "                        </span>    \n" +
    "                        <span ng-if=\"forms.resetPw.inpNewPassword.$dirty &&\n" +
    "                                     forms.resetPw.inpNewPassword.$error.required\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            New Password is Required\n" +
    "                        </span>   \n" +
    "                        <span ng-if=\"forms.resetPw.inpResetPW.$dirty &&\n" +
    "                                     forms.resetPw.inpResetPW.$error.required\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            Please Retype New Password\n" +
    "                        </span>                       \n" +
    "                    </div>\n" +
    "                </form>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>    \n" +
    "    </div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/contentRemoved.html',
    "<ion-modal-view>\n" +
    "    <ion-content> \n" +
    "        <div class=\"centered-container hero-container positive-bg\" style=\"margin-top:20px\" elem-height=\"0.50\">\n" +
    "              <span class=\"hero\" >Revu.me</span>\n" +
    "              <h3 class=\"hero-welcome\">The Presenter Closed this Meeting</h3> \n" +
    "        </div>\n" +
    "    </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('templates/editProfile.html',
    "\n" +
    "<ion-view view-title=\"Your Profile\">\n" +
    "  <ion-content ng-class=\"{'dark-bg':isMobile}\">\n" +
    "\n" +
    "    <div class=\"centered-container\"  >\n" +
    "    <div class=\"row row-center\">\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>\n" +
    "    <div class=\"col col-80 \">\n" +
    "     <!--   <img ng-src=\"{{image}}\" class=\"splash-image\"> -->\n" +
    "        <div class=\"centered-container hero-container positive-bg padding-bottom\" >\n" +
    "            <span class=\"hero-header\">Revu.Me</span> \n" +
    "            <div class=\"signup-form\">\n" +
    "                <form name=\"forms.signup\" ng-controller=\"signupCtrl\">\n" +
    "                    <div class=\"list list-inset\">\n" +
    "                      <label class=\"item item-input\">\n" +
    "                        <span class=\"input-label\">First Name</span>\n" +
    "                        <input name=\"fName\"\n" +
    "                               ng-model=\"forms.signup.firstName\"\n" +
    "                               type=\"text\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                      <div class=\"input-spacer positive-bg\"></div>\n" +
    "                      <label class=\"item item-input\">\n" +
    "                        <span class=\"input-label\">Last Name</span>\n" +
    "                        <input name=\"lName\"\n" +
    "                               ng-model=\"forms.signup.lastName\"\n" +
    "                               type=\"text\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                      <div class=\"input-spacer positive-bg\"></div>\n" +
    "                      <label class=\"item item-input\">\n" +
    "                        <span class=\"input-label\">Email</span>\n" +
    "                        <input name=\"inpEmail\"\n" +
    "                               ng-model=\"forms.signup.email\"\n" +
    "                               type=\"email\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                    </div>\n" +
    "                    <button class=\"button \"\n" +
    "                            ng-click=\"updateProfile()\"\n" +
    "                            ng-disabled=\"!forms.signup.fName.$dirty || \n" +
    "                                         !forms.signup.lName.$dirty || \n" +
    "                                         !forms.signup.inpEmail.$dirty || \n" +
    "                                         forms.signup.inpEmail.$invalid\">\n" +
    "                        Update\n" +
    "                    </button>\n" +
    "                    <div>\n" +
    "                        <span ng-if=\"forms.signup.inpEmail.$dirty && forms.signup.inpEmail.$invalid\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            Invalid Email Format\n" +
    "                        </span> \n" +
    "                        <span ng-if=\"forms.signup.fName.$dirty && forms.signup.fName.$error.required\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            First Name is Required\n" +
    "                        </span>  \n" +
    "                            <span ng-if=\"forms.signup.lName.$dirty && forms.signup.lName.$error.required\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            Last Name is Required\n" +
    "                        </span>  \n" +
    "                    </div>\n" +
    "\n" +
    "                </form>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>    \n" +
    "    </div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/emailConfirmed.html',
    "\n" +
    "<ion-view view-title=\"Revu.Me\">\n" +
    "  <ion-content ng-class=\"{'dark-bg':isMobile}\">\n" +
    "\n" +
    "    <div class=\"centered-container\"  >\n" +
    "    <div class=\"row row-center\">\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>\n" +
    "    <div class=\"col col-80 \">\n" +
    "     <!--   <img ng-src=\"{{image}}\" class=\"splash-image\"> -->\n" +
    "        <div class=\"centered-container hero-container positive-bg\" elem-height=\"0.50\">\n" +
    "              <h3 class=\"hero-welcome\">Thank You {{user.firstName}} </h3> \n" +
    "              <h3 class=\"hero-welcome\">Your Email is Confirmed</h3>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>    \n" +
    "    </div>\n" +
    "   \n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/iframe.html',
    "<ion-view title=\"iFrame\">\n" +
    "    <ion-content class=\"has-header slideshow-container\" scroll=\"false\">\n" +
    "        <div class=\"centered-container slide\" >\n" +
    "            <div class=\"row\">\n" +
    "                <div class=\"col col-10\">\n" +
    "                </div>\n" +
    "                <div class=\"col col-80\" elem-height=\"0.90\">\n" +
    "                        <ion-slide-box disable-scroll=\"true\"  class=\"bordered-drop-shadow\" elem-height=\"0.9\">\n" +
    "<!--                            <ion-slide ng-repeat=\"slide in presentation.slides\">\n" +
    "\n" +
    "                              <div ng-switch on=\"slide.type\">\n" +
    "                                    <div ng-switch-when=\"img\">\n" +
    "                                        <img ng-src=\"{{slide.source}}\" class=\"slide-content\" >\n" +
    "                                    </div>\n" +
    "                                    <div ng-switch-when=\"video\">                            \n" +
    "                                        <video class=\"slide-content\" controls=\"controls\"  v-follow={{$index}}>\n" +
    "                                         <source src=\"http://static.videogular.com/assets/videos/videogular.mp4\" type='video/mp4' />\n" +
    "                                         <source src=\"http://static.videogular.com/assets/videos/videogular.webm\" type='video/webm' />\n" +
    "                                         <source src=\"http://static.videogular.com/assets/videos/videogular.ogg\" type='video/ogg' />\n" +
    "                                        </video>                      \n" +
    "                                     </div> \n" +
    "-->\n" +
    "                                    <iframe  src=\"http://www.apple.com\" class=\"slide-content\" elem-height=\"0.9\" mirror-it>\n" +
    "                                    </iframe>\n" +
    "<!--\n" +
    "                                </div>                    \n" +
    "                            </ion-slide>\n" +
    "-->                     </ion-slide-box>\n" +
    "                     <div class=\"presence-message\" appear-up=\"show_message\">\"\"</div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"col col-10 \">\n" +
    "                </div>  \n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/libNav.html',
    "<ion-view view-title=\"{{title}}\">\n" +
    "  <ion-content  class=\"slideshow-container centered-container\">\n" +
    "    <div class=\"revu-list-header positive-bg\">\n" +
    "        <button class=\"button button-icon icon ion-chevron-left revu-list-button revu-left\"\n" +
    "                ng-click=\"slideBack()\"></button>\n" +
    "        {{navItems[selectedNavId].name}}\n" +
    "    </div>\n" +
    "        <add-template template-url=\"templates/slideItems.html\"></add-template>\n" +
    "\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "\n" +
    " <ion-content slide-right=\"library::slide\" style=\"background:white\">\n" +
    "        <add-template template-url=\"templates/navItems.html\"></add-template>\n" +
    "  </ion-content>  \n" +
    "      \n" +
    "    <tour-step step-name=\"MobileLibrary\" ext=\"tourShow()\"></tour-step>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/library.html',
    "\n" +
    "<ion-view view-title=\"{{title}}\"\n" +
    "          ng-cloak>\n" +
    "\n" +
    "\n" +
    "  <ion-content      has-bouncing=\"false\"\n" +
    "                    ng-class=\"{'slideshow-container':!archiveOn(),'archive-container':archiveOn()}\">\n" +
    "\n" +
    "    <div class=\"row \" style=\"padding:0px 5px 0px 0px;\">\n" +
    "        <div class=\"{{navClass}}\" style=\"padding:0px 5px 0px 0px;\">\n" +
    "            <add-template template-url=\"templates/navItems.html\"></add-template>\n" +
    "        </div>\n" +
    "        <div class=\"{{thumbClass}}\">\n" +
    "             <add-template template-url=\"templates/slideItems.html\"></add-template>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "  </ion-content>\n" +
    "    <div class=\"presence-message dark-bg centered-container\" appear-up=\"show_message\">\"\"</div>   \n" +
    "    <tour-step step-name=\"Library\" ext=\"tourShow()\"></tour-step>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/menu.html',
    "<ion-side-menus enable-menu-with-back-views=\"true\">\n" +
    "  <ion-side-menu-content>\n" +
    "    <ion-nav-bar class=\"bar-dark\">\n" +
    "      <ion-nav-back-button class=\"button-clear\">\n" +
    "        <i class=\"ion-arrow-left-c\"></i> Back\n" +
    "      </ion-nav-back-button>\n" +
    "      <ion-nav-buttons side=\"left\">\n" +
    "        <button class=\"button button-icon button-clear ion-navicon\" menu-toggle=\"left\"\n" +
    "                ng-if=\"!deepLink\">\n" +
    "        </button>\n" +
    "        <a class=\"button button-icon button-clear ion-home\" \n" +
    "                ng-if=\"deepLink\"\n" +
    "                href=\"http://revu.me\">\n" +
    "        </a>\n" +
    "      </ion-nav-buttons>\n" +
    "    </ion-nav-bar>\n" +
    "    <ion-nav-view name=\"menuContent\"></ion-nav-view>\n" +
    "  </ion-side-menu-content>\n" +
    "\n" +
    "  <ion-side-menu side=\"left\">\n" +
    "    <ion-header-bar ng-class={'bar-calm':!archive.menu,'bar-stable':archive.menu}>\n" +
    "      <h1 ng-if=\"!archive.menu\" class=\"title\">Menu</h1>\n" +
    "      <h1 ng-if=\"archive.menu\" class=\"title\">Archive</h1>\n" +
    "    </ion-header-bar>\n" +
    "    <ion-content >\n" +
    "      <ion-list>\n" +
    "        <!-- Non-Archive Menu Items -->\n" +
    "        <ion-item ng-if=\"!archive.menu\" nav-clear menu-close href=\"#/app/settings\">\n" +
    "        <i class='ion-gear-b menu-icon dark'></i>{{user.name}}\n" +
    "        </ion-item>\n" +
    "        <ion-item nav-clear menu-close ng-if=\"smallScreen()&&!archive.menu\" href=\"#/app/mobile/library\">\n" +
    "          <i class='ion-ios-paper menu-icon royal'></i>Library\n" +
    "        </ion-item>\n" +
    "        <ion-item nav-clear menu-close ng-if=\"!smallScreen()&&!archive.menu\" href=\"#/app/library\">\n" +
    "          <i class='ion-ios-paper menu-icon royal'></i>Library\n" +
    "        </ion-item>\n" +
    "        <ion-item ng-if=\"!archive.menu\" nav-clear menu-close href=\"#/app/teams\">\n" +
    "          <i class='ion-android-contacts menu-icon positive'></i>Teams\n" +
    "        </ion-item>\n" +
    "        <ion-item ng-if=\"!archive.menu\" nav-clear menu-close href=\"#/app/sessions\">\n" +
    "          <i class='ion-speakerphone menu-icon balanced'></i>Meetings You Lead\n" +
    "        </ion-item>\n" +
    "        <ion-item ng-if=\"!archive.menu\" nav-clear menu-close href=\"#/app/attendeeSessions\">\n" +
    "           <i class='ion-calendar menu-icon calm'></i>Meeting Invitations\n" +
    "        </ion-item>\n" +
    "        <ion-item ng-if=\"!archive.menu\" nav-clear menu-close ng-click=\"toggleArchive()\">\n" +
    "           <i class='ion-filing menu-icon energized'></i>Archive\n" +
    "        </ion-item>\n" +
    "        <ion-item ng-if=\"!archive.menu\" nav-clear menu-close href=\"#/app/welcome\">\n" +
    "           <i class='ion-compass menu-icon dark'></i>Restart Tour\n" +
    "        </ion-item>\n" +
    "        <!-- Archive Menu Items -->\n" +
    "        <ion-item ng-if=\"archive.menu\" nav-clear menu-close ng-click=\"toggleArchive()\">\n" +
    "        <i class='ion-arrow-left-b menu-icon dark'></i>Main Menu\n" +
    "        </ion-item>\n" +
    "        <ion-item nav-clear menu-close\n" +
    "                  ng-if=\"smallScreen()&&archive.menu\"\n" +
    "                  href=\"#/app/mobile/library\">\n" +
    "          <i class='ion-ios-paper menu-icon royal'></i>Library\n" +
    "        </ion-item>\n" +
    "        <ion-item nav-clear menu-close\n" +
    "                  ng-if=\"!smallScreen()&&archive.menu\" \n" +
    "                  href=\"#/app/library\">\n" +
    "          <i class='ion-ios-paper menu-icon royal'></i>Library\n" +
    "        </ion-item>\n" +
    "        <ion-item ng-if=\"archive.menu\" nav-clear menu-close \n" +
    "                  href=\"#/app/sessions\">\n" +
    "          <i class='ion-speakerphone menu-icon balanced'></i>Past Meetings\n" +
    "        </ion-item>\n" +
    "        <ion-item ng-if=\"archive.menu\" nav-clear menu-close \n" +
    "                  href=\"#/app/attendeeSessions\">\n" +
    "           <i class='ion-calendar menu-icon calm'></i>Past Invitations\n" +
    "        </ion-item>\n" +
    "        <!-- backdoor menu item for me -->\n" +
    "        <ion-item ng-if=\"user.email=='klynch@volerro.com' || user.batman\" nav-clear menu-close href=\"#/app/batman\">\n" +
    "\n" +
    "        </ion-item>\n" +
    "      </ion-list>\n" +
    "    </ion-content>\n" +
    "  </ion-side-menu>\n" +
    "</ion-side-menus>\n"
  );


  $templateCache.put('templates/navItems.html',
    "\n" +
    "            <div class=\"lib-list-header\">\n" +
    "                <div class=\"button-bar bar-positive\">\n" +
    "                  <a class=\"button\" \n" +
    "                     ng-click=\"setModel('files')\" \n" +
    "                     ng-class=\"{'tab-selected': modelName=='files'}\">Files</a>\n" +
    "                  <a class=\"button\" \n" +
    "                     ng-click=\"setModel('categories')\" \n" +
    "                     ng-class=\"{'tab-selected': modelName=='categories'}\">Categories</a>                  \n" +
    "                  <a class=\"button\" \n" +
    "                     ng-click=\"setModel('decks')\"\n" +
    "                     ng-class=\"{'tab-selected': modelName=='decks'}\">Decks</a>\n" +
    "                </div>\n" +
    "            </div>            \n" +
    "            <div class=\"revu-list-header calm-bg\">\n" +
    "            <button ng-if=\"archiveOn()\"\n" +
    "                    class=\"button button-icon icon ion-minus-circled revu-list-button revu-left\"\n" +
    "                    ng-click=\"toggleListDelete()\"></button>\n" +
    "                <p  class=\"sub-title\"\n" +
    "                    ng-if=\"modelName=='decks'&&smallScreen()\">(options:swipe left)</p>   \n" +
    "                {{listName}}\n" +
    "            <button class=\"button button-icon icon ion-plus-circled revu-list-button revu-right\"\n" +
    "                    ng-click=\"toggleNavAdd()\"\n" +
    "                    ng-if=\"!archiveOn()\"></button>\n" +
    "                </div>\n" +
    "            </div> \n" +
    "            <div ng-show=\"showAddItem\" >\n" +
    "                <div ng-switch on=\"modelName\">\n" +
    "                    <div ng-switch-when='files'>\n" +
    "\n" +
    "<!------evaporate testing------------->\n" +
    "                        <div ng-show=\"evaData.ready\">\n" +
    "                            <div class=\"flow-drop-zone centered-container\" \n" +
    "                                 drag-enter=\"class='flow-drag-enter'\" \n" +
    "                                 drag-leave=\"class='flow-drag-leave'\" \n" +
    "                                 evaporate eva-model=\"evaData\"\n" +
    "                                 ng-class=\"class\"\n" +
    "                                 ng-if=\"!device.IOS() && !device.isIPad() && !device.isAndroid() && !device.isWindowsPhone()\">\n" +
    "                                <p>Drop your file(s) here</p>     \n" +
    "                            </div>\n" +
    "                                    <!--ion-spinner icon=\"ios\" class=\"upload-spinner\" ng-if=\"file.spinner\" ></ion-spinner--> \n" +
    "                            <ion-list ng-if=\"library.uploading.files.length > 0\">\n" +
    "                                <ion-item ng-repeat=\"file in library.uploading.files\"\n" +
    "                                          class=\"upload-content\" ng-cloak>\n" +
    "                                    <ion-spinner icon=\"ios\" class=\"upload-spinner\" ng-if=\"file.spinner\" ></ion-spinner> \n" +
    "                                    <h2>{{file.name}}</h2>\n" +
    "                                    <p ng-show=\"file.timeLeft != 0\">{{file.timeLeft}} seconds remaining...</p>\n" +
    "                                    <p ng-show=\"file.message != ''\">{{file.message}}</p>\n" +
    "                                    <div ng-show=\"!file.spinner\"\n" +
    "                                         class=\"progress-bar\" \n" +
    "                                         elem-height=\"0.01\" \n" +
    "                                         ng-style=\"{'width':file.progressString}\">\n" +
    "                                    </div>\n" +
    "                                </ion-item>\n" +
    "                            </ion-list>\n" +
    "                        </div>\n" +
    "<!---------end evaporate-------------->\n" +
    "                    </div>\n" +
    "                    <div ng-switch-when='categories'>\n" +
    "                        <form name=\"categoryForm\">\n" +
    "                        <div class=\"list\">\n" +
    "                          <div class=\"item item-input-inset\">\n" +
    "                            <label class=\"item-input-wrapper\">\n" +
    "                              <input type=\"text\" ng-model=\"category.name\" placeholder=\"Category Name:\" required>\n" +
    "                            </label>\n" +
    "                            <button ng-click=\"addCategory()\" ng-disabled=\"categoryForm.$invalid\" class=\"button button-small\">\n" +
    "                              Submit\n" +
    "                            </button>\n" +
    "                          </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div ng-switch-when='decks'>\n" +
    "                        <form name=\"deckForm\">\n" +
    "                        <div class=\"list\">\n" +
    "                          <div class=\"item item-input-inset\">\n" +
    "                            <label class=\"item-input-wrapper\">\n" +
    "                              <input type=\"text\" name=\"deckName\" \n" +
    "                                     ng-model=\"deck.name\" placeholder=\"Deck Name:\" required>\n" +
    "                            </label>\n" +
    "                            <button ng-click=\"addDeck()\" \n" +
    "                                    ng-disabled=\"deckForm.$invalid\" \n" +
    "                                    class=\"button button-small\">\n" +
    "                              Submit\n" +
    "                            </button>\n" +
    "                          </div>\n" +
    "                        </div>\n" +
    "                        </form>\n" +
    "                    </div>\n" +
    "                </div>                    \n" +
    "            </div>\n" +
    "            <ion-scroll elem-height=\"0.70\" >\n" +
    "              <ion-refresher\n" +
    "                pulling-text=\"Pull to refresh...\"\n" +
    "                on-refresh=\"doRefresh()\"\n" +
    "                spinner=\"ripple\">\n" +
    "              </ion-refresher>\n" +
    "            <ion-list show-delete=\"shouldShowDelete\">\n" +
    "                <ion-item \n" +
    "                          ng-repeat=\"(itemIndex,item) in navItems\" \n" +
    "                          class=\"item-thumbnail-left\" \n" +
    "                          ng-class=\"{'item-select':!archiveOn()}\"\n" +
    "                          ng-click=\"setNavSelection($index)\">\n" +
    "                        <ion-delete-button ng-if=\"!archiveOn()\"\n" +
    "                                           class=\"ion-minus-circled\" \n" +
    "                                           ng-click=\"archiveNavItem($index)\"\n" +
    "                                           ng-disabled=\"!item._$Archive\"\n" +
    "                                           style=\"color:#ffe900\">\n" +
    "                        </ion-delete-button>\n" +
    "                        <ion-delete-button ng-if=\"archiveOn()\"\n" +
    "                                           class=\"ion-minus-circled\" \n" +
    "                                           ng-click=\"delNavItem($index)\"\n" +
    "                                           ng-disabled=\"!item._$Delete\">\n" +
    "                        </ion-delete-button>\n" +
    "                        <img ng-if=\"item.slides.length != 0\"\n" +
    "                             ng-src=\"{{item.thumb}}\"  class=\"white-background\">\n" +
    "                        <h2>{{item.name}}</h2>\n" +
    "                        <p>{{item.user.firstName}} {{item.user.lastName}}</p>\n" +
    "                        <p>{{item.createdDate | date:\"MM/dd/yyyy  h:mma\"}}</p>  \n" +
    "                        <span ng-if=\"item.sharingString\" class=\"positive\">Sharing:{{item.sharingString}}</span>\n" +
    "                            <select ng-if=\"!smallScreen() && item.actions.length > 1 && !archiveOn()\"\n" +
    "                                    ng-model=\"item.action.selected\"\n" +
    "                                    ng-options=\"action.name for action in item.actions\"\n" +
    "                                    ng-change=\"item.action.selected.callBack(itemIndex,item.action.selected.idx,$event,'option')\"\n" +
    "                                    ng-class=\"{'edit-color':item.beingEdited}\">\n" +
    "                                {{option.callBack}}\n" +
    "                            </select>\n" +
    "                            <div class=\"buttons\">\n" +
    "                            <button ng-if=\"!smallScreen()&&archiveOn()\"\n" +
    "                                    class=\"button button-energized archive-button\"\n" +
    "                                    ng-click=\"unArchiveNavItem($index,$event)\">\n" +
    "                                UnArchive\n" +
    "                            </button>\n" +
    "                            </div>\n" +
    "                            <ion-option-button\n" +
    "                                    ng-repeat=\"action in item.actions\"\n" +
    "                                    ng-model=\"item.action.selected\"\n" +
    "                                    ng-if=\"smallScreen() && $index!=0 && !archiveOn()\"\n" +
    "                                    ng-click=\"action.callBack(itemIndex,$index,$event,'button')\"\n" +
    "                                    class=\"button ng-class:action.class;\">\n" +
    "                                {{action.name}}\n" +
    "                            </ion-option-button>\n" +
    "                            <ion-option-button\n" +
    "                                    ng-if=\"smallScreen() && archiveOn()\"\n" +
    "                                    class=\"button button-energized\"\n" +
    "                                    ng-click=\"unArchiveNavItem($index,$event)\">\n" +
    "                                UnArchive\n" +
    "                            </ion-option-button>\n" +
    "                    <i class=\"icon ion-plus-circled slide-adder top-corner\" \n" +
    "                       ng-show=\"isEditing && !showEdit && (selectedNavId == $index) \"  \n" +
    "                       ng-click=\"addAll()\"></i>\n" +
    "                    <p  class=\"top-corner\"\n" +
    "                        ng-show=\"isEditing && !showEdit && (selectedNavId == $index) \" >select all</p>\n" +
    "                </ion-item>\n" +
    "            </ion-list>\n" +
    "            </ion-scroll>\n" +
    "        \n" +
    "           <!--    ng-change=\"option.callBack(itemIndex,$idx,$event,'option')\"-->\n"
  );


  $templateCache.put('templates/newTeamTemplate.html',
    "<ion-modal-view>\n" +
    "  <ion-header-bar class=\"bar-positive\">\n" +
    "    <h1 class=\"title\">{{modalTitle}}</h1>\n" +
    "    <div class=\"buttons\">\n" +
    "      <button class=\"button button-clear button-light\" ng-click=\"closeModal()\">Close</button>\n" +
    "    </div>\n" +
    "  </ion-header-bar>\n" +
    "    <ion-content> \n" +
    "        <div >\n" +
    "            <form name=\"teamForm\">\n" +
    "                <label class=\"item item-input\">\n" +
    "                  <span class=\"input-label\">Team Name</span>\n" +
    "                  <input name=\"teamName\" type=\"text\" ng-model=\"addTeam.name\" required>\n" +
    "                </label>\n" +
    "                  <div class=\"list\">\n" +
    "                    <div class=\"item item-toggle\">\n" +
    "                        Comma Delimited Input\n" +
    "                        <label class=\"toggle toggle-positive\">\n" +
    "                           <input type=\"checkbox\" ng-model=\"commaDelimited\">\n" +
    "                           <div class=\"track\">\n" +
    "                             <div class=\"handle\"></div>\n" +
    "                           </div>\n" +
    "                        </label>\n" +
    "                    </div>\n" +
    "                    <div ng-show=\"!commaDelimited\">\n" +
    "                        <div class=\"item item-input-inset\">\n" +
    "                            <label class=\"item-input-wrapper\">\n" +
    "                              <input type=\"text\" name=\"mName\" \n" +
    "                                     ng-model=\"addTeam.nameString\" \n" +
    "                                     placeholder=\"Member Name\" \n" +
    "                                     user-complete\n" +
    "                                     field-type='name'\n" +
    "                                     instance-name='team'>\n" +
    "                            </label>                            \n" +
    "                            <label class=\"item-input-wrapper\">\n" +
    "                              <input type=\"email\" name=\"mEmail\" \n" +
    "                                     ng-model=\"addTeam.emailString\" placeholder=\"Member Email\"\n" +
    "                                     user-complete\n" +
    "                                     field-type='email'\n" +
    "                                     instance-name='team'>\n" +
    "                            </label>\n" +
    "                            <button class=\"button button-small\"\n" +
    "                                    ng-click=\"addMember()\" \n" +
    "                                    ng-disabled=\"teamForm.mEmail.$invalid || teamForm.mName.$invalid\">\n" +
    "                              add\n" +
    "                            </button>\n" +
    "                        </div>\n" +
    "                        <div class=\"item item-divider\">\n" +
    "                            Members\n" +
    "                        </div> \n" +
    "                        <ion-scroll>\n" +
    "                        <div class=\"list\" elem-height=\"0.12\">\n" +
    "                            <div ng-repeat=\"member in addTeam.members\" class=\"item item-icon-left\" >\n" +
    "                                <i class=\"icon ion-minus-circled \" style=\"font-size:95%\" ng-click=\"delMember($index)\">\n" +
    "                                <p class=\"padding-left\">{{addTeam.members[$index].firstName}} \n" +
    "                                    {{addTeam.members[$index].lastName}}  {{addTeam.members[$index].email}}</p>         \n" +
    "                                </i>\n" +
    "\n" +
    "                            </div>\n" +
    "                        </div>                          \n" +
    "                        </ion-scroll>\n" +
    "                    </div>\n" +
    "                    <div ng-show=\"commaDelimited\">\n" +
    "                    <label class=\"item item-input item-stacked-label\">\n" +
    "                        <span class=\"input-label\">Add Members:(pattern:first,last,email;)</span>\n" +
    "                        <textarea class=\"team-textarea\"\n" +
    "                                  name=\"members\" \n" +
    "                                  ng-model=\"addTeam.memberString\"\n" +
    "                                  style=\"width:97%\"\n" +
    "                                  elem-height=\"0.185\"\n" +
    "                                  wrap=\"hard\">\n" +
    "                        </textarea>   \n" +
    "                    </label>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </form>\n" +
    "        </div>\n" +
    "        <div class=\"centered-container\" style=\"margin-top:10px\">\n" +
    "             <button class=\"button button-positive\" ng-click=\"modalCallback()\" \n" +
    "                     ng-disabled=\"teamForm.teamName.$invalid || (addTeam.members.length == 0)\">\n" +
    "                OK\n" +
    "            </button>\n" +
    "            <button class=\"button padding-left button-stable\" ng-click=\"closeModal()\">\n" +
    "                Cancel\n" +
    "            </button>    \n" +
    "                <p ng-show=\"teamForm.teamName.$invalid\">Team Name is Required</p>         \n" +
    "        </div>\n" +
    "    </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('templates/presAnalytics.html',
    "<ion-modal-view>\n" +
    "  <ion-header-bar class=\"bar-positive\">\n" +
    "    <h1 class=\"title\">{{session.name}}</h1>\n" +
    "    <div class=\"buttons\">\n" +
    "      <button class=\"button button-clear button-light\" ng-click=\"closeModal()\">Close</button>\n" +
    "    </div>\n" +
    "  </ion-header-bar>\n" +
    "  <ion-content>\n" +
    "        <div class=\"item item-divider\">{{session.decks[deckIdx].name}}</div>\n" +
    "        \n" +
    "        <div class=\"item item-divider\"\n" +
    "                    ng-repeat=\"metric in session.decks[deckIdx].metrics\" >\n" +
    "                    {{metric.eventDate| date:\"EEEE MM/dd/yyyy  h:mma\"}}\n" +
    "        <div class=\"list card\" ng-repeat=\"sv in metric.slideViews\">\n" +
    "            <div class=\"item item-avatar slide-report-header\">\n" +
    "                    <img ng-if=\"session.decks[deckIdx].slides[sv.slideIndex].type == 'img'\"\n" +
    "                         ng-src=\"{{session.decks[deckIdx].slides[sv.slideIndex].src}}\" class=\"no-corners\">\n" +
    "                    <img ng-if=\"session.decks[deckIdx].slides[sv.slideIndex].type == 'video'\"\n" +
    "                         ng-src=\"{{session.decks[deckIdx].slides[sv.slideIndex].poster}}\" class=\"no-corners\">\n" +
    "                <h2>Slide Number {{sv.slideIndex+1}}</h2>\n" +
    "                <p>Slide Duration: {{sv.duration | number:2}}(sec)</p>\n" +
    "            </div>\n" +
    "        <div class=\"item\" >\n" +
    "            <div class=\"row\">\n" +
    "                <div class=\"col col-50 centered-container\">Viewer</div>  \n" +
    "                <div class=\"col col-50 centered-container\">Time on Slide</div>    \n" +
    "            </div>\n" +
    "            <div class=\"row\" ng-repeat=\"view in sv.views\">\n" +
    "                <div class=\"col col-50 centered-container\">\n" +
    "                    {{view.userName}}\n" +
    "                </div>             \n" +
    "                <div class=\"col col-50 centered-container\">\n" +
    "                  {{view.viewed| number:2}}(sec) {{(view.viewed/sv.duration)*100|number:0}}%\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('templates/presEndTemplate.html',
    "<ion-modal-view>\n" +
    "    <ion-header-bar class=\"bar-calm\"> <h1 class=\"title\"> Thank You</h1> \n" +
    "    <div class=\"buttons\">\n" +
    "      <button class=\"button button-clear button-light\" \n" +
    "              ng-click=\"signupModal.hide()\">Close</button>\n" +
    "    </div>\n" +
    "    </ion-header-bar> \n" +
    "     <div class=\"bar bar-subheader\">\n" +
    "      <h2 class=\"title\">The Meeting Has Ended</h2>\n" +
    "    </div>\n" +
    "    <ion-content has-subheader=\"true\"> \n" +
    "                <div class=\"centered-container hero-container positive-bg padding-bottom with-subheader\"\n" +
    "                     ng-class=\"{'rounded-corners': !smallScreen()}\">\n" +
    "                    <p style=\"color:white\">Presented By:</p>\n" +
    "                    <p class=\"hero-header\" style=\"line-height:100%\">Revu.Me</p> \n" +
    "                    <p style=\"color:white\">If You Like Our Product<br>Just Enter a Password<br>and Click \"Sign Up\"</p>\n" +
    "                    <form name=\"forms.signup\" >\n" +
    "                      <label class=\"item item-input padding-bottom\"\n" +
    "                             ng-class=\"{narrow : !smallScreen()}\">\n" +
    "                        <span class=\"input-label\">Password</span>\n" +
    "                        <input name=\"inpPassword\"\n" +
    "                               ng-model=\"forms.signup.password\"\n" +
    "                               type=\"password\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                        <button class=\"button button-balanced\"\n" +
    "                            style=\"margin-top:10px\"\n" +
    "                            ng-click=\"doSignUp()\"\n" +
    "                            ng-disabled=\"!forms.signup.inpPassword.$dirty\">\n" +
    "                        Sign Up\n" +
    "                        </button>\n" +
    "                    <div class=\"signin-button\">\n" +
    "                        <p class=\"signin-message\" ng-click=\"signupModal.hide()\">No Thanks</p>\n" +
    "                    </div>\n" +
    "                    </form>\n" +
    "                </div>\n" +
    "\n" +
    "    </ion-content>\n" +
    "\n" +
    "</ion-modal-view>"
  );


  $templateCache.put('templates/presentation.html',
    "<ion-view view-title=\"{{name}}\">\n" +
    "    <ion-nav-buttons side=\"right\">\n" +
    "      <button class=\"button icon ion-ios-telephone\" ng-click=\"showDialin()\">\n" +
    "      </button>\n" +
    "      <button class=\"button icon-left\" ng-click=\"toggleShowUsers()\">\n" +
    "        <i class=\"icon ion-person-stalker\" ></i>\n" +
    "          <div class=\"user-indicator\">\n" +
    "                {{present.length}}         \n" +
    "          </div>\n" +
    "      </button>\n" +
    "    </ion-nav-buttons>\n" +
    "    <ion-content class=\"has-header presentation-background\" scroll=\"false\" id=\"presentation\" fullscreen>\n" +
    "        <div class=\"centered-container slide\" elem-size controls=true host=true>    \n" +
    "            <div class=\"row\">\n" +
    "            <div class=\"col col-5\">\n" +
    "                <a class=\"button icon-left ion-chevron-left button-clear button-dark slider-button\" \n" +
    "                   ng-click=\"prevSlide()\"></a>\n" +
    "            </div>\n" +
    "            <div class=\"col col-90\" >\n" +
    "            <ion-slide-box class=\"bordered-drop-shadow\" on-slide-changed=\"setSlide(index)\" show-pager=\"false\">\n" +
    "                <ion-slide ng-repeat=\"slide in presentation.slides\">\n" +
    "                    <div ng-switch on=\"slide.type\">\n" +
    "                        <div ng-switch-when=\"img\">\n" +
    "                            <ion-scroll direction=\"xy\" \n" +
    "                                scrollbar-x=\"false\" \n" +
    "                                scrollbar-y=\"false\"\n" +
    "                                zooming=\"true\" \n" +
    "                                min-zoom=\"1.0\" \n" +
    "                                style=\"width: 100%; height: 100%\"\n" +
    "                                delegate-handle=\"scrollHandle{{$index}}\" \n" +
    "                                on-scroll=\"updateSlideStatus(current)\" \n" +
    "                                on-release=\"updateSlideStatus(current)\">\n" +
    "                            <img ng-src=\"{{slide.src}}\" class=\"slide-content\" >\n" +
    "                            </ion-scroll>\n" +
    "                        </div>\n" +
    "                        <div ng-switch-when=\"video\">                            \n" +
    "                            <video id=\"vid-slide\" class=\"slide-content\" v-source={{slide.src}} controls v-lead={{$index}} > </video>  \n" +
    "                         </div> \n" +
    "                    </div>                    \n" +
    "                </ion-slide>\n" +
    "            </ion-slide-box>\n" +
    "             <div class=\"presence-message dark-bg\" appear-up=\"show_message\">\"\"</div>\n" +
    "            </div>\n" +
    "            <div class=\"col col-5\">\n" +
    "                <a class=\"button icon-right ion-chevron-right button-clear button-dark slider-button right\" \n" +
    "                   ng-click=\"nextSlide()\"></a>\n" +
    "            </div>\n" +
    "\n" +
    "            </div>\n" +
    "        </div> \n" +
    "        <div class=\"bar bar-footer bar-dark\"\n" +
    "             ng-if=\"footer.class != 'hidden'\"\n" +
    "             ng-class=\"{'tall': footer.class == 'tall'}\">\n" +
    "            <div class=\"centered-container\">\n" +
    "                <div ng-repeat=\"attendee in everyone\" class=\"user-item\">\n" +
    "                    <div class=\"circle-initials\"\n" +
    "                         ng-class=\"{'calm-bg': attendee.isOnline,\n" +
    "                                   'circle-offline':!attendee.isOnline,\n" +
    "                                   'ion-eye-disabled user-distracted circle-offline': attendee.distracted}\">\n" +
    "                        <p ng-show=!attendee.distracted>{{attendee.initials}}</p>\n" +
    "                    </div>\n" +
    "                    <span ng-if=\"attendee.itsMe != true\" class=\"user-item-text\">{{attendee.firstName}} {{attendee.lastName}}</span>\n" +
    "                    <span ng-if=\"attendee.itsMe\" class=\"user-item-text\">You</span>            \n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/presentations.html',
    "<ion-view title=\"Presentations\">\n" +
    "  <ion-nav-buttons side=\"left\">\n" +
    "      <button menu-toggle=\"left\" class=\"button button-icon icon ion-navicon\"></button>\n" +
    "  </ion-nav-buttons>\n" +
    "  <ion-content class=\"has-header\">\n" +
    "      <ion-list>\n" +
    "          <ion-item class=\"item-thumbnail-left\" ng-repeat=\"deck in presentations\" \n" +
    "                    href=\"#/app/presentations/{{deck.id}}\">\n" +
    "              <img ng-src=\"{{deck.slides[0].source}}\">\n" +
    "              <h2>{{deck.name}}</h2>\n" +
    "              <p> {{deck.slides.length}} total slides</p>\n" +
    "          </ion-item>\n" +
    "      </ion-list>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/review.html',
    "<ion-view view-title=\"{{name}}\" >\n" +
    "    <ion-content class=\"has-header presentation-background\" scroll=\"false\">\n" +
    "        <div class=\"centered-container slide\" elem-size controls=true>\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col col-5\">\n" +
    "                <a class=\"button icon-left ion-chevron-left button-clear button-dark slider-button\" \n" +
    "                   ng-click=\"prevSlide()\"\n" +
    "                   ng-disabled=\"!prevEnabled\"></a>\n" +
    "            </div>\n" +
    "            <div class=\"col col-90\" >\n" +
    "                <ion-slide-box disable-scroll=\"true\"  class=\"bordered-drop-shadow\" show-pager=\"false\">\n" +
    "                    <ion-slide ng-repeat=\"slide in presentation.slides\">\n" +
    "\n" +
    "                        <div ng-switch on=\"slide.type\">\n" +
    "                            <div ng-switch-when=\"img\">\n" +
    "                                <img ng-src=\"{{slide.src}}\" class=\"slide-content\" >\n" +
    "                            </div>\n" +
    "                            <div ng-switch-when=\"video\">                            \n" +
    "                                <video class=\"slide-content\" controls=\"controls\" v-source={{slide.src}}  v-follow={{$index}}></video>                      \n" +
    "                             </div>                                     \n" +
    "\n" +
    "\n" +
    "                        </div>                    \n" +
    "                    </ion-slide>\n" +
    "                </ion-slide-box>\n" +
    "                 <div class=\"presence-message dark-bg\" appear-up=\"show_message\">\"\"</div>\n" +
    "                </div>\n" +
    "            <div class=\"col col-5 \">\n" +
    "                <a class=\"button icon-right ion-chevron-right button-clear button-dark slider-button right\" \n" +
    "                   ng-click=\"nextSlide()\"\n" +
    "                   ng-disabled=\"!nextEnabled\"></a>\n" +
    "            </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/search.html',
    "<ion-view view-title=\"Search\">\n" +
    "  <ion-content>\n" +
    "    <h1>Search</h1>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/session.html',
    "<ion-view view-title=\"{{session.name}}\" hide-back-button=\"false\" ng-cloak>\n" +
    "    <ion-content class=\"has-header\">\n" +
    "        <div class=\"list card\">\n" +
    "            <div class=\"item item-divider\">\n" +
    "                Meeting Details\n" +
    "            </div>\n" +
    "            <div class=\"item item-button-right\">\n" +
    "                <p><strong>Date:&#160&#160&#160&#160&#160&#160&#160&#160&#160&#160</strong>{{session.date | date:\"MM/dd/yyyy\"}}</p>  \n" +
    "                <p><strong>Time:&#160&#160&#160&#160&#160&#160&#160&#160&#160&#160</strong>{{session.time | date:\"h:mma\"}}</p>  \n" +
    "                <p><strong>Organizer:</strong> &#160   \n" +
    "                    {{session.organizer.firstName}} {{session.organizer.lastName}}</p>\n" +
    "                <p ng-if=\"session.bridge && isMobile\"><strong>Dial in: </strong>&#160&#160&#160&#160&#160&#160    <a href=\"tel:{{session.bridgeNumber}},,,{{session.confId}}#\">{{session.bridgeNumber}}</a></p>\n" +
    "                <p ng-if=\"session.bridge && !isMobile\"><strong>Dial in: </strong>&#160&#160&#160&#160&#160&#160    {{session.bridgeNumber}}</p>\n" +
    "                <p><strong>Meeting Id: </strong>&#160{{session.ufId}}</p>\n" +
    "                <button class=\"button button-balanced\"\n" +
    "                        ng-click=\"startMeeting()\"\n" +
    "                        ng-if=\"!activeMeeting\">\n" +
    "                    Start Meeting\n" +
    "                </button>\n" +
    "                <button class=\"button button-assertive\"\n" +
    "                        ng-click=\"endMeeting()\"\n" +
    "                        ng-if=\"activeMeeting\">\n" +
    "                    End Meeting\n" +
    "                </button>\n" +
    "                <button class=\"button button-positive\"\n" +
    "                        style=\"top:55px\"\n" +
    "                        ng-click=\"resendInvites()\">\n" +
    "                    Resend Invites\n" +
    "                </button>\n" +
    "            </div>\n" +
    "            <div class=\"item item-body\">\n" +
    "                {{session.description}}\n" +
    "            </div>\n" +
    "            <div class=\"item item-checkbox\">\n" +
    "                 <label class=\"checkbox\">\n" +
    "                   <input ng-model=\"session.bridge\" type=\"checkbox\">\n" +
    "                 </label>\n" +
    "                 conference bridge\n" +
    "            </div>\n" +
    "            <div class=\"item item-checkbox\"\n" +
    "                 ng-if=\"!reportDisabled($index)\">\n" +
    "                 <label class=\"checkbox\">\n" +
    "                   <input ng-model=\"session.leaveBehind\" type=\"checkbox\"\n" +
    "                          ng-click=\"setLeaveBehind()\">\n" +
    "                 </label>\n" +
    "                 Allow Post Meeting Review\n" +
    "            </div>\n" +
    "            <div class=\"item item-divider\">\n" +
    "                Presentations Decks\n" +
    "            </div>\n" +
    "              <div class=\"item item-thumbnail-left item-button-right\" \n" +
    "                   ng-repeat=\"deck in session.decks\" >\n" +
    "                  <img ng-src=\"{{deck.thumb}}\">\n" +
    "                  <h2>{{deck.name}}</h2>\n" +
    "                  <p> {{deck.slides.length}} total slides</p>\n" +
    "                    <div class=\"buttons session-item-button\">\n" +
    "                        <button class=\"button button-positive\"\n" +
    "                                ng-click=\"go(session._id,$index)\">\n" +
    "                            Start\n" +
    "                        </button>\n" +
    "                        <button class=\"button button-positive button-outline\" \n" +
    "                                ng-disabled=\"!reportsEnabled[$index]\" \n" +
    "                                ng-click=\"showResults($index)\">\n" +
    "                            Report\n" +
    "                        </button>\n" +
    "                  </div>\n" +
    "              </div>\n" +
    "            <div class=\"item item-divider\">\n" +
    "                Attendees\n" +
    "            </div>\n" +
    "            <div class=\"item\" >\n" +
    "                <span><strong>Organizer: </strong>{{session.organizer.firstName}} {{session.organizer.lastName}}</span><br>\n" +
    "                <span ng-repeat=\"attendee in session.attendees\">\n" +
    "                {{attendee.firstName}} {{attendee.lastName}}  e: {{attendee.email}} <br>\n" +
    "                </span>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "        </div>\n" +
    "        \n" +
    "    </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/sessions.html',
    "<ion-view title=\"{{titles.organizer}}\" ng-cloak>\n" +
    "  <ion-nav-buttons side=\"left\">\n" +
    "      <button menu-toggle=\"left\" class=\"button button-icon icon ion-navicon\"></button>\n" +
    "  </ion-nav-buttons>\n" +
    "    <ion-content class=\"has-header\">\n" +
    "        <div class=\"revu-list-header balanced-bg\">\n" +
    "            <button ng-if=\"!archiveOn()\" \n" +
    "                    class=\"button button-icon icon ion-minus-circled revu-list-button revu-left\"\n" +
    "                     ng-click=\"toggleListDelete('org')\"></button>\n" +
    "            You're the Organizer\n" +
    "           <p class=\"sub-title\"\n" +
    "               ng-if=\"smallScreen()\">(swipe left to edit)</p>    \n" +
    "            <button class=\"button button-icon icon ion-plus-circled revu-list-button revu-right\"\n" +
    "                    ng-click=\"newSession()\">\n" +
    "            </button>\n" +
    "        </div>\n" +
    "\n" +
    "   <ion-scroll elem-height=\"0.80\">\n" +
    "\n" +
    "  <ion-refresher\n" +
    "    pulling-text=\"Pull to refresh...\"\n" +
    "    on-refresh=\"doRefresh()\">\n" +
    "  </ion-refresher>\n" +
    "       \n" +
    "\n" +
    "      <ion-list show-delete=\"shouldShowDelete\" delegate-handle=\"org\" >\n" +
    "          <ion-item class=\"item-thumbnail-left item-button-right \" \n" +
    "                    ng-repeat=\"session in orgSessions\" \n" +
    "                    href=\"#/app/sessions/{{session._id}}\">\n" +
    "            <ion-delete-button class=\"ion-minus-circled\" style=\"color:#ffe900\" \n" +
    "                               ng-click=\"markArchive($index)\">\n" +
    "              </ion-delete-button>\n" +
    "              <img ng-src=\"{{session.decks[0].thumb}}\">\n" +
    "              <h2>{{session.name}}</h2>\n" +
    "              <p>{{session.date | date:\"MM/dd/yyyy\"}} {{session.time | date:\"h:mma\"}}</p>\n" +
    "              <p>Total Attendees: {{session.attendees.length}}</p>\n" +
    "              <p>First Deck is: {{session.decks[0].name}} of {{session.decks.length}}</p>\n" +
    "              <p ng-if=\"smallScreen()\">(swipe left to edit)</p> \n" +
    "              <ion-option-button ng-if=\"smallScreen()&&!archiveOn()\" class=\"button button-positive\" \n" +
    "                      ng-click=\"editSession($index); $event.preventDefault(); $event.stopPropogation();\">\n" +
    "                  Edit\n" +
    "              </ion-option-button>\n" +
    "              <ion-option-button ng-if=\"smallScreen()&&archiveOn()\" class=\"button button-energized\" \n" +
    "                      ng-click=\"markArchive($index); $event.preventDefault(); $event.stopPropogation();\">\n" +
    "                  UnArchive\n" +
    "              </ion-option-button>\n" +
    "            <!--\n" +
    "              <ion-option-button ng-if=\"smallScreen()\" class=\"button button-energized\" \n" +
    "                      ng-click=\"markArchive($index); $event.preventDefault(); $event.stopPropogation();\">\n" +
    "                  {{actions[2].name}}\n" +
    "              </ion-option-button>\n" +
    "              <select ng-if=\"!smallScreen()\"\n" +
    "                      ng-options=\"action as action.name for action in actions\"\n" +
    "                      ng-model=\"action.selected\"\n" +
    "                      ng-change=\"doAction($index)\"\n" +
    "                      style=\"z-index:500\">\n" +
    "              </select>\n" +
    "                -->\n" +
    "              <button ng-if=\"!smallScreen()&&!archiveOn()\" class=\"button button-positive\" \n" +
    "                      ng-click=\"editSession($index); $event.preventDefault(); $event.stopPropogation();\">\n" +
    "                  Edit\n" +
    "              </button>\n" +
    "              <button ng-if=\"!smallScreen()&&archiveOn()\" class=\"button button-energized\" \n" +
    "                      ng-click=\"markArchive($index); $event.preventDefault(); $event.stopPropogation();\">\n" +
    "                  UnArchive\n" +
    "              </button>\n" +
    "          </ion-item>\n" +
    "        </ion-list>\n" +
    "    </ion-scroll> \n" +
    "  </ion-content>\n" +
    "</ion-view>\n" +
    "                    \n" +
    "                \n"
  );


  $templateCache.put('templates/settings.html',
    "\n" +
    "<ion-view view-title=\"Settings\">\n" +
    "  <ion-content class=\"presentation-background\">\n" +
    "\n" +
    "    <div class=\"row row-center\">\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>\n" +
    "        <div class=\"col col-80\">\n" +
    "            <div class=\"centered-container user_list\">\n" +
    "            \n" +
    "          <ion-list>\n" +
    "              <div class=\"item item-divider\">\n" +
    "                Setting List\n" +
    "              </div>\n" +
    "              <ion-item ng-repeat=\"action in setting.actions\"\n" +
    "                        ng-click=\"action.action()\">\n" +
    "                <h2>{{action.name}}</h2>\n" +
    "              </ion-item>\n" +
    "          </ion-list>    \n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>        \n" +
    "    </div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/shareTemplate.html',
    "<ion-modal-view>\n" +
    "    <ion-header-bar class=\"bar-calm\"> <h1 class=\"title\"> Share with Team </h1> \n" +
    "    <div class=\"buttons\">\n" +
    "      <button class=\"button button-clear button-light\" \n" +
    "              ng-click=\"cancelShare()\">Close</button>\n" +
    "    </div>\n" +
    "    </ion-header-bar> \n" +
    "    <ion-content> \n" +
    "        <ion-list >\n" +
    "            <ion-item ng-repeat=\"team in teams\" class=\"item-checkbox\" >\n" +
    "                <label class=\"checkbox\">\n" +
    "                    <input ng-model=\"team.included\" type=\"checkbox\">\n" +
    "                </label\n" +
    "                    <h2>{{team.name}}</h2>\n" +
    "                    <p>Total Members: {{team.members.length}}</p>\n" +
    "            </ion-item>\n" +
    "        </ion-list>\n" +
    "\n" +
    "    </ion-content>\n" +
    "    <ion-footer-bar>\n" +
    "        <div class=\"centered-container\">\n" +
    "          <button class=\"button button-positive button-calm\"\n" +
    "                  ng-click=\"updateSharing()\">\n" +
    "              Ok\n" +
    "          </button>\n" +
    "          <button class=\"button button-stable\" ng-click=\"cancelShare()\">\n" +
    "              Cancel\n" +
    "          </button>\n" +
    "        </div>\n" +
    "    </ion-footer-bar>\n" +
    "</ion-modal-view>"
  );


  $templateCache.put('templates/signin.html',
    "\n" +
    "<ion-view view-title=\"Sign In\">\n" +
    "  <ion-content ng-class=\"{'dark-bg':isMobile}\">\n" +
    "\n" +
    "    <div class=\"centered-container\"  >\n" +
    "    <div class=\"row row-center\">\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>\n" +
    "    <div class=\"col col-80 \">\n" +
    "     <!--   <img ng-src=\"{{image}}\" class=\"splash-image\"> -->\n" +
    "        <div class=\"centered-container hero-container positive-bg padding-bottom rounded-corners\" >\n" +
    "            <span class=\"hero-header\">Revu.Me</span> \n" +
    "            <p ng-if=\"message != undefined\"\n" +
    "               class=\"signin-message\">{{message}}</p>\n" +
    "            <div class=\"signup-form\">\n" +
    "                <form name=\"forms.signin\" ng-controller=\"signinCtrl\">\n" +
    "                    <div class=\"list list-inset\">\n" +
    "                      <label class=\"item item-input\">\n" +
    "                        <span class=\"input-label\">Email</span>\n" +
    "                        <input name=\"inpEmail\"\n" +
    "                               ng-model=\"forms.signin.email\"\n" +
    "                               type=\"email\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                      <div class=\"input-spacer positive-bg\"></div>\n" +
    "                      <label class=\"item item-input\">\n" +
    "                        <span class=\"input-label\">Password</span>\n" +
    "                        <input name=\"inpPassword\"\n" +
    "                               ng-model=\"forms.signin.password\"\n" +
    "                               type=\"password\" \n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                    </div>\n" +
    "                    <button class=\"button \"\n" +
    "                            ng-click=\"doSignIn()\"\n" +
    "                            ng-disabled=\"!forms.signin.inpPassword.$dirty || !forms.signin.inpEmail.$dirty \n" +
    "                                             || forms.signin.inpEmail.$invalid\">\n" +
    "                        Sign In\n" +
    "                    </button>\n" +
    "                    <div>\n" +
    "                        <span ng-if=\"forms.signin.inpEmail.$dirty && forms.signin.inpEmail.$invalid\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            Invalid Email Format\n" +
    "                        </span>\n" +
    "                        <span ng-if=\"forms.signin.inpPassword.$dirty && forms.signin.inpPassword.$error.required\"\n" +
    "                              class=\"signin-message\">\n" +
    "                        Password is Required</span>\n" +
    "                    </div>\n" +
    "                </form>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>    \n" +
    "    </div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/signup.html',
    "\n" +
    "<ion-view view-title=\"Sign Up\">\n" +
    "  <ion-content ng-class=\"{'presentation-background':smallScreen(),'flashy-background':!smallScreen()}\">\n" +
    "\n" +
    "    <div class=\"centered-container\"  >\n" +
    "    <div class=\"row row-center\">\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>\n" +
    "    <div class=\"col col-80 \">\n" +
    "     <!--   <img ng-src=\"{{image}}\" class=\"splash-image\"> -->\n" +
    "        <div ng-class=\"{'centered-container hero-container positive-bg padding-bottom':smallScreen(),\n" +
    "                       'left-container hero-container positive-bg padding-bottom':!smallScreen()}\" >\n" +
    "            <span class=\"hero-header\">Revu.Me</span> \n" +
    "            <div class=\"signup-form \">\n" +
    "                <form name=\"forms.signup\" ng-controller=\"signupCtrl\">\n" +
    "                    <div class=\"list\">\n" +
    "                      <label class=\"item item-input item-floating-label light-bg\">\n" +
    "                        <span class=\"input-label\" style=\"text-align:left\">First Name</span>\n" +
    "                        <input name=\"fName\"\n" +
    "                               ng-model=\"forms.signup.firstName\"\n" +
    "                               type=\"text\"\n" +
    "                               placeholder=\"firstName\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "      \n" +
    "                      <label class=\"item item-input item-floating-label light-bg\">\n" +
    "                        <span class=\"input-label\" style=\"text-align:left\">Last Name</span>\n" +
    "                        <input name=\"lName\"\n" +
    "                               ng-model=\"forms.signup.lastName\"\n" +
    "                               type=\"text\"\n" +
    "                               placeholder=\"Lastname\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                      <label class=\"item item-input item-floating-label light-bg\">\n" +
    "                        <span class=\"input-label\" style=\"text-align:left\">Email</span>\n" +
    "                        <input name=\"inpEmail\"\n" +
    "                               ng-model=\"forms.signup.email\"\n" +
    "                               type=\"email\"\n" +
    "                               placeholder=\"Email\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                      <label class=\"item item-input item-floating-label light-bg\">\n" +
    "                        <span class=\"input-label\" style=\"text-align:left\">Password</span>\n" +
    "                        <input name=\"inpPassword\"\n" +
    "                               ng-model=\"forms.signup.password\"\n" +
    "                               type=\"password\"\n" +
    "                               placeholder=\"Password\"\n" +
    "                               required>\n" +
    "                      </label>\n" +
    "                    </div>\n" +
    "                    <button class=\"button \"\n" +
    "                            ng-click=\"doSignUp()\"\n" +
    "                            ng-disabled=\"!forms.signup.fName.$dirty || \n" +
    "                                         !forms.signup.lName.$dirty || \n" +
    "                                         !forms.signup.inpPassword.$dirty || \n" +
    "                                         !forms.signup.inpEmail.$dirty || \n" +
    "                                         forms.signup.inpEmail.$invalid\">\n" +
    "                        Sign Up\n" +
    "                    </button>\n" +
    "                    <div class=\"signin-button\">\n" +
    "                        <p class=\"signin-message\" ng-click=\"signIn()\">Sign In</p>\n" +
    "                    </div>\n" +
    "                    <div>\n" +
    "                        <span ng-if=\"forms.signup.inpEmail.$dirty && forms.signup.inpEmail.$invalid\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            Invalid Email Format\n" +
    "                        </span>\n" +
    "                        <span ng-if=\"forms.signup.inpPassword.$dirty && forms.signup.inpPassword.$error.required\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            Password is Required\n" +
    "                        </span>      \n" +
    "                        <span ng-if=\"forms.signup.fName.$dirty && forms.signup.fName.$error.required\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            First Name is Required\n" +
    "                        </span>  \n" +
    "                            <span ng-if=\"forms.signup.lName.$dirty && forms.signup.lName.$error.required\"\n" +
    "                              class=\"signin-message\">\n" +
    "                            Last Name is Required\n" +
    "                        </span>  \n" +
    "                    </div>\n" +
    "\n" +
    "                </form>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>    \n" +
    "    </div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/slideItems.html',
    "\n" +
    "<ion-scroll elem-height=\"0.875\" \n" +
    "            overflow-scroll=\"true\">\n" +
    "    <div ng-repeat=\"slide in slides\" \n" +
    "         class=\"thumbnail\" \n" +
    "         ng-class=\"{'thumb-selected':tap.on && tap.index==$index}\"\n" +
    "         ng-cloak>\n" +
    "        <div ng-switch on=\"slide.type\"  >\n" +
    "            <div ng-switch-when=\"img\" >\n" +
    "                <div style=\"position:relative\" >\n" +
    "                    <i class=\"icon ion-close-circled slide-deleter\" \n" +
    "                       ng-show=\"statesReady && isEditing && slide.included && !slide.available\"\n" +
    "                       ng-click=\"deleteSlide($index)\"\n" +
    "                       ng-cloak></i>\n" +
    "                    <i class=\"icon ion-checkmark-round slide-included\" \n" +
    "                       ng-show=\"slide.included && slide.available\"></i>\n" +
    "                    <i class=\"icon ion-plus-circled slide-adder\" \n" +
    "                       ng-show=\"statesReady && isEditing && slide.available \" \n" +
    "                       ng-click=\"addSlide($index)\"\n" +
    "                       ng-cloak></i>\n" +
    "                    <img ng-src=\"{{slide.src}}\"  \n" +
    "                         style=\"width:100%\" \n" +
    "                         class=\"rounded-corners shadow white-background\"\n" +
    "                         ng-click=\"tapThumb($index)\">\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div ng-switch-when=\"video\" > \n" +
    "                <div style=\"position:relative\" >\n" +
    "                    <i class=\"icon ion-close-circled slide-deleter\" \n" +
    "                       ng-show=\"statesReady && isEditing && slide.included && !slide.available\"\n" +
    "                       ng-click=\"deleteSlide($index)\"\n" +
    "                       ng-cloak></i>\n" +
    "                    <i class=\"icon ion-checkmark-round slide-included\" \n" +
    "                       ng-show=\"slide.included && slide.available\"></i>\n" +
    "                    <i class=\"icon ion-plus-circled slide-adder\" \n" +
    "                       ng-show=\"statesReady && isEditing && slide.available \"  \n" +
    "                       ng-click=\"addSlide($index)\"\n" +
    "                       ng-cloak></i>\n" +
    "<!--\n" +
    "                    <i class=\"icon ion-play slide-play-video\" \n" +
    "                       ng-show=\"!slide.playing\"  \n" +
    "                       ng-click=\"playVideo($index)\">\n" +
    "                    </i>\n" +
    "\n" +
    "                    <video ng-show=\"slide.playing\"\n" +
    "                           class=\"rounded-corners shadow video-thumbnail\"\n" +
    "                           controls=true\n" +
    "                           ng-click=\"tapThumb($index)\"\n" +
    "                           v-source={{slide.src}} auto-play=\"slide.playing\">\n" +
    "                    </video> \n" +
    "-->\n" +
    "                    <video id=\"vid-slide\" \n" +
    "                           class=\"rounded-corners shadow \"\n" +
    "                           poster=\"https://dw69ofzd8w57f.cloudfront.net/transparant.png\"\n" +
    "                           v-source={{slide.src}}\n" +
    "                           v-background-image={{slide.poster}}\n" +
    "                           controls=true\n" +
    "                           ng-click=\"tapThumb($index)\"\n" +
    "                    > \n" +
    "                    </video> \n" +
    "<!--\n" +
    "                    <img ng-show=\"!slide.playing\"\n" +
    "                         ng-src=\"{{slide.poster}}\"  \n" +
    "                         style=\"width:100%\" class=\"rounded-corners shadow\"\n" +
    "                         ng-click=\"tapThumb($index)\">\n" +
    "-->\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</ion-scroll>\n" +
    "\n" +
    "\n"
  );


  $templateCache.put('templates/slideShow.html',
    "<ion-view view-title=\"{{presentation.name}}\">\n" +
    "    <ion-content class=\"has-header presentation-background\" scroll=\"false\" id=\"slideshow\" fullscreen>\n" +
    "        <div class=\"centered-container slide\" elem-size controls=true host=false>\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col col-5\">\n" +
    "                <a class=\"button icon-left ion-chevron-left button-clear button-dark slider-button\" \n" +
    "                   ng-click=\"previousClicked()\"\n" +
    "                   ng-disabled=\"!prevEnabled\"></a>\n" +
    "            </div>\n" +
    "            <div class=\"col col-90\" >\n" +
    "                <ion-slide-box ng-repeat=\"box in slideBoxes\"\n" +
    "                               ng-if=\"box.idx == slideBoxIdx\"\n" +
    "                               disable-scroll=\"false\"  \n" +
    "                               class=\"bordered-drop-shadow\"\n" +
    "                               show-pager=\"false\"\n" +
    "                               active-slide=boxCurrent\n" +
    "                               delegate-handle=\"{{box.handle}}\"\n" +
    "                               ng-cloak>\n" +
    "                    <ion-slide ng-repeat=\"slide in box.slides\"\n" +
    "                               ng-init=\"$last ? slidesDone() : null\"\n" +
    "                               ng-cloak>\n" +
    "                        <div ng-switch on=\"slide.type\">\n" +
    "                            <div ng-switch-when=\"img\">\n" +
    "                                <ion-scroll direction=\"xy\" \n" +
    "                                                    scrollbar-x=\"false\" \n" +
    "                                                    scrollbar-y=\"false\"\n" +
    "                                                    zooming=\"true\" \n" +
    "                                                    min-zoom=\"1.0\" \n" +
    "                                                    style=\"width: 100%; height: 100%\"\n" +
    "                                                    delegate-handle=\"scrollHandle{{$index}}\" \n" +
    "                                                    on-scroll=\"updateSlideStatus(boxCurrent)\" \n" +
    "                                                    on-release=\"updateSlideStatus(boxCurrent)\">\n" +
    "                                <img ng-src=\"{{slide.src}}\" class=\"slide-content\"\n" +
    "                                     on-swipe-left=\"nextClicked()\"\n" +
    "                                     on-swipe-right=\"previousClicked()\">\n" +
    "                                </ion-scroll>\n" +
    "                            </div>\n" +
    "                            <div ng-switch-when=\"video\">                            \n" +
    "                                <video class=\"slide-content\" controls=\"controls\" v-source={{slide.src}}  v-follow={{$index}}\n" +
    "                                       on-swipe-left=\"nextClicked()\"\n" +
    "                                       on-swipe-right=\"previousClicked()\"></video>                      \n" +
    "                             </div>                                     \n" +
    "                        </div>                    \n" +
    "                    </ion-slide>\n" +
    "                </ion-slide-box>\n" +
    "                </div>\n" +
    "            <div class=\"col col-5 \">\n" +
    "                <a class=\"button icon-right ion-chevron-right button-clear button-dark slider-button right\" \n" +
    "                   ng-click=\"nextClicked()\"\n" +
    "                   ng-disabled=\"!nextEnabled\"></a>\n" +
    "            </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </ion-content>\n" +
    "</ion-view>"
  );


  $templateCache.put('templates/splash.html',
    "\n" +
    "<ion-view view-title=\"Revu.Me\" hide-back-button=true>\n" +
    "  <ion-content class=\"presentation-background\">\n" +
    "\n" +
    "    <div class=\"centered-container\"  \n" +
    "             ng-intro-options=\"IntroOptions\" ng-intro-method=\"DoIntro\"\n" +
    "\t\t     ng-intro-oncomplete=\"CompletedEvent\" ng-intro-onexit=\"ExitEvent\"\n" +
    "\t\t     ng-intro-onchange=\"ChangeEvent\" ng-intro-onbeforechange=\"BeforeChangeEvent\"\n" +
    "\t\t     ng-intro-onafterchange=\"AfterChangeEvent\"\n" +
    "\t\t     ng-intro-autostart=\"ShouldAutoStart\">\n" +
    "    <div id=\"step1\" class=\"row row-center\">\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>\n" +
    "    <div class=\"col col-80 \">\n" +
    "     <!--   <img ng-src=\"{{image}}\" class=\"splash-image\"> -->\n" +
    "        <div class=\"centered-container hero-container positive-bg\" elem-height=\"0.50\">\n" +
    "              <h3 class=\"hero-welcome\">Welcome {{user.name}} </h3> \n" +
    "        <span class=\"hero\" flash-weight=\"Revu.Me:Ready\">Revu.me</span>\n" +
    "          <button class=\"button button-stable tour-button\" ng-click=\"tourService.start()\">\n" +
    "              Take a Quick Tour\n" +
    "          </button>            \n" +
    "        </div>\n" +
    "    </div>\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>    \n" +
    "    </div>\n" +
    "    <div class=\"row row-center\"\n" +
    "         ng-if=\"user.email=='klynch@volerro.com'\">\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>\n" +
    "        <div class=\"col col-80\">\n" +
    "            <div class=\"centered-container user_list\">\n" +
    "            \n" +
    "          <ion-list>\n" +
    "              <div id=\"step2\" class=\"item item-divider\">\n" +
    "                Users Online\n" +
    "              </div>\n" +
    "              <ion-item class=\"item-icon-left\" ng-repeat=\"user in users\"\n" +
    "                        ng-click=\"login()\">\n" +
    "                  <i class=\"icon ion-android-contact avatar_icon\"></i>\n" +
    "                <h2 ng-if=\"user.name != 'undefined undefined'\">{{user.name}}</h2>\n" +
    "              </ion-item>\n" +
    "          </ion-list>    \n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"col col-10\">\n" +
    "        </div>        \n" +
    "    </div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n" +
    "\n"
  );


  $templateCache.put('templates/team.html',
    "<ion-view title=\"{{teamName}}\" >\n" +
    "  <ion-nav-buttons side=\"right\">\n" +
    "      <button class=\"button button-balanced\"\n" +
    "              ng-disabled=\"teamForm.teamName.$invalid || (addTeam.members.length == 0) || !_$Save\"\n" +
    "              ng-click=\"modalCallback()\">\n" +
    "            Save\n" +
    "      </button>\n" +
    "  </ion-nav-buttons>\n" +
    "<div class=\"bar bar-header item-input-inset\">\n" +
    "  <label class=\"item-input-wrapper\">\n" +
    "    <i class=\"icon ion-ios-search placeholder-icon\"></i>\n" +
    "    <input type=\"search\" placeholder=\"Search\">\n" +
    "  </label>\n" +
    "    </div>\n" +
    "    <ion-content class=\"has-header\">\n" +
    " <form name=\"forms.teamForm\">\n" +
    "                <label class=\"item item-input\">\n" +
    "                  <span class=\"input-label\">Team Name</span>\n" +
    "                  <input name=\"teamName\" type=\"text\" ng-model=\"addTeam.name\" required>\n" +
    "                </label>\n" +
    "                  <div class=\"list\">\n" +
    "                    <div class=\"item item-toggle\">\n" +
    "                        Comma Delimited Input\n" +
    "                        <label class=\"toggle toggle-positive\">\n" +
    "                           <input type=\"checkbox\" ng-model=\"commaDelimited\">\n" +
    "                           <div class=\"track\">\n" +
    "                             <div class=\"handle\"></div>\n" +
    "                           </div>\n" +
    "                        </label>\n" +
    "                    </div>\n" +
    "                    <div ng-show=\"!commaDelimited\">\n" +
    "                        <div class=\"item item-input-inset\">\n" +
    "                            <label class=\"item-input-wrapper\">\n" +
    "                              <input type=\"text\" name=\"mName\" \n" +
    "                                     ng-model=\"addTeam.nameString\" \n" +
    "                                     placeholder=\"Member Name\" \n" +
    "                                     user-complete\n" +
    "                                     field-type='name'\n" +
    "                                     instance-name='team'>\n" +
    "                            </label>                            \n" +
    "                            <label class=\"item-input-wrapper\">\n" +
    "                              <input type=\"email\" name=\"mEmail\" \n" +
    "                                     ng-model=\"addTeam.emailString\" placeholder=\"Member Email\"\n" +
    "                                     user-complete\n" +
    "                                     field-type='email'\n" +
    "                                     instance-name='team'>\n" +
    "                            </label>\n" +
    "                            <button class=\"button button-small\"\n" +
    "                                    ng-click=\"addMember()\" \n" +
    "                                    ng-disabled=\"teamForm.mEmail.$invalid || teamForm.mName.$invalid || !_$AddMember\">\n" +
    "                              add\n" +
    "                            </button>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div ng-show=\"commaDelimited\">\n" +
    "                    <label class=\"item item-input item-stacked-label\">\n" +
    "                        <span class=\"input-label\">Add Members:(pattern:first,last,email;)</span>\n" +
    "                        <textarea class=\"team-textarea\"\n" +
    "                                  name=\"members\" \n" +
    "                                  ng-model=\"addTeam.memberString\"\n" +
    "                                  style=\"width:97%\"\n" +
    "                                  elem-height=\"0.185\"\n" +
    "                                  wrap=\"hard\">\n" +
    "                        </textarea>   \n" +
    "                    </label>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </form>\n" +
    "        </div>\n" +
    "        <div class=\"revu-list-header positive-bg\">\n" +
    "            <button class=\"button button-icon icon ion-minus-circled revu-list-button revu-left\"\n" +
    "                     ng-click=\"toggleListDelete('member')\"\n" +
    "                     ng-disabled=\"!_$DeleteMember\"></button>\n" +
    "            Members\n" +
    "        </div>\n" +
    "\n" +
    "    <ion-scroll elem-height=\"0.80\">\n" +
    "\n" +
    "        <ion-refresher\n" +
    "        pulling-text=\"Pull to refresh...\"\n" +
    "        on-refresh=\"doRefresh()\">\n" +
    "        </ion-refresher>\n" +
    "       \n" +
    "        <ion-list show-delete=\"shouldShowDelete\" delegate-handle=\"member\" >\n" +
    "          <ion-item ng-repeat=\"member in addTeam.members\">\n" +
    "            <ion-delete-button class=\"ion-minus-circled\" \n" +
    "                               ng-click=\"delMember($index)\"></ion-delete-button>\n" +
    "              <div class=\"item item-input item-select\" style=\"border-style:none\">\n" +
    "                  <div class=\"input label\" >\n" +
    "                  <h2>{{member.firstName}} {{member.lastName}}</h2>\n" +
    "                  <p>email: {{member.email}}</p>\n" +
    "                  </div>\n" +
    "                    <select ng-model=\"member.role\" \n" +
    "                      ng-options=\"permission.name for permission in permissions\" \n" +
    "                      ng-disabled=\"!_$ChangeRole\"\n" +
    "                      ng-change=\"setDirty()\">\n" +
    "                    </select>  \n" +
    "              </div> \n" +
    "\n" +
    "          </ion-item>\n" +
    "        </ion-list>\n" +
    "        \n" +
    "    </ion-scroll> \n" +
    "        \n" +
    "  </ion-content>\n" +
    "</ion-view>\n" +
    "                    \n" +
    "                \n"
  );


  $templateCache.put('templates/teams.html',
    "<ion-view title=\"\" >\n" +
    "    <ion-content class=\"has-header\">\n" +
    "        <div class=\"revu-list-header positive-bg\">\n" +
    "            <button class=\"button button-icon icon ion-minus-circled revu-list-button revu-left\"\n" +
    "                     ng-click=\"toggleListDelete('team')\"></button>\n" +
    "            Your Teams\n" +
    "            <button class=\"button button-icon icon ion-plus-circled revu-list-button revu-right\"\n" +
    "                    ng-click=\"newTeam()\"></button>\n" +
    "  \n" +
    "        </div>\n" +
    "\n" +
    "   <ion-scroll elem-height=\"0.80\">\n" +
    "\n" +
    "  <ion-refresher\n" +
    "    pulling-text=\"Pull to refresh...\"\n" +
    "    on-refresh=\"doRefresh()\">\n" +
    "  </ion-refresher>\n" +
    "       \n" +
    "\n" +
    "      <ion-list show-delete=\"shouldShowDelete\" delegate-handle=\"team\" >\n" +
    "          <ion-item class=\"item-button-right\" \n" +
    "                    ng-repeat=\"team in teams\" \n" +
    "                    ng-click=\"editTeam($index)\">\n" +
    "            <ion-delete-button class=\"ion-minus-circled\" \n" +
    "                               ng-click=\"delTeam($index,$event); $event.stopPropogation();\">\n" +
    "            </ion-delete-button>\n" +
    "              <h2>{{team.name}}</h2>\n" +
    "              <p>Total Members: {{team.members.length}}</p>\n" +
    "              <p>{{team.previewString}}</p>\n" +
    "          </ion-item>\n" +
    "        </ion-list>\n" +
    "    </ion-scroll> \n" +
    "  </ion-content>\n" +
    "</ion-view>\n" +
    "                    \n" +
    "                \n"
  );


  $templateCache.put('templates/tour-template.html',
    "    <div class=\"tour-tip-container positive-bg\">\n" +
    "        <div class=\"tour-tip\">\n" +
    "            <p ng-bind-html=\"step.text\"></p>\n" +
    "        </div>\n" +
    "        <div class=\"tour-tip-buttons dark-bg\">\n" +
    "            <a class=\"button button-clear button-small\"\n" +
    "               ng-click=\"tourService.end()\">End Tour</a>\n" +
    "            <div class=\"tour-tip-controls\">\n" +
    "                <a class=\"button button-clear button-small\"\n" +
    "                   ng-click=\"tourService.previous($event)\">Previous</a>\n" +
    "                <a class=\"button button-clear button-small\"\n" +
    "                   ng-click=\"tourService.next($event)\">Next</a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>"
  );


  $templateCache.put('templates/users.html',
    "<ion-view title=\"Presentations\">\n" +
    "  <ion-nav-buttons side=\"left\">\n" +
    "      <button menu-toggle=\"left\" class=\"button button-icon icon ion-navicon\"></button>\n" +
    "  </ion-nav-buttons>\n" +
    "  <ion-content class=\"has-header\">\n" +
    "      <ion-list>\n" +
    "          <ion-item ng-repeat=\"deck in presentationList()\" \n" +
    "                    ng-click=\"setSelected($index)\">{{deck.name}}</ion-item>\n" +
    "      </ion-list>\n" +
    "  </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/viewer.html',
    "<ion-view view-title=\"{{name}}\" >  \n" +
    "    <ion-nav-buttons side=\"right\">\n" +
    "        <button class=\"button icon ion-ios-telephone\" ng-click=\"bridgeService.showBridgeInfo()\"></button>\n" +
    "    </ion-nav-buttons>\n" +
    "    <ion-content class=\"has-header presentation-background\" scroll=\"false\" id=\"viewer\" fullscreen>\n" +
    "        <div class=\"centered-container slide\" elem-size controls=false>\n" +
    "<!--            <div class=\"row\">\n" +
    "                <div class=\"col col-10\">\n" +
    "                </div>\n" +
    "\n" +
    "                <div class=\"col col-80\" >\n" +
    "-->\n" +
    "                        <ion-slide-box disable-scroll=\"true\"  class=\"bordered-drop-shadow\" show-pager=\"false\">\n" +
    "                            <ion-slide ng-repeat=\"slide in presentation.slides\">\n" +
    "\n" +
    "                                <div ng-switch on=\"slide.type\">\n" +
    "                                    <div ng-switch-when=\"img\">\n" +
    "                                        <ion-scroll direction=\"xy\" \n" +
    "                                                    scrollbar-x=\"false\" \n" +
    "                                                    scrollbar-y=\"false\"\n" +
    "                                                    zooming=\"true\" \n" +
    "                                                    min-zoom=\"1.0\" \n" +
    "                                                    style=\"width: 100%; height: 100%\">\n" +
    "                                        <img ng-src=\"{{slide.src}}\" class=\"slide-content\" >\n" +
    "                                        </ion-scroll>\n" +
    "                                    </div>\n" +
    "                                    <div ng-switch-when=\"video\">                            \n" +
    "                                        <video class=\"slide-content\" controls=\"controls\" v-source={{slide.src}}  v-follow={{$index}}></video>                      \n" +
    "                                     </div>                                     \n" +
    "                                    \n" +
    "                                    \n" +
    "                                </div>                    \n" +
    "                            </ion-slide>\n" +
    "                        </ion-slide-box>\n" +
    "\n" +
    "                     <div class=\"presence-message dark-bg\" appear-up=\"show_message\">\"\"</div>\n" +
    "                    </div>\n" +
    "<!--                </div>\n" +
    "\n" +
    "                <div class=\"col col-10 \">\n" +
    "                </div>  \n" +
    "-->\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </ion-content>\n" +
    "</ion-view>\n"
  );


  $templateCache.put('templates/welcomeTemplate.html',
    "<ion-modal-view>\n" +
    "    <ion-content> \n" +
    "        <div class=\"centered-container hero-container positive-bg\" style=\"margin-top:20px\" elem-height=\"0.50\">\n" +
    "              <h3 class=\"hero-welcome\">Welcome {{user.name}} </h3> \n" +
    "              <span class=\"hero\" >Revu.me</span>\n" +
    "        </div>\n" +
    "    </ion-content>\n" +
    "</ion-modal-view>\n"
  );

}]);
