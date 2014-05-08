/*global TodoMVC */
'use strict';

Fernando.module('Docs', function (Docs, Fernando, Backbone, Marionette, $, _) {

    Docs.LineaElectrica = Backbone.Model.extend({
        defaults: {
            "tipo": "linea_electrica",
            "nombre": "Linea electrica",
            "descripcion": "Línea eléctrica de una vivienda",
            "categorias": ['120V', 'monofásica']
        }
    });

    Docs.LineasElectricas= Backbone.Collection.extend({
        url: '/lineas_electricas',
        model: Docs.LineaElectrica
    });

});

Fernando.module('Vistas', function (Vistas, Fernando, Backbone, Marionette, $, _) {

    Vistas.LineaElectricaInfo = Marionette.ItemView.extend({
        template: "#template-monitoreo-info",
        className: "panel panel-info",
        model: Fernando.Docs.LineaElectrica
    });

    Vistas.LineasElectricas = Marionette.CompositeView.extend({
        template: "#template-monitoreo-lineas",
        className: "panel panel-primary",
        model: Fernando.Docs.Habitacion,
        itemViewContainer: "#lista-lineas",
        getItemView: function (item) {
            return Vistas.LineaElectricaInfo;
        }
    });

    Vistas.MonitoreoGrafica = Marionette.ItemView.extend({
        template: "#template-monitoreo-grafica",
        className: "panel panel-primary",
        attributes: {
            id: 'panel-grafica'
        },
        ui: {
            canvas: '> .panel-body #grafica'
        },
        onRender: function () {
            var graph = new Rickshaw.Graph( {
                element: this.ui.canvas[0], //document.querySelector("#grafica"), 
                renderer: 'bar',
                series: [{
                    data: [ { x: 0, y: 40 }, { x: 1, y: 49 }, { x: 2, y: 38 }, { x: 3, y: 30 } ],
                    color: 'steelblue'
                }, {
                    data: [ { x: 0, y: 20 }, { x: 1, y: 24 }, { x: 2, y: 19 }, { x: 3, y: 15 } ],
                    color: 'lightblue'
                }]
            });

            graph.render();
        }
    });

    Vistas.MonitoreoLayout = Marionette.Layout.extend({
        template: "#template-vivienda-layout",
        model: Fernando.Docs.Vivienda,
        regions: {
            "barra": "#barra",
            "contenido": "#contenido"
        },
        onRender: function () {
            var controlador = this;
            //var info = new Fernando.Vistas.ViviendaInfo({
            //    model: this.model
            //});
            var info = new Fernando.Vistas.LineasElectricas({
                model: this.model,
                collection: this.collection
            });
            var contenido = new Fernando.Vistas.MonitoreoGrafica({
                model: this.model,
                collection: this.collection
            });
            this.barra.show(info);
            this.contenido.show(contenido);
        }
    });

});
