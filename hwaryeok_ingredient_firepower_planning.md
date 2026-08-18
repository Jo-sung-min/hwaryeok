# 화력(HWA:RYEOK) 성분 기반 추천/화력점수 기획서

> 목적: 사용자가 마이페이지에서 **“나에게 맞는 대표 성분”**을 선택하면, 해당 성분이 들어간 제품 중 **성분 화력점수가 높은 제품을 우선 추천**하는 구조를 만든다.
>
> 핵심 원칙: **성분 화력점수 = 의학적 치료 효과 점수**가 아니다.  
> 제품의 전성분, 공개 함량, 성분 형태, 제품 유형, 배합 구조 등을 이용해 **“선택한 성분이 이 제품에서 얼마나 중심적으로 설계되었는가”**를 비교하는 서비스 지표로 정의한다.

---

## 1. 서비스 핵심 아이디어

### 사용자 흐름

1. 사용자가 피부 타입/고민을 등록한다.
2. 마이페이지에서 관심 성분을 선택한다.
   - 예: `나이아신아마이드`
   - 예: `히알루론산`
   - 예: `세라마이드`
   - 예: `레티놀`
3. 선택한 성분마다 개인 성분 카드가 생성된다.
4. 성분 카드를 누르면 해당 성분의 **화력점수 순 상품 랭킹**이 노출된다.
5. 제품 상세에서는 왜 점수가 높은지 분해해서 보여준다.

예시:

```text
내 관심 성분

[ 나이아신아마이드 ]
미백 · 피부톤 · 장벽
내 관심도 ★★★★★

TOP 제품
1. A 세럼      화력 94
2. B 앰플      화력 91
3. C 크림      화력 86
```

---

# 2. 가장 중요한 설계 원칙

## 2.1 사용자 화면의 성분과 내부 DB의 성분을 분리한다

사용자에게 INCI 성분 100~300개를 그대로 보여주면 선택이 어렵다.

따라서 다음처럼 구성한다.

```text
사용자 대표 성분
    ↓
성분 그룹
    ↓
실제 INCI / 한글 전성분
```

예시:

```text
히알루론산
├─ Hyaluronic Acid
├─ Sodium Hyaluronate
├─ Hydrolyzed Hyaluronic Acid
├─ Sodium Acetylated Hyaluronate
├─ Hydrolyzed Sodium Hyaluronate
└─ Sodium Hyaluronate Crosspolymer
```

즉 사용자는 **“히알루론산” 하나만 선택**하지만,
서비스 내부에서는 여러 형태를 함께 탐지한다.

단, 형태별 근거와 특성이 다르므로 점수는 완전히 동일하게 주지 않는다.

---

# 3. MVP에서 우선 노출할 대표 성분 30개

아래 30개를 첫 화면의 기본 선택 성분으로 추천한다.

| 우선순위 | 대표 성분 | 대표 관심사 | MVP |
|---|---|---|---|
| 1 | 나이아신아마이드 | 피부톤, 피지, 장벽 | ★★★ |
| 2 | 히알루론산 | 수분 | ★★★ |
| 3 | 세라마이드 | 장벽, 건조 | ★★★ |
| 4 | 판테놀 | 보습, 진정 | ★★★ |
| 5 | 병풀/CICA | 진정 | ★★★ |
| 6 | 마데카소사이드 | 진정, 장벽 | ★★★ |
| 7 | 비타민C | 피부톤, 항산화 | ★★★ |
| 8 | 레티놀/레티날 | 탄력, 주름, 피부결 | ★★★ |
| 9 | 아데노신 | 주름, 탄력 | ★★★ |
| 10 | 펩타이드 | 탄력, 보습 | ★★★ |
| 11 | 알파-알부틴 | 피부톤 | ★★★ |
| 12 | 트라넥사믹애씨드 | 피부톤 | ★★★ |
| 13 | 감초 | 피부톤, 진정 | ★★★ |
| 14 | 살리실릭애씨드/BHA | 피지, 각질 | ★★★ |
| 15 | AHA | 각질, 피부결 | ★★★ |
| 16 | PHA | 순한 각질 관리 | ★★★ |
| 17 | 아젤라익애씨드 | 트러블, 피부톤 | ★★ |
| 18 | 징크 PCA | 피지 | ★★★ |
| 19 | 스쿠알란 | 보습, 장벽 | ★★★ |
| 20 | 엑토인 | 진정, 보습 | ★★★ |
| 21 | 베타글루칸 | 진정, 보습 | ★★★ |
| 22 | 알란토인 | 진정 | ★★★ |
| 23 | 녹차 | 진정, 항산화, 피지 | ★★★ |
| 24 | 어성초 | 진정, 트러블 케어 | ★★★ |
| 25 | 티트리 | 피지, 트러블 케어 | ★★★ |
| 26 | 바쿠치올 | 탄력, 안티에이징 | ★★ |
| 27 | 비피다 발효물 | 장벽, 컨디셔닝 | ★★★ |
| 28 | 갈락토미세스 | 피부결, 컨디셔닝 | ★★ |
| 29 | 글루타치온 | 피부톤, 항산화 | ★★ |
| 30 | PDRN / Sodium DNA | 컨디셔닝, 트렌드 | ★ |

`★★★ = 1차 출시`, `★★ = 확장`, `★ = 트렌드 카테고리`

PDRN처럼 소비자 관심은 높지만 화장품에서의 임상 근거/표준화가 대표 성분보다 제한적인 항목은 **트렌드 성분**으로 별도 표시하는 것이 좋다.

---

# 4. 전체 대표 성분 사전

## 4.1 수분 / 보습 Humectant

| 대표 성분 | INCI/연관 성분 | 핵심 태그 |
|---|---|---|
| 히알루론산 | Hyaluronic Acid | 수분 |
| 소듐하이알루로네이트 | Sodium Hyaluronate | 수분 |
| 가수분해 히알루론산 | Hydrolyzed Hyaluronic Acid | 수분 |
| 아세틸 히알루론산 | Sodium Acetylated Hyaluronate | 수분 |
| 히알루론산 크로스폴리머 | Sodium Hyaluronate Crosspolymer | 수분막 |
| 글리세린 | Glycerin | 기본 보습 |
| 프로판다이올 | Propanediol | 보습, 용매 |
| 부틸렌글라이콜 | Butylene Glycol | 보습, 용매 |
| 펜틸렌글라이콜 | Pentylene Glycol | 보습 |
| 베타인 | Betaine | 보습, 컨디셔닝 |
| 판테놀 | Panthenol | 보습, 진정 |
| 베타글루칸 | Beta-Glucan | 보습, 진정 |
| 엑토인 | Ectoin | 보습, 진정 |
| 폴리글루타믹애씨드 | Polyglutamic Acid | 보습 |
| 트레할로오스 | Trehalose | 보습 |
| 소듐 PCA | Sodium PCA | NMF 보습 |
| 소듐락테이트 | Sodium Lactate | NMF 보습 |
| 우레아 | Urea | 보습, 각질 연화 |
| 하이드록시에틸우레아 | Hydroxyethyl Urea | 보습 |
| 사카라이드아이소머레이트 | Saccharide Isomerate | 보습 |
| 알로에 | Aloe Barbadensis Leaf Juice | 보습, 진정 |
| 아미노산 복합체 | Arginine, Serine, Glycine 등 | NMF, 보습 |

