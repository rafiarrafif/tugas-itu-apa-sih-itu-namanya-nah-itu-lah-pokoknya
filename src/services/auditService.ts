import { AuditRepository, type CreateAuditInput, type FindAllParams } from '../repositories/auditRepository.ts';
import type { AuditResponseDto, AuditCreateRequestDto } from '../dtos/auditDto.ts';

type AuditRow = NonNullable<Awaited<ReturnType<AuditRepository['create']>>>;

export class AuditService {
  private auditRepository: AuditRepository;

  constructor(auditRepository: AuditRepository = new AuditRepository()) {
    this.auditRepository = auditRepository;
  }

  private toDto(row: AuditRow): AuditResponseDto {
    return {
      id: row.id,
      userId: row.userId,
      action: row.action,
      targetTable: row.targetTable,
      targetId: row.targetId,
      metadata: row.metadata ?? undefined,
      createdAt: row.createdAt,
    };
  }

  private validateAction(action: string): action is 'CREATE' | 'UPDATE' | 'DELETE' {
    const validActions = ['CREATE', 'UPDATE', 'DELETE'];
    return validActions.includes(action);
  }

  async getAllAuditLogs(params: FindAllParams) {
    const { rows, total } = await this.auditRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row as AuditRow)), total };
  }

  async createAuditLog(input: AuditCreateRequestDto): Promise<AuditResponseDto> {
    // Validasi action
    if (!this.validateAction(input.action)) {
      throw new Error('INVALID_ACTION');
    }

    const createInput: CreateAuditInput = {
      userId: input.userId,
      action: input.action,
      targetTable: input.targetTable,
      targetId: input.targetId,
      metadata: input.metadata,
    };

    const row = await this.auditRepository.create(createInput);
    return this.toDto(row);
  }
}
