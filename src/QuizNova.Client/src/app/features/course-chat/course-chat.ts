import { Component, effect, inject, input } from '@angular/core';

import { YourCourses } from '@shared/components/your-courses/your-courses';

import { CourseChatStore } from './course-chat.store';
import { ChatFooter } from './ui/chat-footer/chat-footer';
import { ChatHeader } from './ui/chat-header/chat-header';
import { MessageWindow } from './ui/message-window/message-window';
import { NoCourseChatSelectedPlaceholder } from './ui/no-course-chat-selected-placeholder/no-course-chat-selected-placeholder';

@Component({
  selector: 'qn-course-chat',
  standalone: true,
  imports: [YourCourses, ChatFooter, ChatHeader, MessageWindow, NoCourseChatSelectedPlaceholder],
  providers: [CourseChatStore],
  template: `
    <div class="chat-layout">
      <aside class="sidebar-aside">
        <qn-your-courses></qn-your-courses>
      </aside>

      <main class="chat-viewport">
        @if (store.selectedCourseId()) {
          <div class="chat-room-container">
            <qn-chat-header />

            <qn-message-window />

            <qn-chat-footer />
          </div>
        } @else {
          <qn-no-course-chat-selected-placeholder />
        }
      </main>
    </div>
  `,
  styleUrl: './course-chat.css',
})
export class CourseChat {
  readonly store = inject(CourseChatStore);
  readonly courseId = input<string | null>(null);

  constructor() {
    effect(() => {
      this.store.init(this.courseId());
    });
  }
}
