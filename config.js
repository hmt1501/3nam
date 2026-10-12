/*
 * NỘI DUNG CỦA WEBSITE — sửa chữ ở đây, không cần đụng vào app.js.
 * Ảnh: tạo thư mục images/ cạnh index.html, chép ảnh vào, rồi điền ví dụ "images/ho-guom.jpg".
 * Để trống image / sharedPhoto / songUrl / voiceUrl thì phần đó tự ẩn.
 *
 * Câu hỏi:
 *   answer: vị trí đáp án đúng trong choices (0 là ô đầu). Đặt -1 nếu chỉ chấp nhận câu gõ ở ô "Khác".
 *   other:  có mảng này thì hiện thêm ô "Khác…" cho tự gõ. Câu gõ được tính đúng nếu chứa một
 *           trong các cụm từ ở đây (không phân biệt hoa thường, có dấu hay không dấu).
 *   fact:   câu chuyện thật, luôn hiện ra sau khi trả lời dù đúng hay sai.
 */
const fluent = name => `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/${encodeURIComponent(name)}/3D/${name.toLowerCase().replace(/ /g, '_')}_3d.png`;
window.CASE_FILE = {
  agentName: "Bùi Thùy Linh", agentNickname: "Linh Béo",
  partnerName: "Hoàng Mạnh Tân", partnerNickname: "Tân đẹp trai",
  relationshipStart: "2023-10-25",
  caseIntro: "Đối tượng đã ở cạnh Tân đẹp trai 3 năm, hay trấn lột tiền, tranh chăn lúc nửa đêm và chưa có ý định rời đi.",

  quiz: [
    { question: "Ngày tỏ tình?", choices: ["20/10/2023", "25/10/2022", "01/11/2023"], answer: -1, other: ["25 10 2023", "25 thang 10 nam 2023"], fact: "25/10/2023. Tỏ tình qua messenger haha." },
    { question: "Lần đầu đi chơi, em tặng anh cái gì?", choices: ["Móc khóa", "Búp bê đan len", "Một hộp socola"], answer: 1, other: ["bup be", "cung hoang dao", "dan len"], fact: "Hôm đầu gặp nhau trời mưa, em đưa dưới mái hiên" },
    { question: "Hôm đó hai đứa đi đâu?", choices: ["Hồ Tây", "Hồ Gươm", "Bánh canh"], answer: 1, other: ["ho guom", "hoan kiem", "pho di bo"], fact: "Tặng xong là đi chơi luôn hehe" },
    { question: "Hôm đó ai nắm tay ai trước?", choices: ["Anh", "Em", "Không nhớ"], answer: 1, fact: "Người đàn bà gia trưởng" },
    { question: "Tháng 12/2023, hai đứa cãi nhau lần đầu. Vì sao?", choices: ["Quên một ngày quan trọng", "Do emm", "Tranh nhau miếng ăn cuối"], answer: 1, fact: "Em đi chơi hết pin điện thoại, anh sang đứng đợi ngoài cửa rét run rồi bỏ về. Thế là cãi nhau." },
    { question: "Hồi mới yêu, hai đứa xưng hô thế nào?", choices: ["Anh – em", "Cậu – tớ", "Bạn – mình"], answer: 1, other: ["cau to", "to cau"], fact: "Cậu – tớ. Khoảng ba tháng sau em mới bắt đầu xưng em, rồi gọi anh là anh." },
    { question: "Sinh nhật đầu tiên của anh khi có em (15/1/2024), mình đi đâu?", choices: ["Homestay", "Tam Đảo", "Ở nhà ăn lẩu"], answer: 0, other: ["homestay"], fact: "Có nhớ homestay ở đâu không z." },
    { question: "Chuyến du lịch đầu tiên của hai đứa là đi đâu?", choices: ["Tam Đảo", "Ba Vì", "Sa Pa"], answer: 1, other: ["ba vi"], fact: "Đi ăng thịt nướng" },
    { question: "Món anh thích nhất?", choices: ["Mỳ cay", "Bún bò", "Pizza"], answer: -1, other: ["com tam"], fact: "Tui ăn mấy cái kia bao giờ, tui ăn cơm tấm mà" },
    { question: "Đồ ăn vặt anh hay ăn nhất?", choices: ["Tiramisu", "Tart trứng", "Cơm cháy"], answer: 2, other: ["com chay"], fact: "Mi thích Tiramisu với tart trứng thì có" },
    { question: "Anh làm nghề gì?", choices: ["IT", "Data Analyst", "AI Engineer"], answer: 1, other: ["data", "analyst", "phan tich du lieu", "da"], fact: "Rõ ràng là không biết." }
  ],
  // Lời nhận xét sau phần hỏi, xét theo tỉ lệ câu đúng (min = 0.8 nghĩa là từ 80% trở lên).
  quizVerdicts: [
    { min: 0.85, text: "Tàm tạm." },
    { min: 0.5, text: "Nhớ gì tôi đâu" },
    { min: 0, text: "Ba năm mà thế này à. Vứt" }
  ],

  // Tật xấu: người chơi tự xếp vào Linh / Tân / Cả hai.
  allegations: ["Ngủ cướp chăn", "Ăn vặt nhiều", "Ngủ dậy muộn", "Béo", "Thức khuya", "Sai rồi vẫn lì, không chịu xin lỗi"],

  // Hồ sơ hai đứa, hiện ở trang Kho kỉ niệm.
  profiles: [
    { tag: "Đối tượng", name: "Tân", rows: [["Món ruột", "Cơm tấm, cơm gà"], ["Ăn vặt", "Cơm cháy, bánh gấu, bim bim"], ["Thích", "Chơi game, đánh cầu"], ["Không thích", "Xem phim"], ["Nghề", "Data Analyst"]] },
    { tag: "Đặc vụ", name: "Linh", rows: [["Món ruột", "Cơm gà, bún bò, mỳ cay"], ["Ăn vặt", "Tiramisu, tart trứng, bánh kem"], ["Thích", "Xem phim"]] }
  ],
  milestones: [
    { date: "25/10/2023", title: "Tỏ tình", text: "Ngày bắt đầu. Hồi đó vẫn còn cậu cậu tớ tớ.", image: "" },
    { date: "Lần đầu đi chơi", title: "Hai con búp bê len", text: "Em tặng anh hai con búp bê cung hoàng đạo đan len. Tối đó đi phố đi bộ Hồ Gươm, em chủ động nắm tay anh trước đồ he.", image: "" },
    { date: "12/2023", title: "Lần cãi nhau đầu tiên", text: "Em đi chơi hết pin, anh sang đứng đợi ngoài cửa rét căm căm rồi về trước. Về đến nhà là cãi nhau online.", image: "" },
    { date: "Đầu 2024", title: "Từ cậu – tớ sang anh – em", text: "Khoảng ba tháng sau, em bắt đầu xưng em và gọi anh là anh.", image: "" },
    { date: "15/01/2024", title: "Sinh nhật đầu tiên có em", text: "Hai đứa đi homestay ở Đội Cấn.", image: "" },
    { date: "Chuyến đi đầu tiên", title: "Ba Vì", text: "Lần đầu hai đứa đi du lịch cùng nhau.", image: "" },
    { date: "25/10/2026", title: "Ba năm", text: "Vẫn tranh chăn, vẫn ăn như heo, vẫn bám người.", image: "" }
  ],

  // Game chém món: chém món của Tân (good) để ghi điểm, chém nhầm món của Linh (bad) là mất một mạng.
  // img: ảnh sticker (link hoặc "images/com-tam.png"); ảnh lỗi thì tự dùng icon. Ảnh mặc định: Microsoft Fluent Emoji (MIT).
  game: {
    time: 30, lives: 3, target: 10,
    good: [
      { label: "Cơm tấm", icon: "🍚", img: fluent("Cooked rice") },
      { label: "Cơm gà", icon: "🍗", img: fluent("Poultry leg") },
      { label: "Cơm cháy", icon: "🫓", img: fluent("Flatbread") },
      { label: "Bánh gấu", icon: "🧸", img: fluent("Teddy bear") }    ],
    bad: [
      { label: "Bún bò", icon: "🍜", img: fluent("Steaming bowl") },
      { label: "Mỳ cay", icon: "🍝", img: fluent("Spaghetti") },
      { label: "Tiramisu", icon: "🍰", img: fluent("Shortcake") },
      { label: "Tart trứng", icon: "🥧", img: fluent("Pie") }    ]
  },

  // BẢN NHÁP — Tân nên tự sửa lại bằng giọng của mình.
  finalMessage: "Linh,\n\nBa năm trước anh tỏ tình, hồi đó hai đứa còn cậu cậu tớ tớ. Lần đầu đi chơi em tặng anh hai con búp bê len, rồi em nắm tay anh trước ở phố đi bộ. Anh vẫn nhớ.\n\nMình cũng cãi nhau rồi, có hôm anh đứng ngoài cửa lạnh xong bỏ về. Mình cũng cùng béo lên, cùng thức khuya, tranh chăn nhau mỗi đêm. Mấy cái đó anh không đổi đâu.\n\nNăm thứ tư anh vẫn muốn đi cùng em. Đi ăn cơm gà, đi thêm vài chỗ như Ba Vì, và anh sẽ cố ngồi xem hết một bộ phim với em.\n\nTân",
  // Để trống hết thì phần thư mời tự ẩn.
  dateNight: { when: "24/10/2026", where: "Sushi"},
  songUrl: "", voiceUrl: "", sharedPhoto: "",
  // Nhạc nền phát liên tục (Mưa Tình Yêu / 雨愛): chép file mp3 vào thư mục music/ với đúng tên này. Để trống thì tắt.
  musicUrl: "music/mua-tinh-yeu.mp3"
};
