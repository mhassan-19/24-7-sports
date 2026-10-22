import { ApiError } from '@sports247/api';
import { useAnswerGuess, useAnswerPrediction, useAnswerSquad, useGame, useGames } from '@sports247/data';
import type { GuessGame, Id, LocalizedName, PredictGame, PredictOutcome, SquadGame } from '@sports247/domain';
import { useState, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { usePaths, useFmt, type Fmt } from '../lib/locale';
import { useOnline } from '../lib/useOnline';
import { Icon } from '../ui/Icon';
import { Badge, Breadcrumbs, Button, Chip, Eyebrow, H1, Panel, Section, cx } from '../ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

const nameOf = (n: LocalizedName | null, lang: string) => (n ? (lang === 'ar' ? n.ar || n.en : n.en || n.ar) || '' : '');

/** Message for a failed answer: the API's own message when it sent one (e.g. "closed"). */
function errorText(error: unknown, f: Fmt): string {
  if (error instanceof ApiError) {
    if (error.kind === 'blocked') return f.t('games.blocked');
    const fields = Object.values(error.fieldErrors).flat();
    if (fields.length) return fields.join(' ');
    if (error.serverMessage) return error.serverMessage;
  }
  return f.t('states.error');
}

export default function GamePage() {
  const f = useFmt();
  const paths = usePaths();
  const id = Number(useParams().id);
  const game = useGame(id);
  const list = useGames();
  const summary = list.data?.find((g) => g.id === id);

  return (
    <div className={`${p.stack} ${p.narrow}`}>
      <Breadcrumbs label={f.t('nav.breadcrumb')} items={[{ label: f.t('nav.games'), to: paths.games() }, { label: <bdi>{summary?.title ?? ''}</bdi> }]} />
      <QueryView query={game} isEmpty={(d) => d == null} empty={<EmptyState message={f.t('games.empty')} />} skeleton={<Skeleton rows={4} height={64} />}>
        {(g) => (
          <>
            <Seo title={summary?.title ?? g!.title} />
            <Eyebrow>{f.t(`games.types.${g!.type}`)}</Eyebrow>
            <H1>
              <bdi>{summary?.title ?? g!.title}</bdi>
            </H1>
            {g!.type === 'guess' && <Guess game={g!} gameId={id} />}
            {g!.type === 'match_predict' && <Predict game={g!} gameId={id} />}
            {g!.type === 'team_squad' && <Squad game={g!} gameId={id} />}
          </>
        )}
      </QueryView>
    </div>
  );
}

function Submit({ disabled, pending, onClick, error }: { disabled: boolean; pending: boolean; onClick: () => void; error: unknown }) {
  const f = useFmt();
  const online = useOnline();
  return (
    <div className={p.stack} style={{ gap: 8 }}>
      <div>
        <Button onClick={onClick} disabled={disabled || pending || !online}>
          {pending ? f.t('games.submitting') : f.t('games.submit')}
        </Button>
      </div>
      {!online && <p className="small muted">{f.t('games.offline')}</p>}
      {error != null && (
        <p className="small" role="alert">
          {errorText(error, f)}
        </p>
      )}
    </div>
  );
}

function Result({ title, children }: { title: string; children?: ReactNode }) {
  const f = useFmt();
  const paths = usePaths();
  return (
    <div className={p.result} role="status">
      <b className="u" style={{ fontFamily: 'var(--f-display)', fontSize: 22 }}>
        {title}
      </b>
      {children}
      <div>
        <Button variant="secondary" to={paths.games()}>
          {f.t('games.backToGames')}
        </Button>
      </div>
    </div>
  );
}

function Guess({ game, gameId }: { game: GuessGame; gameId: Id }) {
  const f = useFmt();
  const [pick, setPick] = useState<Id | null>(null);
  const answer = useAnswerGuess(gameId, game.answerPath);
  const done = answer.isSuccess;
  const right = game.choices.find((c) => c.correct);
  const picked = game.choices.find((c) => c.id === pick);

  if (game.played && !done) return <Result title={f.t('games.alreadyPlayed')} />;
  return (
    <>
      <Panel>
        {game.questionImage ? (
          <img src={game.questionImage} alt="" style={{ borderRadius: 10, maxBlockSize: 280, objectFit: 'contain', marginInline: 'auto' }} />
        ) : (
          <span className={p.gameImage}>
            <Icon name="image" />
          </span>
        )}
        <p style={{ fontSize: 18, fontWeight: 700 }}>
          <bdi>{game.question}</bdi>
        </p>
      </Panel>
      <div className={p.choices} role="group" aria-label={game.question}>
        {game.choices.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cx(p.choice, done && c.correct && p.right, done && pick === c.id && !c.correct && p.wrong)}
            aria-pressed={pick === c.id}
            disabled={done || answer.isPending}
            onClick={() => setPick(c.id)}
          >
            <bdi>{c.text}</bdi>
          </button>
        ))}
      </div>
      {done ? (
        <Result title={picked?.correct ? f.t('games.correct') : f.t('games.wrong')}>
          {right && <span className="muted">{f.t('games.rightAnswer', { answer: right.text })}</span>}
        </Result>
      ) : (
        <Submit disabled={pick == null} pending={answer.isPending} error={answer.error} onClick={() => pick != null && answer.mutate(pick)} />
      )}
    </>
  );
}

