function UserInterface(domElements) {

    var pub = {};
    var dom = domElements;

    /**
     * Creates list of available tests via JSON data
     */
    pub.createTestList = function() {
        var path, subTests, wrapper, anchorCopy, option;

        // Building base elements
        var title = $('<div>').addClass('title');
        var desc = $('<div>').addClass('desc');
        var anchor = $('<a>').addClass('testcase list-group-item');
        var checkbox = $('<input type="checkbox">');

        app.dom.testcases.each(function () {
            wrapper = $('<div>');
            path = $(this).data('path');
            subTests = app.metadata[path];

            $.each(subTests, function (name, prop) {
                anchorCopy = anchor.clone();
                anchorCopy.attr('href', '#' + path + '.' + name);
                anchorCopy.append(title.clone().html(prop.title));
                anchorCopy.append(desc.clone().html(prop.desc));
                wrapper.append(anchorCopy.prepend(checkbox.clone()));
            });

            $(this).append(wrapper.html());
        });
    };

    /**
     * Updates label of currently used technology / backend.
     */
    pub.setBackendLabel = function () {
        app.dom.usedBackend.find('span').html(app.tests.getBackendName());
    };

    pub.handleButtonStatuses = function () {
        if (app.isRunning) {
            dom.btnRunTests.attr('disabled', 'disabled');
            dom.btnAbortTests.removeAttr('disabled');
        } else {
            dom.btnRunTests.removeAttr('disabled');
            dom.btnAbortTests.attr('disabled', 'disabled');
        }
    };

    /**
     * Updates shown stats of current scene
     * @param {number} modelCount - Number of currently shown models
     * @param {number} triCount - Number of currently shown vertices
     */
    pub.updateStats = function(modelCount, triCount) {
        var html = '';
        html += '<span id="model-count">' + modelCount + '</span> Modelle';
        html += '<span class="sep">-</span>';
        html += '<span id="vertices-count">' + triCount + '</span> Tris';
        dom.sceneStats.html(html);
    };

    function bindEventHandlers() {
        bindSelectTestcases();
        bindRunButton();
        bindAbortButton();
        // bindTechTabs();
        bindToggleFullscreen();
    }

    /**
     * Selection of testcases in test list.
     */
    function bindSelectTestcases() {
        dom.body.on('click', '.testcase', function(e) {
            app.tests.stop();
            if (!$(e.target).is('input')) {
                var box = $(this).find('input[type="checkbox"]');
                box.prop('checked', !box.prop('checked'));
                $(this).toggleClass('selected');
            }

            if ($('.testcase.selected').length > 0) {
                app.dom.btnRunTests.removeAttr('disabled');
            } else {
                app.dom.btnRunTests.attr('disabled', 'disabled');
            }
        });

        // Direct click on checkbox
        dom.body.on('click', '.testcase input[type="checkbox"]', function(e) {
            app.tests.stop();
            $(this).parent('.testcase').toggleClass('selected');
        });
    }

    /**
     * Binds run button.
     */
    function bindRunButton() {
        dom.btnRunTests.click(function () {
            app.runTests();
            app.isRunning = true;
            pub.handleButtonStatuses();
        });
    }

    /**
     * Binds abort button.
     */
    function bindAbortButton() {
        dom.btnAbortTests.click(function () {
            if (app.isRunning) {
                app.tests.stop();
                app.isRunning = false;
                pub.handleButtonStatuses();
            }
        });
    }

    /**
     * Loads respective frame on tab click.
     */
    function bindTechTabs() {
        dom.x3domTab.click(function () {
            app.loadFrame('x3dom');
            pub.setBackendLabel();
        });
        dom.webglTab.click(function () {
            app.loadFrame('webgl');
            pub.setBackendLabel();
        });
    }

    /**
     * Toggles between fullscreen and normal view.
     */
    function bindToggleFullscreen() {
        dom.btnToggleFullscreen.click(function (e) {
            e.preventDefault();
            $('body').toggleClass('fullscreen');
        });
    }

    bindEventHandlers();

    return pub;
}