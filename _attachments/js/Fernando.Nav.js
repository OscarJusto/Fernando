/*global TodoMVC */
'use strict';

Fernando.module('Vistas', function (Vistas, Fernando, Backbone, Marionette, $, _) {

    Vistas.NavBar = Marionette.Layout.extend({
        template: '#template-navbar',
        className: 'container-fluid',
        model: Fernando.Docs.UserDoc,
        regions: {
            menu: '#nav-menu',
            actions: '#nav-actions'
        },
        userName: function () {
            if ((this.model) && (this.model.get('name')) && (this.model.get('name').length > 0)) {
                return this.model.get('name');
            }
        },
        modelEvents: {
            "change:name": "nameChanged",
            "error": "resetUser",
            "sync": "setUser"
        },
        resetUser: function () {
            this.model.reset();
            this.render();
        },
        setUser: function (model, resp, options) {
            //console.log('username synced', resp);
            this.model = model;
            this.render();
        },
        nameChanged: function (model, value, options) {
            //console.log('username changed', value);
            model.setIdFromName(value);
            model.fetch();
        },
        onRender: function () {
            //console.log('navbar model', this.model);
            if (this.userName()) {
                this.showLoggedIn(this.model);
            } else {
                this.showLoggedOut();
            }
        },
        showLoggedIn: function (user) {
            var usr = user || this.model;
            this.menu.show(new Vistas.NavMenu({model: usr}));
            var actions = new Vistas.LoggedIn({model: usr});
            this.listenTo(actions, "app:logout", function (args) {
                this.trigger('do:logout', args);
            });
            this.actions.show(actions);
        },
        showLoggedOut: function () {
            this.menu.close();
            var actions = new Vistas.LoggedOut();
            this.listenTo(actions, "app:login", function (args) {
                this.trigger('do:login', args);
            });
            this.actions.show(actions);
        }
    });

    Vistas.NavMenu = Marionette.ItemView.extend({
        tagName: "ul",
        className: "nav navbar-nav",
        getTemplate: function () {
            if (this.model.is_admin()) {
                return "#template-nav-menu-admin";
            } else {
                return "#template-nav-menu";
            }
        }
    });

    Vistas.LoggedIn = Marionette.ItemView.extend({
        tagName: "form",
        className: "navbar-form navbar-right",
        getTemplate: function () {
            if (this.model.is_admin()) {
                return "#template-nav-logged-in-admin";
            } else {
                return "#template-nav-logged-in";
            }
        },
        ui: {
            nuevagranja: ".boton-agregar",
            motores: ".boton-motores",
            sensores: ".boton-sensores",
            submit: "button[type=submit]"
        },
        events: {
            'click @ui.motores': function (e) {
                Fernando.execute('toggleMotors');
            },
            'click @ui.sensores': function (e) {
                Fernando.execute('getSensors', function (r) {
                    //console.log('getSensors', r);
                    Fernando.main.currentView.side.currentView.$el.text(JSON.stringify(r));
                });
            }
        },
        triggers: {
            "click @ui.nuevagranja": "create:granja",
            "click @ui.submit": "app:logout"
        }
    });

    Vistas.LoggedOut = Marionette.ItemView.extend({
        template: "#template-nav-logged-out",
        tagName: "form",
        className: "navbar-form navbar-right",
        ui: {
            user: "input[type=text]",
            pwd: "input[type=password]",
            submit: "button[type=submit]"
        },
        triggers: {
            "click @ui.submit": "app:login"
        }
    });

    Vistas.LoggedOutContent = Marionette.ItemView.extend({
        template: "#template-content-logged-out",
        className: "row"
    });

});
