CREATE TABLE duty_schedules (
 duty_id BIGINT PRIMARY KEY,
 recurrence VARCHAR(32) NOT NULL,
 rotation_mode VARCHAR(16) NOT NULL,
 weekdays_mask INT NOT NULL,
 every_days INT NOT NULL,
 month_day INT NOT NULL,
 month_ordinal INT NOT NULL,
 weekday INT NOT NULL,
 FOREIGN KEY (duty_id) REFERENCES duties(id)
);
CREATE TABLE duty_meetings (
 duty_id BIGINT NOT NULL,
 sequence_index INT NOT NULL,
 scheduled_date DATE NULL,
 PRIMARY KEY (duty_id, sequence_index),
 UNIQUE (duty_id, scheduled_date),
 FOREIGN KEY (duty_id) REFERENCES duties(id)
);
CREATE TABLE duty_rotation_slots (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 duty_id BIGINT NOT NULL,
 rotation_key VARCHAR(40) NOT NULL,
 slot_index INT NOT NULL,
 employee_id BIGINT NOT NULL,
 period_start DATE NULL,
 period_end DATE NULL,
 UNIQUE (duty_id, rotation_key, slot_index),
 UNIQUE (duty_id, rotation_key, employee_id),
 FOREIGN KEY (duty_id) REFERENCES duties(id),
 FOREIGN KEY (employee_id) REFERENCES employees(id)
);
CREATE TABLE duty_rotation_changes (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 rotation_slot_id BIGINT NOT NULL,
 previous_employee_id BIGINT NOT NULL,
 new_employee_id BIGINT NOT NULL,
 reason VARCHAR(300) NOT NULL,
 changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (rotation_slot_id) REFERENCES duty_rotation_slots(id),
 FOREIGN KEY (previous_employee_id) REFERENCES employees(id),
 FOREIGN KEY (new_employee_id) REFERENCES employees(id)
);
CREATE TABLE company_holidays (
 holiday_date DATE PRIMARY KEY,
 name VARCHAR(100) NOT NULL
);
