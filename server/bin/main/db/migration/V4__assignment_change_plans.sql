CREATE TABLE planning_mutex (id INT PRIMARY KEY);
INSERT INTO planning_mutex(id) VALUES (1);
ALTER TABLE duty_rotation_slots ADD COLUMN manual_override BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE duty_rotation_slots ADD COLUMN retired BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE duty_rotation_slots MODIFY COLUMN employee_id BIGINT NULL;
UPDATE duty_rotation_slots SET manual_override=TRUE WHERE id IN (SELECT rotation_slot_id FROM duty_rotation_changes);
CREATE TABLE duty_assignment_plans (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, duty_id BIGINT NOT NULL, start_index INT NOT NULL,
 assignee_count INT NOT NULL, strategy VARCHAR(20) NOT NULL, random_seed BIGINT NOT NULL,
 next_round BIGINT NOT NULL, reason VARCHAR(300) NOT NULL, superseded BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(duty_id) REFERENCES duties(id), INDEX plan_start(duty_id,start_index)
);
CREATE TABLE duty_assignment_plan_members (
 plan_id BIGINT NOT NULL, employee_id BIGINT NOT NULL, position_index INT NOT NULL,
 initial_position INT NULL, eligible BOOLEAN NOT NULL,
 PRIMARY KEY(plan_id,employee_id), FOREIGN KEY(plan_id) REFERENCES duty_assignment_plans(id),
 FOREIGN KEY(employee_id) REFERENCES employees(id)
);
CREATE TABLE assignment_plan_changes (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, change_kind VARCHAR(16) NOT NULL,
 employee_id BIGINT NULL, active_before BOOLEAN NULL, active_after BOOLEAN NULL,
 reason VARCHAR(300) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(employee_id) REFERENCES employees(id)
);
CREATE TABLE assignment_plan_change_items (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, change_id BIGINT NOT NULL, duty_id BIGINT NOT NULL,
 rotation_key VARCHAR(40) NOT NULL, slot_index INT NOT NULL,
 previous_employee_id BIGINT NULL, new_employee_id BIGINT NULL,
 FOREIGN KEY(change_id) REFERENCES assignment_plan_changes(id), FOREIGN KEY(duty_id) REFERENCES duties(id),
 FOREIGN KEY(previous_employee_id) REFERENCES employees(id), FOREIGN KEY(new_employee_id) REFERENCES employees(id)
);
