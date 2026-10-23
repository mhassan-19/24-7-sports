import { useArticle } from '@sports247/data';
import type { Tag } from '@sports247/domain';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { ArticleBody, NewsRow, Thumb } from '../../src/features/news';
import { paths, useFmt } from '../../src/lib/locale';
import { Chip, Chips, Screen, Section } from '../../src/ui/primitives';
import { QueryView, Skeleton } from '../../src/ui/states';
import { Text } from '../../src/ui/Text';

export default function ArticleScreen() {
  const f = useFmt();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const article = useArticle(id);
  const tagPath = (t: Tag) =>
    t.kind === 'team' ? paths.team(t.id) : t.kind === 'player' ? paths.player(t.id) : t.kind === 'competition' ? paths.competition(t.id) : null;

  return (
    <Screen title={f.t('nav.news')} onRefresh={() => article.refetch()}>
      <QueryView query={article} skeleton={<Skeleton rows={5} height={80} />}>
        {(a) => (
          <>
            <Text variant="h1" style={{ textTransform: 'none' }}>{a.title}</Text>
            <Text variant="caption" color="text2">{`${f.date(a.publishedAt)} · ${f.tn('common.views', a.views)}`}</Text>
            {a.image ? <Thumb src={a.image} /> : null}
            <ArticleBody html={a.bodyHtml} />
            {a.tags.some(tagPath) ? (
              <Chips>
                {a.tags.map((t) => {
                  const to = tagPath(t);
                  return to ? <Chip key={`${t.kind}-${t.id}`} onPress={() => router.push(to)}>{t.title}</Chip> : null;
                })}
              </Chips>
            ) : null}
            {a.related.length ? (
              <Section title={f.t('news.related')}>
                <View>{a.related.slice(0, 5).map((r) => <NewsRow key={r.id} item={r} />)}</View>
              </Section>
            ) : null}
          </>
        )}
      </QueryView>
    </Screen>
  );
}
