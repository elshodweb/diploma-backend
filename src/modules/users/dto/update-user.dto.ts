import {
  IsEmail,
  IsString,
  IsEnum,
  MinLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password: string;
}
