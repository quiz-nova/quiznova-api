import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';

import { Logo } from '@shared/components/logo/logo';

export interface ProductLinks {
  id: number;
  label: string;
  name: string;
  key: string;
}

export const productLinks: ProductLinks[] = [
  { id: 1, label: 'Features', name: '#features', key: 'NAV.FEATURES' },
  { id: 2, label: 'About', name: '#about', key: 'NAV.ABOUT' },
  { id: 3, label: 'Login', name: '/auth/login', key: 'NAV.LOGIN' },
];

@Component({
  selector: 'qn-contact',
  imports: [Logo, TranslatePipe],
  template: `
    <footer class="footer" id="contact">
      <div class="container">
        <div class="footer__top">
          <div class="footer__brand">
            <qn-logo />
            <p>{{ tokens.LANDING.PRODUCT_DESC | translate }}</p>
          </div>

          <div class="footer__columns">
            <div class="footer__column">
              <h4>{{ tokens.LANDING.FEATURES_TITLE | translate }}</h4>
              @for (link of productLinks(); track link.id) {
                <a [attr.href]="link.name">{{ link.key | translate }}</a>
              }
            </div>
          </div>
        </div>

        <div class="footer__bottom">
          <p>{{ tokens.LANDING.COPYRIGHT | translate }}</p>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./shared/landing-shared.css'],
  styles: `
    .footer {
      background-color: var(--clr-blue-900);
      color: var(--clr-white);
    }

    .footer__bottom {
      padding-block: 1.5rem;
      text-align: center;
    }

    .footer__top {
      position: relative;
      display: flex;
      justify-content: space-between;
      gap: 2rem;
      padding-block: 3rem;

      @media (width < 575px) {
        align-items: center;
        justify-content: center;
        flex-direction: column;
      }

      &::after {
        position: absolute;
        top: 100%;
        inset-inline-start: 0;
        width: 100%;
        height: 1px;
        background-color: rgba(255, 255, 255, 0.15);
        content: '';
      }
    }

    .footer__brand {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      @media (width < 575px) {
        align-items: center;
        justify-content: center;
      }

      p {
        color: var(--clr-gray-500);
      }
    }

    .footer__columns {
      display: flex;
      justify-content: space-around;
      flex: 1;
      gap: 2rem;

      @media (width < 575px) {
        width: 100%;
      }
    }

    .footer__column {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;

      a {
        color: var(--clr-gray-500);
        transition: color 0.2s var(--ease-standard);
      }

      a:hover {
        color: var(--clr-green-400);
      }

      a:focus-visible {
        outline: 2px solid var(--clr-green-400);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  protected readonly tokens = TRANSLATION_TOKENS;
  protected readonly productLinks = signal<ProductLinks[]>(productLinks).asReadonly();
}
