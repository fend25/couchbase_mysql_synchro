"use strict";

var config = require('./config.js');

var mysql = require('mysql');
//var mysql = mysqlLib();

var co = require('co');
var fs = require('mz/fs');
var JSZip = require('jszip');

//mysql.configure(config.mysqlCredentials);

var connpath = config.couchbase.connpath;
var couchbase = require('./couchbase-view-promise.js');
var sqlFilename = config.outputSqlFilename;

co(function* () {
  try {
    yield fs.writeFile(sqlFilename,
      `SET NAMES 'utf8';
USE ${config.mysqlCredentials.database};


-- users:

`);

    var bucketName = config.couchbase.users.bucketName;
    var viewGroup = config.couchbase.users.viewGroup;
    var viewName = config.couchbase.users.viewName;

    couchbase.setCluster(connpath);
    couchbase.setBucket(bucketName);
    console.log(`started\ngetting users...`);

    var users = {length: 0};
    //var users = yield couchbase.getView(viewGroup, viewName);
    //yield processUsers(users);
    console.log(`users: fetched and successfully updated ${users.length} documents\n`);



    bucketName = config.couchbase.pocketPractice.bucketName;
    viewGroup = config.couchbase.pocketPractice.viewGroup;
    viewName = config.couchbase.pocketPractice.viewName;

    couchbase.setBucket(bucketName);
    console.log(`getting pocket-practice...`);
    var time1 = Date.now();
    var results = yield couchbase.getView(viewGroup, viewName, 100);
    var time2 = Date.now();
    console.log(`pocket-practice: fetched ${results.length} documents in ${(time2 - time1) / 1000} seconds`);

    yield processPocketPracticeResults(results);

    var time3 = Date.now();
    console.log(`pocket-practice: fetched and successfully updated ${results.length} documents,
    timings: couchbase: ${(time2 - time1) / 1000} s, mysql: ${(time3 - time2) / 1000} s, total: ${(time3 - time1) / 1000} s`);



    var zip = new JSZip();
    var sql = yield fs.readFile(sqlFilename);
    zip.file(`data_${getDateFormatted()}.sql`, sql);
    var content = zip.generate({type:"nodebuffer"});

    yield fs.writeFile(`./data_${getDateFormatted()}.zip`, content, 'binary');
  } catch (err) {
    console.error(err, err.stack);
  } finally {
    process.exit();
  }
});

function getDateFormatted() {
  var d = new Date();
  var s = '';
  s += d.getFullYear()-2000;
  var m = d.getMonth() + 1;
  s += (m < 10) ? '0' + m : m;
  var sec = d.getDate();
  s += (sec < 10) ? '0' + sec : sec;
  var h = d.getHours();
  s += (h < 10) ? '0' + h : h;
  return s;
}

function* prepareAndWriteToFile(sql, inserts) {
  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processUsers(users) {
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    var login_email_address = user.key;
    var fields = user.value;
    var userId = fields.userId;

    var sql = `INSERT INTO users (\`createdAt\`, \`password\`, \`userId\`, \`login_email_address\`)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE \`createdAt\` = ?, \`password\` = ?, \`login_email_address\` = ?`;
    var inserts = [
      fields.createdAt, fields.password, fields.userId, login_email_address,
      fields.createdAt, fields.password, login_email_address
    ];
    var result = mysql.format(sql, inserts);
    yield fs.appendFile(sqlFilename, result + ';\n');
  }
}

