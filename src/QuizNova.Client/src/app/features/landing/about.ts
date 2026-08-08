import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';

import { FadeInOnScrollDirective } from '@shared/directives/fade-in-on-scroll.directive';

@Component({
  selector: 'qn-about',
  imports: [FadeInOnScrollDirective, Button, TranslatePipe],
  template: `
    <section class="about" id="about">
      <div class="container">
        <article class="section-heading">
          <h2 qnFadeInOnScroll>{{ tokens.LANDING.ABOUT_TITLE | translate }}</h2>
          <p qnFadeInOnScroll>
            {{ tokens.LANDING.HERO_SUBTITLE | translate }}
          </p>
        </article>
        <div class="about-cta" qnFadeInOnScroll>
          <p-button
            [label]="tokens.LANDING.GET_STARTED | translate"
            severity="success"
            type="button"
          />
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./shared/landing-shared.css'],
  styles: `
    .about {
      padding-block: 5rem;
      background-color: var(--clr-gray-100);
    }

    .about-cta {
      display: flex;
      justify-content: center;
      padding-top: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  protected readonly tokens = TRANSLATION_TOKENS;
}
