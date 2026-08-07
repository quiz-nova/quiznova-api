import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Button } from 'primeng/button';

import { FadeInOnScrollDirective } from '@shared/directives/fade-in-on-scroll.directive';

@Component({
  selector: 'qn-about',
  imports: [FadeInOnScrollDirective, Button],
  template: `
    <section class="about" id="about">
      <div class="container">
        <article class="section-heading">
          <h2 appFadeInOnScroll>Built for educators and students</h2>
          <p appFadeInOnScroll>
            QuizNova simplifies the entire assessment lifecycle — from quiz creation and real-time
            exams to grade review and course communication. Whether you're an admin managing
            courses, an instructor creating quizzes, or a student taking them, QuizNova gives every
            role a tailored experience designed around their needs.
          </p>
        </article>
        <div class="about-cta" appFadeInOnScroll>
          <p-button label="Join QuizNova today" severity="success" type="button" />
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
export class About {}