function* processPocketPracticeResults(results) {
  yield fs.appendFile(sqlFilename, '\n\n\n-- pocket-practice:\n\n');
  for (let i = 0; i < results.length; i++) {
    //try-catch is on every cycle step for better error handling
    // (one error can't break the loop and prevent all next iterations)

    //if (i%1000 === 0) console.log(new Date().toJSON(), i);

    try {
      var result = results[i];

      var doc = result.value;
      var docType = doc.documentType;

      if (typeof doc.dob === 'string')
        doc.dob = new Date(doc.dob);
      if (typeof doc.expiry === 'string') {
        if (doc.expiry !== '') doc.expiry = new Date(doc.expiry);
        else doc.expiry = null;
      }
      if (typeof doc.last_appointment_date === 'string')
        doc.last_appointment_date = new Date(doc.last_appointment_date);

      switch (docType) {
        case 'Filler':
          yield processFiller(result);
          break;
        case 'FillerBrand':
          yield processFillerBrand(result);
          break;
        case 'Neurotoxin':
          yield processNeurotoxin(result);
          break;
        case 'Patient':
          console.log(result);
          yield processPatient(result);
          break;
        case 'PatientChecklist':
          yield processPatientChecklist(result);
          break;
        case 'PatientFillerHistory':
          yield processPatientFillerHistory(result);
          break;
        case 'PatientHistory':
          yield processPatientHistory(result);
          break;
        case 'PatientNeurotoxinHistory':
          yield processPatientNeurotoxinHistory(result);
          break;
        case 'Treatment':
          if (typeof doc.neurotoxinsExpiry === 'string') {
            if (doc.neurotoxinsExpiry === '') doc.neurotoxinsExpiry = null;
            else doc.neurotoxinsExpiry = new Date(doc.neurotoxinsExpiry);
          }
          yield processTreatment(result);
          break;
        case 'TreatmentFiller':
          yield processTreatmentFiller(result);
          break;
        case 'TreatmentFillerProduct':
          yield processTreatmentFillerProduct(result);
          break;
        case 'TreatmentNeurotoxin':
          yield processTreatmentNeurotoxin(result);
          break;
        case 'TreatmentProduct':
          yield processTreatmentProduct(result);
          break;
        case 'TreatmentVolume':
          yield processTreatmentVolume(result);
          break;
        default:
          console.log('pocket-practice, document with unfamiliar documentType:', docType);
          break;
      }
    } catch (err) {
      console.error(docType + '\t', err);
    }
  }
}

function* processFiller(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"filler": ["list", "brand_id", "channels", "display", "documentType", "enabled", "expiry", "lot_nr", "name"],
  var sql =
    `INSERT INTO filler ( \`list\`, brand_id, channels, display, documentType,
                          enabled, expiry, lot_nr, \`name\`, couchbaseKey )
     VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, brand_id = ?, channels = ?, display = ?, documentType = ?,
     enabled = ?, expiry = ?, lot_nr = ?, \`name\` = ?`;
  var inserts = [
    fields.list, fields.brand_id, fields.channels, fields.display, fields.documentType,
    fields.enabled, fields.expiry, fields.lot_nr, fields.name, key,

    fields.list, fields.brand_id, fields.channels, fields.display, fields.documentType,
    fields.enabled, fields.expiry, fields.lot_nr, fields.name
  ];
  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');

}

