/*global TodoMVC */
'use strict';

Fernando.module('AutoBahn', function (AutoBahn, Fernando, Backbone, Marionette, $, _) {

    var sess;
    var ret;

    AutoBahn.wsuri = null;

    function onConnect (session) {
        var log_line = "AutoBahn Connection success";
        sess = session;
        ab.log(log_line, sess);
        Fernando.vent.trigger('wamp:success', sess);
        anonLogin();
    }

    function onHangup(code, reason, detail) {
        var log_line = "AutoBahn Connection failed";
        //ab.log(log_line, code, reason, detail);
        sess = null;
        Fernando.vent.trigger('wamp:failure');
    }

    function userLogin (user, pwd) {
        //ab.log("User login", user);
        sess.authreq(user).then(function (challenge) {
            var secret = ab.deriveKey(pwd, JSON.parse(challenge).authextra);
            //var secret = pwd;
            //ab.log("User login secret", secret);
            var signature = sess.authsign(challenge, secret);
            ab.log("User login signature", signature);

            sess.auth(signature).then(onAuth, ab.log);
        }, ab.log);
    }

    function anonLogin () {
        //ab.log("Anonymous login");
        sess.authreq().then(function () {
            sess.auth().then(onAuth, ab.log);
        }, ab.log);
    }

    function onAuth (permissions) {
        ab.log("perms", JSON.stringify(permissions));
    }

    function doLogout (resp) {
        //ab.log('logging out', resp);
        if (resp.ok) {
            Fernando.vent.trigger('granjas:loggedOut', resp);
        } else {
            Fernando.vent.trigger('wamp:failure', resp);
        }
    };

    AutoBahn.connect = function () {
        ab.connect(
                this.wsuri,
                onConnect,
                onHangup,
                {
                    'maxRetries': 60,
                    'retryDelay': 2000
                }
                );
        ab.log('AutoBahn session', sess);
    };

    AutoBahn.disconnect = function () {
        if (sess) {
            sess.close();
            ab.log('DISCONNECTED ab session', sess);
        } else {
            ab.log('NO session to disconnect', sess);
        }
    };

    AutoBahn.subscribe = function (topic, callback) {
        if (sess) {
            ab.log('SUBSCRIBING', topic);
            sess.subscribe(topic, callback);
        } else {
            ab.log('NO session to SUBSCRIBE TO', topic);
        }
    };

    AutoBahn.unsubscribe = function (topic) {
        if (sess) {
            ab.log('UNSUBSCRIBING', topic);
            sess.unsubscribe(topic);
        } else {
            ab.log('NO session to UNSUBSCRIBE FROM', topic);
        }
    };

    AutoBahn.hasSession = function () {
        if (sess) {
            return true;
        } else {
            return false;
        }
    };

    AutoBahn.login = function (creds) {
        function doLogin (resp) {
            if (resp._id) {
                Fernando.vent.trigger('fernando:loggedIn', resp);
            } else {
                Fernando.vent.trigger('fernando:loggedOut', resp);
            }
        }
        sess.call('rpc:login', creds).always(doLogin);
    };

    AutoBahn.logout = function () {
        sess.call('rpc:logout').always(doLogout);
    };

    AutoBahn.sync = function (method, model, options) {
        function success (result) {
            if (options.success) {
                options.success(result);
            }
        }
        function error (result) {
            if (options.error) {
                options.error(result);
            }
        }
        options || (options = {});

        switch (method) {
            case 'create':
                console.log('create sess', sess);
                if ((sess) && (sess._websocket_connected)) {
                    console.log('AutoBahn created', model);
                    if (model.models) {
                        console.log('creating collection');
                    } else {
                        console.log('creating model');
                        AutoBahn.save(model);
                    }
                    return 'create';
                }
                console.log('AutoBahn create failed', model);
                return error('failed');
            case 'update':
                console.log('AutoBahn update', model);
                if (model.models) {
                    console.log('updating collection');
                    console.log('collection url', model.collection.url);
                } else {
                    console.log('updating model');
                }
                return 'update';
            case 'patch':
                console.log('AutoBahn patch', model);
                return 'patch';
            case 'delete':
                console.log('AutoBahn delete', model);
                if (model.models) {
                    console.log('deleting collection');
                } else {
                    console.log('deleting model');
                }
                return 'delete';
            case 'read':
                console.log('AutoBahn read', model);
                if (model.models) {
                    console.log('reading collection');
                    console.log(model.url);
                    if (model.url == 'eventos-info') {
                        AutoBahn.get_events();
                    }
                } else {
                    console.log('reading model');
                }
                return 'read';
        }
    }

    AutoBahn.addInitializer(function () {
        //Backbone.sync = AutoBahn.sync;
    });

});
