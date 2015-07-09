////////////////////////////////////////////////////////////////////
// OVERRIDE ACCOUNTS METHODS
////////////////////////////////////////////////////////////////////
Meteor.user = AccountsVNW.user;
Meteor.userId = AccountsVNW.userId;
Meteor.loggingIn = AccountsVNW.loggingIn;
Meteor.logout = AccountsVNW.logout;

////////////////////////////////////////////////////////////////////
// EXTEND ACCOUNTS METHODS
////////////////////////////////////////////////////////////////////
Meteor.loginAsEmployer = AccountsVNW.loginAsEmployer;
Meteor.loginAsJobSeeker = AccountsVNW.loginAsJobSeeker;

/**
 *
 */
UI.registerHelper('username', function() {
    var user = Meteor.user();
    if( user ) {
        if ( user.lastname && user.firstname ) {
            return user.lastname + " " + user.firstname;
        }
        return user.username;
    }
    return "";
});

Meteor.startup(function() {
    AccountsVNW.initUserLogin();
});
