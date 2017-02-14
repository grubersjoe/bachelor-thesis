// Self invoking anonymous function to prevent pollution of global namespace
(function() {
    'use strict'; // Strict mode

    var gl;                           // WebGL context
    var canvas;                       // The HTML canvas DOM element
    var numOfTris;                    // Number of to be drawn triangles
    var rotAngle = 0;                 // Current angle of rotation (animation)

    var modelMatrix = mat4.create();  // Model matrix
    var vpMatrix    = mat4.create();  // View projection matrix
    var mvpMatrix   = mat4.create();  // Model view projection matrix
    var mvpMatrixUniform;             // Location of mvMatrix uniform

    function main() {
        var glOptions = {antialias: true};
        try {
            canvas = document.getElementById('gl-canvas');
            if (canvas && Boolean(window.WebGLRenderingContext)) {
                gl = canvas.getContext('webgl', glOptions) ||
                     canvas.getContext('experimental-webgl', glOptions);
            }
        } catch (e) {
            console.error('Your webbrowser does not seem to support WebGL.')
        }

        if (gl) {
            initGl();
            initShaders();
            initBuffers();
            tick();
        } else {
            console.error('WebGL could not be initialized.');
        }
    }

    // Wait for the DOM and other scripts to be fully loaded
    document.addEventListener("DOMContentLoaded", function(event) {
        main();
    });


    /**
     * Basic initialization
     */
    function initGl() {
        gl.enable(gl.DEPTH_TEST);
        gl.lineWidth(2.0);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        vpMatrix = calcViewProjMatrix();

        document.addEventListener('configChanged', function (e) {
            vpMatrix = calcViewProjMatrix();
        });
    }

    /**
     * Sets up view and projection matrix according to projection setting
     * @return {mat4} View projection matrix
     */
    function calcViewProjMatrix() {
        var viewMatrix = mat4.create();
        var projMatrix = mat4.create();
        mat4.lookAt(viewMatrix, [0, 0.5, -2], [0, -0.25, 0], [0, 1, 0]);

        if (cfg.perspective) {
            var aspectRatio = canvas.width / canvas.height;
            mat4.perspective(projMatrix, degToRad(45), aspectRatio, 0.5, 10);
        } else {
            mat4.ortho(projMatrix, -1, 1, -1, 1, 0.5, 3.5);
        }

        return mat4.multiply(vpMatrix, projMatrix, viewMatrix);
    }

    /**
     * Initializes shaders and creates the shader program
     */
    function initShaders() {
        var fragmentShader = getShader(gl, 'shader-fs');
        var vertexShader = getShader(gl, 'shader-vs');

        gl.program = gl.createProgram();
        gl.attachShader(gl.program, vertexShader);
        gl.attachShader(gl.program, fragmentShader);
        gl.linkProgram(gl.program);

        if (!gl.getProgramParameter(gl.program, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program.');
        }
        gl.useProgram(gl.program);

        mvpMatrixUniform = gl.getUniformLocation(gl.program, 'uMVPMatrix');
    }

    /**
     * Returns a compiled shader object from embedded shader source
     * @param  {WebGLRenderingContext} gl WebGL context
     * @param  {string} id ID of the shader script
     * @return {WebGLShader|bool} Compiled shader object or false on error
     */
    function getShader(gl, id) {
        var shader;
        var shaderScript = document.getElementById(id);

        if (!shaderScript)
            return false;

        switch (shaderScript.type) {
            case 'x-shader/x-fragment':
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            case 'x-shader/x-vertex':
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
        }

        gl.shaderSource(shader, shaderScript.textContent);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            return false;
        }

        return shader;
    }

    /**
     * Creates buffer objects, writes vertex data and passes them to WebGL
     */
    function initBuffers() {
        var vertices = new Float32Array([
             0.5,  -0.5, -0.5, // P0
            -0.5,  -0.5, -0.5, // P1
            -0.5,  -0.5,  0.5, // P2
             0.5,  -0.5,  0.5, // P3
             0.0,   0.4,  0.0  // P4
        ]);

        var indices = new Uint8Array([
            4, 0, 1, // Back
            4, 1, 2, // Left
            4, 2, 3, // Back
            4, 3, 0, // Front
            0, 1, 2, // Bottom
            0, 2, 3  // Bottom
        ]);

         var colors = new Float32Array([
             0.0,  0.0,  1.0, // Blue
             0.0,  1.0,  1.0, // Cyan
             1.0,  0.0,  0.0, // Red
             0.8,  0.0,  0.5, // Pink
             0.0,  1.0,  0.0, // Green
         ]);

         numOfTris = indices.length;

        /**
         * Nested helper function: Creates, binds and writes the buffer data
         * @param  {Float32Array} data Buffer data
         * @param  {string} attributeName Name of shader attribute
         */
        var buffer, FSIZE, attribute;
        function setupBuffer(data, attributeName) {
            buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

            FSIZE = data.BYTES_PER_ELEMENT;
            attribute = gl.getAttribLocation(gl.program, attributeName);
            gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, FSIZE * 3, 0);
            gl.enableVertexAttribArray(attribute);
        }

        setupBuffer(vertices, 'aPosition');
        setupBuffer(colors, 'aColor');

        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }

    /**
     * Animaton loop - Recalled by requestAnimatinoFrame
     */
    function tick() {
        if (cfg.animation) {
            animate();
        } else {
            lastTick = Date.now(); // Save rotation state
        }
        render();
        requestAnimationFrame(tick);
    }

    /**
     * Animation - Takes time delta between ticks into account
     */
    var now, lastTick, delta;
    function animate() {
        if (typeof lastTick === 'undefined')
            lastTick = Date.now();
        now = Date.now();
        delta = now - lastTick;
        lastTick = now;

        rotAngle += (0.03 * delta) % 360;
        mat4.rotateY(modelMatrix, mat4.create(), degToRad(rotAngle));
    }


    /**
     * Renders a single frame
     */
    function render() {
        mat4.multiply(mvpMatrix, vpMatrix, modelMatrix);
        gl.uniformMatrix4fv(mvpMatrixUniform, false, mvpMatrix);

        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        var drawMethode = (cfg.wireframe) ? gl.LINE_STRIP : gl.TRIANGLES;
        gl.drawElements(drawMethode, numOfTris, gl.UNSIGNED_BYTE, 0);
    }

    /**
     * Helper function: Converts degrees to radians
     * @param {number} deg Degree representation
     * @return {number} Radian represenation
     */
    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

})();