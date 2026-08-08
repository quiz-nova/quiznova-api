import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';

import { FadeInOnScrollDirective } from '@shared/directives/fade-in-on-scroll.directive';

import { FeatureCard, featureCards } from './feature-card';

@Component({
  selector: 'qn-features',
  imports: [FadeInOnScrollDirective, FeatureCard, TranslatePipe],
  template: `
    <section class="features" id="features">
      <div class="container">
        <article class="section-heading">
          <h2 qnFadeInOnScroll>
            {{ tokens.LANDING.FEATURES_TITLE | translate }}
          </h2>
          <p [delay]="100" qnFadeInOnScroll>
            {{ tokens.LANDING.HERO_SUBTITLE | translate }}
          </p>
        </article>
        <div class="cards">
          @for (feature of cards(); track feature.id; let i = $index) {
            <qn-feature-card [delay]="i * 50" qnFadeInOnScroll>
              <i [class]="feature.icon"></i>
              <h3 class="card-title">{{ feature.title }}</h3>
              <p class="card-content">{{ feature.content }}</p>
            </qn-feature-card>
          }
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./shared/landing-shared.css'],
  styles: `
    .features {
      padding-block: 5rem;
      background-color: var(--clr-gray-100);
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(350px, 100%), 1fr));
      gap: 1.5rem;
    }

    .cards qn-feature-card .card-title {
      font-size: var(--fs-500);
    }

    .cards qn-feature-card .card-content {
      color: var(--clr-gray-600);
      font-size: var(--fs-400);
      word-spacing: 3px;
    }

    .accent-word {
      color: var(--clr-green-400);
    }

    .cards qn-feature-card i {
      color: var(--clr-green-400);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Features {
  protected readonly tokens = TRANSLATION_TOKENS;
  protected readonly cards = signal(featureCards).asReadonly();
}
