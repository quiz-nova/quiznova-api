import { ChangeDetectionStrategy, Component } from '@angular/core';

import { About } from './about';
import { Contact } from './contact';
import { Features } from './features';
import { Header } from './header';
import { Hero } from './hero';

@Component({
  selector: 'qn-landing',
  imports: [Contact, About, Features, Hero, Header],
  template: `
    <qn-header></qn-header>
    <qn-hero></qn-hero>
    <qn-features></qn-features>
    <qn-about></qn-about>
    <qn-contact></qn-contact>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {}
