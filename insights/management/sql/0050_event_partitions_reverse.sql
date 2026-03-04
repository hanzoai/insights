DROP FUNCTION update_partitions;
DROP FUNCTION create_partitions;

ALTER TABLE insights_event rename to old_insights_event;
CREATE TABLE insights_event (like old_insights_event including defaults);

ALTER SEQUENCE insights_event_id_seq OWNED BY insights_event."id";

INSERT INTO public.insights_event (id, event, properties, elements, timestamp, team_id, distinct_id, elements_hash)
SELECT id, event, properties, elements, timestamp, team_id, distinct_id, elements_hash
FROM public.old_insights_event;

DROP TABLE old_insights_event CASCADE;
DROP TABLE insights_event_partitions_manifest CASCADE;

ALTER TABLE insights_action_events DROP COLUMN timestamp, DROP COLUMN event;
ALTER TABLE insights_element DROP COLUMN timestamp, DROP COLUMN event;

CREATE UNIQUE INDEX insights_event_pkey ON public.insights_event USING btree (id);
CREATE INDEX insights_event_team_id_a8b4c6dc ON public.insights_event USING btree (team_id);
CREATE INDEX insights_event_idx_distinct_id ON public.insights_event USING btree (distinct_id);
CREATE INDEX insights_eve_element_48becd_idx ON public.insights_event USING btree (elements_hash);
CREATE INDEX insights_eve_timesta_1f6a8c_idx ON public.insights_event USING btree ("timestamp", team_id, event);
ALTER TABLE insights_event ADD CONSTRAINT insights_event_team_id_a8b4c6dc_fk_insights_team_id FOREIGN KEY (team_id) REFERENCES insights_team(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE insights_action_events ADD CONSTRAINT insights_action_events_event_id_7077ea70_fk_insights_event_id FOREIGN KEY (event_id) REFERENCES insights_event(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE insights_element ADD CONSTRAINT insights_element_event_id_bb6549a0_fk_insights_event_id FOREIGN KEY (event_id) REFERENCES insights_event(id) DEFERRABLE INITIALLY DEFERRED;