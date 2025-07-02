const gulp = require('gulp');
const clean = require('gulp-clean');
const replace = require('gulp-replace');
const less = require('gulp-less');
const htmlmin = require('gulp-htmlmin');
const uglify = require('gulp-uglify');
const csso = require('gulp-csso');
const inject = require('gulp-inject');
const jsonmin = require('gulp-jsonmin');
const jsonEditor = require('gulp-json-editor');

const isProd = process.title.includes("--prod");
const isTestThumbnail = process.title.includes("--test-thumbnail");

gulp.task('clean', () => {
    return gulp.src('./dist', {
                    read: false,
                    allowEmpty: true
                })
                .pipe(clean());
});

gulp.task('build:core', () => {
    return gulp.src('./build/core.js')
               .pipe(gulp.dest('./dist/lib'));
});

gulp.task('build:lib', gulp.series('build:core', () => {
    return gulp.src('./src/plugin/lib/**/*.*')
               .pipe(gulp.dest('./dist/lib'));
}));

gulp.task('build:modules', gulp.series('build:core', () => {
    return gulp.src('./src/plugin/modules/**/*.*')
    .pipe(gulp.dest('./dist/modules'));
}));

gulp.task('build:js', gulp.series('build:lib', 'build:modules', () => {
    const pipes = gulp.src(['./src/plugin/**/*.js', '!./src/plugin/lib/**/*.js']);
    if(isProd) {
        pipes.pipe(uglify());
    }
    return pipes.pipe(gulp.dest('./dist'));
}));

gulp.task('build:less', () => {
    const pipes = gulp.src('./src/plugin/**/*.less')
                      .pipe(less());
    if(isProd) {
        pipes.pipe(csso());
    }
    return pipes.pipe(gulp.dest('./dist'));
});

gulp.task('build:image', () => {
    return gulp.src('./src/plugin/**/*.*(png|jpg|jpeg|gif|svg|webp)')
               .pipe(gulp.dest('./dist'));
});

gulp.task('build:json', () => {
    const pipes = gulp.src('./src/plugin/**/*.json');
    if(isProd) {
        pipes.pipe(jsonmin());
    }
    return pipes.pipe(gulp.dest('./dist'));
});

gulp.task('build:html', () => {
    const pipes = gulp.src('./src/plugin/*.html');
    if(isProd) {
        pipes.pipe(htmlmin({
            collapseWhitespace: true
        }));
    }
    return pipes.pipe(gulp.dest('./dist'));
});

gulp.task('replace:html', () => {
    return gulp.src('./dist/*.html')
               .pipe(inject(gulp.src(['./dist/*.css', './dist/*.js', '!./dist/thumbnail.js']), {
                   relative: true,
                   removeTags: true,
                   transform: (filePath, file) => {
                       if(filePath.endsWith('.js')){
                           return `<script>window.isDev=${(!isProd).toString()};${file.contents}</script>`;
                       }
                       if(filePath.endsWith('.css')) {
                           return `<style>${file.contents}</style>`;
                       }
                       return file.contents.toString('utf8');
                   }
               }))
               .pipe(gulp.dest('./dist'));
});

gulp.task('replace:manifest', () => {
    const pipes = gulp.src('./dist/manifest.json')
                      .pipe(jsonEditor(json => {
                          json.devTools = !isProd;
                          if(isTestThumbnail) {
                              const keys = Object.keys(json.preview);
                              for(const key of keys) {
                                  json.preview[key].viewer.path = "thumbnail.test.html";
                              }
                          }
                          return json;
                      }));
    if(isProd) {
        pipes.pipe(jsonmin());
    }
    return pipes.pipe(gulp.dest('./dist'));
});

gulp.task('build:rev', gulp.series('build:image', 'build:json', 'build:less', 'build:js', 'build:html', () => {
    return gulp.src('./dist/**/*.*(html|js|css)')
               .pipe(replace('.less', '.css'))
               .pipe(replace('.ts', '.js'))
               .pipe(replace('../core/index', './lib/core'))
               .pipe(gulp.dest('./dist'));
}));

gulp.task('build', gulp.series('clean', 'build:rev', 'replace:html', 'replace:manifest', () => {
    const files = ['./build', './dist/*.css', './dist/*.js', '!./dist/thumbnail.js'];
    if(isProd) {
        files.push('./dist/*.test.*');
    }
    return gulp.src(files, {
                    read: false
                })
               .pipe(clean());
}));
