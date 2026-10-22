import { useGalleries, useGalleryImages, useSquad, useTeam, useTeamCalendar, useTeamStats } from '@sports247/data';
import type { Team } from '@sports247/domain';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { MatchList, teamName } from '../features/match/MatchRow';
import { usePaths, useFmt } from '../lib/locale';
import { useSeasonQuery } from '../lib/season';
import { Avatar, Breadcrumbs, ChipLink, Chips, Crest, Eyebrow, H1, List, Panel, Row, Section, TabsNav, Tiles } from '../ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

type Tab = 'matches' | 'squad' | 'stats' | 'photos';

export default function TeamPage() {
  const f = useFmt();
  const paths = usePaths();
  const params = useParams();
  const id = Number(params.id);
  const team = useTeam(id);
  const galleries = useGalleries(id);
  const hasPhotos = !!galleries.data?.length;
  const tabs: Tab[] = ['matches', 'squad', 'stats', ...(hasPhotos ? (['photos'] as Tab[]) : [])];
  const tab = (params.tab ?? 'matches') as Tab;

  if (params.tab && !['matches', 'squad', 'stats', 'photos'].includes(params.tab)) return <Navigate to={paths.team(id)} replace />;

  return (
    <QueryView query={team} skeleton={<Skeleton rows={4} height={72} />}>
      {(t) => (
        <div className={p.stack}>
          <Seo title={teamName(t, f.lang)} />
          <Breadcrumbs
            label={f.t('nav.breadcrumb')}
            items={[
              ...(t.competitions[0] ? [{ label: <bdi>{t.competitions[0].title}</bdi>, to: paths.competition(t.competitions[0].id) }] : []),
              { label: <bdi>{teamName(t, f.lang)}</bdi> },
            ]}
          />
          <header className={p.entity}>
            <Crest name={t.name} shortName={t.shortName} logo={t.logo} size={72} />
            <div>
              {t.shortName && f.lang === 'ar' && <Eyebrow>{t.shortName}</Eyebrow>}
              <H1 upper>
                <bdi>{teamName(t, f.lang)}</bdi>
              </H1>
              {t.manager && (
                <p className="small muted">
                  {f.t('match.manager')}: <bdi>{t.manager}</bdi>
                </p>
              )}
            </div>
          </header>
          {t.competitions.length > 0 && (
            <Chips>
              {t.competitions.map((c) => (
                <ChipLink key={c.id} to={paths.competition(c.id)}>
                  <Crest name={c.title} logo={c.logo} size={20} />
                  <bdi>{c.title}</bdi>
                </ChipLink>
              ))}
            </Chips>
          )}
          <TabsNav
            label={f.t('nav.tabs')}
            items={tabs.map((x) => ({ to: x === 'matches' ? paths.team(id) : paths.team(id, x), label: f.t(`team.tabs.${x}`) }))}
          />
          {tab === 'matches' && <MatchesTab id={id} />}
          {tab === 'squad' && <SquadTab id={id} />}
          {tab === 'stats' && <StatsTab team={t} />}
          {tab === 'photos' && <PhotosTab id={id} />}
        </div>
      )}
    </QueryView>
  );
}

function MatchesTab({ id }: { id: number }) {
  const f = useFmt();
  const calendar = useTeamCalendar(id);
  return (
    <QueryView query={calendar}>
      {(d) => (
        <>
          {d.today.length > 0 && (
            <Section title={f.t('common.today')}>
              <MatchList matches={d.today} />
            </Section>
          )}
          <Section title={f.t('common.next')}>
            {d.next.length ? <MatchList matches={d.next} /> : <EmptyState message={f.t('team.noUpcoming')} />}
          </Section>
          {d.previous.length > 0 && (
            <Section title={f.t('common.previous')}>
              <MatchList matches={d.previous} />
            </Section>
          )}
        </>
      )}
    </QueryView>
  );
}

