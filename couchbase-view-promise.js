"use strict";
var couchbase = require('couchbase');
var cluster = null;
var bucket = null;
var ViewQuery = couchbase.ViewQuery;

/**
 * creates class
 * @param {string} path - connection path
 */
function setCluster(path) {
  cluster = new couchbase.Cluster(path);
  bucket = null;
}

/**
 * sets current class' bucket and open it
 * @param {string} bucketName
 */
function setBucket(bucketName) {
  bucket = cluster.openBucket(bucketName);
}

/**
 * performs query, returns Promise
 * @param {string} viewGroup
 * @param {string} viewName
 * @param {number=} limit
 * @param {number=} skip
 * @returns {Promise}
 */
function getView(viewGroup, viewName, limit, skip) {
  return new Promise(function (resolve, reject) {
    var query = ViewQuery.from(viewGroup, viewName);
    if (limit) query = query.limit(limit);
    if (skip)  query = query.skip(skip);

    bucket.query(query, function (err, results) {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

module.exports = {setCluster, setBucket, getView};