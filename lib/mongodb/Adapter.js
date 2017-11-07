"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCollectionFactory = (db) => (collectionName) => db.collection(collectionName);
exports.buildGetCollectionMongoAdapter = (collection) => () => collection.find().toArray();
//# sourceMappingURL=adapter.js.map