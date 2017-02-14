/**
 * Based on mrdoob's Stats.js plugin
 * https://github.com/mrdoob/stats.js
 *
 * @author mrdoob / http://mrdoob.com
 * @author Jonathan Gruber / http://webreaktor.net
 * @copyright mrdoob / http://mrdoob.com
 * @license MIT License
 */

var Stats = function () {
    var pub = {};

    var data = {
        fps: [], ms: []
    };

    var startTime = Date.now(), prevTime = startTime;
    var ms = 0, msMin = Infinity, msMax = 0;
    var fps = 0, fpsMin = Infinity, fpsMax = 0;

    var frames = 0;
    var filter = 500;

    pub.begin = function() {
        startTime = Date.now();
    };

    pub.end = function() {
        var time = Date.now();

        ms = time - startTime;
        msMin = Math.min(msMin, ms);
        msMax = Math.max(msMax, ms);

        frames++;

        // Calculates average values after one second
        if ( time > prevTime + filter ) {
            fps = Math.round(( frames * 1000) / (time - prevTime ));
            fpsMin = Math.min(fpsMin, fps);
            fpsMax = Math.max(fpsMax, fps);
            prevTime = time;
            frames = 0;

            // Save data
            data.fps.push(fps);
            data.ms.push(ms);
        }

        return time;
    };

    pub.update = function() {
        startTime = this.end();
    };

    pub.pushFrame = function (fps) {
        data.fps.push(fps);
    };

    /**
     * Returns either all, the last or a specific interval of last frames
     * @param number n Number of frames to return
     * @param number start Optional start index
     * @returns array Framerates
     */
    pub.getFps = function(n, start) {
        if (typeof n === 'undefined') {
            return data.fps;
        } else if (n === 1) {
            return data.fps[data.fps.length - 1];
        } else {
            if (typeof start !== 'undefined') {
                return data.fps.slice(start, start+n);
            } else {
                return data.fps.slice(-n);
            }
        }
    };

    pub.getMs = function(n) {
        if (typeof n === 'undefined') {
            return data.ms;
        } else {
            return data.ms.slice(-n);
        }
    };

    pub.getMinMaxMs = function() {
        return [msMin, msMax];
    };

    pub.getMinMaxFps = function() {
        return [fpsMin, fpsMax];
    };

    return pub;
};