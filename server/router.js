Router.route('/downloadresume/:companyId/:entryId/:token', {
    name: 'downloadResume',
    where: 'server',
    action: function () {
        try {
            var dataToken = IZToken.decode(this.params.token);
            if (dataToken.companyId == this.params.companyId && dataToken.expireTime >= Date.now()) {
                var application = Collections.Applications.findOne({
                    _id: this.params.entryId,
                    companyId: dataToken.companyId
                });
                if (application && application.source == 2) {
                    var fileName = application.data.fileName;
                    var fileAlias = application.data.alias;
                    var physicalFolder = application.data.physicalFolder;
                    var mimeType = application.data.fileMime;
                    var cvLink = sprintf(process.env.DOWNLOAD_RESUME_URL, physicalFolder, fileName);

                    this.response.writeHead(200, {
                        'Content-type': mimeType,
                        'Content-disposition': 'attachment; filename=' + fileAlias
                    });
                    request(cvLink).pipe(this.response);
                    return;
                }
            }
            this.response.writeHead(400);
            this.response.end("Parameters invalid");
        } catch (e) {
            this.response.writeHead(400);
            this.response.end("Parameters invalid");
        }
    }
});

/**
 * Implement webhooks
 */
Router.onBeforeAction(Iron.Router.bodyParser.json({limit: '50mb'}));
function authWebhookToken() {
    try {
        var token = this.request.headers['x-access-token'];
        if (!token || !IZToken.decode(token)) {
            this.response.writeHead(200);
            this.response.end(EJSON.stringify({success: false, msg: 'Access token invalid'}));
        } else {
            this.next();
        }
    } catch (e) {
        console.trace('Received request to application hook: ', e);
        this.response.writeHead(200);
        this.response.end(EJSON.stringify({success: false, msg: 'Access token invalid'}));
    }
}

Router.route('/webhook/job', {
    where: 'server',
    onBeforeAction: authWebhookToken,
    action: function () {
        try {
            var data = this.request.body;
            check(data, {
                jobId: Number,
                userId: Number,
                companyId: Number
            });
            var type = null;
            switch (this.request.method.toLowerCase()) {
                case 'post':
                    type = 'addJob';
                    break;
                case 'put':
                    type = 'updateJob';
                    break;
            }
            type && SYNC_VNW.addQueue(type, data);
            this.response.writeHead(200);
            this.response.end(EJSON.stringify({success: true, msg: ''}));
        } catch (e) {
            console.trace('Received request to job hook: ', e);
            this.response.writeHead(200);
            this.response.end(EJSON.stringify({success: false, msg: 'Parameters invalid'}));
        }
    }
});

Astro.createType({
    name: 'ResumeEducation',
    constructor: function Type(fieldDefinition) {

    },
    getDefault: function (defaultValue) {
        return {};
    },
    cast: function (value) {
    },
    needsCast: function (value) {
    },
    plain: function (value) {
    },
    needsPlain: function (value) {
    }
});

Resume = Astro.Class({
    name: 'Resume',
    fields: {

        education: {
            type: 'ResumeEducation',
            default() {
                return [];
            }
        },

        skills: {
            type: 'array',
            default() {
                return [];
            }
        }
    }
});

Router.route('/webhook/application', {
    where: 'server',
    onBeforeAction: authWebhookToken,
    action: function () {
        try {
            var data = this.request.body
                , cond = false;

            check(data, {
                jobId: Number,
                entryId: Number,
                source: Number
            });
            var type = 'addApplication';

            switch (this.request.method.toLowerCase()) {
                case 'post':
                    type = 'addApplication';
                    cond = Application.findOne({appId: data.entryId});
                    break;
                case 'put':
                    type = 'updateApplication';
                    break;
                default:
                    break;
            }

            if (type) {
                var job = JobExtra.findOne({jobId: data.jobId});
                cond = !!(!cond && job);

                if (cond) {
                    data.companyId = job.companyId;
                    sJobCollections.addJobtoQueue(type, data);
                }
            }

            this.response.writeHead(200);
            this.response.end(EJSON.stringify({success: true, msg: ''}));
        } catch (e) {
            console.trace('Received request to application hook: ', e);
            this.response.writeHead(200);
            this.response.end(EJSON.stringify({success: false, msg: 'Parameters invalid'}));
        }
        return true;
    }
});


Router.route('/api/resume', {
    where: 'server',
    action: function () {
        var resume = createMockupResume();
        this.response.writeHead(200);
        this.response.end(EJSON.stringify(resume));
    }
});


