-- Rename person tables to use partitioned table as primary
-- This makes insights_person point to the partitioned table

-- Rename old table to insights_person_old
ALTER TABLE IF EXISTS insights_person RENAME TO insights_person_old;

-- Rename new partitioned table to insights_person
ALTER TABLE IF EXISTS insights_person_new RENAME TO insights_person;

-- Create view for backwards compatibility with Rust code
CREATE OR REPLACE VIEW insights_person_new AS SELECT * FROM insights_person;
