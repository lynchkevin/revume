
<ion-view view-title="Sign Up">
  <ion-content ng-class="{'dark-bg':isMobile}">

    <div class="centered-container"  >
    <div class="row row-center">
        <div class="col col-10">
        </div>
    <div class="col col-80 ">
     <!--   <img ng-src="{{image}}" class="splash-image"> -->
        <div class="centered-container hero-container positive-bg padding-bottom" >
            <span class="hero-header">Revu.Me</span> 
            <div class="signup-form">
                <form name="forms.signup" ng-controller="signupCtrl">
                    <div class="list list-inset">
                      <label class="item item-input">
                        <span class="input-label">First Name</span>
                        <input name="fName"
                               ng-model="forms.signup.firstName"
                               type="text"
                               required>
                      </label>
                      <div class="input-spacer positive-bg"></div>
                      <label class="item item-input">
                        <span class="input-label">Last Name</span>
                        <input name="lName"
                               ng-model="forms.signup.lastName"
                               type="text"
                               required>
                      </label>
                      <div class="input-spacer positive-bg"></div>
                      <label class="item item-input">
                        <span class="input-label">Email</span>
                        <input name="inpEmail"
                               ng-model="forms.signup.email"
                               type="email"
                               required>
                      </label>
                      <div class="input-spacer positive-bg"></div>
                      <label class="item item-input">
                        <span class="input-label">Password</span>
                        <input name="inpPassword"
                               ng-model="forms.signup.password"
                               type="password"
                               required>
                      </label>
                    </div>
                    <button class="button "
                            ng-click="doSignUp()"
                            ng-disabled="!forms.signup.fName.$dirty || 
                                         !forms.signup.lName.$dirty || 
                                         !forms.signup.inpPassword.$dirty || 
                                         !forms.signup.inpEmail.$dirty || 
                                         forms.signup.inpEmail.$invalid">
                        Sign Up
                    </button>
                    <div class="signin-button">
                        <p class="signin-message" ng-click="signIn()">Sign In</p>
                    </div>
                    <div>
                        <span ng-if="forms.signup.inpEmail.$dirty && forms.signup.inpEmail.$invalid"
                              class="signin-message">
                            Invalid Email Format
                        </span>
                        <span ng-if="forms.signup.inpPassword.$dirty && forms.signup.inpPassword.$error.required"
                              class="signin-message">
                            Password is Required
                        </span>      
                        <span ng-if="forms.signup.fName.$dirty && forms.signup.fName.$error.required"
                              class="signin-message">
                            First Name is Required
                        </span>  
                            <span ng-if="forms.signup.lName.$dirty && forms.signup.lName.$error.required"
                              class="signin-message">
                            Last Name is Required
                        </span>  
                    </div>

                </form>
            </div>
        </div>

    </div>
        <div class="col col-10">
        </div>    
    </div>
    </div>
  </ion-content>
</ion-view>
