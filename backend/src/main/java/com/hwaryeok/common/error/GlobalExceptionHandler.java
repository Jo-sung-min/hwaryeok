package com.hwaryeok.common.error;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import com.hwaryeok.auth.DuplicateEmailException;
import com.hwaryeok.auth.InvalidCredentialsException;
import com.hwaryeok.auth.InvalidOAuthExchangeCodeException;
import com.hwaryeok.auth.InvalidRefreshTokenException;
import com.hwaryeok.auth.TooManyLoginAttemptsException;
import com.hwaryeok.review.ReviewAlreadyExistsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<ApiError> handleForbidden(ForbiddenOperationException exception, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "FORBIDDEN_OPERATION", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "입력값을 다시 확인해주세요.", request, fieldErrors);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleBadRequest(IllegalArgumentException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestPartException.class
    })
    public ResponseEntity<ApiError> handleMalformedRequest(Exception exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST", "요청 형식을 다시 확인해 주세요.", request, Map.of());
    }

    @ExceptionHandler(ReviewAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleReviewConflict(ReviewAlreadyExistsException exception, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "REVIEW_ALREADY_EXISTS", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleUploadSize(MaxUploadSizeExceededException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "IMAGE_TOO_LARGE", "제품 이미지는 5MB 이하만 등록할 수 있어요.", request, Map.of());
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiError> handleDuplicateEmail(DuplicateEmailException exception, HttpServletRequest request) {
        return build(
                HttpStatus.CONFLICT,
                "DUPLICATE_EMAIL",
                exception.getMessage(),
                request,
                Map.of("email", exception.getMessage())
        );
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(InvalidCredentialsException exception, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<ApiError> handleInvalidRefreshToken(InvalidRefreshTokenException exception, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(InvalidOAuthExchangeCodeException.class)
    public ResponseEntity<ApiError> handleInvalidOAuthCode(InvalidOAuthExchangeCodeException exception, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "INVALID_OAUTH_EXCHANGE_CODE", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(TooManyLoginAttemptsException.class)
    public ResponseEntity<ApiError> handleTooManyLoginAttempts(
            TooManyLoginAttemptsException exception,
            HttpServletRequest request
    ) {
        ApiError error = error(
                HttpStatus.TOO_MANY_REQUESTS,
                "TOO_MANY_LOGIN_ATTEMPTS",
                exception.getMessage(),
                request,
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", Long.toString(exception.getRetryAfterSeconds()))
                .body(error);
    }

    @ExceptionHandler(ErrorResponseException.class)
    public ResponseEntity<ApiError> handleFrameworkError(ErrorResponseException exception, HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
        String message = status.is4xxClientError()
                ? "요청 경로와 방식을 다시 확인해 주세요."
                : "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
        return build(status, "REQUEST_REJECTED", message, request, Map.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled API exception for {} {}", request.getMethod(), request.getRequestURI(), exception);
        return build(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
                request,
                Map.of()
        );
    }

    private ResponseEntity<ApiError> build(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors
    ) {
        return ResponseEntity.status(status).body(error(status, code, message, request, fieldErrors));
    }

    private ApiError error(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors
    ) {
        return new ApiError(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                code,
                message,
                request.getRequestURI(),
                fieldErrors
        );
    }
}
