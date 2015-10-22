/**
 * Created by HungNguyen on 8/24/15.
 */


Company.prototype.application = function (options) {
    if (this.companyId == void 0) return [];
    return Collection.find({companyId: this.companyId}, options || {}).fetch();
};

vnwJob.prototype.application = function (options) {
    if (this.jobId == void 0) return [];
    return Collection.find({jobId: this.jobId}, options || {}).fetch();
};

Candidate.prototype.application = function (options) {
    if (this.candidateId == void 0) return [];
    return Collection.find({candidateId: this.candidateId}, options || {}).fetch();
};

User.prototype.canViewApplication = function (appId) {
    var app = Collections.Applications.findOne({_id: appId});
    if(app) {
        var permission = this.jobPermissions();
        return !!Collections.Jobs.find({jobId: app.jobId, $or: permission}).count();
    }
    return false;
};