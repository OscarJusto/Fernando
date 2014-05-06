$(function () {
    TanTan.addInitializer(function () {

        TanTan.CurrentUser = null;

        var control = new TanTan.Control.Granjas();
        var rutas = new TanTan.Control.Rutas({controller: control});

        var s_control = new TanTan.Nodos.Control();
        var s_rutas = new TanTan.Nodos.Rutas({controller: s_control});

        var u_control = new TanTan.Usuarios.Control();
        var u_rutas = new TanTan.Usuarios.Rutas({controller: u_control});

        var api = TanTan.AutoBahn;
        var wsprot = "wss://";
        //var wsprot = "ws://";
        //var wsuri = wsprot + window.location.hostname + ":8080/ws_couch";
        //var wsuri = "ws://" + window.location.hostname + ":9000/";
        var wsuri = "ws://ejeacuicola.mx:9000/";
        //var wsuri = wsprot + "192.168.2.106" + ":8080/ws_couch";
        //var wsuri = wsprot + window.location.hostname + ":9000/";
        api.wsuri = wsuri;

        TanTan.vent.on('wamp:success', function (sess) {
            sess.prefix("zb", "http://www.tantan.org/api/sensores#");
            sess.prefix("rpc", "http://www.tantan.org/api/sensores/control#");
        });

        TanTan.commands.setHandler("connectWamp", function() {
            api.connect();
        });

        TanTan.commands.setHandler("disconnectWamp", function() {
            api.disconnect();
        });

        TanTan.commands.setHandler("subscribeNode", function(nid, cb) {
            if (nid) {
                console.log('connecting WAMP with NID', nid);

               api.subscribe("zb:"+nid, cb);
            } else {
                console.log('could not subscribe to WAMP', nid);
            }
        });
        
        TanTan.commands.setHandler("unsubscribeNode", function(nid) {
            if (nid) {
                console.log('unsubscribing with NID', nid);
                api.unsubscribe("zb:"+nid);
            } else {
                console.log('could not unsubscribe from WAMP', nid);
            }
        });
        
        TanTan.reqres.setHandler("hasWamp", function() {
            return api.hasSession();
        });

        TanTan.reqres.setHandler("isAdmin", function() {
            return control.getCurrentUser().is_admin();
        });

        TanTan.commands.setHandler("getSensors", function(cb) {
            if (cb) {
                return api.get_nodes(cb);
            } else {
                return api.get_nodes();
            }
        });

        TanTan.commands.setHandler("toggleMotors", function() {
            api.toggle_motors();
        });

    });
    TanTan.start();
});