### 대표 그룹 추천

```text
HYALURONIC_ACID
PANTHENOL
ECTOIN
BETA_GLUCAN
GLYCERIN
NMF
POLYGLUTAMIC_ACID
UREA
```

---

## 4.2 피부 장벽 / 지질 / 영양

| 대표 성분 | INCI/연관 성분 | 핵심 태그 |
|---|---|---|
| 세라마이드 NP | Ceramide NP | 장벽 |
| 세라마이드 AP | Ceramide AP | 장벽 |
| 세라마이드 EOP | Ceramide EOP | 장벽 |
| 세라마이드 NS/NG | Ceramide NS / NG | 장벽 |
| 세라마이드 AS | Ceramide AS | 장벽 |
| 세라마이드 EOS | Ceramide EOS | 장벽 |
| 피토스핑고신 | Phytosphingosine | 장벽 |
| 스핑고리피드 | Sphingolipids | 장벽 |
| 콜레스테롤 | Cholesterol | 장벽 지질 |
| 지방산 | Fatty Acids | 장벽 |
| 리놀레익애씨드 | Linoleic Acid | 장벽 |
| 스테아릭애씨드 | Stearic Acid | 에몰리언트 |
| 팔미틱애씨드 | Palmitic Acid | 에몰리언트 |
| 스쿠알란 | Squalane | 에몰리언트 |
| 스쿠알렌 | Squalene | 에몰리언트 |
| 시어버터 | Butyrospermum Parkii Butter | 영양, 보습막 |
| 호호바오일 | Simmondsia Chinensis Seed Oil | 에몰리언트 |
| 해바라기씨오일 | Helianthus Annuus Seed Oil | 에몰리언트 |
| 메도우폼씨오일 | Limnanthes Alba Seed Oil | 에몰리언트 |
| 마카다미아씨오일 | Macadamia Integrifolia Seed Oil | 에몰리언트 |
| 아르간오일 | Argania Spinosa Kernel Oil | 에몰리언트 |
| 미네랄오일 | Mineral Oil | 보습막 |
| 페트롤라툼 | Petrolatum | 강한 보습막 |
| 다이메티콘 | Dimethicone | 보호막, 사용감 |

### 장벽 점수에서 중요한 조합

```text
Ceramide + Cholesterol + Fatty Acid
Ceramide + Panthenol
Ceramide + Squalane
Ceramide + Phytosphingosine
```

세라마이드는 **단순 존재 여부뿐 아니라 장벽 지질 조합**을 시너지 점수에 반영하는 것이 좋다.

---

# 4.3 진정 / 민감 피부

| 대표 성분 | INCI/연관 성분 | 핵심 태그 |
|---|---|---|
| 병풀 | Centella Asiatica Extract | 진정 |
| 마데카소사이드 | Madecassoside | 진정 |
| 아시아티코사이드 | Asiaticoside | 진정 |
| 마데카식애씨드 | Madecassic Acid | 진정 |
| 아시아틱애씨드 | Asiatic Acid | 진정 |
| 판테놀 | Panthenol | 진정, 보습 |
| 알란토인 | Allantoin | 진정 |
| 알파-비사보롤 | Bisabolol | 진정, 피부톤 |
| 베타글루칸 | Beta-Glucan | 진정, 보습 |
| 엑토인 | Ectoin | 진정, 보습 |
| 어성초 | Houttuynia Cordata Extract | 진정 |
| 쑥 | Artemisia Extract | 진정 |
| 알로에 | Aloe Barbadensis Leaf Extract/Juice | 진정 |
| 녹차 | Camellia Sinensis Leaf Extract | 진정, 항산화 |
| 캐모마일 | Chamomilla Recutita Extract | 진정 |
| 카렌듈라 | Calendula Officinalis Extract | 진정 |
| 감초 | Glycyrrhiza Glabra Root Extract | 진정 |
| 디포타슘글리시리제이트 | Dipotassium Glycyrrhizate | 진정 |
| 글리시리제틱애씨드 | Glycyrrhetinic Acid | 진정 |
| 구아이아줄렌 | Guaiazulene | 진정 |
| 아줄렌 | Azulene | 진정 |
| 오트 | Avena Sativa Kernel Extract | 진정 |
| 콜로이달 오트밀 | Colloidal Oatmeal | 진정, 보습막 |
| 위치하젤 | Hamamelis Virginiana Extract | 수렴 계열 |
| 자작나무수액 | Betula Platyphylla Japonica Juice | 보습, 컨디셔닝 |

---

# 4.4 피부톤 / 브라이트닝 / 색소 케어

> 화력에서는 "미백 치료"보다 **피부톤·칙칙함·잡티 케어 성분**처럼 표현하는 편이 안전하다.  
> 국내 기능성화장품으로 인정된 제품 여부는 성분 점수와 별도 필드로 관리한다.

| 대표 성분 | INCI/연관 성분 | 핵심 태그 |
|---|---|---|
| 나이아신아마이드 | Niacinamide | 피부톤, 장벽 |
| 비타민C | Ascorbic Acid | 피부톤, 항산화 |
| 3-O-에틸아스코빅애씨드 | 3-O-Ethyl Ascorbic Acid | 비타민C 유도체 |
| 아스코빌글루코사이드 | Ascorbyl Glucoside | 비타민C 유도체 |
| 소듐아스코빌포스페이트 | Sodium Ascorbyl Phosphate | 비타민C 유도체 |
| 마그네슘아스코빌포스페이트 | Magnesium Ascorbyl Phosphate | 비타민C 유도체 |
| 테트라헥실데실아스코베이트 | Tetrahexyldecyl Ascorbate | 지용성 비타민C 유도체 |
| 아스코빌테트라이소팔미테이트 | Ascorbyl Tetraisopalmitate | 지용성 비타민C 유도체 |
| 알파-알부틴 | Alpha-Arbutin | 피부톤 |
| 알부틴 | Arbutin | 피부톤 |
| 트라넥사믹애씨드 | Tranexamic Acid | 피부톤 |
| 감초추출물 | Licorice Root Extract | 피부톤, 진정 |
| 글라브리딘 | Glabridin | 감초 유래 |
| 알파-비사보롤 | Alpha-Bisabolol | 피부톤, 진정 |
| 글루타치온 | Glutathione | 항산화, 피부톤 |
| N-아세틸글루코사민 | N-Acetyl Glucosamine | 피부톤, 보습 |
| 코직애씨드 | Kojic Acid | 피부톤 |
| 코직디팔미테이트 | Kojic Dipalmitate | 피부톤 |
| 아젤라익애씨드 | Azelaic Acid | 피부톤, 트러블 |
| 페룰릭애씨드 | Ferulic Acid | 항산화, 비타민C 보조 |
| 레조시놀 계열 | 일부 국가/제품 사용 | 규제 확인 필요 |
| 닥나무추출물 | Broussonetia Kazinoki Root Extract | 피부톤 |
| 멀베리 | Morus Alba Extract | 피부톤 |
| 쌀/쌀겨추출물 | Oryza Sativa Extract | 컨디셔닝 |
| 쌀겨수 | Rice Bran Water/Extract | 피부결, 컨디셔닝 |

