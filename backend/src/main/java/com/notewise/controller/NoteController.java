package com.notewise.controller;

import com.notewise.dto.NoteDtos.*;
import com.notewise.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ResponseEntity<List<NoteResponse>> getAllNotes(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(noteService.getAllNotes(userId));
    }

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(noteService.createNote(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.ok(noteService.updateNote(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteNote(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        noteService.deleteNote(userId, id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/search")
    public ResponseEntity<List<NoteResponse>> search(
            @AuthenticationPrincipal Long userId,
            @RequestParam String q) {
        if (q == null || q.isBlank()) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(noteService.search(userId, q));
    }
}