function* processFillerBrand(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"fillerbrand": ["list", "channels", "documentType", "name"],
  var sql =
    `INSERT INTO fillerbrand (\`list\`, channels, documentType, \`name\`, couchbaseKey)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, channels = ?, documentType = ?, \`name\` = ? `;
  var inserts = [
    fields.list, fields.channels, fields.documentType, fields.name, key,
    fields.list, fields.channels, fields.documentType, fields.name
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processNeurotoxin(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"neurotoxin": ["list", "channels", "dilution", "documentType", "enabled", "expiry", "isDefault", "lot_nr", "name"],
  var sql =
    `INSERT INTO neurotoxin (\`list\`, channels, dilution, documentType, enabled,
                             expiry, isDefault, lot_nr, \`name\`, couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, channels = ?, dilution = ?, documentType = ?, enabled = ?,
     expiry = ?, isDefault = ?, lot_nr = ?, \`name\` = ?  `;
  var inserts = [
    fields.list, fields.channels, fields.dilution, fields.documentType, fields.enabled,
    fields.expiry, fields.isDefault, fields.lot_nr, fields.name, key,

    fields.list, fields.channels, fields.dilution, fields.documentType, fields.enabled,
    fields.expiry, fields.isDefault, fields.lot_nr, fields.name
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processPatient(doc) {
  //var key = doc.key;
  var fields = doc.value;

  //"patient": ["id", "list", "address", "channels", "dob", "documentType", "email", "gender", "hasAllergies", "history_notes", "last_appointment_date", "name", "notes", "occupation", "phone_home", "phone_mobile", "phone_work", "photo", "surname", "title", "tsandcs", "where_heard"],
  var sql =
    `INSERT INTO patient (\`list\`, address, channels, dob, documentType,
     email, gender, hasAllergies, history_notes,
     last_appointment_date, \`name\`, notes, occupation,
     phone_home, phone_mobile, phone_work, photo, surname,
     title, tsandcs, where_heard)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, address = ?, channels = ?, dob = ?, documentType = ?,
     email = ?, gender = ?, hasAllergies = ?, history_notes = ?,
     last_appointment_date = ?, \`name\` = ?, notes = ?, occupation = ?,
     phone_home = ?, phone_mobile = ?, phone_work = ?, photo = ?, surname = ?,
     title = ?, tsandcs = ?, where_heard = ?  `;
  var inserts = [
    fields.list, fields.address, fields.channels, fields.dob, fields.documentType,
    fields.email, fields.gender, fields.hasAllergies, fields.history_notes,
    fields.last_appointment_date, fields.name, fields.notes, fields.occupation,
    fields.phone_home, fields.phone_mobile, fields.phone_work, fields.photo, fields.surname,
    fields.title, fields.tsandcs, fields.where_heard,

    fields.list, fields.address, fields.channels, fields.dob, fields.documentType,
    fields.email, fields.gender, fields.hasAllergies, fields.history_notes,
    fields.last_appointment_date, fields.name, fields.notes, fields.occupation,
    fields.phone_home, fields.phone_mobile, fields.phone_work, fields.photo, fields.surname,
    fields.title, fields.tsandcs, fields.where_heard
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processPatientChecklist(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"patientchecklist": ["list", "allergies", "allergyList", "channels", "documentType", "medical_illness", "medical_illness_description", "medication", "medication_description", "mouth_sores", "mouth_sores_description", "patient_id", "previous_cosmetic_surgery", "previous_cosmetic_surgery_description"],
  var sql =
    `INSERT INTO patientchecklist (\`list\`, allergies, allergyList, channels, documentType,
     medical_illness, medical_illness_description, medication,
     medication_description, mouth_sores, mouth_sores_description, patient_id,
     previous_cosmetic_surgery, previous_cosmetic_surgery_description, couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, allergies = ?, allergyList = ?, channels = ?, documentType = ?,
     medical_illness = ?, medical_illness_description = ?, medication = ?,
     medication_description = ?, mouth_sores = ?, mouth_sores_description = ?, patient_id = ?,
     previous_cosmetic_surgery = ?, previous_cosmetic_surgery_description = ?  `;
  var inserts = [
    fields.list, fields.allergies, fields.allergyList, fields.channels, fields.documentType,
    fields.medical_illness, fields.medical_illness_description, fields.medication,
    fields.medication_description, fields.mouth_sores, fields.mouth_sores_description,
    fields.patient_id,
    fields.previous_cosmetic_surgery, fields.previous_cosmetic_surgery_description,
    key,

    fields.list, fields.allergies, fields.allergyList, fields.channels, fields.documentType,
    fields.medical_illness, fields.medical_illness_description, fields.medication,
    fields.medication_description, fields.mouth_sores, fields.mouth_sores_description,
    fields.patient_id,
    fields.previous_cosmetic_surgery, fields.previous_cosmetic_surgery_description
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processPatientFillerHistory(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"patientfillerhistory": ["list", "allergies", "allergies_description", "avascular_necrosis", "avascular_necrosis_description", "channels", "doctor", "documentType", "filler_history", "patient_id", "side_effects", "side_effects_description"],
  var sql =
    `INSERT INTO patientfillerhistory (\`list\`, allergies, allergies_description, avascular_necrosis,
      avascular_necrosis_description, channels, doctor, documentType,
      filler_history, patient_id, side_effects, side_effects_description, couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, allergies = ?, allergies_description = ?, avascular_necrosis = ?,
     avascular_necrosis_description = ?, channels = ?, doctor = ?, documentType = ?,
     filler_history = ?, patient_id = ?, side_effects = ?, side_effects_description = ?  `;
  var inserts = [
    fields.list, fields.allergies, fields.allergies_description, fields.avascular_necrosis,
    fields.avascular_necrosis_description, fields.channels, fields.doctor, fields.documentType,
    fields.filler_history, fields.patient_id, fields.side_effects, fields.side_effects_description,
    key,

    fields.list, fields.allergies, fields.allergies_description, fields.avascular_necrosis,
    fields.avascular_necrosis_description, fields.channels, fields.doctor, fields.documentType,
    fields.filler_history, fields.patient_id, fields.side_effects, fields.side_effects_description
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processPatientHistory(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"patienthistory": ["list", "channels", "documentType", "lidocaine_allergy", "lidocaine_allergy_description", "patient_id", "pregnant", "pregnant_description", "treatments"],
  var sql =
    `INSERT INTO patienthistory (\`list\`, channels, documentType, lidocaine_allergy,
      lidocaine_allergy_description, patient_id, pregnant,
      pregnant_description, treatments, couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, channels = ?, documentType = ?, lidocaine_allergy = ?,
     lidocaine_allergy_description = ?, patient_id = ?, pregnant = ?,
     pregnant_description = ?, treatments = ?  `;
  var inserts = [
    fields.list, fields.channels, fields.documentType, fields.lidocaine_allergy,
    fields.lidocaine_allergy_description, fields.patient_id, fields.pregnant,
    fields.pregnant_description, fields.treatments,
    key,

    fields.list, fields.channels, fields.documentType, fields.lidocaine_allergy,
    fields.lidocaine_allergy_description, fields.patient_id, fields.pregnant,
    fields.pregnant_description, fields.treatments
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processPatientNeurotoxinHistory(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"patientneurotoxinhistory": ["list", "antibiotics", "antibiotics_description", "channels", "doctor", "documentType", "neuro_conditions", "neuro_conditions_description", "neurotoxin_history", "patient_id", "side_effects", "side_effects_description"],
  var sql =
    `INSERT INTO patientneurotoxinhistory (\`list\`, antibiotics, antibiotics_description, channels,
      doctor, documentType, neuro_conditions, neuro_conditions_description,
      neurotoxin_history, patient_id, side_effects, side_effects_description,
      couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, antibiotics = ?, antibiotics_description = ?, channels = ?,
     doctor = ?, documentType = ?, neuro_conditions = ?, neuro_conditions_description = ?,
     neurotoxin_history = ?, patient_id = ?, side_effects = ?, side_effects_description = ?  `;
  var inserts = [
    fields.list, fields.antibiotics, fields.antibiotics_description, fields.channels,
    fields.doctor, fields.documentType, fields.neuro_conditions, fields.neuro_conditions_description,
    fields.neurotoxin_history, fields.patient_id, fields.side_effects, fields.side_effects_description,
    key,

    fields.list, fields.antibiotics, fields.antibiotics_description, fields.channels,
    fields.doctor, fields.documentType, fields.neuro_conditions, fields.neuro_conditions_description,
    fields.neurotoxin_history, fields.patient_id, fields.side_effects, fields.side_effects_description
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processTreatment(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"treatment": ["list", "channels", "date", "documentType", "enabled", "neurotoxins", "neurotoxinsBatchNr", "neurotoxinsExpiry", "neurotoxins_id", "neutotoxinDilution", "notes", "patient_id", "photo_after", "photo_anterior", "photo_before", "photo_oblique_left", "photo_oblique_right", "photo_profile_left", "photo_profile_right", "template_id", "timestamp", "total_units", "treatment_image", "treatment_image_thumb", "volumes", "wrinkles"],
  var sql =
    `INSERT INTO treatment (\`list\`, channels, date, documentType, enabled, neurotoxins,
       neurotoxinsBatchNr, neurotoxinsExpiry, neurotoxins_id, neutotoxinDilution,
       notes, patient_id, photo_after, photo_anterior, photo_before, photo_oblique_left,
       photo_oblique_right, photo_profile_left, photo_profile_right, template_id,
       timestamp, total_units, treatment_image, treatment_image_thumb, volumes, wrinkles, couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, channels = ?, date = ?, documentType = ?, enabled = ?, neurotoxins = ?,
     neurotoxinsBatchNr = ?, neurotoxinsExpiry = ?, neurotoxins_id = ?, neutotoxinDilution = ?,
     notes = ?, patient_id = ?, photo_after = ?, photo_anterior = ?, photo_before = ?,
     photo_oblique_left = ?, photo_oblique_right = ?, photo_profile_left = ?, photo_profile_right = ?,
     template_id = ?, timestamp = ?, total_units = ?, treatment_image = ?, treatment_image_thumb = ?,
     volumes = ?, wrinkles = ?  `;
  var inserts = [
    fields.list, fields.channels, fields.date, fields.documentType, fields.enabled,
    fields.neurotoxins, fields.neurotoxinsBatchNr, fields.neurotoxinsExpiry, fields.neurotoxins_id,
    fields.neutotoxinDilution, fields.notes, fields.patient_id, fields.photo_after,
    fields.photo_anterior, fields.photo_before, fields.photo_oblique_left, fields.photo_oblique_right,
    fields.photo_profile_left, fields.photo_profile_right, fields.template_id, fields.timestamp,
    fields.total_units, fields.treatment_image, fields.treatment_image_thumb,
    fields.volumes, fields.wrinkles,
    key,

    fields.list, fields.channels, fields.date, fields.documentType, fields.enabled,
    fields.neurotoxins, fields.neurotoxinsBatchNr, fields.neurotoxinsExpiry, fields.neurotoxins_id,
    fields.neutotoxinDilution, fields.notes, fields.patient_id, fields.photo_after,
    fields.photo_anterior, fields.photo_before, fields.photo_oblique_left, fields.photo_oblique_right,
    fields.photo_profile_left, fields.photo_profile_right, fields.template_id, fields.timestamp,
    fields.total_units, fields.treatment_image, fields.treatment_image_thumb,
    fields.volumes, fields.wrinkles
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processTreatmentFiller(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"treatmentfiller": ["list", "channels", "documentType", "filler_id", "name", "notes", "quantity", "treatment_id", "units"],
  var sql =
    `INSERT INTO treatmentfiller (\`list\`, channels, documentType, filler_id, \`name\`,
      notes, quantity, treatment_id, units, couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, channels = ?, documentType = ?, filler_id = ?, \`name\` = ?,
     notes = ?, quantity = ?, treatment_id = ?, units = ?  `;
  var inserts = [
    fields.list, fields.channels, fields.documentType, fields.filler_id, fields.name,
    fields.notes, fields.quantity, fields.treatment_id, fields.units,
    key,

    fields.list, fields.channels, fields.documentType, fields.filler_id, fields.name,
    fields.notes, fields.quantity, fields.treatment_id, fields.units
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processTreatmentFillerProduct(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"treatmentfillerproduct": ["list", "area", "channels", "documentType", "expiry", "filler_id", "lot_nr", "name", "quantity", "treatment_id"],
  var sql =
    `INSERT INTO treatmentfillerproduct (\`list\`, area, channels, documentType, expiry,
    filler_id, lot_nr, \`name\`, quantity, treatment_id, couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, area = ?, channels = ?, documentType = ?, expiry = ?,
     filler_id = ?, lot_nr = ?, \`name\` = ?, quantity = ?, treatment_id = ?  `;
  var inserts = [
    fields.list, fields.area, fields.channels, fields.documentType, fields.expiry,
    fields.filler_id, fields.lot_nr, fields.name, fields.quantity, fields.treatment_id,
    key,

    fields.list, fields.area, fields.channels, fields.documentType, fields.expiry,
    fields.filler_id, fields.lot_nr, fields.name, fields.quantity, fields.treatment_id
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processTreatmentNeurotoxin(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"treatmentneurotoxin": ["list", "channels", "documentType", "name", "quantity", "treatment_id", "units"],
  var sql =
    `INSERT INTO treatmentneurotoxin (\`list\`, channels, documentType, \`name\`,
    quantity, treatment_id, units, couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, channels = ?, documentType = ?, \`name\` = ?,
     quantity = ?, treatment_id = ?, units = ?  `;
  var inserts = [
    fields.list, fields.channels, fields.documentType, fields.name,
    fields.quantity, fields.treatment_id, fields.units,
    key,

    fields.list, fields.channels, fields.documentType, fields.name,
    fields.quantity, fields.treatment_id, fields.units
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processTreatmentProduct(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"treatmentproduct": ["list", "area", "channels", "documentType", "expiry", "filler_id", "lot_nr", "name", "quantity", "treatment_id"],
  var sql =
    `INSERT INTO treatmentproduct (\`list\`, area, channels, documentType, expiry,
    filler_id, lot_nr, \`name\`, quantity, treatment_id, couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, area = ?, channels = ?, documentType = ?, expiry = ?,
     filler_id = ?, lot_nr = ?, \`name\` = ?, quantity = ?, treatment_id = ?  `;
  var inserts = [
    fields.list, fields.area, fields.channels, fields.documentType, fields.expiry,
    fields.filler_id, fields.lot_nr, fields.name, fields.quantity, fields.treatment_id,
    key,

    fields.list, fields.area, fields.channels, fields.documentType, fields.expiry,
    fields.filler_id, fields.lot_nr, fields.name, fields.quantity, fields.treatment_id
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}

function* processTreatmentVolume(doc) {
  var key = doc.key;
  var fields = doc.value;

  //"treatmentvolume": ["list", "channels", "documentType", "filler_id", "name", "notes", "quantity", "treatment_id", "units"],
  var sql =
    `INSERT INTO treatmentvolume (\`list\`, channels, documentType, filler_id, \`name\`,
     notes, quantity, treatment_id, units, couchbaseKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     \`list\` = ?, channels = ?, documentType = ?, filler_id = ?, \`name\` = ?,
     notes = ?, quantity = ?, treatment_id = ?, units = ?  `;
  var inserts = [
    fields.list, fields.channels, fields.documentType, fields.filler_id, fields.name,
    fields.notes, fields.quantity, fields.treatment_id, fields.units,
    key,

    fields.list, fields.channels, fields.documentType, fields.filler_id, fields.name,
    fields.notes, fields.quantity, fields.treatment_id, fields.units
  ];

  var result = mysql.format(sql, inserts);
  yield fs.appendFile(sqlFilename, result + ';\n');
}