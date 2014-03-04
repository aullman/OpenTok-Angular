var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify');

gulp.task('default', function(){
    gulp.src('opentok-angular.js')
        .pipe(jshint())
        .pipe(uglify({preserveComments: "some"}))
        .pipe(rename('opentok-angular.min.js'))
        .pipe(gulp.dest('./'));
});