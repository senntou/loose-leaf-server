"use strict";

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db
    .createTable("notes", {
      id: { type: "string", primaryKey: true, length: 255 },
      title: 'string',
      comment: "string",
    })
    .then(
      function (result) {
        db.createTable("users", {
          id: { type: "string", primaryKey: true, length: 255 },
          introduction: { type: "string" },
          salt: { type: "blob" },
          hashedPassword: { type: "blob"},
        });
      },
      function (err) {
        return;
      },
    );
};

exports.down = function (db) {
  return db.dropTable("notes").then(
    function (result) {
      db.dropTable("users");
    },
    function (err) {
      return;
    },
  );
};

exports._meta = {
  version: 1,
};
