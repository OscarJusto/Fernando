$(function () {
    TanTan.addInitializer(function () {

        var r_control = new TanTan.Domotica.Control();
        var r_rutas = new TanTan.Domotica.Rutas({controller: r_control});

        var api = TanTan.AutoBahn;
        var wsprot = "wss://";
        var wsuri = "ws://ejeacuicola.mx:9000/";
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


    });
    TanTan.start();
});
