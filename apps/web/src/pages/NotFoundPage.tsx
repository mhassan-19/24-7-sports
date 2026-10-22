import { usePaths, useFmt } from '../lib/locale';
import { Button } from '../ui/primitives';
import { EmptyState } from '../ui/states';
import { Seo } from '../ui/Seo';

export default function NotFoundPage() {
  const f = useFmt();
  const paths = usePaths();
  return (
    <>
      <Seo title={f.t('states.notFound')} />
      <meta name="robots" content="noindex" />
      <EmptyState heading message={f.t('states.notFound')} action={<Button to={paths.home()}>{f.t('states.goHome')}</Button>} />
    </>
  );
}
