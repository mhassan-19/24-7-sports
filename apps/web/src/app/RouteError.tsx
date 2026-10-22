import { useRouteError } from 'react-router';
import { Button } from '../ui/primitives';

/**
 * Last-resort boundary for a route that failed to render or load (e.g. a chunk failed to
 * download after a deploy). Rendered outside the locale provider, so copy is bilingual.
 */
export function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <div style={{ display: 'grid', gap: 16, placeItems: 'center', padding: '64px 16px', textAlign: 'center' }} role="alert">
      <p dir="rtl" lang="ar">
        حدث خطأ غير متوقع. أعد تحميل الصفحة.
      </p>
      <p dir="ltr" lang="en">
        Something went wrong. Reload the page.
      </p>
      <Button variant="secondary" onClick={() => window.location.reload()}>
        ↻
      </Button>
    </div>
  );
}
