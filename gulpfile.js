import gulp from "gulp";
import clean from "gulp-clean";
import replace from "gulp-replace";
import less from "gulp-less";
import htmlmin from "gulp-htmlmin";
import uglify from "gulp-uglify";
import csso from "gulp-csso";
import inject from "gulp-inject";
import jsonmin from "gulp-jsonmin";
import jsonEditor from "gulp-json-editor";

const isProd = process.title.includes("--prod");
const isTestThumbnail = process.title.includes("--test-thumbnail");

gulp.task('clean', () => {
    return gulp.src('./static', {
                    read: false,
                    allowEmpty: true
                })
                .pipe(clean());
});

gulp.task('build:core', () => {
    return gulp.src('./format/build/core.cjs')
               .pipe(gulp.dest('./static/lib'));
});

gulp.task('build:lib', gulp.series('build:core', () => {
    return gulp.src('./format/plugin/lib/**/*.*')
               .pipe(gulp.dest('./static/lib'));
}));

gulp.task('build:modules', gulp.series('build:core', () => {
    return gulp.src('./format/plugin/modules/**/*.*')
    .pipe(gulp.dest('./static/modules'));
}));

gulp.task('build:js', gulp.series('build:lib', 'build:modules', () => {
    const pipes = gulp.src(['./format/plugin/**/*.js', '!./format/plugin/lib/**/*.js']);
    if(isProd) {
        pipes.pipe(uglify());
    }
    return pipes.pipe(gulp.dest('./static'));
}));

gulp.task('build:less', () => {
    const pipes = gulp.src('./format/plugin/**/*.less')
                      .pipe(less());
    if(isProd) {
        pipes.pipe(csso());
    }
    return pipes.pipe(gulp.dest('./static'));
});

gulp.task('build:image', () => {
    return gulp.src('./format/plugin/**/*.*(png|jpg|jpeg|gif|svg|webp)')
               .pipe(gulp.dest('./static'));
});

gulp.task('build:json', () => {
    const pipes = gulp.src('./format/plugin/**/*.json');
    if(isProd) {
        pipes.pipe(jsonmin());
    }
    return pipes.pipe(gulp.dest('./static'));
});

gulp.task('build:html', () => {
    const pipes = gulp.src('./format/plugin/*.html');
    if(isProd) {
        pipes.pipe(htmlmin({
            collapseWhitespace: true
        }));
    }
    return pipes.pipe(gulp.dest('./static'));
});

gulp.task('replace:html', () => {
    return gulp.src('./static/*.html')
               .pipe(inject(gulp.src(['./static/*.css', './static/*.js', '!./static/thumbnail.js']), {
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
               .pipe(gulp.dest('./static'));
});

gulp.task('replace:manifest', () => {
    const pipes = gulp.src('./static/manifest.json')
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
    return pipes.pipe(gulp.dest('./static'));
});

gulp.task('build:rev', gulp.series('build:image', 'build:json', 'build:less', 'build:js', 'build:html', () => {
    return gulp.src('./static/**/*.*(html|js|css)')
               .pipe(replace('.less', '.css'))
               .pipe(replace('.ts', '.cjs'))
               .pipe(replace('../core/index', './lib/core'))
               .pipe(gulp.dest('./static'));
}));

gulp.task('build', gulp.series('clean', 'build:rev', 'replace:html', 'replace:manifest', () => {
    const files = ['./format/build', './static/*.css', './static/*.js', '!./static/thumbnail.js'];
    if(isProd) {
        files.push('./static/*.test.*');
    }
    return gulp.src(files, {
                    read: false
                })
               .pipe(clean());
}));
