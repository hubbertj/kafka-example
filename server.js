"use strict";

var connect = require('connect');
var serveStatic = require('serve-static');
var express = require('express');
var app = express();
var dir = "/www";
var path = require('path');
var pPort = process.env['testPort'] || 8000;
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var routerApi = express.Router();
const CONFIG = require('config');

//web socket
var WebSocketServer = require('websocket').server;
var WebSocketClient = require('websocket').client;
var WebSocketFrame = require('websocket').frame;
var WebSocketRouter = require('websocket').router;
var W3CWebSocket = require('websocket').w3cwebsocket;

app.use('/', express.static(path.join(__dirname, dir)))
app.use(bodyParser.urlencoded({
        extended: true
    }))
    .use(bodyParser.json())
    .use(methodOverride());

//static web
app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname + dir + '/index.html'));
    })
    .get('/chat', function(req, res) {
        res.sendFile(path.join(__dirname + dir + '/pages/chat.html'));
    });

//api
routerApi.all('/chat-message', function(req, res) {
		var connectionStr = CONFIG.get('Kafka.host') + ":" + CONFIG.get('Kafka.port');
        var verb = req.method;
        switch (verb.toUpperCase()) {
            case 'POST':
                var kafka = require('kafka-node');
                var Producer = null;
                var client = null;
                var producer = null;
                var payloads = [];

                var data = req.body

                new Promise(function(resolve, reject) {
                    
                    console.log('Trying to send this to kafka message que ' + connectionStr);
                    Producer = kafka.Producer;
                    client = new kafka.Client(connectionStr);
                    producer = new Producer(client);

                    payloads.push({ topic: data.topic, messages: data.message, partition: 0 });

                    producer.on('ready', function() {
                        producer.send(payloads, function(err, data) {
                            if (err) {
                                return reject(err);
                            }

                            console.log('sent', data);
                            return resolve(data);
                        });
                    }).on('error', function(err) {
                        return reject(err);
                    });


                }).then(function(data) {
                    res.status(200).send({ data: data, msg: 'Ok' });
                }).catch(function(err) {
                    res.status(403).send({ error: err });
                });

                break;
            case 'PUT':
                res.status(403).send({ error: 'PUT no supported.' });
                break;
            case 'DELETE':
                res.status(403).send({ error: 'DELETE no supported.' });
                break;
            case 'GET':
            	var connectionStr = CONFIG.get('Kafka.host') + ":" + "9092";
                var data = req.query
                var kafka = require('kafka-node');
                var Consumer = kafka.Consumer;
                var client = new kafka.Client(connectionStr);

                var consumer = new Consumer(
                    client, [
                        { topic: data.topic, partition: 0 }
                    ], {
                        autoCommit: false
                    }
                );

                consumer.on('message', function (message) {
				    console.log(message);
				});
                res.status(200).send({ msg: 'Ok' });

                break;
            default:
                res.status(500).send({ error: 'Something failed!' });
                break;
        }
    })
    .all('/post-example', function(req, res) {
        var kafka = null;
        var Producer = null;
        var client = null;
        var producer = null;
        var payloads = [];
        var KeyedMessage = null;

        var verb = req.method;

        switch (verb.toUpperCase()) {
            case 'POST':
                var data = req.body

                new Promise(function(resolve, reject) {
                    var connectionStr = CONFIG.get('Kafka.host') + ":" + CONFIG.get('Kafka.port');
                    console.log('Trying to send this to kafka message que ' + connectionStr);
                    kafka = require('kafka-node');
                    KeyedMessage = kafka.KeyedMessage;
                    Producer = kafka.Producer;

                    client = new kafka.Client(connectionStr);

                    producer = new Producer(client);

                    var km = new KeyedMessage('new-user', data);

                    payloads.push({ topic: CONFIG.get('Kafka.topic'), messages: [JSON.stringify(km)], partition: 0 });

                    producer.on('ready', function() {
                        producer.send(payloads, function(err, data) {
                            if (err) {
                                return reject(err);
                            }

                            console.log('sent', data);
                            return resolve(data);
                        });
                    }).on('error', function(err) {
                        return reject(err);
                    });


                }).then(function(data) {
                    res.status(200).send({ data: data, msg: 'Ok' });
                }).catch(function(err) {
                    res.status(403).send({ error: err });
                });
                break;
            case 'GET':
                res.status(200).send({ msg: 'Ok' });
                break;
            case 'PUT':
                res.status(200).send({ msg: 'Ok' });
                break;
            case 'DELETE':
                res.status(500).send({ error: 'DELETE no supported.' });
                break;
            default:
                res.status(500).send({ error: 'Something failed!' });
                break;
        }

    });


app.use(routerApi);

var aprocess = new Promise(function(resolve, reject) {
    var listener = app.listen(pPort, function(err) {
        if (err) {
            return reject(err);
        }
        return resolve("Started Server on port " + listener.address().port);
    });
}).then(function(results) {
    console.log(results);
}).catch(function(err) {
    console.error(err);
});