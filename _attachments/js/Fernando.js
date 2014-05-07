Backbone.couch_connector.config.db_name = "tantan";
Backbone.couch_connector.config.ddoc_name = "japp";
Backbone.couch_connector.config.global_changes = false;

var TanTan = new Backbone.Marionette.Application();

TanTan.addRegions({
    nav: "#nav",
    main: "#main"
});

TanTan.on('initialize:after', function() {
    Backbone.history.start();
});
