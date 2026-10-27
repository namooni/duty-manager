CREATE TABLE employees (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 employee_number VARCHAR(40) NOT NULL UNIQUE,
 name VARCHAR(80) NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE duties (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 description VARCHAR(1000) NOT NULL,
 anchor_date DATE NOT NULL,
 interval_count INT NOT NULL,
 interval_unit VARCHAR(10) NOT NULL,
 strategy VARCHAR(20) NOT NULL,
 assignee_count INT NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE duty_members (
 duty_id BIGINT NOT NULL,
 employee_id BIGINT NOT NULL,
 position_index INT NOT NULL,
 PRIMARY KEY (duty_id, employee_id),
 FOREIGN KEY (duty_id) REFERENCES duties(id),
 FOREIGN KEY (employee_id) REFERENCES employees(id)
);
CREATE TABLE exclusions (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 duty_id BIGINT NOT NULL,
 employee_id BIGINT NOT NULL,
 start_date DATE NOT NULL,
 end_date DATE NOT NULL,
 reason VARCHAR(300) NOT NULL,
 FOREIGN KEY (duty_id) REFERENCES duties(id),
 FOREIGN KEY (employee_id) REFERENCES employees(id),
 INDEX exclusion_dates (duty_id, start_date, end_date)
);
CREATE TABLE assignments (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 duty_id BIGINT NOT NULL,
 period_start DATE NOT NULL,
 period_end DATE NOT NULL,
 employee_id BIGINT NOT NULL,
 slot_index INT NOT NULL,
 UNIQUE (duty_id, period_start, slot_index),
 UNIQUE (duty_id, period_start, employee_id),
 FOREIGN KEY (duty_id) REFERENCES duties(id),
 FOREIGN KEY (employee_id) REFERENCES employees(id),
 INDEX assignment_dates (period_start, period_end)
);
CREATE TABLE assignment_changes (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 assignment_id BIGINT NOT NULL,
 previous_employee_id BIGINT NOT NULL,
 new_employee_id BIGINT NOT NULL,
 reason VARCHAR(300) NOT NULL,
 changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (assignment_id) REFERENCES assignments(id),
 FOREIGN KEY (previous_employee_id) REFERENCES employees(id),
 FOREIGN KEY (new_employee_id) REFERENCES employees(id)
);
