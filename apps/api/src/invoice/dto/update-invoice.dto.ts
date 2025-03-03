import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateInvoiceDto } from './invoice.dto';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) { }

export class GetInvoiceDto {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: '10' })
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ example: 'PENDING' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'cuid' })
  @IsOptional()
  @IsString()
  user?: string;

  @ApiPropertyOptional({ example: 'project name' })
  @IsOptional()
  @IsString()
  project?: string;

  @ApiPropertyOptional({ example: 'category name' })
  @IsOptional()
  @IsString()
  category?: string;
}
