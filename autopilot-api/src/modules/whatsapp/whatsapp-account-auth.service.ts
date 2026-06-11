import { Injectable } from '@nestjs/common';
import { SocialAccounts } from '../social_accounts/entities/social_accounts.entity';
import { SocialAccountsService } from '../social_accounts/social_accounts.service';
import {
  isPlatformManagedWhatsappAccount,
  WhatsappCredentials,
} from './whatsapp-platform.util';
import { WhatsappMessagingService, SendMessageResult } from './whatsapp-messaging.service';

@Injectable()
export class WhatsappAccountAuthService {
  constructor(
    private readonly socialAccounts: SocialAccountsService,
    private readonly messaging: WhatsappMessagingService,
  ) {}

  async credentialsForAccount(
    account: SocialAccounts,
  ): Promise<{ creds: WhatsappCredentials | null; account: SocialAccounts }> {
    let active = account;
    if (!isPlatformManagedWhatsappAccount(account.metadata)) {
      active = await this.socialAccounts.forceRefreshToken(account);
    }
    return {
      account: active,
      creds: this.messaging.credentialsFromAccount(active),
    };
  }

  async sendSessionText(
    account: SocialAccounts,
    toPhone: string,
    body: string,
  ): Promise<SendMessageResult & { account: SocialAccounts }> {
    let { creds, account: active } = await this.credentialsForAccount(account);
    if (!creds) {
      return { success: false, error: 'WhatsApp not connected', account: active };
    }

    let result = await this.messaging.sendSessionText(creds, toPhone, body);

    if (!result.success && this.isAuthError(result.error)) {
      if (!isPlatformManagedWhatsappAccount(account.metadata)) {
        active = await this.socialAccounts.forceRefreshToken(active);
        creds = this.messaging.credentialsFromAccount(active);
        if (creds) {
          result = await this.messaging.sendSessionText(creds, toPhone, body);
        }
      }
    }

    if (!result.success && this.isAuthError(result.error)) {
      const platformManaged = isPlatformManagedWhatsappAccount(active.metadata);
      if (!platformManaged) {
        active = await this.socialAccounts.markDisconnectedAuth(
          active,
          result.error ?? 'WhatsApp authentication failed',
        );
      }
      return {
        ...result,
        error: platformManaged
          ? this.messaging.platformTokenErrorMessage(result.error)
          : this.messaging.oauthTokenErrorMessage(),
        account: active,
      };
    }

    return { ...result, account: active };
  }

  private isAuthError(message?: string): boolean {
    if (!message) return false;
    return /#190\b|invalid oauth|session has expired|error validating access token/i.test(
      message,
    );
  }
}
