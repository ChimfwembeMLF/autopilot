import { ConfigService } from '@nestjs/config';

export type LegalUrls = {
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  dataDeletionUrl: string;
};

/** Absolute URLs for developer portals (TikTok, Meta, LinkedIn app settings). */
export function resolveLegalUrls(config: ConfigService): LegalUrls {
  const frontend = (config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const api = (config.get<string>('API_BASE_URL') ?? 'http://localhost:4000').replace(/\/$/, '');

  const privacyPolicyUrl =
    config.get<string>('PRIVACY_POLICY_URL')?.trim() || `${api}/privacy`;
  const termsOfServiceUrl =
    config.get<string>('TERMS_OF_SERVICE_URL')?.trim() || `${api}/terms`;
  const dataDeletionUrl =
    config.get<string>('DATA_DELETION_URL')?.trim() || `${frontend}/data-deletion`;

  return { privacyPolicyUrl, termsOfServiceUrl, dataDeletionUrl };
}
