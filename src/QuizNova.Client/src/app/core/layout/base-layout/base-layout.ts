import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { SideBar } from '@Core/layout/sidebar/side-bar';
import { TopBar } from '@Core/layout/top-bar/top-bar';
import { distinctUntilChanged } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'qn-base-layout',
  imports: [RouterOutlet, TopBar, SideBar],
  template: `
    <section class="base-layout" [class.sidebar-open]="isSidebarOpen()">
      <qn-top-bar [isSidebarOpen]="isSidebarOpen()" (toggleMenu)="toggleSidebar()"></qn-top-bar>

      <div class="base-layout__body">
        @if (isMobile() && isSidebarOpen()) {
          <button
            class="base-layout__backdrop"
            (click)="toggleSidebar()"
            type="button"
            aria-label="Close sidebar"
            aria-controls="main-sidebar"
            aria-expanded="true"
          ></button>
        }

        <qn-side-bar
          class="base-layout__sidebar"
          id="main-sidebar"
          [class.opened]="isSidebarOpen()"
        ></qn-side-bar>

        <main class="base-layout__content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </section>
  `,
  styleUrl: './base-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseLayout {
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe(['(max-width: 767px)']).pipe(
      map((result) => result.matches),
      distinctUntilChanged(),
    ),
    { initialValue: false },
  );

  protected readonly isSidebarOpen = signal(true);

  constructor() {
    effect(() => {
      this.isSidebarOpen.set(!this.isMobile());
    });
  }

  protected toggleSidebar() {
    this.isSidebarOpen.update((state) => !state);
  }
}
