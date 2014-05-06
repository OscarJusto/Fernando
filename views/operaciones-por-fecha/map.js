function(doc) {
  if (doc.created_date) {
      if ((doc.tipo == "biometria") || (doc.tipo =="calidad") || (doc.tipo =="alimentacion")) {
        var key = [doc.estanque_id];
        doc.created_date.map(function(d) { key.push(d);});
        emit(key, doc);
      }
  }
};