function Predict({ game, gameId }: { game: PredictGame; gameId: Id }) {
  const f = useFmt();
  const [picks, setPicks] = useState<Record<Id, PredictOutcome>>({});
  const answer = useAnswerPrediction(gameId, game.answerPath);
  const open = game.fixtures.filter((x) => !x.locked && !x.answered);
  const done = answer.isSuccess;
  const ready = open.length > 0 && open.every((x) => picks[x.id]);

  return (
    <>
      <p className="muted">
        {f.t('games.predictHelp')} <span className="small">({f.t('common.cairoTime')})</span>
      </p>
      {game.competition && <Badge>{nameOf(game.competition, f.lang)}</Badge>}
      {game.fixtures.map((fx) => {
        const home = nameOf(fx.home.name, f.lang);
        const away = nameOf(fx.away.name, f.lang);
        const options: [PredictOutcome, string][] = [
          ['home', home],
          ['draw', f.t('games.draw')],
          ['away', away],
        ];
        const chosen = picks[fx.id] ?? fx.yourPick;
        const showVotes = done || fx.answered || fx.locked;
        return (
          <Panel key={fx.id}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
              <b>
                <bdi>{home}</bdi> – <bdi>{away}</bdi>
              </b>
              <span className="small muted">
                {f.instant(fx.kickoff)}
                {fx.venue && (
                  <>
                    {' · '}
                    <bdi>{nameOf(fx.venue, f.lang)}</bdi>
                  </>
                )}
                {fx.locked && ` · ${f.t('games.locked')}`}
              </span>
            </div>
            <div className={cx(p.choices, p.choices3)} role="group" aria-label={`${home} – ${away}`}>
              {options.map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  className={p.choice}
                  aria-pressed={chosen === v}
                  disabled={done || fx.locked || fx.answered || answer.isPending}
                  onClick={() => setPicks((s) => ({ ...s, [fx.id]: v }))}
                >
                  <bdi>{label}</bdi>
                </button>
              ))}
            </div>
            {showVotes && fx.votes.total > 0 && (
              <div style={{ display: 'grid', gap: 6 }}>
                <span className="small muted">{f.t('games.fans', { n: f.n(fx.votes.total) })}</span>
                {options.map(([v, label]) => (
                  <div key={v} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 6, alignItems: 'center' }}>
                    <span className="small">
                      <bdi>{label}</bdi>
                    </span>
                    <span className="num">{f.n(fx.votes.percent[v], { maximumFractionDigits: 0 })}%</span>
                    <span style={{ gridColumn: '1 / -1', blockSize: 6, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <span style={{ display: 'block', blockSize: '100%', inlineSize: `${fx.votes.percent[v]}%`, background: 'var(--accent)' }} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        );
      })}
      {done ? (
        <Result title={f.t('games.saved')} />
      ) : open.length ? (
        <Submit
          disabled={!ready}
          pending={answer.isPending}
          error={answer.error}
          onClick={() =>
            answer.mutate(
              open.map((x) => ({
                fixtureId: x.id,
                outcome: picks[x.id]!,
                teamId: picks[x.id] === 'home' ? x.home.id : picks[x.id] === 'away' ? x.away.id : null,
              })),
            )
          }
        />
      ) : (
        <Result title={game.played ? f.t('games.alreadyPlayed') : f.t('games.locked')} />
      )}
    </>
  );
}

function Squad({ game, gameId }: { game: SquadGame; gameId: Id }) {
  const f = useFmt();
  const [picked, setPicked] = useState<Id[]>([]);
  const answer = useAnswerSquad(gameId, game.answerPath);
  const done = answer.isSuccess;
  const full = picked.length >= game.pickCount;

  const toggle = (id: Id) =>
    setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < game.pickCount ? [...s, id] : s));

  if (game.played && !done) return <Result title={f.t('games.alreadyPlayed')} />;
  return (
    <>
      <p className="muted">{f.t('games.squadHelp', { n: f.n(game.pickCount) })}</p>
      <p className="num" aria-live="polite" style={{ fontWeight: 700 }}>
        {f.t('games.squadPicked', { picked: f.n(picked.length), n: f.n(game.pickCount) })}
      </p>
      {game.positions.map((pos) => {
        const players = game.players.filter((x) => x.position === pos);
        if (!players.length) return null;
        return (
          <Section key={pos} title={f.t(`games.positions.${pos}`)}>
            <div className={p.pickChips}>
              {players.map((pl) => (
                <Chip key={pl.id} pressed={picked.includes(pl.id)} onClick={() => !done && toggle(pl.id)}>
                  <bdi>{pl.name}</bdi>
                </Chip>
              ))}
            </div>
          </Section>
        );
      })}
      {done ? (
        <Result title={f.t('games.squadSaved')} />
      ) : (
        <Submit disabled={!full} pending={answer.isPending} error={answer.error} onClick={() => answer.mutate(picked)} />
      )}
    </>
  );
}
