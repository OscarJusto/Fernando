/*global TodoMVC */
'use strict';

Fernando.module('Docs', function (Docs, Fernando, Backbone, Marionette, $, _) {

    Docs.WSAN = Backbone.Model.extend({
        defaults: {
            "tipo": "ZigBee",
            "nombre": "Torres",
            "vivienda_id": "Justo",
            "pan_id": "E0E0",
            "baud": "9600",
            "monitoreo": {"control": ""} 
        }
    });

    Docs.Nodo = Backbone.Model.extend({
        defaults: {
            "tipo": "nodo",
            "nodo id": "",
            "wsan_id": "",
            "entradas": ['luz', 'temperatura', 'humedad'],
            "salidas": []
        }
    });

    Docs.Nodos = Backbone.Collection.extend({
        url: '/nodos',
        model: Docs.Nodo
    });

});

Fernando.module('Vistas', function (Vistas, Fernando, Backbone, Marionette, $, _) {

    Vistas.WSAN = Marionette.ItemView.extend({
        template: "#template-wsan",
        model: Fernando.Docs.WSAN,
        ui: {
            'hab1': '#hab1',
            'hab2': '#hab2',
            'hab3': '#hab3'
        },
        onRender: function () {
            var controlador = this;
            //console.log('WSAN!!!!!!!!!!!!!!!');
            function habitacionUno (topic, evento) {
                var titulo = controlador.ui.hab1.find('>.panel-heading');
                //console.log('Título HAB 1', titulo.text().trim(), evento.msg);
                if (evento.msg.indexOf('Estados:') == 0) {
                    console.log('h1:ESTADOS', evento.msg.substr(8));
                }
                if (evento.msg.indexOf('Temperatura:') == 0) {
                    console.log('h1:Temperatura', evento.msg.substr(12));
                }
                if (evento.msg.indexOf('Humedad:') == 0) {
                    console.log('h1:Humedad', evento.msg.substr(8));
                }
            }
            function habitacionDos (topic, evento) {
                var titulo = controlador.ui.hab2.find('>.panel-heading');
                console.log('Título HAB 2', titulo.text().trim(), evento.msg);
                if (evento.msg.indexOf('Estados:') == 0) {
                    console.log('h2:ESTADOS', evento.msg.substr(8));
                }
                if (evento.msg.indexOf('Temperatura:') == 0) {
                    var temp = evento.msg.substr(12);
                    var temp_valor = parseFloat(temp);
                    console.log('h2:Temperatura', temp_valor.toFixed(2), temp_valor+50);
                }
                if (evento.msg.indexOf('Humedad:') == 0) {
                    console.log('h2:Humedad', evento.msg.substr(8));
                }
             }
            function habitacionTres (topic, evento) {
                var titulo = controlador.ui.hab3.find('>.panel-heading');
                console.log('Título HAB 3', titulo.text().trim(), evento.msg);
            }
            if (!Fernando.request('hasWamp')) {
                this.listenTo(Fernando.vent, 'wamp:success', function () {
                    Fernando.execute('subscribeNode', '0013a20040ad6568', habitacionUno);
                    Fernando.execute('subscribeNode', '0013a20040b13749', habitacionDos);
                    Fernando.execute('subscribeNode', '0013a20040b136bc', habitacionTres);
                });
            } else {
                Fernando.execute('subscribeNode', '0013a20040ad6568', habitacionUno);
                Fernando.execute('subscribeNode', '0013a20040b13749', habitacionDos);
                Fernando.execute('subscribeNode', '0013a20040b136bc', habitacionTres);
            }
        },
        onClose: function () {
            Fernando.execute('unsubscribeNode', '0013a20040ad6568');
            Fernando.execute('unsubscribeNode', '0013a20040b13749');
            Fernando.execute('unsubscribeNode', '0013a20040b136bc');
        }
    });

    Vistas.Nodo = Marionette.ItemView.extend({
        templete: "#template-nodo",
        model: Fernando.Docs.nodo
    });

});

