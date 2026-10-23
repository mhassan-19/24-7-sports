import type { ArticleSummary } from '@sports247/domain';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { paths, useFmt } from '../lib/locale';
import { useTheme } from '../lib/theme';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';

export function Thumb({ src, ratio = 16 / 9, rounded = 16 }: { src: string | null; ratio?: number; rounded?: number }) {
  const { c } = useTheme();
  const [failed, setFailed] = useState(false);
  return (
    <View style={{ aspectRatio: ratio, width: '100%', borderRadius: rounded, overflow: 'hidden', backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
      {src && !failed ? (
        <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} onError={() => setFailed(true)} />
      ) : (
        <Icon name="image" color={c.text3} size={30} />
      )}
    </View>
  );
}

export function NewsCard({ item, lead }: { item: ArticleSummary; lead?: boolean }) {
  const f = useFmt();
  return (
    <Pressable onPress={() => router.push(paths.article(item.id))} accessibilityRole="button" style={{ gap: 8 }}>
      <Thumb src={item.image} />
      <Text variant={lead ? 'h2' : 'title'} numberOfLines={3}>{item.title}</Text>
      <Text variant="caption" color="text2">{f.date(item.publishedAt)}</Text>
    </Pressable>
  );
}

export function NewsRow({ item }: { item: ArticleSummary }) {
  const f = useFmt();
  const { c } = useTheme();
  return (
    <Pressable onPress={() => router.push(paths.article(item.id))} accessibilityRole="button" style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line }}>
      <View style={{ width: 104 }}>
        <Thumb src={item.image} rounded={10} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="label" numberOfLines={3}>{item.title}</Text>
        <Text variant="caption" color="text2">{f.date(item.publishedAt)}</Text>
      </View>
    </Pressable>
  );
}

type Block = { kind: 'p' | 'h' | 'li'; text: string } | { kind: 'img'; src: string };

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)));

/**
 * Article HTML → plain text blocks (paragraphs, headings, list items, images). Rendering text, not
 * HTML, means scripts, styles and inline handlers from the CMS can never run in the app.
 */
export function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const re = /<(p|h[1-6]|li|img)\b([^>]*)>([\s\S]*?)(?:<\/\1>|(?=<(?:p|h[1-6]|li|img)\b)|$)/gi;
  const cleaned = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned))) {
    const tag = m[1]!.toLowerCase();
    if (tag === 'img') {
      const src = /src=["']([^"']+)["']/i.exec(m[2] ?? '')?.[1];
      if (src && /^https?:\/\//.test(src)) blocks.push({ kind: 'img', src });
      continue;
    }
    const text = decode((m[3] ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').trim();
    if (text) blocks.push({ kind: tag === 'li' ? 'li' : tag.startsWith('h') ? 'h' : 'p', text });
  }
  if (!blocks.length) {
    const text = decode(cleaned.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ kind: 'p', text });
  }
  return blocks;
}

export function ArticleBody({ html }: { html: string }) {
  const blocks = useMemo(() => htmlToBlocks(html), [html]);
  return (
    <View style={{ gap: 14 }}>
      {blocks.map((b, i) =>
        b.kind === 'img' ? (
          <Thumb key={i} src={b.src} />
        ) : (
          <Text key={i} variant={b.kind === 'h' ? 'h2' : 'body'} size={b.kind === 'h' ? undefined : 18} style={b.kind === 'p' || b.kind === 'li' ? { lineHeight: 30 } : undefined}>
            {b.kind === 'li' ? `• ${b.text}` : b.text}
          </Text>
        ),
      )}
    </View>
  );
}
