# MKT Assistant Portal

Trang web nội bộ cho đội MKT Assistant: xem **lịch làm theo tuần** và **điền báo cáo chi tiết
từng đầu việc**, dữ liệu đọc/ghi trực tiếp vào Google Sheets
[“Lịch làm parttime”](https://docs.google.com/spreadsheets/d/1KRaohYpialvnq_HSQFMbNWl_uFAOKnB5xkBXr_UIlOM/edit).

## Cách hoạt động

```
Google Sheets  ──►  Apps Script Web App  ──►  Next.js API route  ──►  Trang web (Vercel)
  Lịch làm            (Code.gs)                /api/data                 chọn tên → chọn ngày
  Task                                         /api/submit               → điền form → Gửi
  Báo cáo    ◄──────────────────────────────────────────────────────────────────┘
```

- **Sheet “Lịch làm”** — mỗi tuần là một block mới nối tiếp phía dưới. Script tự dò dòng tiêu đề
  (dòng có ô `Nhân viên`) nên **tuần mới bạn thêm vào hàng tuần sẽ tự hiện trên web**, không cần
  sửa code.
- **Sheet “Task”** — nguồn của toàn bộ câu hỏi trong form. Thêm/sửa task hoặc câu hỏi trong sheet
  là form trên web đổi theo.
- **Sheet “Báo cáo”** — script tự tạo lần đầu, mỗi câu trả lời là một dòng:
  `Thời gian nộp | Ngày làm việc | Nhân viên | Vị trí | Ca làm | Tuần | Nhóm công việc | Tên Task | Câu hỏi | Nội dung nhân viên điền | Trạng thái | Ghi chú chung`

Khoá `APPS_SCRIPT_URL` chỉ nằm ở server (Vercel env var), không lộ ra trình duyệt.

## Link đã deploy

- **Trang web:** https://portal-mkt-assistant-truc-dangs-projects-428d51c3.vercel.app
- **Vercel project:** `portal-mkt-assistant` (team *truc dang's projects*)
- **Repo:** https://github.com/newallket02-hash/kiemtranghiduong

Nếu mở link mà Vercel bắt đăng nhập: vào project → **Settings → Deployment Protection** →
tắt **Vercel Authentication**, để nhân viên vào được bằng link.

## Cài đặt (1 lần duy nhất, ~5 phút)

### Bước 1 — Deploy backend Apps Script

1. Mở Google Sheets → **Tiện ích mở rộng (Extensions)** → **Apps Script**.
2. Xoá hết code mặc định, dán toàn bộ nội dung file [`apps-script/Code.gs`](apps-script/Code.gs).
3. Bấm **Deploy** → **New deployment** → bánh răng chọn **Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
4. Bấm **Deploy**, cấp quyền, rồi copy **Web app URL** (dạng `https://script.google.com/macros/s/.../exec`).

> Mỗi lần sửa `Code.gs` phải **Deploy → Manage deployments → Edit → New version** thì URL cũ mới
> nhận code mới.

### Bước 2 — Nối URL vào web

Có hai cách, chọn một:

**Cách A — biến môi trường (khuyến nghị):**
1. Vercel project → **Settings** → **Environment Variables**.
2. Thêm `APPS_SCRIPT_URL` = URL vừa copy (chọn cả Production + Preview).
3. **Deployments** → deployment mới nhất → **Redeploy**.

**Cách B — dán vào code:** gửi URL đó cho Claude, hoặc tự sửa
[`lib/config.ts`](lib/config.ts) (`APPS_SCRIPT_URL_FALLBACK = 'https://script.google.com/.../exec'`)
rồi deploy lại.

Xong. Nhãn ở góc phải header đổi từ *“Dữ liệu mẫu — chưa nối Sheets”* sang *“Đang nối Google Sheets”*.

## Chạy ở máy

```bash
npm install
cp .env.example .env.local     # điền APPS_SCRIPT_URL
npm run dev                    # http://localhost:3000
```

Chưa có `APPS_SCRIPT_URL` thì web vẫn chạy ở chế độ dữ liệu mẫu (ảnh chụp sheet ngày 20/8) để xem
giao diện — nhưng nút gửi sẽ báo lỗi vì không có nơi để ghi.

## Cấu trúc

| Đường dẫn | Vai trò |
| --- | --- |
| `apps-script/Code.gs` | Backend đọc sheet “Lịch làm”/“Task”, ghi sheet “Báo cáo” |
| `app/portal.tsx` | Toàn bộ giao diện (chọn tuần/tên/ngày, form task, bảng lịch) |
| `app/api/data/route.ts` | GET dữ liệu, tự fallback sang dữ liệu mẫu nếu chưa cấu hình |
| `app/api/submit/route.ts` | POST báo cáo, lọc bỏ ô trống trước khi ghi |
| `lib/backend.ts` | Gọi Apps Script, xử lý lỗi |
| `lib/demo-data.ts` | Dữ liệu mẫu dùng khi chưa nối sheet |

## Ghi chú vận hành

- Nội dung đang gõ dở được **tự lưu nháp** trong trình duyệt theo từng cặp *nhân viên + ngày*, tắt
  máy mở lại vẫn còn; nháp bị xoá sau khi gửi thành công.
- Trang tự chọn đúng **tuần hiện tại** và **ngày hôm nay** dựa trên nhãn ngày trong sheet.
- Nhân viên chỉ cần điền những task có làm trong ca — không bắt buộc điền hết.
- Dữ liệu đọc từ sheet được cache 60 giây, nên sau khi sửa sheet chậm nhất 1 phút là web cập nhật.
