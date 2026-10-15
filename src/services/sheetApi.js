const API_URL =
  "https://script.google.com/macros/s/AKfycbzswPe02rjw2YqT_Uh4eqBUujwEaSYdL7jvb_9WBq-S0vAb9xW4IW4SkkkmdD6eoupG/exec";

export async function getPageData() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("데이터를 불러오지 못했습니다.");
  }

  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : payload?.data;

  if (!Array.isArray(items)) {
    throw new Error("구글 시트 응답 형식이 올바르지 않습니다.");
  }

  return items;
}
