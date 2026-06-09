import { IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { FormSuggestionType } from '../form-suggestion-forms.constants';

export class FormSuggestionsDto {
  @IsUUID()
  tenantId: string;

  @IsIn(['brand-brain', 'content', 'campaign'])
  form: FormSuggestionType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];
}
