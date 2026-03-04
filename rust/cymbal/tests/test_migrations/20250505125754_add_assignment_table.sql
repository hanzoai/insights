DROP TABLE IF EXISTS insights_errortrackingissueassignment;

CREATE TABLE IF NOT EXISTS insights_errortrackingissueassignment
(
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    issue_id uuid NOT NULL,
    user_id integer,
    user_group_id uuid,
    role_id uuid,
    CONSTRAINT insights_errortrackingissueassignment_pkey PRIMARY KEY (id),
    CONSTRAINT insights_errortrackingissueassignment_issue_id_d9cce9cb_uniq UNIQUE (issue_id)
)
