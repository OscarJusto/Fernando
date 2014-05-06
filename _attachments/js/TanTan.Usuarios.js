/*global TodoMVC */
'use strict';


TanTan.module('Usuarios', function (Usuarios, App, Backbone, Marionette, $, _) {

    Usuarios.UserItemView = Marionette.CompositeView.extend({
        template: "#template-admin-user-item",
        tagName: "a",
        className: "list-group-item",
        itemView: App.Vistas.GranjaPill,
        itemViewContainer: ".nav-pills",
        initialize: function () {
            this.$el.val('href', '#');
        },
        onRender: function () {
            console.log('rendering', this.model.get('tantan').nombre);
            this.ui.nombre.val(this.model.get('tantan').nombre);
            var gid = this.model.get('granja_id');
            if ((gid) && (this.collection.get(gid))) {
                var v = this.children.findByModel(this.collection.get(gid));
                console.log('pertenece a granja', v);
                v.$el.addClass('active');
            }
        },
        ui: {
            "submit": "button[type=submit]",
            "nombre": ".tantan-nombre"
        },
        triggers: {
            "click @ui.submit": "save:user"
        }
    });

    Usuarios.UsersManageView = Marionette.CompositeView.extend({
        template: '#template-admin-users',
        className: 'panel-group',
        itemView: Usuarios.UserItemView,
        itemViewContainer: "#lista-usuarios",
        ui: {
            "listagranjas": "#lista-granjas",
            "listausuarios": "#lista-usuarios"
        }
    });

    Usuarios.Rutas = Marionette.AppRouter.extend({
        appRoutes: {
            "usuarios(/:gid)": "goUsers"
        }
    });

    Usuarios.Control = App.Control.Granjas.extend({
        goUsers: function (gid) {
            var controller = this;
            var opts = {};
            this.showApp({
                success: function (user) {
                    console.log('goUsers showMain', gid, user);
                    //var granjas = new Granjas.GranjaCol();
                    var granjas = new App.Docs.GranjaDocs();
                    granjas.fetch({
                        success: function (gs, r, o) {
                            console.log('granjas fetched', JSON.stringify(gs.toJSON()));
                            var granjas_list = new App.Vistas.GranjaList({collection: granjas});
                            granjas_list.on('itemview:render', function (view) {
                                view.$el.attr('href', '#usuarios/'+view.model.id);
                                if ((gid) && (gid == view.model.id)) {
                                    view.$el.addClass('active');
                                }
                                console.log('granja link view rendered', view);
                                view.on('link:click', function (args) {
                                    var  link = args.view.$el;
                                    console.log('link clicked args', args);
                                    console.log('link clicked', args.view.model.get('_id'), args.view.model.get('name'), !link.hasClass('active'));
                                    var gid = args.view.model.get('_id');
                                    link.siblings().removeClass('active');
                                    link.toggleClass('active');
                                    var lnkname = link.text().trim();
                                    $("#lista-usuarios .list-group-item").removeClass('hide');
                                    if (!link.hasClass('active')) {
                                        console.log('link about was DEactivated', lnkname);
                                    } else {
                                        console.log('link about was Activated', lnkname);
                                        var lnkdusers = $("#lista-usuarios .list-group-item").filter(function (idx, el) {
                                            var thisel = $(el);
                                            var thislnk =  $(thisel.find(".nav-pills .active"));
                                            console.log('thisel has thislnk', thislnk.text().trim());
                                            return thislnk.text().trim() != lnkname;
                                        });
                                        console.log('linked users', $(lnkdusers));
                                        $(lnkdusers).addClass('hide');
                                    }
                                });
                            });
                            App.main.currentView.side.show(granjas_list);

                            var userdocs = new App.Docs.UserDocs();
                            userdocs.fetch();
                            var usersview = new Usuarios.UsersManageView({collection: userdocs});
                            usersview.on('itemview:before:render', function (view) {
                                view.collection = granjas;

                            });
                            usersview.on('itemview:render', function (view) {
                                console.log('user view rendered', view);
                                if ((gid) && (gid != view.model.get('granja_id'))) {
                                    view.$el.addClass('hide');
                                }
                                view.on('itemview:pill:click', function (v) {
                                    var pill = v.$('a');
                                    console.log('pill clicked', v.model.get('_id'), view.model.get('name'), !pill.parent().hasClass('active'));
                                    var gid = v.model.get('_id');
                                    if (pill.parent().hasClass('active')) {
                                        view.model.unset('granja_id');
                                    } else {
                                        view.model.set('granja_id', gid);
                                    }
                                    pill.parent().siblings().removeClass('active');
                                    pill.parent().toggleClass('active');
                                });
                                view.on('save:user', function (args) {
                                    console.log('saving user', args);
                                    var uform = args.view.$('form');
                                    var data = uform.serializeJSON();
                                    //var attach = args.view.$(':file');
                                    //console.log('field,value', attach[0].name, attach[0].value);
                                    //data[attach[0].name] = attach[0].value;
                                    console.log('serialized form', uform.serializeJSON());
                                    console.log('serialized data', JSON.stringify(data));
                                    var model = args.model;
                                    model.set(data);
                                    model.save();
                                    console.log('saved model', model.toJSON());

                                    usersview.collection.fetch();
                                    usersview.render();
                                    granjas_list.render();
                                });
                            });
                            App.main.currentView.content.show(usersview);

                        }
                    });

                    console.log('goUsers has USER');
                }
            });
        }
    });

});
