import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ROLE_DEFINITIONS } from '@Core/config/role.config';
import { Tab } from '@Core/layout/sidebar/tab';
import { TabGroup } from '@Core/layout/sidebar/tab-group';
import { AuthService } from '@Features/auth/auth.service';

import { Logo } from '@shared/components/logo/logo';
import { User } from '@shared/models/users/user.model';

@Component({
  selector: 'qn-side-bar',
  imports: [Logo, TabGroup, Tab],
  template: `
    <aside class="side-bar" aria-label="Sidebar">
      <qn-logo />

      <p class="user-role">{{ currentUser()?.role }}</p>

      <qn-tab-group>
        @for (action of roleActions(); track action) {
          <qn-tab [tabName]="action"></qn-tab>
        }
      </qn-tab-group>
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .side-bar {
        display: grid;
        align-content: start;
        gap: 2rem;
        min-height: 100%;
        padding: 1.75rem 1.25rem;
        background-color: var(--clr-white);
        border-right: 1px solid var(--clr-gray-200);
        width: 100%;
      }

      .user-role {
        color: var(--clr-gray-600);
        font-size: 0.9rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBar {
  private readonly authService = inject(AuthService);

  protected readonly currentUser = computed<User | null>(() => this.authService.currentUser());

  protected readonly roleActions = computed<string[]>(() => {
    const role = this.currentUser()?.role;
    return role ? [...ROLE_DEFINITIONS[role].actions] : [];
  });
}
