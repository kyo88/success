HiringProcess = BlazeComponent.extendComponent({
    onCreated: function() {
        var self = this;
        this.jobId = Session.get("currentJobId");
        this.stage = Session.get("currentStage");
        this.trackers = [];

        this.trackers.push(Template.instance().autorun(function () {
            DashboardSubs.subscribe("jobStagesCounter", "job_stages_" + self.jobId, self.jobId);
        }));
    },

    onDestroyed: function() {
        _.each(this.trackers, function (tracker) {
            tracker.stop();
        });
    },

    stages: function () {
        var self = this;
        var stages = [];
        var counter = Collections.Counts.findOne("job_stages_" + self.jobId);
        _.each(Recruit.APPLICATION_STAGES, function (stage) {
            stage.jobId = self.jobId;
            stage.total = "";
            if(counter)
                stage.total = counter.count[stage.id];

            stages.push(stage);
        });
        return stages;
    }
}).register("HiringProcess");


jobStageNav = BlazeComponent.extendComponent({

    /**
     * Helpers
     */
    activeClass: function () {
        var currentStage = Router.current().params.stage;
        return currentStage == this.data().alias ? "active" : "";
    }

}).register('jobStageNav');