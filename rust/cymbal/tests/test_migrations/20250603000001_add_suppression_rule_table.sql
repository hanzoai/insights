CREATE TABLE IF NOT EXISTS insights_errortrackingsuppressionrule (
    id UUID PRIMARY KEY,
    team_id INTEGER NOT NULL,
    order_key INTEGER NOT NULL DEFAULT 0,
    bytecode JSONB,
    disabled_data JSONB,
    filters JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppression_rule_team_id ON insights_errortrackingsuppressionrule(team_id);
