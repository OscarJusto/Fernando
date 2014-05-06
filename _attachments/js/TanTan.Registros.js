/*global TodoMVC */
'use strict';

TanTan.module('Docs', function (Docs, App, Backbone, Marionette, $, _) {

    Docs.Alim = Backbone.Model.extend({
    });

    Docs.Cali = Backbone.Model.extend({
    });

    Docs.Biom = Backbone.Model.extend({
    });

});

TanTan.module('Vistas', function (Vistas, App, Backbone, Marionette, $, _) {

    Vistas.Alim = Marionette.ItemView.extend({
        template: "#template-registros-alim"
    });

    Vistas.InfoRelevante = Marionette.CompositeView.extend({
        template: "#template-registros-info",
        className: 'panel panel-info',
        itemView: Vistas.Alim,
        itemViewContainer: "#lista-registros",
        getDateKeys: function (date) {
            var t = date || new Date();
            var today = [t.getFullYear(), t.getMonth()+1, t.getDate()];
            var yesterday = [t.getFullYear(), t.getMonth()+1, t.getDate()-1];
            return {today: today, yesterday: yesterday};
        },
        getOperacionesFecha: function (options) {
            var operaciones = new App.Docs.OperacionesFecha();
            operaciones.fetch({
                keys: [today, yesterday],
                success: options.success
            });
        },
        getOperacionesTipo: function (options) {
            var operaciones = new App.Docs.OperacionesTipo();
            operaciones.fetch(options);
        },
        onRender: function () {
            var controller = this;
            var eid = this.model.id;
            var dates = this.getDateKeys(new Date());
            var today = dates.today;
            var yesterday = dates.yesterday;
        }
    });
});

TanTan.module('Registros', function (Registros, App, Backbone, Marionette, $, _) {

    Registros.Rutas = Marionette.AppRouter.extend({
        appRoutes: {
            "": "goRegistros"
        }
    });

    Registros.Control = Marionette.Controller.extend({
        showApp: function (options) {
            var controller = this;

            var opts = options || {};
            if (opts.success == null) {opts.success = function() {};}
            if (opts.error == null) {opts.error = controller.loggedOut;}
            if (opts.complete == null) {opts.complete = function() {};}

            function sessionWrap (resp) {
                console.log('sessionWrap');
                opts.success(resp, opts);
            }
            function sessionError (resp) {
                console.log('sessionError');
                opts.error();
            }
            $.couch.session({
                success: sessionWrap,
                error: sessionError
            });
        },
        goRegistros: function (eid) {
            var controller = this;
            console.log('goRegistros', eid);
            this.showApp({
                success: function (resp, options) {
                    console.log('mostrando registros');
                    var user = controller.getUser(resp);
                    console.log('goRegistros success', user, options);
                    if (user.get('name').length > 0) {
                        user.fetch({
                            success: function (model, resp, opts) {
                                if (!App.request('hasWamp')) {
                                    App.execute('connectWamp');
                                }
                                controller.showNavBar(model);
                                var info = new App.Vistas.InfoRelevante();
                                var info = new App.Vistas.Alim();
                                App.main.show(info);
                            },
                            error: function (resp) {
                                controller.loggedOut();
                            }
                        });
                    } else {
                        controller.loggedOutContent();
                    }
                    controller.showNavBar(user);
                }
            });
        },
        getUser: function (resp) {
            var controller = this;
            if (resp) {
                var username = resp.userCtx.name;
                if (username) {
                    var User = new App.Docs.UserDoc({ name: username });
                    if (resp.userCtx.roles.indexOf('_admin') > -1) {
                        User.is_admin = function () { return true; };
                    }
                    return User
                } else {
                    return new App.Docs.UserDoc();
                }
            }
        },
        loggedOut: function () {
            this.showNavBar();
            this.loggedOutContent();
        },
        loggedOutContent: function () {
            App.main.show(new App.Vistas.LoggedOutContent());
        },
        showNavBar: function (user) {
            var controller = this;
            if (!user) {
                user = new App.Docs.UserDoc();
            }
            var navbar = new App.Vistas.NavBar({model: user});
            this.listenTo(navbar, "do:login", function (args) {
                console.log('controller logging in');
                controller.doLogin(args);
            });
            this.listenTo(navbar, "do:logout", function (args) {
                console.log('controller logging out');
                controller.doLogout(args);
            });
            App.nav.show(navbar);
        },
        doLogin: function (args) {
            var controller = this;
            console.log('app:login args', args);
            var form = args.view.$el;
            var user = args.view.ui.user;
            var pwd = args.view.ui.pwd;

            function success_callback (resp) {
                if (!resp.name) {
                    resp.name = user.val();
                }
                console.log('login callback resp', resp);
                var usr = controller.getUser({userCtx: resp});
                console.log('login successful', usr);
                usr.fetch({
                    success: function (model, resp, opts) {
                        App.CurrentUser = model;
                        controller.goRegistros();
                    },
                    error: function (resp) {
                        App.CurrentUser = null;
                        controller.loggedOut();
                    }
                });
            }
            function error_callback (rstatus, error, reason) {
                console.log('login FAILED');
                form.trigger('reset');
                user.trigger('focus');
                App.CurrentUser = null;
                controller.loggedOut();
            }
            if (user.val() && pwd.val()) {
                $.couch.login({
                    name: user.val(),
                    password: pwd.val(),
                    success: success_callback,
                    error: error_callback
                });
            } else {
                error_callback();
            }
        },
        doLogout: function (args) {
            var controller = this;
            console.log('app:logout args', args);
            function success_callback (resp) {
                console.log('logout successful');
                App.CurrentUser = null;
                controller.loggedOut();
            };
            function error_callback (rstatus, error, reason) {
                console.log('logout FAILED');
                App.CurrentUser = null;
                controller.loggedOut();
            }
            $.couch.logout({
                success: success_callback,
                error: error_callback
            });
        }
    });

});
