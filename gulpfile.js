'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var bump = require('gulp-bump');
var src = ['hateoas-ajax.html',
           'test/*.js',
           'test/*.html'];

//Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src(src)
    .pipe($.jshint.extract()) // Extract JS from .html files
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('bump', function(){
  gulp.src('./bower.json')
  .pipe(bump())
  .pipe(gulp.dest('./'));
});

gulp.task('default', function (callback) {
  runSequence(
    'jshint',
    callback);
});

gulp.task('watch', function () {
  gulp.watch(src, ['default']);
});
