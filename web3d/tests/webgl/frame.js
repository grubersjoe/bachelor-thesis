function WebGLFrame() {

    var pub = {
        name: 'webgl'
    };

    var grids = [];
    var gridSize = 125;
    var gridStep = 25;

    var cfg = {
        animation: {
            enabled: true,
            rotate: false
        },
        shadows: false
    };

    var def = {
        cam: {
            pos: {
                x: -340,
                y:  220,
                z:  340
            },
            lookAt: {
                x: 0,
                y: 0.66 * gridSize,
                z: 0
            }
        }
    };

    var scene, camera, ambientLight, dirLight;
    var renderer, controls;

    var meshes, geometry;
    var materialParams = {
        'type': 'lambert',
        'shading': THREE.FlatShading
    };
    var texture;

    /**
     * Initializiation.
     */
    pub.init = function () {
        scene = new THREE.Scene();

        meshes = new THREE.Object3D();
        scene.add(meshes);
        geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);

        setupCamera();
        setupIllumination();
        setupRenderer();
        setupControls();
        createCoordSystem();

        tick();

        window.addEventListener('resize', onWindowResize, false);
    };

    /**
     * Resets the canvas
     */
    pub.clear = function () {
        cfg.animation.rotate = false;
        cfg.shadows = false;
        geometry = null;
        texture = null;
        setCamera(def.cam.pos, def.cam.lookAt);
        scene.remove(meshes);
        meshes = new THREE.Object3D();
        scene.add(meshes);
        render();
    };

    /**
     * Load a 3D model from an object file
     * @param {string} objFile Relative URL to object file
     * @param {function} callback Onload callback function
     */
    pub.loadModel = function (objFile, callback) {
        if (typeof objFile !== 'undefined') {
            var loader = new THREE.OBJLoader(new THREE.LoadingManager());
            loader.load('../../res/' + objFile, function (obj) {
                obj.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        geometry = child.geometry;
                        assignUVs(geometry);
                        callback();
                        return;
                    }
                });
            });
        }
    };

    /**
     * Adds models (meshes) to scene
     * @param {number} n Number of models
     * @param {number} scale Centric scaling
     */
    pub.addModel = function (n, scale, color) {
        n = n || 1;

        if (typeof geometry === 'undefined') {
            geometry = new THREE.SphereGeometry(0.1);
        }

        while (n > 0) {
            var mesh = new THREE.Mesh(geometry, createMaterial(color));
            if (scale) {
                mesh.scale.x = scale;
                mesh.scale.y = scale;
                mesh.scale.z = scale;
            }

            if (cfg.shadows) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }

            if (texture) {
                mesh.material.map = texture;
            }
            meshes.add(mesh);
            scene.add(meshes);
            n--;
        }
    };

    /**
     * Returns number of models in scene
     * @returns {number} Number of models
     */
    pub.getModelCount = function () {
        return meshes.children.length;
    };

    /**
     * Returns number of tris in scene
     * @returns {number} Number of tris
     */
    pub.getTrisCount = function () {
        if (geometry && geometry.faces) {
            return geometry.faces.length * meshes.children.length;
        } else {
            return 0;
        }
    };

    /**
     * Sets geometric primitive to drwa
     * @param {string} geo Primtive
     */
    pub.setGeometry = function (geo) {
        switch (geo) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(2);
                break;
            default:
            case 'box':
                geometry = new THREE.BoxGeometry(4, 4, 4);
                break;
        }
    };

    pub.setMaterial = function (type, shading) {
        materialParams.type = type;

        switch (shading) {
            case 'none':
                materialParams.shading = THREE.NoShading;
                break;
            case 'smooth':
                materialParams.shading = THREE.SmoothShading;
                break;
            default:
            case 'flat':
                materialParams.shading = THREE.FlatShading;
                break;
        }
    };

    /**
     * Translates all meshes with given vector
     * @type {object} vec A xyz tupel
     */
    pub.translate = function (vec) {
        meshes.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.translateX(vec.x || 0);
                child.translateY(vec.y || 0);
                child.translateZ(vec.z || 0);
            }
        });

    };

    /**
     * Tests browser support for WebGL
     * @returns {string} Status of support
     */
    pub.browserSupportTest = function () {
        if (Boolean(window.WebGLRenderingContext) === false) {
            return 'UNSUPPORTED';
        }
        try {
            var canvas = document.createElement('canvas');
            var gl = canvas.getContext('webgl') ||
                     canvas.getContext('experimental-webgl');
            if (!gl) {
                return 'ERROR_INITIALIZING';
            }
        } catch (e) {
            return 'ERROR_INITIALIZING';
        }

        return 'SUPPORTED';
    };

    /**
     * Tests lightning and shading capabilities
     * @param {string} objFile URL to object file
     * @param {number} scale Scaling of model
     * @param {function} callback Callback function
     */
    pub.realismTest = function (objFile, scale, texureFile) {
        cfg.animation.rotate = true;
        cfg.shadows = true;

        setCamera({
           x: 0.33 * gridSize,
           y: gridSize,
           z: 3 * gridSize
        }, {
            x: 0.33 * gridSize,
            y: 0.5 * gridSize,
            z: 0.5 * gridSize
        });

        pub.loadModel(objFile, function () {
            texture = THREE.ImageUtils.loadTexture('../../res/' + texureFile, {}, function() {
                pub.setMaterial('phong', 'smooth');
                pub.addModel(1, scale, 0xFFFFFF);
                pub.translate({y: 40});
            });
        });

    };

    /**
     * Enables object picking
     * Adapted from: https://github.com/sole/three.js-tutorials/blob/master/object_picking/main.js
     */
    pub.pickingTest = function (n, scale) {
        pub.addModel(n, scale);

        var projector = new THREE.Projector();
        var mouseVector = new THREE.Vector3();

        // User interaction
        window.addEventListener('mousemove', pick, false);
        window.addEventListener('mousedown', pick, false);

        function pick(e) {
            mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
            mouseVector.y = 1 - 2 * (e.clientY / window.innerHeight);

            var raycaster  = projector.pickingRay(mouseVector.clone(), camera);
            var intersects = raycaster.intersectObjects(meshes.children, false);

            for (var i = 0; i < intersects.length; i++ ) {
                var mesh = intersects[i];
                switch (e.type) {
                    case 'mousemove':
                        mesh.object.material.color.setRGB(0, 0, 0);
                        break;
                    case 'mousedown':
                        meshes.remove(mesh.object);
                        break;
                }
            }
        }
    };

    /**
     * Sets up camera
     */
    function setupCamera() {
        var ww = window.innerWidth;
        var wh = window.innerHeight;
        camera = new THREE.PerspectiveCamera(45, ww / wh, 1, 1000);
        camera.position.x = def.cam.pos.x;
        camera.position.y = def.cam.pos.y;
        camera.position.z = def.cam.pos.z;
        camera.up = new THREE.Vector3(0, 1, 0);
        var lookAt = def.cam.lookAt;
        camera.lookAt(new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z));
    }

    /**
     * Sets camera position and optionally look at point
     * @param {object} pos Position vector
     * @param {object} lookAt Look at vector
     */
    function setCamera(pos, lookAt) {
        camera.position.x = pos.x;
        camera.position.y = pos.y;
        camera.position.z = pos.z;

        if (lookAt) {
            controls.target.x = lookAt.x;
            controls.target.y = lookAt.y;
            controls.target.z = lookAt.z;
        }
    }

    /**
     * Orbit navigation
     */
    function setupControls() {
        controls = new THREE.OrbitControls(camera);
        controls.target = new THREE.Vector3(0, 0.66 * gridSize, 0);
    }

    /**
     * Create the WebGLRenderer
     */
    function setupRenderer() {
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xffffff, 1);

        renderer.shadowMapEnabled = true;
        renderer.shadowMapType = THREE.PCFSoftShadowMap;

        document.body.appendChild(renderer.domElement);
    }

    /**
     * Sets up illumination
     */
    function setupIllumination() {
        ambientLight = new THREE.AmbientLight(0x333333);
        dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(-gridSize, 0.5 * gridSize, 0.5 * gridSize);

        var d = 200;
        dirLight.castShadow = true;
        dirLight.shadowCameraLeft   = -d;
        dirLight.shadowCameraRight  =  d;
        dirLight.shadowCameraTop    =  d;
        dirLight.shadowCameraBottom = -d;
        dirLight.shadowCameraNear = 0.1;
        dirLight.shadowCameraFar = 400;
        dirLight.shadowBias = 0.0001;
        dirLight.shadowDarkness = 0.3;
        dirLight.shadowMapWidth = 2048;
        dirLight.shadowMapHeight = 2048;

        scene.add(ambientLight);
        scene.add(dirLight);
    }

    /**
     * A single frame
     */
    function tick() {
        if (window.parent.app.stats) {
            window.parent.app.stats.update();
        }

        if (controls)
            controls.update();

        if (cfg.animation.enabled && (meshes.children.length > 1 || cfg.animation.rotate)) {
            animate();
        }

        render();
        requestAnimationFrame(tick);
    }

    /**
     * Animation methode
     */
    function animate() {
        var i = 0;
        meshes.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                if (cfg.animation.rotate) {
                    child.rotation.y += 0.015;
                } else {
                    if (typeof child.rad === 'undefined') {
                        child.rad = Math.random() * gridSize;
                    }

                    child.position.x = child.rad * Math.cos(i);
                    child.position.y = 8 * Math.sin(i * 8) + i / meshes.children.length * gridSize * 2;
                    child.position.z = child.rad * Math.sin(i);
                    i++;
                }
            }
        });
    }

    /**
     * Render function
     */
    function render() {
        renderer.render(scene, camera);
    }

    /**
     * Helper function: Create a Three.js material
     * @param {number} color Hex code of color
     * @returns {*} Material
     */
    function createMaterial(color) {
        var material;
        color = color || (Math.random() * 0xFFFFFF << 0);

        switch (materialParams.type) {
            case 'phong':
                material = new THREE.MeshPhongMaterial({
                    color: color,
                    shading: materialParams.shading,
                    shininess: 100
                });
                break;
            default:
            case 'lambert':
                material = new THREE.MeshLambertMaterial({
                    color: color,
                    shading: materialParams.shading
                });
                break;
        }
        return material;
    }

    /**
     * Calculates UVs with bounding boxes automatically
     * @param geometry
     */
    function assignUVs(geometry) {
        geometry.computeBoundingBox();

        var max     = geometry.boundingBox.max;
        var min     = geometry.boundingBox.min;

        var offset  = new THREE.Vector2(0 - min.x, 0 - min.y);
        var range   = new THREE.Vector2(max.x - min.x, max.y - min.y);

        geometry.faceVertexUvs[0] = [];
        var faces = geometry.faces;

        for (i = 0; i < geometry.faces.length ; i++) {

            var v1 = geometry.vertices[faces[i].a];
            var v2 = geometry.vertices[faces[i].b];
            var v3 = geometry.vertices[faces[i].c];

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2( ( v1.x + offset.x ) / range.x , ( v1.y + offset.y ) / range.y ),
                new THREE.Vector2( ( v2.x + offset.x ) / range.x , ( v2.y + offset.y ) / range.y ),
                new THREE.Vector2( ( v3.x + offset.x ) / range.x , ( v3.y + offset.y ) / range.y )
            ]);

        }

        geometry.uvsNeedUpdate = true;
    }

    /**
     * Creates the coordinate system
     */
    function createCoordSystem() {
        var gridColor = new THREE.Color(0xcccccc);

        for (var i = 0; i < 3; i++) {
            grids[i] = new THREE.GridHelper(gridSize, gridStep);
            grids[i].setColors(gridColor, gridColor);
            grids[i].receiveShadow = true;
        }

        // XY
        grids[0].rotation.x = Math.PI / 2;
        grids[0].position.set(0, gridSize, -gridSize);

        // XZ
        // Correct by default

        // YZ
        grids[2].rotation.z = Math.PI / 2;
        grids[2].position.set(gridSize, gridSize, 0);

        for (var i = 0; i < grids.length; i++) {
            scene.add(grids[i]);
        }
    }

    /**
     * Event handler for window resize
     */
    function onWindowResize() {
        var ww = window.innerWidth;
        var wh = window.innerHeight;
        camera.aspect = ww / wh;
        camera.updateProjectionMatrix();
        renderer.setSize(ww, wh);
    }

    return pub;
}

// Hand object to master frame
$(function () {
    window.parent.app.frame = new WebGLFrame();
    window.parent.app.frame.init();
});