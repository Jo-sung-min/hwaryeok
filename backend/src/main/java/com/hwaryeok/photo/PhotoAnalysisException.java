package com.hwaryeok.photo;

public class PhotoAnalysisException extends RuntimeException {
    final int status;
    final String code;
    PhotoAnalysisException(int status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
