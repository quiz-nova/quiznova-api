import { Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';

@Directive({
  selector: '[qnFadeInOnScroll]',
  standalone: true,
  host: {
    class: 'fade-in',
  },
})
export class FadeInOnScrollDirective implements OnDestroy {
  private el = inject(ElementRef).nativeElement;
  private observer: IntersectionObserver | null = null;
  private timeoutId: number | null = null;

  threshold = input<number>(0.2);
  delay = input<number>(0);

  constructor() {
    effect(() => {
      this.cleanup();

      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            this.timeoutId = setTimeout(() => {
              this.el.classList.add('appear');
            }, this.delay());

            this.observer?.unobserve(this.el);
          }
        },
        { threshold: this.threshold() },
      );

      this.observer.observe(this.el);
    });
  }

  private cleanup() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.observer) this.observer.disconnect();
  }

  ngOnDestroy() {
    this.cleanup();
  }
}
