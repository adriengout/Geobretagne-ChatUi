import type React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'geor-header': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'active-app'?: string;
        'config-file'?: string;
        'logo-url'?: string;
        'legacy-header'?: string;
        'legacy-url'?: string;
        'height'?: string;
        'stylesheet'?: string;
      };
    }
  }
}
