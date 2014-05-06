/*global TodoMVC */
'use strict';
TanTan.module('Docs', function (Docs, App, Backbone, Marionette, $, _) {

    Docs.NodoAcuatico = Backbone.Model.extend({
        urlRoot: "/nodoacuatico",
        defaults: {
            tipo: "nodo_acuatico",
            node_id: "",
            sensores: [0, 0, 0],
            peso: [0, 0, 0]
        }
    });

    Docs.Sensor = Backbone.Model.extend({
        urlRoot: "/sensor",
        defaults: {
            tipo: "sensor",
            node_id: "",
            unit: ""
        },
        type: null,
        unit: ""
    });

    Docs.SensorPH = Docs.Sensor.extend({
        type: "pH",
        unit: ""
    });

    Docs.SensorOD = Docs.Sensor.extend({
        type: "OD",
        unit: "%"
    });

    Docs.SensorTemperatura = Docs.Sensor.extend({
        type: "Temperatura",
        unit: "°C"
    });

    Docs.Sensores = Backbone.Collection.extend({
        url: "/sensores",
        db: {
            view: "sensores"
        }
    });

});

TanTan.module('Vistas', function (Vistas, App, Backbone, Marionette, $, _) {

    Vistas.NodoPotencia= Marionette.ItemView.extend({
        template: "#template-nodo-acuatico"
    });

    Vistas.NodoMotores= Marionette.ItemView.extend({
        template: "#template-nodo-motores",
        className: "panel panel-info",
        onClose: function () {
            if ((this.model.get('node_id')) && (this.model.get('node_id').length > 0)) {
                App.execute('unsubscribeNode', this.model.get('node_id'));
            }
        },
        onRender: function () {
            var controller = this;
            if (!App.request('hasWamp')) {
                App.execute('connectWamp');
            }
            var nodo = this.model.get('node_id');
            var v_s = new TimeSeries();
            var i_s = new TimeSeries();
            var p_s = new TimeSeries();
            function onNode (topic, event) {
                var msg = event.msg;
                console.log('motores msg', msg);
                if (msg.indexOf('POT:v:') == 0) {
                    var sel = '.nodo-volt';
                    var val_txt = msg.substr(12);
                    var ft = parseFloat(val_txt);
                    controller.$(sel).text(ft.toFixed(1)+"");
                    v_s.append(new Date().getTime(), ft);
                }
                if (msg.indexOf('POT:i:') == 0) {
                    var sel = '.nodo-amps';
                    var val_txt = msg.substr(11);
                    var ft = parseFloat(val_txt);
                    controller.$(sel).text(ft.toFixed(2)+"");
                    i_s.append(new Date().getTime(), ft);
                }
                if (msg.indexOf('POT:w:') == 0) {
                    var sel = '.nodo-kw';
                    var val_txt = msg.substr(17);
                    var ft = parseFloat(val_txt);
                    controller.$(sel).text(ft.toFixed(1)+"");
                    p_s.append(new Date().getTime(), ft);
                }
            }
            var vsel = '.canvas-volt';
            var isel = '.canvas-amps';
            var psel = '.canvas-kw';
            controller.$(vsel).attr('height', 81);
            controller.$(vsel).attr('width', 250);
            controller.$(isel).attr('height', 81);
            controller.$(isel).attr('width', 250);
            controller.$(psel).attr('height', 81);
            controller.$(psel).attr('width', 250);
            //controller.$(csel, phsel, odsel).height(141);
            var plot_volt = controller.$(vsel)[0];
            var plot_amps = controller.$(isel)[0];
            var plot_kw = controller.$(psel)[0];
            var chart_volt = new SmoothieChart({
                minValue:25,
                maxValue:26,
                millisPerPixel: 100,
                interpolation: 'linear',
                grid: {
                    borderVisible:false
                }
            });
            var chart_amps = new SmoothieChart({
                minValue:0.0,
                maxValue:25.0,
                millisPerPixel: 100,
                interpolation: 'linear',
                grid: {
                    borderVisible:false
                }
            });
            var chart_kw = new SmoothieChart({
                millisPerPixel: 100,
                interpolation: 'linear',
                grid: {
                    borderVisible:false
                }
            });
            chart_volt.addTimeSeries(v_s, {
                strokeStyle: 'rgba(255, 255, 255, 1)',
                fillStyle: 'rgba(0, 255, 0, 0.2)',
                lineWidth: 2
            });
            chart_amps.addTimeSeries(i_s, {
                strokeStyle: 'rgba(255, 255, 255, 1)',
                fillStyle: 'rgba(0, 255, 0, 0.2)',
                lineWidth: 2
            });
            chart_kw.addTimeSeries(p_s, {
                strokeStyle: 'rgba(255, 255, 255, 1)',
                fillStyle: 'rgba(0, 255, 0, 0.2)',
                lineWidth: 2
            });
            chart_volt.streamTo(plot_volt, 2000);
            chart_amps.streamTo(plot_amps, 2000);
            chart_kw.streamTo(plot_kw, 2000);
            App.execute('subscribeNode', nodo, onNode);
        }
    });

});

TanTan.module('Nodos', function (Nodos, App, Backbone, Marionette, $, _) {

    Nodos.Rutas = Marionette.AppRouter.extend({
        appRoutes: {
            "sensores(/eid)": "goSensores"
        }
    });

   Nodos.Control = App.Control.Granjas.extend({
        goSensores: function (gid) {
            var controller = this;
            var layout = new App.Vistas.GranjaMain();
            App.main.show(layout);

            this.showApp({
                success: function (resp) {
                    console.log('getting sensores');
                    var granjas = new App.Docs.GranjaDocs();
                    granjas.fetch({
                        success: function (gs, r, o) {
                            console.log('granjas fetched', JSON.stringify(gs.toJSON()));
                            var granjas_list = new App.Vistas.GranjaList({collection: granjas});
                            granjas_list.on('itemview:render', function (view) {
                                view.$el.attr('href', '#sensores/'+view.model.id);
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
                                    //var lnkname = link.text().trim();
                                    //$("#lista-usuarios .list-group-item").removeClass('hide');
                                    //if (!link.hasClass('active')) {
                                    //    console.log('link about was DEactivated', lnkname);
                                    //} else {
                                    //    console.log('link about was Activated', lnkname);
                                    //    var lnkdusers = $("#lista-usuarios .list-group-item").filter(function (idx, el) {
                                    //        var thisel = $(el);
                                    //        var thislnk =  $(thisel.find(".nav-pills .active"));
                                    //        console.log('thisel has thislnk', thislnk.text().trim());
                                    //        return thislnk.text().trim() != lnkname;
                                    //    });
                                    //    console.log('linked users', $(lnkdusers));
                                    //    $(lnkdusers).addClass('hide');
                                    //}
                                });
                            });
                            App.main.currentView.side.show(granjas_list);
                        }
                    });
                }
            });
        }
    });
});
