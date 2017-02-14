function Persistence() {

    var pub = {};
    var testResults = {};

    /**
     * Push a test result in array storage
     * @param string test Test name
     * @param string tech Technology
     * @param object results Object with results
     */
    pub.pushResults = function (test, tech, results) {
        if (!testResults[test])
            testResults[test] = {};

        if (!testResults[test][tech])
            testResults[test][tech] = [];

        testResults[test][tech].push(results);
    };

    pub.getResults = function () {
        return testResults;
    };

    /**
     * Returns results of one specific test
     * @param string test Name of test
     * @returns {*}
     */
    pub.getResultsByTest = function (test, tech) {
        if (typeof tech !== 'undefined') {
            return testResults[test][tech];
        } else {
            return testResults[test];
        }
    };

    /**
     * Returns a niceley formatted JSON represenation of
     * test results as a file to download
     */
    pub.getResultsAsFile = function () {
        var fileContent = 'data:text/csv;charset=utf-8,';
        fileContent += JSON.stringify(pub.getResults(), null, 4);
        var link = document.createElement('a');
        link.setAttribute('href', encodeURI(fileContent));
        link.setAttribute('download', 'results.dat');
        link.click();
    };

    return pub;
}