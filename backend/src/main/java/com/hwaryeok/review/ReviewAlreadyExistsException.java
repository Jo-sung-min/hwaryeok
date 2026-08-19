package com.hwaryeok.review;

public class ReviewAlreadyExistsException extends RuntimeException {
    public ReviewAlreadyExistsException() {
        super("한 제품에는 한 번만 리뷰를 남길 수 있어요.");
    }
}
