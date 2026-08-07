import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BaseLayout } from '@Core/layout/base-layout/base-layout';

@Component({
  selector: 'qn-student',
  imports: [BaseLayout],
  template: ` <qn-base-layout></qn-base-layout> `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Student {}
