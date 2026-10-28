ALTER TABLE duty_assignment_plans ADD COLUMN members_from DATE NULL;
CREATE TABLE duty_slot_handovers (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 rotation_slot_id BIGINT NOT NULL,
 effective_date DATE NOT NULL,
 employee_id BIGINT NOT NULL,
 reason VARCHAR(300) NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(rotation_slot_id,effective_date),
 FOREIGN KEY(rotation_slot_id) REFERENCES duty_rotation_slots(id),
 FOREIGN KEY(employee_id) REFERENCES employees(id)
);
