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
window.CASE_FILE = {
  agentName: "Bùi Thùy Linh", agentNickname: "Linh Béo",
  partnerName: "Hoàng Mạnh Tân", partnerNickname: "Tân đẹp trai",
  relationshipStart: "2023-10-25",
  caseIntro: "đối tượng đã ở cạnh Tân đẹp trai 3 năm, hay giành miếng ăn cuối, tranh chăn lúc nửa đêm và chưa có ý định rời đi.",

  quiz: [
    { question: "Anh tỏ tình với em ngày nào?", choices: ["20/10/2023", "25/10/2023", "01/11/2023"], answer: 1, other: ["25 10", "25 thang 10"], fact: "25/10/2023. Mọi chuyện bắt đầu từ hôm đó." },
    { question: "Lần đầu đi chơi, em tặng anh cái gì?", choices: ["Một cái móc khóa", "Hai con búp bê cung hoàng đạo đan len", "Một hộp socola"], answer: 1, other: ["bup be", "cung hoang dao", "dan len"], fact: "Hai con búp bê cung hoàng đạo đan len." },
    { question: "Hôm đó hai đứa đi đâu?", choices: ["Hồ Tây", "Phố đi bộ Hồ Gươm", "Bánh canh đường Láng"], answer: 1, other: ["ho guom", "hoan kiem", "pho di bo"], fact: "Phố đi bộ Hồ Gươm." },
    { question: "Hôm đó ai nắm tay ai trước?", choices: ["Anh", "Em", "Không ai nhớ"], answer: 1, fact: "Em chủ động đấy. Anh nhớ rõ." },
    { question: "Tháng 12/2023, hai đứa cãi nhau lần đầu. Vì sao?", choices: ["Anh quên một ngày quan trọng", "Em đi chơi hết pin, anh đứng chờ ngoài cửa lạnh quá nên về trước", "Tranh nhau miếng ăn cuối"], answer: 1, fact: "Em đi chơi hết pin điện thoại, anh sang đứng đợi ngoài cửa rét run rồi bỏ về. Thế là cãi nhau." },
    { question: "Hồi mới yêu, hai đứa xưng hô thế nào?", choices: ["Anh – em", "Cậu – tớ", "Bạn – mình"], answer: 1, other: ["cau to", "to cau"], fact: "Cậu – tớ. Khoảng ba tháng sau em mới bắt đầu xưng em, rồi gọi anh là anh." },
    { question: "Sinh nhật đầu tiên của anh khi có em (15/1/2024), mình đi đâu?", choices: ["Homestay ở Đội Cấn", "Tam Đảo", "Ở nhà ăn lẩu"], answer: 0, other: ["doi can"], fact: "Homestay ở Đội Cấn." },
    { question: "Chuyến du lịch đầu tiên của hai đứa là đi đâu?", choices: ["Tam Đảo", "Ba Vì", "Sa Pa"], answer: 1, other: ["ba vi"], fact: "Ba Vì." },
    { question: "Món anh thích nhất?", choices: ["Mỳ cay", "Bún bò", "Pizza"], answer: -1, other: ["com tam", "com ga"], fact: "Cơm tấm với cơm gà. Mỳ cay với bún bò là món của em mà." },
    { question: "Đồ ăn vặt anh hay ăn nhất?", choices: ["Tiramisu", "Tart trứng", "Cơm cháy"], answer: 2, other: ["com chay", "banh gau", "bim bim", "snack"], fact: "Cơm cháy, bánh gấu, bim bim. Tiramisu với tart trứng là của em." },
    { question: "Anh làm nghề gì?", choices: ["Làm IT gì đó", "Data Analyst", "Ngồi máy tính cả ngày"], answer: 1, other: ["data", "analyst", "phan tich du lieu", "da"], fact: "Data Analyst, tức là phân tích dữ liệu. Anh biết thừa là em không nhớ." },
    { question: "Cái gì em mê mà anh thì không?", choices: ["Chơi game", "Đánh cầu", "Xem phim"], answer: 2, fact: "Xem phim. Game với đánh cầu là của anh." }
  ],
  // Lời nhận xét sau phần hỏi, xét theo tỉ lệ câu đúng (min = 0.8 nghĩa là từ 80% trở lên).
  quizVerdicts: [
    { min: 0.85, text: "Nhớ hơn cả anh. Không có gì để chê." },
    { min: 0.5, text: "Tạm được. Mấy câu sai anh ghi sổ rồi nhé." },
    { min: 0, text: "Ba năm mà thế này à. Thôi đi tiếp, anh kể lại sau." }
  ],

  // Tật xấu: người chơi tự xếp vào Linh / Tân / Cả hai.
  allegations: ["Ngủ cướp chăn", "Ăn vặt nhiều", "Ngủ dậy muộn", "Béo", "Thức khuya", "Sai rồi vẫn lì, không chịu xin lỗi"],
  noButtonLines: ["Không", "Chắc chưa?", "Nghĩ lại đi", "Bấm hụt rồi kìa", "Thôi được…"],

  // Hồ sơ hai đứa, hiện ở trang Kho kỉ niệm.
  profiles: [
    { tag: "Đối tượng", name: "Tân", rows: [["Món ruột", "Cơm tấm, cơm gà"], ["Ăn vặt", "Cơm cháy, bánh gấu, bim bim"], ["Thích", "Chơi game, đánh cầu"], ["Không thích", "Xem phim"], ["Nghề", "Data Analyst"]] },
    { tag: "Đặc vụ", name: "Linh", rows: [["Món ruột", "Cơm gà, bún bò, mỳ cay"], ["Ăn vặt", "Tiramisu, tart trứng, bánh kem"], ["Thích", "Xem phim"]] }
  ],
  milestones: [
    { date: "25/10/2023", title: "Tỏ tình", text: "Ngày bắt đầu. Hồi đó vẫn còn cậu cậu tớ tớ.", image: "" },
    { date: "Lần đầu đi chơi", title: "Hai con búp bê len", text: "Em tặng anh hai con búp bê cung hoàng đạo đan len. Tối đó đi phố đi bộ Hồ Gươm, em chủ động nắm tay anh trước.", image: "" },
    { date: "12/2023", title: "Lần cãi nhau đầu tiên", text: "Em đi chơi hết pin, anh sang đứng đợi ngoài cửa rét căm căm rồi về trước. Về đến nhà là cãi nhau.", image: "" },
    { date: "Đầu 2024", title: "Từ cậu – tớ sang anh – em", text: "Khoảng ba tháng sau, em bắt đầu xưng em và gọi anh là anh.", image: "" },
    { date: "15/01/2024", title: "Sinh nhật đầu tiên có em", text: "Hai đứa đi homestay ở Đội Cấn.", image: "" },
    { date: "Chuyến đi đầu tiên", title: "Ba Vì", text: "Lần đầu hai đứa đi du lịch cùng nhau.", image: "" },
    { date: "25/10/2026", title: "Ba năm", text: "Vẫn tranh chăn, vẫn ăn vặt, vẫn ở đây.", image: "" }
  ],

  // Game: nhặt gameItems, né gameObstacles.
  gameItems: ["🧸", "🍚", "🍰", "💌"],
  gameObstacles: ["🔋", "🥶", "⏰", "🌧️"],

  // BẢN NHÁP — Tân nên tự sửa lại bằng giọng của mình.
  finalMessage: "Linh,\n\nBa năm trước anh tỏ tình, hồi đó hai đứa còn cậu cậu tớ tớ. Lần đầu đi chơi em tặng anh hai con búp bê len, rồi em nắm tay anh trước ở phố đi bộ. Anh vẫn nhớ.\n\nMình cũng cãi nhau rồi, có hôm anh đứng ngoài cửa lạnh xong bỏ về. Mình cũng cùng béo lên, cùng thức khuya, tranh chăn nhau mỗi đêm. Mấy cái đó anh không đổi đâu.\n\nNăm thứ tư anh vẫn muốn đi cùng em. Đi ăn cơm gà, đi thêm vài chỗ như Ba Vì, và anh sẽ cố ngồi xem hết một bộ phim với em.\n\nTân",
  // Để trống hết thì phần thư mời tự ẩn.
  dateNight: { when: "", where: "", dress: "", plan: "" },
  songUrl: "", voiceUrl: "", sharedPhoto: ""
};
