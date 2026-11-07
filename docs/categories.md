# 작품 카테고리와 표시 형식

세 카테고리의 우측 상단 GIF / YOUTUBE 버튼은 각각 독립적으로 전환됩니다. 기본 선택은 GIF이며, YOUTUBE는 유튜브 플레이어를 표시합니다. 형식을 바꾸면 이전 영상 재생이 중지되고 첫 번째 작품부터 표시됩니다.

Google Sheets DATA 시트의 type과 value를 사용합니다.

| 영역 | GIF type | YOUTUBE type |
| --- | --- | --- |
| 방송화면 및 대기화면 | broadcast_gif | broadcast_youtube |
| 월페이퍼 및 반응형 월페이퍼 | wallpaper_gif | wallpaper_youtube |
| 인게임 | ingame_gif | ingame_youtube |

value에는 GIF 이미지 URL 또는 YouTube 영상 URL을 입력합니다. 같은 type의 행을 추가하면 좌우 화살표로 넘길 수 있습니다.

기존 gif / youtube 행은 방송화면 및 대기화면에 유지됩니다. 기존 broadcast / wallpaper / ingame 행은 해당 카테고리의 YouTube 영상으로 계속 인식합니다. 미디어가 없는 형식에는 빈 카드가 표시됩니다.

preview/categories.html을 다운로드해서 브라우저로 열면 실제 데이터 없이 배치와 전환 버튼을 확인할 수 있습니다.

Netlify 배포 없이 검토하는 작업 브랜치입니다. 명시적인 배포 요청 전에는 main에 병합하지 않습니다.

## 소개글 / 주의사항

자기소개 아래에 소개글, 모든 작품 아래에 주의사항을 표시합니다.
DATA 시트에 type이 `about`인 행을 추가하고 value에 소개글을 입력하세요.
type이 `notice`인 행의 value에는 주의사항을 입력하세요. 셀 안의 줄바꿈은 그대로 표시됩니다.
기존 `intro` 또는 `text`는 자기소개 카드에 계속 사용됩니다. 새 내용이 없으면 안내용 자리표시 문구가 나옵니다.
