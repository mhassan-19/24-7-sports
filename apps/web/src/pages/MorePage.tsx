import { usePaths, useFmt } from '../lib/locale';
import { Icon, type IconName } from '../ui/Icon';
import { List, Row } from '../ui/primitives';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

/** Phone navigation overflow: the sections that don't fit the bottom tab bar. */
export default function MorePage() {
  const f = useFmt();
  const paths = usePaths();
  const items: { to: string; icon: IconName; label: string }[] = [
    { to: paths.transfers(), icon: 'swap', label: f.t('nav.transfers') },
    { to: paths.games(), icon: 'games', label: f.t('nav.games') },
    { to: paths.settings(), icon: 'gear', label: f.t('nav.settings') },
  ];
  return (
    <div className={`${p.stack} ${p.narrow}`}>
      <Seo title={f.t('nav.more')} />
      <h1 className="sr-only">{f.t('nav.more')}</h1>
      <List>
        {items.map((i) => (
          <Row key={i.to} to={i.to} lead={<Icon name={i.icon} />} trail={<Icon name="chevron" />}>
            <b>{i.label}</b>
          </Row>
        ))}
      </List>
    </div>
  );
}
