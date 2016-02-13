var gulp = require('gulp');

function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}

/**********************************************
 * Minify
 */

 var uglify = require('gulp-uglify');
 var rename = require("gulp-rename");
  
 gulp.task('minify', function() {
   return gulp.src('src/multicomplete.js')
     .pipe(uglify())
     .on("error", handleError)
     .pipe(rename("multicomplete.min.js"))
     .pipe(gulp.dest('dist'));
 });

/**********************************************
 * Move JS files to dist
 */

 gulp.task('move', function() {
   return gulp.src('src/multicomplete.js')
     .on("error", handleError)
     .pipe(gulp.dest('dist'));
 });

/**********************************************
 * Run jasmine test
 */
 
 var jasmine = require('gulp-jasmine');
 gulp.task('test', function () {
  return gulp.src('test/spec/test.js')
    // gulp-jasmine works on filepaths so you can't have any plugins before it 
    .pipe(jasmine());
});


/**********************************************
 * Gulp default and Watch stuff
 */

var tasksList = ['minify','move'];

gulp.task('watch', function() {
  gulp.watch('src/*.js', tasksList);
});

gulp.task('default', tasksList);