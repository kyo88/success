/**
 * Created by HungNguyen on 8/21/15.
 */

DEFAULT_JOB_OPTIONS = {
    fields: {
        jobId: 1,
        userId: 1,
        companyId: 1,
        title: 1,
        level: 1,
        categories: 1,
        locations: 1,
        salaryMin: 1,
        salaryMax: 1,
        showSalary: 1,
        description: 1,
        requirements: 1,
        benefits: 1,
        source: 1,
        status: 1,
        createdAt: 1,
        createdBy: 1,
        expiredAt: 1,
        recruiterEmails: 1,
        recruiters: 1,
        tags: 1,
        stages: 1
    }
};

var publications = {};

var appCollection = Meteor.applications
    , candidateCollection = Meteor.candidates;

/**
 * Publish own jobs and job assigned
 * @param filters
 * @param options
 * @param filterEmailAddress
 * @returns {Cursor}
 */
publications.getJobs = function (filters, options, filterEmailAddress) {
    if (!this.userId) return this.ready();
    var self = this;
    return {
        find: function () {
            try {
                check(filters, Object);
                check(options, Match.Optional(Object));
                var user = Meteor.users.findOne({_id: self.userId});
                var permissions = user.jobPermissions();

                filters = _.pick(filters, 'status', 'source', 'recruiterEmails');
                filters['$or'] = permissions;

                options = _.pick(options, 'limit', 'sort');
                options['fields'] = DEFAULT_JOB_OPTIONS['fields'];

                if (!options.hasOwnProperty("limit")) {
                    options['limit'] = 10;
                } else {
                    options['limit'] += 5;
                }
                //return Collections.Jobs.find(filters, options);
                return Meteor['jobs'].find(filters, options);
            } catch (e) {
                debuger(e);
                return self.ready();
            }
        },
        children: []
    };
};

/**
 * Publish details of job and 5 jobs related
 * @param options
 * @param options.jobId {String}
 * @returns {Cursor}
 */

publications.jobDetails = function (opt) {
    if (!this.userId) return this.ready();
    check(opt, {
        jobId: Match.Any
    });

    var self = this;
    var user = Meteor.users.findOne({_id: self.userId});
    var permissions = user.jobPermissions();
    return {

        /*
         find: function () {
         var user = Meteor.users.findOne({_id: self.userId});
         var permissions = user.jobPermissions();
         var curJobCond = {
         _id: opt.jobId,
         $or: permissions
         };
         //var job = Collections.Jobs.findOne(curJobCond);
         var job = Meteor['jobs'].findOne(curJobCond);
         if (!job) return null;
         var cond = {
         $or: [
         {_id: job._id},
         {
         */

        find: function () {
            var cond = {
                _id: opt.jobId,
                $or: permissions
            };
            console.log('jobcon', cond);
            return Collection.find(cond);
        },
        children: [
            // Related jobs
            {
                find: function (job) {
                    var cond = {
                        _id: {$ne: job._id},
                        status: job.status,
                        $or: permissions
                    };
                    console.log('child jobcon', cond);
                    return Collection.find(cond, {limit: 5});
                }
            },
        /**
         * Publish application and candidate selected
         */
            {
                find: function (job) {
                    if (job && opt.application) {
                        return appCollection.find({_id: opt.application}, {limit: 1});
                    }
                    return null;
                },

                children: [
                    {
                        find: function (app) {
                            if (app) {
                                return candidateCollection.find({candidateId: app.candidateId}, {limit: 1});
                            }
                            return null;
                        }
                    }
                ]
            }
        ]
    }
};

