import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'qn-no-course-chat-selected-placeholder',
  standalone: true,
  template: `
    <div class="select-course-placeholder">
      <div class="placeholder-card">
        <div class="placeholder-icon">
          <i class="fa-solid fa-comments"></i>
        </div>
        <h3>Course Chat Rooms</h3>
        <p>
          Select a course from the sidebar to join its active chat room and connect with classmates
          and instructors.
        </p>
      </div>
    </div>
  `,
  styleUrl: './no-course-chat-selected-placeholder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoCourseChatSelectedPlaceholder {}
