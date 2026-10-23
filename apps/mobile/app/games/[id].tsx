import { ApiError } from '@sports247/api';
import { useAnswerGuess, useAnswerPrediction, useAnswerSquad, useGame, useGames } from '@sports247/data';
import type { GuessGame, Id, LocalizedName, PredictGame, PredictOutcome, SquadGame } from '@sports247/domain';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { paths, useFmt, type Fmt } from '../../src/lib/locale';
import { useOnline } from '../../src/lib/misc';
import { useTheme } from '../../src/lib/theme';
import { Icon } from '../../src/ui/Icon';
import { Badge, Button, Card, Chip, Eyebrow, Screen, Section } from '../../src/ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../../src/ui/states';
import { Text } from '../../src/ui/Text';

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

export default function GameScreen() {
  const f = useFmt();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const game = useGame(id);
  const summary = useGames().data?.find((g) => g.id === id);

  return (
    <Screen title={f.t('nav.games')} onRefresh={() => game.refetch()}>
      <QueryView query={game} isEmpty={(d) => d == null} empty={<EmptyState message={f.t('games.empty')} />} skeleton={<Skeleton rows={4} height={64} />}>
        {(g) => (
          <>
            <View style={{ gap: 4 }}>
              <Eyebrow>{f.t(`games.types.${g!.type}`)}</Eyebrow>
              <Text variant="h1">{summary?.title ?? g!.title}</Text>
            </View>
            {g!.type === 'guess' && <Guess game={g!} gameId={id} />}
            {g!.type === 'match_predict' && <Predict game={g!} gameId={id} />}
            {g!.type === 'team_squad' && <Squad game={g!} gameId={id} />}
          </>
        )}
      </QueryView>
    </Screen>
  );
}

/** An answer option. Right answers use the accent fill, wrong picks a dashed border (no green/red). */
function Choice({ label, pressed, right, wrong, disabled, onPress }: { label: string; pressed: boolean; right?: boolean; wrong?: boolean; disabled: boolean; onPress: () => void }) {
  const { c, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: pressed, disabled }}
      style={{
        flexBasis: '47%',
        flexGrow: 1,
        minHeight: 56,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.small,
        borderWidth: pressed ? 2.5 : 1.5,
        borderStyle: wrong ? 'dashed' : 'solid',
        borderColor: right ? c.accent : pressed ? c.text : c.line,
        backgroundColor: right ? c.accent : c.surface,
      }}
    >
      <Text variant="label" align="center" color={right ? 'onAccent' : wrong ? 'text2' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

function Submit({ disabled, pending, onPress, error }: { disabled: boolean; pending: boolean; onPress: () => void; error: unknown }) {
  const f = useFmt();
  const online = useOnline();
  return (
    <View style={{ gap: 8 }}>
      <Button onPress={onPress} disabled={disabled || pending || !online}>
        {pending ? f.t('games.submitting') : f.t('games.submit')}
      </Button>
      {!online ? <Text variant="small" color="text2">{f.t('games.offline')}</Text> : null}
      {error != null ? (
        <Text variant="small" accessibilityRole="alert">
          {errorText(error, f)}
        </Text>
      ) : null}
    </View>
  );
}

function Result({ title, children }: { title: string; children?: ReactNode }) {
  const f = useFmt();
  return (
    <Card style={{ padding: 18, gap: 8 }}>
      <View accessibilityLiveRegion="polite" style={{ gap: 6 }}>
        <Text variant="h2">{title}</Text>
        {children}
      </View>
      <Button variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace(paths.games()))}>
        {f.t('games.backToGames')}
      </Button>
    </Card>
  );
}

