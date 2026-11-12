import { currentLocale } from './index'

const APP_ERROR_PREFIXES = [
  'bad request: ',
  'not found: ',
  'internal error: ',
  'db error: ',
  'http error: ',
]

type LangPair = {
  en: string
  vi: string
}

/**
 * Strip Rust `AppError` category prefixes (e.g. `"bad request: "`) when there
 * is a non-empty message after the prefix; preserve the raw string otherwise so
 * diagnostics are never reduced to an empty message.
 */
export function stripAppErrorPrefix(message: string): string {
  let current = message.trim()
  let stripped = true
  while (stripped) {
    stripped = false
    const lower = current.toLowerCase()
    for (const prefix of APP_ERROR_PREFIXES) {
      if (lower.startsWith(prefix)) {
        const rest = current.slice(prefix.length).trim()
        if (rest) {
          current = rest
          stripped = true
        }
        break
      }
    }
  }
  return current
}

const EXACT_TRANSLATIONS: Record<string, LangPair> = {
  // TTS / Speech
  '朗读文本为空': { en: 'Text to speak is empty', vi: 'Nội dung cần đọc đang trống' },
  '朗读文本不能为空': { en: 'Text to speak cannot be empty', vi: 'Nội dung cần đọc không được để trống' },
  '该片段没有可朗读的内容': { en: 'This segment has no speakable text', vi: 'Đoạn này không có nội dung để đọc' },
  '请填写语音音色': { en: 'Please enter a TTS voice', vi: 'Vui lòng nhập giọng đọc TTS' },
  '请选择音色': { en: 'Please select a voice', vi: 'Vui lòng chọn giọng đọc' },
  '请先选择 Edge 朗读音色': { en: 'Please select an Edge TTS voice first', vi: 'Vui lòng chọn giọng đọc Edge trước' },
  '请先选择朗读引擎': { en: 'Please select a TTS engine first', vi: 'Vui lòng chọn bộ đọc TTS trước' },
  '请提供要删除的朗读引擎 id 或名称': { en: 'Please provide the TTS engine ID or name to delete', vi: 'Vui lòng cung cấp ID hoặc tên bộ đọc cần xóa' },
  '请输入朗读引擎文件的地址': { en: 'Please enter the TTS engine file URL', vi: 'Vui lòng nhập địa chỉ tệp bộ đọc TTS' },
  '语音服务返回了空音频': { en: 'Speech service returned empty audio', vi: 'Dịch vụ giọng nói trả về âm thanh trống' },
  '朗读引擎返回了空音频': { en: 'TTS engine returned empty audio', vi: 'Bộ đọc TTS trả về âm thanh trống' },
  '不支持的语音接口格式': { en: 'Unsupported speech API format', vi: 'Định dạng API giọng nói không được hỗ trợ' },
  '语音服务地址无效': { en: 'Invalid speech service URL', vi: 'Địa chỉ dịch vụ giọng nói không hợp lệ' },
  '语音服务地址仅支持 HTTP 或 HTTPS': { en: 'Speech service URL only supports HTTP or HTTPS', vi: 'Địa chỉ dịch vụ giọng nói chỉ hỗ trợ HTTP hoặc HTTPS' },
  '语音服务地址不能包含账号或密码': { en: 'Speech service URL cannot contain username or password', vi: 'Địa chỉ dịch vụ giọng nói không được chứa tài khoản hoặc mật khẩu' },
  'HTTP 代理地址无效': { en: 'Invalid HTTP proxy URL', vi: 'Địa chỉ HTTP proxy không hợp lệ' },
  'HTTP 代理地址仅支持 HTTP 或 HTTPS': { en: 'HTTP proxy URL only supports HTTP or HTTPS', vi: 'Địa chỉ HTTP proxy chỉ hỗ trợ HTTP hoặc HTTPS' },
  '朗读引擎地址为空': { en: 'TTS engine URL is empty', vi: 'Địa chỉ bộ đọc TTS trống' },
  '朗读引擎数据格式不正确': { en: 'Invalid TTS engine data format', vi: 'Định dạng dữ liệu bộ đọc TTS không đúng' },
  '朗读引擎文件格式不正确：应为 JSON 数组，或含 data 数组的对象': { en: 'Invalid TTS engine file format: expected a JSON array or an object with data[]', vi: 'Định dạng tệp bộ đọc không đúng: cần mảng JSON hoặc đối tượng có mảng data' },
  '朗读引擎请求配置必须是 JSON 对象': { en: 'TTS engine request config must be a JSON object', vi: 'Cấu hình yêu cầu bộ đọc phải là đối tượng JSON' },
  '朗读请求参数格式不正确': { en: 'Invalid speech request parameter format', vi: 'Định dạng tham số yêu cầu đọc không đúng' },
  '该朗读引擎依赖 WebView 渲染，桌面版暂不支持': { en: 'This TTS engine requires WebView rendering and is not supported on desktop', vi: 'Bộ đọc này phụ thuộc WebView, chưa hỗ trợ trên bản máy tính' },
  '没有收到音频数据': { en: 'No audio data received', vi: 'Không nhận được dữ liệu âm thanh' },
  '没有返回音频数据': { en: 'No audio data returned', vi: 'Không trả về dữ liệu âm thanh' },
  '返回的不是音频（可能是错误页）': { en: 'Response is not audio (may be an error page)', vi: 'Phản hồi không phải âm thanh (có thể là trang lỗi)' },
  '音频帧过短': { en: 'Audio frame too short', vi: 'Khung âm thanh quá ngắn' },
  '音频帧头长度越界': { en: 'Audio frame header length out of bounds', vi: 'Độ dài tiêu đề khung âm thanh vượt giới hạn' },
  '音频帧缺少 Path:audio': { en: 'Audio frame missing Path:audio', vi: 'Khung âm thanh thiếu Path:audio' },
  '音频帧没有音频数据': { en: 'Audio frame has no audio data', vi: 'Khung âm thanh không có dữ liệu' },
  '音色列表格式不正确': { en: 'Invalid voice list format', vi: 'Định dạng danh sách giọng đọc không đúng' },
  '音色列表为空': { en: 'Voice list is empty', vi: 'Danh sách giọng đọc trống' },
  '令牌响应不是合法 JSON': { en: 'Token response is not valid JSON', vi: 'Phản hồi token không phải JSON hợp lệ' },
  '令牌响应缺少区域或 token': { en: 'Token response missing region or token', vi: 'Phản hồi token thiếu khu vực hoặc token' },
  '服务地址无效': { en: 'Invalid service URL', vi: 'Địa chỉ dịch vụ không hợp lệ' },
  '服务地址缺少主机名': { en: 'Service URL missing hostname', vi: 'Địa chỉ dịch vụ thiếu tên máy chủ' },
  '合成超时（30 秒）': { en: 'Synthesis timed out (30s)', vi: 'Tổng hợp giọng nói quá thời gian (30 giây)' },
  '朗读失败': { en: 'TTS failed', vi: 'Đọc thành tiếng thất bại' },

  // Bookshelf / Reader / Sources
  '书籍未加入书架': { en: 'Book is not in bookshelf', vi: 'Sách chưa được thêm vào kệ sách' },
  '书籍不存在': { en: 'Book not found', vi: 'Không tìm thấy sách' },
  '请先加入书架': { en: 'Please add book to bookshelf first', vi: 'Vui lòng thêm sách vào kệ sách trước' },
  '未配置书源': { en: 'Book source is not configured', vi: 'Chưa cấu hình nguồn truyện' },
  '书源不存在': { en: 'Book source not found', vi: 'Không tìm thấy nguồn truyện' },
  '书籍信息错误': { en: 'Invalid book information', vi: 'Thông tin sách không hợp lệ' },
  '没有找到需要缓存的章节': { en: 'No chapters found to cache', vi: 'Không tìm thấy chương nào cần lưu đệm' },
  '书源正文解析为空，请检查正文规则': { en: 'Parsed chapter content is empty; check content rules', vi: 'Nội dung phân tích trống, vui lòng kiểm tra quy tắc nội dung của nguồn' },
  '只能打开网页地址': { en: 'Only web URLs can be opened', vi: 'Chỉ có thể mở địa chỉ web' },
  '分组数量已达上限(31), 无法再创建新分组': { en: 'Group limit (31) reached, cannot create more groups', vi: 'Đã đạt giới hạn 31 nhóm, không thể tạo thêm' },
  '请输入 http(s) 或 legado:// / yuedu:// 开头的一键导入链接': { en: 'Please enter a link starting with http(s), legado://, or yuedu://', vi: 'Vui lòng nhập liên kết bắt đầu bằng http(s), legado:// hoặc yuedu://' },
  '这个导入链接里没有 src 参数': { en: 'Import link is missing the src parameter', vi: 'Liên kết nhập thiếu tham số src' },
  '导入链接里的地址必须是 http(s)': { en: 'Address inside import link must be http(s)', vi: 'Địa chỉ trong liên kết nhập phải là http(s)' },
  '导入链接必须以 http:// 或 https:// 开头': { en: 'Import link must start with http:// or https://', vi: 'Liên kết nhập phải bắt đầu bằng http:// hoặc https://' },
  '远程文件内容为空': { en: 'Remote file content is empty', vi: 'Nội dung tệp từ xa trống' },
  '未知的代理模式': { en: 'Unknown proxy mode', vi: 'Chế độ proxy không xác định' },

  // Local books / Upload
  '仅支持上传 .epub 文件': { en: 'Only .epub files are supported', vi: 'Chỉ hỗ trợ tải lên tệp .epub' },
  'EPUB 文件不能为空': { en: 'EPUB file cannot be empty', vi: 'Tệp EPUB không được để trống' },
  'EPUB 文件不能超过 80MB': { en: 'EPUB file cannot exceed 80 MB', vi: 'Tệp EPUB không được vượt quá 80 MB' },
  'EPUB 文件损坏': { en: 'Corrupted EPUB file', vi: 'Tệp EPUB bị hỏng' },
  'EPUB 章节不存在': { en: 'EPUB chapter not found', vi: 'Không tìm thấy chương EPUB' },
  '章节不存在': { en: 'Chapter not found', vi: 'Không tìm thấy chương' },
  'EPUB 未找到可阅读章节': { en: 'No readable chapters found in EPUB', vi: 'Không tìm thấy chương đọc được trong EPUB' },
  '本地 EPUB 不存在': { en: 'Local EPUB file not found', vi: 'Không tìm thấy tệp EPUB nội bộ' },
  '仅支持上传 .pdf 文件': { en: 'Only .pdf files are supported', vi: 'Chỉ hỗ trợ tải lên tệp .pdf' },
  'PDF 文件不能为空': { en: 'PDF file cannot be empty', vi: 'Tệp PDF không được để trống' },
  'PDF 文件不能超过 100MB': { en: 'PDF file cannot exceed 100 MB', vi: 'Tệp PDF không được vượt quá 100 MB' },
  'PDF 文件没有可读页面': { en: 'PDF file has no readable pages', vi: 'Tệp PDF không có trang đọc được' },
  'PDF 文件没有可读章节': { en: 'PDF file has no readable chapters', vi: 'Tệp PDF không có chương đọc được' },
  'PDF 暂不支持导出': { en: 'PDF export is not supported yet', vi: 'Chưa hỗ trợ xuất sách PDF' },
  '本地 PDF 不存在': { en: 'Local PDF file not found', vi: 'Không tìm thấy tệp PDF nội bộ' },
  '仅支持上传 .txt 文件': { en: 'Only .txt files are supported', vi: 'Chỉ hỗ trợ tải lên tệp .txt' },
  'TXT 文件不能为空': { en: 'TXT file cannot be empty', vi: 'Tệp TXT không được để trống' },
  'TXT 文件不能超过 50MB': { en: 'TXT file cannot exceed 50 MB', vi: 'Tệp TXT không được vượt quá 50 MB' },
  'TXT 文件内容不能为空': { en: 'TXT file content cannot be empty', vi: 'Nội dung tệp TXT không được để trống' },
  '本地 TXT 不存在': { en: 'Local TXT file not found', vi: 'Không tìm thấy tệp TXT nội bộ' },

  // WebDAV & Backup
  '请完整填写网盘地址、账号和密码': { en: 'Please fill in WebDAV URL, username, and password', vi: 'Vui lòng điền đầy đủ địa chỉ WebDAV, tài khoản và mật khẩu' },
  '网盘地址格式无效': { en: 'Invalid WebDAV URL format', vi: 'Định dạng địa chỉ WebDAV không hợp lệ' },
  '网盘地址仅支持 HTTP 或 HTTPS': { en: 'WebDAV URL only supports HTTP or HTTPS', vi: 'Địa chỉ WebDAV chỉ hỗ trợ HTTP hoặc HTTPS' },
  '网盘地址不能作为目录使用': { en: 'WebDAV root URL cannot be used as a directory', vi: 'Địa chỉ WebDAV không thể dùng làm thư mục' },
  '同步子目录无效': { en: 'Invalid sync subdirectory', vi: 'Thư mục con đồng bộ không hợp lệ' },
  '备份文件不存在': { en: 'Backup file not found', vi: 'Không tìm thấy tệp sao lưu' },
  '备份路径不是文件': { en: 'Backup path is not a file', vi: 'Đường dẫn sao lưu không phải là tệp' },
  '备份压缩包超过 128 MB': { en: 'Backup archive exceeds 128 MB', vi: 'Gói sao lưu vượt quá 128 MB' },
  '远端备份压缩包超过 128 MB': { en: 'Remote backup archive exceeds 128 MB', vi: 'Gói sao lưu từ xa vượt quá 128 MB' },
  '无法识别该备份压缩包': { en: 'Unrecognized backup archive', vi: 'Không thể nhận dạng gói sao lưu này' },
  '备份压缩包存在损坏条目': { en: 'Backup archive contains corrupted entries', vi: 'Gói sao lưu chứa mục bị hỏng' },
  '压缩包中未找到可恢复的数据': { en: 'No restorable data found in archive', vi: 'Không tìm thấy dữ liệu có thể khôi phục trong gói nén' },
  '书名不能为空': { en: 'Book title cannot be empty', vi: 'Tên sách không được để trống' },
  '阅读进度无效': { en: 'Invalid reading progress', vi: 'Tiến độ đọc không hợp lệ' },

  // Update
  '开发模式不能执行自动更新，请使用发布版测试': { en: 'Auto-update cannot run in dev mode; test with a release build', vi: 'Không thể tự động cập nhật trong chế độ dev; vui lòng dùng bản phát hành' },
  '当前已经是最新版本': { en: 'Already on the latest version', vi: 'Hiện đang là phiên bản mới nhất' },
  '更新已取消': { en: 'Update cancelled', vi: 'Đã hủy cập nhật' },
  '正在下载更新文件': { en: 'Downloading update package', vi: 'Đang tải tệp cập nhật' },
  '更新文件下载失败': { en: 'Failed to download update package', vi: 'Tải tệp cập nhật thất bại' },
  '正在校验更新文件': { en: 'Verifying update package', vi: 'Đang xác thực tệp cập nhật' },
  '更新文件校验失败': { en: 'Update package verification failed', vi: 'Xác thực tệp cập nhật thất bại' },
  '保存更新文件失败': { en: 'Failed to save update package', vi: 'Lưu tệp cập nhật thất bại' },
  '更新文件已准备完成': { en: 'Update package is ready', vi: 'Tệp cập nhật đã sẵn sàng' },
  '启动更新失败': { en: 'Failed to launch updater', vi: 'Khởi chạy cập nhật thất bại' },
  '打开更新文件失败': { en: 'Failed to open update package', vi: 'Mở tệp cập nhật thất bại' },
  '更新已下载，应用将退出并开始更新': {
    en: 'Update downloaded; the app will quit to install',
    vi: 'Đã tải xong bản cập nhật, ứng dụng sẽ thoát để cài đặt',
  },
  '更新文件已下载并打开，请按系统提示完成安装': {
    en: 'Update downloaded and opened; please follow system prompts to install',
    vi: 'Đã tải và mở tệp cập nhật, vui lòng làm theo hướng dẫn hệ thống để cài đặt',
  },
  '检查更新失败': { en: 'Failed to check for updates', vi: 'Kiểm tra cập nhật thất bại' },
  '下载更新失败': { en: 'Failed to download update', vi: 'Tải bản cập nhật thất bại' },
  '更新文件过大，已停止下载': { en: 'Update file is too large; download stopped', vi: 'Tệp cập nhật quá lớn, đã dừng tải xuống' },
  '更新地址无效': { en: 'Invalid update URL', vi: 'Địa chỉ cập nhật không hợp lệ' },
  '更新地址不是受信任的 GitHub 地址': { en: 'Update URL is not a trusted GitHub URL', vi: 'Địa chỉ cập nhật không phải URL GitHub đáng tin cậy' },

  // Window / Hotkeys / XMNote / Replace rules / Upload assets
  '设置窗口透明度失败': { en: 'Failed to set window opacity', vi: 'Đặt độ mờ cửa sổ thất bại' },
  '老板键不能使用系统键': { en: 'Boss key cannot use system keys', vi: 'Phím ẩn nhanh không thể dùng phím hệ thống' },
  '快捷键格式无效': { en: 'Invalid shortcut format', vi: 'Định dạng phím tắt không hợp lệ' },
  '主窗口不存在': { en: 'Main window not found', vi: 'Không tìm thấy cửa sổ chính' },
  '没有可发送的书籍': { en: 'No books available to send', vi: 'Không có sách nào để gửi' },
  '请填写纸间书摘导入地址': { en: 'Please enter the XMNote import URL', vi: 'Vui lòng nhập địa chỉ nhập XMNote' },
  '纸间书摘导入地址格式不正确': { en: 'Invalid XMNote import URL format', vi: 'Định dạng địa chỉ nhập XMNote không hợp lệ' },
  '纸间书摘导入地址只支持 HTTP 或 HTTPS': { en: 'XMNote import URL only supports HTTP or HTTPS', vi: 'Địa chỉ nhập XMNote chỉ hỗ trợ HTTP hoặc HTTPS' },
  '纸间书摘导入地址缺少主机名': { en: 'XMNote import URL is missing a hostname', vi: 'Địa chỉ nhập XMNote thiếu tên máy chủ' },
  '名称不能为空': { en: 'Name cannot be empty', vi: 'Tên không được để trống' },
  '替换规则不能为空': { en: 'Replace rule pattern cannot be empty', vi: 'Quy tắc thay thế không được để trống' },
  '净化脚本执行超时，可能存在死循环，已跳过本章净化': { en: 'Cleanup script timed out (possible infinite loop); skipped for this chapter', vi: 'Script làm sạch quá thời gian (có thể lặp vô hạn); đã bỏ qua chương này' },
  '字体文件为空或超过 32 MB': { en: 'Font file is empty or exceeds 32 MB', vi: 'Tệp phông chữ trống hoặc vượt quá 32 MB' },
  '仅支持 TTF、OTF、WOFF 和 WOFF2 字体': { en: 'Only TTF, OTF, WOFF, and WOFF2 fonts are supported', vi: 'Chỉ hỗ trợ phông chữ TTF, OTF, WOFF và WOFF2' },
  '封面图片为空或超过 8 MB': { en: 'Cover image is empty or exceeds 8 MB', vi: 'Ảnh bìa trống hoặc vượt quá 8 MB' },
  '仅支持 PNG、JPG、GIF、WebP 和 AVIF 图片': { en: 'Only PNG, JPG, GIF, WebP, and AVIF images are supported', vi: 'Chỉ hỗ trợ ảnh PNG, JPG, GIF, WebP và AVIF' },
  '背景图片为空或超过 48 MB': { en: 'Background image is empty or exceeds 48 MB', vi: 'Ảnh nền trống hoặc vượt quá 48 MB' },
  '仅支持 PNG、JPG 和 WebP 图片': { en: 'Only PNG, JPG, and WebP images are supported', vi: 'Chỉ hỗ trợ ảnh PNG, JPG và WebP' },
  '参数错误': { en: 'Invalid parameters', vi: 'Tham số không hợp lệ' },
  '路径不存在': { en: 'Path does not exist', vi: 'Đường dẫn không tồn tại' },
  '请求失败': { en: 'Request failed', vi: 'Yêu cầu thất bại' },
  '上一个书源网页窗口尚未关闭，请稍后重试': {
    en: 'The previous source webpage window is still closing; please try again shortly',
    vi: 'Cửa sổ trang web nguồn trước đó vẫn đang đóng, vui lòng thử lại sau giây lát',
  },
}

