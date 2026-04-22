# 3D Library Portfolio

도서관 콘셉트의 3D 포트폴리오입니다.

## 핵심 기능
- 인트로 화면: 이름/경력 표시 후 문을 열고 입장
- 3D 도서관: 책장/책 오브젝트로 기록 시각화
- 드래그 전용 이동: 마우스/터치 드래그로 시점 이동
- 정렬: 시간순/이름순
- 역할 분리: 이용자(조회) / 사서(추가·수정·삭제)

## 데이터 확장 구조
`data/portfolio.json`의 `owner`, `records`를 수정하면 내용이 반영됩니다.

```json
{
  "owner": { "name": "홍길동", "career": "Frontend Developer · 7년차" },
  "records": [
    {
      "id": "unique-id",
      "title": "프로젝트명",
      "summary": "설명",
      "category": "프로젝트",
      "date": "2026-01-01"
    }
  ]
}
```

## 실행
정적 파일 서버로 실행하세요 (예: `python -m http.server`).
