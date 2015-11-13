module.exports = {
  mysqlCredentials: {
    host: '',
    user:'',
    password: '',
    database: ''
  },
  couchbase: {
    connpath:'',
    users: {
      bucketName: 'users',
      viewGroup: 'users',
      viewName: 'users'
    },
    pocketPractice: {
      bucketName: 'pocket-practice',
      viewGroup: 'reporting',
      viewName: 'allList'
    }
  }
};