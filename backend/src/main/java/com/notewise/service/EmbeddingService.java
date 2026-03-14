package com.notewise.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Dual-mode embedding service.
 *
 * If ANTHROPIC_API_KEY is set → uses Voyage-3 dense embeddings via the
 * Anthropic /v1/embeddings endpoint.  Cosine similarity is computed in-process.
 *
 * Otherwise → falls back to a TF-IDF implementation:
 *   1. Tokenise + strip stop-words
 *   2. Compute TF for the document
 *   3. Compute IDF across the supplied corpus
 *   4. L2-normalise the resulting vector
 * Cosine similarity is then just the dot product of two unit vectors.
 */
@Slf4j
@Service
public class EmbeddingService {

    private static final Set<String> STOP_WORDS = Set.of(
        "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
        "from","is","it","its","be","as","are","was","were","been","being","have",
        "has","had","do","does","did","will","would","could","should","may","might",
        "this","that","these","those","i","you","he","she","we","they","my","your",
        "our","their","what","which","who","how","when","where","why","not","no",
        "so","if"
    );

    private final WebClient anthropicClient;
    private final boolean useAnthropic;

    @Value("${app.anthropic.embedding-model:voyage-3}")
    private String embeddingModel;

    public EmbeddingService(@Value("${app.anthropic.api-key:}") String apiKey,
                            WebClient.Builder webClientBuilder) {
        if (apiKey != null && !apiKey.isBlank()) {
            this.anthropicClient = webClientBuilder
                    .baseUrl("https://api.anthropic.com")
                    .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .defaultHeader("x-api-key", apiKey)
                    .defaultHeader("anthropic-version", "2023-06-01")
                    .build();
            this.useAnthropic = true;
            log.info("EmbeddingService: using Anthropic Voyage-3 embeddings");
        } else {
            this.anthropicClient = null;
            this.useAnthropic = false;
            log.info("EmbeddingService: no API key found – using TF-IDF fallback");
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Get an embedding vector for {@code text}, using corpus for IDF weighting
     * when in TF-IDF mode.
     */
    public double[] embed(String text, List<String> corpus) {
        if (useAnthropic) {
            return embedViaApi(text);
        }
        return tfidfVector(text, corpus);
    }

    /**
     * Compute cosine similarity between two vectors.
     * Returns 0 if either vector is null or sizes differ.
     */
    public double cosineSimilarity(double[] a, double[] b) {
        if (a == null || b == null || a.length != b.length) return 0.0;
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.length; i++) {
            dot   += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        double denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom == 0 ? 0.0 : dot / denom;
    }

    // ── Anthropic API ─────────────────────────────────────────────────────────

    private double[] embedViaApi(String text) {
        try {
            Map<String, Object> body = Map.of(
                "model", embeddingModel,
                "input", List.of(text)
            );

            EmbeddingApiResponse response = anthropicClient.post()
                    .uri("/v1/embeddings")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(EmbeddingApiResponse.class)
                    .block();

            if (response == null || response.getEmbeddings() == null
                    || response.getEmbeddings().isEmpty()) {
                log.warn("Empty embedding response from Anthropic; falling back to TF-IDF");
                return tfidfVector(text, List.of());
            }

            List<Double> vec = response.getEmbeddings().get(0).getEmbedding();
            return vec.stream().mapToDouble(Double::doubleValue).toArray();

        } catch (Exception e) {
            log.error("Anthropic embedding call failed: {}; falling back to TF-IDF", e.getMessage());
            return tfidfVector(text, List.of());
        }
    }

    // ── TF-IDF ────────────────────────────────────────────────────────────────

    private double[] tfidfVector(String text, List<String> corpus) {
        List<String> tokens = tokenize(text);

        // Term frequency
        Map<String, Double> tf = new HashMap<>();
        for (String t : tokens) tf.merge(t, 1.0, Double::sum);
        int total = tokens.isEmpty() ? 1 : tokens.size();
        tf.replaceAll((k, v) -> v / total);

        // Build vocab from text + corpus
        Set<String> vocabSet = new LinkedHashSet<>(tf.keySet());
        corpus.forEach(doc -> vocabSet.addAll(tokenize(doc)));
        List<String> vocab = new ArrayList<>(vocabSet);

        // IDF
        int N = corpus.size() + 1;
        Map<String, Double> idf = new HashMap<>();
        for (String term : vocab) {
            long df = corpus.stream()
                    .filter(doc -> tokenize(doc).contains(term))
                    .count() + (tf.containsKey(term) ? 1 : 0);
            idf.put(term, Math.log((double)(N + 1) / (df + 1)) + 1.0);
        }

        // TF-IDF vector
        double[] vec = new double[vocab.size()];
        for (int i = 0; i < vocab.size(); i++) {
            String term = vocab.get(i);
            vec[i] = tf.getOrDefault(term, 0.0) * idf.getOrDefault(term, 1.0);
        }

        return l2Normalize(vec);
    }

    private List<String> tokenize(String text) {
        return Arrays.stream(text.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").split("\\s+"))
                .filter(t -> !t.isBlank() && !STOP_WORDS.contains(t))
                .collect(Collectors.toList());
    }

    private double[] l2Normalize(double[] vec) {
        double norm = Math.sqrt(Arrays.stream(vec).map(v -> v * v).sum());
        if (norm == 0) return vec;
        return Arrays.stream(vec).map(v -> v / norm).toArray();
    }

    // ── Response POJOs ────────────────────────────────────────────────────────

    @Data
    static class EmbeddingApiResponse {
        private List<EmbeddingObject> embeddings;
    }

    @Data
    static class EmbeddingObject {
        private List<Double> embedding;
        private int index;
    }
}
