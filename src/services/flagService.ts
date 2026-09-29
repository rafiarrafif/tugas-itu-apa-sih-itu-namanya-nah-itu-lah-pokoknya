import {
  FlagRepository,
  type FindAllParams,
  type UpdateFlagInput,
} from "../repositories/flagRepository.ts";
import type { FlagResponseDto, FlagUpdateRequestDto } from "../dtos/flagDto.ts";

type FlagRowFromList = Awaited<ReturnType<FlagRepository["findAll"]>>["rows"][number];
type FlagRowFromFind = Awaited<ReturnType<FlagRepository["findById"]>>;

export class FlagService {
  private flagRepository: FlagRepository;

  constructor(flagRepository: FlagRepository = new FlagRepository()) {
    this.flagRepository = flagRepository;
  }

  private toDto(row: FlagRowFromList | NonNullable<FlagRowFromFind>): FlagResponseDto {
    return {
      id: row.id,
      reviewId: row.reviewId,
      reportedBy: row.reportedBy,
      reason: row.reason,
      status: row.status as "pending" | "reviewed" | "resolved" | "dismissed",
      createdAt: row.createdAt,
    };
  }

  private validateStatus(
    status: string,
  ): status is "pending" | "reviewed" | "resolved" | "dismissed" {
    const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];
    return validStatuses.includes(status);
  }

  async getAllFlags(params: FindAllParams) {
    const { rows, total } = await this.flagRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async updateFlagStatus(
    id: number,
    input: FlagUpdateRequestDto,
  ): Promise<FlagResponseDto> {
    const flag = await this.flagRepository.findById(id);
    if (!flag) throw new Error("FLAG_NOT_FOUND");

    if (!this.validateStatus(input.status)) {
      throw new Error("INVALID_STATUS");
    }

    const updateInput: UpdateFlagInput = {
      status: input.status,
    };

    const row = await this.flagRepository.update(id, updateInput);
    if (!row) throw new Error("FLAG_NOT_FOUND");
    return this.toDto(row);
  }
}
