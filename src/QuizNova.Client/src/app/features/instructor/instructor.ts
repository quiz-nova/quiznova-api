import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BaseLayout } from '@Core/layout/base-layout/base-layout';

@Component({
  selector: 'qn-instructor',
  imports: [BaseLayout],
  template: ` <qn-base-layout></qn-base-layout> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Instructor {}
