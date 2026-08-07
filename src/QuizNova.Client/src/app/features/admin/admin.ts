import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BaseLayout } from '@Core/layout/base-layout/base-layout';

@Component({
  selector: 'qn-admin',
  imports: [BaseLayout],
  template: ` <qn-base-layout></qn-base-layout> `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {}
