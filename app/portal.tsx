'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Bootstrap, Question, ReportEntry, TaskGroup, Week } from '@/lib/types';

type TaskAnswer = { status: string; answers: Record<string, string> };
type AnswerMap = Record<string, TaskAnswer>;

const STATUSES: { value: string; tone: string }[] = [
  { value: 'Đã làm', tone: 'done' },
  { value: 'Chưa làm', tone: 'pending' },
  { value: 'Không áp dụng', tone: 'na' },
];

/* ------------------------- date helpers ------------------------- */

/** "Thứ 5 (20/8)" -> {day:20, month:8} ; "17/8 - 23/8" -> lấy vế đầu/cuối */
function parseDayMonth(text: string): { day: number; month: number } | null {
  const m = String(text).match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  if (!m) return null;
  return { day: Number(m[1]), month: Number(m[2]) };
}

function parseWeekRange(label: string) {
  const all = [...String(label).matchAll(/(\d{1,2})\s*\/\s*(\d{1,2})/g)];
  if (all.length < 2) return null;
  const first = { day: Number(all[0][1]), month: Number(all[0][2]) };
  const last = { day: Number(all[all.length - 1][1]), month: Number(all[all.length - 1][2]) };
  return { first, last };
}

function toDate(dm: { day: number; month: number }, refYear: number) {
  return new Date(refYear, dm.month - 1, dm.day);
}

/** Chọn tuần chứa ngày hôm nay; không có thì lấy tuần gần nhất chưa qua. */
function pickCurrentWeek(weeks: Week[]): number {
  if (!weeks.length) return 0;
  const now = new Date();
  const year = now.getFullYear();
  const today = new Date(year, now.getMonth(), now.getDate()).getTime();

  for (let i = 0; i < weeks.length; i++) {
    const range = parseWeekRange(weeks[i].label);
    if (!range) continue;
    const start = toDate(range.first, year).getTime();
    let end = toDate(range.last, year).getTime();
    if (end < start) end = toDate(range.last, year + 1).getTime();
    if (today >= start && today <= end + 86_400_000 - 1) return i;
  }

  for (let i = 0; i < weeks.length; i++) {
    const range = parseWeekRange(weeks[i].label);
    if (range && toDate(range.last, year).getTime() >= today) return i;
  }
  return weeks.length - 1;
}

function pickTodayIndex(week: Week | undefined): number {
  if (!week) return -1;
  const now = new Date();
  return week.days.findIndex((label) => {
    const dm = parseDayMonth(label);
    return dm && dm.day === now.getDate() && dm.month === now.getMonth() + 1;
  });
}

/** Task trong sheet không kèm câu hỏi thì vẫn cho một ô ghi chú tự do. */
const FREE_NOTE = { id: 'note', label: '', prompt: 'Ghi chú / kết quả trong ca' };

function questionsOf(task: { questions: Question[] }): Question[] {
  return task.questions.length ? task.questions : [FREE_NOTE];
}

function shiftKind(shift: string): 'work' | 'off' | 'empty' {
  const v = shift.trim();
  if (!v) return 'empty';
  if (/^off$/i.test(v)) return 'off';
  return 'work';
}

/* ---------------------------- view ---------------------------- */