function createMockupResume() {
    var resume = {
        fullname: faker.name.findName(),
        coverLetter: faker.lorem.paragraph(),
        phone: [],
        emails: [],
        yearOfExperience: _.random(1, 10),
        currentJobLevel: '',
        careerObjective: '',
        recentPosition: faker.name.jobTitle(),
        recentCompany: faker.company.companyName(),
        skills: faker.lorem.words(),
        education: [],
        experience: [],
        reference: [],
        attachment: ''
    };

    // add phone
    _.each(_.range(_.random(0, 3)), () => {
        resume.phone.push(faker.phone.phoneNumber());
    });

    // add emails
    _.each(_.range(_.random(0, 3)), () => {
        resume.emails.push(faker.internet.email());
    });

    // add educations
    _.each(_.range(_.random(1, 4)), () => {
        const start = new moment();
        const end = new moment();
        let step = _.random(12, 24);
        start.subtract(step, 'month');
        end.subtract(step - _.random(1, 12), 'month');

        resume.education.push({
            school: faker.company.companyName(),
            major: faker.name.jobTitle(),
            start: start.format('MM/YYYY'),
            end: end.format('MM/YYYY'),
            description: faker.lorem.sentences()
        });
    });

    // add experience
    _.each(_.range(_.random(2, 5)), () => {
        const start = new moment();
        const end = new moment();
        let step = _.random(12, 24);
        start.subtract(step, 'month');
        end.subtract(step - _.random(1, 12), 'month');

        resume.experience.push({
            company: faker.company.companyName(),
            position: faker.name.jobTitle(),
            start: start.format('MM/YYYY'),
            end: end.format('MM/YYYY'),
            description: faker.lorem.sentences(),
            isCurrent: false
        });
    })

    if (resume.experience.length > 0) {
        const currentCompanyIndex = _.random(0, resume.experience.length - 1);
        resume.experience[currentCompanyIndex].isCurrent = true;
    }

    // add references
    _.each(_.range(_.random(0, 3)), () => {
        resume.reference.push({
            name: faker.name.findName(),
            title: faker.name.jobTitle(),
            company: faker.company.companyName(),
            phone: faker.phone.phoneNumber(),
            email: faker.internet.email(),
            description: faker.lorem.sentences()
        });
    });
    resume.attachment = 'http://images.staging.vietnamworks.com/resumes_sentdirectly/resume/9153/3769153/7f/832f2c43bbf457fa69d3dbfe03952b89.pdf';

    return resume;
}


var ESSuggest = Meteor.wrapAsync(function (query, cb) {
    ES.suggest(query).then(function (body) {
        cb(null, body)
    }, function (error) {
        cb(error, {});
    });
});

ESSearch = Meteor.wrapAsync(function (query, cb) {
    ES.search(query).then(function (body) {
        cb(null, body)
    }, function (error) {
        cb(error, {});
    });
});

Router.route('/api/skill/:jobId/:alias/search', {
    where: 'server',
    action: function () {
        const { q } = this.request.query;
        let results = [];
        if (q && q.length > 0) {
            const req = ESSuggest({
                index: 'suggester',
                body: {
                    skill: {
                        "text": q,
                        "completion": {
                            "field": "skillNameSuggest"
                        }
                    }
                }

            });

            if (req && req['skill'] && req['skill'].length > 0) {
                results = [];
                _.each(req['skill'][0]['options'], function (opt) {
                    results.push({
                        id: opt.text,
                        text: opt.text
                    })
                });
            }
        } else {
            if (this.params.alias === "skills") {
                const req = ESSuggest({
                    index: 'suggester',
                    body: {
                        skill: {
                            "text": 'a',
                            "completion": {
                                "field": "skillNameSuggest"
                            }
                        }
                    }
                });

                if (req && req['skill'] && req['skill'].length > 0) {
                    results = [];
                    _.each(req['skill'][0]['options'], function (opt) {
                        results.push({
                            id: opt.text,
                            text: opt.text
                        })
                    });
                }
            } else {
                results = JobCriteriaSuggestion.collection.find({
                    templateName: this.params.alias,
                    isDefault: true
                }).map(function (r) {
                    return {
                        id: r.keyword,
                        text: r.keyword
                    }
                });
            }
        }

        this.response.writeHead(200);
        this.response.end(EJSON.stringify({results: results}));
    }
});