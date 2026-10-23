import { router } from 'expo-router';
import { paths, useFmt } from '../../src/lib/locale';
import { Icon, type IconName } from '../../src/ui/Icon';
import { Card, Row, Screen } from '../../src/ui/primitives';
import { Text } from '../../src/ui/Text';

export default function More() {
  const f = useFmt();
  const items: { to: string; icon: IconName; label: string }[] = [
    { to: paths.transfers(), icon: 'swap', label: f.t('nav.transfers') },
    { to: paths.games(), icon: 'games', label: f.t('nav.games') },
    { to: paths.settings(), icon: 'gear', label: f.t('nav.settings') },
  ];
  return (
    <Screen top title={f.t('nav.more')}>
      <Card>
        {items.map((i, idx) => (
          <Row key={i.to} last={idx === items.length - 1} onPress={() => router.push(i.to as never)} label={i.label} lead={<Icon name={i.icon} />} trail={<Icon name="chevron" />}>
            <Text variant="title">{i.label}</Text>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
