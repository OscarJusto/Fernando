/*global TodoMVC */
'use strict';

TanTan.module('Control', function (Control, App, Backbone, Marionette, $, _) {

    Control.Rutas = Marionette.AppRouter.extend({
        appRoutes: {
            "": "goGranjas",
            "granjas(/:eid)": "goGranjas"
        }
    });

    Control.Granjas = Marionette.Controller.extend({
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
        goGranjas: function (eid) {
            var controller = this;
            console.log('goGranjas', eid);
            this.showApp({
                success: function (resp, options) {
                    var user = controller.getUser(resp);
                    console.log('goGranjas success', user, options);
                    if (user.get('name').length > 0) {
                        user.fetch({
                            success: function (model, resp, opts) {
                                if (!App.request('hasWamp')) {
                                    App.execute('connectWamp');
                                }
                                controller.showNavBar(model);
                                if (model.get('granja_id')) {
                                    var granja = new App.Docs.GranjaDoc({_id: model.get('granja_id')});
                                    granja.fetch({
                                        success: function (model) {
                                            console.log('got granja', model);
                                            controller.showGranja(model, eid);
                                        }
                                    });
                                }
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
        getCurrentUser: function () {
            return App.nav.currentView.model;
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
        showGranja: function (model, eid) {
            var controller = this;
            var estanques = new App.Docs.EstanqueDocs();
            estanques.fetch({ key: [model.id,1] });
            var layout = new App.Vistas.GranjaMain({model: model, collection: estanques});
            App.main.show(layout);

            function showEstanque (model) {
                console.log('opening estanque', model);
                var eview = new App.Vistas.EstanqueView({model: model});
                controller.listenTo(eview, 'borrar:estanque', function (args) {
                    console.log('borrando estanque');
                    args.model.destroy();
                    layout.content.close();
                });
                controller.listenTo(eview, 'editar:estanque', function (args) {
                    var editview = new App.Vistas.EstanqueEdit({model: model});
                    controller.listenTo(editview, 'cerrar:editar', function () {
                       showEstanque(editview.model);
                    });
                    controller.listenTo(editview, 'save:form', function (args) {
                        var data = args.view.ui.form.serializeJSON();
                        if (args.model.id) {
                            data.modified_at = new Date().toISOString();
                        } else {
                            data.created_at = data.modified_at = new Date().toISOString();
                        }
                        args.model.set(data);
                        console.log('saving estanque model', JSON.stringify(args.model.toJSON()));
                        args.model.save({
                            success: function (m, r, o) {
                                console.log('estanque guardado', m.toJSON());
                                controller.showGranja(editview.model);
                            }
                        });
                        args.view.$el.modal('hide');
                    });
                    layout.content.show(editview);
                });
                layout.content.show(eview);
            }

            var side = new App.Vistas.GranjaContent({model: model, collection: estanques});
            side.on('itemview:render', function (v) {
                if (v.model.id == eid) {
                    v.$el.addClass('active');
                    console.log('estn link', v.ui.link);
                    showEstanque(v.model);
                }
                v.on('pill:click', function (args) {
                    var  link = args.view.$el;
                    console.log('pill clicked args', args);
                    link.siblings().removeClass('active');
                    if (link.hasClass('active')) {
                        layout.content.close();
                    } else {
                        showEstanque(args.model);
                    }
                    link.toggleClass('active');
                });
            });
            controller.listenTo(side, 'nuevo:estanque', function (args) {
                var granja = args.model;
                var estanx = args.view.collection;
                var nuevo = new App.Docs.EstanqueDoc({granja_id: args.model.id});
                console.log('nuevo estanque de granja', args.model.get('nombre'), nuevo.toJSON());
                var editview = new App.Vistas.EstanqueEdit({model: nuevo});
                controller.listenTo(editview, 'cerrar:editar', function () {
                    console.log('cerrando sin guardar');
                    side.render();
                });
                controller.listenTo(editview, 'save:form', function (args) {
                    var data = args.view.ui.form.serializeJSON();
                    if (args.model.get(args.model.idAttribute)) {
                        data.modified_at = new Date().toISOString();
                    } else {
                        data.created_at = data.modified_at = new Date().toISOString();
                    }
                    args.model.set(data);

                    console.log('saving estanque model', JSON.stringify(args.model.toJSON()));

                    estanx.create(args.model.toJSON(), {wait: true});
                    args.view.$el.modal('hide');
                });
                layout.content.show(editview);
            });
            controller.listenTo(side, 'editar:granja', function (args) {
                console.log('editando granja', args.model.toJSON());
                var editview = new App.Vistas.GranjaEdit({model: args.model});
                controller.listenTo(editview, 'cerrar:editar', function () {
                    controller.showGranja(editview.model);
                });
                controller.listenTo(editview, 'save:form', function (args) {
                    console.log('guardando datos de granja', args);
                    var data = args.view.ui.form.serializeJSON();
                    if (args.model.id) {
                        data.modified_at = new Date().toISOString();
                    } else {
                        data.created_at = data.modified_at = new Date().toISOString();
                    }
                    args.model.set(data);
                    console.log('saving granja model', JSON.stringify(args.model.toJSON()));
                    args.model.save({
                        success: function (m, r, o) {
                            console.log('granja guardada', m.toJSON());
                            controller.showGranja(editview.model);
                        }
                    });
                    args.view.$el.modal('hide');
                });
                layout.content.show(editview);
            });
            layout.side.show(side);
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
                        controller.goGranjas();
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