### 비타민C는 하나의 성분으로 합치되 내부 형태 점수는 구분

예:

```text
VITAMIN_C
├─ Ascorbic Acid                    form_weight = 1.00
├─ 3-O-Ethyl Ascorbic Acid          form_weight = 0.90
├─ Ascorbyl Glucoside               form_weight = 0.80
├─ Sodium Ascorbyl Phosphate        form_weight = 0.80
├─ Magnesium Ascorbyl Phosphate     form_weight = 0.80
└─ Tetrahexyldecyl Ascorbate        form_weight = 0.75
```

위 가중치는 실제 출시 전 근거 검토를 거쳐 조정해야 하며, **예시값**으로만 사용한다.

---

# 4.5 탄력 / 주름 / 안티에이징

| 대표 성분 | INCI/연관 성분 | 핵심 태그 |
|---|---|---|
| 레티놀 | Retinol | 주름, 탄력, 피부결 |
| 레티날 | Retinal / Retinaldehyde | 주름, 탄력 |
| 레티닐팔미테이트 | Retinyl Palmitate | 레티노이드 |
| 레티닐프로피오네이트 | Retinyl Propionate | 레티노이드 |
| 하이드록시피나콜론레티노에이트 | Hydroxypinacolone Retinoate | 레티노이드 계열 |
| 아데노신 | Adenosine | 주름, 탄력 |
| 바쿠치올 | Bakuchiol | 안티에이징 |
| 구리펩타이드 | Copper Tripeptide-1 | 탄력 |
| 팔미토일펜타펩타이드-4 | Palmitoyl Pentapeptide-4 | 펩타이드 |
| 팔미토일트라이펩타이드-1 | Palmitoyl Tripeptide-1 | 펩타이드 |
| 팔미토일테트라펩타이드-7 | Palmitoyl Tetrapeptide-7 | 펩타이드 |
| 아세틸헥사펩타이드-8 | Acetyl Hexapeptide-8 | 펩타이드 |
| 트라이펩타이드-1 | Tripeptide-1 | 펩타이드 |
| 헥사펩타이드-9 | Hexapeptide-9 | 펩타이드 |
| 올리고펩타이드 계열 | Oligopeptide | 펩타이드 |
| 콜라겐 | Hydrolyzed Collagen / Soluble Collagen | 보습막 중심 |
| 엘라스틴 | Hydrolyzed Elastin | 컨디셔닝 |
| 아세틸글루코사민 | N-Acetyl Glucosamine | 피부 컨디셔닝 |
| CoQ10 | Ubiquinone | 항산화 |
| 레스베라트롤 | Resveratrol | 항산화 |
| 비타민E | Tocopherol / Tocopheryl Acetate | 항산화 |
| 카르노신 | Carnosine | 항산화/컨디셔닝 |
| PDRN | Sodium DNA | 트렌드, 컨디셔닝 |

### 주의

`콜라겐 함유 = 피부 콜라겐을 그대로 보충`처럼 표현하지 않는다.

화장품의 가수분해 콜라겐은 **보습/피막/컨디셔닝 성격**과 제품별 근거를 중심으로 설명하는 편이 적절하다.

---

# 4.6 각질 / 피부결 / 모공

## AHA

| 성분 | INCI | 태그 |
|---|---|---|
| 글라이콜릭애씨드 | Glycolic Acid | 각질, 피부결 |
| 락틱애씨드 | Lactic Acid | 각질, 보습 |
| 만델릭애씨드 | Mandelic Acid | 각질 |
| 시트릭애씨드 | Citric Acid | pH, AHA |
| 말릭애씨드 | Malic Acid | AHA |
| 타타릭애씨드 | Tartaric Acid | AHA |

## BHA

| 성분 | INCI | 태그 |
|---|---|---|
| 살리실릭애씨드 | Salicylic Acid | 피지, 모공, 각질 |
| 베타인살리실레이트 | Betaine Salicylate | 각질 |
| 윌로우바크 | Salix Alba Bark Extract | 컨디셔닝/살리실레이트 연관 |

## PHA

| 성분 | INCI | 태그 |
|---|---|---|
| 글루코노락톤 | Gluconolactone | 순한 각질, 보습 |
| 락토바이오닉애씨드 | Lactobionic Acid | 각질, 보습 |
| 갈락토오스 계열 PHA | formulation dependent | 각질 |

## LHA

| 성분 | INCI | 태그 |
|---|---|---|
| 카프릴로일살리실릭애씨드 | Capryloyl Salicylic Acid | 각질, 피지 |

## 효소 각질 케어

| 성분 | INCI | 태그 |
|---|---|---|
| 파파인 | Papain | 효소 각질 |
| 브로멜라인 | Bromelain | 효소 각질 |
| 프로테아제 | Protease | 효소 각질 |

---

# 4.7 피지 / 트러블 / 모공 케어

| 대표 성분 | INCI/연관 성분 | 핵심 태그 |
|---|---|---|
| 살리실릭애씨드 | Salicylic Acid | 피지, 각질 |
| 아젤라익애씨드 | Azelaic Acid | 트러블, 피부톤 |
| 징크 PCA | Zinc PCA | 피지 |
| 아연 | Zinc Oxide 등 | 피부 보호 |
| 나이아신아마이드 | Niacinamide | 피지, 장벽 |
| 티트리 | Melaleuca Alternifolia Leaf Oil/Extract | 트러블 케어 |
| 녹차 | Camellia Sinensis Leaf Extract | 피지, 항산화 |
| 어성초 | Houttuynia Cordata Extract | 진정 |
| 황 | Sulfur | 지역/제품 유형 규제 확인 |
| 카올린 | Kaolin | 피지 흡착 |
| 벤토나이트 | Bentonite | 피지 흡착 |
| 숯 | Charcoal Powder | 흡착 |
| 위치하젤 | Hamamelis Virginiana | 수렴 |
| 버드나무껍질 | Salix Alba Bark Extract | 컨디셔닝 |
| 숙신산 | Succinic Acid | 트렌드, 피지 케어 |
| 카프릴로일글라이신 | Capryloyl Glycine | 피지/컨디셔닝 |
| 사코신 | Sarcosine | 피지 관련 화장품 성분 |
| 피록톤올아민 | Piroctone Olamine | 두피/제품 유형별 활용 |

---

# 4.8 항산화 / 광노화 보조

