function TestInterface() {

    var pub = {};

    var testQueue  = []; // Contains current queue test function calls
    var frameQueue = []; // Contains frame of respective test

    var impl; // Holds current implementation of tests
    var interval, timeout;

    /**
     * Set implementation (frame)
     * @param obj The implementation interfae
     */
    pub.setImpl = function (obj) {
        impl = obj;
    };

    /**
     * Stop all currently running tests
     */
    pub.stop = function () {
        if (interval)
            clearInterval(interval);
        if (timeout)
            clearTimeout(timeout);
        impl.clear();
        testQueue = [];
        app.setFrameSize(null);
        app.isRunning = false;
        app.ui.handleButtonStatuses();
    };

    /**
     * Enqueue a test
     * @param {string} test - Test function name
     * @param {array} params -
     * @param {string} tech - Technology
     */
    pub.enqueueTest = function (test, params, tech) {
        var func = wrapFunction(pub[test], app.tests, params, tech);
        testQueue.push(func);
    };

    /**
     * Triggers the execution of enqueued tests
     */
    pub.runTestQueue = function () {
        // Call first test in queue
        pub.nextTest();
    };

    /**
     * Triggers the execution of next test in queue
     * Calls allDone if all tests are done
     */
    pub.nextTest = function () {
        if (testQueue.length > 0) {
            (testQueue.shift())();
        } else {
            allDone();
        }
    };

    /**
     * Called when all tests have been run
     */
    function allDone() {
        pub.stop();
        console.info('Alle Tests beendet.');
        console.info(app.persistence.getResults());
        $(document).trigger('testQueueDone');
    }


    /**
     * Returns the name of currently used 3D backend
     * @returns {string} Backend name
     */
    pub.getBackendName = function () {
        var backend = impl.browserSupportTest();
        if (impl.name === 'webgl') {
            switch (backend) {
                case 'UNSUPPORTED':
                    return 'WebGL nicht unterstützt.';
                case 'ERROR_INTIALIZING':
                    return 'WebGL konnte nicht initialisiert werden.';
                case 'SUPPORTED':
                    return 'WebGL (Three.js)';
            }
        }

        return backend + ' (X3DOM)';
    };

    /**
     * Test: Tests general support of a technology in webbrowser.
     */
    pub.browserSupportTest = function () {
        var results = impl.browserSupportTest();
        saveResult('browserSupportTest', results);
        done(1);
    };

    /**
     * Test: General test of performance by spawning simple geometries
     * until the framerate drops below fpsMin.
     * @param {string} geometry Primitive to use
     * @param {number} fpsMin Minimal framerate
     * @param {number} fpsFilter Number of past frames to calculate FPS average
     * @param {number} spawnTime Milliseconds between spawning a new model
     */
    pub.geometryStressTest = function (geometry, fpsMin, fpsFilter, spawnTime) {
        impl.setGeometry(geometry);
        spawnPrimitivesByFps(fpsMin, fpsFilter, spawnTime, function (results) {
            saveResult('geometryStressTest', results);
            done(5);
        });
    };

    /**
     * Test: General test of performance by spawning simple geometries at different
     * "resolutions" until framerate drops below fpsMin.
     * @param {string} geometry Primitive to use
     * @param {string} res Frame resolution
     * @param {number} fpsMin Minimal framerate
     * @param {number} fpsFilter Number of past frames to calculate FPS average
     * @param {number} spawnTime Milliseconds between spawning a new model
     */
    pub.resFpsStressTest = function(geometry, res, fpsMin, fpsFilter, spawnTime) {
        var frameSizeSet = app.setFrameSize(res);
        if (!frameSizeSet) {
            console.warn('Resolution ' + res + ' is invalid.');
            return;
        }
        impl.setGeometry(geometry);
        spawnPrimitivesByFps(fpsMin, fpsFilter, spawnTime, function (results) {
            results.res   = res;
            results.geometry = geometry;
            saveResult('resFpsStressTest', results);
            done(5);
        });
    };

    /**
     * Test: Loading an externally created 3D model.
     * @param {string} objFile URL to object file
     * @param {number} scale Scaling of model
     * @material object Material parameters
     */
    pub.loadModelTest = function (objFile, scale, trans, matType, matShading) {
        impl.loadModel(objFile, function () {
            matType    = matType    || 'lambert';
            matShading = matShading || 'flat';
            impl.setMaterial(matType, matShading);
            impl.addModel(1, scale);
            if (trans) {
                impl.translate(trans);
            }
            var results = {
                model: objFile,
                lastFps: app.stats.getFps(20)
            };
            saveResult('loadModelTest', results);

            timeout = setTimeout(function () {
                done(0.5);
            }, 1000 * 10);
        });
    };

    pub.loadTexturedModelTest = function (obj, scale) {
        impl.loadTexturedModel(obj, scale);
    };

    /**
     * Test: Demonstrates object picking.
     * @param {number} n - Number of pickable objects
     */
    pub.pickingTest = function (n, scale) {
        impl.setGeometry();
        impl.pickingTest(n, scale);
        timeout = setTimeout(function () {
            done(0.5);
        }, 1000 * 10);
    };

    /**
     * Tests lightning and shading capabilities of technology.
     */
    pub.realismTest = function (objFile, scale, texture) {
        impl.realismTest(objFile, scale, texture);
        timeout = setTimeout(function () {
            done(0.5);
        }, 1000 * 10);
    };

    /**
     * Called before every test run.
     */
    function beforeTest() {
        impl.clear();
        app.setFrameSize(null);
        console.info('Starting next ' + impl.name + ' test...');
    }

    /**
     * Called after every test run.
     */
    function afterTest() {
        console.info('Test beendet.');
        if (interval)
            clearInterval(interval);
        impl.clear();
        app.setFrameSize(null);
        app.clearErrors();
    }

    /**
     * Wraps a function and its parameters in a callable anonymous function.
     * @param  {function} fn - The function
     * @param  {Context} context - The JavaScript context (this)
     * @param  {Array} params - Array with function parameters
     * @param  {string} tech - Technology descriptor
     * @return {function} - Function call in anonymous function
     */
    function wrapFunction(fn, context, params, tech) {
        return function() {
            if (tech !== impl.name) {
                app.loadFrame(tech, function () {
                    checkSupport(function () {
                        beforeTest();
                        fn.apply(context, params);
                    });
                });
            } else {
                checkSupport(function () {
                    beforeTest();
                    fn.apply(context, params);
                });
            }

        };
    }

    function checkSupport(callback) {
        if (impl.browserSupportTest().substring(0, 9) === 'SUPPORTED') {
            callback();
        } else {
            testQueue.shift();
            done(0);
            var msg = impl.name.toUpperCase() +
                ' is not supported on this platform. Skipping test.';
            app.logError(msg);
            console.warn(msg);
        }
    }

    /**
     * Waits timeout seconds befor calling next test.
     * @param {number} timeout - Seconds to wait
     */
    function done(timeout) {
        timeout = setTimeout(function () {
            afterTest();
            pub.nextTest();
        }, timeout * 1000);
    }

    /**
     * Saves results via persistence interface.
     * @param {string} name - Test name
     * @param {object} results - Test results
     */
    function saveResult(name, results) {
        app.persistence.pushResults(name, impl.name, results);
    }

    /**
     * Helper function: Spawns n models.
     * @param {number} n - Number of models to spawn
     */
    function spawnPrimitives(n, scale) {
        impl.addModel(n, scale);
    }

    /**
     * Helper function: Spawns currently set model until framerate drops below fpsMin.
     * @param {number} fpsMin - Minimal framerate
     * @param {number} fpsFilter - Number of past frames to calculate FPS average
     * @param {number} spawnTime - Milliseconds between spawning a new model
     * @param {function} callback - Callback function
     */
    function spawnPrimitivesByFps(fpsMin, fpsFilter, spawnTime, callback) {
        var startFrame, frameAvg;
        startFrame = app.stats.getFps().length;
        interval = setInterval(function () {
            var lastFrames = app.stats.getFps(fpsFilter, startFrame);
            if (lastFrames.length >= fpsFilter) {
                lastFrames = app.stats.getFps(fpsFilter);
                var sum = 0;
                for (var i = 0; i < lastFrames.length; i++) {
                    sum += lastFrames[i];
                }
                frameAvg = sum / lastFrames.length;
                if (frameAvg < fpsMin) {
                    clearInterval(interval);
                    callback({
                        'fpsMin': fpsMin,
                        'fpsFilter': fpsFilter,
                        'frameAvg': frameAvg,
                        'modelCount': app.frame.getModelCount(),
                        'triCount': app.frame.getTrisCount()
                    });

                    return;
                }
            }
            impl.addModel(2);
        }, (spawnTime || 50));
    }

    return pub;
}