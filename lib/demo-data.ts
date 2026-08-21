import type { Week, TaskGroup } from './types';

/**
 * Ảnh chụp dữ liệu từ Google Sheets "Lịch làm parttime" (ngày 20/8).
 * Chỉ dùng khi chưa cấu hình APPS_SCRIPT_URL — để trang web vẫn xem được ngay.
 * Khi đã nối Apps Script, toàn bộ dữ liệu lấy trực tiếp từ Sheet.
 */

export const DEMO_WEEKS: Week[] = [
  {
    label: '17/8 - 23/8',
    days: ['Thứ 2 (17/8)', 'Thứ 3 (18/8)', 'Thứ 4 (19/8)', 'Thứ 5 (20/8)', 'Thứ 6 (21/8)', 'Thứ 7 (22/8)', 'Chủ Nhật (23/8)'],
    staff: [
      { name: 'Yến Ngọc', position: 'Parttime MKT', shifts: ['OFF', 'OFF', 'OFF', '12:00 - 17:00', '09:00 - 17:00', '09:00 - 17:00', '09:00 - 17:00'] },
      { name: 'Hương', position: 'Assistant MKT', shifts: ['08:30 - 18:00', '08:30 - 18:00', '08:30 - 18:00', '08:30 - 12:00', 'OFF', '08:30 - 18:00', '08:30 - 18:00'] },
      { name: 'Thu Ngọc', position: 'Assistant MKT', shifts: ['08:30 - 18:00', '08:30 - 18:00', '08:30 - 18:00', '08:30 - 18:00', '08:30 - 18:00', '08:30 - 12:00', 'OFF'] },
    ],
    coverage: [
      { range: '17:00 - 18:00', values: ['Đủ', 'Đủ', 'Đủ', 'Đủ', 'Đủ', 'Đủ', 'Đủ'] },
      { range: '18:00 - 24:00', values: ['THIẾU', 'THIẾU', 'THIẾU', 'THIẾU', 'THIẾU', 'THIẾU', 'THIẾU'] },
    ],
  },
  {
    label: '24/8 - 30/8',
    days: ['Thứ 2 (24/8)', 'Thứ 3 (25/8)', 'Thứ 4 (26/8)', 'Thứ 5 (27/8)', 'Thứ 6 (28/8)', 'Thứ 7 (29/8)', 'Chủ Nhật (30/8)'],
    staff: [
      { name: 'Yến Ngọc', position: 'Parttime MKT', shifts: ['off', 'off', 'off', '09:00-17:00', '09:00-17:00', '09:00-17:00', '09:00-17:00'] },
      { name: 'Hương', position: 'Assistant MKT', shifts: ['', '', '', '', '', '08:30 - 18:00', '08:30 - 18:00'] },
      { name: 'Thu Ngọc', position: 'Assistant MKT', shifts: ['08:30 - 18:00', '08:30 - 18:00', '08:30 - 18:00', '08:30 - 18:00', '08:30 - 18:00', '08:30 - 12:00', 'OFF'] },
    ],
    coverage: [
      { range: '17:00 - 18:00', values: ['Đủ', 'Đủ', 'Đủ', 'Đủ', 'Đủ', 'Đủ', 'Đủ'] },
      { range: '18:00 - 24:00', values: ['THIẾU', 'THIẾU', 'THIẾU', 'THIẾU', 'THIẾU', 'THIẾU', 'THIẾU'] },
    ],
  },
  {
    label: '31/8 - 6/9',
    days: ['Thứ 2 (31/8)', 'Thứ 3 (01/9)', 'Thứ 4 (02/9)', 'Thứ 5 (03/9)', 'Thứ 6 (04/9)', 'Thứ 7 (05/9)', 'Chủ Nhật (06/9)'],
    staff: [
      { name: 'Yến Ngọc', position: 'Parttime MKT', shifts: ['', '', '', '', '', '', ''] },
      { name: 'Hương', position: 'Assistant MKT', shifts: ['', '', '', '', '', '08:30 - 18:00', '08:30 - 18:00'] },
      { name: 'Thu Ngọc', position: 'Assistant MKT', shifts: ['08:30 - 18:00', '08:30 - 18:00', '08:30 - 18:00', '08:30 - 18:00', '08:30 - 18:00', '08:30 - 12:00', 'OFF'] },
    ],
    coverage: [
      { range: '17:00 - 18:00', values: ['Đủ', 'Đủ', 'Đủ', 'Đủ', 'Đủ', 'Đủ', 'Đủ'] },
      { range: '18:00 - 24:00', values: ['THIẾU', 'THIẾU', 'THIẾU', 'THIẾU', 'THIẾU', 'THIẾU', 'THIẾU'] },
    ],
  },
];

