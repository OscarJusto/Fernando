/*global TodoMVC */
'use strict';

Fernando.module('Docs', function (Docs, Fernando, Backbone, Marionette, $, _) {

    Docs.UserDoc = Backbone.Model.extend({
        urlRoot: '/user',
        defaults: {
            name: '',
            roles: [],
            Fernando: {
                nombre: '',
                descripcion: ''
            },
            type: 'user'
        },
        initialize: function (options) {
            this.setIdFromName(this.get('name'));
        },
        setIdFromName: function (name) {
            if (_.isString(name) && (name.length > 0)) {
                this.set(this.idAttribute, 'org.couchdb.user:' + name);
            }
        },
        is_admin: function () {
            return false;
        },
        sync: Fernando.Sync.sync
    });

    Docs.UserDocs= Backbone.Collection.extend({
        url: "/usuarios",
        model: Docs.UserDoc,
        sync: Fernando.Sync.sync
    });

});
