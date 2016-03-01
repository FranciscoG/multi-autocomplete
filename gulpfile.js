var gulp = require('gulp');

function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}
/**********************************************
 * concat
 */

var concat = require('gulp-concat');

gulp.task('concat', function() {
  return gulp.src(['src/previewhandler.js','src/multicomplete.js'])
    .pipe(concat('multicomplete.js'))
    .on("error", handleError)
    .pipe(gulp.dest('dist/'));
});

/**********************************************
 * Minify
 */

 var uglify = require('gulp-uglify');
 var rename = require("gulp-rename");
  
 gulp.task('minify', ['concat'], function() {
   return gulp.src('dist/multicomplete.js')
     .pipe(uglify())
     .on("error", handleError)
     .pipe(rename("multicomplete.min.js"))
     .pipe(gulp.dest('dist'));
 });


/**********************************************
 * Run jasmine test
 */
 
gulp.task('test', function (done) {
  var karma = require('karma').server;
  var jasmine = require('gulp-jasmine');

  return karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: false
  }, done);
});


/**********************************************
 * Gulp default and Watch stuff
 */

var tasksList = ['minify'];

gulp.task('watch', function() {
  gulp.watch('src/*.js', tasksList);
});

gulp.task('default', tasksList);