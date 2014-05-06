/*global TodoMVC */
'use strict';

TanTan.module('Sync', function (Sync, App, Backbone, Marionette, $, _) {
    Sync.create = function (model, options) {
        console.log('Sync.create', model);
        return $.couch.userDb(function (db) {
            db.saveDoc(model, {
                success: function (data) {
                    console.log('model saved', JSON.stringify(data));
                    if (data.ok) {
                        model.set('_id', data.id);
                        model.set('_rev', data.rev);
                    }
                }
            });
        });
    };

    Sync.update = function (model, options) {
        console.log('Sync.update->create');
        Sync.create(model, success, error);
    };

    Sync.destroy = function (model, options) {
        console.log('Sync.delete');
    };

    Sync.find = function (model, options) {
        console.log('Sync.find');
        if (!model.id) {
            throw new Error("The model has no id property, so it can't get fetched from the database");
        }
        return $.couch.userDb(function (db) {
            db.openDoc(model.id, {
                success: function (doc) {
                    options.success(doc);
                    return options.complete();
                },
                error: function(status, error, reason) {
                    var res;
                    res = {
                        status: status,
                        error: error,
                        reason: reason
                    };
                    options.error(res);
                    return options.complete(res);
                }
            });
        });
    };

    Sync.findAll = function (model, options) {
        console.log('Sync.findAll');
        var UserS;
        $.couch.userDb(function (db) {
            function current_user (doc) {
                options.success([doc]);
                return options.complete();
            }
            function all_users (data) {
                UserS = _.map(data.rows, function (doc) {
                    return doc.doc;
                });
                Sync.trigger('got:users', UserS);
                options.success(UserS);
                return options.complete();
            }
            var _opts = {
                include_docs: true,
                startkey: "org.couchdb.user:",
                success: all_users
            };
            if (options.key) {
                delete _opts.startkey;
                _opts.success = current_user;
                db.openDoc(options.key, _opts);
            } else {
                db.allDocs(_opts);
            }
        });
        return UserS;
    };

    Sync.sync = function (method, model, options) {
        var _ref, _ref1, _ref2;
        if ((_ref = options.success) == null) {
            options.success = function() {};
        }
        if ((_ref1 = options.error) == null) {
            options.error = function() {};
        }
        if ((_ref2 = options.complete) == null) {
            options.complete = function() {};
        }
        switch (method) {
            case 'create':
                return Sync.create(model, options);
            case 'update':
                return Sync.create(model, options);
            case 'delete':
                return Sync.destroy(model, options);
            case 'read':
                if (model.models) {
                    return Sync.findAll(model, options);
                } else {
                    return Sync.find(model, options);
                }
        }
    }
});
