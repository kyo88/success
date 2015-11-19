/**
 * Created by HungNguyen on 11/18/15.
 */


var VNW_QUERIES = Meteor.settings.cronQueries;

var fetchVNWData = Meteor.wrapAsync(function (query, callback) {
    var conn = mysqlManager.getPoolConnection();

    conn.query(query, function (err, rows, fields) {
        if (err) throw err;
        conn.release();
        callback(err, rows);
    });
});

var citiesObj = Meteor.cities.find({languageId: 2}).fetch() || [];

var getApplicationByJobId = (job, cb)=> {
    var JobExtraCollection = JobExtra.getCollection();
    var appCollection = Application.getCollection();
    var data = job.data;
    var jobId = data.jobId;

    if (!data.jobId || !data.companyId)
        j.done();
    else {
        try {
            var appSql = sprintf(VNW_QUERIES.getApplicationByJobId, jobId, jobId);
            var appRows = fetchVNWData(appSql);

            appRows.forEach(function (info) {
                var application = appCollection.findOne({appId: info.appId});
                if (!application) {
                    application = new Application();
                    application.set('appId', info.appId);
                    application.set('type', info.appType);
                    application.set('jobId', info.jobId);
                    application.set('candidateId', info.candidateId);
                    application.set('companyId', data.companyId);
                    application.set('matchingScore', info.score);
                    application.set('coverLetter', info.coverLetter);
                    application.set('firstname', info.firstname);
                    application.set('lastname', info.lastname);
                    application.set('genderId', info.genderId);
                    application.set('dob', info.birthday);
                    application.set('countryId', info.countryId);

                    if (citiesObj[info.cityId])
                        application.set('cityName', citiesObj[info.cityId]['name']);

                    var emails = _.unique((info.emails) ? info.emails.split('|') : []);

                    application.set('emails', emails);
                    application.set('appliedDate', info.appliedDate);
                }

                application.set('isDeleted', !!(info.isDeleted)); // the only field update

                application.save();

            });

            var appStages = appCollection.find({jobId: jobId}, {fields: {'stage': 1}}).fetch();


            var currentJob = JobExtraCollection.findOne({jobId: jobId});
            if (currentJob) {
                if (appStages.length) {
                    var count = _.countBy(appStages, 'stage');

                    var stages = {
                        'sourced': count[0] || 0,
                        'applied': count[1] || 0,
                        'phone': count[2] || 0,
                        'interview': count[3] || 0,
                        'offer': count[4] || 0,
                        'hired': count[5] || 0
                    };

                    currentJob.set('stage', stages);
                }

                currentJob.set('syncState', 'synced');
                currentJob.save();
            }


        } catch (e) {
            console.log('insert application error :', data);

            if (jobId) {
                var failedJob = JobExtraCollection.findOne({jobId: jobId});
                failedJob.set('syncState', 'syncFailed');
                failedJob.save();
            }
            console.trace(e);
        }
    }
    cb();


};

Collections.SyncQueue.processJobs('getApplications', {concurrency: 20, payload: 1}, getApplicationByJobId);