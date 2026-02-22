import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty()
  @IsIn(['private', 'group'])
  type: 'private' | 'group';

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds: string[];
}
