Router.route('/downloadresume/:companyId/:entryId/:token', {
    name: 'downloadResume',
    where: 'server',
    action: function () {
        try {
            var dataToken = IZToken.decode(this.params.token);
            if (dataToken.companyId == this.params.companyId && dataToken.expireTime >= Date.now()) {
                var application = Collections.Applications.findOne({
                    entryId: +this.params.entryId,
                    companyId: +this.params.companyId
                });
                if (application && application.source == 2) {
                    var fileName = application.data.fileName;
                    var fileAlias = application.data.alias;
                    var physicalFolder = application.data.physicalFolder;
                    var mimeType = application.data.fileMime;
                    var cvLink = sprintf(Meteor.settings.downloadResume, physicalFolder, fileName);

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

Router.route('/webhook/job', {
    where: 'server',
    action: function () {
        this.response.end();
        try {
            var token = this.request.headers['x-access-token'];
            if (!token || !IZToken.decode(token)) return null;
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
        } catch (e) {
            console.log('Received request to job hook: ', e);
        }
    }
});


Router.route('/webhook/application', {
    where: 'server',
    action: function () {
        this.response.end();
        try {
            var token = this.request.headers['x-access-token'];
            if (!token || !IZToken.decode(token)) return null;
            var data = this.request.body;
            check(data, {
                jobId: Number,
                entryId: Number,
                source: Number
            });
            var type = null;
            switch (this.request.method.toLowerCase()) {
                case 'post':
                    type = 'addApplication';
                    break;
                case 'put':
                    type = 'updateApplication';
                    break;
            }
            type && SYNC_VNW.addQueue(type, data);
        } catch (e) {
            console.log('Received request to application hook: ', e);
        }
    }
});