const REGEX_TRANSLATIONS: Array<{
  pattern: RegExp
  en: string
  vi: string
}> = [
  {
    pattern: /^保存更新文件失败[：:]\s*(.+)$/s,
    en: 'Failed to save update package: $1',
    vi: 'Lưu tệp cập nhật thất bại: $1',
  },
  {
    pattern: /^已跳过朗读失败的片段[：:]\s*(.+)$/s,
    en: 'Skipped failed TTS segment: $1',
    vi: 'Đã bỏ qua đoạn đọc bị lỗi: $1',
  },
  {
    pattern: /^语音请求失败\s*\(([^)]+)\)(.*)$/s,
    en: 'Speech request failed ($1)$2',
    vi: 'Yêu cầu giọng nói thất bại ($1)$2',
  },
  {
    pattern: /^朗读引擎请求失败\s*\(([^)]+)\)(.*)$/s,
    en: 'TTS engine request failed ($1)$2',
    vi: 'Yêu cầu bộ đọc TTS thất bại ($1)$2',
  },
  {
    pattern: /^所选接口格式不支持\s+(.+?)\s*音频格式$/,
    en: 'Selected API format does not support $1 audio',
    vi: 'Định dạng API đã chọn không hỗ trợ âm thanh $1',
  },
  {
    pattern: /^语音服务连接失败[：:]\s*(.+?)(，请检查网络或 HTTP 代理设置)?$/s,
    en: 'Speech service connection failed: $1',
    vi: 'Kết nối dịch vụ giọng nói thất bại: $1',
  },
  {
    pattern: /^朗读引擎连接失败[：:]\s*(.+?)(，请检查网络或 HTTP 代理设置)?$/s,
    en: 'TTS engine connection failed: $1',
    vi: 'Kết nối bộ đọc TTS thất bại: $1',
  },
  {
    pattern: /^读取语音响应失败[：:]\s*(.+)$/s,
    en: 'Failed to read speech response: $1',
    vi: 'Đọc phản hồi giọng nói thất bại: $1',
  },
  {
    pattern: /^读取朗读引擎响应失败[：:]\s*(.+)$/s,
    en: 'Failed to read TTS engine response: $1',
    vi: 'Đọc phản hồi bộ đọc TTS thất bại: $1',
  },
  {
    pattern: /^HTTP 代理配置无效[：:]\s*(.+)$/s,
    en: 'Invalid HTTP proxy configuration: $1',
    vi: 'Cấu hình HTTP proxy không hợp lệ: $1',
  },
  {
    pattern: /^创建 HTTP 代理连接失败[：:]\s*(.+)$/s,
    en: 'Failed to create HTTP proxy connection: $1',
    vi: 'Tạo kết nối HTTP proxy thất bại: $1',
  },
  {
    pattern: /^未找到朗读引擎[：:]\s*(.+)$/s,
    en: 'TTS engine not found: $1',
    vi: 'Không tìm thấy bộ đọc TTS: $1',
  },
  {
    pattern: /^不支持的朗读引擎请求方法[：:]\s*(.+)$/s,
    en: 'Unsupported TTS engine HTTP method: $1',
    vi: 'Phương thức yêu cầu bộ đọc không được hỗ trợ: $1',
  },
  {
    pattern: /^Edge 朗读服务暂时不可用（(.+?)）。可能是微软调整了校验，请改用其它朗读通道。$/,
    en: 'Edge TTS service temporarily unavailable ($1). Microsoft may have updated verification; please use another TTS channel.',
    vi: 'Dịch vụ Edge TTS tạm thời không khả dụng ($1). Microsoft có thể đã thay đổi xác thực, vui lòng đổi sang kênh đọc khác.',
  },
  {
    pattern: /^微软朗读演示接口暂时不可用（(.+?)）。.*$/,
    en: 'Microsoft demo TTS service temporarily unavailable ($1). Please switch to another TTS channel.',
    vi: 'Cổng dùng thử Microsoft TTS tạm thời không khả dụng ($1). Vui lòng đổi sang kênh đọc khác.',
  },
  {
    pattern: /^网盘请求失败（状态码\s*(\d+)）$/,
    en: 'WebDAV request failed (HTTP $1)',
    vi: 'Yêu cầu WebDAV thất bại (mã $1)',
  },
  {
    pattern: /^网络请求失败[：:]\s*(.+)$/s,
    en: 'Network request failed: $1',
    vi: 'Yêu cầu mạng thất bại: $1',
  },
  {
    pattern: /^读取响应失败[：:]\s*(.+)$/s,
    en: 'Failed to read response: $1',
    vi: 'Đọc phản hồi thất bại: $1',
  },
  {
    pattern: /^快捷键注册失败[：:]\s*(.+)$/s,
    en: 'Failed to register shortcut: $1',
    vi: 'Đăng ký phím tắt thất bại: $1',
  },
  {
    pattern: /^下载更新失败[：:]\s*(.+)$/s,
    en: 'Failed to download update: $1',
    vi: 'Tải bản cập nhật thất bại: $1',
  },
  {
    pattern: /^书源不存在[：:]\s*(.+)$/s,
    en: 'Book source not found: $1',
    vi: 'Không tìm thấy nguồn truyện: $1',
  },
]

