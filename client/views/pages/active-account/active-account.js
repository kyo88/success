/**
 * Created by HungNguyen on 10/8/15.
 */

AutoForm.hooks({
    activeAccountForm: {
        onSubmit(doc) {
            Meteor.call('activeAccount', doc, function(err, userId) {
                if(err) throw err;
                if(userId) {
                    Meteor.loginWithPassword(doc.email, doc.password, function(err, result) {
                        if(err) throw err;
                        Router.go('dashboard');
                    });
                }
            });
            return false;
        }
    }
})

Template.activeAccount.onCreated(function () {
    var instance = Template.instance();
    instance.props = new ReactiveDict();
    instance.props.set('info', null);
    var params = Router.current().params;
    if (params.keyid) {
        Meteor.call('getRequestInfo', params.keyid, function (err, result) {
            if (err) return false;
            console.log('key', result);
            if (result)
                instance.props.set('info', result);

            return {};

        });
    }
});


Template.activeAccount.helpers({
    schema: function() {
        var data = Template.instance().props.get('info');
        return new SimpleSchema({
            emailText: {
                type: String,
                label: 'Email',
                defaultValue: data.email,
                autoform: {
                    disabled: true
                }
            },
            email: {
                type: String,
                defaultValue: data.email,
                autoform: {
                    type: 'hidden'
                }
            },
            key: {
                type: String,
                defaultValue: data._id,
                autoform: {
                    type: 'hidden'
                }
            },
            fullname: {
                type: 'string',
                autoform: {
                    value: data.name
                }
            },
            username: {
                type: 'string',
                autoform: {
                    value: data.userId
                }
            },
            password: {
                type: 'string',
                autoform: {
                    type: 'password'
                }
            }
        });
    },
    info: function () {
        return Template.instance().props.get('info');
    }
});

Template.activeAccount.events({
   'submit #requestInvitationForm': function(e) {
       var self = this;
       e.preventDefault();
       var obj = {};
       $.each($('#requestInvitationForm').serializeArray(), function (index, value) {
           obj[value.name] = value.value;
       });
       console.log(obj);
   }
});


/*
 Meteor.call('getRequestInfo', params.keyid, function (err, userInfo) {
 if (err) return false;
 console.log(userInfo);
 if (!userInfo) {
 self.response.end();
 }
 var tempName = userInfo.split(' ');
 var firstName = tempName.shift();
 var lastName = tempName.join(' ');
 var user = {};
 user.username = userInfo.email;
 user.password = 'defaultpwd';
 user.userId = userInfo.userId;

 user.profile = {
 firstname: firstName,
 lastname: lastName
 };

 Accounts.createUser(user, function (err, result) {
 if (err) throw err;

 if (result) {
 //login-user
 var loggedIn = '';
 if (loggedIn) {
 var url = Meteor.absoluteUrl('/account/update');
 self.response.writeHead(301, {
 Location: url
 });
 self.response.end();
 } else {
 self.response.end();
 }
 } else {

 }
 });

 });*/