function SquadTab({ id }: { id: number }) {
  const f = useFmt();
  const paths = usePaths();
  const squad = useSquad(id);
  return (
    <QueryView query={squad} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('states.empty')} />}>
      {(groups) => (
        <div className={p.two}>
          {groups.map((g) => (
            <Section key={g.position} title={f.t(`team.positions.${g.position}`)} headingLevel={2}>
              <List>
                {g.players.map((pl) => (
                  <Row
                    key={pl.id}
                    to={paths.player(pl.id)}
                    lead={<Avatar name={pl.name} image={pl.image} />}
                    trail={<span className="num" style={{ fontWeight: 800, fontSize: 20 }}>{f.n(pl.number)}</span>}
                  >
                    <b>
                      <bdi>{pl.name}</bdi>
                    </b>
                    <span className="small muted">
                      {pl.nationality && <bdi>{pl.nationality}</bdi>}
                      {pl.age != null && ` · ${f.t('player.age')} ${f.n(pl.age)}`}
                    </span>
                  </Row>
                ))}
              </List>
            </Section>
          ))}
        </div>
      )}
    </QueryView>
  );
}

function StatsTab({ team }: { team: Team }) {
  const f = useFmt();
  const competitionId = team.mainCompetitionId ?? team.competitions[0]?.id ?? 0;
  const season = useSeasonQuery(competitionId);
  const stats = useTeamStats(team.id, season, competitionId > 0);
  return (
    <QueryView query={stats} isEmpty={(d) => d.played === 0} empty={<EmptyState message={f.t('team.noStats')} />}>
      {(d) => {
        const max = Math.max(1, ...d.byInterval.map((x) => x.goals));
        return (
          <>
            <Tiles
              items={[
                { label: f.t('team.stats.played'), value: f.n(d.played) },
                { label: f.t('team.stats.won'), value: f.n(d.won), accent: true },
                { label: f.t('team.stats.drawn'), value: f.n(d.drawn) },
                { label: f.t('team.stats.lost'), value: f.n(d.lost) },
                { label: f.t('team.stats.goalsFor'), value: f.n(d.goalsFor) },
                { label: f.t('team.stats.goalsAgainst'), value: f.n(d.goalsAgainst) },
                { label: f.t('team.stats.cleanSheets'), value: f.n(d.cleanSheets) },
                { label: f.t('team.stats.yellowCards'), value: f.n(d.yellowCards) },
              ]}
            />
            {d.byInterval.length > 0 && (
              <Panel>
                <b>{f.t('team.stats.byInterval')}</b>
                {/* Minutes run left to right like a timeline in both languages. */}
                <div className={p.intervals} role="img" aria-label={d.byInterval.map((x) => `${x.label}': ${x.goals}`).join(', ')}>
                  {d.byInterval.map((x) => (
                    <div key={x.label} className={p.interval}>
                      <span className="num" style={{ fontWeight: 700 }}>
                        {f.n(x.goals)}
                      </span>
                      <span className={p.intervalBar} style={{ blockSize: `${(x.goals / max) * 100}%` }} />
                      <span className="small muted num">{f.digits(`${x.label}'`)}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </>
        );
      }}
    </QueryView>
  );
}

function PhotosTab({ id }: { id: number }) {
  const f = useFmt();
  const galleries = useGalleries(id);
  const [open, setOpen] = useState<number | null>(null);
  const images = useGalleryImages(open);
  return (
    <QueryView query={galleries} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('states.empty')} />}>
      {(list) => (
        <>
          <List>
            {list.slice(0, 30).map((g) => (
              <Row key={g.id} lead={<Avatar name={g.name} image={g.image} size={56} />}>
                <button type="button" onClick={() => setOpen(open === g.id ? null : g.id)} style={{ textAlign: 'start', fontWeight: 600 }} aria-expanded={open === g.id}>
                  <bdi>{g.name}</bdi>
                </button>
                {open === g.id && images.data && <span className="small muted">{f.tn('team.photos', images.data.length)}</span>}
              </Row>
            ))}
          </List>
          {open != null && (
            <QueryView query={images}>
              {(imgs) => (
                <div className={p.photos}>
                  {imgs.map((src) => (
                    <img key={src} src={src} alt="" loading="lazy" decoding="async" />
                  ))}
                </div>
              )}
            </QueryView>
          )}
        </>
      )}
    </QueryView>
  );
}
