import { useDayMatches, useLeaderBoards, useStandings, useTopStories } from '@sports247/data';
import { useState } from 'react';
import { MatchGroups } from '../features/match/MatchRow';
import { LeaderList, StandingsTable } from '../features/competition/CompetitionParts';
import { NewsCard, NewsRow } from '../features/news/NewsParts';
import { usePaths, useFmt } from '../lib/locale';
import { FEATURED_COMPETITION_ID, useSeasonQuery } from '../lib/season';
import { Slash } from '../ui/brand';
import { Button, Section, SeeAll, Segmented } from '../ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

type Day = 'yesterday' | 'today' | 'tomorrow';

export default function HomePage() {
  const f = useFmt();
  const paths = usePaths();
  const [day, setDay] = useState<Day>('today');
  const days = useDayMatches();
  const stories = useTopStories();
  const featured = useSeasonQuery(FEATURED_COMPETITION_ID);
  const standings = useStandings(featured);
  const leaders = useLeaderBoards(featured);

  return (
    <>
      <Seo title={f.t('seo.home')} description={f.t('seo.homeDescription')} />
      <h1 className="sr-only">{f.t('app.name')}</h1>

      <div className={p.cols}>
        <div className={p.stack} style={{ gap: 28 }}>
          <Section title={f.t('nav.matches')} action={<SeeAll to={paths.matches()}>{f.t('common.seeAll')}</SeeAll>}>
            <Segmented<Day>
              label={f.t('nav.matches')}
              value={day}
              onChange={setDay}
              options={(['yesterday', 'today', 'tomorrow'] as Day[]).map((d) => ({ value: d, label: f.t(`days.${d}`) }))}
            />
            <QueryView
              query={days}
              isEmpty={(d) => d[day].length === 0}
              empty={
                <EmptyState
                  message={f.t('match.noMatchesDay')}
                  action={
                    day !== 'tomorrow' ? (
                      <Button variant="ghost" onClick={() => setDay(day === 'yesterday' ? 'today' : 'tomorrow')}>
                        {f.t(day === 'yesterday' ? 'days.today' : 'days.tomorrow')}
                      </Button>
                    ) : null
                  }
                />
              }
            >
              {(d) => <MatchGroups matches={d[day]} />}
            </QueryView>
          </Section>

          <section className={p.promo} aria-labelledby="promo-title">
            <h2 id="promo-title" className={p.promoTitle}>
              {f.t('games.promoA')}
              <Slash height={34} width={4} color="var(--c-midnight)" />
              {f.t('games.promoB')}
            </h2>
            <p>{f.t('games.promoText')}</p>
            <div>
              <Button variant="dark" to={paths.games()}>
                {f.t('nav.games')}
              </Button>
            </div>
          </section>

          <Section title={f.t('news.topStories')} action={<SeeAll to={paths.news()}>{f.t('common.seeAll')}</SeeAll>}>
            <QueryView query={stories} isEmpty={(d) => d.length === 0} empty={<EmptyState message={f.t('news.empty')} />} skeleton={<Skeleton rows={3} height={96} />}>
              {([lead, ...rest]) => (
                <div className={p.two}>
                  {lead && <NewsCard item={lead} lead />}
                  <div>
                    {rest.slice(0, 4).map((a) => (
                      <NewsRow key={a.id} item={a} />
                    ))}
                  </div>
                </div>
              )}
            </QueryView>
          </Section>
        </div>

        <aside className={p.stack} style={{ gap: 28 }} aria-label={f.t('competition.tabs.table')}>
          <Section
            title={f.t('competition.tabs.table')}
            action={<SeeAll to={paths.competition(FEATURED_COMPETITION_ID)}>{f.t('common.seeAll')}</SeeAll>}
          >
            <QueryView query={standings} isEmpty={(d) => !d.groups.length} empty={<EmptyState message={f.t('competition.noTable')} />} skeleton={<Skeleton rows={6} height={40} />}>
              {(d) => <StandingsTable rows={d.groups[0]!.rows.slice(0, 6)} compact />}
            </QueryView>
          </Section>
          <Section title={f.t('competition.leaders.topScorers')}>
            <QueryView query={leaders} isEmpty={(d) => !d.topScorers.length} empty={<EmptyState message={f.t('states.empty')} />} skeleton={<Skeleton rows={5} height={56} />}>
              {(d) => <LeaderList leaders={d.topScorers} limit={5} />}
            </QueryView>
          </Section>
        </aside>
      </div>
    </>
  );
}
