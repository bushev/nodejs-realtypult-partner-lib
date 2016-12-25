/**
 *
 * Created by Yuriy Bushev <bushevuv@gmail.com> on 25/12/2016.
 */

'use strict';

/**
 * String validator
 *
 * @type {*|exports|module.exports}
 */
const validator = require('validator');

/**
 * AsyncJS module
 *
 * @type {*}
 */
const async = require('async');

/**
 * RequestJS module
 *
 * @type {*}
 */
const request = require('request');

/**
 * Core path module
 */
const path = require('path');

/**
 * Core os module
 */
const os = require('os');

/**
 * Core fs module + extra stuff
 */
const fs = require('fs.extra');

/**
 * Random string library
 */
const randomstring = require('randomstring');

/**
 * XML library
 *
 * @type {xml|exports|module.exports}
 */
const xmlBuilder = require('xml');

/**
 * XML stream reader
 *
 * @type {*|exports|module.exports}
 */
const XmlStream = require('xml-stream');

/**
 * Small util: check if filepath exists and is a file
 */
const fileExists = require('file-exists');

/**
 * Library info
 */
const pkgInfo = require('../package.json');

class Importer {

    /**
     * Class constructor
     *
     * @param options
     * @param options.xmlFeedUrl {string} - XML feed URL
     * @param options.reportFileLocation {string} - Full path to store a report file
     * @param options.format {string} - Format of XML feed
     * @param options.onItem {function} - Item handler
     * @param options.onEnd {function} - Import end handler
     * @param options.onError {function} - Error handler
     */
    constructor(options) {

        if (typeof options !== 'object') throw new Error(`Importer::constructor: "options" parameter is required!`);
        if (!options.xmlFeedUrl) throw new Error(`Importer::constructor: "options.xmlFeedUrl" parameter is required!`);
        if (!options.reportFileLocation) throw new Error(`Importer::constructor: "options.reportFileLocation" parameter is required!`);
        if (!options.format) throw new Error(`Importer::constructor: "options.format" parameter is required!`);

        if (!validator.isURL(options.xmlFeedUrl, {protocols: ['http', 'https']})) {

            throw new Error(`Importer::constructor: "options.xmlFeedUrl" parameter is invalid!`);
        }

        if (typeof options.onItem !== 'function') throw new Error(`Importer::constructor: "options.onItem" callback is required!`);
        if (typeof options.onEnd !== 'function') throw new Error(`Importer::constructor: "options.onEnd" callback is required!`);
        if (typeof options.onError !== 'function') throw new Error(`Importer::constructor: "options.onError" callback is required!`);

        if (options.format === 'realtypult') {

            this.collectTags = ['image'];
            this.itemTag = 'object';
            this.rootTag = 'root';

            this.getItemId = item => {

                return item.$.id;
            };

        } else if (options.format === 'yandex') {

            this.collectTags = ['image', 'room-space'];
            this.itemTag = 'offer';
            this.rootTag = 'realty-feed';

            this.getItemId = item => {

                return item.$['internal-id'];
            };
        }

        this.xmlFeedUrl = options.xmlFeedUrl;
        this.reportFileLocation = options.reportFileLocation;

        this.onItem = options.onItem;
        this.onEnd = options.onEnd;
        this.onError = options.onError;

        /**
         * Import report data
         *
         * @type {{location, statistics: {total: number, success: number, rejected: number, errors: number}}}
         */
        this.report = {
            location: options.reportFileLocation,
            statistics: {
                total: 0,
                success: 0,
                rejected: 0,
                errors: 0
            }
        };
    }

    /**
     * Remove file if exists
     *
     * @private
     *
     * @param filePath
     * @param callback
     */
    removeFileIfExists(filePath, callback) {

        if (fileExists(filePath)) {

            fs.unlink(filePath, callback);

        } else {

            callback();
        }
    }

