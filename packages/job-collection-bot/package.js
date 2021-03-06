Package.describe({
    name: 'vnw:jobcollectionbot',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: '',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.use('ecmascript');
    api.use(['stevezhu:lodash', 'lab:vnw-apis']);
    api.use(['success:application']);

    api.addFiles(['job-collection-bot.js'], 'server');
    api.addFiles(['jobs/applications.js', 'jobs/jobs.js', 'jobs/interviews.js'], 'server');
    api.addAssets([
        'private/scorecard-remind.html',
        'private/interview-remind.html',
    ], 'server');
    api.export('sJobCollections');


});

Package.onTest(function (api) {
    api.use('ecmascript');
    api.use('tinytest');
});
