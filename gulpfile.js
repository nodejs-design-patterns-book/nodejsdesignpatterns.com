'use strict'

// gulp
const _ = require('lodash')
const gulp = require('gulp')
const del = require('del')
const browserSync = require('browser-sync').create()
const uglify = require('gulp-uglify')
const concat = require('gulp-concat')
const sourcemaps = require('gulp-sourcemaps')
const less = require('gulp-less')
const concatCss = require('gulp-concat-css')
const cleanCSS = require('gulp-clean-css')
const pug = require('gulp-pug')
const yaml = require('yamljs')
const templateData = yaml.load('./src/data.yml')

gulp.task('dev', () => {
  browserSync.init({
    server: {
      baseDir: './build/'
    }
  })
  gulp.watch(
    ['./src/**/*.pug', './src/data.yml'],
    gulp.series('build:assets:html')
  )
  gulp.watch('./src/styles/*', gulp.series('build:assets:css'))
  gulp.watch('./src/images/*', gulp.series('build:assets:images'))
  gulp.watch('./src/meta/*', gulp.series('build:assets:meta'))
  gulp.watch('./src/files/*', gulp.series('build:assets:files'))
  gulp.watch('./build/**/*').on('change', browserSync.reload)
})

gulp.task('clean', () => {
  return del([
    './build/css/**/*',
    './build/js/**/*',
    './build/img/**/*',
    './build/files/**/*',
    './build/*.html',
    './build/*.png',
    './build/*.ico',
    './build/*.json',
    './build/robots.txt',
    './build/sitemap.xml'
  ])
})

gulp.task('build:assets:css', () => {
  return gulp
    .src(
      ['node_modules/bootstrap/less/bootstrap.less', 'src/styles/main.less'],
      {
        base: 'build'
      }
    )
    .pipe(less())
    .pipe(concatCss('css/main.css'))
    .pipe(
      cleanCSS({
        compatibility: 'ie8'
      })
    )
    .pipe(gulp.dest('build'))
})

gulp.task('build:assets:js', () => {
  return gulp
    .src(require('./src/scripts/index'))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(concat('bundle.js'))
    .pipe(sourcemaps.write('./build/js/maps/'))
    .pipe(gulp.dest('./build/js/'))
})

gulp.task('build:assets:html', () => {
  return gulp
    .src('src/*.pug')
    .pipe(
      pug({
        locals: _.extend(templateData, {
          chunk: _.chunk
        })
      })
    )
    .pipe(gulp.dest('build'))
})

gulp.task('build:assets:images', () => {
  return gulp.src('src/images/*').pipe(gulp.dest('build/img/'))
})

gulp.task('build:assets:meta', () => {
  return gulp.src('src/meta/*').pipe(gulp.dest('build/'))
})

gulp.task('build:assets:files', () => {
  return gulp.src('src/files/*').pipe(gulp.dest('build/files/'))
})

gulp.task(
  'build:assets',
  gulp.series(
    'build:assets:css',
    'build:assets:js',
    'build:assets:images',
    'build:assets:meta',
    'build:assets:html',
    'build:assets:files'
  )
)

gulp.task('build', gulp.series('clean', 'build:assets'))

gulp.task('default', gulp.series('build'))
