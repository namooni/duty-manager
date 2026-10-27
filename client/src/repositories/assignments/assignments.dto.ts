export interface AssignmentDto {
  id: number;
  dutyId: number;
  dutyName: string;
  periodStart: string;
  periodEnd: string;
  employeeId: number;
  employeeName: string;
  slotIndex: number;
}
export interface ChangeDto {
  id: number;
  previousName: string;
  newName: string;
  reason: string;
  changedAt: string;
}
