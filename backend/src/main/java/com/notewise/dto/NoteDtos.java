package com.notewise.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.OffsetDateTime;

public class NoteDtos {

    @Data
    public static class NoteRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Content is required")
        private String content;
    }

    @Data
    public static class NoteResponse {
        private Long id;
        private String title;
        private String content;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
        private Double score; // populated only in search results

        public NoteResponse(Long id, String title, String content,
                            OffsetDateTime createdAt, OffsetDateTime updatedAt) {
            this.id = id;
            this.title = title;
            this.content = content;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
    }
}
