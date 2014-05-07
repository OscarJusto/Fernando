$(function () {
    Fernando.addInitializer(function () {

        var r_control = new Fernando.Domotica.Control();
        var r_rutas = new Fernando.Domotica.Rutas({controller: r_control});

        var api = Fernando.AutoBahn;
        var wsprot = "wss://";
        var wsuri = "ws://ejeacuicola.mx:9000/";
        api.wsuri = wsuri;

        Fernando.vent.on('wamp:success', function (sess) {
            sess.prefix("zb", "http://www.tantan.org/api/sensores#");
            sess.prefix("rpc", "http://www.tantan.org/api/sensores/control#");
        });

        Fernando.commands.setHandler("connectWamp", function() {
            api.connect();
        });

        Fernando.commands.setHandler("disconnectWamp", function() {
            api.disconnect();
        });

        Fernando.commands.setHandler("subscribeNode", function(nid, cb) {
            if (nid) {
                console.log('connecting WAMP with NID', nid);

               api.subscribe("zb:"+nid, cb);
            } else {
                console.log('could not subscribe to WAMP', nid);
            }
        });
        
        Fernando.commands.setHandler("unsubscribeNode", function(nid) {
            if (nid) {
                console.log('unsubscribing with NID', nid);
                api.unsubscribe("zb:"+nid);
            } else {
                console.log('could not unsubscribe from WAMP', nid);
            }
        });
        
        Fernando.reqres.setHandler("hasWamp", function() {
            return api.hasSession();
        });

        Fernando.reqres.setHandler("isAdmin", function() {
            return control.getCurrentUser().is_admin();
        });


    });
    Fernando.start();
});
