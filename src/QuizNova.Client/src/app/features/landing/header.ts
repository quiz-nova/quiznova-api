import {
  ChangeDetectionStrategy,
  Component,
  computed,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button } from 'primeng/button';

import { Logo } from '@shared/components/logo/logo';

export interface HeaderLink {
  id: number;
  label: string; // Name Will Appear To The User
  name: string; // Name We Will Use In HTML attribute
}
export const headerLinks: HeaderLink[] = [
  { id: 1, label: 'Features', name: 'features' },
  { id: 2, label: 'About', name: 'about' },
  { id: 3, label: 'Contact', name: 'contact' },
];

@Component({
  selector: 'qn-header',
  imports: [RouterLink, Logo, Button],
  template: `
    <div class="container">
      <header>
        <qn-logo />

        <button
          class="icon"
          [attr.aria-label]="menuClicked() ? 'Close menu' : 'Open menu'"
          [attr.aria-expanded]="menuClicked()"
          (click)="onClick()"
          type="button"
        >
          <i class="fa-solid" [class.fa-bars]="!menuClicked()" [class.fa-xmark]="menuClicked()"></i>
        </button>

        <nav class="links header__panel" [class.menu-open]="activateBurgerIcon() && menuClicked()">
          @for (link of sortedLinks(); track link.id) {
            <a [attr.href]="'#' + link.name">{{ link.label }}</a>
          }
        </nav>

        <div
          class="buttons header__panel"
          [class.menu-open]="activateBurgerIcon() && menuClicked()"
        >
          <p-button
            [outlined]="true"
            label="Log in"
            routerLink="/auth/login"
            severity="secondary"
            type="button"
          />
        </div>
      </header>
    </div>
  `,
  styleUrls: ['./shared/landing-shared.css'],
  styles: `
    :host {
      position: sticky;
      top: 0;
      z-index: 1000;
      display: block;
      background-color: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02);

      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--clr-gray-200), transparent);
      }
    }

    header {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 4.5rem;
      padding-inline: 1rem;
      font-family: var(--ff-heading), serif;

      @media (width < 768px) {
        flex-wrap: wrap;
        height: auto;
        padding-block: 1rem;
      }
    }

    nav {
      display: flex;
      align-items: center;
      gap: 2rem;

      @media (width < 768px) {
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        margin-left: 0;
      }
    }

    a {
      color: var(--clr-gray-600);
      font-weight: 500;
      border-radius: var(--radius-sm);
      transition:
        color 0.25s var(--ease-standard),
        transform 0.25s var(--ease-standard);

      @media (width < 768px) {
        padding-left: 1rem;
      }

      &:hover {
        color: var(--clr-green-400);
        transform: translateY(-1px);
      }

      &:focus-visible {
        outline: 2px solid var(--clr-green-400);
        outline-offset: 2px;
      }
    }

    .header__panel {
      @media (width < 768px) {
        width: 100%;
        display: none;
        opacity: 0;
        padding-inline: 1rem;
        background-color: var(--clr-transparent);
        transition: opacity 0.2s var(--ease-standard);
      }

      &.menu-open {
        @media (width < 768px) {
          display: flex;
          opacity: 1;
          padding-block: 1rem;
        }
      }
    }

    .buttons {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      @media (width < 768px) {
        justify-content: space-evenly;
        width: 100%;
      }

      button {
        min-height: auto;
        padding: 0.5rem 1.25rem;

        @media (width < 768px) {
          width: 40%;
        }
      }
    }

    .icon {
      display: none;
      padding: 0;
      border: 0;
      background: var(--clr-transparent);
      cursor: pointer;

      @media (width < 768px) {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        font-size: var(--fs-600);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnInit, OnDestroy {
  private readonly media = window.matchMedia('(width <= 767px)');
  protected readonly activateBurgerIcon = signal(this.media.matches);
  protected readonly headerLinks = signal<HeaderLink[]>(headerLinks).asReadonly();
  protected readonly menuClicked = signal(false);

  private readonly onMediaChange = (e: MediaQueryListEvent) => {
    this.activateBurgerIcon.set(e.matches);
    this.menuClicked.set(false);
  };

  ngOnInit(): void {
    this.media.addEventListener('change', this.onMediaChange);
  }

  ngOnDestroy(): void {
    this.media.removeEventListener('change', this.onMediaChange);
  }

  sortedLinks = computed(() => [...this.headerLinks()].sort((a, b) => a.id - b.id));

  onClick() {
    if (!this.activateBurgerIcon()) {
      return;
    }

    this.menuClicked.update((oldValue) => !oldValue);
  }
}
