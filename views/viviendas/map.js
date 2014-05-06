function(doc) {
  if (doc.tipo == "vivienda") {
      emit(doc._id, doc);
  }
};
