/**
 *
 * Created by Yuriy Bushev <bushevuv@gmail.com> on 25/12/2016.
 */

'use strict';

/**
 * ShouldJS
 */
const should = require('should');

/**
 * Core path module
 */
const path = require('path');

/**
 * Core os module
 */
const os = require('os');

/**
 * Core fs module
 */
const fs = require('fs');

/**
 * Random string library
 */
const randomstring = require('randomstring');

/**
 * XML parser
 *
 * @type {*}
 */
const xml2js = require('xml2js');

const Importer = require('../index').Importer;

const FEED_URL = 'https://dev.realtypult.ru/xml/import-feed-realtypult.xml';

/**
 * Parser
 *
 * @type {*}
 */
let parser = new xml2js.Parser({explicitArray: false});

function onItemSuccessWithViews(item, callback) {

    callback(null, {url: `http://your-site.ru/item-${item.id}`, views: 15});
}

function onItemSuccessWithoutViews(item, callback) {

    callback(null, {url: `http://your-site.ru/item-${item.id}`});
}

function onItemError(item, callback) {

    callback({error: 'Что-то плохое случилось'});
}

function onEnd(report) {

    console.log(report);
}

function onError(error) {

    console.log(error);
}

describe('Create instance', () => {

    it('success', () => {
        (() => {
            let importer = new Importer({
                xmlFeedUrl: 'https://dev.realtypult.ru/xml/import-feed-realtypult.xml',
                reportFileLocation: '/Users/bushev/Downloads/rm-report.xml',
                format: 'realtypult',
                onItem: onItemSuccessWithViews,
                onEnd: onEnd,
                onError: onError
            });
        }).should.not.throw();
    });

    it('without feedUrl', () => {
        (() => {
            let importer = new Importer({
                reportFileLocation: '/Users/bushev/Downloads/rm-report.xml',
                format: 'realtypult',
                onItem: onItemSuccessWithViews,
                onEnd: onEnd,
                onError: onError
            });
        }).should.throw('Importer::constructor: "options.xmlFeedUrl" parameter is required!');
    });

    it('without reportFileLocation', () => {
        (() => {
            let importer = new Importer({
                xmlFeedUrl: 'https://dev.realtypult.ru/xml/import-feed-realtypult.xml',
                format: 'realtypult',
                onItem: onItemSuccessWithViews,
                onEnd: onEnd,
                onError: onError
            });
        }).should.throw('Importer::constructor: "options.reportFileLocation" parameter is required!');
    });

    it('without format', () => {
        (() => {
            let importer = new Importer({
                xmlFeedUrl: 'https://dev.realtypult.ru/xml/import-feed-realtypult.xml',
                reportFileLocation: '/Users/bushev/Downloads/rm-report.xml',
                onItem: onItemSuccessWithViews,
                onEnd: onEnd,
                onError: onError
            });
        }).should.throw('Importer::constructor: "options.format" parameter is required!');
    });

    it('without onItem', () => {
        (() => {
            let importer = new Importer({
                xmlFeedUrl: 'https://dev.realtypult.ru/xml/import-feed-realtypult.xml',
                format: 'realtypult',
                reportFileLocation: '/Users/bushev/Downloads/rm-report.xml',
                onEnd: onEnd,
                onError: onError
            });
        }).should.throw('Importer::constructor: "options.onItem" callback is required!');
    });

    it('without onEnd', () => {
        (() => {
            let importer = new Importer({
                xmlFeedUrl: 'https://dev.realtypult.ru/xml/import-feed-realtypult.xml',
                format: 'realtypult',
                reportFileLocation: '/Users/bushev/Downloads/rm-report.xml',
                onItem: onItemSuccessWithViews,
                onError: onError
            });
        }).should.throw('Importer::constructor: "options.onEnd" callback is required!');
    });

    it('without onError', () => {
        (() => {
            let importer = new Importer({
                xmlFeedUrl: 'https://dev.realtypult.ru/xml/import-feed-realtypult.xml',
                format: 'realtypult',
                reportFileLocation: '/Users/bushev/Downloads/rm-report.xml',
                onItem: onItemSuccessWithViews,
                onEnd: onEnd
            });
        }).should.throw('Importer::constructor: "options.onError" callback is required!');
    });
});

