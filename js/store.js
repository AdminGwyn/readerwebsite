/** @typedef {{ id: string; title: string; html: string }} Chapter */
/** @typedef {{ id: string; title: string; subtitle?: string; author: string; publisher: string; category: string; synopsis: string; cover: string; chapters: Chapter[]; createdAt?: string }} Story */

const STORAGE_KEY = "reader_pro_library_v3";

/** @returns {{ categories: string[]; stories: Story[] }} */
export function loadLibrary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.stories?.length) return data;
    }
  } catch {
    /* fallback seed */
  }
  const seed = getSeedLibrary();
  saveLibrary(seed);
  return seed;
}

/** @param {{ categories: string[]; stories: Story[] }} data */
export function saveLibrary(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getStoryById(id) {
  const lib = loadLibrary();
  if (!id) return null;
  return lib.stories.find((s) => s.id === id) ?? null;
}

export function upsertStory(story) {
  const lib = loadLibrary();
  const i = lib.stories.findIndex((s) => s.id === story.id);
  const prev = i >= 0 ? lib.stories[i] : null;
  if (prev?.createdAt && !story.createdAt) story.createdAt = prev.createdAt;
  if (!story.createdAt) story.createdAt = new Date().toISOString();
  if (i >= 0) lib.stories[i] = story;
  else lib.stories.unshift(story);
  saveLibrary(lib);
}

export function deleteStory(id) {
  const lib = loadLibrary();
  lib.stories = lib.stories.filter((s) => s.id !== id);
  saveLibrary(lib);
}

export function ensureCategory(cat) {
  const lib = loadLibrary();
  const c = cat.trim();
  if (!c || lib.categories.includes(c)) return;
  lib.categories.push(c);
  lib.categories.sort((a, b) => a.localeCompare(b, "vi"));
  saveLibrary(lib);
}

function getSeedLibrary() {
  /** @type {Story} */
  const main = {
    id: "demo-1",
    title: "Ánh đèn và trang sách",
    subtitle: "",
    author: "Reader Studio",
    publisher: "",
    category: "Văn học",
    synopsis:
      "Trích đoạn minh họa để bạn thử đánh dấu đoạn hay, bật giọng đọc AI, cuộn tự động và chỉnh giao diện sáng hay tối.",
    cover: "assets/cover-academic.svg",
    createdAt: new Date().toISOString(),
    chapters: [
      {
        id: "c0",
        title: "Mở đầu",
        html: `
          <h2 class="doc-h2">Chiều không vội</h2>
          <p class="doc-lead">Đôi khi chỉ cần một góc yên và vài trang giấy là đủ để thế giới nhỏ lại.</p>
          <p>
            Ánh đèn bàn chiếu xuống trang sách như một vòng tròn ấm. Tiếng lá rơi ngoài hiên gần như không có,
            chỉ còn nhịp chữ trong đầu và tiếng giấy khẽ sột soạt khi lật trang.
          </p>
          <p>
            Bạn có thể <strong>bôi đen và đánh dấu</strong> bất kỳ câu nào để quay lại sau — giống như gấp một góc sách giấy,
            nhưng mềm mại hơn trên màn hình.
          </p>
        `,
      },
      {
        id: "c1",
        title: "Giữa hai chương",
        html: `
          <h2 class="doc-h2">Khoảng lặng</h2>
          <p>
            Giữa hai chương truyện thường có một khoảng trắng — không phải vì thiếu chữ, mà để nhịp thở của người đọc kịp theo.
            Hãy thử bật <strong>cuộn tự động</strong> với tốc độ vừa phải nếu bạn muốn hai tay rảnh để một cốc trà hoặc chỉ để suy ngẫm.
          </p>
          <p>
            Thanh phần trăm phía trên cho biết bạn đã đi được bao xa trong hành trình này. Không cần vội — mỗi phần trăm đều là thật
            nếu bạn đang thực sự ở đó với trang sách.
          </p>
        `,
      },
    ],
  };

  return {
    categories: ["Văn học", "Kỹ năng", "Khác"],
    stories: [main],
  };
}
