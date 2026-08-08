import {
  Directive,
  ElementRef,
  output,
  input,
  OnDestroy,
  inject,
  afterNextRender,
} from '@angular/core';

@Directive({
  selector: '[qnObserveVisibility]',
  standalone: true,
})
export class ObserveVisibilityDirective implements OnDestroy {
  private element = inject(ElementRef);

  threshold = input<number>(0);

  visible = output<boolean>();

  private observer: IntersectionObserver | undefined;

  constructor() {
    afterNextRender(() => {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          this.visible.emit(entry.isIntersecting);
        },
        {
          threshold: this.threshold(),
        },
      );

      this.observer.observe(this.element.nativeElement);
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