function q(items: [string, string][]) {
  return items.map(([label, prompt], i) => ({ id: `q${i + 1}`, label, prompt }));
}

export const DEMO_TASK_GROUPS: TaskGroup[] = [
  {
    group: '1. Đón tiếp & Vận hành thực địa',
    tasks: [
      {
        id: 'kiem-tra-hoat-dong-offline-1-0',
        name: 'Kiểm tra hoạt động offline buổi sáng/chiều',
        questions: q([['Kiểm tra gì', 'Cụ thể là gì?']]),
      },
      {
        id: 'kiem-tra-so-luong-khach-1-1',
        name: 'Kiểm tra số lượng khách Gym/Cafe/HSSV',
        questions: q([['', 'Cập nhật số lượng vào file/phần mềm nào, chốt số liệu mấy lần/ngày?']]),
      },
      {
        id: 'ho-tro-van-hanh-huong-dan-khach-1-2',
        name: 'Hỗ trợ vận hành hướng dẫn khách',
        questions: q([
          ['Tương tác', 'Đón khách từ khu vực nào, dẫn khách đến đúng vị trí/phòng nào?'],
          ['Thông tin', 'Cần tư vấn/hướng dẫn những thông tin cơ bản nào cho khách khi mới đến?'],
          ['Phối hợp', 'Khi quá tải khách thì phối hợp với bộ phận nào để điều phối?'],
        ]),
      },
      {
        id: 'chup-hinh-tv-standee-tentcard-1-3',
        name: 'Chụp hình TV, standee, tentcard sảnh - lầu 1, 2, 3 và hoàn thành file',
        questions: q([
          ['Thời gian', 'Chụp vào khung giờ nào trong ngày (sáng trước đón khách hay sau ca làm)?'],
          ['Lưu trữ', 'Tải ảnh lên folder Drive nào, đặt tên file theo quy chuẩn ra sao?'],
        ]),
      },
    ],
  },
  {
    group: '2. Tư vấn & Chăm sóc khách hàng',
    tasks: [
      {
        id: 'kiem-tra-tin-nhan-booking-2-0',
        name: 'Kiểm tra tin nhắn booking khách trên Zalo & KaKaoTalk',
        questions: q([
          ['Tài khoản', 'Kiểm tra trên những tài khoản/kênh cụ thể nào (Zalo OA, Zalo Hotline, KaKaoTalk)?'],
          ['Tần suất', 'Mấy phút phải F5/kiểm tra tin nhắn 1 lần?'],
          ['Bàn giao', 'Với tin nhắn chưa xử lý kịp ca trước thì tiếp nhận và xử lý tiếp ra sao?'],
        ]),
      },
      {
        id: 'tu-van-khach-zalo-oa-2-1',
        name: 'Tư vấn khách trên kênh Zalo OA & KaKaoTalk',
        questions: q([
          ['Kịch bản', 'Dùng file kịch bản tư vấn/mẫu câu trả lời nào cho từng gói dịch vụ?'],
          ['Thời gian', 'Quy định thời gian phản hồi tin nhắn tối đa là bao lâu?'],
          ['Xử lý', 'Khi khách hỏi ngoài tầm hiểu biết/khiếu nại thì chuyển giao cho ai?'],
        ]),
      },
      {
        id: 'check-lich-trong-dat-lich-2-2',
        name: 'Check lịch trống và đặt lịch hẹn cho khách (Zalo OA & KaKaoTalk)',
        questions: q([
          ['Hệ thống', 'Xem lịch trống trên ứng dụng/phần mềm nào?'],
          ['Thông tin', 'Cần lấy đủ những thông tin gì của khách (Họ tên, SĐT, dịch vụ, giờ hẹn...)?'],
          ['Xác nhận', 'Quy trình gửi tin nhắn xác nhận lịch hẹn lại cho khách như thế nào?'],
        ]),
      },
      {
        id: 'kiem-tra-booking-missed-call-2-3',
        name: 'Kiểm tra khách booking và missed call các chi nhánh',
        questions: q([
          ['Hệ thống', 'Kiểm tra cuộc gọi nhỡ trên tổng đài nào, app nào?'],
          ['Chi nhánh', 'Rà soát danh sách missed call của những chi nhánh cụ thể nào?'],
          ['SLA', 'Thời hạn phải gọi lại cho khách cuộc gọi nhỡ là trong bao lâu?'],
        ]),
      },
      {
        id: 'check-lich-trong-dat-lich-b-2-4',
        name: 'Check lịch trống và đặt lịch hẹn cho khách',
        questions: q([
          ['Thao tác', 'Đã thuộc các bước thao tác trên phần mềm quản lý lịch hẹn chưa?'],
          ['Kiểm tra chéo', 'Nhờ ai (tiền bối/quản lý) kiểm tra lại lịch đã đặt để tránh trùng lịch?'],
        ]),
      },
    ],
  },
  {
    group: '3. Quảng cáo, Đánh giá & Khảo sát',
    tasks: [
      {
        id: 'phan-loai-khach-hang-zalo-3-0',
        name: 'Phân loại khách hàng booking/check-in trên Zalo',
        questions: q([
          ['Tiêu chuẩn', 'Dựa vào đâu để phân loại (Khách mới, Khách cũ, Khách VIP, dịch vụ sử dụng...)?'],
          ['Thao tác', 'Gắn thẻ (Tag) tên gì trên Zalo OA, thao tác ở bước nào (sau chat hay sau check-in)?'],
        ]),
      },
      {
        id: 'bao-cao-thong-ke-zalo-oa-3-1',
        name: 'Báo cáo thống kê số liệu & hành vi khách hàng Zalo OA',
        questions: q([
          ['Chỉ số', 'Cần thống kê các số liệu cụ thể nào (Tổng inbox, Tỷ lệ chốt, Khung giờ nhắn nhiều...)?'],
          ['File báo cáo', 'Báo cáo vào file Google Sheets nào, gửi cho ai, hạn chốt (deadline) khi nào?'],
        ]),
      },
      {
        id: 'gui-quang-cao-kakaotalk-3-2',
        name: 'Gửi quảng cáo vào kênh KaKaoTalk',
        questions: q([
          ['Nội dung', 'Lấy hình ảnh và bài viết quảng cáo từ đâu, ai phê duyệt trước khi gửi?'],
          ['Tệp khách', 'Chọn gửi cho toàn bộ danh sách hay nhóm khách hàng mục tiêu cụ thể nào?'],
          ['Đo lường', 'Ghi nhận số lượng tin gửi thành công và lượt tương tác vào đâu?'],
        ]),
      },
      {
        id: 'update-review-gg-maps-3-3',
        name: 'Update review GG Maps',
        questions: q([
          ['Kiểm tra', 'Đăng nhập vào tài khoản Google Business nào để kiểm tra đánh giá?'],
          ['Trả lời', 'Mẫu câu trả lời review tích cực/tiêu cực ra sao?'],
          ['Báo cáo', 'Note lại các review xấu/khiếu nại vào file nào để xử lý?'],
        ]),
      },
      {
        id: 'cap-nhat-form-khao-sat-3-4',
        name: 'Cập nhật số liệu form khảo sát gian hàng',
        questions: q([
          ['Thu thập', 'Lấy dữ liệu từ form online (Google Form) hay nhập từ phiếu giấy?'],
          ['Chỉ số', 'Cần tổng hợp những chỉ số hài lòng nào?'],
          ['File lưu', 'Nhập số liệu vào file Sheets nào, tần suất cập nhật (theo ngày/tuần)?'],
        ]),
      },
      {
        id: 'ho-tro-tu-van-khao-sat-3-5',
        name: 'Hỗ trợ tư vấn khách tham gia chương trình khảo sát',
        questions: q([
          ['Lời mời', 'Nói câu gì để mời khách vui vẻ đồng ý làm khảo sát?'],
          ['Quà tặng', 'Quà/Voucher tặng khách sau khi khảo sát gồm những gì, lấy ở đâu để đưa khách?'],
        ]),
      },
      {
        id: 'moi-khach-danh-gia-quay-so-3-6',
        name: 'Mời khách đánh giá qua link để quay số trúng thưởng voucher',
        questions: q([
          ['Kênh gửi', 'Gửi link đánh giá qua Zalo, SMS hay đưa mã QR cho khách quét trực tiếp?'],
          ['Xác minh', 'Kiểm tra màn hình đánh giá của khách thế nào trước khi cấp mã quay thưởng?'],
          ['Mã quay số', 'Lấy danh sách mã quay số/voucher từ đâu để phát cho khách?'],
        ]),
      },
      {
        id: 'kiem-tra-khuyen-mai-standee-3-7',
        name: 'Kiểm tra chương trình khuyến mãi của các standee và cập nhật file',
        questions: q([
          ['Đối chiếu', 'Chi tiết % giảm giá, thời gian áp dụng trên standee thực tế có khớp với file gốc không?'],
          ['Cập nhật', 'Nếu phát sinh standee cũ/hết hạn thì note vào file nào và báo cho ai thay?'],
        ]),
      },
      {
        id: 'tham-khao-tin-nhan-zalo-oa-3-8',
        name: 'Kiểm tra và tham khảo tin nhắn trên Zalo OA',
        questions: q([
          ['Nội dung học', 'Tìm đọc những đoạn chat thuộc chủ đề nào (tư vấn giá, xử lý từ chối, chốt lịch...)?'],
          ['Kết quả', 'Note lại được những mẫu câu/kịch bản hay nào áp dụng cho bản thân?'],
        ]),
      },
    ],
  },
  {
    group: '4. Đào tạo, Học tập & Nghiên cứu',
    tasks: [
      {
        id: 'doc-tham-khao-website-4-0',
        name: 'Đọc và tham khảo website',
        questions: q([
          ['Đường link', 'Cần đọc những trang/danh mục cụ thể nào trên website công ty?'],
          ['Kiến thức', 'Nắm được những thông tin cốt lõi nào (lịch sử thương hiệu, bảng giá, FAQ...)?'],
        ]),
      },
      {
        id: 'hoc-menu-nghi-duong-4-1',
        name: 'Đọc menu, học menu nghỉ dưỡng, care và chương trình khuyến mãi',
        questions: q([
          ['Kiến thức', 'Thuộc tên bao nhiêu dịch vụ, thời lượng, giá tiền và công dụng từng gói?'],
          ['Khuyến mãi', 'Nắm rõ những chương trình ưu đãi nào đang chạy, điều kiện áp dụng là gì?'],
        ]),
      },
      {
        id: 'hoc-phan-loai-khach-zalo-4-2',
        name: 'Học phân loại khách hàng trên Zalo OA',
        questions: q([
          ['Quy chuẩn', 'Đã thuộc bộ quy tắc đặt tên Tag/Nhãn trên Zalo OA chưa?'],
          ['Thực hành', 'Đã thử phân loại đúng cho bao nhiêu trường hợp mẫu dưới sự hướng dẫn?'],
        ]),
      },
      {
        id: 'hoc-xac-nhan-lich-hen-4-3',
        name: 'Học xác nhận lịch hẹn dịch vụ',
        questions: q([
          ['Kịch bản', 'Mẫu câu gọi điện/nhắn tin nhắc lịch khách trước 1 ngày/1 giờ là gì?'],
          ['Xử lý', 'Cách nói chuyện như thế nào khi khách báo dời lịch, hủy lịch hoặc đến trễ?'],
        ]),
      },
      {
        id: 'doc-goi-dich-vu-klook-4-4',
        name: 'Đọc các gói dịch vụ trên Klook',
        questions: q([
          ['Thông tin', 'Klook đang bán những gói voucher nào, mức giá và điều kiện sử dụng ra sao?'],
          ['Đối soát', 'Cách nhập/quét mã voucher của khách Klook trên hệ thống khi khách đến?'],
        ]),
      },
      {
        id: 'lam-bai-test-khuyen-mai-q2-4-5',
        name: 'Làm bài test về chương trình khuyến mãi tại Q2',
        questions: q([
          ['Hình thức', 'Làm bài test trên giấy hay link Google Form?'],
          ['Kết quả', 'Đạt bao nhiêu điểm, những câu làm sai đã được hướng dẫn đính chính lại chưa?'],
        ]),
      },
    ],
  },
  {
    group: 'Việc riêng của Yến Ngọc',
    owner: 'Yến Ngọc',
    tasks: [
      {
        id: 'truc-fanpage-5-0',
        name: 'Trực fanpage',
        questions: q([
          ['', 'Trả lời tất cả tin nhắn của khách ở 2 page của Q2, Zalo OA.'],
          ['', 'Tư vấn các dịch vụ và nhận lịch khách đặt qua tin nhắn và hotline'],
          ['', 'Phản hồi những khiếu nại của khách'],
          ['', 'Kiểm tra clip tik tok của khách'],
        ]),
      },
      { id: 'nghe-hotline-5-1', name: 'Nghe hotline: tư vấn dịch vụ và hỗ trợ đặt lịch cho khách', questions: [] },
      { id: 'kiem-tra-klook-5-2', name: 'Kiểm tra Klook', questions: [] },
      { id: 'nhap-so-lieu-hssv-5-3', name: 'Nhập số liệu HSSV, ưu đãi 139k, tổng khách', questions: [] },
      { id: 'ho-tro-check-out-5-4', name: 'Hỗ trợ check out cho lễ tân', questions: [] },
      { id: 'ho-tro-fill-quan-ao-5-5', name: 'Hỗ trợ fill quần áo, khăn, cắt phiếu trứng', questions: [] },
      { id: 'huong-dan-khu-tu-giay-5-6', name: 'Hướng dẫn khách ở khu vực tủ giày', questions: [] },
      { id: 'thuc-hien-khao-sat-5-7', name: 'Thực hiện chương trình khảo sát khách hàng', questions: [] },
    ],
  },
];
