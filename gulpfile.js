'use strict';
var DEPLOY_DEST = 'y:/todo_gr/';
// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var plugin = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var pagespeed = require('psi');
var reload = browserSync.reload;
var fs = require('fs');
var handlebars = require('gulp-compile-handlebars');

var browserify = require('browserify');
var source = require('vinyl-source-stream');


//  Write out some file information
//  .pipe(plugin.debug())

// create a handlebars helper to look up
// fingerprinted asset by non-fingerprinted name
var handlebarOpts = {
    helpers: {
        assetPath: function (path, context) {
            return ['/scripts', context.data.root[path]].join('/');
        }
    }
};

gulp.task('index', function () {
    // read in our manifest file
    var manifest = JSON.parse(fs.readFileSync('.tmp/rev-manifest.json', 'utf8'));

    // read in our handlebars template, compile it using
    // our manifest, and output it to index.html
    return gulp.src('app/index.html')
        .pipe(plugin.cached('index'))
        .pipe(plugin.template( { rev: manifest }))
        /*.pipe(plugin.replace('scripts/all.min.js', function(text){
                return manifest['scripts/all.min.js'];
        }))*/
        .pipe(plugin.rename('index.html'))
        .pipe(gulp.dest('dist/'))
        .pipe(gulp.dest('.tmp/'));
});



gulp.task('browserify', function(){
    return browserify({
            entries: ['./src/javascript/app.coffee']
        })
        .bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('dist/'));
});

var AUTOPREFIXER_BROWSERS = [
  'ie >= 9',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 33',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe(plugin.ignore.exclude('app/scripts/vendor/**/*.js'))
    .pipe(plugin.cached('jshint'))
    .pipe(reload({stream: true, once: true}))
    .pipe(plugin.jshint())
    .pipe(plugin.jshint.reporter('jshint-stylish'))
    //Forces it to fail 
    //.pipe(plugin.if(!browserSync.active, plugin.jshint.reporter('fail')));
});

gulp.task('jshintwatch', function() {
  return gulp.src('app/scripts/**/*.js')
    .pipe(plugin.ignore.exclude('app/scripts/vendor/**/*.js'))
    .pipe(plugin.cached('jshint'))
    .pipe(reload({stream: true, once: true}))
    .pipe(plugin.jshint())
    .pipe(plugin.jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest('dist'));
});

gulp.task('jw', ['jshintwatch'], function() {
    gulp.watch(['app/scripts/**/*.js'], ['jshintwatch']);
});

// Optimize Images
gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe(plugin.cache(plugin.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe(plugin.size({title: 'images'}));
});

