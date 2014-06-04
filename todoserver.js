/**
 * Created by xerxes on 6/3/14.
 */
(function () {

    var express, app, http, route, _, bodyParser, async, Knex, knex,path;
    path = require('path');
    express = require('express');
    http = require('http');
    bodyParser = require('body-parser');
    _ = require('underscore');
    async = require('async');
    Knex = require('knex');

    knex = Knex.initialize({
        client: 'pg',
        connection: {
            host: '127.0.0.1',
            user: 'openerp',
            password: '',
            database: 'planurday'
        }
    });

    app = express();

    app.use(bodyParser());
    app.use(express.static(path.join(__dirname, '/bower_components/')));
    app.use(express.static(path.join(__dirname, '/todo/')));
    app.set('port', process.env.PORT || 3000);

    http.createServer(app).listen(app.get('port'), function () {
        console.log('server running @ ', app.get('port'))
    });

    app.route('/')
        .get(function (req, res) {
            return res.sendfile('index.html');
        });


    app.route('/gettimespent')
        .post(function (request, response) {

        });
})();