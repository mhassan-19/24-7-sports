import { useLocation } from 'react-router';
import { env } from '../env';
import { useFmt } from '../lib/locale';

/**
 * Per-route document metadata. React 19 hoists <title>, <meta> and <link> into <head>.
 */
export function Seo({ title, description }: { title: string; description?: string }) {
  const { t, lang } = useFmt();
  const { pathname } = useLocation();
  const origin = env.siteUrl || window.location.origin;
  const full = `${title} | ${t('app.name')}`;
  const desc = description || t('seo.homeDescription');
  return (
    <>
      <title>{full}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={`${origin}${pathname}`} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={lang === 'ar' ? 'ar_EG' : 'en_GB'} />
      <meta property="og:url" content={`${origin}${pathname}`} />
    </>
  );
}
