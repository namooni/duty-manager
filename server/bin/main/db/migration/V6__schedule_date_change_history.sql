CREATE TABLE duty_schedule_date_changes (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 duty_id BIGINT NOT NULL,
 rotation_key VARCHAR(40) NOT NULL,
 previous_start DATE NULL, previous_end DATE NULL,
 new_start DATE NOT NULL, new_end DATE NOT NULL,
 reason VARCHAR(300) NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(duty_id) REFERENCES duties(id),
 INDEX date_change_history(duty_id,rotation_key,id)
);
