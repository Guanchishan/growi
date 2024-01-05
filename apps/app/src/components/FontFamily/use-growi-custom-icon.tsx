import localFont from 'next/font/local';

import { DefineStyle } from './types';

const growiCustomIconFont = localFont({
  src: '../../../../../packages/custom-icons/dist/growi-custom-icon.woff2',
});

export const useGrowiCustomIcon: DefineStyle = () => (
  <style jsx global>
    {`
      :root {
        --grw-font-family-custom-icon: ${growiCustomIconFont.style.fontFamily};
      }
    `}
  </style>
);
