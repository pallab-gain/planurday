/**
 * Created by xerxes on 6/3/14.
 */
(function () {

    var express, app, http, route, _, bodyParser, async, Knex, knex, path;
    path = require('path');
    express = require('express');
    http = require('http');
    bodyParser = require('body-parser');
    _ = require('underscore');
    async = require('async');
    Knex = require('knex');

    knex = Knex.initialize({
        client: 'mysql',
        connection: {
            host: '127.0.0.1',
            user: 'root',
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


    app.route('/postdata')
        .post(function (request, response) {
            async.each(request.body.values, function (item, callback1) {
                knex('plan').where('id', '=', item.id).then(function (model) {
                    if (model.length == 0) {
                        knex('plan').insert([
                            {'id': item.id, 'name': item.name, 'total_duration': item.total_duration, 'duration_insec': item.duration_insec,
                                'duration': item.duration, 'running': item.running}
                        ]).exec(function (data) {
                            //console.log(data);
                        });
                    } else {
                        knex('plan').where('id', '=', item.id).update({'id': item.id, 'name': item.name, 'total_duration': item.total_duration, 'duration_insec': item.duration_insec,
                            'duration': item.duration, 'running': item.running}).then(function (garbase) {
                        })
                    }
                    callback1(null);
                });
            }, function (err) {
                if (err) {
                    return response.send({'err': err, 'result': null});
                } else {
                    return response.send({'err': null, 'result': 'success'});
                }
            });


        });

})();