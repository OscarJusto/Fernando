/*global TodoMVC */
'use strict';

TanTan.module('Docs', function (Docs, App, Backbone, Marionette, $, _) {

    Docs.GranjaDoc = Backbone.Model.extend({
        urlRoot: "/granjas",
        defaults: {
            tipo: 'granja',
            nombre: '',
            razonsocial: '',
            contacto: '',
            direccion: '',
            localidad: '',
            municipio: '',
            estado: '',
            pan_id: []
        }
    });

    Docs.GranjaDocs = Backbone.Collection.extend({
        url: "/granjas",
        db: {
            view: "granjas"
        },
        model: Docs.GranjaDoc
    });

    Docs.EstanqueDoc = Backbone.Model.extend({
        urlRoot: "/estanques",
        defaults: {
            tipo: "estanque",
            nombre: '',
            material: '',
            forma: '',
            dimensiones: '',
            volumen: '',
            motores: [],
            nodos: []
        }

    });

    Docs.EstanqueDocs = Backbone.Collection.extend({
        url: "/estanques",
        db: {
            view: "estanques"
        },
        model: Docs.EstanqueDoc
    });

});

TanTan.module('Vistas', function (Vistas, App, Backbone, Marionette, $, _) {

    Vistas.GranjaPill = Marionette.ItemView.extend({
        template: "#template-granja-pill",
        tagName: 'li',
        ui: {
            'link': '>a'
        },
        triggers: {
            'click >a': 'pill:click'
        }
    });

    Vistas.GranjaListItem = Marionette.ItemView.extend({
        template: "#template-granja-list-item",
        tagName: 'a',
        className: 'list-group-item',
        triggers: {
            'click': 'link:click'
        }
    });

    Vistas.GranjaList = Marionette.CompositeView.extend({
        template: "#template-granja-list",
        className: 'panel panel-info',
        itemView: Vistas.GranjaListItem,
        itemViewContainer: "#lista-granjas"
    });

    Vistas.GranjaContent = Marionette.CompositeView.extend({
        template: "#template-granja-content",
        className: 'panel-group',
        itemView: Vistas.GranjaPill,
        itemViewContainer: "#listado-estanques",
        ui: {
            "borrar": ".boton-borrar",
            "editar": ".boton-editar",
            "nuevo": ".boton-nuevo"
        },
        triggers: {
            "click @ui.borrar": "borrar:granja",
            "click @ui.editar": "editar:granja",
            "click @ui.nuevo": "nuevo:estanque"
        },
        templateHelpers: {
            isAdmin: function () {
                return App.request('isAdmin');
            }
        },
        collectionEvents: {
            change: function (m, r, o) {
                console.log('estanx collection CHANGED', m, r, o);
                this.render();
            }
        }
    });

    Vistas.GranjaMain = Marionette.Layout.extend({
        template: "#template-granja-main",
        className: 'row',
        regions: {
            side: "#side",
            content: "#content"
        }
    });

    Vistas.GranjaEdit = Marionette.ItemView.extend({
        template: "#template-granja-editar",
        className: "modal fade",
        attributes: {
            id: 'modal-form',
            tabindex: '-1',
            role: 'dialog',
            'aria-labelledby': 'modal-formLabel',
            'aria-hidden': 'true'
        },
        ui: {
            "save": "button[type=submit]",
            "form": "form"
        },
        triggers: {
            "click @ui.save": "save:form"
        },
        onRender: function () {
            var view = this;
            this.$el.modal('show');
            this.$el.on('hidden.bs.modal', function (e) {
                view.trigger('cerrar:editar');
            });
        }
    });

});