    /**
     * Download XML feed by URL
     *
     * @private
     *
     * @param callback {function} - Callback function
     */
    downloadXmlFeed(callback) {

        this.downloadPath = path.join(os.tmpdir(), `realtypult-feed-${randomstring.generate(5)}.xml`);

        let file = fs.createWriteStream(this.downloadPath);

        let error = null;
        let callbackCalled = false;

        file.on('finish', () => {

            if (!callbackCalled) {
                callback(error);
            }
        });

        file.on('error', err => {

            callbackCalled = true;
            callback(err);
        });

        request({
            method: 'GET',
            url: this.xmlFeedUrl,
            headers: {
                'User-Agent': `${pkgInfo.name}/${pkgInfo.version}`
            },
            timeout: 2 * 60 * 1000
        }).on('error', err => {
            error = err;
            file.end();
        }).pipe(file);
    }

    /**
     * Setup report stream
     *
     * @private
     */
    setupReportStream() {

        this.reportFileTmpLocation = path.join(os.tmpdir(), `realtypult-tmp-report-${randomstring.generate(5)}.xml`);

        this.xmlReport = xmlBuilder.element();

        const reportStream = xmlBuilder({objects: this.xmlReport}, {stream: true, declaration: true, indent: '\t'});

        reportStream.on('data', chunk => {
            try {
                fs.appendFileSync(this.reportFileTmpLocation, `${chunk}\r\n`, 'utf8');
            } catch (err) {
                console.log(`Importer::setupReportStream: ${err.stack}`);
            }
        });
    }

    /**
     * Parse XML feed
     *
     * @private
     *
     * @param callback
     */
    parse(callback) {

        this.collectTags.forEach(tag => {
            this.reader.collect(tag);
        });

        this.reader.on(`updateElement: ${this.itemTag}`, item => {

            this.reader.pause();

            this.report.statistics.total++;

            // inject id
            item.id = this.getItemId(item);

            this.onItem(item, data => {

                if (typeof data !== 'object') return callback(new Error(`Importer::onItem: data must be an object`));

                if (data.url) {

                    if (typeof data.url !== 'string') return callback(new Error(`Importer::onItem: url must be a string`));

                    this.report.statistics.success++;

                    let result = {object: [{_attr: {id: item.id}}, {url: data.url}]};

                    if (typeof data.views !== 'undefined') {

                        result.object.push({views: data.views});
                    }

                    this.xmlReport.push(result);

                } else if (data.error) {

                    if (typeof data.error !== 'string') return callback(new Error(`Importer::onItem: error must be a string`));

                    this.report.statistics.errors++;

                    this.xmlReport.push({object: [{_attr: {id: item.id}}, {error: data.error}]});

                } else if (data.similarUrl) {

                    if (typeof data.similarUrl !== 'string') return callback(new Error(`Importer::onItem: similarUrl must be a string`));

                    this.report.statistics.rejected++;

                    this.xmlReport.push({object: [{_attr: {id: item.id}}, {similarUrl: data.similarUrl}]});

                } else if (data.rejectReason) {

                    if (typeof data.rejectReason !== 'string') return callback(new Error(`Importer::onItem: rejectReason must be a string`));

                    this.report.statistics.rejected++;

                    this.xmlReport.push({object: [{_attr: {id: item.id}}, {rejectReason: data.rejectReason}]});

                } else {

                    return callback(new Error(`Importer::onItem: unexpected data`));
                }

                setTimeout(() => {
                    this.reader.resume();
                });
            });
        });

        this.reader.on(`endElement: ${this.rootTag}`, () => {
            this.xmlReport.close();

            callback();
        });
    }

    /**
     * Replace old report file with new
     *
     * @private
     *
     * @param callback
     */
    storeReportFile(callback) {

        this.removeFileIfExists(this.reportFileLocation, err => {
            if (err) return callback(err);

            fs.move(this.reportFileTmpLocation, this.reportFileLocation, callback);
        });
    }

    /**
     * Run importer..
     */
    run() {

        async.series([callback => {

            this.downloadXmlFeed(callback);

        }, callback => {

            this.setupReportStream();

            this.reader = new XmlStream(fs.createReadStream(this.downloadPath));

            this.parse(callback);

        }, callback => {

            this.storeReportFile(callback);

        }, callback => {

            this.removeFileIfExists(this.downloadPath, callback);

        }], err => {
            if (err) return this.onError(err);

            this.onEnd(this.report);
        });
    }
}

/**
 * Export Importer class
 *
 * @type {Importer}
 */
module.exports = Importer;