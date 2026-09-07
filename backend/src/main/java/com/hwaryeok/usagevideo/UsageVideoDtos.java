package com.hwaryeok.usagevideo;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class UsageVideoDtos {

    private UsageVideoDtos() {}

    public record SubmissionRequest(
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 2048) String videoUrl,
            @NotBlank @Size(max = 100) String channelName,
            @NotBlank @Size(max = 2048) String channelUrl,
            @Size(max = 2000) String description
    ) {}

    public record ModerationRequest(
            @NotBlank String status,
            @NotNull Boolean featured,
            @NotNull @Min(0) @Max(100000) Integer displayOrder,
            @Size(max = 1000) String moderationNote
    ) {}

    public record VideoResponse(
            String id,
            String productId,
            String productName,
            String productBrand,
            String authorId,
            String authorNickname,
            String title,
            String description,
            String videoUrl,
            String videoId,
            String channelName,
            String channelUrl,
            String status,
            boolean featured,
            int displayOrder,
            String moderationNote,
            Instant createdAt,
            Instant updatedAt,
            Instant reviewedAt
    ) {}

    public record VideoPageResponse(
            List<VideoResponse> content,
            int page,
            int size,
            long totalElements,
            long totalPages,
            boolean hasNext
    ) {}
}
