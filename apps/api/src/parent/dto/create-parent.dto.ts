import { IsString, IsOptional, IsEmail, IsArray, IsBoolean } from 'class-validator';

export class CreateParentDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  relation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentIds?: string[];

  @IsOptional()
  @IsBoolean()
  createPortalAccount?: boolean;

  @IsOptional()
  @IsString()
  password?: string;
}