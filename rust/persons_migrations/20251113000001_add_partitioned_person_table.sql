-- Add partitioned person table
-- This creates a new person table partitioned by team_id using hash partitioning

CREATE TABLE IF NOT EXISTS insights_person_new (
    LIKE insights_person INCLUDING DEFAULTS
) PARTITION BY HASH (team_id);

-- Add primary key constraint that includes the partition key
ALTER TABLE insights_person_new
    ADD CONSTRAINT insights_person_new_pkey PRIMARY KEY (team_id, id);

-- Create index on uuid - must include team_id for partitioning
CREATE UNIQUE INDEX IF NOT EXISTS insights_person_new_uuid_idx ON insights_person_new (team_id, uuid);

-- Create 64 hash partitions
DO $$
DECLARE
    num_partitions INTEGER := 64;
    i INTEGER;
BEGIN
    FOR i IN 0..(num_partitions - 1) LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS insights_person_p%s PARTITION OF insights_person_new FOR VALUES WITH (MODULUS %s, REMAINDER %s)',
            i, num_partitions, i
        );
    END LOOP;
END $$;

-- Drop foreign key constraints to allow writes to both old and new person tables
-- This is required during the migration period when persons may exist in either table
-- The index is kept for join performance

-- Drop FK from insights_persondistinctid to insights_person
ALTER TABLE insights_persondistinctid
    DROP CONSTRAINT IF EXISTS insights_persondistinctid_person_id_fkey;

-- Drop FK from insights_featureflaghashkeyoverride to insights_person
ALTER TABLE insights_featureflaghashkeyoverride
    DROP CONSTRAINT IF EXISTS insights_featureflaghashkeyoverride_person_id_fkey;

-- Drop FK from insights_cohortpeople to insights_person
ALTER TABLE insights_cohortpeople
    DROP CONSTRAINT IF EXISTS insights_cohortpeople_person_id_fkey;

-- Note: Indexes on person_id columns are preserved for join performance
-- - insights_persondistinctid_person_id_5d655bba (kept)
-- - insights_featureflaghashkeyoverride_person_id_7e517f7c (kept)
-- - insights_cohortpeople_person_id_33da7d3f (kept)

