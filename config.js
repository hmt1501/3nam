/*
 * HỒ SƠ CÁ NHÂN — hãy thay các giá trị có [MẪU] bằng thông tin thật.
 * Ảnh: tạo thư mục images/ cạnh index.html, chép ảnh vào đó, rồi điền ví dụ "images/hen-dau.jpg".
 * Không cần ảnh: để image là chuỗi rỗng. Toàn bộ website vẫn hoạt động.
 */
window.CASE_FILE = {
  agentName: "Bùi Thùy Linh", agentNickname: "Linh Béo",
  partnerName: "Hoàng Mạnh Tân", partnerNickname: "Tân đẹp trai",
  anniversary: "Kỉ niệm bên nhau", relationshipStart: "2023-10-25",
  caseIntro: "Đối tượng đã ở bên Tân đẹp trai suốt 3 năm, có dấu hiệu bám người, giành miếng ăn cuối cùng và vẫn chưa có ý định rời đi.",
  quiz: [
    { question: "Món nào Tân thích nhất”?", choices: ["[Mỳ kay", "Bún bò", "Pizza", "Khác"], answer: 3, compliment: "Hồ sơ vị giác chính xác! Đặc vụ được cộng một dấu tim.", evidence: "Bằng chứng A · Gu ăn uống đáng ngờ" },
    { question: "Địa điểm hẹn hò đầu tiên của hai người là đâu?", choices: ["Bánh canh đường láng", "Hồ Tây", "Phố đi bộ", "Khác"], answer: 2, compliment: "Trí nhớ được lưu trữ bằng trái tim. Hồ sơ đã mở!", evidence: "Bằng chứng B · Cuộc hẹn mở màn" },
    { question: "Ai là người bắt đầu xưng hô anh–em trước?", choices: ["Linh", "Tân", "Không nhớ"], answer: 0, compliment: "Nhân chứng khai báo rất đáng tin. Chắc vậy.", evidence: "Bằng chứng C · Bí mật xưng hô" }
  ],
  allegations: ["Chiếm chăn lúc nửa đêm", "Nói “ăn gì cũng được” rồi chê món được chọn", "Lì một lúc lâu mới chịu xin lỗi", "Âm thầm nhắm miếng ngon cuối cùng", "Đòi giảm cân nhưng lúc nào cũng ăn vặt"],
  noButtonLines: ["Không", "Không chắc đâu", "Để suy nghĩ thêm", "Tôi cần luật sư", "Không đời nào… mà khoan"],
  milestones: [
    { date: "[MẪU · điền ngày]", title: "Lần đầu nhắn tin", text: "[MẪU] Kể lại lần đầu nhắn tin — điều gì làm hai người nhớ mãi?", image: "" },
    { date: "[MẪU · điền ngày]", title: "Lần đầu gặp nhau", text: "[MẪU] Kể lại lần đầu gặp nhau — điều gì làm hai người nhớ mãi?", image: "" },
    { date: "[MẪU · điền ngày]", title: "Chuyến du lịch đầu tiên", text: "[MẪU] Thêm địa điểm, món đã ăn hoặc chuyện buồn cười hôm ấy.", image: "" },
    { date: "[MẪU · điền năm]", title: "Kỉ niệm đáng nhớ", text: "[MẪU] Chọn một chuyến đi hoặc ngày bình thường mà hai người vẫn nhắc lại.", image: "" },
    { date: "[MẪU · điền thời điểm]", title: "Đồng đội vượt ải", text: "[MẪU] Kể về lúc hai người cùng nhau vượt qua một chuyện khó.", image: "" },
    { date: "HÔM NAY", title: "Vẫn chung một đội", text: "Ba năm và vẫn chọn ở cạnh nhau. Hồ sơ này có kết thúc đẹp.", image: "" }
  ],
  gameItems: ["🧋", "🍟", "💌", "🎟️"],
  gameObstacles: ["📅", "😤", "⛽", "⌛"],
  finalMessage: "[MẪU — hãy viết lời nhắn thật của bạn ở đây. Có thể kể điều bạn trân trọng, một kỷ niệm riêng, và điều bạn mong chờ ở năm tiếp theo.]",
  dateNight: { when: "[MẪU — ngày và giờ]", where: "[MẪU — địa điểm hẹn]", dress: "[MẪU — mặc gì / cứ thoải mái]", plan: "[MẪU — ăn món ngon, đi dạo hoặc hoạt động cả hai thích]" },
  songUrl: "", voiceUrl: "", sharedPhoto: ""
};