function applyRule(
  message: string,
  lang: 'en' | 'vi',
): string {
  const exact = EXACT_TRANSLATIONS[message]
  if (exact) return exact[lang]

  for (const rule of REGEX_TRANSLATIONS) {
    if (rule.pattern.test(message)) {
      const result = message.replace(rule.pattern, rule[lang])
      if (rule.pattern.source.startsWith('^已跳过朗读失败的片段')) {
        return result.replace(/^([^:]+:\s*)(.+)$/s, (_, prefix, inner) => `${prefix}${applyRule(stripAppErrorPrefix(inner), lang)}`)
      }
      return result
    }
  }

  // Handle network hint suffix on general errors
  let output = message.replace(
    /，请检查网络或 HTTP 代理设置/g,
    lang === 'en'
      ? '; please check your network or HTTP proxy settings'
      : '; vui lòng kiểm tra mạng hoặc cài đặt HTTP proxy',
  )
  return output
}

/**
 * Normalize an error message string by stripping Rust `AppError` technical
 * prefixes and translating known backend Chinese error templates when the UI
 * locale is English or Vietnamese.
 */
export function localizeErrorMessage(raw: string): string {
  const stripped = stripAppErrorPrefix(raw)
  const locale = currentLocale.value
  if (locale === 'zh-CN') return stripped
  const lang: 'en' | 'vi' = locale === 'vi-VN' ? 'vi' : 'en'
  return applyRule(stripped, lang)
}
