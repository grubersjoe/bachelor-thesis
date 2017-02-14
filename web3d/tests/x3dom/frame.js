var x3d;
function X3DOMFrame() {

    var pub = {
        name: 'x3dom'
    };

    x3d  = document.getElementById('x3d-node');

    var curFps;

    var masterTrans = $('#master-transform');

    var model;
    var geometry = '<Box></Box>';
    var trisPerGeometry = 12;

    var mouseHandlers;

    /**
     * Triggered on X3DOM ready event
     */
    x3dom.runtime.ready = function () {
        x3d.style.width = window.innerWidth;
        x3d.style.height = window.innerHeight;
        pushFramesToParent();
    };

    /**
     * Clear the canvas
     */
    pub.clear = function () {
        masterTrans.html('');
        model = null;
    };

    /**
     * Returns number of models
     * @returns {number} Number of models
     */
    pub.getModelCount = function () {
        return document.getElementsByTagName('Shape').length;
    };

    /**
     * Returns number of triangles
     * @returns {number} Number of triangles
     */
    pub.getTrisCount = function () {
        return trisPerGeometry * pub.getModelCount();
    };

    /**
     * Not implemented
     */
    pub.setMaterial = function (type, shading) {

    };

    /**
     * Sets geometry
     * @param {string} geometry Sets geometry
     */
    pub.setGeometry = function (geometry) {
        switch (geometry) {
            case 'box':
                geometry = '<Box></Box>';
                trisPerGeometry = 12;
                break;
        }
    };

    /**
     * Adds a model
     * @param n Number of models to spawn
     * @param scale Scaling vector
     */
    pub.addModel = function (n, scale) {
        n = n || 1;

        var x, y, z, translation, html = '';

        if (typeof scale === 'undefined') {
            scale = '0.1 0.1 0.1';
        } else {
            scale = scale * 0.1 + ' ' + scale * 0.1 + ' ' + scale * 0.1;
        }

        if (model) {
            masterTrans.append(model);
            return;
        }

        for (var i = 0; i < n; i++) {
            x = Math.random() * 8 - 4;
            y = Math.random() * 8 - 4;
            z = Math.random() * 8 - 4;
            translation = x + ' ' + y + ' ' + z;

            html += '' +
                '<Transform scale="' + scale + '" translation="' + translation + '">' +
                '   <shape ' + mouseHandlers + '>' + geometry + '<appearance>' + getMaterial() + '</appearance>' + '</shape>' +
                '</transform>';
        }
        masterTrans.append(html);
    };

    /**
     * Load a X3D file
     * @param {string} x3dFile The file
     * @param {function} callback
     */
    pub.loadModel = function (x3dFile, callback) {
        model = '<inline url="../../res/' +  x3dFile + '"></inline>';
        callback();
    };

    /**
     * Not implemented
     * @param  {object} vec - Vector to translate by as XYZ tupel
     * @return {void}
     */
    pub.translate = function (vec) {
        return;
    };

    /**
     * Picking test
     * @param n Number of models to spawn
     * @param scale Scaling vector
     */
    pub.pickingTest = function (n, scale) {
        bindMouseHandlers({
            'onClick': "onPick(event)",
            'onMouseOver': "onMouseOver(event)"
        });

        pub.addModel(n, scale);
    }

    /**
     * Tests which X3DOM backend is used
     * @returns {string} Name of X3DOM backend or 'UNSUPPORTED'
     */
    pub.browserSupportTest = function () {
        if (x3d.runtime) {
            return 'SUPPORTED_' + x3d.runtime.backendName().toUpperCase();
        } else {
            return 'UNSUPPORTED';
        }
    };

    /**
     * Realism test
     * @param {string} obj Model to load
     */
    pub.realismTest = function (obj) {
        pub.loadModel(obj, function () {
            pub.addModel();
        });
    };

    /**
     * Delegates frames measured by X3DOM to parent frame
     */
    function pushFramesToParent() {
        setInterval(function () {
            if (window.parent.app.stats) {
                curFps = x3d.runtime.getFPS();
                window.parent.app.stats.pushFrame(curFps);
            }
        }, 1000);
    }

    /**
     * Returns currently set material
     * @returns {string} The material
     */
    function getMaterial() {
        return '<material diffuseColor="' +  getRandomRGB() + '"></material>';
    }

    /**
     * Returns a random RGB value
     * @returns {string} Random RGB value
     */
    function getRandomRGB() {
        return  Math.random() + ',' +  Math.random() + ',' +  Math.random();
    }

    /**
     * Helper function: Binds mouse handlers on X3D nodes
     * @param {object} handlers Handler, action mapping
     */
    function bindMouseHandlers (handlers) {
        var html = [];
        for (var handler in handlers) {
            if (handlers.hasOwnProperty(handler))
                html.push(handler + '="' + handlers[handler] + '"');
        }
        mouseHandlers = html.join(' ');
    }

    /**
     * On window resize
     */
    window.addEventListener('resize', function() {
        x3d.style.width = window.innerWidth;
        x3d.style.height = window.innerHeight;
    });

    return pub;

}

$(function () {
    window.parent.app.frame = new X3DOMFrame();
});

function onPick(e) {
    console.log(e);
    e.target.remove();
}

function onMouseOver(e) {
    e.target.getElementsByTagName('material')[0].setAttribute('diffuseColor', '0 0 0');
}