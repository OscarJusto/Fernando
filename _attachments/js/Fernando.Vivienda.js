/*global TodoMVC */
'use strict';

Fernando.module('Docs', function (Docs, Fernando, Backbone, Marionette, $, _) {

    Docs.Vivienda = Backbone.Model.extend({
        defaults: {
            "tipo": "vivienda",
            "nombre": "Vivienda",
            "descripcion": "Casa habitación o departamento",
            "categorias": [],
            "ubicacion": {"ciudad": "", "calle": "", "numero": ""}
        }
    });

    Docs.Habitacion = Backbone.Model.extend({
        urlRoot: '/habitacion',
        defaults: {
            "tipo": "habitacion",
            "nombre": "Habitación",
            "vivienda_id": "Justo",
            "categorias": ["Sala"]
        }
    });

    Docs.Habitaciones = Backbone.Collection.extend({
        url: '/habitaciones',
        model: Docs.Habitacion
    });

});

Fernando.module('Vistas', function (Vistas, Fernando, Backbone, Marionette, $, _) {

    Vistas.ViviendaInfo = Marionette.ItemView.extend({
        template: "#template-vivienda-info",
        className: "panel panel-info",
        model: Fernando.Docs.Vivienda
    });

    Vistas.HabitacionInfo = Marionette.ItemView.extend({
        template: "#template-habitacion-info",
        className: "panel panel-primary",
        model: Fernando.Docs.Habitacion
    });

    Vistas.HabitacionGas = Vistas.HabitacionInfo.extend({
        template: "#template-habitacion-gas"
    });

    Vistas.Habitaciones = Marionette.CompositeView.extend({
        template: "#template-habitaciones",
        className: "panel-group",
        model: Fernando.Docs.Habitacion,
        itemViewContainer: "#lista-habitaciones",
        getItemView: function (item) {
            var cat = item.get('categorias');
            console.log('categorias', cat.indexOf('Cocina'));
            if (cat.indexOf('Cocina') >= 0) {
                return Vistas.HabitacionGas;
            } else {
                return Vistas.HabitacionInfo;
            }
        }
    });

    Vistas.ViviendaLayout = Marionette.Layout.extend({
        template: "#template-vivienda-layout",
        model: Fernando.Docs.Vivienda,
        regions: {
            "barra": "#barra",
            "contenido": "#contenido"
        },
        onRender: function () {
            var controlador = this;
            var info = new Fernando.Vistas.ViviendaInfo({
                model: this.model
            });
            var contenido = new Fernando.Vistas.Habitaciones({
                model: this.model,
                collection: this.collection
            });
            this.barra.show(info);
            this.contenido.show(contenido);
        }
    });

});
