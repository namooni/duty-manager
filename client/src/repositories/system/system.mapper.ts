import type {SystemDto} from './system.dto';
import type {SystemInfo} from './system.domain';
export const toSystemInfo = (dto: SystemDto): SystemInfo => ({today: dto.today, zone: dto.zone});
