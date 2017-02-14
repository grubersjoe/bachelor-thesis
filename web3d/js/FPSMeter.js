function FPSMeter(canvas) {
    var pub = {};

    var fps = null;
    var context = canvas.getContext('2d');
    var framesToShow = canvas.width;

    var barWidth = canvas.width / framesToShow;

    /**
     * Shortcut to trigger both drawing methods
     */
    pub.draw = function () {
        fps = app.stats.getFps(framesToShow);
        this.drawCurFps(fps[fps.length - 1]);
        this.drawFpsChart();
    };

    /**
     * Draws a fps chart in 2d canvas
     */
    pub.drawFpsChart = function() {
        context.clearRect(0, 0, 200, canvas.height);
        for (var i = fps.length - 1; i >= 0; i--) {
            var x = (i - fps.length + framesToShow) * barWidth;
            var y = canvas.height - fps[i];
            context.fillStyle = '#fff';
            context.fillRect(x, y, barWidth, canvas.height);
        }
    };

    /**
     * Writes current FPS into label
     * @param {number} fps Current FPS
     */
    pub.drawCurFps = function(fps) {
        if (app.dom.curFps && fps)
            app.dom.curFps.html(fps.toFixed(1) + '');
    };

    return pub;
}