/*global TodoMVC */
'use strict';

TanTan.module('Docs', function (Docs, App, Backbone, Marionette, $, _) {

    Docs.Vivienda = Backbone.Model.extend({
        defaults: {
            "tipo": "vivienda",
            "nombre": "Vivienda",
            "descripcion": "Casa habitación o departamento",
            "ubicacion": {"ciudad": "", "calle": "", "numero": ""}
        }
    });

    Docs.Habitacion = Backbone.Model.extend({
        defaults: {
            "tipo": "habitacion",
            "nombre": "Habitación",
            "vivienda_id": "Justo",
            "categoria": ["Sala"]
        }
    });

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

TanTan.module('Vistas', function (Vistas, App, Backbone, Marionette, $, _) {

    
    
    Vistas.Vivienda = Marionette.ItemView.extend({
        template: "#template-vivienda",
        model: App.Docs.Vivienda
    });

    Vistas.Habitacion = Marionette.ItemView.extend({
    template: "#template-habitacion",
        model: App.Docs.Habitacion
    });

    Vistas.WSAN = Marionette.ItemView.extend({
        template: "#template-wsan",
        model: App.Docs.WSAN,
        ui: {
            'hab1': '#hab1',
            'hab2': '#hab2',
            'hab3': '#hab3'
        },
        onRender: function () {
            var controlador = this;
            console.log('WSAN!!!!!!!!!!!!!!!');
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
            if (!App.request('hasWamp')) {
                this.listenTo(App.vent, 'wamp:success', function () {
                    App.execute('subscribeNode', '0013a20040ad6568', habitacionUno);
                    App.execute('subscribeNode', '0013a20040b13749', habitacionDos);
                    //App.execute('subscribeNode', '0013a20040b136bc', habitacionTres);
                });
            } else {
                App.execute('subscribeNode', '0013a20040ad6568', habitacionUno);
                //App.execute('subscribeNode', '0013a20040b13749', habitacionDos);
                //App.execute('subscribeNode', '0013a20040b136bc', habitacionTres);
            }
        },
        onClose: function () {
            App.execute('unsubscribeNode', '0013a20040ad6568');
            App.execute('unsubscribeNode', '0013a20040b13749');
            App.execute('unsubscribeNode', '0013a20040b136bc');
        }
    });

    Vistas.Nodo = Marionette.ItemView.extend({
        templete: "#template-nodo",
        model: App.Docs.nodo
    });

});

TanTan.module('Domotica', function (Domotica, App, Backbone, Marionette, $, _) {

    Domotica.Rutas = Marionette.AppRouter.extend({
        appRoutes: {
            "": "irDomotica",
            "domotica": "irDomotica",
            "vivienda": "irVivienda",
            "exergia": "irExergia",
            "demanda": "irDemanda",
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
                        controller.irDomotica();
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
        },       
        irDomotica: function (eid) {
            var controller = this;
            this.showApp({
                success: function (resp, options) {
                    var user = controller.getUser(resp);
                    console.log('irWSAN success', user, options);
                    if (user.get('name').length > 0) {
                         user.fetch({
                            success: function (model, resp, opts) {
                                if (!App.request('hasWamp')) {
                                    App.execute('connectWamp');
                                }
                                controller.showNavBar(model);
                                App.main.close();
                                //App.main.show(vista);
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
        irDemanda: function (eid) {
            var controller = this;
            this.showApp({
                success: function (resp, options) {
                    var user = controller.getUser(resp);
                    console.log('irWSAN success', user, options);
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
                    console.log('irVivienda success', user, options);
                    if (user.get('name').length > 0) {
                        //// AQUI VA EL CODIGO
                        user.fetch({
                            success: function (model, resp, opts) {
                                if (!App.request('hasWamp')) {
                                    App.execute('connectWamp');
                                }
                                controller.showNavBar(model);
                                var casa = new App.Docs.Vivienda({nombre: 'Vivienda', descripcion: 'Tipo Casa Habitación'});
                                var ubicacion = casa.get('ubicacion', '');
                                ubicacion.ciudad = "Xalapa, Ver.";
                                ubicacion.calle = "San Lazaro";
                                ubicacion.numero = "11";
                                casa.set('ubicacion', ubicacion);
                                var casa_vista = new App.Vistas.Vivienda({model: casa});
                                App.main.show(casa_vista);
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
                                if (!App.request('hasWamp')) {
                                    App.execute('connectWamp');
                                }
                                controller.showNavBar(model);                                
                                var monitor = new App.Docs.WSAN();
                                var monitor_vista = new App.Vistas.WSAN({model: monitor});
                                //App.main.show(casa_vista);
                                App.main.show(monitor_vista);
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
            console.log('irDomotica', eid);
            this.showApp({
                success: function (resp, options) {
                    var user = controller.getUser(resp);
                    console.log('irDomotica success', user, options);
                    if (user.get('name').length > 0) {
                        user.fetch({
                            success: function (model, resp, opts) {
                                if (!App.request('hasWamp')) {
                                    App.execute('connectWamp');
                                }
                                controller.showNavBar(model);
                                var casa = new App.Docs.Vivienda({nombre: 'Mi casa'});
                                var casa_vista = new App.Vistas.Vivienda({model: casa});
                                App.main.show(casa_vista);
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
