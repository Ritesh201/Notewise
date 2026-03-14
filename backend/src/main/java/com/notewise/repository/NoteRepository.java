package com.notewise.repository;

import com.notewise.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<Note> findByIdAndUserId(Long id, Long userId);

    void deleteByIdAndUserId(Long id, Long userId);

    // Fetch only notes belonging to this user that have an embedding stored
    @Query("SELECT n FROM Note n WHERE n.user.id = :userId AND n.embedding IS NOT NULL")
    List<Note> findByUserIdWithEmbedding(@Param("userId") Long userId);
}
