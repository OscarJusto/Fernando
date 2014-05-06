/*global TodoMVC */
'use strict';

TanTan.module('Docs', function (Docs, App, Backbone, Marionette, $, _) {

    Docs.AlimentacionDoc = Backbone.Model.extend({
        urlRoot: "/alimentacion",
        defaults: {
            tipo: "alimentacion",
            racion: [{
                alimento: 0, proteina: 0
            },{
                alimento: 0, proteina: 0
            },{
                alimento: 0, proteina: 0
            }],
            created_at: new Date(),
            created_date: [
                    new Date().getFullYear(),
                    new Date().getMonth()+1,
                    new Date().getDate()
            ]
        }
    });

    Docs.CalidadDoc = Backbone.Model.extend({
        urlRoot: "/calidad",
        defaults: {
            tipo: "calidad",
            pH: [0.0, 0.0, 0.0],
            od: [0.0, 0.0, 0.0],
            temperatura: [0.0, 0.0, 0.0],
            amonio: 0.0,
            tss: 0.0,
            recambio: 0,
            mortandad: 0,
            observaciones: "",
            created_at: new Date(),
            created_date: [
                    new Date().getFullYear(),
                    new Date().getMonth()+1,
                    new Date().getDate()
            ]
        }
    });

    Docs.BiometriaDoc = Backbone.Model.extend({
        urlRoot: "/biometria",
        defaults: {
            tipo: "biometria",
            cantidad: [0, 0, 0],
            peso: [0, 0, 0],
            created_at: new Date(),
            created_date: [
                    new Date().getFullYear(),
                    new Date().getMonth()+1,
                    new Date().getDate()
            ]

        }
    });

    Docs.OperacionesTipo = Backbone.Collection.extend({
        url: "/operaciones",
        db: {
            view: "operaciones-por-tipo",
            keys: ["keys"]
        }
    });

    Docs.OperacionesFecha = Docs.OperacionesTipo.extend({
        db: {
            view: "operaciones-por-fecha",
            keys: ["keys"]
        }
    });

    Docs.UltimaBiometria = Backbone.Collection.extend({
        url: "/operaciones",
        db: {
            view: "operaciones-por-tipo"
        }
    });
});