function Guess({ game, gameId }: { game: GuessGame; gameId: Id }) {
  const f = useFmt();
  const { c } = useTheme();
  const [pick, setPick] = useState<Id | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const answer = useAnswerGuess(gameId, game.answerPath);
  const done = answer.isSuccess;
  const right = game.choices.find((x) => x.correct);
  const picked = game.choices.find((x) => x.id === pick);

  if (game.played && !done) return <Result title={f.t('games.alreadyPlayed')} />;
  return (
    <>
      <Card style={{ padding: 14, gap: 12 }}>
        <View style={{ aspectRatio: 16 / 9, borderRadius: 10, overflow: 'hidden', backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
          {game.questionImage && !imageFailed ? (
            <Image source={{ uri: game.questionImage }} style={{ width: '100%', height: '100%' }} contentFit="contain" onError={() => setImageFailed(true)} />
          ) : (
            <Icon name="image" size={36} color={c.text3} />
          )}
        </View>
        <Text variant="title" size={18}>{game.question}</Text>
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} accessibilityLabel={game.question}>
        {game.choices.map((x) => (
          <Choice
            key={x.id}
            label={x.text}
            pressed={pick === x.id}
            right={done && x.correct}
            wrong={done && pick === x.id && !x.correct}
            disabled={done || answer.isPending}
            onPress={() => setPick(x.id)}
          />
        ))}
      </View>
      {done ? (
        <Result title={picked?.correct ? f.t('games.correct') : f.t('games.wrong')}>
          {right ? <Text color="text2">{f.t('games.rightAnswer', { answer: right.text })}</Text> : null}
        </Result>
      ) : (
        <Submit disabled={pick == null} pending={answer.isPending} error={answer.error} onPress={() => pick != null && answer.mutate(pick)} />
      )}
    </>
  );
}

function Predict({ game, gameId }: { game: PredictGame; gameId: Id }) {
  const f = useFmt();
  const { c } = useTheme();
  const [picks, setPicks] = useState<Record<Id, PredictOutcome>>({});
  const answer = useAnswerPrediction(gameId, game.answerPath);
  const open = game.fixtures.filter((x) => !x.locked && !x.answered);
  const done = answer.isSuccess;
  const ready = open.length > 0 && open.every((x) => picks[x.id]);

  return (
    <>
      <Text color="text2">{`${f.t('games.predictHelp')} (${f.t('common.cairoTime')})`}</Text>
      {game.competition ? <View style={{ alignSelf: 'flex-start' }}><Badge>{nameOf(game.competition, f.lang)}</Badge></View> : null}
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
          <Card key={fx.id} style={{ padding: 14, gap: 12 }}>
            <View style={{ gap: 2 }}>
              <Text variant="label">{`${home} – ${away}`}</Text>
              <Text variant="caption" color="text2">
                {[f.instant(fx.kickoff), fx.venue ? nameOf(fx.venue, f.lang) : null, fx.locked ? f.t('games.locked') : null].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }} accessibilityLabel={`${home} – ${away}`}>
              {options.map(([v, label]) => (
                <View key={v} style={{ flex: 1, flexDirection: 'row' }}>
                  <Choice
                    label={label}
                    pressed={chosen === v}
                    disabled={done || fx.locked || fx.answered || answer.isPending}
                    onPress={() => setPicks((s) => ({ ...s, [fx.id]: v }))}
                  />
                </View>
              ))}
            </View>
            {showVotes && fx.votes.total > 0 ? (
              <View style={{ gap: 8 }}>
                <Text variant="caption" color="text2">{f.t('games.fans', { n: f.n(fx.votes.total) })}</Text>
                {options.map(([v, label]) => (
                  <View key={v} style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
                      <Text variant="small" style={{ flex: 1 }} numberOfLines={1}>{label}</Text>
                      <Text variant="num">{`${f.n(fx.votes.percent[v], { maximumFractionDigits: 0 })}%`}</Text>
                    </View>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surface2, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${fx.votes.percent[v]}%`, backgroundColor: c.accent }} />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}
      {done ? (
        <Result title={f.t('games.saved')} />
      ) : open.length ? (
        <Submit
          disabled={!ready}
          pending={answer.isPending}
          error={answer.error}
          onPress={() =>
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
      <Text color="text2">{f.t('games.squadHelp', { n: f.n(game.pickCount) })}</Text>
      <Text variant="num" accessibilityLiveRegion="polite">
        {f.t('games.squadPicked', { picked: f.n(picked.length), n: f.n(game.pickCount) })}
      </Text>
      {game.positions.map((pos) => {
        const players = game.players.filter((x) => x.position === pos);
        if (!players.length) return null;
        return (
          <Section key={pos} title={f.t(`games.positions.${pos}`)}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {players.map((pl) => (
                <Chip key={pl.id} pressed={picked.includes(pl.id)} onPress={() => !done && toggle(pl.id)}>
                  {pl.name}
                </Chip>
              ))}
            </View>
          </Section>
        );
      })}
      {done ? (
        <Result title={f.t('games.squadSaved')} />
      ) : (
        <Submit disabled={!full} pending={answer.isPending} error={answer.error} onPress={() => answer.mutate(picked)} />
      )}
    </>
  );
}
