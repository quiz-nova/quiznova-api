import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'qn-logo',
  imports: [TranslatePipe],
  template: `
    <div class="content">
      <svg class="icon" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="url(#brand)" />
        <path d="M16 8L5 15L16 22L27 15Z" fill="white" />
        <path d="M5 15L16 19L27 15" stroke="#0f8a71" stroke-width="1.2" stroke-linejoin="round" />
        <line
          x1="16"
          y1="19"
          x2="16"
          y2="25"
          stroke="white"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <path d="M24 6L24.8 8.2L27 9L24.8 9.8L24 12L23.2 9.8L21 9L23.2 8.2Z" fill="#FFD700" />
        <defs>
          <linearGradient id="brand" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stop-color="#12A588" />
            <stop offset="1" stop-color="#209DB6" />
          </linearGradient>
        </defs>
      </svg>
      <span>{{ tokens.COMMON.BRAND_NAME | translate }}</span>
    </div>
  `,
  styles: [
    `
      .content {
        display: flex;
        flex: 1;
        justify-content: flex-start;
        align-items: center;
        gap: 0.625rem;
      }

      .icon {
        flex-shrink: 0;
      }

      .content span {
        display: flex;
        align-items: center;
        font-weight: 700;
        font-family: var(--ff-heading), sans-serif;
        font-size: 1.1rem;
        letter-spacing: -0.02em;
        color: var(--logo-color, var(--clr-blue-900));
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {
  protected readonly tokens = TRANSLATION_TOKENS;
}
