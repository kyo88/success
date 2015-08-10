AccountsVNW = {}
AccountsVNW._store = ReactiveCookie;
AccountsVNW._loggingIn = new ReactiveVar(false);
AccountsVNW._loginDuration = Meteor.settings.public.loginDuration || {days: 1};
AccountsVNW._connection = Meteor.connection;

AccountsVNW._setUserLogin = function(user) {
    AccountsVNW._store.set('user', EJSON.stringify(user), this._loginDuration);
    AccountsVNW.initUserLogin();
};

AccountsVNW.initUserLogin = function() {
    var _user = AccountsVNW.user();
    if( _user ) {
        AccountsVNW._connection.setUserId(_user.userid);
        Meteor.call('onUserReconnect', _user.userid);
        AccountsVNW._connection.onReconnect = function() {
            Meteor.call('onUserReconnect', _user.userid);
        };
    }
};


/**
 * Login service with Employer account
 * @param username {String}
 * @param password {String}
 * @param callback {Function}
 */
AccountsVNW.loginAsEmployer = function (username, password, callback) {
    AccountsVNW._loggingIn.set(true);

    var _account = {username: username, password: password};
    Meteor.call('loginAsEmployer', _account, function(err, result) {
        AccountsVNW._loggingIn.set(false);

        if(!err) {
            if( result.success ) {
                AccountsVNW._setUserLogin(result.data);
                callback && callback(result);
            } else {
                callback && callback(result);
            }
        } else {
            callback && callback(err);
        }
    });
};

/**
 * NO IMPLEMENT
 * Login service with JobSeeker account
 * @param username
 * @param password
 * @param callback
 */
AccountsVNW.loginAsJobSeeker = function (username, password, callback) {

}
/**
 * Get user logged in
 * @returns {*}
 */
AccountsVNW.user = function() {
    var _user = AccountsVNW._store.get('user');
    return  _user ? EJSON.parse(_user) : undefined;
}

AccountsVNW.userId = function() {
    return AccountsVNW.user() ? AccountsVNW.user().userid : undefined;
}

AccountsVNW.loggingIn = function() {
    return AccountsVNW._loggingIn.get();
}

AccountsVNW.logout = function() {
    AccountsVNW._store.clear('user');
    AccountsVNW._connection.setUserId(null);
    AccountsVNW._connection.onReconnect = null;
}