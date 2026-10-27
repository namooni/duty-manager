export type Assignment = Readonly<{
  id: number;
  dutyId: number;
  dutyName: string;
  periodStart: string;
  periodEnd: string;
  employeeId: number;
  employeeName: string;
  slotIndex: number;
}>;
export type Change = Readonly<{
  id: number;
  previousName: string;
  newName: string;
  reason: string;
  changedAt: string;
}>;
