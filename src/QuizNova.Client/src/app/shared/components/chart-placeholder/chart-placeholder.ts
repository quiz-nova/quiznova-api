import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'qn-chart-placeholder',
  imports: [TranslatePipe],
  template: `
    <div class="chart-placeholder">
      <span class="chart-placeholder-text">{{ tokens.COMMON.LOADING_CHART | translate }}</span>
    </div>
  `,
  styleUrl: './chart-placeholder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartPlaceholder {
  protected readonly tokens = TRANSLATION_TOKENS;
}
