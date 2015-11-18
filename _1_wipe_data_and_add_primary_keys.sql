SET NAMES 'utf8';
USE pockeuww_data;

ALTER TABLE users ADD PRIMARY KEY (userId);

DELETE FROM filler;
ALTER TABLE filler ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE filler ADD PRIMARY KEY (couchbaseKey);

DELETE FROM fillerbrand;
ALTER TABLE fillerbrand ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE fillerbrand ADD PRIMARY KEY (couchbaseKey);

DELETE FROM neurotoxin;
ALTER TABLE neurotoxin ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE neurotoxin ADD PRIMARY KEY (couchbaseKey);

DELETE FROM patient;
ALTER TABLE patient ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE patient ADD UNIQUE INDEX patient_uidx_couchbasekey (couchbaseKey);
ALTER TABLE patient auto_increment 1;

DELETE FROM patientchecklist;
ALTER TABLE patientchecklist ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE patientchecklist ADD PRIMARY KEY (couchbaseKey);

DELETE FROM patientfillerhistory;
ALTER TABLE patientfillerhistory ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE patientfillerhistory ADD PRIMARY KEY (couchbaseKey);

DELETE FROM patienthistory;
ALTER TABLE patienthistory ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE patienthistory ADD PRIMARY KEY (couchbaseKey);

DELETE FROM patientneurotoxinhistory;
ALTER TABLE patientneurotoxinhistory ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE patientneurotoxinhistory ADD PRIMARY KEY (couchbaseKey);

DELETE FROM treatment;
ALTER TABLE treatment ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE treatment ADD PRIMARY KEY (couchbaseKey);

DELETE FROM treatmentfiller;
ALTER TABLE treatmentfiller ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE treatmentfiller ADD PRIMARY KEY (couchbaseKey);

DELETE FROM treatmentfillerproduct;
ALTER TABLE treatmentfillerproduct ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE treatmentfillerproduct ADD PRIMARY KEY (couchbaseKey);

DELETE FROM treatmentneurotoxin;
ALTER TABLE treatmentneurotoxin ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE treatmentneurotoxin ADD PRIMARY KEY (couchbaseKey);

DELETE FROM treatmentproduct;
ALTER TABLE treatmentproduct ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE treatmentproduct ADD PRIMARY KEY (couchbaseKey);

DELETE FROM treatmentvolume;
ALTER TABLE treatmentvolume ADD COLUMN `couchbaseKey` VARCHAR(250) NOT NULL;
ALTER TABLE treatmentvolume ADD PRIMARY KEY (couchbaseKey);
