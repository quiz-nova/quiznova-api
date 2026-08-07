import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  input,
  output,
  signal,
  inject,
} from '@angular/core';

@Component({
  selector: 'qn-quiz-countdown-tag',
  imports: [],
  template: `
    <span
      class="countdown"
      [class.countdown--expired]="isExpired()"
      [attr.aria-label]="ariaLabel()"
      role="timer"
    >
      <i class="fa-regular fa-clock" aria-hidden="true"></i>
      {{ timeLabel() }}
    </span>
  `,
  styleUrl: './quiz-countdown-tag.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizCountdownTag {
  readonly destroyRef = inject(DestroyRef);
  readonly endsAtUtc = input.required<string>();
  readonly serverUtc = input.required<string>();
  readonly expired = output<void>();

  private readonly nowMs = signal<number>(0);
  private hasEmittedExpired = false;

  protected readonly remainingSeconds = computed(() => {
    const endMs = new Date(this.endsAtUtc()).getTime();
    const nowMs = this.nowMs();

    if (!Number.isFinite(endMs) || !Number.isFinite(nowMs)) {
      return 0;
    }

    return Math.max(0, Math.floor((endMs - nowMs) / 1000));
  });

  protected readonly isExpired = computed(() => this.remainingSeconds() === 0);

  protected readonly timeLabel = computed(() => {
    const totalSeconds = this.remainingSeconds();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  protected readonly ariaLabel = computed(() => {
    if (this.isExpired()) {
      return 'Time is over';
    }

    return `Time remaining ${this.timeLabel()}`;
  });

  constructor() {
    effect(() => {
      const initialServerMs = new Date(this.serverUtc()).getTime();
      const startsAt = Number.isFinite(initialServerMs) ? initialServerMs : Date.now();

      this.nowMs.set(startsAt);
      this.hasEmittedExpired = false;

      const intervalId = window.setInterval(() => {
        this.nowMs.update((current) => current + 1000);
      }, 1000);

      this.destroyRef.onDestroy(() => {
        window.clearInterval(intervalId);
      });

      return () => {
        window.clearInterval(intervalId);
      };
    });

    effect(() => {
      if (this.isExpired() && !this.hasEmittedExpired) {
        this.hasEmittedExpired = true;
        this.expired.emit();
      }
    });
  }
}
