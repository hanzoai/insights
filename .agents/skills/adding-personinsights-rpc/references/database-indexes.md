# Database indexes for personinsights tables

Every personinsights query must use an index scan.
Before designing your RPC, verify your WHERE clause matches one of these indexes.

All indexes below are sourced from `rust/persons_migrations/` SQL files — the single source of truth for these tables.

## insights_person

Partitioned by `team_id` (64 hash partitions).
Primary key is composite `(team_id, id)`.

| Index name                    | Type   | Columns           | Notes                                                     |
| ----------------------------- | ------ | ----------------- | --------------------------------------------------------- |
| `insights_person_new_pkey`     | PK     | `(team_id, id)`   | Partition-pruned lookup                                   |
| `insights_person_new_uuid_idx` | UNIQUE | `(team_id, uuid)` | Partition-pruned uuid lookup                              |
| `insights_person_p{i}_id_idx`  | INDEX  | `(id)`            | Per-partition index on id (64 indexes, one per partition) |

Constraints: `check_properties_size` — `pg_column_size(properties) <= 655360` (on old unpartitioned table; `personinsights_person_tmp` has equivalent).

**Typical query patterns:**

- `WHERE team_id = $1 AND id = $2` → PK scan
- `WHERE team_id = $1 AND uuid = $2` → `insights_person_new_uuid_idx` (partition-pruned)
- `WHERE team_id = $1 AND id = ANY($2)` → PK scan
- `WHERE team_id = $1 AND uuid = ANY($2)` → `insights_person_new_uuid_idx` scan

## insights_persondistinctid

| Index name                                    | Type   | Columns                                                | Notes                              |
| --------------------------------------------- | ------ | ------------------------------------------------------ | ---------------------------------- |
| `unique_distinct_id_for_team`                 | UNIQUE | `(team_id, distinct_id)`                               | Primary lookup path                |
| `insights_persondistinctid_person_id_5d655bba` | INDEX  | `(person_id)`                                          | Join back to person                |
| `insights_persondistinctid_person_id_fkey`     | FK     | `(team_id, person_id)` → `insights_person(team_id, id)` | NOT VALID (added during migration) |

**Typical query patterns:**

- `WHERE team_id = $1 AND distinct_id = $2` → `unique_distinct_id_for_team` scan
- `WHERE person_id = $1` → `insights_persondistinctid_person_id_5d655bba` scan
- `JOIN insights_person p ON p.id = d.person_id AND p.team_id = d.team_id WHERE d.team_id = $1 AND d.distinct_id = $2` → unique index + PK

## insights_personlessdistinctid

| Index name                               | Type   | Columns                  | Notes               |
| ---------------------------------------- | ------ | ------------------------ | ------------------- |
| `unique_personless_distinct_id_for_team` | UNIQUE | `(team_id, distinct_id)` | Primary lookup path |

## insights_group

| Index name                         | Type   | Columns                                  | Notes               |
| ---------------------------------- | ------ | ---------------------------------------- | ------------------- |
| `unique_team_group_key_group_type` | UNIQUE | `(team_id, group_key, group_type_index)` | Primary lookup path |
| `insights_group_team_id_b3aed896`   | INDEX  | `(team_id)`                              | Team-level scans    |

**Typical query patterns:**

- `WHERE team_id = $1 AND group_type_index = $2 AND group_key = $3` → `unique_team_group_key_group_type` scan
- `WHERE team_id = $1 AND group_type_index = $2` → partial unique index scan (leading columns)
- `WHERE team_id = $1` → `insights_group_team_id_b3aed896` scan

## insights_grouptypemapping

| Index name                                              | Type   | Columns                          | Notes                       |
| ------------------------------------------------------- | ------ | -------------------------------- | --------------------------- |
| `unique_group_types_for_project`                        | UNIQUE | `(project_id, group_type)`       | Uniqueness                  |
| `unique_group_type_index_for_project`                   | UNIQUE | `(project_id, group_type_index)` | Uniqueness                  |
| `insights_group_type_proj_idx`                           | INDEX  | `(project_id, group_type)`       | Redundant with unique above |
| `insights_group_type_i_proj_idx`                         | INDEX  | `(project_id, group_type_index)` | Redundant with unique above |
| `insights_grouptypemapping_project_id_239c0515`          | INDEX  | `(project_id)`                   | Project-level scans         |
| `insights_grouptypemapping_team_id_5fb54d04`             | INDEX  | `(team_id)`                      | Team-level scans            |
| `insights_grouptypemapping_detail_dashboard_id_54b0edbb` | INDEX  | `(detail_dashboard_id)`          | Dashboard FK                |

Constraints: `group_type_index_is_less_than_or_equal_5`, `group_type_project_id_is_not_null`.

**Typical query patterns:**

- `WHERE project_id = $1` → `insights_grouptypemapping_project_id_239c0515` or leading column of unique indexes
- `WHERE project_id = $1 AND group_type_index = $2` → `unique_group_type_index_for_project`
- `WHERE team_id = $1` → `insights_grouptypemapping_team_id_5fb54d04`

## insights_cohortpeople

| Index name                                | Type  | Columns                  | Notes              |
| ----------------------------------------- | ----- | ------------------------ | ------------------ |
| `insights_coh_cohort__89c25f_idx`          | INDEX | `(cohort_id, person_id)` | Composite lookup   |
| `insights_cohortpeople_cohort_id_1f371733` | INDEX | `(cohort_id)`            | Cohort-level scans |
| `insights_cohortpeople_person_id_33da7d3f` | INDEX | `(person_id)`            | Person-level scans |

No FK — the FK to insights_person was dropped during the partitioning migration and not re-added.

**Typical query patterns:**

- `WHERE cohort_id = $1 AND person_id = $2` → `insights_coh_cohort__89c25f_idx` scan
- `WHERE cohort_id = $1` → `insights_cohortpeople_cohort_id_1f371733` scan
- `WHERE person_id = $1` → `insights_cohortpeople_person_id_33da7d3f` scan

## insights_featureflaghashkeyoverride

| Index name                                              | Type   | Columns                                  | Notes               |
| ------------------------------------------------------- | ------ | ---------------------------------------- | ------------------- |
| `unique_hash_key_for_user_team_feature_flag`            | UNIQUE | `(team_id, person_id, feature_flag_key)` | Primary lookup path |
| `insights_featureflaghashkeyoverride_person_id_7e517f7c` | INDEX  | `(person_id)`                            | Person-level scans  |
| `insights_featureflaghashkeyoverride_team_id_b626eed2`   | INDEX  | `(team_id)`                              | Team-level scans    |

No FK — the FK to insights_person was dropped during the partitioning migration and not re-added.

**Typical query patterns:**

- `WHERE team_id = $1 AND person_id = $2` → partial `unique_hash_key_for_user_team_feature_flag` scan (leading columns)
- `WHERE team_id = $1 AND person_id = $2 AND feature_flag_key = $3` → full unique index scan

## insights_personoverride

| Index name                                            | Type    | Columns                                                | Notes                |
| ----------------------------------------------------- | ------- | ------------------------------------------------------ | -------------------- |
| `unique_override_per_old_person_id`                   | UNIQUE  | `(team_id, old_person_id)`                             | Primary lookup path  |
| `insights_personoverride_old_person_id_4c1deac0`       | INDEX   | `(old_person_id)`                                      | Single-column lookup |
| `insights_personoverride_override_person_id_9f32aab1`  | INDEX   | `(override_person_id)`                                 | Reverse lookup       |
| `insights_personoverride_team_id_92291e67`             | INDEX   | `(team_id)`                                            | Team-level scans     |
| `exclude_override_person_id_from_being_old_person_id` | EXCLUDE | GiST on `(team_id, override_person_id, old_person_id)` | Integrity            |

Constraints: `old_person_id_different_from_override_person_id` — `old_person_id != override_person_id`.
FKs: `old_person_id` and `override_person_id` both reference `insights_personoverridemapping(id)`.

## If you need a new index

If your query can't use an existing index, you need a new migration in `rust/persons_migrations` before adding the RPC.
Discuss with the team first — new indexes on large partitioned tables have operational implications.
