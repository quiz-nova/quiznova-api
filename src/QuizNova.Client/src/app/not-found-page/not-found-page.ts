import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'qn-not-found-page',
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <h1>404</h1>
      <p>Page not found</p>
      <a routerLink="/">Go back to home</a>
    </section>
  `,
  styleUrl: './not-found-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
