/**
 * Created by HungNguyen on 9/9/15.
 */


User.prototype.activities = function () {
    var query = {
        typeId: 0,
        userId: this.vnwId
    };
    return Collection.find(query).fetch();
};

Company.prototype.activities = function () {
    var query = {
        typeId: 1,
        companyId: this.companyId
    };

    return Collection.find(query).fetch();
};

Job.prototype.activities = function () {
    var query = {
        typeId: 2,
        jobId: this.jobId
    };

    return Collection.find(query).fetch();
};