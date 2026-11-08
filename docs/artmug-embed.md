# 아트머그 내용 더 보기 제거

`artmug-embed.html`의 전체 내용을 아트머그 작품 설명의 HTML 편집 모드에서 기존 포트폴리오 iframe 대신 붙여 넣습니다. 다른 작품 소개 문구는 유지하세요.

이 코드는 부모 문서의 `.subContent` 내부에서만 `.btn_open_btn`, `.btn_open`, `.btn_close` 버튼을 숨기고 `.detailinfo`, `.showcontent`, `.showstep1`의 높이 제한을 해제합니다. 재생성된 버튼에도 CSS가 적용됩니다. 불필요한 버튼 복제 및 클릭 이벤트 차단은 사용하지 않습니다.

기존 postMessage 높이 연동도 포함합니다. Netlify에서 전송한 높이를 검증한 뒤 iframe 높이에 반영합니다. 높이 메시지를 받기 전에는 2200px 및 내부 스크롤을 유지합니다. 코드에는 스크립트가 포함되어 있으므로 HTML 편집기가 script/style을 삭제하면 작동하지 않습니다. 개발자도구에서 변경한 내용은 새로고침 후 유지되지 않습니다.

자체 포함된 삽입 코드를 사용하므로 이번 변경에 Netlify 재배포는 필요하지 않습니다. public/artmug-embed.js를 외부 script src로 불러오는 방식은 이후 배포해야 업데이트됩니다.

실제 아트머그 편집기 저장과 페이지 적용 여부는 별도로 확인해야 합니다.
