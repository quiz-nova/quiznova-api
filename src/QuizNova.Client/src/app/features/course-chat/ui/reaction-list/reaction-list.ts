import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { Message, Reaction } from '@shared/models/chat/chat.model';

import { CourseChatStore } from '../../course-chat.store';

@Component({
  selector: 'qn-reaction-list',
  standalone: true,
  template: `
    @if (groups().length > 0) {
      <div class="reactions-list">
        @for (group of groups(); track group.emoji) {
          <button
            class="reaction-badge"
            [class.user-reacted]="group.hasReacted"
            (click)="store.toggleReaction(message().id, group.emoji)"
          >
            <span class="emoji">{{ group.emoji }}</span>
            <span class="count">{{ group.count }}</span>
          </button>
        }
      </div>
    }
  `,
  styleUrl: './reaction-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactionList {
  readonly store = inject(CourseChatStore);
  readonly message = input.required<Message>();

  readonly groups = computed(() => {
    const groups: Record<string, Reaction[]> = {};
    this.message().reacts.forEach((r) => {
      if (!groups[r.emoji]) {
        groups[r.emoji] = [];
      }
      groups[r.emoji].push(r);
    });

    return Object.keys(groups).map((emoji) => ({
      emoji,
      count: groups[emoji].length,
      hasReacted: groups[emoji].some((r) => r.reactorId === this.store.userId()),
    }));
  });
}