| 대표 성분 | INCI/연관 성분 | 핵심 태그 |
|---|---|---|
| 비타민C | Ascorbic Acid | 항산화 |
| 비타민E | Tocopherol | 항산화 |
| 토코페릴아세테이트 | Tocopheryl Acetate | 항산화 |
| 페룰릭애씨드 | Ferulic Acid | 항산화 |
| 레스베라트롤 | Resveratrol | 항산화 |
| CoQ10 | Ubiquinone | 항산화 |
| 녹차/EGCG | Camellia Sinensis / EGCG | 항산화 |
| 카페익애씨드 | Caffeic Acid | 항산화 |
| 로즈마리 | Rosmarinus Officinalis Extract | 항산화 |
| 아스타잔틴 | Astaxanthin | 항산화 |
| 알파리포익애씨드 | Thioctic Acid | 항산화 |
| 글루타치온 | Glutathione | 항산화 |
| 카르노신 | Carnosine | 항산화 |
| 에르고티오네인 | Ergothioneine | 항산화 |
| SOD | Superoxide Dismutase | 항산화 |
| 루틴 | Rutin | 항산화 |
| 퀘르세틴 | Quercetin | 항산화 |
| 폴리페놀 | Polyphenol-rich extracts | 항산화 |

---

# 4.9 발효 / 마이크로바이옴 컨디셔닝

> “마이크로바이옴 개선”처럼 강한 효능 표현보다는 **발효 유래/피부 컨디셔닝** 카테고리로 시작하는 것을 추천한다.

| 대표 성분 | INCI/연관 성분 | 태그 |
|---|---|---|
| 비피다 | Bifida Ferment Lysate | 장벽, 컨디셔닝 |
| 갈락토미세스 | Galactomyces Ferment Filtrate | 피부결 |
| 락토바실러스 | Lactobacillus Ferment/Lysate | 컨디셔닝 |
| 사카로미세스 | Saccharomyces Ferment Filtrate | 컨디셔닝 |
| 류코노스톡 | Leuconostoc Ferment Filtrate | 컨디셔닝 |
| 효모발효물 | Yeast Ferment Extract | 컨디셔닝 |
| 콩발효물 | Soybean Ferment Extract | 컨디셔닝 |
| 라이스퍼먼트 | Rice Ferment Filtrate | 컨디셔닝 |

---

# 4.10 식물 추출물 / K-Beauty 대표 성분

| 대표 성분 | INCI/연관 성분 | 태그 |
|---|---|---|
| 병풀 | Centella Asiatica | 진정 |
| 어성초 | Houttuynia Cordata | 진정 |
| 쑥 | Artemisia | 진정 |
| 녹차 | Camellia Sinensis | 항산화 |
| 감초 | Glycyrrhiza Glabra | 진정, 피부톤 |
| 인삼 | Panax Ginseng | 안티에이징 |
| 쌀 | Oryza Sativa | 컨디셔닝 |
| 검은콩 | Glycine Soja | 컨디셔닝 |
| 대나무 | Bambusa | 보습 |
| 자작나무 | Betula | 보습 |
| 알로에 | Aloe Vera | 진정 |
| 캐모마일 | Chamomile | 진정 |
| 카렌듈라 | Calendula | 진정 |
| 로즈마리 | Rosemary | 항산화 |
| 라벤더 | Lavender | 향/식물 추출물 |
| 티트리 | Tea Tree | 트러블 케어 |
| 유칼립투스 | Eucalyptus | 식물 추출물 |
| 약모밀 | Houttuynia | 어성초 alias |
| 연꽃 | Nelumbo Nucifera | 컨디셔닝 |
| 석류 | Punica Granatum | 항산화 |
| 무화과 | Ficus Carica | 컨디셔닝 |
| 블루베리 | Vaccinium | 항산화 |
| 아사이 | Euterpe Oleracea | 항산화 |
| 프로폴리스 | Propolis Extract | 보습, 컨디셔닝 |
| 꿀 | Honey Extract | 보습 |
| 로열젤리 | Royal Jelly Extract | 컨디셔닝 |

식물 추출물은 추출 방식/함량/표준화가 크게 다르므로  
**단순히 전성분 앞에 있다고 강한 활성 성분으로 간주하지 않는 것**이 중요하다.

---

# 4.11 오일 / 버터 / 에몰리언트

| 성분 | INCI | 태그 |
|---|---|---|
| 스쿠알란 | Squalane | 보습막 |
| 호호바오일 | Jojoba Oil | 에몰리언트 |
| 아르간오일 | Argan Oil | 에몰리언트 |
| 해바라기씨오일 | Sunflower Seed Oil | 에몰리언트 |
| 포도씨오일 | Grape Seed Oil | 에몰리언트 |
| 동백오일 | Camellia Japonica Seed Oil | 에몰리언트 |
| 마카다미아오일 | Macadamia Seed Oil | 에몰리언트 |
| 올리브오일 | Olive Fruit Oil | 에몰리언트 |
| 아보카도오일 | Avocado Oil | 에몰리언트 |
| 메도우폼씨오일 | Meadowfoam Seed Oil | 에몰리언트 |
| 시어버터 | Shea Butter | 보습막 |
| 코코아버터 | Cocoa Butter | 보습막 |
| 망고버터 | Mango Seed Butter | 보습막 |
| 카프릴릭/카프릭트라이글리세라이드 | Caprylic/Capric Triglyceride | 에몰리언트 |
| C12-15 알킬벤조에이트 | C12-15 Alkyl Benzoate | 에몰리언트 |

---

# 4.12 눈가 / 붓기 / 컨디셔닝용 서브 카테고리

| 성분 | INCI | 태그 |
|---|---|---|
| 카페인 | Caffeine | 눈가, 컨디셔닝 |
| 녹차 | Green Tea | 항산화 |
| 나이아신아마이드 | Niacinamide | 피부톤 |
| 펩타이드 | Peptides | 탄력 |
| 아데노신 | Adenosine | 주름 |
| 히알루론산 | Hyaluronic Acid | 수분 |
| 레티놀 | Retinol | 눈가 주름, 민감 주의 |
| 비타민K 유도체 | 제품별 상이 | 근거/규제 검토 필요 |

---

# 5. 성분 카테고리 구조

하나의 성분은 여러 효능 태그를 가질 수 있다.

예:

```json
{
  "ingredientKey": "NIACINAMIDE",
  "nameKo": "나이아신아마이드",
  "nameInci": "Niacinamide",
  "primaryCategory": "BRIGHTENING",
  "tags": [
    "BRIGHTENING",
    "SEBUM",
    "BARRIER",
    "ANTI_AGING"
  ]
}
```

추천 카테고리 enum:

```text
HYDRATION
BARRIER
SOOTHING
BRIGHTENING
ANTI_AGING
EXFOLIATION
SEBUM
BLEMISH
PORE
ANTIOXIDANT
FERMENT
EMOLLIENT
EYE_CARE
TREND
```

---

# 6. 화력점수 설계

## 6.1 점수를 2개로 분리할 것

### A. 성분 화력점수

```text
이 제품이 해당 성분을 얼마나 중심적으로 설계했는가?
```

예:

```text
나이아신아마이드 화력 94
```

### B. 나의 적합도

