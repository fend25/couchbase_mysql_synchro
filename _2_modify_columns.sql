SET NAMES 'utf8';
USE pockeuww_data;

ALTER TABLE treatment MODIFY COLUMN neurotoxins text;
ALTER TABLE treatment MODIFY COLUMN neurotoxins_id text;
ALTER TABLE treatment MODIFY COLUMN neurotoxinsBatchNr text;
ALTER TABLE treatment MODIFY COLUMN patient_id text;
ALTER TABLE treatment MODIFY COLUMN treatment_image longtext;
ALTER TABLE treatment MODIFY COLUMN treatment_image_thumb longtext;
ALTER TABLE treatment MODIFY COLUMN notes text;
ALTER TABLE treatment MODIFY COLUMN template_id text;
ALTER TABLE treatment MODIFY COLUMN total_units DECIMAL(7, 2);
ALTER TABLE treatment MODIFY COLUMN volumes text;
ALTER TABLE treatment MODIFY COLUMN wrinkles text;
-- modify all photos to longtext
ALTER TABLE treatment MODIFY COLUMN photo_after longtext;
ALTER TABLE treatment MODIFY COLUMN photo_anterior longtext;
ALTER TABLE treatment MODIFY COLUMN photo_before longtext;
ALTER TABLE treatment MODIFY COLUMN photo_oblique_left longtext;
ALTER TABLE treatment MODIFY COLUMN photo_oblique_right longtext;
ALTER TABLE treatment MODIFY COLUMN photo_profile_left longtext;
ALTER TABLE treatment MODIFY COLUMN photo_profile_right longtext;


ALTER TABLE neurotoxin MODIFY COLUMN expiry datetime;


ALTER TABLE treatmentfiller MODIFY COLUMN notes text;


ALTER TABLE treatmentvolume MODIFY COLUMN units text;


ALTER TABLE patient MODIFY COLUMN `name` text;
ALTER TABLE patient MODIFY COLUMN surname text;
ALTER TABLE patient MODIFY COLUMN where_heard text;
ALTER TABLE patient MODIFY COLUMN history_notes text;
ALTER TABLE patient MODIFY COLUMN occupation text;
ALTER TABLE patient MODIFY COLUMN address text;
ALTER TABLE patient MODIFY COLUMN title text;
ALTER TABLE patient MODIFY COLUMN notes text;
ALTER TABLE patient MODIFY COLUMN phone_mobile varchar(20);
ALTER TABLE patient MODIFY COLUMN phone_home varchar(20); -- just with mobile
ALTER TABLE patient MODIFY COLUMN phone_work varchar(20); -- just with mobile
