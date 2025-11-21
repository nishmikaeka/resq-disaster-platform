import { IsString, IsOptional, IsNumberString } from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumberString()
  lat?: string;

  @IsOptional()
  @IsNumberString()
  lng?: string;

  @IsOptional()
  @IsString()
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
}
