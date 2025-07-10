import gulp from 'gulp';
import zip from 'gulp-zip';
import htmlmin from 'gulp-htmlmin';
import mergeStream from 'merge-stream';

const sourceFiles = [
    '_locales/**/*',
    'dist/**/*',
    'src/audios/**/*',
    'src/images/**/*',
    'src/styles/fonts/*.woff2',
    'manifest.json',
];

const excludeFiles = [
    'src/images/icons/icon.psd',
];

gulp.task('archive', function () {
    const exclusionPatterns = excludeFiles.map(pattern => '!' + pattern);
    const allSources = sourceFiles.concat(exclusionPatterns);

    const otherFiles = gulp.src(allSources, { base: '.', encoding: false });

    const minifiedIndex = gulp.src('src/index.html', {
        base: '.',
        encoding: false
    }).pipe(htmlmin({
        collapseWhitespace: true,
        removeComments: true
    }));

    return mergeStream(otherFiles, minifiedIndex).pipe(zip('production.zip')).pipe(gulp.dest('./'));
});
