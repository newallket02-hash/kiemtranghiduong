import { NextResponse } from 'next/server';
import { scriptUrl, submitReport } from '@/lib/backend';
import type { ReportEntry, ReportPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';

function str(v: unknown, max = 4000): string {
  return String(v ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  if (!scriptUrl()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Chưa cấu hình APPS_SCRIPT_URL trên Vercel nên chưa ghi được vào Google Sheets. Xem hướng dẫn trong README.',
      },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Dữ liệu gửi lên không hợp lệ' }, { status: 400 });
  }

  const employee = str(body.employee, 120);
  const date = str(body.date, 120);
  if (!employee || !date) {
    return NextResponse.json(
      { ok: false, error: 'Thiếu tên nhân viên hoặc ngày làm việc' },
      { status: 400 }
    );
  }

  const rawEntries = Array.isArray(body.entries) ? body.entries : [];
  const entries: ReportEntry[] = rawEntries
    .map((e: any) => ({
      group: str(e?.group, 200),
      task: str(e?.task, 300),
      question: str(e?.question, 500),
      answer: str(e?.answer),
      status: str(e?.status, 50),
    }))
    .filter((e: ReportEntry) => e.answer.length > 0 || e.status.length > 0)
    .slice(0, 300);

  if (!entries.length) {
    return NextResponse.json(
      { ok: false, error: 'Bạn chưa điền nội dung nào để gửi' },
      { status: 400 }
    );
  }

  const payload: ReportPayload = {
    employee,
    date,
    position: str(body.position, 120),
    shift: str(body.shift, 120),
    week: str(body.week, 120),
    note: str(body.note),
    entries,
  };

  try {
    const { saved } = await submitReport(payload);
    return NextResponse.json({ ok: true, saved });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
