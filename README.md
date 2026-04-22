# 3D Library Portfolio (Web)

도서관 공간을 탐험하며 이력을 보는 3D 포트폴리오 웹입니다.

## 개선 포인트
- **3D 연출 강화**
  - 도서관 방 구조(바닥/벽/아치)
  - 다중 책장 레이아웃
  - 파티클 분위기 연출
  - 책 클릭 시 해당 카드 강조
- **데이터 구조 강화**
  - `schemaVersion`
  - `profile`(소개/연락처/링크/스킬)
  - `records`(id/title/summary/category/date/impact/tags)
- **확장 가능한 관리 구조**
  - 사서 모드에서 추가/수정/삭제
  - 변경사항 `localStorage` 저장
  - 정렬 + 카테고리 필터

## 데이터 포맷
`data/portfolio.json`:

```json
{
  "schemaVersion": "2.0.0",
  "profile": {
    "name": "김개발",
    "title": "Creative Frontend Engineer",
    "experienceYears": 5,
    "summary": "...",
    "location": "Seoul",
    "email": "devkim@example.com",
    "links": [{ "label": "GitHub", "url": "https://github.com/example" }],
    "skills": ["Three.js", "TypeScript"]
  },
  "records": [
    {
      "id": "project-2025",
      "title": "프로젝트명",
      "summary": "설명",
      "category": "프로젝트",
      "date": "2025-11-12",
      "impact": "전환율 +21%",
      "tags": ["WebGL", "UX"]
    }
  ]
}
```
```bash
python -m http.server 8000
```
브라우저에서 `http://localhost:8000` 접속.
