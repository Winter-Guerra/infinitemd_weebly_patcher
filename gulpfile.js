var gulp = require('gulp');
var ts = require('gulp-typescript');
var clean = require('gulp-clean');
var server = require('gulp-develop-server');
var mocha = require('gulp-mocha');
var gulpEbDeploy = require('gulp-elasticbeanstalk-deploy')

var serverTS = ["**/*.ts", "!node_modules/**", '!bin/**'];

gulp.task('ts', ['clean'], function() {
    return gulp
        .src(serverTS, {base: './'})
        .pipe(ts({ module: 'commonjs', noImplicitAny: true }))
        .pipe(gulp.dest('./'));
});

gulp.task('clean', function () {
    return gulp
        .src([
            'app.js',
            '**/*.js',
            '**/*.js.map',
            '!node_modules/**',
            '!gulpfile.js',
            '!bin/**'
        ], {read: false})
        .pipe(clean())
});

gulp.task('load:fixtures', function (cb) {
    var load = require('./fixtures/load');
    return load.loadData(cb);
});

gulp.task('server:start', ['ts'], function() {
    server.listen({path: 'bin/www'}, function(error) {
        console.log(error);
    });
});

gulp.task('server:restart', ['ts'], function() {
    server.restart();
});

gulp.task('default', ['server:start'], function() {
    gulp.watch(serverTS, ['server:restart']);
});

gulp.task('test', ['ts', 'load:fixtures'], function() {
    return gulp
        .src('test/*.js', {read: false})
        // wait for dev server to start properly :(
        //.pipe(wait(600))
        .pipe(mocha())
        .once('error', function () {
            process.exit(1);
        })
        .once('end', function () {
            process.exit();
        });
});

gulp.task('deploy', ['ts'], function() {
    return gulp
    .src([
        'app.js',
        '**/*.js',
        '**/*.js.map',
        '**/*.json',
        '**/*.hbs',
        '!node_modules/**',
        'public/**',
        'bin/**',
        '!gulpfile.js' // Don't include gulpfile since it's not needed.
    ], {base: './'})
    .pipe(gulpEbDeploy({
        waitForDeploy: true, // optional: if set to false the task will end as soon as it starts deploying
        amazon: {
            region: 'us-east-1',
            bucket: 'infinitemd-elasticbeanstalk-weebly-patcher',
            applicationName: 'weebly_monkeypatch_service',
            environmentName: 'Blue'
        }
    }))
})
