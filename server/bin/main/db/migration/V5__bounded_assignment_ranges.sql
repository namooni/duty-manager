CREATE TABLE duty_schedule_ranges (
 duty_id BIGINT PRIMARY KEY,
 end_date DATE NULL,
 planned_through DATE NOT NULL,
 FOREIGN KEY(duty_id) REFERENCES duties(id)
);
INSERT INTO duty_schedule_ranges(duty_id,planned_through)
 SELECT d.id,GREATEST(d.anchor_date,COALESCE((SELECT MAX(s.period_end) FROM duty_rotation_slots s WHERE s.duty_id=d.id),d.anchor_date),COALESCE((SELECT MAX(m.scheduled_date) FROM duty_meetings m WHERE m.duty_id=d.id),d.anchor_date))
 FROM duties d JOIN duty_schedules r ON r.duty_id=d.id;
