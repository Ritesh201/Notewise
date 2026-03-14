package com.notewise.service;

import com.notewise.dto.NoteDtos.*;
import com.notewise.entity.Note;
import com.notewise.entity.User;
import com.notewise.repository.NoteRepository;
import com.notewise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.Objects;
@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final EmbeddingService embeddingService;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private NoteResponse toResponse(Note note) {
        return new NoteResponse(
                note.getId(), note.getTitle(), note.getContent(),
                note.getCreatedAt(), note.getUpdatedAt());
    }

    private List<String> buildCorpus(Long userId, Long excludeId) {
        return noteRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .filter(n -> !n.getId().equals(excludeId))
                .map(n -> n.getTitle() + " " + n.getContent())
                .collect(Collectors.toList());
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    public List<NoteResponse> getAllNotes(Long userId) {
        return noteRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public NoteResponse createNote(Long userId, NoteRequest request) {
        User user = getUser(userId);
        List<String> corpus = buildCorpus(userId, -1L);

        double[] embedding = embeddingService.embed(
                request.getTitle() + " " + request.getContent(), corpus);

        Note note = Note.builder()
                .user(user)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .embedding(embedding)
                .build();

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse updateNote(Long userId, Long noteId, NoteRequest request) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Note not found"));

        List<String> corpus = buildCorpus(userId, noteId);
        double[] embedding = embeddingService.embed(
                request.getTitle() + " " + request.getContent(), corpus);

        note.setTitle(request.getTitle().trim());
        note.setContent(request.getContent().trim());
        note.setEmbedding(embedding);

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public void deleteNote(Long userId, Long noteId) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Note not found"));
        noteRepository.delete(note);
    }

    // ── Semantic search ───────────────────────────────────────────────────────

    public List<NoteResponse> search(Long userId, String query) {
        List<Note> notes = noteRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        if (notes.isEmpty()) return List.of();

        String queryLower = query.toLowerCase().trim();
        List<String> queryTokens = Arrays.stream(queryLower.split("\\s+"))
                .filter(t -> !t.isBlank())
                .collect(Collectors.toList());

        List<String> corpus = notes.stream()
                .map(n -> n.getTitle() + " " + n.getContent())
                .collect(Collectors.toList());

        double[] queryVec = embeddingService.embed(query, corpus);

        return notes.stream()
                .map(note -> {
                    String noteText = (note.getTitle() + " " + note.getContent()).toLowerCase();

                    // Keyword score: fraction of query tokens found in note text
                    long matchCount = queryTokens.stream()
                            .filter(noteText::contains)
                            .count();
                    double keywordScore = (double) matchCount / queryTokens.size();

                    // Only consider notes that contain at least one query word
                    if (keywordScore == 0) return null;

                    // TF-IDF similarity
                    double[] noteVec = embeddingService.embed(
                            note.getTitle() + " " + note.getContent(), corpus);
                    double tfidfScore = embeddingService.cosineSimilarity(queryVec, noteVec);

                    // Hybrid score: 70% keyword match + 30% TF-IDF
                    double finalScore = (0.7 * keywordScore) + (0.3 * tfidfScore);

                    NoteResponse resp = toResponse(note);
                    resp.setScore(finalScore);
                    return resp;
                })
                .filter(Objects::nonNull)
                .filter(r -> r.getScore() != null && r.getScore() > 0.0)
                .sorted(Comparator.comparingDouble(NoteResponse::getScore).reversed())
                .collect(Collectors.toList());
    }
}
