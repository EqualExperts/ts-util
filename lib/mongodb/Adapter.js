"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCollection = (db) => (collectionName) => db.collection(collectionName);
exports.buildGetCollectionMongoAdapter = (collection) => () => collection.find().toArray();
//# sourceMappingURL=Adapter.js.map