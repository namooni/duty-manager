package com.dutymanager.mapper.assignment;

import com.dutymanager.model.assignment.Assignment;
import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AssignmentMapper {
  List<Assignment> findAll(@Param("from") LocalDate from, @Param("to") LocalDate to);

  Assignment findById(@Param("id") long id);

  List<AssignmentChangeRow> findChanges(@Param("id") long id);
}