export default function Portal({ sheetUrl }: { sheetUrl: string }) {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<'report' | 'schedule'>('report');

  const [weekIndex, setWeekIndex] = useState(0);
  const [employee, setEmployee] = useState('');
  const [dayIndex, setDayIndex] = useState(-1);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const restoredKey = useRef('');

  /* ---- load ---- */
  useEffect(() => {
    let alive = true;
    fetch('/api/data', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json: Bootstrap) => {
        if (!alive) return;
        setData(json);
        const idx = pickCurrentWeek(json.weeks || []);
        setWeekIndex(idx);
        const today = pickTodayIndex(json.weeks?.[idx]);
        setDayIndex(today);
        const first = json.taskGroups?.[0]?.group;
        if (first) setOpenGroups({ [first]: true });
      })
      .catch((err) => alive && setLoadError(String(err?.message || err)));
    return () => {
      alive = false;
    };
  }, []);

  const weeks = data?.weeks ?? [];
  const allGroups = data?.taskGroups ?? [];
  const week = weeks[weekIndex];
  const staff = week?.staff ?? [];
  const me = staff.find((s) => s.name === employee);

  // Nhóm việc riêng chỉ hiện với đúng nhân viên đó, nhóm chung hiện với mọi người.
  const groups = useMemo(
    () => allGroups.filter((g: TaskGroup) => !g.owner || g.owner === employee),
    [allGroups, employee]
  );
  const dayLabel = dayIndex >= 0 ? week?.days[dayIndex] ?? '' : '';
  const myShift = me && dayIndex >= 0 ? me.shifts[dayIndex] ?? '' : '';

  /* ---- draft autosave ---- */
  const draftKey = employee && dayLabel ? `mkt-portal:${employee}:${dayLabel}` : '';

  useEffect(() => {
    if (!draftKey || restoredKey.current === draftKey) return;
    restoredKey.current = draftKey;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAnswers(parsed.answers || {});
        setNote(parsed.note || '');
      } else {
        setAnswers({});
        setNote('');
      }
    } catch {
      setAnswers({});
      setNote('');
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({ answers, note }));
      } catch {
        /* quota - bỏ qua */
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [draftKey, answers, note]);

  /* ---- edits ---- */
  const setStatus = useCallback((taskId: string, value: string) => {
    setAnswers((prev) => {
      const cur = prev[taskId] ?? { status: '', answers: {} };
      return { ...prev, [taskId]: { ...cur, status: cur.status === value ? '' : value } };
    });
  }, []);

  const setAnswer = useCallback((taskId: string, qid: string, value: string) => {
    setAnswers((prev) => {
      const cur = prev[taskId] ?? { status: '', answers: {} };
      return { ...prev, [taskId]: { ...cur, answers: { ...cur.answers, [qid]: value } } };
    });
  }, []);

  const filledTaskIds = useMemo(() => {
    const out = new Set<string>();
    for (const [id, val] of Object.entries(answers)) {
      const hasText = Object.values(val.answers || {}).some((v) => v.trim().length > 0);
      if (val.status.trim() || hasText) out.add(id);
    }
    return out;
  }, [answers]);

  const totalTasks = useMemo(
    () => groups.reduce((sum, g) => sum + g.tasks.length, 0),
    [groups]
  );

  /* ---- submit ---- */
  async function handleSubmit() {
    setFeedback(null);
    if (!employee) return setFeedback({ kind: 'error', text: 'Bạn chưa chọn tên nhân viên.' });
    if (!dayLabel) return setFeedback({ kind: 'error', text: 'Bạn chưa chọn ngày làm việc.' });

    const entries: ReportEntry[] = [];
    for (const g of groups) {
      for (const t of g.tasks) {
        const val = answers[t.id];
        if (!val) continue;
        const filledQuestions = questionsOf(t).filter((q) => (val.answers[q.id] || '').trim());
        if (!filledQuestions.length && !val.status.trim()) continue;

        if (!filledQuestions.length) {
          entries.push({ group: g.group, task: t.name, question: '(tổng quát)', answer: '', status: val.status });
          continue;
        }
        for (const q of filledQuestions) {
          entries.push({
            group: g.group,
            task: t.name,
            question: q.label ? `${q.label}: ${q.prompt}` : q.prompt,
            answer: (val.answers[q.id] || '').trim(),
            status: val.status,
          });
        }
      }
    }

    if (!entries.length) {
      return setFeedback({ kind: 'error', text: 'Bạn chưa điền nội dung nào để gửi.' });
    }

    setSending(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee,
          position: me?.position ?? '',
          date: dayLabel,
          shift: myShift,
          week: week?.label ?? '',
          note,
          entries,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);

      setFeedback({
        kind: 'ok',
        text: `Đã gửi ${json.saved} dòng vào sheet "Báo cáo" cho ngày ${dayLabel}. Cảm ơn ${employee}!`,
      });
      setAnswers({});
      setNote('');
      if (draftKey) window.localStorage.removeItem(draftKey);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFeedback({ kind: 'error', text: `Gửi không thành công: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setSending(false);
    }
  }

  /* ---- render ---- */
  if (loadError) {
    return (
      <>
        <Header sheetUrl={sheetUrl} source={null} />
        <main className="shell">
          <div className="banner banner-error">Không tải được dữ liệu: {loadError}</div>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header sheetUrl={sheetUrl} source={null} />
        <main className="shell">
          <p className="loading">Đang tải lịch làm và danh sách công việc…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header sheetUrl={sheetUrl} source={data.source} />
      <main className="shell">
        {data.error ? <div className="banner banner-warn">{data.error}</div> : null}
        {feedback ? (
          <div className={feedback.kind === 'ok' ? 'banner banner-ok' : 'banner banner-error'}>
            {feedback.text}
          </div>
        ) : null}

        <div className="tabs">
          <button className="tab" data-active={tab === 'report'} onClick={() => setTab('report')}>
            Nhập báo cáo công việc
          </button>
          <button className="tab" data-active={tab === 'schedule'} onClick={() => setTab('schedule')}>
            Lịch làm theo tuần
          </button>
        </div>

        {tab === 'schedule' ? (
          <ScheduleView weeks={weeks} />
        ) : (
          <>
            <section className="card">
              <div className="card-head">
                <span className="step">1</span>
                <h2 className="card-title">Chọn tuần &amp; tên của bạn</h2>
                <p className="card-hint">
                  Lịch được đọc trực tiếp từ Google Sheets, tuần mới cập nhật là tự động hiện ở đây.
                </p>
              </div>

              <select
                className="select"
                value={weekIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setWeekIndex(idx);
                  setDayIndex(pickTodayIndex(weeks[idx]));
                }}
                style={{ marginBottom: 14 }}
              >
                {weeks.map((w, i) => (
                  <option key={w.label + i} value={i}>
                    Tuần {w.label}
                  </option>
                ))}
              </select>

              <div className="chips">
                {staff.map((s) => (
                  <button
                    key={s.name}
                    className="chip"
                    data-active={employee === s.name}
                    onClick={() => setEmployee(s.name)}
                  >
                    {s.name}
                    <small>{s.position}</small>
                  </button>
                ))}
              </div>
            </section>

            {employee ? (
              <section className="card">
                <div className="card-head">
                  <span className="step">2</span>
                  <h2 className="card-title">Chọn ngày làm việc</h2>
                  <p className="card-hint">Ca làm hiển thị theo đúng lịch của bạn trong tuần đã chọn.</p>
                </div>
                <div className="days">
                  {(week?.days ?? []).map((d, i) => {
                    const shift = me?.shifts[i] ?? '';
                    const kind = shiftKind(shift);
                    return (
                      <button
                        key={d + i}
                        className="day"
                        data-active={dayIndex === i}
                        data-kind={kind}
                        onClick={() => setDayIndex(i)}
                      >
                        <span className="day-name">{d}</span>
                        <span className="day-shift">
                          {kind === 'off' ? 'OFF' : kind === 'empty' ? 'Chưa xếp ca' : shift}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {employee && dayIndex >= 0 ? (
              <>
                <div className="summary">
                  <div>
                    <span>Nhân viên</span>
                    <strong>{employee}</strong>
                  </div>
                  <div>
                    <span>Vị trí</span>
                    <strong>{me?.position || '—'}</strong>
                  </div>
                  <div>
                    <span>Tuần</span>
                    <strong>{week?.label}</strong>
                  </div>
                  <div>
                    <span>Ngày</span>
                    <strong>{dayLabel}</strong>
                  </div>
                  <div>
                    <span>Ca làm</span>
                    <strong>{myShift || 'Chưa xếp ca'}</strong>
                  </div>
                </div>

                <div className="card-head" style={{ padding: '0 2px' }}>
                  <span className="step">3</span>
                  <h2 className="card-title">Điền chi tiết từng đầu việc</h2>
                  <p className="card-hint">
                    Không bắt buộc điền hết — chỉ cần điền những task bạn có làm trong ca. Nội dung tự
                    lưu nháp trên máy bạn cho tới khi bấm gửi.
                  </p>
                </div>

                {groups.map((g) => {
                  const open = openGroups[g.group] ?? false;
                  const filled = g.tasks.filter((t) => filledTaskIds.has(t.id)).length;
                  return (
                    <section className="group" key={g.group}>
                      <button
                        className="group-head"
                        onClick={() => setOpenGroups((p) => ({ ...p, [g.group]: !open }))}
                      >
                        <h3>{g.group}</h3>
                        <span className="group-meta">
                          <span className="counter" data-zero={filled === 0}>
                            {filled}/{g.tasks.length}
                          </span>
                          {open ? 'Thu gọn ▲' : 'Mở ra ▼'}
                        </span>
                      </button>

                      {open ? (
                        <div className="group-body">
                          {g.tasks.map((t) => {
                            const val = answers[t.id] ?? { status: '', answers: {} };
                            return (
                              <div className="task" key={t.id}>
                                <div className="task-head">
                                  <div className="task-name">{t.name}</div>
                                  <div className="status-row">
                                    {STATUSES.map((s) => (
                                      <button
                                        key={s.value}
                                        className="status"
                                        data-tone={s.tone}
                                        data-active={val.status === s.value}
                                        onClick={() => setStatus(t.id, s.value)}
                                      >
                                        {s.value}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="qa">
                                  {questionsOf(t).map((q) => (
                                    <div className="field" key={q.id}>
                                      <label htmlFor={`${t.id}-${q.id}`}>
                                        {q.label ? (
                                          <>
                                            <b>{q.label}</b> — <i>{q.prompt}</i>
                                          </>
                                        ) : (
                                          <i>{q.prompt}</i>
                                        )}
                                      </label>
                                      <textarea
                                        id={`${t.id}-${q.id}`}
                                        value={val.answers[q.id] ?? ''}
                                        placeholder="Nhập nội dung chi tiết…"
                                        onChange={(e) => setAnswer(t.id, q.id, e.target.value)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  );
                })}

                <section className="card">
                  <div className="card-head">
                    <h2 className="card-title">Ghi chú chung trong ca</h2>
                    <p className="card-hint">Vấn đề phát sinh, việc cần bàn giao cho ca sau…</p>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Máy in tentcard lầu 2 bị kẹt giấy, đã báo kỹ thuật lúc 15:00."
                    style={{ minHeight: 96 }}
                  />
                </section>
              </>
            ) : null}
          </>
        )}

        <p className="footer">
          Dữ liệu nguồn: Google Sheets “Lịch làm parttime” · Báo cáo được ghi vào sheet “Báo cáo”.
        </p>
      </main>

      {tab === 'report' && employee && dayIndex >= 0 ? (
        <div className="dock">
          <div className="dock-inner">
            <div className="dock-info">
              Đã điền <b>{filledTaskIds.size}</b>/{totalTasks} đầu việc — {employee} · {dayLabel}
            </div>
            <button className="btn" onClick={handleSubmit} disabled={sending || filledTaskIds.size === 0}>
              {sending ? 'Đang gửi…' : 'Gửi báo cáo vào Google Sheets'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Header({ sheetUrl, source }: { sheetUrl: string; source: Bootstrap['source'] | null }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div>
          <h1 className="brand-title">MKT Assistant Portal</h1>
          <p className="brand-sub">Lịch làm theo tuần &amp; biểu mẫu báo cáo công việc</p>
        </div>
        <div className="topbar-actions">
          {source === 'sheet' ? (
            <span className="pill pill-live">● Đang nối Google Sheets</span>
          ) : source === 'demo' ? (
            <span className="pill pill-demo">● Dữ liệu mẫu — chưa nối Sheets</span>
          ) : null}
          <a className="pill pill-ghost" href={sheetUrl} target="_blank" rel="noreferrer">
            Mở Google Sheets ↗
          </a>
        </div>
      </div>
    </header>
  );
}

function ScheduleView({ weeks }: { weeks: Week[] }) {
  if (!weeks.length) {
    return <div className="banner banner-warn">Chưa đọc được tuần nào từ sheet “Lịch làm”.</div>;
  }
  return (
    <>
      {weeks.map((w, wi) => (
        <section className="card" key={w.label + wi}>
          <div className="card-head">
            <h2 className="card-title">Tuần {w.label}</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Vị trí</th>
                  {w.days.map((d, i) => (
                    <th key={d + i}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {w.staff.map((s) => (
                  <tr key={s.name}>
                    <td className="name">{s.name}</td>
                    <td className="pos">{s.position}</td>
                    {w.days.map((_, i) => {
                      const shift = s.shifts[i] ?? '';
                      const kind = shiftKind(shift);
                      return (
                        <td key={i}>
                          <span className={`tag tag-${kind === 'work' ? 'work' : kind === 'off' ? 'off' : 'none'}`}>
                            {kind === 'off' ? 'OFF' : kind === 'empty' ? '—' : shift}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {w.coverage.map((c) => (
                  <tr className="cover" key={c.range}>
                    <td className="name">{c.range}</td>
                    <td className="pos">Độ phủ ca</td>
                    {w.days.map((_, i) => {
                      const v = c.values[i] ?? '';
                      const lack = /thiếu/i.test(v);
                      return (
                        <td key={i}>
                          <span className={lack ? 'lack' : 'ok'}>{v || '—'}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
