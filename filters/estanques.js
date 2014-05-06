function(doc, req){
  if (doc.tipo && doc.granja_id && doc.tipo == "estanque") {// does the collection match?
      if (req.query && req.query.gid) {// does the collection match?
          if (doc.granja_id == req.query.gid) {
              return true;
          } else {
              return false;
          }
      }
      return true;
//  else if (req.query && req.query.gid && doc._deleted) // has the document been deleted?
//    return true;
  } else {// do nothing
    return false;
  }
}

