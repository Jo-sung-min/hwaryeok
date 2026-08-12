package com.hwaryeok.product;

import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductSeedConfig {

    @Bean
    ApplicationRunner seedProducts(ProductRepository repository) {
        return args -> {
            if (repository.count() > 0) return;
            repository.saveAll(List.of(
                    new Product("birch-cream", "라운드랩", "자작나무 수분 크림", "크림", 94, "수분 장벽 강화", "속건조 보습", 32000, "blue", "민감 피부 1위"),
                    new Product("heartleaf-toner", "아누아", "어성초 77 진정 토너", "토너", 91, "붉은기 진정", "유수분 균형", 25000, "sage", "요즘 많이 봐요"),
                    new Product("ceramide-serum", "아뜰리에 온", "세라마이드 결 세럼", "세럼", 90, "장벽 케어", "결 정돈", 38000, "peach", "신규 등록"),
                    new Product("rice-sunscreen", "조선미녀", "맑은 쌀 선크림", "선케어", 86, "순한 자외선 차단", "촉촉한 보습", 18000, "sand", null),
                    new Product("mugwort-ampoule", "아임프롬", "강화 약쑥 앰플", "앰플", 84, "열감 진정", "민감 케어", 39000, "rose", null),
                    new Product("bean-essence", "믹순", "콩 에센스", "에센스", 82, "피부결 개선", "보습", 35000, "sand", null)
            ));
        };
    }
}