describe('Feed handling', () => {

    it('report with views', done => {

        let reportFileLocation = path.join(os.tmpdir(), `my-realtypult-report-${randomstring.generate(5)}.xml`);

        let importer = new Importer({
            xmlFeedUrl: FEED_URL,
            reportFileLocation: reportFileLocation,
            format: 'realtypult',
            onItem: onItemSuccessWithViews,
            onEnd: report => {

                report.location.should.equal(reportFileLocation);

                report.statistics.total.should.equal(2);
                report.statistics.success.should.equal(2);
                report.statistics.errors.should.equal(0);

                parser.parseString(fs.readFileSync(reportFileLocation, 'utf8'), (err, reportObject) => {

                    reportObject.objects.object.should.be.lengthOf(2);

                    reportObject.objects.object[0].$.id.should.equal('679511');
                    reportObject.objects.object[0].url.should.containEql(`http://your-site.ru/item-`);
                    reportObject.objects.object[0].views.should.equal('15');

                    reportObject.objects.object[1].$.id.should.equal('679512');
                    reportObject.objects.object[1].url.should.containEql(`http://your-site.ru/item-`);
                    reportObject.objects.object[1].views.should.equal('15');

                    done();
                });
            },
            onError: onError
        });

        importer.run();
    });

    it('report without views', done => {

        let reportFileLocation = path.join(os.tmpdir(), `my-realtypult-report-${randomstring.generate(5)}.xml`);

        let importer = new Importer({
            xmlFeedUrl: FEED_URL,
            reportFileLocation: reportFileLocation,
            format: 'realtypult',
            onItem: onItemSuccessWithoutViews,
            onEnd: report => {

                report.location.should.equal(reportFileLocation);

                report.statistics.total.should.equal(2);
                report.statistics.success.should.equal(2);
                report.statistics.errors.should.equal(0);

                parser.parseString(fs.readFileSync(reportFileLocation, 'utf8'), (err, reportObject) => {

                    reportObject.objects.object.should.be.lengthOf(2);

                    reportObject.objects.object[0].$.id.should.equal('679511');
                    reportObject.objects.object[0].url.should.containEql(`http://your-site.ru/item-`);
                    should.not.exists(reportObject.objects.object[0].views);

                    reportObject.objects.object[1].$.id.should.equal('679512');
                    reportObject.objects.object[1].url.should.containEql(`http://your-site.ru/item-`);
                    should.not.exists(reportObject.objects.object[1].views);

                    done();
                });
            },
            onError: onError
        });

        importer.run();
    });

    it('report with errors', done => {

        let reportFileLocation = path.join(os.tmpdir(), `my-realtypult-report-${randomstring.generate(5)}.xml`);

        let importer = new Importer({
            xmlFeedUrl: FEED_URL,
            reportFileLocation: reportFileLocation,
            format: 'realtypult',
            onItem: onItemError,
            onEnd: report => {

                report.location.should.equal(reportFileLocation);

                report.statistics.total.should.equal(2);
                report.statistics.success.should.equal(0);
                report.statistics.errors.should.equal(2);

                parser.parseString(fs.readFileSync(reportFileLocation, 'utf8'), (err, reportObject) => {

                    reportObject.objects.object.should.be.lengthOf(2);

                    reportObject.objects.object[0].$.id.should.equal('679511');
                    reportObject.objects.object[0].error.should.equal('Что-то плохое случилось');
                    should.not.exists(reportObject.objects.object[0].url);
                    should.not.exists(reportObject.objects.object[0].views);

                    reportObject.objects.object[1].$.id.should.equal('679512');
                    reportObject.objects.object[1].error.should.equal('Что-то плохое случилось');
                    should.not.exists(reportObject.objects.object[1].url);
                    should.not.exists(reportObject.objects.object[1].views);
                    done();
                });
            },
            onError: onError
        });

        importer.run();
    });
});