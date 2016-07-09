"use strict";

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const less = require('gulp-less');
const concatCss = require('gulp-concat-css');
const cleanCSS = require('gulp-clean-css');
const pug = require('gulp-pug');
const yaml = require('yamljs');
const templateData = yaml.load('./src/data.yml');

gulp.task('dev', function() {
  browserSync.init({
    server: {
      baseDir: "./build/"
    }
  });
  gulp.watch(["src/*.pug", "src/*.yml"], ['build-html']);
  gulp.watch("src/styles/*", ['build-css']);
  gulp.watch("src/images/*", ['build-images']);
  gulp.watch("build/*").on('change', browserSync.reload);
});

gulp.task('build-css', () => {
  return gulp.src(
    [
      'node_modules/bootstrap/less/bootstrap.less',
      'src/styles/main.less'
    ],
    {base: 'build'}
  )
    .pipe(less())
    .pipe(concatCss('css/main.css'))
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest('build'))
  ;
});

gulp.task('build-js', () => {

});

gulp.task('build-html', () => {
  return gulp.src('src/*.pug')
    .pipe(pug({
      locals: templateData
    }))
    .pipe(gulp.dest('build'))
  ;
});

gulp.task('build-images', () => {
  return gulp.src('src/images/*')
    .pipe(gulp.dest('build/img/'))
});

gulp.task('build', ['build-css', 'build-js', 'build-html', 'build-images']);
gulp.task('default', ['build']);
