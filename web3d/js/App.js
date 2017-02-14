/** MAIN CLASS */
function App(json) {
    if (!json) {
        console.error('No JSON URL given. Aborting.');
        return;
    }

    this.frameReady = false;
    this.isRunning = false;

    this.tests = null;   // Test interface

    // Cached DOM elements
    this.dom = {};
    this.dom = this.fetchDomElements();
    this.ui  = new UserInterface(this.dom);
    this.setFrameSize();

    this.bindEvents();

    var that = this;
    this.loadTestMetadata(json, function () {
        that.tests = new TestInterface();
        that.persistence = new Persistence();
        that.loadFrame(that.metadata.defaultTech, function () {
            that.watchStats();
        });
        that.ui.createTestList();
    });
}

/**
 * Binds event handlers
 */
App.prototype.bindEvents = function () {
    var that = this;
    $(document).on('testQueueDone', function () {
        that.ui.handleButtonStatuses();
        if (that.dom.inputFileDownload.is(':checked')) {
            that.persistence.getResultsAsFile();
        } else {
            console.log('Download not requested.');
        }
    });
};

/**
 * Loads given url in frame
 * @param {string} tech - Technology to load
 * @param {function} callback - Callback function
 */
App.prototype.loadFrame = function(tech, callback) {
    var that = this;
    this.dom.body.addClass('frame-loading');
    this.dom.frame.attr('src', 'tests/' + tech + '/frame.html');
    this.dom.frame.load(function () {
        that.dom.body.removeClass('frame-loading');
        that.tests.setImpl(that.frame);
        that.ui.setBackendLabel();

        if (typeof callback === 'function')
            callback();
    });
};

/**
 * Fetches often used jQuery DOM elements
 */
App.prototype.fetchDomElements = function() {
    return {
        body: $('body'),
        main: $('main:first'),
        frame: $('#frame'),
        errorMsg: $('#error'),
        curFps: $('#fps span'),
        fpsChart: $('#fps-chart'),
        x3domTab: $('#tab-x3dom'),
        webglTab: $('#tab-webgl'),
        testcases: $('.testcases'),
        sceneStats: $('#scene-stats'),
        btnRunTests: $('#btn-run-tests'),
        btnAbortTests: $('#btn-abort-tests'),
        btnToggleFullscreen: $('#toggle-fullscreen'),
        inputFileDownload: $('#return-file'),
        usedBackend: $('#backend-name'),
        statusBar: $('#status-bar'),
        error: $('#error')
    };
};

/**
 * Loads test metadata via JSON file
 * @param  {string}   json     URL to JSON file
 * @param  {function} callback Callback on success
 */
App.prototype.loadTestMetadata = function(json, callback) {
    var that = this;
    $.getJSON(json, function (data) {
        that.metadata = data;
        callback();
    }).error(function(jqXHR, textStatus) {
        console.error('Error loading JSON file: ' + textStatus);
    });
};

App.prototype.runTests = function() {
    app.tests.stop();
    var techAndName, tech, name, test, params;

    var selection = [];
    $('.testcase.selected').each(function () {
        selection.push($(this).attr('href'));
    });

    if (selection.length === 0)
        return false;

    for (var i = 0; i < selection.length; i++) {
        techAndName = selection[i].split('.');
        tech = techAndName[0].substring(1);
        name = techAndName[1];
        name = techAndName[1];
        test = this.metadata[tech][name].func;
        params = this.metadata[tech][name].params;

        // Enqueue test with all param calls
        for (var j = 0; j < params.length; j++) {
            app.tests.enqueueTest(test, params[j], tech);
        }
    }

    app.tests.runTestQueue();

    return true;
};

/**
 * Refreshs user interface with stats
 */
App.prototype.watchStats = function() {
    this.stats = new Stats();
    this.fpsMeter = new FPSMeter(this.dom.fpsChart.get(0), 'default');

    var that = this;
    window.setInterval(function () {
        that.fpsMeter.draw();
        that.ui.updateStats(that.frame.getModelCount(), that.frame.getTrisCount());
    }, 1000);
};


/**
 * Sets size (resolution) of iFrame
 * @param {string} res Resolution or null to remove all resolutions
 */
App.prototype.setFrameSize = function(res) {
    var validRes = [
        '1024x768',
        '1280x1024',
        '1376x768',
        '1600x900',
        '1920x1080'
    ];

    // Remove all res-* classes and explicetely set widths
    this.dom.frame.attr('class', function(i, c){
        return c.replace(/\bres-\S+/g, '');
    });

    if (validRes.indexOf(res) < 0) {
        var navbarWidth = 300, topBarHeight = 69, border = 6;
        this.dom.frame.width($(window).width() - navbarWidth - border);
        this.dom.frame.height($(window).height() - topBarHeight - border);
    } else {
        this.dom.frame.addClass('res-' + res);
    }

    return true;
};

/**
 * Shows an error message above frame
 * @param {string} msg - Message
 */
App.prototype.logError = function (msg) {
    this.dom.error.append('<span>' + msg + '</span>');
};

/**
 * Clears error messages
 */
App.prototype.clearErrors = function () {
    this.dom.error.html('');
}

/**
 * Run the application on DOM ready
 */
$(document).ready(function () {
    window.app = new App('tests.json');
});