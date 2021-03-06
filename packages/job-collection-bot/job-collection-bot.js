// Write your package code here!


var SyncQueue = Collections.SyncQueue;


sJobCollections = (function () {
    return {
        registerJobs: function (name, jobProcessing, options) {
            if (typeof name !== 'string' || typeof jobProcessing !== 'function') return false;

            return SyncQueue.processJobs(name, options, jobProcessing);
        },
        addJobtoQueue: function (type, data, options, time) {
            if (typeof type !== 'string') return false;

            options = _.extend({
                retries: 5,
                wait: 1 * 60 * 1000
            }, options);

            //console.log(type, data, options, time);
            return Job(SyncQueue, type, data).retry(options).after(time || new Date()).save();
        }
    }
})();