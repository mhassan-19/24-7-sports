import { LANGS, type Lang } from '@sports247/i18n';
import { useLocation, useNavigate } from 'react-router';
import { env } from '../env';
import { useFmt } from '../lib/locale';
import { usePrefs, type ThemePref } from '../lib/prefs';
import { H1, KeyValues, Section } from '../ui/primitives';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

const LANG_NAMES: Record<Lang, string> = { ar: 'العربية', en: 'English' };

export default function SettingsPage() {
  const f = useFmt();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = usePrefs();
  const langs = LANGS.filter((l) => l === 'ar' || env.englishEnabled);

  const switchLang = (lang: Lang) => {
    const rest = location.pathname.split('/').slice(2).join('/');
    navigate(`/${lang}/${rest}${location.search}`, { replace: true });
  };

  return (
    <div className={`${p.stack} ${p.narrow}`} style={{ gap: 28 }}>
      <Seo title={f.t('seo.settings')} />
      <H1 upper>{f.t('settings.title')}</H1>
      <Section title={f.t('settings.theme')}>
        <fieldset className={p.radios} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="sr-only">{f.t('settings.theme')}</legend>
          {(['dark', 'light', 'system'] as ThemePref[]).map((t) => (
            <label key={t} className={p.radio}>
              {f.t(`settings.${t}`)}
              <input type="radio" name="theme" value={t} checked={theme === t} onChange={() => setTheme(t)} />
            </label>
          ))}
        </fieldset>
      </Section>
      {langs.length > 1 && (
        <Section title={f.t('settings.language')}>
          <fieldset className={p.radios} style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="sr-only">{f.t('settings.language')}</legend>
            {langs.map((l) => (
              <label key={l} className={p.radio} lang={l}>
                {LANG_NAMES[l]}
                <input type="radio" name="lang" value={l} checked={f.lang === l} onChange={() => switchLang(l)} />
              </label>
            ))}
          </fieldset>
        </Section>
      )}
      <Section title={f.t('settings.about')}>
        <KeyValues
          items={[
            { label: f.t('settings.version'), value: <span className="num">{f.digits(env.version)}</span> },
            { label: f.t('settings.environment'), value: env.appEnv.toUpperCase() },
            { label: f.t('settings.source'), value: <bdi dir="ltr">{new URL(env.apiBaseUrl).host}</bdi> },
          ]}
        />
      </Section>
    </div>
  );
}
