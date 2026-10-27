import type {AssignmentDto, ChangeDto} from './assignments.dto';
import type {Assignment, Change} from './assignments.domain';
export const toAssignment = (dto: AssignmentDto): Assignment => ({...dto});
export const toChange = (dto: ChangeDto): Change => ({...dto});
