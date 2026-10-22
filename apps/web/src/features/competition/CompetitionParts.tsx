import type { BracketRound, FormResult, Leader, StandingRow } from '@sports247/domain';
import { Link } from 'react-router';
import { usePaths, useFmt } from '../../lib/locale';
import { Crest, List, Row } from '../../ui/primitives';
import s from './competition.module.css';

export function FormChips({ form }: { form: FormResult[] }) {
  const { t } = useFmt();
  const names = { W: 'win', D: 'draw', L: 'loss' } as const;
  return (
    <span className={s.form}>
      {form.map((r, i) => (
        <span key={i} className={`${s.fc} ${s[r]}`} title={names[r]} aria-label={names[r]}>
          {t(`competition.form.${r}`)}
        </span>
      ))}
    </span>
  );
}

export function StandingsTable({ rows, compact }: { rows: StandingRow[]; compact?: boolean }) {
  const f = useFmt();
  const paths = usePaths();
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col" className={s.pos}>
              {f.t('competition.table.pos')}
            </th>
            <th scope="col" className={s.team}>
              {f.t('competition.table.team')}
            </th>
            <th scope="col">{f.t('competition.table.played')}</th>
            {!compact && (
              <>
                <th scope="col" className={s.wide}>
                  {f.t('competition.table.gfga')}
                </th>
                <th scope="col">{f.t('competition.table.gd')}</th>
              </>
            )}
            <th scope="col">{f.t('competition.table.pts')}</th>
            {!compact && (
              <th scope="col" className={s.wide}>
                {f.t('competition.table.form')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const gd = r.goalsFor - r.goalsAgainst;
            return (
              <tr key={r.team.id}>
                <td className={s.pos}>{f.n(r.position)}</td>
                <th scope="row" className={s.team} style={{ fontWeight: 'inherit' }}>
                  <Link className={s.teamLink} to={paths.team(r.team.id)}>
                    <Crest name={r.team.name} logo={r.team.logo} />
                    <bdi>{r.team.name}</bdi>
                  </Link>
                </th>
                <td className="num">{f.n(r.played)}</td>
                {!compact && (
                  <>
                    <td className={`num ${s.wide}`}>
                      <bdi>
                        {f.n(r.goalsFor)}:{f.n(r.goalsAgainst)}
                      </bdi>
                    </td>
                    <td className="num">
                      <bdi>
                        {gd > 0 ? '+' : ''}
                        {f.n(gd)}
                      </bdi>
                    </td>
                  </>
                )}
                <td className={s.pts}>{f.n(r.points)}</td>
                {!compact && (
                  <td className={s.wide}>
                    <FormChips form={r.form} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LeaderList({ leaders, limit }: { leaders: Leader[]; limit?: number }) {
  const f = useFmt();
  const paths = usePaths();
  return (
    <List>
      {leaders.slice(0, limit ?? leaders.length).map((p, i) => (
        <Row
          key={p.player.id}
          to={paths.player(p.player.id)}
          lead={<span className={s.rank}>{f.n(i + 1)}</span>}
          trail={<span className={s.value}>{f.n(p.value)}</span>}
        >
          <b>
            <bdi>{p.player.name}</bdi>
          </b>
          <span className="small muted">
            {p.team && <bdi>{p.team.name}</bdi>}
            {p.played != null && <> · {f.tn('competition.played', p.played)}</>}
          </span>
        </Row>
      ))}
    </List>
  );
}

export function Bracket({ rounds }: { rounds: BracketRound[] }) {
  const f = useFmt();
  const paths = usePaths();
  return (
    <div className={s.bracket}>
      {rounds.map((r) => (
        <section key={r.id} className={s.round} aria-label={r.name}>
          <h3 className="small muted" style={{ fontWeight: 600 }}>
            <bdi>{r.name}</bdi>
          </h3>
          {r.matches.map((m) => (
            <Link key={m.id} to={paths.match(m.id)} className={s.tie}>
              {m.teams.map((t) => {
                const won = m.teams.length === 2 && t.score != null && m.teams.every((o) => o === t || (o.score ?? -1) < (t.score ?? -1) || (o.score === t.score && (o.penalties ?? -1) < (t.penalties ?? -1)));
                return (
                  <span key={t.id} className={`${s.tieTeam} ${won ? s.winner : ''}`}>
                    <Crest name={t.name} logo={t.logo} size={22} />
                    <bdi>{t.name}</bdi>
                    <span className="num">
                      {f.n(t.score)}
                      {t.penalties != null && ` (${f.n(t.penalties)})`}
                    </span>
                  </span>
                );
              })}
              <span className="small muted">{f.date(m.kickoff)}</span>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}

export { s as competitionStyles };