publications.jobCounter = function (counterName, filters, filterEmailAddress) {
    if (!this.userId) return this.ready();
    var self = this;
    check(counterName, String);
    check(filters, Object);
    return {
        find: function () {
            var count = 0;
            var initializing = true;
            var user = Meteor.users.findOne({_id: self.userId});
            if (!user) return;
            var permissions = user.jobPermissions();
            //filters['companyId'] = user.companyId || null;

            //if (filterEmailAddress)
            //    filters['data.emailaddress'] = new RegExp(filterEmailAddress, 'i');
            //
            //var recruiterFilter = {
            //    "recruiters.userId": user._id
            //};

            filters['$or'] = permissions;
            //var handle = Collections.Jobs.find(filters).observeChanges({
            var handle = Meteor['jobs'].find(filters).observeChanges({
                added: function (id) {
                    count++;
                    if (!initializing)
                        self.changed("vnw_counts", counterName, {count: count});
                },
                removed: function (id) {
                    count--;
                    self.changed("vnw_counts", counterName, {count: count});
                }
            });

            initializing = false;
            self.added("vnw_counts", counterName, {count: count});
            self.ready();

            self.onStop(function () {
                handle.stop();
            });
        }
    }
};


/**
 * Publish job's stages application count
 * @param counterName
 * @param jobId
 * @returns {Cursor}
 */
publications.jobStagesCounter = function (counterName, jobId) {
    if (!this.userId) return this.ready();
    var self = this;
    check(counterName, String);
    check(jobId, String);
    return {
        find: function () {
            var count = {
                0: 0,
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            };
            var initializing = true;
            var user = Meteor.users.findOne({_id: this.userId});
            if (!user) return;
            //var job = Collections.Jobs.findOne({_id: jobId});
            var job = Meteor['jobs'].findOne({_id: jobId});
            if (!job) return;


            var filters = {
                jobId: job.jobId,
                isDeleted: 0
            };
            var options = {
                fields: {
                    stage: 1
                }
            };
            var handle = Meteor.applications.find(filters, options).observe({
                added: function (doc) {
                    count[doc.stage]++;
                    if (!initializing)
                        self.changed("vnw_counts", counterName, {count: count});
                },
                changed: function (newDoc, oldDoc) {
                    count[oldDoc.stage]--;
                    count[newDoc.stage]++;
                    self.changed("vnw_counts", counterName, {count: count});
                },
                removed: function (doc) {
                    count[doc.stage]--;
                    self.changed("vnw_counts", counterName, {count: count});
                }
            });

            initializing = false;
            self.added("vnw_counts", counterName, {count: count});
            self.ready();

            self.onStop(function () {
                handle.stop();
            });
        }
    }
};

/**
 * publish 10 open jobs
 * @returns {*}
 */
publications.lastOpenJobs = function () {
    if (!this.userId) return this.ready();
    var self = this;
    return {
        find: function () {
            var user = Meteor.users.findOne({_id: self.userId});
            var permissions = user.jobPermissions();
            var filters = {
                status: 1,
                $or: permissions
            };

            var options = DEFAULT_JOB_OPTIONS;
            options['limit'] = 10;
            options['sort'] = {
                createdAt: -1
            };
            //return Collections.Jobs.find(filters, options);
            return Meteor['jobs'].find(filters, options);
        }
    }
};


/**
 * addjobPage
 */


/*publications.addJobPage = function () {
 console.log('this userid', this.userI);
 if (!this.userId) return this.ready();
 var cursors = [];
 var jobLevels = Meteor.job_levels.find();
 var industries = Meteor.industries.find();
 var cities = Meteor.cities.find();
 console.log('cur : ', jobLevels, industries);
 cursors.push(jobLevels);
 cursors.push(industries);
 cursors.push(cities);
 return cursors;
 }*/


Meteor.publish('addJobPage', function () {
    if (!this.userId) return this.ready();
    var cursors = [];
    var jobLevels = Meteor.job_levels.find();
    var industries = Meteor.industries.find();
    var cities = Meteor.cities.find();

    cursors.push(jobLevels);
    cursors.push(industries);
    cursors.push(cities);
    return cursors;
});


/**
 * Map job's publications to Meteor
 */
_.each(publications, (func, name) => {
    Meteor.publishComposite(name, func);
});