```text
이 제품이 현재 사용자의 피부 타입/고민과 얼마나 잘 맞는가?
```

예:

```text
내 피부 적합도 87
```

### 최종 추천점수

```text
추천점수
= 성분 화력점수 × 0.75
+ 사용자 적합도 × 0.25
```

이렇게 하면 사용자가 **“나이아신아마이드 화력이 센 제품”**을 요구했을 때
개인화 때문에 성분 점수 낮은 제품이 위로 올라오는 현상을 막을 수 있다.

---

# 6.2 성분 화력점수 100점 구조

추천안:

```text
1. 성분 매칭 정확도       20점
2. 함량/배치 강도         30점
3. 성분 형태/근거 수준    15점
4. 제품 제형/접촉시간     10점
5. 배합 시너지            10점
6. 안정성/패키징          10점
7. 정보 신뢰도             5점
------------------------------
총점                    100점
```

---

## 6.3 1. 성분 매칭 정확도 - 20점

```text
정확한 핵심 성분        20
같은 계열 핵심 유도체   15~19
보조 성분               5~14
마케팅 연관 성분        1~5
```

예:

```text
사용자 선택 = 비타민C

Ascorbic Acid                  20
3-O-Ethyl Ascorbic Acid        18
Ascorbyl Glucoside             17
Sodium Ascorbyl Phosphate      17
Tetrahexyldecyl Ascorbate      16
Orange Extract                  3
```

오렌지추출물이 들어갔다고 비타민C 제품과 동급으로 취급하지 않는다.

---

# 6.4 2. 함량 / 배치 강도 - 30점

## 함량이 공개된 경우

공식 제품 페이지에서 정확한 함량이 공개되어 있다면 가장 신뢰도가 높다.

```text
declaredPercentage != null
→ 성분별 concentration rule 사용
```

단순히 **농도가 높을수록 무조건 높은 점수**를 주면 안 된다.

성분마다 적절한 농도 범위가 다르므로 곡선형 점수를 사용한다.

```text
너무 낮음   → 낮은 점수
활용 범위   → 높은 점수
과도하게 높음 → 추가 점수 없음 / 자극 페널티 가능
```

예시 데이터 구조:

```json
{
  "ingredient": "NIACINAMIDE",
  "concentrationRule": {
    "type": "CURVE",
    "bands": [
      { "min": 0, "max": 1, "score": 8 },
      { "min": 1, "max": 2, "score": 16 },
      { "min": 2, "max": 5, "score": 27 },
      { "min": 5, "max": 10, "score": 30 },
      { "min": 10, "max": 100, "score": 26 }
    ]
  }
}
```

**중요:** 위 구간은 구현 예시이며 실제 운영값은 논문, 국내 기능성 기준, 제조사 공식 함량 및 안전성 자료를 검토해 성분별로 따로 확정한다.

---

## 함량이 공개되지 않은 경우

전성분 순서를 proxy로 이용한다.

국내 화장품 표시 기준은 원칙적으로 함량이 많은 순서로 표시하지만  
**1% 이하 성분은 순서와 상관없이 표시할 수 있다.**

따라서 다음처럼 운영한다.

```text
함량 공개 제품          신뢰도 A
전성분 상위권 추정      신뢰도 B
전성분 중/하위 추정     신뢰도 C
1% 이하 가능 영역       정확한 함량 추정 금지
```

권장 로직:

```text
1~5번째      25~30점
6~10번째     20~24점
11~20번째    14~19점
21번째 이후   8~15점
```

단 이 값은 절대 농도가 아니라 **순위 기반 추정값**이다.

함량을 모르는 제품은 최종 화면에 다음처럼 표시한다.

```text
나이아신아마이드 화력 84
함량 신뢰도: 추정
```

함량 공개 제품:

```text
나이아신아마이드 화력 94
함량 신뢰도: 공식 공개
```

---

# 6.5 3. 성분 형태 / 근거 수준 - 15점

성분 DB 자체에 evidence level을 둔다.

```text
A = 충분한 기능/임상/공식 자료       15
B = 비교적 충분한 화장품 자료        11
C = 제한적 자료                       7
D = 트렌드/마케팅 중심                3
```

예:

```text
Niacinamide        A
Retinol            A
Hyaluronic Acid    A
Ceramide           A
Panthenol          A/B
Ectoin             B
Bakuchiol          B
Galactomyces       B/C
PDRN/Sodium DNA    C/D
```

실제 등급은 출시 전에 근거 문헌 검토 후 확정한다.

---

# 6.6 4. 제품 제형 / 접촉시간 - 10점

같은 성분이어도 세안제로 30초 사용하는 것과 세럼을 몇 시간 바르는 것은 다르다.

예시:

```text
앰플 / 세럼       10
크림               9
로션               9
토너               8
에센스             9
슬리핑팩           9
시트마스크         7
클렌징 제품        3~5
워시오프팩         5~6
```

성분별로 별도 multiplier를 둘 수 있다.

---

# 6.7 5. 배합 시너지 - 10점

### 나이아신아마이드 예

```text
+ 아데노신
+ 판테놀
+ 세라마이드
+ N-Acetyl Glucosamine
+ 알부틴
+ 트라넥사믹애씨드
```

### 비타민C 예

```text
+ 비타민E
+ 페룰릭애씨드
```

### 장벽 예

```text
세라마이드
+ 콜레스테롤
+ 지방산
```

### 수분 예

```text
히알루론산
+ 글리세린
+ 판테놀
+ 베타인
```

### 레티놀 예

```text
레티놀
+ 세라마이드
+ 판테놀
+ 스쿠알란
```

시너지 점수는 최대 10점까지만 준다.

성분이 많이 들어있다고 무조건 점수가 올라가는 것을 막는다.

---

# 6.8 6. 안정성 / 패키징 - 10점

모든 제품에서 사용하지 않아도 되지만,
비타민C/레티노이드처럼 안정성이 중요한 성분은 유용하다.

예:

```text
불투명 용기
에어리스 펌프
소용량
개별 포장
제조사가 안정화 기술 공개
```

반대로 안정성 관련 정보가 없으면 중립점수를 준다.

**패키지만 보고 효능을 단정하지 않는다.**

---

# 6.9 7. 정보 신뢰도 - 5점

```text
제조사 공식 함량 공개          5
공식 전성분 + 제품 설명        4
공식 전성분만 존재             3
판매처 전성분                  2
사용자 제보/불명확             1
```

---

# 7. 자극/주의도는 화력점수에서 완전히 섞지 않는다

강한 제품을 자극 가능성 때문에 무조건 낮은 화력으로 만들어 버리면 점수의 의미가 흐려진다.

따라서 별도 지표 추천:

```text
나이아신아마이드 화력       92
내 피부 적합도              74
민감 피부 주의도            보통
```

예:

```text
Retinol
AHA
BHA
Vitamin C (low-pH formulation)
Essential Oil
Fragrance
```

사용자가 민감성 피부를 선택한 경우 **적합도 점수**에서 감점한다.

---

# 8. 최종 추천 정렬 방식

