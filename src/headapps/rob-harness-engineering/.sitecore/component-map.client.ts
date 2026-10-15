// Client-safe component map for App Router

import { BYOCClientWrapper, NextjsContentSdkComponent, FEaaSClientWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

import * as galleryLightbox from 'src/components/ImageGallery/galleryLightbox';
import * as galleryCarousel from 'src/components/ImageGallery/galleryCarousel';
import * as Header from 'src/components/Header/Header';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCClientWrapper],
  ['FEaaSWrapper', FEaaSClientWrapper],
  ['Form', Form],
  ['galleryLightbox', { ...galleryLightbox }],
  ['galleryCarousel', { ...galleryCarousel }],
  ['Header', { ...Header }],
]);

export default componentMap;
