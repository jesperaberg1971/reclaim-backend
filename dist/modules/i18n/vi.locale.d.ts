export declare const VI_LOCALE: {
    readonly mobile: {
        readonly uploadButton: "Chụp hóa đơn";
        readonly takePhoto: "Chụp ảnh";
        readonly chooseFromGallery: "Chọn từ thư viện";
        readonly processing: "Đang xử lý hóa đơn...";
        readonly uploadSuccess: "Hóa đơn đã tải lên thành công";
        readonly uploadFailed: "Tải lên thất bại, vui lòng thử lại";
        readonly gpsRecorded: "Đã ghi nhận vị trí GPS";
        readonly preview: "Xem trước hóa đơn";
        readonly amountDetected: "Số tiền phát hiện";
        readonly merchantName: "Tên cửa hàng";
        readonly date: "Ngày";
        readonly submit: "Gửi";
        readonly cameraPermission: "Ứng dụng cần quyền truy cập camera để chụp hóa đơn";
        readonly notificationPermission: "Cho phép nhận thông báo khi hóa đơn được xử lý";
        readonly offlineMode: "Bạn đang ngoại tuyến. Hóa đơn sẽ được gửi khi có kết nối.";
        readonly uploadInProgress: "Đang tải lên {count} hóa đơn...";
        readonly syncing: "Đang đồng bộ dữ liệu...";
    };
    readonly status: {
        readonly processing: "Đang xử lý";
        readonly needsReview: "Cần xem xét";
        readonly complete: "Hoàn thành";
        readonly rejected: "Từ chối";
        readonly gate1Approved: "Phụ cấp công tác (Gate 1) được duyệt";
        readonly gate2Approved: "Phúc lợi (Gate 2) được duyệt";
        readonly gate3Approved: "Hoàn tiền thẻ cá nhân (Gate 3) được duyệt";
        readonly pdfGenerated: "Đã tạo Quyết định cử đi công tác";
        readonly pdfMissing: "Chưa có PDF Quyết định";
        readonly exportSuccess: "Xuất dữ liệu thành công";
    };
    readonly dashboard: {
        readonly reviewExpenses: "Xem xét hóa đơn";
        readonly pendingReview: "Chờ xem xét";
        readonly approvedExpenses: "Hóa đơn đã duyệt";
        readonly exportPeriod: "Xuất theo kỳ";
        readonly downloadDocuments: "Tải tài liệu hỗ trợ";
        readonly exportToERP: "Xuất sang ERP";
        readonly clientOverview: "Tổng quan khách hàng";
        readonly recentActivity: "Hoạt động gần đây";
        readonly noExpenses: "Không có hóa đơn trong kỳ này";
    };
    readonly policy: {
        readonly companyPolicy: "Chính sách công ty";
        readonly defaultPolicy: "Chính sách mặc định";
        readonly editPolicy: "Chỉnh sửa chính sách";
        readonly perDiemRate: "Phụ cấp công tác hàng ngày";
        readonly welfareCapMonthly: "Giới hạn phúc lợi hàng tháng";
        readonly allowedCategories: "Danh mục được phép";
        readonly savePolicy: "Lưu chính sách";
        readonly policyUpdated: "Chính sách đã được cập nhật";
    };
    readonly approval: {
        readonly pendingApproval: "Chờ phê duyệt";
        readonly newExpensesReady: "Có hóa đơn mới cần xem xét";
        readonly expenseApproved: "Hóa đơn đã được phê duyệt";
        readonly expenseRejected: "Hóa đơn bị từ chối";
        readonly receiptProcessed: "Hóa đơn của bạn đã được xử lý";
        readonly tripDecisionReady: "Quyết định cử đi công tác đã sẵn sàng";
        readonly emailSubjectNewReview: "Hóa đơn mới cần xem xét - Reclaim";
        readonly emailSubjectApproved: "Hóa đơn đã được phê duyệt";
    };
    readonly tripDecision: {
        readonly title: "Quyết định cử đi công tác";
        readonly employeeName: "Họ và tên nhân viên";
        readonly employeeId: "Mã nhân viên";
        readonly tripDates: "Thời gian công tác";
        readonly destination: "Địa điểm";
        readonly perDiemAllowance: "Phụ cấp công tác";
        readonly totalAmount: "Tổng số tiền";
        readonly directorSignature: "Chữ ký giám đốc";
        readonly companyStamp: "Dấu công ty";
    };
    readonly errors: {
        readonly somethingWrong: "Đã xảy ra lỗi, vui lòng thử lại";
        readonly imageTooBlurry: "Hình ảnh quá mờ, vui lòng chụp lại";
        readonly noInternet: "Không có kết nối internet";
        readonly sessionExpired: "Phiên làm việc hết hạn, vui lòng đăng nhập lại";
        readonly noPermission: "Bạn không có quyền xem hóa đơn này";
        readonly fileTooLarge: "Tệp quá lớn (tối đa 10MB)";
        readonly wrongFormat: "Định dạng tệp không được hỗ trợ (chỉ JPG, PNG)";
    };
    readonly common: {
        readonly save: "Lưu";
        readonly cancel: "Hủy";
        readonly confirm: "Xác nhận";
        readonly back: "Quay lại";
        readonly next: "Tiếp tục";
        readonly export: "Xuất dữ liệu";
        readonly download: "Tải xuống";
        readonly viewDetails: "Xem chi tiết";
        readonly close: "Đóng";
        readonly search: "Tìm kiếm";
        readonly filter: "Lọc";
        readonly dateFormat: "dd/mm/yyyy";
        readonly numberFormat: "1.234.567";
    };
    readonly onboarding: {
        readonly welcome: "Chào mừng đến với Reclaim!";
        readonly step1Title: "Chụp hóa đơn dễ dàng";
        readonly step1Desc: "Chỉ cần chụp ảnh hóa đơn bán lẻ và gửi ngay";
        readonly step2Title: "Hệ thống tự động phân loại";
        readonly step2Desc: "3 cổng tự động xử lý theo chính sách công ty";
        readonly getStarted: "Bắt đầu ngay";
    };
};
export type ViLocale = typeof VI_LOCALE;
