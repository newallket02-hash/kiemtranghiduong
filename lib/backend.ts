import type { Bootstrap, ReportPayload, TaskGroup, Week } from './types';
import { DEMO_TASK_GROUPS, DEMO_WEEKS } from './demo-data';

export const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1KRaohYpialvnq_HSQFMbNWl_uFAOKnB5xkBXr_UIlOM/edit';

export function scriptUrl(): string {
  return (process.env.APPS_SCRIPT_URL || '').trim();
}

/** Apps Script trả 302 sang googleusercontent — fetch mặc định đã follow. */
async function callScript(init: RequestInit & { query?: string }): Promise<any> {
  const base = scriptUrl();
  if (!base) throw new Error('APPS_SCRIPT_URL chưa được cấu hình');

  const url = init.query ? `${base}${base.includes('?') ? '&' : '?'}${init.query}` : base;
  const res = await fetch(url, {
    ...init,
    redirect: 'follow',
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Apps Script trả về HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      'Apps Script không trả về JSON. Kiểm tra lại deployment đang để "Who has access: Anyone".'
    );
  }
}

export async function getBootstrap(): Promise<Bootstrap> {
  const fallback: Bootstrap = {
    ok: true,
    source: 'demo',
    updatedAt: new Date().toISOString(),
    weeks: DEMO_WEEKS,
    taskGroups: DEMO_TASK_GROUPS,
  };

  if (!scriptUrl()) {
    return { ...fallback, error: 'Chưa cấu hình APPS_SCRIPT_URL — đang hiển thị dữ liệu mẫu.' };
  }

  try {
    const data = await callScript({ method: 'GET', query: 'action=bootstrap' });
    if (!data || data.ok !== true) {
      throw new Error(data?.error || 'Apps Script báo lỗi không xác định');
    }
    const weeks = (data.weeks || []) as Week[];
    const taskGroups = (data.taskGroups || []) as TaskGroup[];
    if (!weeks.length && !taskGroups.length) {
      throw new Error('Apps Script không đọc được dữ liệu từ sheet');
    }
    return {
      ok: true,
      source: 'sheet',
      updatedAt: data.updatedAt || new Date().toISOString(),
      weeks,
      taskGroups,
    };
  } catch (err) {
    return {
      ...fallback,
      error: `Không kết nối được Google Sheets (${
        err instanceof Error ? err.message : String(err)
      }). Đang hiển thị dữ liệu mẫu.`,
    };
  }
}

export async function submitReport(payload: ReportPayload): Promise<{ saved: number }> {
  const data = await callScript({
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'submit', ...payload }),
  });
  if (!data || data.ok !== true) {
    throw new Error(data?.error || 'Apps Script không lưu được báo cáo');
  }
  return { saved: Number(data.saved) || 0 };
}
