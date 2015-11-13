"use strict";

var mysqlLib = require('mysql-promise');
var co = require('co');
var config = require('./config.js');

var mysql = mysqlLib();

mysql.configure(config.mysqlCredentials);

var connpath = config.couchbase.connpath;
var couchbase = require('./couchbase-view-promise.js');
co(function* () {
  try {
    var bucketName = config.couchbase.users.bucketName;
    var viewGroup = config.couchbase.users.viewGroup;
    var viewName = config.couchbase.users.viewName;

    couchbase.setCluster(connpath);
    couchbase.setBucket(bucketName);

    var time1 = Date.now();

    var users = yield couchbase.getView(viewGroup, viewName);
    yield processUsers(users);

    var time2 = Date.now();

    console.log('users fetched and updated in', (time2 - time1)/1000, 'seconds');
    process.exit();

    /*
    bucketName = config.couchbase.pocketPractice.bucketName;
    viewGroup = config.couchbase.pocketPractice.viewGroup;
    viewName = config.couchbase.pocketPractice.viewName;
    */

  } catch (err) {
    console.error(err);
  }
});

function* processUsers(users) {
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    var login_email_address = user.key;
    var fields = user.value;
    var userId = fields.userId;

    var result = yield mysql.query(
      `INSERT INTO users (createdAt, password, userId, login_email_address)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE createdAt = ?, password = ?, login_email_address = ?`,
      [fields.createdAt, fields.password, fields.userId, login_email_address,
        fields.createdAt, fields.password, login_email_address]
    );
  }
}
