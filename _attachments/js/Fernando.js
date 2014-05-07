Backbone.couch_connector.config.db_name = "fernando";
Backbone.couch_connector.config.ddoc_name = "fernando";
Backbone.couch_connector.config.global_changes = false;

var Fernando = new Backbone.Marionette.Application();

Fernando.addRegions({
    nav: "#nav",
    main: "#main"
});

Fernando.on('initialize:after', function() {
    Backbone.history.start();
});
