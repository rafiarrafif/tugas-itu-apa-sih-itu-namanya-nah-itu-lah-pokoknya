import {
  AuditRepository,
  type CreateAuditInput,
  type FindAllParams,
} from "../repositories/auditRepository.ts";
import type {
  AuditResponseDto,
  AuditCreateRequestDto,
} from "../dtos/auditDto.ts";

type AuditRowFromList = Awaited<ReturnType<AuditRepository["findAll"]>>["rows"][number];
type AuditRowFromCreate = Awaited<ReturnType<AuditRepository["create"]>>;

export class AuditService {
  private auditRepository: AuditRepository;

  constructor(auditRepository: AuditRepository = new AuditRepository()) {
    this.auditRepository = auditRepository;
  }

  private toDto(row: AuditRowFromList | NonNullable<AuditRowFromCreate>): AuditResponseDto {
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

  private validateAction(
    action: string,
  ): action is "CREATE" | "UPDATE" | "DELETE" {
    const validActions = ["CREATE", "UPDATE", "DELETE"];
    return validActions.includes(action);
  }

  async getAllAuditLogs(params: FindAllParams) {
    const { rows, total } = await this.auditRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getAuditLogById(id: number): Promise<AuditResponseDto> {
    const row = await this.auditRepository.findById(id);
    if (!row) throw new Error("AUDIT_LOG_NOT_FOUND");
    return this.toDto(row);
  }

  async createAuditLog(
    input: AuditCreateRequestDto,
  ): Promise<AuditResponseDto> {
    if (!this.validateAction(input.action)) {
      throw new Error("INVALID_ACTION");
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
