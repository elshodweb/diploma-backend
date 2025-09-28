// dto/create-doc.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  MaxLength,
  MinLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Document title',
    example: 'Contract Agreement 2024',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Annual service contract between Company A and Company B',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'IPFS hash of the document (required only if no file is uploaded)',
    example: 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o, value) => value !== '' && value !== undefined) // Skip validation for empty strings
  @IsNotEmpty()
  ipfsHash?: string;

  @ApiPropertyOptional({
    description: 'Array of user IDs to invite to this document',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  invitedUserIds?: string[];
}