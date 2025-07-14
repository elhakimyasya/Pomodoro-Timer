import fs from 'fs';
import path from 'path';
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
    'package.json',
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

gulp.task('release', gulp.series(function updateVersion(done) {
    const filesToUpdate = [
        'package.json',
        'manifest.json'
    ];

    const incrementVersion = (version) => {
        const parts = version.split('.').map(Number);
        parts[parts.length - 1] += 1; // hanya tambahkan bagian terakhir
        return parts.join('.');
    };

    filesToUpdate.forEach((file) => {
        const filePath = path.resolve(file);
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);

        if (json.version) {
            const oldVersion = json.version;
            const newVersion = incrementVersion(oldVersion);

            json.version = newVersion;
            fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
            console.log(`${file}: ${oldVersion} → ${newVersion}`);
        } else {
            console.warn(`${file} does not contain a version field.`);
        }
    });

    done();
}, 'archive'));