Fernando.module('Domotica', function (Domotica, Fernando, Backbone, Marionette, $, _) {

    Domotica.Rutas = Marionette.AppRouter.extend({
        appRoutes: {
            "": "irVivienda",
            "vivienda": "irVivienda",
            "exergia": "irExergia",
            "energia": "irEnergia",
            "wsan": "irWSAN"
        }
    });

    Domotica.Control = Marionette.Controller.extend({
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
        getUser: function (resp) {
            var controller = this;
            if (resp) {
                var username = resp.userCtx.name;
                if (username) {
                    var User = new Fernando.Docs.UserDoc({ name: username });
                    if (resp.userCtx.roles.indexOf('_admin') > -1) {
                        User.is_admin = function () { return true; };
                    }
                    return User
                } else {
                    return new Fernando.Docs.UserDoc();
                }
            }
        },
        loggedOut: function () {
            this.showNavBar();
            this.loggedOutContent();
        },
        loggedOutContent: function () {
            Fernando.main.show(new Fernando.Vistas.LoggedOutContent());
        },
        showNavBar: function (user) {
            var controller = this;
            if (!user) {
                user = new Fernando.Docs.UserDoc();
            }
            var navbar = new Fernando.Vistas.NavBar({model: user});
            this.listenTo(navbar, "do:login", function (args) {
                console.log('controller logging in');
                controller.doLogin(args);
            });
            this.listenTo(navbar, "do:logout", function (args) {
                console.log('controller logging out');
                controller.doLogout(args);
            });
            Fernando.nav.show(navbar);
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
                        Fernando.CurrentUser = model;
                        controller.irVivienda();
                    },
                    error: function (resp) {
                        Fernando.CurrentUser = null;
                        controller.loggedOut();
                    }
                });
            }
            function error_callback (rstatus, error, reason) {
                console.log('login FAILED');
                form.trigger('reset');
                user.trigger('focus');
                Fernando.CurrentUser = null;
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
                Fernando.CurrentUser = null;
                controller.loggedOut();
            };
            function error_callback (rstatus, error, reason) {
                console.log('logout FAILED');
                Fernando.CurrentUser = null;
                controller.loggedOut();
            }
            $.couch.logout({
                success: success_callback,
                error: error_callback
            });
        },
        irEnergia: function (eid) {
            var controller = this;
            this.showApp({
                success: function (resp, options) {
                    var user = controller.getUser(resp);
                    console.log('irEnergia', user, options);
                    if (user.get('name').length > 0) {
                        //// AQUI VA EL CODIGO
                        ////
                    } else {
                        controller.loggedOutContent();
                    }
                    controller.showNavBar(user);
                }
            });
        },
        irVivienda: function (eid) {
            var controller = this;
            this.showApp({
                success: function (resp, options) {
                    var user = controller.getUser(resp);
                    //console.log('irVivienda success', user, options);
                    if (user.get('name').length > 0) {
                        //// AQUI VA EL CODIGO
                        user.fetch({
                            success: function (model, resp, opts) {
                                if (!Fernando.request('hasWamp')) {
                                    Fernando.execute('connectWamp');
                                }
                                controller.showNavBar(model);
                                var casa = new Fernando.Docs.Vivienda({nombre: 'Vivienda Demo', descripcion: 'Tipo Casa Habitación'});
                                var ubicacion = casa.get('ubicacion', '');
                                ubicacion.ciudad = "Xalapa, Ver.";
                                ubicacion.calle = "San Lazaro";
                                ubicacion.numero = "11";
                                casa.set('ubicacion', ubicacion);
                                var hab1 = new Fernando.Docs.Habitacion();
                                hab1.set('nombre', 'Habitación 1');
                                var hab2 = new Fernando.Docs.Habitacion();
                                hab2.set('nombre', 'Habitación 2');
                                var hab3 = new Fernando.Docs.Habitacion();
                                hab3.set('nombre', 'Habitación 3');
                                hab3.set('categorias', ['Cocina', 'Comedor']);
                                var habitaciones = new Fernando.Docs.Habitaciones();
                                var casa_vista = new Fernando.Vistas.ViviendaLayout({model: casa, collection: habitaciones});
                                habitaciones.reset([hab1, hab2, hab3]);
                                Fernando.main.show(casa_vista);
                            },
                            error: function (resp) {
                                controller.loggedOut();
                            }
                        });
                        ////
                    } else {
                        controller.loggedOutContent();
                    }
                    controller.showNavBar(user);
                }
            });
        },
      irWSAN: function (eid) {
            var controller = this;
            this.showApp({
                success: function (resp, options) {
                    var user = controller.getUser(resp);
                    console.log('irWSAN success', user, options);
                    if (user.get('name').length > 0) {
                        //// AQUI VA EL CODIGO
                        user.fetch({
                            success: function (model, resp, opts) {
                                if (!Fernando.request('hasWamp')) {
                                    Fernando.execute('connectWamp');
                                }
                                controller.showNavBar(model);                                
                                var monitor = new Fernando.Docs.WSAN();
                                var monitor_vista = new Fernando.Vistas.WSAN({model: monitor});
                                //Fernando.main.show(casa_vista);
                                Fernando.main.show(monitor_vista);
                            },
                            error: function (resp) {
                                controller.loggedOut();
                            }
                        });
                        ////
                    } else {
                        controller.loggedOutContent();
                    }
                    controller.showNavBar(user);
                }
            });
        },
        irExergia: function (eid) {
            var controller = this;
            console.log('irExergia', eid);
            this.showApp({
                success: function (resp, options) {
                    var user = controller.getUser(resp);
                    console.log('irExergia success', user, options);
                    if (user.get('name').length > 0) {
                        user.fetch({
                            success: function (model, resp, opts) {
                                if (!Fernando.request('hasWamp')) {
                                    Fernando.execute('connectWamp');
                                }
                                controller.showNavBar(model);
                                var casa = new Fernando.Docs.Vivienda({nombre: 'Mi casa'});
                                var casa_vista = new Fernando.Vistas.ViviendaInfo({model: casa});
                                Fernando.main.show(casa_vista);
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
        }
    });

});
