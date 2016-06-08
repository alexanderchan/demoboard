
/*
 |--------------------------------------------------------------------------
 | Browser-sync config file
 |--------------------------------------------------------------------------
 |
 | For up-to-date information about the options:
 |   http://www.browsersync.io/docs/options/
 |
 | There are more options than you see here, these are just the ones that are
 | set internally. See the website for more info.
 |
 |
 */

var BASE_DIR = '.'
module.exports = {
    "files": [ BASE_DIR+'/*.html', BASE_DIR+'*.js', BASE_DIR+'/styles/*.css' ],
    "server": {
        baseDir: BASE_DIR
    },
    // Here you can disable/enable each feature individually
    ghostMode: {
        clicks: false,
        forms: false,
        scroll: false
    },
    online: false,
    "proxy": false,
    "port": 3000,
    "logLevel": "info",
    "logPrefix": "BS",
    "logConnections": false,
    "logFileChanges": true,
    "open": "local",
    "browser": "chrome",
    "xip": false,
    "hostnameSuffix": false,
    "notify": true,
    "scrollProportionally": true,
    "scrollThrottle": 0,
    "reloadDelay": 0,
    "injectChanges": true,
    "startPath": null,
    "minify": false,
    "host": null,
    "codeSync": true,
    "timestamps": true,
    "socket": {
        "path": "/browser-sync/socket.io",
        "clientPath": "/browser-sync",
        "namespace": "/browser-sync"
    },
    "debugInfo": true
};
