import { useCareer, usePlayer, usePlayerStats } from '@sports247/data';
import type { Player } from '@sports247/domain';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { usePaths, useFmt } from '../lib/locale';
import { Avatar, Crest, Eyebrow, H1, KeyValues, List, Row, Select, TabsNav, Tiles } from '../ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

export default function PlayerPage() {
  const f = useFmt();
  const paths = usePaths();
  const params = useParams();
  const id = Number(params.id);
  const player = usePlayer(id);
  const tab = params.tab ?? 'stats';

  if (!['stats', 'career'].includes(tab)) return <Navigate to={paths.player(id)} replace />;

  return (
    <QueryView query={player} skeleton={<Skeleton rows={4} height={72} />}>
      {(pl) => (
        <div className={p.stack}>
          <Seo title={pl.name} description={[pl.position, pl.nationality].filter(Boolean).join(' · ')} />
          <header className={p.entity}>
            {pl.image ? (
              <span className={p.photo}>
                <Avatar name={pl.name} image={pl.image} size={88} />
                {pl.shirtNumber != null && (
                  <span className={p.photoNumber} aria-label={`${f.t('player.shirt')} ${pl.shirtNumber}`}>
                    {f.n(pl.shirtNumber)}
                  </span>
                )}
              </span>
            ) : pl.shirtNumber != null ? (
              <span className={p.bigNumber} aria-label={`${f.t('player.shirt')} ${pl.shirtNumber}`}>
                {f.n(pl.shirtNumber)}
              </span>
            ) : (
              <Avatar name={pl.name} image={null} size={72} />
            )}
            <div>
              {pl.position && (
                <Eyebrow>
                  <bdi>{pl.position}</bdi>
                </Eyebrow>
              )}
              <H1>
                <bdi>{pl.name}</bdi>
              </H1>
            </div>
          </header>
          <KeyValues
            items={[
              { label: f.t('player.nationality'), value: pl.nationality ? <bdi>{pl.nationality}</bdi> : '–' },
              { label: f.t('player.age'), value: f.n(pl.age) },
              { label: f.t('player.height'), value: pl.height ? f.t('player.cm', { value: f.n(pl.height) }) : '–' },
              { label: f.t('player.weight'), value: pl.weight ? f.t('player.kg', { value: f.n(pl.weight) }) : '–' },
            ]}
          />
          <TabsNav
            label={f.t('nav.tabs')}
            items={[
              { to: paths.player(id), label: f.t('player.tabs.stats') },
              { to: paths.player(id, 'career'), label: f.t('player.tabs.career') },
            ]}
          />
          {tab === 'stats' ? <StatsTab player={pl} /> : <CareerTab id={id} />}
        </div>
      )}
    </QueryView>
  );
}

function StatsTab({ player }: { player: Player }) {
  const f = useFmt();
  const options = player.competitions.flatMap((c) =>
    c.seasons.map((s) => ({ value: `${c.id}:${s.id}`, label: `${c.name} · ${f.digits(s.title)}` })),
  );
  // Default to the newest season of the player's first (main) competition: season ids grow over time.
  const main = player.competitions[0];
  const newest = main?.seasons.reduce((a, b) => (b.id > a.id ? b : a), main.seasons[0]!);
  const [choice, setChoice] = useState(main && newest ? `${main.id}:${newest.id}` : (options[0]?.value ?? ''));
  const [competitionId, seasonId] = choice.split(':').map(Number);
  const stats = usePlayerStats(player.id, competitionId && seasonId ? { competitionId, seasonId } : null);

  if (!options.length) return <EmptyState message={f.t('player.noStats')} />;
  return (
    <>
      <Select id="player-season" label={f.t('common.competition')} value={choice} options={options} onChange={setChoice} />
      <QueryView query={stats} isEmpty={(d) => d.matches === 0 && d.goals === 0} empty={<EmptyState message={f.t('player.noStats')} />}>
        {(d) => (
          <Tiles
            items={[
              ...(d.rating != null ? [{ label: f.t('player.stats.rating'), value: f.n(d.rating), accent: true }] : []),
              { label: f.t('player.stats.goals'), value: f.n(d.goals) },
              { label: f.t('player.stats.assists'), value: f.n(d.assists) },
              { label: f.t('player.stats.matches'), value: f.n(d.matches) },
              { label: f.t('player.stats.minutes'), value: f.n(d.minutes) },
              ...(d.passAccuracy != null ? [{ label: f.t('player.stats.passAccuracy'), value: f.n(d.passAccuracy, { maximumFractionDigits: 1 }) }] : []),
              { label: f.t('player.stats.attempts'), value: f.n(d.attempts) },
              { label: f.t('player.stats.ballWins'), value: f.n(d.ballWins) },
              ...(d.saves > 0 ? [{ label: f.t('player.stats.saves'), value: f.n(d.saves) }] : []),
            ]}
          />
        )}
      </QueryView>
    </>
  );
}

function CareerTab({ id }: { id: number }) {
  const f = useFmt();
  const paths = usePaths();
  const career = useCareer(id);
  return (
    <QueryView query={career} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('states.empty')} />}>
      {(d) => (
        <List>
          {d.map((c, i) => (
            <Row key={`${c.teamId}-${i}`} to={paths.team(c.teamId)} lead={<Crest name="" logo={c.teamLogo} size={40} />}>
              {c.competitions.map((x) => (
                <span key={x.id}>
                  <bdi>{x.title}</bdi> <span className="small muted">· {f.tn('player.goalsIn', x.goals)}</span>
                </span>
              ))}
            </Row>
          ))}
        </List>
      )}
    </QueryView>
  );
}
