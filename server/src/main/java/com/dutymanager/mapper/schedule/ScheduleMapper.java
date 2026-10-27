package com.dutymanager.mapper.schedule;

import com.dutymanager.model.schedule.RotationChange;
import java.util.List;
import org.apache.ibatis.annotations.*;

@Mapper
public interface ScheduleMapper {
  List<RotationChange> changes(@Param("id") long id);
}
