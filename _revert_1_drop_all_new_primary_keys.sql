ALTER TABLE filler DROP PRIMARY KEY;
ALTER TABLE filler DROP COLUMN `couchbaseKey`;

ALTER TABLE fillerbrand DROP PRIMARY KEY;
ALTER TABLE fillerbrand DROP COLUMN `couchbaseKey`;

ALTER TABLE neurotoxin DROP PRIMARY KEY;
ALTER TABLE neurotoxin DROP COLUMN `couchbaseKey`;

ALTER TABLE patientchecklist DROP PRIMARY KEY;
ALTER TABLE patientchecklist DROP COLUMN `couchbaseKey`;

ALTER TABLE patientfillerhistory DROP PRIMARY KEY;
ALTER TABLE patientfillerhistory DROP COLUMN `couchbaseKey`;

ALTER TABLE patienthistory DROP PRIMARY KEY;
ALTER TABLE patienthistory DROP COLUMN `couchbaseKey`;

ALTER TABLE patientneurotoxinhistory DROP PRIMARY KEY;
ALTER TABLE patientneurotoxinhistory DROP COLUMN `couchbaseKey`;

ALTER TABLE treatment DROP PRIMARY KEY;
ALTER TABLE treatment DROP COLUMN `couchbaseKey`;

ALTER TABLE treatmentfiller DROP PRIMARY KEY;
ALTER TABLE treatmentfiller DROP COLUMN `couchbaseKey`;

ALTER TABLE treatmentfillerproduct DROP PRIMARY KEY;
ALTER TABLE treatmentfillerproduct DROP COLUMN `couchbaseKey`;

ALTER TABLE treatmentneurotoxin DROP PRIMARY KEY;
ALTER TABLE treatmentneurotoxin DROP COLUMN `couchbaseKey`;

ALTER TABLE treatmentproduct DROP PRIMARY KEY;
ALTER TABLE treatmentproduct DROP COLUMN `couchbaseKey`;

ALTER TABLE treatmentvolume DROP PRIMARY KEY;
ALTER TABLE treatmentvolume DROP COLUMN `couchbaseKey`;