사용자가 나이아신아마이드를 선택했다고 가정.

```sql
ORDER BY
    niacinamide_firepower_score DESC,
    user_fit_score DESC,
    review_confidence DESC
```

또는:

```text
recommendationScore
= ingredientFirepower * 0.75
+ userFit * 0.25
```

필터:

```text
화력 높은 순
내 피부에 맞는 순
가격 낮은 순
리뷰 많은 순
민감 피부용
무향
에탄올 제외
```

---

# 9. 제품 상세 화면 예시

```text
--------------------------------------
A 나이아신 세럼
--------------------------------------

나이아신아마이드 화력
94 / 100

[███████████████████░]

왜 94점인가요?

✓ 핵심 성분 정확 매칭
✓ 제조사 함량 공개
✓ Leave-on 세럼
✓ 판테놀 + 세라마이드 조합
✓ 공식 전성분 확인

성분 구성

나이아신아마이드      핵심
판테놀                보조
세라마이드 NP         장벽
히알루론산            수분

내 피부 적합도
87 / 100

추천 이유
- 피부톤 고민
- 복합성 피부
- 장벽 관리 관심
```

---

# 10. 마이페이지 UI 기획

## 섹션 1. 내 피부 프로필

```text
피부 타입
[ 지성 ] [ 건성 ] [ 복합성 ] [ 중성 ] [ 민감성 ]

피부 고민
[ 수분 ] [ 장벽 ] [ 트러블 ] [ 피지 ]
[ 모공 ] [ 피부톤 ] [ 탄력 ] [ 각질 ]
```

---

## 섹션 2. 나에게 맞는 성분

```text
나의 관심 성분

[ 나이아신아마이드 ✓ ]
[ 세라마이드 ✓ ]
[ 히알루론산 ✓ ]
[ 레티놀 ]
[ 비타민C ]
[ 판테놀 ]
```

추천 선택 개수:

```text
최소 1개
권장 3~5개
최대 10개
```

---

# 11. 성분 선택 UX

처음부터 100개를 보여주지 않는다.

## 1단계

```text
무엇이 가장 고민인가요?

[ 수분 부족 ]
[ 민감/진정 ]
[ 피부톤 ]
[ 트러블 ]
[ 모공/피지 ]
[ 탄력/주름 ]
[ 피부 장벽 ]
```

## 2단계

고민을 누르면 추천 성분을 보여준다.

예:

```text
피부톤

추천 성분
[ 나이아신아마이드 ]
[ 비타민C ]
[ 알파-알부틴 ]
[ 트라넥사믹애씨드 ]
[ 감초 ]
```

## 3단계

성분 선택 후 설명

```text
나이아신아마이드

피부톤 ★★★★★
장벽   ★★★★☆
피지   ★★★☆☆

대표적인 멀티 기능 성분
```

---

# 12. 성분 상세 페이지

URL 예:

```text
/ingredients/niacinamide
/ingredients/hyaluronic-acid
/ingredients/ceramide
/ingredients/retinol
```

페이지 구성:

```text
성분명
한글명
INCI
성분 그룹
주요 기능
보조 기능
추천 피부 타입
주의 피부 타입
대표 조합
같이 자주 쓰이는 성분
관련 제품 TOP 20
화력점수 TOP 제품
근거 수준
```

---

# 13. 데이터베이스 설계

## ingredient_group

```sql
id
key
name_ko
name_en
slug
primary_category
description
evidence_level
featured
display_order
created_at
updated_at
```

예:

```text
1
NIACINAMIDE
나이아신아마이드
Niacinamide
niacinamide
BRIGHTENING
A
true
1
```

---

## ingredient_alias

실제 전성분을 대표 그룹과 연결.

```sql
id
ingredient_group_id
inci_name
korean_name
alias_name
match_weight
evidence_level
```

예:

```text
VITAMIN_C
    Ascorbic Acid
    Ascorbyl Glucoside
    Sodium Ascorbyl Phosphate
    Magnesium Ascorbyl Phosphate
    3-O-Ethyl Ascorbic Acid
    Tetrahexyldecyl Ascorbate
```

---

## ingredient_tag

```sql
id
code
name
```

예:

```text
HYDRATION
BARRIER
SOOTHING
BRIGHTENING
ANTI_AGING
SEBUM
PORE
EXFOLIATION
ANTIOXIDANT
```

---

## ingredient_group_tag

```sql
ingredient_group_id
ingredient_tag_id
weight
```

하나의 성분이 여러 카테고리와 연결될 수 있다.

---

## product

```sql
id
brand_id
name
category
price
volume
product_type
image_url
official_url
functional_cosmetic
created_at
updated_at
```

---

## product_ingredient

```sql
id
product_id
ingredient_alias_id
ingredient_order
declared_percentage
source_type
source_url
verified
```

`source_type`:

```text
BRAND_OFFICIAL
MANUFACTURER
RETAILER
MANUAL
USER_REPORT
```

---

## ingredient_score_rule

```sql
id
ingredient_group_id
rule_version
concentration_rule
formulation_rule
synergy_rule
evidence_rule
active
```

---

## product_ingredient_score

```sql
id
product_id
ingredient_group_id

match_score
concentration_score
evidence_score
product_type_score
synergy_score
stability_score
confidence_score

firepower_score

score_version
calculated_at
```

점수 계산 결과를 매 요청마다 계산하지 말고 **미리 계산해서 저장**하는 것을 추천한다.

---

## user_preferred_ingredient

```sql
id
user_id
ingredient_group_id
priority
created_at
```

---

# 14. API 설계 예시

## 대표 성분 목록

```http
GET /api/v1/ingredients?featured=true
```

---

## 고민별 추천 성분

```http
GET /api/v1/ingredients/recommend?concern=BRIGHTENING
```

---

## 내 관심 성분 저장

```http
PUT /api/v1/me/ingredients
```

```json
{
  "ingredientIds": [1, 3, 7, 10]
}
```

---

## 나이아신아마이드 화력 순 상품

```http
GET /api/v1/products?ingredient=niacinamide&sort=firepower,desc
```

---

## 성분 페이지

```http
GET /api/v1/ingredients/niacinamide
```

---

## 제품의 전체 화력점수

```http
GET /api/v1/products/{productId}/firepower
```

응답 예:

```json
{
  "productId": 1004,
  "scores": [
    {
      "ingredient": "NIACINAMIDE",
      "score": 94,
      "confidence": "HIGH"
    },
    {
      "ingredient": "PANTHENOL",
      "score": 81,
      "confidence": "MEDIUM"
    },
    {
      "ingredient": "CERAMIDE",
      "score": 72,
      "confidence": "MEDIUM"
    }
  ]
}
```

---

# 15. 점수 등급 UI

숫자만 보여주기보다 등급을 같이 준다.

```text
90~100   S   매우 높은 화력
80~89    A   높은 화력
70~79    B   충분한 화력
60~69    C   보통
40~59    D   낮음
0~39     E   보조 수준
```

소비자에게는 다음 정도가 자연스럽다.

```text
94
S등급
나이아신아마이드 화력 매우 높음
```

