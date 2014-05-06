function(doc) {
  if (doc.tipo == "granja") {
      emit([doc._id, 0], doc);
  };
  if (doc.tipo == "estanque") {
      emit([doc.granja_id, 1], doc);
  }
};
