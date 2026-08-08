import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

import { APP_SETTINGS, appSettings, validateSettings } from '@Core/config/app.settings';
import { authInterceptor } from '@Core/interceptors/auth.interceptor';
import { LanguageService } from '@Core/services/language.service';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';

const QuizNovaPreset = definePreset(Aura, {
  primitive: {
    fontFamily: "'Inter', sans-serif",
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '5px',
      md: '10px',
      lg: '15px',
      xl: '20px',
    },
  },
  semantic: {
    primary: {
      50: 'var(--clr-green-50)',
      100: 'var(--clr-green-100)',
      200: 'var(--clr-green-200)',
      300: 'var(--clr-green-300)',
      400: 'var(--clr-green-400)',
      500: 'var(--clr-green-400)',
      600: 'var(--clr-green-600)',
      700: 'var(--clr-green-700)',
      800: 'var(--clr-green-800)',
      900: 'var(--clr-green-800)',
    },
    green: {
      50: 'var(--clr-green-50)',
      100: 'var(--clr-green-100)',
      200: 'var(--clr-green-200)',
      300: 'var(--clr-green-300)',
      400: 'var(--clr-green-400)',
      500: 'var(--clr-green-400)',
      600: 'var(--clr-green-600)',
      700: 'var(--clr-green-700)',
      800: 'var(--clr-green-800)',
      900: 'var(--clr-green-800)',
    },
    emerald: {
      50: 'var(--clr-green-50)',
      100: 'var(--clr-green-100)',
      200: 'var(--clr-green-200)',
      300: 'var(--clr-green-300)',
      400: 'var(--clr-green-400)',
      500: 'var(--clr-green-400)',
      600: 'var(--clr-green-600)',
      700: 'var(--clr-green-700)',
      800: 'var(--clr-green-800)',
      900: 'var(--clr-green-800)',
    },
    success: {
      50: 'var(--clr-green-50)',
      100: 'var(--clr-green-100)',
      200: 'var(--clr-green-200)',
      300: 'var(--clr-green-300)',
      400: 'var(--clr-green-400)',
      500: 'var(--clr-green-400)',
      600: 'var(--clr-green-600)',
      700: 'var(--clr-green-700)',
      800: 'var(--clr-green-800)',
      900: 'var(--clr-green-800)',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.400}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.800}',
        },
        success: {
          color: '{success.400}',
          contrastColor: '#ffffff',
          hoverColor: '{success.600}',
          activeColor: '{success.800}',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: QuizNovaPreset,
        options: {
          darkModeSelector: false,
          cssLayer: false,
        },
      },
    }),
    MessageService,
    {
      provide: APP_SETTINGS,
      useValue: appSettings,
    },
    provideAppInitializer(() => validateSettings(appSettings)),
    provideAppInitializer(() => inject(LanguageService).initLanguage()),
    provideTranslateService({
      lang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
    }),
  ],
};
