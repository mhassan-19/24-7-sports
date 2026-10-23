import { router } from 'expo-router';
import { useFmt } from '../src/lib/locale';
import { Button, Screen } from '../src/ui/primitives';
import { EmptyState } from '../src/ui/states';

export default function NotFound() {
  const f = useFmt();
  return (
    <Screen>
      <EmptyState message={f.t('states.notFound')} action={<Button onPress={() => router.replace('/')}>{f.t('states.goHome')}</Button>} />
    </Screen>
  );
}
