-- 주름 검색은 치료 효능이 아니라 공개 성분 근거에 따른 외관 관리 후보를 찾는다.
-- 레티놀의 탄력 근거는 V34에 있으며, 현재 공개 제품과 연결된 A등급 성분 중
-- 나이아신아마이드와 히알루론산의 보조 근거를 추가한다.
-- 근거: https://pubmed.ncbi.nlm.nih.gov/18492135/
--       https://pubmed.ncbi.nlm.nih.gov/34176098/
INSERT INTO ingredient_concern_features (ingredient_id, concern, feature) VALUES
    (
        'niacinamide',
        '탄력',
        '나이아신아마이드 함유 제형 연구에서 잔주름 외관 개선이 관찰됐어요. 실제 결과는 완제품의 함량과 배합, 사용 기간에 따라 달라질 수 있어요.'
    ),
    (
        'hyaluronic-acid',
        '탄력',
        '수분을 끌어당겨 피부가 촉촉하고 도톰해 보이도록 도와 건조할 때 도드라지는 잔주름 외관을 관리하는 제품에 활용돼요.'
    )
ON CONFLICT DO NOTHING;
