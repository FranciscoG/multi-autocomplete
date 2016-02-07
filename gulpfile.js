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
   return gulp.src('src/multi-autocomplete.js')
     .pipe(uglify())
     .on("error", handleError)
     .pipe(rename("multi-autocomplete.min.js"))
     .pipe(gulp.dest('dist'));
 });

/**********************************************
 * Move JS files to dist
 */

 gulp.task('move', function() {
   return gulp.src('src/multi-autocomplete.js')
     .on("error", handleError)
     .pipe(gulp.dest('dist'));
 });


/**********************************************
 * Gulp default and Watch stuff
 */

var tasksList = ['minify','move'];

gulp.task('watch', function() {
  gulp.watch('src/*.js', tasksList);
});

gulp.task('default', tasksList);