단, **“효과가 94점”**으로 표현하면 안 된다.

---

# 16. 화력점수 설명 문구

권장:

```text
화력점수는 제품의 전성분, 공개 함량, 성분 형태,
제품 유형 및 배합 구성을 바탕으로
해당 성분이 제품에서 얼마나 중심적으로 사용되었는지를
화력 기준으로 분석한 비교 지표입니다.
```

비권장:

```text
피부 미백 효과 94점
주름 제거 효과 95점
여드름 치료력 90점
```

---

# 17. 정보 신뢰도 배지

매우 중요하다.

```text
[공식 함량 확인]
[공식 전성분]
[함량 추정]
[성분 존재 확인]
```

예:

```text
나이아신아마이드 화력 94
공식 함량 확인

나이아신아마이드 화력 82
전성분 순서 기반 추정
```

같은 점수라도 신뢰도를 함께 보여주면 서비스 신뢰도가 크게 올라간다.

---

# 18. 제품 수집 시 필수 데이터

```text
브랜드
제품명
제품 유형
가격
용량
대표 이미지
전성분
전성분 순서
공개된 성분 함량
기능성화장품 여부
피부 타입 관련 공식 설명
향료 여부
에탄올 여부
공식 상품 URL
수집 출처
마지막 검증 날짜
```

---

# 19. 데이터 파싱 로직

입력:

```text
정제수, 나이아신아마이드, 프로판다이올,
글리세린, 판테놀, ...
```

파싱:

```text
Normalize
↓
한글 성분명 표준화
↓
INCI alias 매칭
↓
ingredient_group 매핑
↓
ingredient_order 저장
↓
공개 함량 병합
↓
화력점수 계산
```

---

# 20. Alias 사전이 매우 중요하다

예:

```text
병풀추출물
센텔라아시아티카추출물
Centella Asiatica Extract

→ CENTELLA
```

```text
비타민 E
토코페롤
Tocopherol

→ VITAMIN_E
```

```text
히알루론산
하이알루로닉애씨드
Hyaluronic Acid

→ HYALURONIC_ACID
```

오타/띄어쓰기까지 normalize한다.

```text
소듐 하이알루로네이트
소듐하이알루로네이트

→ 동일
```

---

# 21. 대표 성분별 시너지 예시

| 핵심 성분 | 시너지 후보 |
|---|---|
| 나이아신아마이드 | NAG, 판테놀, 세라마이드, 알부틴, TXA |
| 히알루론산 | 글리세린, 판테놀, 베타인, 세라마이드 |
| 세라마이드 | 콜레스테롤, 지방산, 스쿠알란, 판테놀 |
| 비타민C | 비타민E, 페룰릭애씨드 |
| 레티놀 | 세라마이드, 판테놀, 스쿠알란 |
| 알부틴 | 나이아신아마이드, 비타민C 유도체 |
| 트라넥사믹애씨드 | 나이아신아마이드, 알부틴 |
| AHA | 판테놀, 히알루론산 |
| BHA | 나이아신아마이드, 판테놀 |
| 아젤라익애씨드 | 나이아신아마이드, 진정 성분 |
| 병풀 | 판테놀, 알란토인, 세라마이드 |
| 펩타이드 | 히알루론산, 세라마이드, 아데노신 |
| 엑토인 | 판테놀, 세라마이드, 베타글루칸 |
| 녹차 | 나이아신아마이드, 판테놀 |

시너지는 제품 효능을 보장하는 개념이 아니라  
**배합의 목적과 균형을 평가하는 보조 점수**로 사용한다.

---

# 22. 사용자 피부 타입 기반 적합도

## 지성

가산:

```text
Niacinamide
Zinc PCA
BHA
Green Tea
Azelaic Acid
```

상황에 따라 감점:

```text
무거운 occlusive 조합
매우 리치한 버터/오일 구성
```

---

## 건성

가산:

```text
Ceramide
Hyaluronic Acid
Glycerin
Panthenol
Squalane
Beta-Glucan
Ectoin
```

---

## 민감성

가산:

```text
Panthenol
Ceramide
Madecassoside
Beta-Glucan
Ectoin
Allantoin
```

주의도 상승:

```text
고강도 AHA
BHA
Retinoid
저pH 고함량 Vitamin C
향료/에센셜오일
```

---

## 피부톤 고민

가산:

```text
Niacinamide
Vitamin C
Alpha-Arbutin
Tranexamic Acid
Licorice
```

---

## 탄력/주름 고민

가산:

```text
Retinoid
Adenosine
Peptide
Vitamin C
Bakuchiol
```

---

# 23. 한 제품에 여러 화력점수를 부여한다

예:

```text
A 세럼

나이아신아마이드 화력      94
판테놀 화력                82
히알루론산 화력            75
세라마이드 화력            42
```

이 구조가 매우 중요하다.

제품마다 `총점 하나`만 매기면 사용자가 원하는 성분으로 정렬하기 어렵다.

---

# 24. 제품 종합 화력점수

별도 종합점수가 필요하면 다음처럼 계산한다.

```text
제품 종합 화력
= 핵심 성분 TOP1 × 0.45
+ TOP2 × 0.30
+ TOP3 × 0.15
+ 제형 완성도 × 0.10
```

하지만 검색/추천에서는 **종합 화력보다 사용자가 고른 성분 화력점수**를 우선한다.

---

# 25. 성분 간 충돌보다 "사용 주의"로 표현

인터넷에 흔한

```text
비타민C + 나이아신아마이드 절대 같이 사용 금지
```

같은 단순 규칙을 서비스 로직으로 넣으면 부정확해질 수 있다.

대신:

```text
동시 사용 시 자극 가능
제품 제형에 따라 달라질 수 있음
민감 피부는 사용 빈도 조절 권장
```

처럼 **사용자 피부 적합도/주의도**로 처리한다.

---

# 26. 화력에서 별도로 관리할 규제/주의 성분

아래는 일반적인 소비자 관심 성분과 분리해서 운영한다.

```text
Hydroquinone
Tretinoin
Adapalene
Tazarotene
고농도 산 성분
의약품 성분
국가별 사용 제한 성분
```

화장품 DB와 의약품을 섞지 않는다.

제품 등록 시:

```text
regulatory_status
COSMETIC
FUNCTIONAL_COSMETIC
QUASI_DRUG
DRUG
UNKNOWN
```

형태로 관리하면 향후 확장이 쉽다.

---

# 27. 근거 등급 시스템

성분마다 `evidenceLevel`을 둔다.

## A

```text
공식 기능성 기준 또는
다수의 인체 적용/임상 자료와 리뷰가 존재
```

## B

```text
상당한 화장품 사용 자료와
일부 인체 자료 존재
```

## C

```text
기초 연구/소규모 인체 자료 중심
```

## D

```text
트렌드/마케팅/제형 컨디셔닝 중심
```

이를 화면에 직접 A/B/C로 보여주지 않아도  
내부 화력점수의 신뢰도 조정에 사용한다.

---