// Copy All Files At The Root Level (app)
gulp.task('copy', function () {
  return gulp.src([
    'app/*',
    '!app/*.html',
    'node_modules/apache-server-configs/dist/.htaccess'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
    .pipe(plugin.size({title: 'copy'}));
});


// Copy All Files At The Root Level (app)
gulp.task('ngmin', function() {
  return gulp.src([
    'app/scripts/todoboard.js',
    'app/scripts/**/*.js'
  ], {
    dot: true
  })
  .pipe(plugin.size({ title: 'ngmin before' }))
  .pipe(plugin.header('(function () { \'use strict\';'))
  .pipe(plugin.footer('})();'))
  .pipe(plugin.sourcemaps.init())
    .pipe(plugin.if('*.js', plugin.ngAnnotate()))
    .pipe(plugin.if('*.js', plugin.uglify({preserveComments: 'some'})))
    .pipe(plugin.concat('scripts/all.min.js'))
  .pipe(plugin.sourcemaps.write('./maps'))
  .pipe(plugin.size({title: 'ngmin after'}))
  .pipe(gulp.dest('dist/'))
  .pipe(gulp.dest('.tmp/'))
  //revisioning  
  .pipe(plugin.if('*.js', plugin.rev()))
  .pipe(gulp.dest('dist/'))
  .pipe(gulp.dest('.tmp/'))
  .pipe(plugin.rev.manifest())
  .pipe(gulp.dest('dist/'))
  .pipe(gulp.dest('.tmp/'));
         
});

gulp.task('deploy', function () {
    return gulp.src([
        'app/**/*.html',
        'app/**/*.css',
        'app/**/*.js',
        '!app/bower_components/**'
    ], {
        dot: true    
    })
    //.pipe(plugin.if('*.js', plugin.ngAnnotate()))
    //.pipe(plugin.if('*.js', plugin.uglify({preserveComments: 'some'})))
    //.pipe(gulp.dest('dist/'))
    .pipe(gulp.dest(DEPLOY_DEST));
    //.pipe(plugin.size({title: 'ngmin'}));
});

gulp.task('deploy:bower', function () {
    return gulp.src([
        'app/bower_components/**'
    ], {
        dot: false
    })
    //.pipe(plugin.if('*.js', plugin.ngAnnotate()))
    //.pipe(plugin.if('*.js', plugin.uglify({preserveComments: 'some'})))
    //.pipe(gulp.dest('dist/'))
    .pipe(gulp.dest(DEPLOY_DEST + 'bower_components/'));
    //.pipe(plugin.size({title: 'ngmin'}));
});



// Copy Web Fonts To Dist
gulp.task('fonts', function () {
    return gulp.src(['app/fonts/**'])
    .pipe(gulp.dest('dist/fonts'))
    .pipe(plugin.size({title: 'fonts'}));
});

// Compile and Automatically Prefix Stylesheets
gulp.task('styles', function () {
  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
      /*'app/styles/*.scss',*/
      'app/styles/**/*.css'
      /*'app/styles/components/components.scss'*/
    ])
    .pipe(plugin.changed('styles', {extension: '.scss'}))
    /*.pipe(plugin.rubySass({
        style: 'expanded',
        precision: 10
      })
      .on('error', console.error.bind(console))
    )*/
    .pipe(plugin.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    // Concatenate And Minify Styles
    .pipe(plugin.if('*.css', plugin.csso()))
    .pipe(gulp.dest('dist/styles'))
    .pipe(plugin.size({title: 'styles'}));
});


// Scan Your HTML For Assets & Optimize Them
gulp.task('html', function () {
  var assets = plugin.useref.assets({searchPath: ['app', '.tmp']});

  return gulp.src('app/**/*.html')
    .pipe(assets)
    .pipe(plugin.debug())
    .pipe(plugin.size())
    // Concatenate And Minify JavaScript
    .pipe(plugin.if('*.js', plugin.ngAnnotate()))
    .pipe(plugin.if('*.js', plugin.uglify({preserveComments: 'some'})))
    // Remove Any Unused CSS
    // Note: If not using the Style Guide, you can delete it from
    // the next line to only include styles your project uses.
    .pipe(plugin.if('*.css', plugin.uncss({
      html: [
        'app/index.html',
        'app/styleguide.html'
      ],
      // CSS Selectors for UnCSS to ignore
      ignore: [
        /.navdrawer-container.open/,
        /.app-bar.open/
      ]
    })))
    // Concatenate And Minify Styles
    // In case you are still using useref build blocks
    .pipe(plugin.if('*.css', plugin.csso()))
    .pipe(assets.restore())
    .pipe(plugin.useref())
    // Update Production Style Guide Paths
    .pipe(plugin.replace('components/components.css', 'components/main.min.css'))
    // Minify Any HTML
    .pipe(plugin.if('*.html', plugin.minifyHtml()))
    // Output Files
    .pipe(gulp.dest('dist'))
    .pipe(plugin.size({title: 'html'}));
});

// Clean Output Directory
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Watch Files For Changes & Reload
gulp.task('serve', [], function () {
  browserSync({
    notify: false,
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
  open: false,
  online: false,
  browser: ['google chrome'],
  server: ['app']
  });

  gulp.watch(['app/**/*.html'], reload);
  gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
  gulp.watch(['app/scripts/**/*.js'], ['jshint', reload]); //['jshint']);
  gulp.watch(['app/images/**/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', function () {
  browserSync({
    notify: false,
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    open: false,
    browser: ['google chrome'],
    server: 'dist'
  });

  gulp.watch(['app/index.html'], ['index', reload]);
  gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
  //gulp.watch(['app/scripts/**/*.js'], ['jshint', 'ngmin', reload]); //['jshint']);
  gulp.watch(['app/scripts/**/*.js'], function() {
    return runSequence('ngmin', 'index', 'jshint', reload)
  }); //['jshint']);
  
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
  runSequence('styles', ['jshint', 'html', 'images', 'fonts', 'copy'], cb);
});
gulp.task('build', ['default']);

// Run PageSpeed Insights
// Update `url` below to the public URL for your site
gulp.task('pagespeed', pagespeed.bind(null, {
  // By default, we use the PageSpeed Insights
  // free (no API key) tier. You can use a Google
  // Developer API key if you have one. See
  // http://goo.gl/RkN0vE for info key: 'YOUR_API_KEY'
  url: 'https://example.com',
  strategy: 'mobile'
}));

// Load custom tasks from the `tasks` directory
//try { require('require-dir')('tasks'); } catch (err) { console.error(err); }

/**
 *
 *  Web Starter Kit
 *  Copyright 2014 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

