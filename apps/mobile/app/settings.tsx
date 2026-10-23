import { LANGS, dirOf, type Lang } from '@sports247/i18n';
import { I18nManager, Pressable, View } from 'react-native';
import { env } from '../src/env';
import { syncDirection, useFmt } from '../src/lib/locale';
import { usePrefs, type ThemePref } from '../src/lib/prefs';
import { useTheme } from '../src/lib/theme';
import { Card, KeyValues, Screen, Section } from '../src/ui/primitives';
import { Text } from '../src/ui/Text';

const LANG_NAMES: Record<Lang, string> = { ar: 'العربية', en: 'English' };

function Radio<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  const { c } = useTheme();
  return (
    <Card>
      <View accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o, i) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 52,
                paddingHorizontal: 14,
                borderBottomWidth: i === options.length - 1 ? 0 : 1,
                borderBottomColor: c.line,
                backgroundColor: pressed ? c.surface2 : 'transparent',
              })}
            >
              <Text variant="title" style={{ flex: 1 }}>{o.label}</Text>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? c.accent : c.text3, alignItems: 'center', justifyContent: 'center' }}>
                {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent }} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

export default function SettingsScreen() {
  const f = useFmt();
  const { theme, setTheme, setLang } = usePrefs();
  const langs = LANGS.filter((l) => l === 'ar' || env.englishEnabled);

  const switchLang = (lang: Lang) => {
    setLang(lang);
    // Layout direction is fixed at startup; flip it (and reload in development) when it changes.
    syncDirection(lang);
  };

  return (
    <Screen title={f.t('settings.title')}>
      <Section title={f.t('settings.theme')}>
        <Radio<ThemePref>
          label={f.t('settings.theme')}
          value={theme}
          onChange={setTheme}
          options={(['dark', 'light', 'system'] as ThemePref[]).map((t) => ({ value: t, label: f.t(`settings.${t}`) }))}
        />
      </Section>
      {langs.length > 1 ? (
        <Section title={f.t('settings.language')}>
          <Radio<Lang> label={f.t('settings.language')} value={f.lang} onChange={switchLang} options={langs.map((l) => ({ value: l, label: LANG_NAMES[l] }))} />
          {I18nManager.isRTL !== (dirOf(f.lang) === 'rtl') ? (
            <Text variant="small" color="text2" accessibilityLiveRegion="polite">
              {f.t('settings.restartToApply')}
            </Text>
          ) : null}
        </Section>
      ) : null}
      <Section title={f.t('settings.about')}>
        <KeyValues
          items={[
            { label: f.t('settings.version'), value: f.digits(env.version) },
            { label: f.t('settings.environment'), value: `${env.appEnv.toUpperCase()}${env.readOnly ? ' · READ-ONLY' : ''}` },
            { label: f.t('settings.source'), value: new URL(env.apiBaseUrl).host },
          ]}
        />
      </Section>
    </Screen>
  );
}