# 28. 성분 데이터 예시

```json
{
  "key": "NIACINAMIDE",
  "nameKo": "나이아신아마이드",
  "nameEn": "Niacinamide",
  "slug": "niacinamide",
  "primaryCategory": "BRIGHTENING",
  "tags": [
    "BRIGHTENING",
    "BARRIER",
    "SEBUM",
    "ANTI_AGING"
  ],
  "evidenceLevel": "A",
  "featured": true,
  "aliases": [
    "Niacinamide",
    "Nicotinamide",
    "나이아신아마이드"
  ]
}
```

---

# 29. 제품 점수 결과 예시

```json
{
  "productId": 123,
  "ingredientKey": "NIACINAMIDE",
  "score": 94,
  "grade": "S",
  "confidence": "HIGH",
  "breakdown": {
    "match": 20,
    "concentration": 28,
    "evidence": 15,
    "productType": 10,
    "synergy": 9,
    "stability": 7,
    "dataConfidence": 5
  }
}
```

---

# 30. 추천 페이지 예시

```text
나이아신아마이드

선택한 이유
피부톤 · 피지 · 장벽을 함께 관리하기 좋은 대표 성분

[ 전체 ]
[ 세럼 ]
[ 앰플 ]
[ 크림 ]
[ 토너 ]

화력 높은 순 ▼

1
A 10% 나이아신 세럼
화력 96 · S
공식 함량 확인

2
B 나이아신 앰플
화력 89 · A
공식 전성분

3
C 장벽 크림
화력 84 · A
함량 추정
```

---

# 31. 홈 추천 문구 예시

```text
성분부터 고르면 화장품이 쉬워진다.

내 피부에 필요한 성분을 선택하면
화력이 전성분을 분석해
해당 성분의 화력이 높은 제품부터 보여드립니다.
```

---

# 32. MVP 개발 순서

## Phase 1

```text
대표 성분 30개
제품 300~1,000개
전성분 파싱
성분 alias 매핑
성분별 화력점수
마이페이지 관심 성분 저장
성분별 TOP 제품
```

## Phase 2

```text
피부 타입 적합도
피부 고민 적합도
함량 공개 제품 별도 수집
점수 breakdown
근거 신뢰도
성분 상세 페이지
```

## Phase 3

```text
제품 비교
루틴 추천
성분 조합 추천
사용자 리뷰 데이터
가격 대비 화력
브랜드별 화력 분석
```

---

# 33. "가격 대비 화력" 확장 기능

화력 서비스에 매우 잘 어울린다.

```text
가성비 화력
= 성분 화력점수 / 10,000원당 가격
```

실제로는 용량까지 보정:

```text
pricePerMl = price / volumeMl

valueScore
= firepowerScore / pricePerMl
```

UI:

```text
나이아신아마이드 화력 92
30ml / 18,000원

가격 대비 화력
상위 8%
```

---

# 34. 제품 비교 기능

```text
A 세럼 vs B 세럼

                    A       B
나이아신 화력       94      87
히알루론산 화력     72      91
세라마이드 화력     31      76
내 피부 적합도       90      86
가격                18,000  22,000
```

사용자가 제품을 비교해야 할 이유가 명확해진다.

---

# 35. 최종 추천 정보 구조

## User

```text
skinType
skinConcerns
sensitivity
preferredIngredients
avoidIngredients
```

## Ingredient

```text
ingredientGroup
ingredientAlias
ingredientTags
evidenceLevel
scoreRule
```

## Product

```text
product
productIngredients
declaredPercentages
functionalClaims
productType
```

## Score

```text
ingredientFirepower
userFit
confidence
valueScore
```

---

# 36. 가장 먼저 구축할 성분 그룹 KEY

개발용 enum/seed 추천:

```text
NIACINAMIDE
HYALURONIC_ACID
CERAMIDE
PANTHENOL
CENTELLA
MADECASSOSIDE
VITAMIN_C
RETINOID
ADENOSINE
PEPTIDE
ALPHA_ARBUTIN
ARBUTIN
TRANEXAMIC_ACID
LICORICE
GLUTATHIONE
AZELAIC_ACID
AHA
BHA
PHA
LHA
ZINC_PCA
SQUALANE
ECTOIN
BETA_GLUCAN
ALLANTOIN
GREEN_TEA
HEARTLEAF
MUGWORT
TEA_TREE
BAKUCHIOL
BIFIDA
GALACTOMYCES
GLYCERIN
BETAINE
NMF
UREA
POLYGLUTAMIC_ACID
VITAMIN_E
FERULIC_ACID
RESVERATROL
UBIQUINONE
CAFFEINE
PROPOLIS
PDRN
```

처음에는 약 45개를 DB에 넣되  
사용자 메인 화면에서는 상위 24~30개만 노출하는 구조를 추천한다.

---

# 37. 출시 전 꼭 해야 할 데이터 검증

- [ ] 성분 한글명 ↔ INCI alias 검증
- [ ] 국내 기능성화장품 관련 성분/표현 검토
- [ ] 성분별 evidence level 검토
- [ ] 성분별 함량 score curve 검토
- [ ] 산 성분/레티노이드 등 주의 문구 검토
- [ ] 제품 전성분 출처 저장
- [ ] 마지막 검증 날짜 저장
- [ ] 공식 함량과 추정 함량을 명확히 분리
- [ ] 화력점수를 치료 효과처럼 표현하지 않기
- [ ] 기능성화장품 여부를 성분 존재 여부와 분리
- [ ] 점수 계산 ruleVersion 저장
- [ ] 점수 변경 시 과거 점수 재계산 가능하게 설계

---

# 38. 참고 기준

이 기획은 다음 기준을 참고해 설계하는 것을 권장한다.

- 대한민국 식품의약품안전처(MFDS) 기능성화장품 관련 기준
- 국가법령정보센터 화장품법/화장품법 시행규칙 및 화장품 표시기준
- European Commission CosIng cosmetic ingredient database
- 미국 FDA Cosmetics Labeling Guide
- PubMed의 niacinamide, hyaluronic acid, ceramide, vitamin C, retinoid 관련 임상/리뷰 문헌

특히 국내 화장품 성분표는 원칙적으로 함량이 많은 순서로 표시하되,
**1% 이하 성분은 순서와 관계없이 표시할 수 있으므로**
전성분 위치만으로 정확한 함량을 역산해서는 안 된다.

---

# 39. 한 줄 결론

화력의 핵심 데이터 구조는 다음 한 줄로 정리할 수 있다.

```text
사용자가 성분을 고른다
→ 제품의 실제 전성분을 대표 성분 그룹에 매핑한다
→ 성분별 화력점수를 계산한다
→ 선택한 성분의 화력점수가 높은 제품부터 보여준다
→ 사용자 피부 적합도로 2차 개인화한다
```

이 구조로 만들면 단순 화장품 랭킹 사이트가 아니라

**“내가 원하는 성분 기준으로 화장품을 다시 정렬해 주는 성분 검색 엔진”**

이라는 화력만의 명확한 포지션을 만들 수 있다.
