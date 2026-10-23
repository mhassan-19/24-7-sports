import { crestInitials } from '@sports247/domain';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFmt } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useTheme } from '../lib/theme';
import { Logo, Slash } from './brand';
import { Icon, type IconName } from './Icon';
import { OfflineBanner } from './states';
import { Text } from './Text';

export const GUTTER = 16;

/** Screen scaffold: brand top bar, offline banner, scrolling content with pull-to-refresh. */
export function Screen({
  title,
  top,
  children,
  onRefresh,
  scroll = true,
}: {
  title?: string;
  /** Tab roots show the logomark instead of a back button. */
  top?: boolean;
  children: ReactNode;
  onRefresh?: () => Promise<unknown>;
  scroll?: boolean;
}) {
  const { c } = useTheme();
  // Tab roots end above the tab bar; other screens draw edge to edge, so keep clear of the
  // system navigation bar.
  const insets = useSafeAreaInsets();
  const bottom = top ? 0 : insets.bottom;
  const [refreshing, setRefreshing] = useState(false);
  const refresh = onRefresh
    ? async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    : undefined;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={title} top={top} />
      <OfflineBanner />
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ padding: GUTTER, gap: 24, paddingBottom: 40 + bottom }}
          refreshControl={refresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accent} colors={[c.accent]} /> : undefined}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingBottom: bottom }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function TopBar({ title, top }: { title?: string; top?: boolean }) {
  const f = useFmt();
  const { c } = useTheme();
  const { theme, setTheme } = usePrefs();
  const isDark = useTheme().name === 'dark';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 56,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: c.line,
        backgroundColor: c.bg,
      }}
    >
      {top ? (
        <View style={{ paddingHorizontal: 8 }}>
          <Logo layout="mark" width={48} />
        </View>
      ) : (
        <IconButton icon="back" label={f.t('nav.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      )}
      <Text variant="h2" numberOfLines={1} style={{ flex: 1 }}>
        {title ?? ''}
      </Text>
      <IconButton icon="search" label={f.t('nav.search')} onPress={() => router.push('/search')} />
      <IconButton
        icon={isDark ? 'sun' : 'moon'}
        label={f.t('common.theme')}
        onPress={() => setTheme(theme === 'system' ? (isDark ? 'light' : 'dark') : isDark ? 'light' : 'dark')}
      />
    </View>
  );
}

export function IconButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.surface2 : 'transparent' })}
    >
      <Icon name={icon} />
    </Pressable>
  );
}

export function Section({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityRole="header">
          <Slash />
          <Text variant="h2" style={{ flex: 1 }}>
            {title}
          </Text>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function LinkText({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8}>
      <Text variant="label" color="accentText">
        {children}
      </Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c, radius } = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderRadius: radius.card, overflow: 'hidden' }, style]}>{children}</View>;
}

/** One list row: leading visual, content, trailing value. Pressable when `onPress` is set. */
export function Row({
  lead,
  children,
  trail,
  onPress,
  label,
  last,
}: {
  lead?: ReactNode;
  children: ReactNode;
  trail?: ReactNode;
  onPress?: () => void;
  label?: string;
  last?: boolean;
}) {
  const { c } = useTheme();
  const body = (
    <>
      {lead}
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      {trail}
    </>
  );
  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: c.line,
  };
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [style, pressed && { backgroundColor: c.surface2 }]}>
      {body}
    </Pressable>
  ) : (
    <View style={style}>{body}</View>
  );
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled,
}: {
  children: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark';
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const bg = variant === 'primary' ? c.accent : variant === 'dark' ? c.brand.midnight : 'transparent';
  const fg = variant === 'primary' ? 'onAccent' : variant === 'ghost' ? 'accentText' : 'text';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        backgroundColor: bg,
        borderWidth: variant === 'secondary' ? 1.5 : 0,
        borderColor: c.text,
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
      })}
    >
      <Text variant="label" color={fg} style={variant === 'dark' ? { color: c.brand.bone } : undefined}>
        {children}
      </Text>
    </Pressable>
  );
}

/** Segmented control (day tabs, entity tabs, leader kinds). Scrolls when it doesn't fit. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const { c } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View accessibilityRole="tablist" style={{ flex: 1, flexDirection: 'row', gap: 4, padding: 4, borderRadius: 12, backgroundColor: c.surface2 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(o.value)}
              style={{ flexGrow: 1, minHeight: 40, paddingHorizontal: 14, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.surfaceSel : 'transparent' }}
            >
              <Text variant="label" color={on ? 'text' : 'text2'} numberOfLines={1}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
      {children}
    </ScrollView>
  );
}

export function Chip({ children, pressed, onPress, lead }: { children: string; pressed?: boolean; onPress: () => void; lead?: ReactNode }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: pressed }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 38,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: pressed ? c.text : c.line,
        backgroundColor: pressed ? c.text : 'transparent',
      }}
    >
      {lead}
      <Text variant="label" style={{ color: pressed ? c.bg : c.text2 }} numberOfLines={1}>
        {children}
      </Text>
    </Pressable>
  );
}

/** A logo inside a neutral chip; initials when there is no image or it fails to load. */
export function Crest({ name, shortName, logo, size = 28 }: { name: string; shortName?: string | null; logo?: string | null; size?: number }) {
  const { c } = useTheme();
  const [failed, setFailed] = useState(false);
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ width: size, height: size, borderRadius: size / 4, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      {logo && !failed ? (
        <Image source={{ uri: logo }} style={{ width: size * 0.8, height: size * 0.8 }} contentFit="contain" onError={() => setFailed(true)} />
      ) : (
        <Text variant="num" size={size * 0.38} color="text2">
          {crestInitials(name, shortName)}
        </Text>
      )}
    </View>
  );
}

export function Avatar({ name, image, size = 40 }: { name: string; image?: string | null; size?: number }) {
  const { c } = useTheme();
  const [failed, setFailed] = useState(false);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {image && !failed ? (
        <Image source={{ uri: image }} style={{ width: size, height: size }} contentFit="cover" onError={() => setFailed(true)} />
      ) : (
        <Text variant="label" color="text2">
          {name.trim().charAt(0)}
        </Text>
      )}
    </View>
  );
}

export function Badge({ children, accent }: { children: string; accent?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: accent ? c.accent : c.line, backgroundColor: accent ? c.accent : 'transparent' }}>
      <Text variant="caption" color={accent ? 'onAccent' : 'text2'}>
        {children}
      </Text>
    </View>
  );
}

export function Tiles({ items }: { items: { label: string; value: string; accent?: boolean }[] }) {
  const { c, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {items.map((i) => (
        <View key={i.label} style={{ flexBasis: '47%', flexGrow: 1, padding: 14, gap: 2, borderRadius: radius.card, backgroundColor: c.surface }}>
          <Text variant="num" size={30} weight={800} color={i.accent ? 'accentText' : 'text'}>
            {i.value}
          </Text>
          <Text variant="small" color="text2">
            {i.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function KeyValues({ items }: { items: { label: string; value: string }[] }) {
  return (
    <Card style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
      {items.map((i) => (
        <View key={i.label} style={{ flexBasis: '50%', gap: 2 }}>
          <Text variant="caption" color="text2">
            {i.label}
          </Text>
          <Text variant="label">{i.value}</Text>
        </View>
      ))}
    </Card>
  );
}

export function Eyebrow({ children }: { children: string }) {
  return (
    <Text variant="eyebrow" color="accentText">
      {children}
    </Text>
  );
}
