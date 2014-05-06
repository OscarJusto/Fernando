/*global TodoMVC */
'use strict';

TanTan.module('Vistas', function (Vistas, App, Backbone, Marionette, $, _) {
    function getDateKeys (date) {
        var t = date || new Date();
        var today = [t.getFullYear(), t.getMonth()+1, t.getDate()];
        var yesterday = [t.getFullYear(), t.getMonth()+1, t.getDate()-1];
        return {today: today, yesterday: yesterday};
    }

    var dates = getDateKeys(new Date());

    Vistas.EstanqueView = Marionette.Layout.extend({
        template: "#template-estanque-view",
        className: "panel-group",
        model: App.Docs.EstanqueDoc,
        regions: {
            sensores: "#nav-sensores",
            motores: "#nav-motores",
            registros: "#nav-registros",
            registroform: "#nav-registro-form"
        },
        ui: {
            "borrar": ".boton-borrar",
            "editar": ".boton-editar",
            alimentaciontab: "#nav-alimentacion-tab",
            calidadtab: "#nav-calidad-tab",
            biometriatab: "#nav-biometria-tab",
        },
        triggers: {
            "click @ui.borrar": "borrar:estanque",
            "click @ui.editar": "editar:estanque",
            "click @ui.alimentaciontab": "tab:alim",
            "click @ui.calidadtab": "tab:cali",
            "click @ui.biometriatab": "tab:biom"
        },
        initialize: function (args) {
            this.on('tab:alim', function (args) {
                console.log('tab:alim args', args);
                var li = this.ui.alimentaciontab.parent();
                li.siblings().removeClass('active');
                li.addClass('active');
                args.view.showAlimentacion();
            });
            this.on('tab:cali', function (args) {
                console.log('tab:cali args', args);
                var li = this.ui.calidadtab.parent();
                li.siblings().removeClass('active');
                li.addClass('active');
                args.view.showCalidad();
            });
            this.on('tab:biom', function (args) {
                console.log('tab:biom args', args);
                var li = this.ui.biometriatab.parent();
                li.siblings().removeClass('active');
                li.addClass('active');
                args.view.showBiometria();
            });
        },
        templateHelpers: {
            hasPowerNodes: function () {
                return (this.motores.length > 0);
            },
            hasNodes: function () {
                return (this.nodos.length > 0);
            },
            hasInfo: function () {
                return ((this.forma.length > 0) || (this.dimensiones.length > 0) || (this.volumen.length > 0) || (this.material.length > 0));
            },
            isAdmin: function () {
                return App.request('isAdmin');
            }
        },
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
        getUltimasBiometrias: function (options) {
            console.log("getting ultbiom", options);
            var operaciones = new App.Docs.UltimaBiometria();
            operaciones.fetch(options);
        },
        showOperacion: function (oper_name, oper_region, doc) {
            var controller = this;
            var dates = getDateKeys(new Date());
            var controller = this;
            var view;
            switch (oper_name) {
                case 'alimentacion':
                    view = new Vistas.AlimentacionForm({model: doc});
                    break;
                case 'calidad':
                    view = new Vistas.CalidadForm({model: doc});
                    break;
                case 'biometria':
                    view = new Vistas.BiometriaForm({model: doc});
                    break;
            }
            view.on('save:form', function (args) {
                console.log('save form ARGS', args);
                var data = args.view.ui.form.serializeJSON();
                var thisform = args.view.ui.form.css('background-color', '#bababa');
                if (args.model.id) {
                    data.modified_at = new Date().toISOString();
                } else {
                    data.created_at = new Date().toISOString();
                    data.created_date = dates.today;
                }
                args.model.set(data);
                console.log('saving '+oper_name+' model', JSON.stringify(args.model.toJSON()));
                args.model.save({
                    complete: function (m, r, o) {
                        controller.showOperacion(oper_name, oper_region, m);
                        thisform.css('background-color', 'inherit');
                    }
                });
            });
            console.log('showing', oper_name, JSON.stringify(doc.toJSON()));
            oper_region.show(view);
        },
        onClose: function () {
            if ((this.model.get('nodos')) && (this.model.get('nodos').length > 0)) {
                _.each(this.model.get('nodos'), function (nodo) {
                    App.execute('unsubscribeNode', nodo);
                });
            }
            if ((this.model.get('motores')) && (this.model.get('motores').length > 0)) {
                _.each(this.model.get('motores'), function (nodo) {
                    App.execute('unsubscribeNode', nodo);
                });
            }
        },
        renderMotors: function () {
            var controller = this;

            var v_s = new TimeSeries();
            var i_s = new TimeSeries();
            var p_s = new TimeSeries();

            function onNode (topic, event) {
                var msg = event.msg;
                if (msg.indexOf('POT:v:') == 0) {
                    var sel = '.nodo-volt';
                    var val_txt = msg.substr(6);
                    var ft = parseFloat(val_txt);
                    controller.$(sel).text(ft.toFixed(1)+"");
                    v_s.append(new Date().getTime(), ft);
                }
                if (msg.indexOf('POT:i:') == 0) {
                    var sel = '.nodo-amps';
                    var val_txt = msg.substr(6);
                    var ft = parseFloat(val_txt);
                    controller.$(sel).text(ft.toFixed(2)+"");
                    i_s.append(new Date().getTime(), ft);
                }
                if (msg.indexOf('POT:w:') == 0) {
                    var sel = '.nodo-kw';
                    var val_txt = msg.substr(6);
                    var ft = parseFloat(val_txt);
                    controller.$(sel).text(ft.toFixed(1)+"");
                    p_s.append(new Date().getTime(), ft);
                }
            }
            if ((this.model.get('motores')) && (this.model.get('motores').length > 0)) {
                _.each(this.model.get('motores'), function (nodo) {
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
                        minValue:0,
                        maxValue:150,
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
                        minValue:0.0,
                        maxValue:25.0,
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
                });
            }
        },
        renderSensors: function () {
            var controller = this;

            var temp_s = new TimeSeries();
            var ph_s = new TimeSeries();
            var od_s = new TimeSeries();
            function onNode (topic, event) {
                var msg = event.msg;
                if (msg.indexOf('2:temp:') == 0) {
                    var sel = '#'+event.node_id+' .nodo-temp';
                    var val_txt = msg.substr(7);
                    var ft = parseFloat(val_txt);
                    controller.$(sel).text(ft.toFixed(1)+"");
                    temp_s.append(new Date().getTime(), ft);
                }
                if (msg.indexOf('OD:') == 0) {
                    var sel = '#'+event.node_id+' .nodo-od';
                    var val_txt = msg.substr(3);
                    var ft = parseFloat(val_txt);
                    controller.$(sel).text(ft.toFixed(2)+"");
                    od_s.append(new Date().getTime(), ft);
                }
                if (msg.indexOf('pH:') == 0) {
                    var sel = '#'+event.node_id+' .nodo-ph';
                    var val_txt = msg.substr(3);
                    var ft = parseFloat(val_txt);
                    controller.$(sel).text(ft.toFixed(1)+"");
                    ph_s.append(new Date().getTime(), ft);
                }
            }
            if ((this.model.get('nodos')) && (this.model.get('nodos').length > 0)) {
                _.each(this.model.get('nodos'), function (nodo) {
                    var csel = '#'+nodo+' .canvas-temp';
                    var phsel = '#'+nodo+' .canvas-ph';
                    var odsel = '#'+nodo+' .canvas-od';
                    controller.$(csel).attr('height', 81);
                    controller.$(csel).attr('width', 250);
                    controller.$(phsel).attr('height', 81);
                    controller.$(phsel).attr('width', 250);
                    controller.$(odsel).attr('height', 81);
                    controller.$(odsel).attr('width', 250);
                    //controller.$(csel, phsel, odsel).height(141);
                    var plot_temp = controller.$(csel)[0];
                    var plot_ph = controller.$(phsel)[0];
                    var plot_od = controller.$(odsel)[0];
                    var nodo_min = 0;
                    var nodo_max = 0; 
                    var chart_temp = new SmoothieChart({
                        maxValueScale:1.003,
                        millisPerPixel: 100,
                        interpolation: 'linear',
                        grid: {
                            borderVisible:false
                        }
                    });
                    var chart_ph = new SmoothieChart({
                        minValue:0.0,
                        maxValue:15.0,
                        maxValueScale:1.03,
                        millisPerPixel: 100,
                        interpolation: 'linear',
                        grid: {
                            borderVisible:false
                        }
                    });
                    var chart_od = new SmoothieChart({
                        minValue:0.0,
                        maxValue:15.0,
                        millisPerPixel: 100,
                        interpolation: 'linear',
                        grid: {
                            borderVisible:false
                        }
                    });
                    chart_temp.addTimeSeries(temp_s, {
                        strokeStyle: 'rgba(255, 255, 255, 1)',
                        fillStyle: 'rgba(0, 255, 0, 0.2)',
                        lineWidth: 2
                    });
                    chart_ph.addTimeSeries(ph_s, {
                        strokeStyle: 'rgba(255, 255, 255, 1)',
                        fillStyle: 'rgba(0, 255, 0, 0.2)',
                        lineWidth: 2
                    });
                    chart_od.addTimeSeries(od_s, {
                        strokeStyle: 'rgba(255, 255, 255, 1)',
                        fillStyle: 'rgba(0, 255, 0, 0.2)',
                        lineWidth: 2
                    });
                    chart_temp.streamTo(plot_temp, 2000);
                    chart_ph.streamTo(plot_ph, 2000);
                    chart_od.streamTo(plot_od, 2000);
                    App.execute('subscribeNode', nodo, onNode);
                });
            }
        },
        showRegistros: function (models) {
            var controller = this;
            var rCol = new Backbone.Collection(models);
            console.log('showRegistros', rCol.toJSON());
            var rView = new Vistas.RegistrosView({collection: rCol});
            controller.registros.show(rView);
        },
        onRender: function () {
            var controller = this;
            controller.renderSensors();
            controller.renderMotors();
            this.ui.alimentaciontab.trigger('click');
        },
        showAlimentacion: function () {
            var controller = this;
            var eid = this.model.id;
            //Alimentacion
            var dates = getDateKeys(new Date());
            var today = dates.today;
            var yesterday = dates.yesterday;
            var tkey = _.clone(dates.today);
            var ykey = _.clone(dates.yesterday);
            var talimkey = [eid, "alimentacion", tkey[0], tkey[1], tkey[2]];
            var tcalikey = [eid, "calidad", tkey[0], tkey[1], tkey[2]];
            var yalimkey = [eid, "alimentacion", ykey[0], ykey[1], ykey[2]];

            var ycalikey = [eid, "calidad", ykey[0], ykey[1], ykey[2]];
            controller.getOperacionesTipo({
                keys: [talimkey, tcalikey, yalimkey],
                success: function (col,r,o) {
                    console.log('alim docs');
                    var hoyalim = col.filter(function (oper) {
                        var hoy = _.isEqual(oper.get('created_date'), dates.today);
                        var alim = _.isEqual(oper.get('tipo'), 'alimentacion');
                        return hoy && alim;
                    });
                    var hoycali = col.filter(function (oper) {
                        var hoy = _.isEqual(oper.get('created_date'), dates.today);
                        var cali = _.isEqual(oper.get('tipo'), 'calidad');
                        return hoy && cali;
                    });
                    var ayealim = col.filter(function (oper) {
                        var aye = _.isEqual(oper.get('created_date'), dates.yesterday);
                        var alim = _.isEqual(oper.get('tipo'), 'alimentacion');
                        return aye && alim;
                    });
                    //console.log('hoyalim', hoyalim);
                    //console.log('ayealim', ayealim);
                    //console.log('hoycali', hoycali);
                    var registros = [];
                    //if (!_.isEmpty(hoyalim)) {
                    //    registros.push(hoyalim.pop());
                    //}
                    if (!_.isEmpty(ayealim)) {
                        registros.push(ayealim.pop());
                    }
                    if (!_.isEmpty(hoycali)) {
                        registros.push(hoycali.pop());
                    }
                    controller.showRegistros(registros);
                    var doc = new App.Docs.AlimentacionDoc();
                    doc.set('estanque_id', eid);
                    if (hoyalim.length > 0) {
                        doc.set('_id', hoyalim[0].id);
                        doc.set('estanque_id', eid);
                        doc.fetch({
                            success: function (m,r,o) {
                                console.log('alim doc FETCHED', m);
                                controller.showOperacion('alimentacion', controller.registroform, m);
                            }
                        });
                    }
                    controller.showOperacion('alimentacion', controller.registroform, doc);
                }
            });
        },
        showCalidad: function () {
            var controller = this;
            var eid = this.model.id;
            //Calidad
            var dates = getDateKeys(new Date());
            var today = dates.today;
            var yesterday = dates.yesterday;
            var tkey = _.clone(dates.today);
            var ykey = _.clone(dates.yesterday);
            var talimkey = [eid, "alimentacion", tkey[0], tkey[1], tkey[2]];
            var tcalikey = [eid, "calidad", tkey[0], tkey[1], tkey[2]];
            var ycalikey = [eid, "calidad", ykey[0], ykey[1], ykey[2]];
            controller.getOperacionesTipo({
                keys: [talimkey, tcalikey, ycalikey],
                success: function (col,r,o) {
                    //console.log('calidad docs', JSON.stringify(col.toJSON()));
                    console.log('calidad docs');
                    var hoyalim = col.filter(function (oper) {
                        var hoy = _.isEqual(oper.get('created_date'), dates.today);
                        var alim = _.isEqual(oper.get('tipo'), 'alimentacion');
                        return hoy && alim;
                    });
                    var hoycali = col.filter(function (oper) {
                        var hoy = _.isEqual(oper.get('created_date'), dates.today);
                        var cali = _.isEqual(oper.get('tipo'), 'calidad');
                        return hoy && cali;
                    });
                    var ayecali = col.filter(function (oper) {
                        var ayer = _.isEqual(oper.get('created_date'), dates.yesterday);
                        var cali = _.isEqual(oper.get('tipo'), 'calidad');
                        return ayer && cali;
                    });
                    var registros = [];
                    if (!_.isEmpty(hoyalim)) {
                        registros.push(hoyalim.pop());
                    }
                    if (!_.isEmpty(ayecali)) {
                        registros.push(ayecali.pop());
                    }
                    //if (!_.isEmpty(hoycali)) {
                    //    registros.push(hoycali.pop());
                    //}
                    controller.showRegistros(registros);
                    var doc = new App.Docs.CalidadDoc();
                    doc.set('estanque_id', eid);
                    if (hoycali.length > 0) {
                        doc.set('_id', hoycali[0].id);
                        doc.fetch({
                            success: function (m,r,o) {
                                console.log('calidad hoy doc', JSON.stringify(m.toJSON()));
                                controller.showOperacion('calidad', controller.registroform, m);
                            }
                        });
                    } else {
                        controller.showOperacion('calidad', controller.registroform, doc);
                    }
                }
            });
        },
        showBiometria: function () {
            var controller = this;
            var eid = this.model.id;
            //Biometria
            var dates = getDateKeys(new Date());
            var today = dates.today;
            var yesterday = dates.yesterday;
            var tkey = _.clone(dates.today);
            var ykey = _.clone(dates.yesterday);
            var ubiomskey = [eid, "biometria0", ykey[0], ykey[1]];
            var ubiomekey = [eid, "biometria"];
            controller.getUltimasBiometrias({
                startkey: ubiomskey,
                endkey: ubiomekey,
                descending: true,
                limit: 2,
                success: function (col,r,o) {
                    //console.log('ubiomkey', ubiomskey);
                    //console.log('biometria docs', JSON.stringify(col.toJSON()));
                    console.log('biometria docs');
                    var prebiom = col.filter(function (oper) {
                        var hoy = _.isEqual(oper.get('created_date'), dates.today);
                        var biom = _.isEqual(oper.get('tipo'), 'biometria');
                        return !hoy && biom;
                    });
                    var registros = [];
                    if (!_.isEmpty(prebiom)) {
                        registros.push(prebiom.pop());
                    }
                    controller.showRegistros(registros);
                    var hoybiom = col.filter(function (oper) {
                        var hoy = _.isEqual(oper.get('created_date'), dates.today);
                        var biom = _.isEqual(oper.get('tipo'), 'biometria');
                        return hoy && biom;
                    });
                    if (hoybiom) {
                        console.log('hoybiom', hoybiom); //JSON.stringify(hoybiom.toJSON()));
                    }
                    var doc = new App.Docs.BiometriaDoc();
                    doc.set('estanque_id', eid);
                    if (hoybiom.length > 0) {
                        doc.set('_id', hoybiom[0].id);
                        doc.fetch({
                            success: function (m,r,o) {
                                controller.showOperacion('biometria', controller.registroform, m);
                            }
                        });
                    } else {
                        controller.showOperacion('biometria', controller.registroform, doc);
                    }
                }
            });
        }
    });

    Vistas.EstanqueEditForm = Marionette.ItemView.extend({
        template: "#template-estx-edit",
        tagName: "form",
        className: "form-horizontal col-md-12",
        //model: Granjas.GranjaDoc,
        ui: {
            "save": "button[type=submit]",
            "reset": "button[type=reset]"
        },
        triggers: {
            "click @ui.save": "save:form",
            "click @ui.reset": "reset:form"
        }
    });

    Vistas.RegistrosView = Marionette.CollectionView.extend({
        emptyView: Vistas.RegistroVacio,
        getItemView: function (item) {
            var tipo = item.get('tipo');
            console.log('REGISTROS', item, tipo);
            var date = item.get('created_date');
            switch (tipo) {
                case 'alimentacion':
                    return Vistas.AlimentacionView;
                    break;
                case 'calidad':
                    return Vistas.CalidadView;
                    break;
                case 'biometria':
                    return Vistas.BiometriaView;
                    break;
            }
        }
    });

    Vistas.RegistroVacio = Marionette.ItemView.extend({
        template: "#template-registro-vacio",
        className: "col-sm-12"
    });

    Vistas.AlimentacionView = Marionette.ItemView.extend({
        template: "#template-registro-alimentacion",
        className: "col-sm-6",
        isToday: function (datekey) {
            return _.isEqual(datekey, getDateKeys().today);
        },
        isYesterday: function (datekey) {
            return _.isEqual(datekey, getDateKeys().yesterday);
        },
        dateText: function () {
            var model_date = model.get('created_date', getDateKeys().today);
            if (this.isToday(model_date)) {
                return 'Hoy: ';
            } else if (this.isYesterday(model_date)) {
                return 'Ayer: ';
            } else {
                return model_date.reverse().join('/');
            }
        },
        templateHelpers: {
            getDateNumberString: function () {
                var model_date = this.created_date || getDateKeys().today;
                return model_date.reverse().join('/');
            },
            getDateString: function () {
                var model_date = this.created_date || getDateKeys().today;
                if (_.isEqual(model_date, getDateKeys().today)) {
                    return 'Hoy: ';
                } else if (_.isEqual(model_date, getDateKeys().yesterday)) {
                    return 'Ayer: ';
                } else {
                    return '';
                }
            }
        }
    });

    Vistas.CalidadView = Vistas.AlimentacionView.extend({
        template: "#template-registro-calidad",
        className: "col-sm-6"
    });

    Vistas.BiometriaView = Vistas.AlimentacionView.extend({
        template: "#template-registro-biometria",
        className: "col-sm-12"
    });

    Vistas.AlimentacionForm = Marionette.Layout.extend({
        template: "#template-registro-alimentacion-form",
        className: "panel-group",
        regions: {
            accion: "#alim-accion"
        },
        initialize: function () {
            var mod;
            if (!_.isUndefined(this.model)) {
                mod = this.model;
            }
        },
        ui: {
            "form": "form",
            "save": "button[type=submit]"
        },
        triggers: {
            "click @ui.save": "save:form"
        }
    });

    Vistas.CalidadForm = Vistas.AlimentacionForm.extend({
        template: "#template-registro-calidad-form",
        initialize: function () {
            var mod;
            if (!_.isUndefined(this.model)) {
                mod = this.model;
            }
        },
        ui: {
            form: "form",
            save: "button[type=submit]"
        },
        triggers: {
            "click @ui.save": "save:form"
        }
    });

    Vistas.BiometriaForm = Vistas.AlimentacionForm.extend({
        template: "#template-registro-biometria-form",
        ui: {
            form: "form",
            save: "button[type=submit]",
            mas: ".boton-mas",
            menos: ".boton-menos",
            tanto1: "input[name=tanto-0]",
            tanto2: "input[name=tanto-1]",
            tanto3: "input[name=tanto-2]"
        },
        triggers: {
            "click @ui.save": "save:form"
        },
        events: {
            "click @ui.mas": function (e) {
                e.preventDefault();
                var thisel = $(e.currentTarget);
                var thisinput = thisel.parent().siblings('.input-group').find('input');
                var thistanto = thisel.parent().siblings('.talla-tanto').find('input');
                var tanto = thistanto.attr('name');
                var sel = 'input[name='+tanto+']:checked';
                var cantidad = parseInt(thisinput.val());
                var tanto = parseInt(this.$(sel).val());
                console.log('clicking TANTO', tanto);
                console.log('changing CANTIDAD', cantidad);
                cantidad += tanto;
                console.log('nueva CANTIDAD', cantidad);
                thisinput.val(cantidad);
            },
            "click @ui.menos": function (e) {
                e.preventDefault();
                var thisel = $(e.currentTarget);
                var thisinput = thisel.parent().siblings('.input-group').find('input');
                var thistanto = thisel.parent().siblings('.talla-tanto').find('input');
                var tanto;
                var cantidad;
                var sel = 'input[name='+thistanto.attr('name')+']:checked';
                cantidad = thisinput.val();
                tanto = this.$(sel).val();
                //cantidad = parseInt(thisinput.val());
                //tanto = parseInt(this.$(sel).val());
                console.log('clicking TANTO', tanto);
                console.log('changing CANTIDAD', cantidad);
                cantidad -= tanto;
                if (cantidad < 0) {
                    cantidad = 0;
                }
                console.log('nueva CANTIDAD', cantidad);
                thisinput.val(cantidad);
            }
        },
    });

    Vistas.EstanqueEdit = Marionette.ItemView.extend({
        template: "#template-estanque-editar",
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
